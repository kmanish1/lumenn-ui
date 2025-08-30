import { getOpenOrders } from "@/lib/orders";
import { PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";

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

    const maker = new PublicKey(maker_address);

    const orders = await getOpenOrders(maker);

    const decoded = orders.map((order) => {
      return {
        maker: order.maker.toString(),
        uniqueId: order.uniqueId.toString(),
        tokens: {
          inputMint: order.tokens.inputMint.toString(),
          outputMint: order.tokens.outputMint.toString(),
          inputTokenProgram: order.tokens.inputTokenProgram.toString(),
          outputTokenProgram: order.tokens.outputTokenProgram.toString(),
        },
        amount: {
          oriMakingAmount: order.amount.oriMakingAmount.toNumber(),
          oriTakingAmount: order.amount.oriTakingAmount.toNumber(),
          makingAmount: order.amount.makingAmount.toNumber(),
          takingAmount: order.amount.takingAmount.toNumber(),
        },
        expiresAt: order.expiredAt.toNumber(),
        createdAt: order.createdAt.toNumber(),
        updatedAt: order.updatedAt.toNumber(),
      };
    });

    return NextResponse.json({ orders: decoded });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
