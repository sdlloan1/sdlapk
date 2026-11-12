import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { formatINR, formatDate, isOverdue, daysOverdue } from "@/lib/sdlUtils";
import PartnerDepositModal from "@/components/partner/PartnerDepositModal";
import PartnerWithdrawModal from "@/components/partner/PartnerWithdrawModal";
import { useNavigate } from "react-router-dom";
import { SDL_LOGO } from "@/lib/sdlUtils";
import {
  Wallet, TrendingUp, Lock, HandCoins, ArrowDownLeft, ArrowUpRight, Gift,
  Clock, AlertTriangle, ArrowRight, History
} from "lucide-react";

export default function PartnerDashboard({ user, settings, onUserUpdate }) {
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const loadData = async () => {
    const [deps, wds, assigns] = await Promise.all([
      base44.entities.PartnerDeposit.filter({ user_id: user.id }, "-created_date"),
      base44.entities.PartnerWithdrawal.filter({ user_id: user.id }, "-created_date"),
      base44.entities.PartnerLoanAssignment.filter({ partner_id: user.id }, "-created_date"),
    ]);
    setDeposits(deps);
    setWithdrawals(wds);
    setAssignments(assigns);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const approvedDeposits = deposits.filter((d) => d.status === "approved");
  const totalDeposited = approvedDeposits.reduce((s, d) => s + d.amount, 0);
  const activeAssignments = assignments.filter((a) => a.status === "active");
  const lockedAmount = activeAssignments.reduce((s, a) => s + a.loan_amount, 0);
  const availableCapital = totalDeposited - lockedAmount;

  const repaidAssignments = assignments.filter((a) => a.status === "repaid");
  const totalProfitEarned = repaidAssignments.reduce((s, a) => s + (a.profit_earned || 0) + (a.overdue_bonus || 0), 0);
  const approvedWithdrawals = withdrawals.filter((w) => w.status === "approved");
  const withdrawnAmount = approvedWithdrawals.reduce((s, w) => s + w.amount, 0);
  const availableProfit = totalProfitEarned - withdrawnAmount;

  const pendingDeposits = deposits.filter((d) => d.status === "pending");
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");

  if (loading) return (
    <div className="min-h-screen px-4 py-6 max-w-md mx-auto pb-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="neu-skeleton w-9 h-9 rounded-xl" />
        <div className="neu-skeleton w-10 h-10 rounded-xl" />
        <div className="space-y-1.5">
          <div className="neu-skeleton h-5 w-28 rounded-lg" />
          <div className="neu-skeleton h-3 w-20 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="neu-card p-4 space-y-3">
            <div className="neu-skeleton w-9 h-9 rounded-full" />
            <div className="neu-skeleton h-3 w-20 rounded-lg" />
            <div className="neu-skeleton h-5 w-24 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="neu-skeleton h-12 rounded-2xl" />
        <div className="neu-skeleton h-12 rounded-2xl" />
      </div>
      <div className="neu-card p-5 space-y-3">
        <div className="neu-skeleton h-4 w-32 rounded-lg" />
        <div className="neu-skeleton h-20 rounded-2xl" />
        <div className="neu-skeleton h-20 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6 max-w-md mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate("/")} className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center text-slate-500">
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
        <img src={SDL_LOGO} alt="SDL" className="w-10 h-10 rounded-xl object-cover" />
        <div>
          <h1 className="text-lg font-bold sdl-gradient-text leading-none">SDL Partner</h1>
          <p className="text-[10px] text-slate-400 leading-none mt-0.5">Dashboard</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="neu-card p-4">
          <div className="w-9 h-9 rounded-full sdl-gradient flex items-center justify-center mb-2">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <p className="text-[10px] text-slate-400">Available Capital</p>
          <p className="text-lg font-bold text-slate-700">{formatINR(availableCapital)}</p>
        </div>
        <div className="neu-card p-4">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center mb-2">
            <Lock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-[10px] text-slate-400">Locked in Loans</p>
          <p className="text-lg font-bold text-blue-600">{formatINR(lockedAmount)}</p>
        </div>
        <div className="neu-card p-4">
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-sdl-green" />
          </div>
          <p className="text-[10px] text-slate-400">Available Profit</p>
          <p className="text-lg font-bold text-sdl-green">{formatINR(availableProfit)}</p>
        </div>
        <div className="neu-card p-4">
          <div className="w-9 h-9 rounded-full sdl-gradient flex items-center justify-center mb-2">
            <HandCoins className="w-4 h-4 text-white" />
          </div>
          <p className="text-[10px] text-slate-400">Total Deposited</p>
          <p className="text-lg font-bold text-slate-700">{formatINR(totalDeposited)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button onClick={() => setShowDeposit(true)} className="sdl-gradient h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
          <ArrowDownLeft className="w-4 h-4" /> Deposit
        </button>
        <button onClick={() => setShowWithdraw(true)} className="neu-btn h-12 rounded-2xl text-slate-700 font-semibold text-sm flex items-center justify-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-sdl-orange" /> Withdraw
        </button>
      </div>

      {/* Pending items */}
      {(pendingDeposits.length > 0 || pendingWithdrawals.length > 0) && (
        <div className="neu-card p-4 mb-4">
          <h3 className="text-sm font-bold text-slate-600 mb-2">Pending Approvals</h3>
          {pendingDeposits.map((d) => (
            <div key={d.id} className="neu-inset-sm rounded-xl p-3 mb-2 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-slate-700">Deposit {formatINR(d.amount)}</p>
                <p className="text-[10px] text-slate-400">{formatDate(d.created_date)}</p>
              </div>
              <span className="text-xs font-medium text-amber-600 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
            </div>
          ))}
          {pendingWithdrawals.map((w) => (
            <div key={w.id} className="neu-inset-sm rounded-xl p-3 mb-2 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-slate-700">Withdrawal {formatINR(w.amount)}</p>
                <p className="text-[10px] text-slate-400">{formatDate(w.created_date)}</p>
              </div>
              <span className="text-xs font-medium text-amber-600 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
            </div>
          ))}
        </div>
      )}

      {/* Active Loans */}
      <div className="neu-card p-5 mb-4">
        <h3 className="text-sm font-bold text-slate-600 mb-3">Active Loans</h3>
        {activeAssignments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No active loans using your capital.</p>
        ) : (
          <div className="space-y-2">
            {activeAssignments.map((a) => {
              const overdue = isOverdue(a.due_date);
              const odDays = overdue ? daysOverdue(a.due_date) : 0;
              const odBonus = overdue ? Math.round((a.loan_amount * odDays * 0.5) / 100) : 0;
              return (
                <div key={a.id} className={`neu-inset-sm rounded-xl p-3 ${overdue ? "border-2 border-sdl-red" : ""}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{formatINR(a.loan_amount)}</p>
                      <p className="text-[10px] text-slate-400">Loan Date: {formatDate(a.created_date)}</p>
                      <p className="text-[10px] text-slate-400">Repay Date: {formatDate(a.due_date)}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${overdue ? "bg-red-100 text-sdl-red" : "bg-blue-100 text-blue-600"}`}>
                      {overdue ? `Overdue ${odDays}d` : "Active"}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Repayment: {formatINR(a.repayment_amount)}</span>
                    <span className="text-sdl-green font-semibold">Profit: {formatINR(a.profit_earned || 0)}</span>
                  </div>
                  {overdue && (
                    <p className="text-[10px] text-sdl-red mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Overdue bonus: {formatINR(odBonus)} (+0.5%/day)
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="neu-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-600">Transaction History</h3>
        </div>
        {deposits.length === 0 && withdrawals.length === 0 && repaidAssignments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {approvedDeposits.map((d) => (
              <TxnRow key={`d${d.id}`} type="Deposit" amount={d.amount} date={d.created_date} status={d.status} isIn={true} />
            ))}
            {pendingDeposits.map((d) => (
              <TxnRow key={`dp${d.id}`} type="Deposit" amount={d.amount} date={d.created_date} status={d.status} isIn={true} />
            ))}
            {repaidAssignments.map((a) => (
              <TxnRow key={`p${a.id}`} type="Profit" amount={(a.profit_earned || 0) + (a.overdue_bonus || 0)} date={a.repaid_date || a.created_date} status="approved" isIn={true} icon={Gift} />
            ))}
            {withdrawals.map((w) => (
              <TxnRow key={`w${w.id}`} type="Withdrawal" amount={w.amount} date={w.created_date} status={w.status} isIn={false} />
            ))}
          </div>
        )}
      </div>

      {showDeposit && <PartnerDepositModal user={user} settings={settings} onClose={() => setShowDeposit(false)} onSubmitted={() => { setShowDeposit(false); loadData(); }} />}
      {showWithdraw && <PartnerWithdrawModal user={user} availableCapital={availableCapital} availableProfit={availableProfit} deposits={deposits} withdrawals={withdrawals} onClose={() => setShowWithdraw(false)} onSubmitted={() => { setShowWithdraw(false); loadData(); }} />}
    </div>
  );
}

function TxnRow({ type, amount, date, status, isIn, icon: Icon }) {
  const statusMap = {
    approved: { color: "text-sdl-green", label: isIn ? "Completed" : "Paid" },
    pending: { color: "text-amber-600", label: "Pending" },
    rejected: { color: "text-sdl-red", label: "Rejected" },
  };
  const s = statusMap[status] || statusMap.pending;
  return (
    <div className="neu-inset-sm rounded-xl p-3 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isIn ? "bg-green-100" : "bg-red-100"}`}>
          {Icon ? <Icon className="w-3.5 h-3.5 text-sdl-green" /> :
            isIn ? <ArrowDownLeft className="w-3.5 h-3.5 text-sdl-green" /> : <ArrowUpRight className="w-3.5 h-3.5 text-sdl-red" />}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-700">{type}</p>
          <p className="text-[10px] text-slate-400">{formatDate(date)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-xs font-semibold ${isIn ? "text-sdl-green" : "text-sdl-red"}`}>{isIn ? "+" : "-"}{formatINR(amount)}</p>
        <p className={`text-[10px] ${s.color}`}>{s.label}</p>
      </div>
    </div>
  );
}