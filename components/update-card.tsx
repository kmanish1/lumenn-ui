"use client";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import BN from "bn.js";
import { toast } from "sonner";
import { VersionedTransaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

import { connection } from "@/lib/rpc";
import { Order, toHumanReadable, toRawAmount } from "@/lib/utils";
import { get_current_rate } from "@/lib/jup";
import { useOrdersStore } from "@/store/useOrderStore";

import { Token } from "./orders-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Decimal from "decimal.js";

type UpdateOrderDialogProps = {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  inputToken: Token;
  outputToken: Token;
};

export default function UpdateOrderDialog({
  order,
  isOpen,
  onClose,
  inputToken,
  outputToken,
}: UpdateOrderDialogProps) {
  const [inputAmount, setInputAmount] = useState(0.0);
  const [outputAmount, setOutputAmount] = useState(0.0);
  const [targetRate, setTargetRate] = useState(0);

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
        setExpiry(0);
        break;
    }
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setCustomDate(e.target.value);
    setExpiry(Math.floor(date.getTime() / 1000));
  };

  const { sendTransaction } = useWallet();
  const { updateOrder } = useOrdersStore();

  const handleUpdateOrder = async (
    order: Order,
    newInputAmount?: BN,
    newOutputAmount?: BN,
    newExpiry?: BN,
  ) => {
    const toastId = toast.loading("Preparing transaction...");

    try {
      const currentRate = await get_current_rate(inputToken, outputToken);

      if (currentRate && targetRate < currentRate) {
        toast.error("Target rate must be greater than current rate", {
          id: toastId,
        });
        return;
      }

      if (expiry != 0 && expiry < Math.floor(Date.now() / 1000)) {
        toast.error("Expiry must be in the future");
        return;
      }

      let url = `/api/instructions/update?order=${order.address.toString()}&maker=${order.maker.toString()}`;

      if (newInputAmount) url += `&making_amount=${newInputAmount.toString()}`;
      if (newOutputAmount)
        url += `&taking_amount=${newOutputAmount.toString()}`;

      console.log(newExpiry);
      if (newExpiry !== undefined) {
        url += `&expired_at=${newExpiry.toString()}`;
      }

      const res = await fetch(url);
      const { tx } = await res.json();

      const transactionBuffer = Buffer.from(tx, "base64");
      const transaction = VersionedTransaction.deserialize(transactionBuffer);

      toast.loading("Sign the transaction in your wallet...", { id: toastId });
      const signature = await sendTransaction(transaction, connection);

      toast.loading("Transaction sent. Awaiting confirmation...", {
        id: toastId,
        action: {
          label: "View on Explorer",
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
              "_blank",
            ),
        },
      });

      await connection.confirmTransaction(
        {
          signature,
          ...(await connection.getLatestBlockhash()),
        },
        "confirmed",
      );

      toast.success("Transaction confirmed ✅", {
        id: toastId,
        description: "Your order was successfully updated.",
      });

      const updatedOrder: Order = {
        ...order,
        amount: {
          makingAmount: newInputAmount || order.amount.makingAmount,
          takingAmount: newOutputAmount || order.amount.takingAmount,
          oriMakingAmount: newInputAmount || order.amount.oriMakingAmount,
          oriTakingAmount: newOutputAmount || order.amount.oriTakingAmount,
        },
        expiredAt: newExpiry ? newExpiry : 0 || order.expiredAt,
        updatedAt: new BN(Math.floor(Date.now() / 1000)),
      };

      updateOrder(updatedOrder);
    } catch (err) {
      toast.error("Transaction failed ❌", {
        id: toastId,
        description: String(err).includes("Closed")
          ? "Wallet signing was cancelled"
          : String(err),
      });
    }
  };

  useEffect(() => {
    if (!order) return;

    const normalizedInputAmount = toHumanReadable(
      order.amount.makingAmount,
      inputToken.decimals,
    );

    const normalizedOutputAmount = toHumanReadable(
      order.amount.takingAmount,
      outputToken.decimals,
    );

    setInputAmount(normalizedInputAmount);
    setOutputAmount(normalizedOutputAmount);

    if (normalizedInputAmount > 0) {
      const rate = new Decimal(normalizedOutputAmount)
        .div(normalizedInputAmount)
        .toNumber();
      setTargetRate(rate);
    }

    if (order.expiredAt.eq(new BN(0))) {
      setMode("never");
      setExpiry(0);
      setCustomDate("");
    } else {
      setMode("custom");
      setExpiry(order.expiredAt.toNumber());
      const expiryDate = new Date(order.expiredAt.toNumber() * 1000);
      setCustomDate(expiryDate.toISOString().slice(0, 16));
    }
  }, [order, inputToken, outputToken]);

  const handleInputAmountChange = (value: number) => {
    if (isNaN(value) || value < 0) return;
    setInputAmount(value);
    if (targetRate > 0 && value > 0) {
      const newOutput = new Decimal(value).mul(targetRate).toNumber();
      setOutputAmount(newOutput);
    }
  };

  const handleOutputAmountChange = (value: number) => {
    if (isNaN(value) || value < 0) return;
    setOutputAmount(value);
    if (inputAmount > 0) {
      const newRate = new Decimal(value).div(inputAmount).toNumber();
      setTargetRate(newRate);
    }
  };

  const handleTargetRateChange = (value: number) => {
    if (isNaN(value) || value < 0) return;
    setTargetRate(value);
    if (inputAmount > 0) {
      const newOutput = new Decimal(inputAmount).mul(value).toNumber();
      setOutputAmount(newOutput);
    }
  };

  const handleConfirmUpdate = () => {
    if (!order) return;
    handleUpdateOrder(
      order,
      inputAmount > 0
        ? toRawAmount(inputAmount, inputToken.decimals)
        : undefined,
      outputAmount > 0
        ? toRawAmount(outputAmount, outputToken.decimals)
        : undefined,
      expiry !== undefined ? new BN(expiry) : undefined,
    );
    onClose();
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
              inputMode="decimal"
              value={inputAmount}
              onChange={(e) => handleInputAmountChange(Number(e.target.value))}
              className="bg-slate-800 text-slate-200 border-slate-600"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Output Amount ({outputToken?.symbol || "Token"})
            </label>
            <Input
              inputMode="decimal"
              value={outputAmount}
              onChange={(e) => handleOutputAmountChange(Number(e.target.value))}
              className="bg-slate-800 text-slate-200 border-slate-600"
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
          <div className="text-xs text-slate-400 bg-slate-800/50 p-2 rounded border border-slate-700">
            {formatExpiryPreview()}
          </div>

          <Button
            onClick={handleConfirmUpdate}
            className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
            disabled={inputAmount <= 0 || outputAmount <= 0 || targetRate <= 0}
          >
            Update Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
