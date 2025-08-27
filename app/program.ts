import { Elara } from "../type";
import IDL from "../idl.json";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Order, parseOrderFromBuffer } from "@/lib/utils";
import { rpc } from "@/lib/rpc";

export const useProgram = () => {
  const { connection } = useConnection();

  const wallet = useAnchorWallet();
  if (!wallet) return null;

  const provider = new AnchorProvider(connection, wallet, {});
  const program = new Program<Elara>(IDL as Elara, provider);

  return program;
};

export const PROGRAM_ID = new PublicKey(
  "4LhEEtzAhM6wEXJR2YQHPEs79UEx8e6HncmeHbqbW1w1",
);

export const ADDRESS_TREE = new PublicKey(
  "amt1Ayt45jfbdw5YSo7iz6WZxUmnZsQTYXy82hVwyC2",
);

export async function getOpenOrders(address: PublicKey): Promise<Order[]> {
  const data = await rpc.getCompressedAccountsByOwner(
    new PublicKey("4LhEEtzAhM6wEXJR2YQHPEs79UEx8e6HncmeHbqbW1w1"),
    {
      filters: [
        {
          memcmp: {
            offset: 0,
            encoding: "base58",
            bytes: address.toBase58(),
          },
        },
      ],
    },
  );

  const orders: Order[] = [];

  data.items.forEach((item) => {
    const buffer = item.data?.data;
    const order = parseOrderFromBuffer(buffer!);
    orders.push(order);
  });

  return orders;
}
