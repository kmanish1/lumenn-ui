import { Connection, Keypair } from "@solana/web3.js";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Elara } from "../type";
import IDL from "../idl.json";

const url =
  "https://devnet.helius-rpc.com/?api-key=c991f045-ba1f-4d71-b872-0ef87e7f039d";

const connection = new Connection(url, "confirmed");

const dummy_wallet = Keypair.fromSeed(new Uint8Array(32));
const wallet = new NodeWallet(dummy_wallet);

const provider = new AnchorProvider(connection, wallet, {});

export const anchor_idl = new Program<Elara>(IDL as Elara, provider);
