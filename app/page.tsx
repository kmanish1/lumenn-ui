"use client";
import { toast } from "sonner";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, ArrowUpDown, Menu, X } from "lucide-react";
import { connection, sol, usdc } from "@/lib/rpc";
import { Order } from "@/lib/utils";
import BN from "bn.js";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { fetch_quote, get_current_rate } from "@/lib/jup";
import { TokenSearchBox } from "@/components/token-search";
import OrdersCard, { Token } from "@/components/orders-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getOpenOrders } from "@/lib/orders";
import HistoryCard from "@/components/history-card";
import { History } from "./api/orders/history/route";
import { useOrdersStore } from "@/store/useOrderStore";
import { EXPIRY_OFFSETS, options } from "@/lib/data";
import PluginComponent from "@/components/plugin";

export default function App() {
  const {wallet, connected, publicKey, sendTransaction, connecting, disconnecting, signTransaction } =
    useWallet();

  
  useEffect(() => {
    if (connected && !disconnecting) {
      toast.success("Wallet connected", {
        description: `Connected to ${publicKey
          ?.toString()
          .slice(0, 4)}...${publicKey?.toString().slice(-4)}`,
      });
    }
  }, [connecting, disconnecting, connected, publicKey]);

  const { setOrders, addOrder } = useOrdersStore();

  useEffect(() => {
    async function fetchOrders() {
      if (connected) {
        const open_orders = await getOpenOrders(publicKey!);
        setOrders(open_orders);
      }
    }
    fetchOrders();
  }, [connected, publicKey]);

  const [history, setHistory] = useState<History[]>([]);

  useEffect(() => {
    async function fetchHistory() {
      if (connected) {
        const res = await fetch(
          `/api/orders/history?maker=${publicKey?.toString()}`
        );
        const data = await res.json();
        setHistory(data.history ?? []);
      }
    }

    fetchHistory();
  }, [connected, publicKey]);

  const [inputToken, setInputToken] = useState<Token>(sol);
  const [outputToken, setOutputToken] = useState<Token>(usdc);

  const [inputAmount, setInputAmount] = useState<string>("1");
  const [outputAmount, setOutputAmount] = useState<string>("");
  const [targetRate, setTargetRate] = useState<string>("");

  useEffect(() => {
    const numInput = parseFloat(inputAmount || "0");
    if (!isNaN(numInput)) {
      fetch_quote(
        inputToken,
        outputToken,
        numInput * 10 ** inputToken.decimals
      ).then((data) => {
        setOutputAmount(
          data?.outAmount
            ? String(data.outAmount / 10 ** outputToken.decimals)
            : "0"
        );
        setTargetRate(data?.current_ratio?.toString() ?? "");
      });
    }
  }, [inputAmount, inputToken, outputToken]);

  useEffect(() => {
    const numInput = parseFloat(inputAmount || "0");
    const numRate = parseFloat(targetRate || "0");
    if (!isNaN(numInput) && !isNaN(numRate)) {
      setOutputAmount(String(numInput * numRate));
    }
  }, [targetRate]);

  const handleSubmitOrder = async () => {
    if (
      !inputToken ||
      !outputToken ||
      !inputAmount ||
      !outputAmount ||
      !publicKey
    )
      return;

    const current_rate = await get_current_rate(inputToken, outputToken);

    if (current_rate) {
      if (parseFloat(targetRate!) < current_rate) {
        toast.error("Target rate must be greater than current rate");
        return;
      }
    }

    if (expiry != 0 && expiry < Math.floor(Date.now() / 1000)) {
      toast.error("Expiry must be in the future");
      return;
    }

    const loadingToast = toast.loading("creating the Transaction...");
    try {
      const res = await fetch(
        `/api/instructions/init` +
          `?maker=${publicKey.toString()}` +
          `&input_mint=${inputToken.id}` +
          `&input_amount=${
            parseFloat(inputAmount) * 10 ** inputToken.decimals
          }` +
          `&output_mint=${outputToken.id}` +
          `&output_amount=${
            parseFloat(outputAmount) * 10 ** outputToken.decimals
          }` +
          `&expired_at=${expiry}`
      );

      const { tx, unique_id, order } = await res.json();

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
              "_blank"
            ),
        },
      });

      await connection.confirmTransaction(
        {
          signature: signature,
          ...(await connection.getLatestBlockhash()),
        },
        "confirmed"
      );

      toast.success("Transaction confirmed ✅", {
        description: "Your transaction was finalized.",
        id: loadingToast,
        action: {
          label: "Explorer",
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
              "_blank"
            ),
        },
      });

      const inAmount = parseFloat(inputAmount);
      const outAmount = parseFloat(outputAmount);

      const new_order: Order = {
        maker: publicKey,
        uniqueId: unique_id,
        address: order,
        tokens: {
          inputMint: new PublicKey(inputToken.id),
          outputMint: new PublicKey(outputToken.id),
          inputTokenProgram: new PublicKey(inputToken.tokenProgram),
          outputTokenProgram: new PublicKey(outputToken.tokenProgram),
        },
        amount: {
          oriMakingAmount: new BN(inAmount * 10 ** inputToken.decimals),
          makingAmount: new BN(inAmount * 10 ** inputToken.decimals),
          oriTakingAmount: new BN(outAmount * 10 ** outputToken.decimals),
          takingAmount: new BN(outAmount * 10 ** outputToken.decimals),
        },
        expiredAt: new BN(expiry),
        createdAt: new BN(Date.now() / 1000),
        updatedAt: new BN(Date.now() / 1000),
        feeBps: 5,
      };

      addOrder(new_order);
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
  







  const [expiry, setExpiry] = useState<number>(0);
  const [customDate, setCustomDate] = useState<string>("");
  const [mode, setMode] = useState<string>("never");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"Limit Order" | "Swap" | "DCA">(
    "Limit Order"
  );


  const handleExpiryChange = (value: string) => {
    setMode(value);
    const now = Math.floor(Date.now() / 1000);

    if (value === "custom") {
      setExpiry(0); // Wait for user input
    } else {
      setExpiry(EXPIRY_OFFSETS[value] ? now + EXPIRY_OFFSETS[value] : 0);
    }
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setCustomDate(e.target.value);
    setExpiry(Math.floor(date.getTime() / 1000));
  };

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <header className="bg-black text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left: Logo + Brand */}
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-[#512DA8] transition-transform duration-300 hover:scale-110" />
            <h1 className="text-2xl font-bold tracking-wide text-white">
              Lumenn
            </h1>
          </div>

          {/* Center: Navbar (desktop only) */}

          {/* Right: Balance + Wallet */}
          <div className="flex items-center gap-4">
            <WalletMultiButton className="!bg-[#512DA8] hover:!bg-[#6830c4] !text-white font-medium rounded-full px-5 py-2 shadow-lg transition-all duration-300">
              {connected ? null : "Connect Wallet"}
            </WalletMultiButton>
          </div>
        </div>

        {/* Mobile menu */}
      </header>

      <div className="container mx-auto px-4 py-8 flex flex-col items-center gap-8">
        <nav className="flex gap-8 text-lg font-medium text-gray-300">
          {["Limit Order", "Swap", "DCA"].map((tab) => (
            <button
              key={tab}
              onClick={() =>
                setActiveTab(tab as "Limit Order" | "Swap" | "DCA")
              }
              className={`relative px-4 py-2 rounded-lg transition-all duration-300 ${
                activeTab === tab
                  ? "text-white  bg-[#512DA8]/30 shadow-md"
                  : "hover:text-white hover:bg-white/5"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute left-0 bottom-0 w-full h-1 rounded-full bg-[#512DA8] animate-slideIn" />
              )}
            </button>
          ))}
        </nav>
        {activeTab === "Limit Order" && (
          <Card className="bg-black border border-zinc-800 w-full max-w-lg rounded-2xl  shadow-md">
            <CardHeader>
              <CardTitle className="text-center text-white text-lg font-semibold"></CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Selling Box */}
              <div className="bg-black rounded-xl p-6 border border-zinc-800 shadow-md">
                <Label className="text-gray-300">Sell</Label>
                <div className="flex items-center justify-between gap-3 mt-3">
                  <TokenSearchBox
                    selectedToken={inputToken}
                    setSelectedToken={setInputToken}
                    user={connected ? publicKey! : undefined}
                  />
                  <input
                    inputMode="decimal"
                    value={inputAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*\.?\d*$/.test(val)) {
                        setInputAmount(val);
                      }
                    }}
                    className="w-28 text-right text-sm rounded-lg px-3 py-2 bg-zinc-900/70 text-white border border-zinc-800 focus:border-[#512DA8] focus:ring-2 focus:ring-[#512DA8]/60 outline-none transition-all placeholder-gray-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center my-4">
                <button
                  type="button"
                  onClick={() => {
                    const tempToken = inputToken;
                    setInputToken(outputToken);
                    setOutputToken(tempToken);

                    const tempAmount = inputAmount;
                    setInputAmount(outputAmount);
                    setOutputAmount(tempAmount);
                  }}
                  className="p-3 rounded-full bg-[#512DA8] hover:bg-[#6A3EDB] transition-colors cursor-pointer shadow-md border border-[#512DA8]/60"
                >
                  <ArrowUpDown className="h-5 w-5 text-white" />
                </button>
              </div>

              {/* Buying Box */}
              <div className="bg-black rounded-xl p-6 border border-zinc-800 shadow-md">
                <Label className="text-gray-300">Buy</Label>
                <div className="flex items-center justify-between gap-3 mt-3">
                  <TokenSearchBox
                    selectedToken={outputToken}
                    setSelectedToken={setOutputToken}
                  />
                  <input
                    inputMode="decimal"
                    value={outputAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*\.?\d*$/.test(val)) {
                        setOutputAmount(val);
                      }
                    }}
                    className="w-28 text-right text-sm rounded-lg px-3 py-2 bg-zinc-900/70 text-white border border-zinc-800/50 focus:border-[#512DA8] focus:ring-2 focus:ring-[#512DA8]/60 outline-none transition-all placeholder-gray-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Target Rate + Expiry */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-black rounded-xl p-6 border border-zinc-800 shadow-md">
                {/* Target Rate */}
                <div className="w-full sm:w-auto">
                  <Label className="text-gray-300 text-sm">Target Rate</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      inputMode="decimal"
                      value={targetRate}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*\.?\d*$/.test(val)) {
                          setTargetRate(val);
                        }
                      }}
                      className="w-32 text-sm rounded-lg px-3 py-2 bg-zinc-900/70 text-white border border-zinc-800/50 focus:border-[#512DA8] focus:ring-2 focus:ring-[#512DA8]/60 outline-none transition-all placeholder-gray-500"
                      placeholder="e.g. 196.42"
                    />
                    <span className="text-gray-400 text-sm">
                      {outputToken.name}
                    </span>
                  </div>
                </div>

                {/* Expiry */}
                <div className="w-full sm:w-auto flex flex-col gap-2">
                  <Label className="text-gray-300 text-sm">Expiry</Label>
                  <Select value={mode} onValueChange={handleExpiryChange}>
                    <SelectTrigger className="w-40 text-sm rounded-lg px-3 py-2 bg-zinc-800/50 text-white border  focus:border-[#512DA8] focus:ring-1 focus:ring-[#512DA8]/60 outline-none transition-all">
                      <SelectValue placeholder="Select expiry" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 text-white border border-zinc-800 shadow-lg rounded-md">
                      {options.map(({ value, label }) => (
                        <SelectItem
                          key={value}
                          value={value}
                          className="cursor-pointer hover:bg-[#512DA8]/30 transition-colors"
                        >
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {mode === "custom" && (
                    <input
                      type="datetime-local"
                      value={customDate}
                      onChange={handleCustomDateChange}
                      className="mt-1 w-44 text-sm rounded-lg px-3 py-2 bg-zinc-900/70 text-white border border-[#512DA8]/50 focus:border-[#512DA8] focus:ring-2 focus:ring-[#512DA8]/60 outline-none transition-all"
                    />
                  )}
                </div>
              </div>

              {/* Submit */}
              {connected ? (
                <Button
                  onClick={handleSubmitOrder}
                  className="w-full h-12 bg-[#512DA8] hover:text-gray-300 text-white font-semibold text-lg rounded-full cursor-pointer transition"
                >
                  Place Limit Order
                </Button>
              ) : (
                <div className="flex justify-center">
                  <WalletMultiButton className="!bg-[#512DA8] hover:!bg-blue-500 text-white font-semibold rounded-full px-6 py-3">
                    Connect Wallet
                  </WalletMultiButton>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {activeTab === "Swap" && (
          <Card className="bg-black border border-zinc-800 w-full max-w-lg rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle className="text-center text-white text-lg font-semibold">
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="text-xl">
                <PluginComponent />
              </div>
            </CardContent>
          </Card>
        )}
        {activeTab === "DCA" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">DCA</CardTitle>
            </CardHeader>
          </Card>
        )}
        <Tabs defaultValue="open" className="w-full max-w-3xl mx-auto mt-6">
          <TabsList className="">
            <TabsTrigger value="open" className="cursor-pointer mr-3">
              Open Orders
            </TabsTrigger>
            <TabsTrigger value="history" className="cursor-pointer ml-3">
              History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="open">
            <OrdersCard />
          </TabsContent>
          <TabsContent value="history">
            <HistoryCard events={history} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
