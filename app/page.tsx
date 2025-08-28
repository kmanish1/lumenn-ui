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
import { TrendingUp, ArrowUpDown } from "lucide-react";
import { connection, sol, usdc } from "@/lib/rpc";
import { Order } from "@/lib/utils";
import BN from "bn.js";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { fetch_quote, get_current_rate, Token } from "@/lib/jup";
import { TokenSearchBox } from "@/components/token-search";
import OrdersCard from "@/components/orders-card";
import { getOpenOrders } from "@/lib/orders";

export default function App() {
  const { connected, publicKey, sendTransaction, connecting, disconnecting } =
    useWallet();

  useEffect(() => {
    if (connected && !disconnecting) {
      toast.success("Wallet connected", {
        description: `Connected to ${publicKey?.toString().slice(0, 4)}...${publicKey?.toString().slice(-4)}`,
      });
    }
  }, [connecting, disconnecting, connected, publicKey]);

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      if (connected) {
        const open_orders = await getOpenOrders(publicKey!);
        setOrders(open_orders);
      }
    }
    fetchOrders();
  }, [connected, publicKey]);

  const [inputToken, setInputToken] = useState<Token>(sol);
  const [outputToken, setOutputToken] = useState<Token>(usdc);

  const [inputAmount, setInputAmount] = useState(1.0);
  const [outputAmount, setOutputAmount] = useState(0.0);

  useEffect(() => {
    async function fetchOutputAmount() {
      const data = await fetch_quote(
        inputToken,
        outputToken,
        inputAmount * 10 ** inputToken.decimals,
      );
      setOutputAmount(
        data!.outAmount ? data!.outAmount / 10 ** outputToken.decimals : 0,
      );
      setTargetRate(data?.current_ratio);
    }
    fetchOutputAmount();
  }, [inputAmount, inputToken, outputToken]);

  const [targetRate, setTargetRate] = useState<number>();

  useEffect(() => {
    setOutputAmount(inputAmount * (targetRate || 0));
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
      if (targetRate! < current_rate) {
        toast.error("Target rate must be greater than current rate");
        return;
      }
    }

    const loadingToast = toast.loading("creating the Transaction...");
    try {
      const res = await fetch(
        `/api/instructions/init` +
          `?maker=${publicKey.toString()}` +
          `&input_mint=${inputToken.id}` +
          `&input_amount=${inputAmount * 10 ** inputToken.decimals}` +
          `&output_mint=${outputToken.id}` +
          `&output_amount=${outputAmount * 10 ** outputToken.decimals}` +
          `&expired_at=${expiry}`,
      );

      const { tx, unique_id } = await res.json();

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

      const new_order: Order = {
        maker: publicKey,
        uniqueId: unique_id,
        tokens: {
          inputMint: new PublicKey(inputToken.id),
          outputMint: new PublicKey(outputToken.id),
          inputTokenProgram: new PublicKey(inputToken.tokenProgram),
          outputTokenProgram: new PublicKey(outputToken.tokenProgram),
        },
        amount: {
          oriMakingAmount: new BN(inputAmount * 10 ** inputToken.decimals),
          takingAmount: new BN(outputAmount * 10 ** outputToken.decimals),
          oriTakingAmount: new BN(outputAmount * 10 ** outputToken.decimals),
          makingAmount: new BN(inputAmount * 10 ** inputToken.decimals),
        },
        expiredAt: new BN(expiry),
        createdAt: new BN(Date.now() / 1000),
        updatedAt: new BN(Date.now() / 1000),
        slippageBps: 50,
        feeBps: 5,
      };

      setOrders((prev) => [new_order, ...prev]);
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

  const cancelOrder = async (unique_id: BN, maker: PublicKey) => {
    const loadingToast = toast.loading("creating the Transaction...");
    try {
      const res = await fetch(
        `/api/instructions/cancel?id=${unique_id}&maker=${maker.toString()}`,
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

      setOrders((prev) => prev.filter((order) => order.uniqueId !== unique_id));
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

  const handleExpiryChange = (value: string) => {
    const now = Math.floor(Date.now() / 1000);
    setMode(value);

    switch (value) {
      case "never":
        setExpiry(0);
        break;
      case "1h":
        setExpiry(now + 3600);
        break;
      case "6h":
        setExpiry(now + 6 * 3600);
        break;
      case "24h":
        setExpiry(now + 24 * 3600);
        break;
      case "7d":
        setExpiry(now + 7 * 24 * 3600);
        break;
      case "custom":
        // wait for user to pick a date
        setExpiry(0);
        break;
    }
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setCustomDate(e.target.value);
    setExpiry(Math.floor(date.getTime() / 1000));
  };

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <header className="border-b border-border cyber-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary cyber-glow" />
            <h1 className="text-2xl font-bold text-foreground">CyberDEX</h1>
          </div>

          <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto">
            <WalletMultiButton>
              {connected ? null : (
                <div className="transition-all duration-300 rounded-xl px-4 py-2 text-sm sm:text-base">
                  Connect Wallet
                </div>
              )}
            </WalletMultiButton>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex flex-col items-center gap-8">
        <Card className="cyber-border cyber-glow bg-slate-900/50 w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-center">Limit Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="bg-slate-800/30 rounded-lg p-4">
              <Label className="text-slate-300">Selling</Label>
              <div className="flex items-center justify-between mt-2">
                <TokenSearchBox
                  selectedToken={inputToken}
                  setSelectedToken={setInputToken}
                />
                <input
                  inputMode="decimal"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(Number(e.target.value))}
                  className="bg-transparent border-b border-slate-500 text-right text-white w-24"
                  placeholder="Amount"
                />
              </div>
            </div>

            <div className="flex justify-center my-3">
              <button
                type="button"
                onClick={() => {
                  const tempToken = inputToken;
                  setInputToken(outputToken);
                  setOutputToken(tempToken);

                  // swap amounts too
                  const tempAmount = inputAmount;
                  setInputAmount(outputAmount);
                  setOutputAmount(tempAmount);
                }}
                className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition cursor-pointer"
              >
                <ArrowUpDown className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4">
              <Label className="text-slate-300 ">Buying</Label>
              <div className="flex items-center justify-between mt-2">
                <TokenSearchBox
                  selectedToken={outputToken}
                  setSelectedToken={setOutputToken}
                />
                <input
                  inputMode="decimal"
                  value={outputAmount}
                  onChange={(e) => setOutputAmount(Number(e.target.value))}
                  className="bg-transparent border-b border-slate-500 text-right text-white w-24"
                  placeholder="Amount"
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-800/30 rounded-lg p-4">
              <div>
                <Label className="text-slate-300 text-sm">Target Rate</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    inputMode="decimal"
                    value={targetRate}
                    onChange={(e) => setTargetRate(Number(e.target.value))}
                    className="bg-transparent border-b border-slate-500 text-white w-28 text-sm"
                    placeholder="e.g. 196.42"
                  />
                  <span className="text-slate-400 text-sm">
                    {outputToken.name}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-slate-300 text-sm">Expiry</Label>
                <Select value={mode} onValueChange={handleExpiryChange}>
                  <SelectTrigger className="border-b border-slate-500 bg-transparent text-white px-0 py-1 h-auto w-32 text-sm focus:outline-none">
                    <SelectValue placeholder="Select expiry" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 text-white border border-slate-700 shadow-md rounded-md">
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="6h">6 Hours</SelectItem>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {mode === "custom" && (
                  <input
                    type="datetime-local"
                    value={customDate}
                    onChange={handleCustomDateChange}
                    className="bg-transparent border-b border-slate-500 text-white text-sm focus:outline-none"
                  />
                )}
              </div>
            </div>
            <Button
              onClick={handleSubmitOrder}
              className="w-full h-12 bg-green-500 hover:bg-green-600 text-black font-semibold text-lg rounded-lg cursor-pointer"
            >
              {connected ? "Place Limit Order" : "Connect Wallet to Trade"}
            </Button>
          </CardContent>
        </Card>
        <OrdersCard orders={orders} cancelOrder={cancelOrder} />
      </div>
    </div>
  );
}
