"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { toast } from "sonner";
import { rpc } from "@/lib/rpc";
import { History } from "@/app/api/orders/history/route";

type Token = {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  tokenProgram: string;
  icon?: string;
};

export default function HistoryCard({ events }: { events: History[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [tokens, setTokens] = useState<Record<string, Token>>({});
  const pageSize = 5;
  const totalPages = Math.ceil(events.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentEvents = events.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    const uniqueMints = Array.from(
      new Set(events.flatMap((e) => [e.input_mint, e.output_mint])),
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
  }, [events]);

  const copyToClipboard = (mint: string) => {
    toast.success("Mint address copied to clipboard");
    navigator.clipboard.writeText(mint);
  };

  const formatAmount = (raw: string, mint: string) => {
    const t = tokens[mint];
    if (!t) return raw;
    const bn = new BN(raw);
    return (bn.toNumber() / Math.pow(10, t.decimals)).toLocaleString("en-US", {
      maximumFractionDigits: t.decimals > 6 ? 6 : t.decimals,
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-slate-900/80 border border-slate-700/60 rounded-3xl shadow-xl backdrop-blur-md transition-all">
      <CardHeader className="border-b border-slate-700/50 pb-5 px-6 flex items-center justify-between">
        <CardTitle className="text-2xl font-semibold text-slate-100 tracking-wide">
          History
        </CardTitle>
        {events.length > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-slate-800/70 text-slate-400">
            {events.length} records
          </span>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <span className="text-lg italic">No history available</span>
          </div>
        ) : (
          <>
            {currentEvents.map((e, i) => {
              const inputMint = e.input_mint;
              const outputMint = e.output_mint;
              const inputToken = tokens[inputMint];
              const outputToken = tokens[outputMint];

              return (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/70 transition-all duration-200 shadow-sm"
                >
                  {/* Left side: transaction details */}
                  <div className="flex-1 space-y-1">
                    <div className="text-sm text-slate-200 font-medium flex flex-wrap items-center gap-2">
                      <span className="text-xs uppercase tracking-wide text-slate-400">
                        {e.type}
                      </span>

                      {/* Input token display */}
                      <span
                        className="inline-flex items-center gap-1 text-indigo-400 cursor-pointer hover:text-indigo-300 transition"
                        onClick={() => copyToClipboard(inputMint)}
                        title={`Click to copy: ${inputMint}`}
                      >
                        {formatAmount(e.making_amount, inputMint)}{" "}
                        {inputToken?.symbol ?? inputMint.slice(0, 6) + "..."}
                        {inputToken?.icon && (
                          <img
                            src={inputToken.icon}
                            alt={inputToken.symbol}
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                      </span>

                      <span className="text-slate-500">→</span>

                      {/* Output token display */}
                      <span
                        className="inline-flex items-center gap-1 text-green-400 cursor-pointer hover:text-green-300 transition"
                        onClick={() => copyToClipboard(outputMint)}
                        title={`Click to copy: ${outputMint}`}
                      >
                        {formatAmount(e.taking_amount, outputMint)}{" "}
                        {outputToken?.symbol ?? outputMint.slice(0, 6) + "..."}
                        {outputToken?.icon && (
                          <img
                            src={outputToken.icon}
                            alt={outputToken.symbol}
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-slate-500">
                      {new Date(e.timestamp * 1000).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>
                        Sig: {e.signature.slice(0, 6)}...{e.signature.slice(-6)}
                      </span>
                      <button
                        onClick={() =>
                          window.open(
                            `https://explorer.solana.com/tx/${e.signature}?cluster=devnet`,
                            "_blank",
                          )
                        }
                        className="px-2 py-0.5 text-[11px] rounded-md bg-slate-700/70 text-slate-300 hover:bg-slate-600 hover:text-white transition"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-6 pt-6 border-t border-slate-700/40">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-700/60 transition"
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
                  className="border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-700/60 transition"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
