import { NextResponse } from "next/server";
import tokensData from "../../../tokens.json";

interface Token {
  id: string;
  name: string;
  symbol: string;
  icon?: string;
  decimals: number;
  tokenProgram: string;
}

const tokens: Token[] = tokensData;

export const tokenMap: Map<string, Token> = new Map(
  tokens.map((t) => [t.id, t]),
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.getAll("id");

    if (ids.length === 0) {
      return NextResponse.json({ error: "Missing id param" }, { status: 400 });
    }

    const results: (Token | null)[] = ids.map((id) => tokenMap.get(id) || null);

    return NextResponse.json(results, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/tokens:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
