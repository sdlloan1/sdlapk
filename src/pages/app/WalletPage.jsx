const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import NeuButton from "@/components/NeuButton";
import NeuInput from "@/components/NeuInput";
import { formatINR, upiQrUrl, formatDate, monthKey, resolvePayee } from "@/lib/sdlUtils";
import {
  Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, Plus, Upload, Loader2,
  CheckCircle2, X, Clock, Gift, Sparkles, Lock, Unlock, ChevronDown
} from "lucide-react";
import NeuPageLoader from "@/components/NeuPageLoader";
import UpiVerifiedBadge from "@/components/UpiVerifiedBadge";

export default function WalletPage({ user, settings, active }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [visible, setVisible] = useState(8);
  const [team, setTeam] = useState([]);

  const loadData = async () => {
    setLoading(true);
    const [txns, t] = await Promise.all([
      db.entities.WalletTransaction.filter({ user_id: user.id }, "-created_date"),
      db.entities.TeamMember.list("order"),
    ]);
    setTransactions(txns);
    setTeam(t);
    setLoading(false);
  };

  useEffect(() => { if (active) loadData(); }, [active]);

  const balance = transactions.filter((t) => t.status === "completed").reduce((sum, t) => sum + (t.type === "withdrawal" ? -t.amount : t.amount), 0);
  const pendingTxns = transactions.filter((t) => t.status === "pending");

  // Withdrawal lock cycle: unlocked 6 months after registration; re-locks for 6 months after each completed withdrawal.
  const completedWithdrawals = transactions
    .filter((t) => t.type === "withdrawal" && t.status === "completed")
    .sort((a, b) => new Date(b.processed_date || b.created_date) - new Date(a.processed_date || a.created_date));
  const lastWd = completedWithdrawals[0];
  const baseLockDate = lastWd ? new Date(lastWd.processed_date || lastWd.created_date) : new Date(user.salary_date_set_date || user.created_date);
  const unlockDate = new Date(baseLockDate);
  unlockDate.setMonth(unlockDate.getMonth() + 6);
  const canWithdraw = new Date() >= unlockDate;
  const hasPendingWithdrawal = transactions.some((t) => t.type === "withdrawal" && t.status === "pending");
  const payee = resolvePayee(team, settings);

  if (loading || !settings) return <NeuPageLoader />;

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2 mb-1">
        <WalletIcon className="w-5 h-5 text-sdl-orange" />
        <h2 className="text-lg font-bold sdl-gradient-text">Saving Wallet</h2>
      </div>

      {/* Balance Card */}
      <div className="neu-card p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Total Savings Balance</span>
        </div>
        <p className="text-3xl font-bold sdl-gradient-text">{formatINR(balance)}</p>
        <div className="flex gap-3 mt-4">
          <button onClick={() => setModal("deposit")} className="sdl-gradient flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-white font-semibold text-sm shadow-lg active:scale-95 transition-transform">
            <Plus className="w-4 h-4" /> Deposit
          </button>
          <button
            onClick={() => {
              if (hasPendingWithdrawal) { alert("You already have a withdrawal request under verification."); return; }
              if (canWithdraw) setModal("withdraw");
              else alert("Withdrawal unlocks 6 months after registration or your last withdrawal.");
            }}
            className={`neu-btn flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium ${canWithdraw && !hasPendingWithdrawal ? "text-slate-700" : "text-slate-400"}`}
          >
            {canWithdraw && !hasPendingWithdrawal ? <ArrowUpRight className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            Withdraw
          </button>
        </div>
        {!canWithdraw && (
          <div className="mt-3 neu-inset-sm rounded-xl p-3 flex items-center gap-2 text-xs text-amber-600">
            <Lock className="w-3 h-3" /> {lastWd ? "Next withdrawal unlocks on" : "Withdrawal unlocks on"} {formatDate(unlockDate.toISOString())}
          </div>
        )}
        {hasPendingWithdrawal && (
          <div className="mt-3 neu-inset-sm rounded-xl p-3 flex items-center gap-2 text-xs text-amber-600">
            <Clock className="w-3 h-3" /> A withdrawal request is under verification.
          </div>
        )}
      </div>

      {/* Info */}
      <div className="neu-card p-4">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-sdl-orange mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            Earn {settings?.savings_percentage || 1}% of every loan repayment into your wallet. Withdraw 6 months after registration or your last withdrawal.
          </p>
        </div>
      </div>

      {/* Pending */}
      {pendingTxns.length > 0 && (
        <div className="neu-card p-5">
          <h3 className="text-sm font-bold text-slate-600 mb-3">Pending (Verification within 24h)</h3>
          <div className="space-y-2">
            {pendingTxns.map((t) => (
              <div key={t.id} className="neu-inset-sm rounded-xl p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 capitalize">{t.type.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(t.created_date)}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-600">{formatINR(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div className="neu-card p-5">
        <h3 className="text-sm font-bold text-slate-600 mb-3">Transaction History</h3>
        {transactions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No transactions yet.</p>
        ) : (
          <>
            <div className="space-y-2">
              {transactions.slice(0, visible).map((t) => <TxnRow key={t.id} t={t} />)}
            </div>
            {transactions.length > visible && (
              <button onClick={() => setVisible((v) => v + 8)} className="w-full mt-3 neu-btn h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500">
                <ChevronDown className="w-4 h-4" /> View More
              </button>
            )}
          </>
        )}
      </div>

      {modal && (
        <WalletModal
          type={modal}
          settings={settings}
          payee={payee}
          balance={balance}
          user={user}
          onClose={() => setModal(null)}
          onSubmitted={() => { setModal(null); loadData(); }}
        />
      )}
    </div>
  );
}

function TxnRow({ t }) {
  const isOut = t.type === "withdrawal";
  const completed = t.status === "completed";
  const icon = isOut ? ArrowUpRight : (t.type === "referral_earning" ? Gift : ArrowDownLeft);
  const Icon = icon;
  return (
    <div className="neu-inset-sm rounded-xl p-3 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOut ? "bg-red-100" : "bg-green-100"}`}>
          <Icon className={`w-4 h-4 ${isOut ? "text-sdl-red" : "text-sdl-green"}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 capitalize">{t.type.replace(/_/g, " ")}</p>
          <p className="text-[10px] text-slate-400">{formatDate(t.created_date)} • {t.status}</p>
        </div>
      </div>
      <span className={`text-sm font-semibold ${isOut ? "text-sdl-red" : "text-sdl-green"}`}>
        {isOut ? "-" : "+"}{formatINR(t.amount)}
      </span>
    </div>
  );
}

function WalletModal({ type, settings, payee, balance, user, onClose, onSubmitted }) {
  const isDeposit = type === "deposit";
  const [amount, setAmount] = useState(isDeposit ? 100 : "");
  const [screenshot, setScreenshot] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // For deposit: active payee QR. For withdraw: show user's UPI for admin to pay
  const qrUrl = isDeposit
    ? upiQrUrl(payee.upiId, amount, payee.upiName)
    : null;

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) { alert("JPG/PNG only"); return; }
    setUploading(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      setScreenshot(file_url);
    } catch { alert("Upload failed"); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (isDeposit && !screenshot) { alert("Upload payment screenshot"); return; }
    if (!amount || (isDeposit && amount < 100)) { alert(isDeposit ? "Minimum ₹100" : "Enter amount"); return; }
    if (!isDeposit && amount > balance) { alert("Insufficient balance"); return; }
    setSubmitting(true);
    try {
      await db.entities.WalletTransaction.create({
        user_id: user.id,
        type: isDeposit ? "deposit" : "withdrawal",
        amount: Number(amount),
        status: "pending",
        screenshot_url: screenshot,
        description: isDeposit ? "Wallet deposit" : `Withdrawal to UPI: ${user.upi_id}`,
      });
      setStep(3);
    } catch (e) { alert("Failed: " + (e.message || "error")); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">{isDeposit ? "Deposit to Wallet" : "Withdraw Savings"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Amount (₹)</label>
              <NeuInput type="number" min={isDeposit ? 100 : 1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={isDeposit ? "Min ₹100" : `Max ${formatINR(balance)}`} />
            </div>
            {isDeposit ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-center"><UpiVerifiedBadge name={payee.upiName} /></div>
                  <div className="neu-card-sm p-4 rounded-2xl flex justify-center">
                    <img src={qrUrl} alt="Deposit QR" className="w-52 h-52 rounded-xl" />
                  </div>
                  <p className="text-xs text-slate-500 text-center">Scan to pay {formatINR(amount || 0)} • UPI: {payee.upiId}</p>
                </div>
                <button onClick={() => setStep(2)} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg">I've Paid - Upload Proof</button>
              </>
            ) : (
              <>
                <div className="neu-inset rounded-2xl p-4 text-sm">
                  <p className="text-slate-500 mb-1">Your withdrawal will be sent to your UPI ID:</p>
                  <p className="font-mono font-semibold text-slate-700">{user.upi_id || "Not set"}</p>
                </div>
                <p className="text-xs text-slate-500">Admin will verify and pay within 24 hours.</p>
                <NeuButton variant="gradient" loading={submitting} onClick={submit} className="w-full h-12 rounded-2xl">Request Withdrawal</NeuButton>
              </>
            )}
          </div>
        )}

        {step === 2 && isDeposit && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 text-center">Upload payment screenshot</p>
            <label className="block">
              <div className={`neu-inset rounded-2xl h-40 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${screenshot ? "border-2 border-sdl-green" : ""}`}>
                {uploading ? <Loader2 className="w-6 h-6 text-sdl-orange animate-spin" /> :
                  screenshot ? <><img src={screenshot} alt="" className="absolute inset-0 w-full h-full object-cover" /><div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-sdl-green flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-white" /></div></> :
                  <><Upload className="w-6 h-6 text-slate-400 mb-1" /><span className="text-xs text-slate-400">JPG / PNG</span></>
                }
                <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleFile} className="hidden" />
              </div>
            </label>
            <NeuButton variant="gradient" loading={submitting} disabled={!screenshot} onClick={submit} className="w-full h-12 rounded-2xl">Submit for Verification</NeuButton>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full sdl-gradient mx-auto flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-white" /></div>
            <h4 className="text-base font-bold text-slate-700">{isDeposit ? "Deposit Submitted!" : "Withdrawal Requested!"}</h4>
            <p className="text-sm text-slate-500">Your request is under verification. It will be confirmed within 24 hours.</p>
            <button onClick={onSubmitted} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}