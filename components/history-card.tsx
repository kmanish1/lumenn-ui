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
    <Card className="w-full max-w-3xl bg-slate-900/70 border border-slate-700/50 rounded-2xl shadow-lg">
      <CardHeader className="border-b border-slate-700/50 pb-4">
        <CardTitle className="text-xl font-semibold text-slate-200">
          History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {events.length === 0 ? (
          <div className="text-center py-8 text-slate-500 italic">
            No history available
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
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="text-sm text-slate-200 font-medium">
                      <span className="text-xs uppercase text-slate-400">
                        {e.type}
                      </span>
                      : {formatAmount(e.making_amount, inputMint)}{" "}
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
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                      </span>{" "}
                      → {formatAmount(e.taking_amount, outputMint)}{" "}
                      <span
                        className="text-green-400 cursor-pointer inline-flex items-center gap-1"
                        onClick={() => copyToClipboard(outputMint)}
                        title={`Click to copy mint: ${outputMint}`}
                      >
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
                    <div className="text-xs text-slate-500">
                      {new Date(e.timestamp * 1000).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      Sig: {e.signature}
                    </div>
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
  );
}
