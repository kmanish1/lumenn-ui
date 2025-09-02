"use client";
import { toast } from "sonner";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { connection } from "@/lib/rpc";
import { useWallet } from "@solana/wallet-adapter-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Order } from "@/lib/utils";
import BN from "bn.js";
import { Token } from "./orders-card";

type UpdateCardProps = {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  inputToken: Token;
  outputToken: Token;
};

export default function UpdateCard({
  order,
  isOpen,
  onClose,
  inputToken,
  outputToken,
}: UpdateCardProps) {
  const [making, setMaking] = useState(0);
  const [taking, setTaking] = useState(0);
  const [targetRate, setTargetRate] = useState(0);
  const [expiry, setExpiry] = useState<number>(0);
  const [mode, setMode] = useState<string>("never");
  const [customDate, setCustomDate] = useState<string>("");

  const { sendTransaction } = useWallet();

  const update_order = async (
    order: PublicKey,
    maker: PublicKey,
    making_amount?: BN,
    taking_amount?: BN,
    expired_at?: BN,
  ) => {
    const loadingToast = toast.loading("creating the Transaction...");
    try {
      let url = `/api/instructions/update?order=${order.toString()}&maker=${maker.toString()}`;

      if (making_amount) {
        url += `&making_amount=${making_amount.toString()}`;
      }

      if (taking_amount) {
        url += `&taking_amount=${taking_amount.toString()}`;
      }

      if (expired_at) {
        url += `&expired_at${expired_at.toString()}`;
      }

      const res = await fetch(url);

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
    } catch (err) {
      toast.error("Transaction failed ❌", {
        id: loadingToast,
        description: String(err).includes("Closed")
          ? "Wallet Signing Failed"
          : String(err),
      });
    }
  };

  useEffect(() => {
    if (!order) return;

    const makingAmount = order.amount.makingAmount
      .div(new BN(10).pow(new BN(inputToken?.decimals || 1)))
      .toNumber();

    const takingAmount = order.amount.takingAmount
      .div(new BN(10).pow(new BN(outputToken?.decimals || 1)))
      .toNumber();

    setMaking(makingAmount);
    setTaking(takingAmount);

    // Calculate initial target rate (output/input)
    if (makingAmount > 0) {
      setTargetRate(takingAmount / makingAmount);
    }

    if (order.expiredAt.eq(new BN(0))) {
      setMode("never");
      setExpiry(0);
    } else {
      setMode("custom");
      setExpiry(order.expiredAt.toNumber());
      const expiryDate = new Date(order.expiredAt.toNumber() * 1000);
      setCustomDate(expiryDate.toISOString().slice(0, 16));
    }
  }, [order, inputToken, outputToken]);

  const handleMakingChange = (value: number) => {
    setMaking(value);
    // Update taking amount based on target rate
    if (targetRate > 0 && value > 0) {
      setTaking(value * targetRate);
    }
  };

  const handleTakingChange = (value: number) => {
    setTaking(value);
    // Update target rate based on new taking amount
    if (making > 0) {
      setTargetRate(value / making);
    }
  };

  const handleTargetRateChange = (value: number) => {
    setTargetRate(value);
    // Update taking amount based on new target rate
    if (making > 0) {
      setTaking(making * value);
    }
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setCustomDate(e.target.value);
    setExpiry(Math.floor(date.getTime() / 1000));
  };

  const handleUpdate = () => {
    if (!order) return;
    update_order(
      order.address,
      order.maker,
      making ? new BN(making * 10 ** inputToken?.decimals) : undefined,
      taking ? new BN(taking * 10 ** outputToken.decimals) : undefined,
      expiry ? new BN(expiry) : undefined,
    );
    onClose();
  };

  const handleExpiryChange = (value: string) => {
    const now = Math.floor(Date.now() / 1000);
    setMode(value);

    switch (value) {
      case "never":
        setExpiry(0);
        setCustomDate("");
        break;
      case "15m":
        setExpiry(now + 15 * 60);
        break;
      case "30m":
        setExpiry(now + 30 * 60);
        break;
      case "1h":
        setExpiry(now + 3600);
        break;
      case "2h":
        setExpiry(now + 2 * 3600);
        break;
      case "6h":
        setExpiry(now + 6 * 3600);
        break;
      case "12h":
        setExpiry(now + 12 * 3600);
        break;
      case "24h":
        setExpiry(now + 24 * 3600);
        break;
      case "3d":
        setExpiry(now + 3 * 24 * 3600);
        break;
      case "7d":
        setExpiry(now + 7 * 24 * 3600);
        break;
      case "30d":
        setExpiry(now + 30 * 24 * 3600);
        break;
      case "custom":
        // Set to current time + 1 hour as default
        const defaultExpiry = now + 3600;
        setExpiry(defaultExpiry);
        setCustomDate(
          new Date(defaultExpiry * 1000).toISOString().slice(0, 16),
        );
        break;
    }
  };

  const formatExpiryPreview = () => {
    if (mode === "never" || expiry === 0) return "Never expires";
    const expiryDate = new Date(expiry * 1000);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) return "Already expired";

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""} (${expiryDate.toLocaleDateString()} ${expiryDate.toLocaleTimeString()})`;
    } else if (diffHours > 0) {
      return `Expires in ${diffHours} hour${diffHours > 1 ? "s" : ""} (${expiryDate.toLocaleTimeString()})`;
    } else {
      return `Expires in ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} (${expiryDate.toLocaleTimeString()})`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 border border-slate-700/50 rounded-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-200">Update Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Input Amount ({inputToken?.symbol || "Token"})
            </label>
            <Input
              type="number"
              value={making}
              onChange={(e) => handleMakingChange(Number(e.target.value))}
              className="bg-slate-800 text-slate-200 border-slate-600"
              step="any"
              min="0"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Output Amount ({outputToken?.symbol || "Token"})
            </label>
            <Input
              type="number"
              value={taking}
              onChange={(e) => handleTakingChange(Number(e.target.value))}
              className="bg-slate-800 text-slate-200 border-slate-600"
              step="any"
              min="0"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Target Rate ({outputToken?.symbol || "Token"}/
              {inputToken?.symbol || "Token"})
            </label>
            <Input
              type="number"
              value={targetRate}
              onChange={(e) => handleTargetRateChange(Number(e.target.value))}
              className="bg-slate-800 text-slate-200 border-slate-600"
              step="any"
              min="0"
            />
            <div className="text-xs text-slate-500 mt-1">
              How many {outputToken?.symbol || "output tokens"} per{" "}
              {inputToken?.symbol || "input token"}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="block text-slate-400 text-sm">Expiry</label>
            <Select value={mode} onValueChange={handleExpiryChange}>
              <SelectTrigger className="border border-slate-600 bg-slate-800 text-slate-200 px-3 py-2 h-10 rounded-md">
                <SelectValue placeholder="Select expiry" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-slate-200 border border-slate-700 shadow-md rounded-md">
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="15m">15 Minutes</SelectItem>
                <SelectItem value="30m">30 Minutes</SelectItem>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="2h">2 Hours</SelectItem>
                <SelectItem value="6h">6 Hours</SelectItem>
                <SelectItem value="12h">12 Hours</SelectItem>
                <SelectItem value="24h">1 Day</SelectItem>
                <SelectItem value="3d">3 Days</SelectItem>
                <SelectItem value="7d">1 Week</SelectItem>
                <SelectItem value="30d">1 Month</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            {mode === "custom" && (
              <div className="space-y-2">
                <input
                  type="datetime-local"
                  value={customDate}
                  onChange={handleCustomDateChange}
                  className="w-full bg-slate-800 border border-slate-600 text-slate-200 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}

            <div className="text-xs text-slate-400 bg-slate-800/50 p-2 rounded border border-slate-700">
              {formatExpiryPreview()}
            </div>
          </div>

          <Button
            onClick={handleUpdate}
            className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors"
            disabled={making <= 0 || taking <= 0 || targetRate <= 0}
          >
            Update Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
