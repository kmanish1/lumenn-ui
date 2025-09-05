import { PROGRAM_ID } from "@/lib/address";
import { PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { rpc } from "@/lib/rpc";

export type History = {
  type: "init" | "fill" | "partial fill" | "cancel" | "expire" | "update";
  signature: string;
  input_mint: string;
  output_mint: string;
  making_amount: string;
  taking_amount: string;
  timestamp: number;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const maker_address = searchParams.get("maker");
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

    const res = await fetch(
      `https://api-devnet.helius.xyz/v0/addresses/${maker_address}/transactions?api-key=c991f045-ba1f-4d71-b872-0ef87e7f039d&limit=10`,
    );

    const data = await res.json();
    const signatures: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const tx = data[i];
      const ixs = tx.instructions;

      ixs.forEach((ix: { programId?: string }) => {
        if (ix.programId === PROGRAM_ID.toString()) {
          signatures.push(tx.signature);
        }
      });
    }

    if (signatures.length === 0) {
      return NextResponse.json({ events: [] });
    }

    const events: History[] = [];

    for (let i = 0; i < signatures.length; i++) {
      const tx = await rpc.getTransaction(signatures[i], {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });

      if (!tx) {
        return NextResponse.json(
          { error: "Transaction not found" },
          { status: 404 },
        );
      }

      const timestamp = tx.blockTime ? tx.blockTime * 1000 : Date.now();

      for (const log of tx.meta?.logMessages ?? []) {
        if (!log.startsWith("Program data: ")) continue;
        const data = log.replace("Program data: ", "");

        const init = decodeOrderInitialized(data);
        if (init) {
          events.push({
            type: "init",
            signature: signatures[i],
            input_mint: init.input_mint.toBase58(),
            output_mint: init.output_mint.toBase58(),
            making_amount: init.making_amount.toString(),
            taking_amount: init.taking_amount.toString(),
            timestamp,
          });
          continue;
        }

        const cancel = decodeOrderCancelled(data);
        if (cancel) {
          events.push({
            type: cancel.is_expired ? "expire" : "cancel",
            signature: signatures[i],
            input_mint: cancel.input_mint.toBase58(),
            output_mint: cancel.output_mint.toBase58(),
            making_amount: cancel.making_amount.toString(),
            taking_amount: cancel.taking_amount.toString(),
            timestamp,
          });
          continue;
        }

        const fill = decodeFillEvent(data);
        if (fill) {
          events.push({
            type: fill.fill_type === "Full" ? "fill" : "partial fill",
            signature: signatures[i],
            input_mint: fill.input_mint.toBase58(),
            output_mint: fill.output_mint.toBase58(),
            making_amount: fill.in_amount.toString(),
            taking_amount: fill.out_amount.toString(),
            timestamp,
          });
          continue;
        }

        const update = decodeUpdateOrder(data);
        if (update) {
          events.push({
            type: "update",
            signature: signatures[i],
            input_mint: update.input_mint.toBase58(),
            output_mint: update.output_mint.toBase58(),
            making_amount: update.making_amount.toString(),
            taking_amount: update.taking_amount.toString(),
            timestamp,
          });
          continue;
        }
      }
    }

    return NextResponse.json({ history: events });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// --------------------
// Discriminators
// --------------------
const ORDER_INITIALIZED_DISCRIMINATOR = Buffer.from([
  180, 118, 44, 249, 166, 25, 40, 81,
]);
const ORDER_CANCELLED_DISCRIMINATOR = Buffer.from([
  108, 56, 128, 68, 168, 113, 168, 239,
]);
const UPDATE_ORDER_DISCRIMINATOR = Buffer.from([
  74, 87, 9, 53, 182, 80, 78, 75,
]);
const FILL_EVENT_DISCRIMINATOR = Buffer.from([
  13, 89, 41, 228, 105, 178, 45, 112,
]);

// --------------------
// Decoders
// --------------------
function decodeOrderInitialized(base64Data: string) {
  const buf = Buffer.from(base64Data, "base64");
  if (!buf.subarray(0, 8).equals(ORDER_INITIALIZED_DISCRIMINATOR)) return null;

  let offset = 8;
  const escrow_address = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const maker = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const unique_id = buf.readBigUInt64LE(offset);
  offset += 8;
  const input_mint = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const output_mint = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const input_mint_decimals = buf.readUInt8(offset);
  offset += 1;
  const output_mint_decimals = buf.readUInt8(offset);
  offset += 1;
  const making_amount = buf.readBigUInt64LE(offset);
  offset += 8;
  const taking_amount = buf.readBigUInt64LE(offset);
  offset += 8;
  const expired_at = buf.readBigInt64LE(offset);

  return {
    escrow_address,
    maker,
    unique_id,
    input_mint,
    output_mint,
    input_mint_decimals,
    output_mint_decimals,
    making_amount,
    taking_amount,
    expired_at,
  };
}

function decodeOrderCancelled(base64Data: string) {
  const buf = Buffer.from(base64Data, "base64");
  if (!buf.subarray(0, 8).equals(ORDER_CANCELLED_DISCRIMINATOR)) return null;

  let offset = 8;
  const escrow_address = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const maker = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const unique_id = buf.readBigUInt64LE(offset);
  offset += 8;
  const input_mint = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const output_mint = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const making_amount = buf.readBigUInt64LE(offset);
  offset += 8;
  const taking_amount = buf.readBigUInt64LE(offset);
  offset += 8;
  const is_expired = buf.readUInt8(offset) === 1;
  offset += 1;
  const cancelled_by = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const timestamp = buf.readBigInt64LE(offset);

  return {
    escrow_address,
    maker,
    unique_id,
    input_mint,
    output_mint,
    making_amount,
    taking_amount,
    is_expired,
    cancelled_by,
    timestamp,
  };
}

function decodeUpdateOrder(base64Data: string) {
  const buf = Buffer.from(base64Data, "base64");
  if (!buf.subarray(0, 8).equals(UPDATE_ORDER_DISCRIMINATOR)) return null;

  let offset = 8;
  const escrow_address = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const maker = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const unique_id = buf.readBigUInt64LE(offset);
  offset += 8;
  const input_mint = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const output_mint = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const input_mint_decimals = buf.readUInt8(offset);
  offset += 1;
  const output_mint_decimals = buf.readUInt8(offset);
  offset += 1;
  const making_amount = buf.readBigUInt64LE(offset);
  offset += 8;
  const taking_amount = buf.readBigUInt64LE(offset);
  offset += 8;
  const expired_at = buf.readBigInt64LE(offset);

  return {
    escrow_address,
    maker,
    unique_id,
    input_mint,
    output_mint,
    input_mint_decimals,
    output_mint_decimals,
    making_amount,
    taking_amount,
    expired_at,
  };
}

function decodeFillEvent(base64Data: string) {
  const buf = Buffer.from(base64Data, "base64");
  if (!buf.subarray(0, 8).equals(FILL_EVENT_DISCRIMINATOR)) return null;

  let offset = 8;
  const escrow_address = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const maker = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const input_mint = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const output_mint = new PublicKey(buf.subarray(offset, offset + 32));
  offset += 32;
  const unique_id = buf.readBigUInt64LE(offset);
  offset += 8;
  const in_amount = buf.readBigUInt64LE(offset);
  offset += 8;
  const out_amount = buf.readBigUInt64LE(offset);
  offset += 8;
  const fee_bps = buf.readUInt16LE(offset);
  offset += 2;
  const fill_type = buf.readUInt8(offset) === 0 ? "Full" : "Partial";

  return {
    escrow_address,
    maker,
    input_mint,
    output_mint,
    unique_id,
    in_amount,
    out_amount,
    fee_bps,
    fill_type,
  };
}
