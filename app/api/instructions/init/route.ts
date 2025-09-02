import { NextResponse } from "next/server";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  bn,
  deriveAddress,
  deriveAddressSeed,
} from "@lightprotocol/stateless.js";
import {
  ADDRESS_QUEUE,
  ADDRESS_TREE,
  INIT_REMAINING_ACCOUNTS,
  PROGRAM_ID,
} from "@/lib/address";
import { rpc } from "@/lib/rpc";
import BN from "bn.js";
import { derive_escrow_address, randomU64 } from "@/lib/utils";
import { anchor_idl } from "@/lib/idl";
import { tokenMap } from "../../tokens/route";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const maker = parsePubkey(searchParams.get("maker"), "maker");
    const inputMint = parsePubkey(searchParams.get("input_mint"), "input_mint");
    const outputMint = parsePubkey(
      searchParams.get("output_mint"),
      "output_mint",
    );

    const inputAmount = parseAmount(
      searchParams.get("input_amount"),
      "input_amount",
    );
    const outputAmount = parseAmount(
      searchParams.get("output_amount"),
      "output_amount",
    );

    const expiredAt = Number(searchParams.get("expired_at"));

    if (!maker || !inputMint || !outputMint) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 },
      );
    }

    const inputToken = tokenMap.get(inputMint.toString())!;
    const outputToken = tokenMap.get(outputMint.toString())!;

    const unique_id = new BN(randomU64());

    const seeds: Uint8Array[] = [
      Buffer.from("escrow"),
      unique_id.toArrayLike(Buffer, "le", 8),
      maker.toBuffer(),
    ];

    const assetSeed = deriveAddressSeed(seeds, PROGRAM_ID);
    const address = deriveAddress(assetSeed, ADDRESS_TREE);

    const proof = await rpc.getValidityProofV0(undefined, [
      {
        address: bn(address.toBytes()),
        tree: ADDRESS_TREE,
        queue: ADDRESS_QUEUE,
      },
    ]);

    const validityProof = proof.compressedProof;

    if (!validityProof) {
      return NextResponse.json({ error: "No validity proof" }, { status: 400 });
    }

    const protocol_vault = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol_vault")],
      PROGRAM_ID,
    );

    // const input_mint = new PublicKey(
    //   "J7LM6p22Ef8VhREZzkLToSADrXhAiiQUn3P2BAwo1RSe",
    // );
    // NOTE: change this in mainnet
    // const input_mint = new PublicKey(inputToken.id);
    const protocol_vault_ata = await getAssociatedTokenAddress(
      inputMint,
      protocol_vault[0],
      true,
    );

    const maker_input_ata = await getAssociatedTokenAddress(inputMint, maker);
    console.log(new BN(inputAmount));

    const instruction = await anchor_idl.methods
      .initializeOrder(
        {
          uniqueId: unique_id,
          makingAmount: new BN(inputAmount),
          takingAmount: new BN(outputAmount),
          expiredAt: expiredAt === 0 ? null : new BN(expiredAt),
          slippageBps: 50,
        },
        {
          proof: {
            0: {
              a: validityProof.a,
              b: validityProof.b,
              c: validityProof.c,
            },
          },
          addressTreeInfo: {
            addressMerkleTreePubkeyIndex: 0,
            addressQueuePubkeyIndex: 2,
            rootIndex: proof.rootIndices[0],
          },
          outputStateTreeIndex: 1,
        },
      )
      .accountsPartial({
        payer: maker,
        maker: maker,
        makerInputMintAta: maker_input_ata,
        inputMint: inputMint,
        protocolVaultInputMintAta: protocol_vault_ata,
        // TODO: change this is mainnet. here because mainnnet tokens are not tokens in devnet
        outputMint: new PublicKey(
          "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
        ),
        inputTokenProgram: new PublicKey(inputToken.tokenProgram),
        outputTokenProgram: new PublicKey(outputToken.tokenProgram),
      })
      .remainingAccounts(INIT_REMAINING_ACCOUNTS)
      .instruction();

    const instructions = [];

    if (inputToken.symbol === "SOL") {
      const sol_mint = new PublicKey(inputToken.id);
      const ata = await getAssociatedTokenAddress(sol_mint, maker);
      instructions.push(
        createAssociatedTokenAccountIdempotentInstruction(
          maker,
          ata,
          maker,
          sol_mint,
        ),
      );

      instructions.push(
        SystemProgram.transfer({
          fromPubkey: maker,
          toPubkey: ata,
          lamports: inputAmount,
        }),
      );

      instructions.push(createSyncNativeInstruction(ata));

      instructions.push(instruction);

      instructions.push(createCloseAccountInstruction(ata, maker, maker));
    } else {
      instructions.push(instruction);
    }

    const latestBlockhash = await rpc.getLatestBlockhash();
    const message = new TransactionMessage({
      payerKey: maker,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
        ...instructions,
      ],
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);
    const serialized = Buffer.from(tx.serialize()).toString("base64");

    const order = derive_escrow_address(maker, unique_id);

    return NextResponse.json({
      tx: serialized,
      unique_id: unique_id.toString(),
      order,
    });
  } catch (err) {
    console.error("Error in GET /api/instructions/init:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

function parsePubkey(param: string | null, name: string): PublicKey | null {
  if (!param) throw new Error(`Missing ${name} param`);
  try {
    return new PublicKey(param);
  } catch {
    throw new Error(`${name} is not a valid public key`);
  }
}

function parseAmount(param: string | null, name: string): number {
  if (!param) throw new Error(`Missing ${name} param`);
  const val = Number(param);
  if (isNaN(val) || val <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return val;
}
