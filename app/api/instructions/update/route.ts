import { bn } from "@lightprotocol/stateless.js";
import { rpc } from "@/lib/rpc";
import { ADDRESS_QUEUE, ADDRESS_TREE, CLOSE_ACCOUNTS } from "@/lib/address";
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import BN from "bn.js";
import { NextResponse } from "next/server";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { parseOrderFromBuffer } from "@/lib/utils";
import { anchor_idl } from "@/lib/idl";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const maker_address = searchParams.get("maker");
    const order_address = searchParams.get("order");

    const making_amount = parseAmount(
      searchParams.get("making_amount"),
      "making_amount",
    );

    const taking_amount = parseAmount(
      searchParams.get("taking_amount"),
      "taking_amount",
    );

    const expiredAt = Number(searchParams.get("expired_at"));

    if (!maker_address) {
      return NextResponse.json(
        { error: "Missing maker address param" },
        { status: 400 },
      );
    }

    try {
      new PublicKey(maker_address);
    } catch (err) {
      console.error(err);
      return NextResponse.json(
        { error: "maker is not a valid public key" },
        { status: 400 },
      );
    }

    if (!order_address) {
      return NextResponse.json(
        { error: "Missing order address param" },
        { status: 400 },
      );
    }

    try {
      new PublicKey(order_address);
    } catch (err) {
      console.error(err);
      return NextResponse.json(
        { error: "maker is not a valid public key" },
        { status: 400 },
      );
    }

    const maker = new PublicKey(maker_address);
    const order = new PublicKey(order_address);

    const compressed_account = await rpc.getCompressedAccount(
      bn(order.toBytes()),
    );

    if (!compressed_account) {
      return NextResponse.json({
        error: "Escrow account not found",
      });
    }

    const hash = compressed_account!.hash;

    const proof = await rpc.getValidityProofV0(
      [{ hash, tree: ADDRESS_TREE, queue: ADDRESS_QUEUE }],
      [],
    );
    const validityProof = proof.compressedProof;

    if (!validityProof) {
      return NextResponse.json({ error: "No validity proof" }, { status: 500 });
    }

    const buffer = compressed_account?.data?.data;
    const escrow_data = parseOrderFromBuffer(buffer!);

    const instruction = await anchor_idl.methods
      .updateOrder({
        escrowAccount: {
          uniqueId: escrow_data.uniqueId,
          amount: {
            makingAmount: escrow_data.amount.makingAmount,
            takingAmount: escrow_data.amount.takingAmount,
            oriMakingAmount: escrow_data.amount.oriMakingAmount,
            oriTakingAmount: escrow_data.amount.oriTakingAmount,
          },
          expiredAt: escrow_data.expiredAt,
          feeBps: escrow_data.feeBps,
          createdAt: escrow_data.createdAt,
          updatedAt: escrow_data.updatedAt,
        },
        proof: {
          0: {
            a: validityProof.a,
            b: validityProof.b,
            c: validityProof.c,
          },
        },
        treeInfo: {
          rootIndex: proof.rootIndices[0],
          merkleTreePubkeyIndex: 0,
          queuePubkeyIndex: 1,
          proveByIndex: false,
          leafIndex: compressed_account.leafIndex,
        },
        outputStateTreeIndex: 0,
        makingAmount: making_amount ? new BN(making_amount) : null,
        takingAmount: taking_amount ? new BN(taking_amount) : null,
        expiredAt: expiredAt ? new BN(expiredAt) : null,
      })
      .accounts({
        payer: maker,
        maker: maker,
        inputMint: escrow_data.tokens.inputMint,
        outputMint: escrow_data.tokens.outputMint,
        inputTokenProgram: escrow_data.tokens.inputTokenProgram,
        outputTokenProgram: escrow_data.tokens.outputTokenProgram,
      })
      .remainingAccounts(CLOSE_ACCOUNTS)
      .instruction();

    const latestBlockhash = await rpc.getLatestBlockhash();

    const instructions = [];
    const sol_mint = new PublicKey(
      "So11111111111111111111111111111111111111112",
    );

    const diff = making_amount - escrow_data.amount.makingAmount.toNumber();
    if (escrow_data.tokens.inputMint.equals(sol_mint)) {
      const ata = await getAssociatedTokenAddress(sol_mint, maker);

      instructions.push(
        createAssociatedTokenAccountIdempotentInstruction(
          maker,
          ata,
          maker,
          sol_mint,
        ),
      );

      if (diff > 0) {
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: maker,
            toPubkey: ata,
            lamports: diff,
          }),
        );

        instructions.push(createSyncNativeInstruction(ata));
      }

      instructions.push(instruction);

      instructions.push(createCloseAccountInstruction(ata, maker, maker));
    } else {
      instructions.push(instruction);
    }

    const message = new TransactionMessage({
      payerKey: maker,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
        ...instructions,
      ],
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);
    const serialized = Buffer.from(tx.serialize()).toString("base64");

    return NextResponse.json({ tx: serialized });
  } catch (err) {
    console.error("Error in GET /api/instructions/cancel:", err);
    return NextResponse.json(err, { status: 500 });
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
