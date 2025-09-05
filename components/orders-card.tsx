"use client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { Order } from "@/lib/utils";
import BN from "bn.js";
import { connection, rpc } from "@/lib/rpc";
import UpdateCard from "./update-card";
import { useOrdersStore } from "@/store/useOrderStore";
import { useWallet } from "@solana/wallet-adapter-react";

export interface Token {
  id: string; // mint address
  name: string;
  symbol: string;
  icon?: string;
  decimals: number;
  tokenProgram: string;
}

export default function OrdersCard() {
  const { orders, removeOrder } = useOrdersStore();
  const { sendTransaction } = useWallet();

  const [tokens, setTokens] = useState<Record<string, Token>>({});

  const pageSize = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(orders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;

  const currentOrders = orders.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    const uniqueMints = Array.from(
      new Set(
        orders.flatMap((o) => [
          o.tokens.inputMint.toString(),
          o.tokens.outputMint.toString(),
        ]),
      ),
    );

    if (uniqueMints.length === 0) return;

    const queryParams = uniqueMints.map((id) => `id=${id}`).join("&");

    (async () => {
      try {
        const res = await fetch(`/api/tokens?${queryParams}`);
        const data: (Token | null)[] = await res.json();

        const map: Record<string, Token> = {};
        for (let i = 0; i < uniqueMints.length; i++) {
          const mint = uniqueMints[i];
          const token = data[i];

          if (token) {
            map[mint] = token;
          } else {
            // fallback to RPC
            try {
              const pubkey = new PublicKey(mint);
              const info = await rpc.getParsedAccountInfo(pubkey);

              const decimals =
                info.value?.data &&
                "parsed" in info.value.data &&
                info.value.data.parsed.info.decimals
                  ? info.value.data.parsed.info.decimals
                  : 0;

              map[mint] = {
                id: mint,
                name: "Unknown Token",
                symbol: mint.slice(0, 4) + "…" + mint.slice(-4),
                decimals,
                tokenProgram: info.value?.owner?.toBase58() ?? "",
              };
            } catch (err) {
              console.error("RPC fallback failed for mint:", mint, err);
            }
          }
        }
        setTokens(map);
      } catch (err) {
        console.error("Failed to fetch tokens:", err);
      }
    })();
  }, [orders]);

  const copyToClipboard = (mint: string) => {
    toast.success("Mint address copied to clipboard");
    navigator.clipboard.writeText(mint);
  };

  const formatAmount = (raw: BN, mint: string) => {
    const t = tokens[mint];
    if (!t) return raw.toString();
    return (raw.toNumber() / Math.pow(10, t.decimals)).toLocaleString("en-US", {
      maximumFractionDigits: t.decimals > 6 ? 6 : t.decimals,
    });
  };

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const openEdit = (order: Order) => {
    setEditingOrder(order);
    setIsUpdateDialogOpen(true);
  };

  const getOrderTokens = (order: Order | null) => {
    if (!order) return { inputToken: null, outputToken: null };

    const inputMint = order.tokens.inputMint.toString();
    const outputMint = order.tokens.outputMint.toString();

    return {
      inputToken: tokens[inputMint] || null,
      outputToken: tokens[outputMint] || null,
    };
  };

  const { inputToken, outputToken } = getOrderTokens(editingOrder);

  const closeUpdate = () => {
    setEditingOrder(null);
    setIsUpdateDialogOpen(false);
  };

  const cancelOrder = async (order: PublicKey, maker: PublicKey) => {
    const loadingToast = toast.loading("creating the Transaction...");
    try {
      const res = await fetch(
        `/api/instructions/cancel?order=${order.toString()}&maker=${maker.toString()}`,
      );

      const { tx } = await res.json();

      const txBuffer = Buffer.from(tx, "base64");

      const transaction = VersionedTransaction.deserialize(txBuffer);

      toast.loading("Sign the Transaction", { id: loadingToast });

      const signature = await sendTransaction(transaction, connection);

      toast.loading("Signed Transaction", {
        id: loadingToast,
        description: `Waiting for confirmation...`,
        action: {
          label: "Explorer",
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
              "_blank",
            ),
        },
      });

      await connection.confirmTransaction(
        {
          signature: signature,
          ...(await connection.getLatestBlockhash()),
        },
        "confirmed",
      );

      toast.success("Transaction confirmed ✅", {
        description: "Your transaction was finalized.",
        id: loadingToast,
        action: {
          label: "Explorer",
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
              "_blank",
            ),
        },
      });

      removeOrder(order.toString());
    } catch (err) {
      console.error(err);
      toast.error("Transaction failed ❌", {
        id: loadingToast,
        description: String(err).includes("Closed")
          ? "Wallet Signing Failed"
          : String(err),
      });
    }
  };

  return (
    <>
      <Card className="w-full max-w-3xl bg-slate-900/70 border border-slate-700/50 rounded-2xl shadow-lg">
        <CardHeader className="border-b border-slate-700/50 pb-4">
          <CardTitle className="text-xl font-semibold text-slate-200">
            Open Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-slate-500 italic">
              No open orders
            </div>
          ) : (
            <>
              {currentOrders.map((order, i) => {
                const inputMint = order.tokens.inputMint.toString();
                const outputMint = order.tokens.outputMint.toString();
                const inputToken = tokens[inputMint];
                const outputToken = tokens[outputMint];

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="text-sm text-slate-200 font-medium">
                        {formatAmount(order.amount.makingAmount, inputMint)}{" "}
                        <span
                          className="text-indigo-400 cursor-pointer inline-flex items-center gap-1"
                          onClick={() => copyToClipboard(inputMint)}
                          title={`Click to copy mint: ${inputMint}`}
                        >
                          {inputToken?.symbol ?? inputMint.slice(0, 6) + "..."}
                          {inputToken?.icon && (
                            <img
                              src={inputToken.icon}
                              alt={inputToken.symbol}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                        </span>{" "}
                        → {formatAmount(order.amount.takingAmount, outputMint)}{" "}
                        <span
                          className="text-green-400 cursor-pointer inline-flex items-center gap-1"
                          onClick={() => copyToClipboard(outputMint)}
                          title={`Click to copy mint: ${outputMint}`}
                        >
                          {outputToken?.symbol ??
                            outputMint.slice(0, 6) + "..."}
                          {outputToken?.icon && (
                            <img
                              src={outputToken.icon}
                              alt={outputToken.symbol}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Created: {formatDate(order.createdAt)} | Expires:{" "}
                        {order.expiredAt.eq(new BN(0))
                          ? "never"
                          : formatDate(order.expiredAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(order)}
                        className="text-blue-400 hover:text-blue-500 hover:bg-blue-500/10 cursor-pointer"
                      >
                        ✏️Update
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cancelOrder(order.address, order.maker)}
                        className="flex flex-col items-center justify-center gap-1 rounded-full text-red-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                        <span className="text-xs font-medium">Cancel</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <UpdateCard
        order={editingOrder}
        isOpen={isUpdateDialogOpen}
        onClose={closeUpdate}
        inputToken={inputToken!}
        outputToken={outputToken!}
      />
    </>
  );
}

const formatDate = (bn: BN) => {
  return new Date(bn.toNumber() * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
