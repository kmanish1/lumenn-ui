import { createRpc } from "@lightprotocol/stateless.js";
import { Connection } from "@solana/web3.js";

export const url =
  "https://devnet.helius-rpc.com/?api-key=c991f045-ba1f-4d71-b872-0ef87e7f039d";

export const connection = new Connection(url);

export const rpc = createRpc(url, url, url);
