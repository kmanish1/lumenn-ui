import { clsx, type ClassValue } from "clsx";
import Decimal from "decimal.js";

import { ADDRESS_TREE, PROGRAM_ID } from "@/lib/address";
import { deriveAddress, deriveAddressSeed } from "@lightprotocol/stateless.js";
import { twMerge } from "tailwind-merge";
import BN from "bn.js";
import { Buffer } from "buffer";
import { PublicKey } from "@solana/web3.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Order = {
  maker: PublicKey;
  uniqueId: BN;
  address: PublicKey;
  tokens: {
    inputMint: PublicKey;
    outputMint: PublicKey;
    inputTokenProgram: PublicKey;
    outputTokenProgram: PublicKey;
  };
  amount: {
    oriMakingAmount: BN;
    oriTakingAmount: BN;
    makingAmount: BN;
    takingAmount: BN;
  };
  expiredAt: BN;
  createdAt: BN;
  updatedAt: BN;
  slippageBps: number;
  feeBps: number;
};

export function parseOrderFromBuffer(buffer: Buffer): Order {
  if (buffer.byteLength < 226) {
    throw new Error("Buffer is too short to contain a valid Escrow structure.");
  }

  const maker_bytes = buffer.subarray(0, 32);
  const unique_id = buffer.readBigUInt64LE(32);
  const input_mint_bytes = buffer.subarray(40, 72);
  const output_mint = buffer.subarray(72, 104);
  const input_token_program = buffer.subarray(104, 136);
  const output_token_program = buffer.subarray(136, 168);

  const ori_making_amount = buffer.readBigUInt64LE(168);
  const ori_taking_amount = buffer.readBigUInt64LE(176);
  const making_amount = buffer.readBigUInt64LE(184);
  const taking_amount = buffer.readBigUInt64LE(192);

  const expired_at = buffer.readBigInt64LE(200);
  const created_at = buffer.readBigInt64LE(208);
  const updated_at = buffer.readBigInt64LE(216);

  const slippage_bps = buffer.readUInt16LE(224);
  const fee_bps = buffer.readUInt16LE(226);

  const address = derive_escrow_address(
    new PublicKey(maker_bytes),
    new BN(unique_id),
  );

  return {
    maker: new PublicKey(maker_bytes),
    uniqueId: new BN(unique_id.toString()),
    address,
    tokens: {
      inputMint: new PublicKey(input_mint_bytes),
      outputMint: new PublicKey(output_mint),
      inputTokenProgram: new PublicKey(input_token_program),
      outputTokenProgram: new PublicKey(output_token_program),
    },
    amount: {
      oriMakingAmount: new BN(ori_making_amount.toString()),
      oriTakingAmount: new BN(ori_taking_amount.toString()),
      makingAmount: new BN(making_amount.toString()),
      takingAmount: new BN(taking_amount.toString()),
    },
    slippageBps: Number(slippage_bps),
    feeBps: Number(fee_bps),
    expiredAt: new BN(expired_at.toString()),
    createdAt: new BN(created_at.toString()),
    updatedAt: new BN(updated_at.toString()),
  };
}

// Generate two 32-bit random numbers and combine them
export function randomU64(): bigint {
  const high = BigInt(Math.floor(Math.random() * 0x100000000)); // upper 32 bits
  const low = BigInt(Math.floor(Math.random() * 0x100000000)); // lower 32 bits
  return (high << 32n) | low;
}

export function derive_escrow_address(maker: PublicKey, id: BN): PublicKey {
  const seeds: Uint8Array[] = [
    Buffer.from("escrow"),
    new BN(id).toArrayLike(Buffer, "le", 8),
    maker.toBuffer(),
  ];

  const assetSeed = deriveAddressSeed(seeds, PROGRAM_ID);
  const address = deriveAddress(assetSeed, ADDRESS_TREE);
  return address;
}

export const toHumanReadable = (rawAmount: BN, decimals: number): number => {
  if (!rawAmount || decimals < 0) return 0;
  const divisor = new Decimal(10).pow(decimals);
  return new Decimal(rawAmount.toString()).div(divisor).toNumber();
};

export const toRawAmount = (humanAmount: number, decimals: number): BN => {
  if (humanAmount <= 0 || decimals < 0) return new BN(0);
  const amount = new Decimal(humanAmount).mul(new Decimal(10).pow(decimals));
  return new BN(amount.toFixed(0)); // Ensure integer for BN
};
