import { createRpc } from "@lightprotocol/stateless.js";
import { Connection } from "@solana/web3.js";

export const url =
  "https://devnet.helius-rpc.com/?api-key=c991f045-ba1f-4d71-b872-0ef87e7f039d";

export const connection = new Connection(url);

export const rpc = createRpc(url, url, url);

export const sol = {
  icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  id: "So11111111111111111111111111111111111111112",
  name: "Solana",
  symbol: "SOL",
  decimals: 9,
  tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
};

export const usdc = {
  icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  id: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  name: "USDC",
  symbol: "USDC",
  decimals: 6,
  tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
};

export const zBTC = {
  icon: "https://raw.githubusercontent.com/ZeusNetworkHQ/zbtc-metadata/refs/heads/main/lgoo-v2.png",
  id: "zBTCug3er3tLyffELcvDNrKkCymbPWysGcWihESYfLg",
  name: "zBTC",
  symbol: "zBTC",
  decimals: 9,
  tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
};

export const jup = {
  icon: "https://static.jup.ag/jup/icon.png",
  id: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  name: "Jupiter",
  symbol: "JUP",
  decimals: 6,
  tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
};
