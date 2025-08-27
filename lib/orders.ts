import { PublicKey } from "@solana/web3.js";
import { Order, parseOrderFromBuffer } from "@/lib/utils";
import { rpc } from "@/lib/rpc";
import { PROGRAM_ID } from "@/app/program";

export async function getOpenOrders(address: PublicKey): Promise<Order[]> {
  const data = await rpc.getCompressedAccountsByOwner(PROGRAM_ID, {
    filters: [
      {
        memcmp: {
          offset: 0,
          encoding: "base58",
          bytes: address.toBase58(),
        },
      },
    ],
  });

  const orders: Order[] = [];

  data.items.forEach((item) => {
    const buffer = item.data?.data;
    const order = parseOrderFromBuffer(buffer!);
    orders.push(order);
  });

  return orders;
}

/*
  const { connection } = useConnection();

  const wallet = useAnchorWallet();
  if (!wallet) return null;

  const provider = new AnchorProvider(connection, wallet, {});
  const program = new Program<Elara>(IDL as Elara, provider);
*/
