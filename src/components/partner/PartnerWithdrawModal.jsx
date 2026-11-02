const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import NeuInput from "@/components/NeuInput";
import { formatINR } from "@/lib/sdlUtils";
import { CheckCircle2, Loader2, X, Lock, Clock, Wallet, TrendingUp } from "lucide-react";

export default function PartnerWithdrawModal({ user, availableCapital, availableProfit, deposits, withdrawals, onClose, onSubmitted }) {
  const [type, setType] = useState("profit");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const approvedDeposits = deposits.filter((d) => d.status === "approved");
  const firstDepositDate = approvedDeposits.length > 0
    ? new Date(approvedDeposits[approvedDeposits.length - 1].approved_date || approvedDeposits[approvedDeposits.length - 1].created_date)
    : null;

  const approvedCapitalWds = withdrawals.filter((w) => w.status === "approved" && (w.withdrawal_type || "profit") === "capital");
  const lastCapitalWdDate = approvedCapitalWds.length > 0
    ? new Date(approvedCapitalWds[0].paid_date || approvedCapitalWds[0].created_date)
    : null;

  const capitalLockDate = lastCapitalWdDate || firstDepositDate;
  const capitalUnlocked = !capitalLockDate || (new Date() - capitalLockDate) / (1000 * 60 * 60 * 24 * 30) >= 6;
  const capitalUnlockDate = capitalLockDate ? new Date(capitalLockDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000) : null;

  const approvedProfitWds = withdrawals.filter((w) => w.status === "approved" && (w.withdrawal_type || "profit") === "profit");
  const lastProfitWdDate = approvedProfitWds.length > 0
    ? new Date(approvedProfitWds[0].paid_date || approvedProfitWds[0].created_date)
    : null;
  const profitUnlocked = !lastProfitWdDate || (new Date() - lastProfitWdDate) / (1000 * 60 * 60 * 24) >= 30;
  const profitUnlockDate = lastProfitWdDate ? new Date(lastProfitWdDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null;

  const maxAmount = type === "capital" ? availableCapital : availableProfit;
  const unlocked = type === "capital" ? capitalUnlocked : profitUnlocked;

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt < 1) { alert("Enter a valid amount"); return; }
    if (amt > maxAmount) { alert(`Amount cannot exceed ${formatINR(maxAmount)}`); return; }
    if (!unlocked) { alert("Withdrawal is currently locked. Please wait until the lock period ends."); return; }
    setLoading(true);
    try {
      await db.entities.PartnerWithdrawal.create({
        user_id: user.id,
        user_name: user.display_name || user.full_name,
        user_upi_id: user.upi_id,
        amount: amt,
        withdrawal_type: type,
        status: "pending",
      });
      setDone(true);
    } catch (e) {
      alert("Failed: " + (e.message || "error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">Withdraw</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full sdl-gradient mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-base font-bold text-slate-700">Withdrawal Requested!</h4>
            <p className="text-sm text-slate-500">Your {type === "capital" ? "capital" : "profit"} withdrawal request for {formatINR(Number(amount))} has been submitted. The admin will process it within 24 hours.</p>
            <button onClick={onSubmitted} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg">Done</button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setType("profit"); setAmount(""); }}
                className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${type === "profit" ? "sdl-gradient text-white shadow-lg" : "neu-btn text-slate-600"}`}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs font-semibold">Profit Withdraw</span>
                <span className={`text-[10px] ${type === "profit" ? "text-white/80" : "text-slate-400"}`}>Every month</span>
              </button>
              <button
                onClick={() => { setType("capital"); setAmount(""); }}
                className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${type === "capital" ? "sdl-gradient text-white shadow-lg" : "neu-btn text-slate-600"}`}
              >
                <Wallet className="w-5 h-5" />
                <span className="text-xs font-semibold">Capital Withdraw</span>
                <span className={`text-[10px] ${type === "capital" ? "text-white/80" : "text-slate-400"}`}>Every 6 months</span>
              </button>
            </div>

            {/* Available amount */}
            <div className="neu-inset-sm rounded-xl p-3 flex justify-between text-sm">
              <span className="text-slate-500">Available {type === "capital" ? "Capital" : "Profit"}</span>
              <span className="font-bold sdl-gradient-text">{formatINR(maxAmount)}</span>
            </div>

            {/* Lock status */}
            {!unlocked && type === "capital" && capitalUnlockDate && (
              <div className="neu-inset-sm rounded-xl p-3 flex items-center gap-2 text-xs text-amber-600">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Capital locked until {capitalUnlockDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
              </div>
            )}
            {!unlocked && type === "profit" && profitUnlockDate && (
              <div className="neu-inset-sm rounded-xl p-3 flex items-center gap-2 text-xs text-amber-600">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Next profit withdrawal on {profitUnlockDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
              </div>
            )}

            {/* Amount input */}
            {unlocked && maxAmount > 0 ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Withdrawal Amount</label>
                  <NeuInput type="number" min={1} max={maxAmount} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Max: ${formatINR(maxAmount)}`} />
                </div>
                <button onClick={submit} disabled={loading} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Withdraw ${type === "capital" ? "Capital" : "Profit"}`}
                </button>
              </>
            ) : unlocked && maxAmount <= 0 ? (
              <div className="neu-inset-sm rounded-xl p-4 text-center text-sm text-slate-400">
                No {type} available for withdrawal.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}