import { fetch_quote, get_current_rate, search_tokens } from "@/lib/jup";
import { sol, usdc } from "@/lib/rpc";

export async function GET() {
  const data = await get_current_rate(sol, usdc);
  // const data = await search_tokens("JUP");
  // const data = await fetch_quote(sol, usdc, 200_000_000);
  console.log(data);
  return new Response("Hello, world!");
}
