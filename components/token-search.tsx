import { search_tokens, Token } from "@/lib/jup";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { jup, sol, usdc, zBTC } from "@/lib/rpc";

const DEFAULT_TOKENS: Token[] = [sol, usdc, jup, zBTC];

export function TokenSearchBox({
  selectedToken,
  setSelectedToken,
}: {
  selectedToken: Token | null;
  setSelectedToken: (token: Token) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Token[]>(DEFAULT_TOKENS);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchTokens = async () => {
      if (query.length < 2) {
        setResults(DEFAULT_TOKENS);
        return;
      }
      try {
        const tokens = await search_tokens(query);
        setResults(tokens);
      } catch (error) {
        console.error("Error searching tokens:", error);
        setResults([]);
      }
    };
    fetchTokens();
  }, [query]);

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setQuery("");
    setIsOpen(false); // Close the dialog
  };

  const handleDialogClose = () => {
    setQuery(""); // Reset search when dialog closes
    setResults(DEFAULT_TOKENS); // Reset to default tokens
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          handleDialogClose();
        }
      }}
    >
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600 cursor-pointer transition-colors">
          {selectedToken ? (
            <>
              <img
                src={selectedToken.icon}
                alt={selectedToken.symbol}
                className="w-5 h-5 rounded-full"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";
                }}
              />
              {selectedToken.symbol}
            </>
          ) : (
            "Select token"
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-slate-900 text-white border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Select a token</DialogTitle>
        </DialogHeader>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any token..."
          className="w-full px-3 py-2 mb-4 bg-slate-800 rounded border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <div className="max-h-72 overflow-y-auto space-y-1">
          {results.length > 0 ? (
            results.map((token) => (
              <div
                key={token.id}
                onClick={() => handleTokenSelect(token)}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-700 rounded transition-colors"
              >
                <img
                  src={token.icon}
                  alt={token.symbol}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";
                  }}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{token.symbol}</span>
                  <span className="text-xs text-slate-400">{token.name}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-400 py-8">
              No tokens found
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
