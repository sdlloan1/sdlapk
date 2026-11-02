const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from "react";

import { formatINR, formatDate, monthKey } from "@/lib/sdlUtils";
import NeuInput from "@/components/NeuInput";
import { TrendingUp, HandCoins, PiggyBank, Plus, X, Loader2, Calendar, Coins, Wallet, ChevronDown, AlertCircle, ArrowUpRight } from "lucide-react";
import { cachedAggregate, invalidateAggregate } from "@/lib/aggregateCache";
import InvestmentStrategy from "@/components/admin/InvestmentStrategy";
import MonthlyTarget from "@/components/admin/MonthlyTarget";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(mk) {
  const [y, m] = mk.split("-");
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
}

export default function AdminDashboard() {
  const [capitalAgg, setCapitalAgg] = useState({ rows: [] });
  const [loanAgg, setLoanAgg] = useState({ rows: [] });
  const [walletAgg, setWalletAgg] = useState({ rows: [] });
  const [assignmentAgg, setAssignmentAgg] = useState({ rows: [] });
  const [capital, setCapital] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showProfitWithdraw, setShowProfitWithdraw] = useState(false);
  const [showProfitList, setShowProfitList] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));

  const loadData = async () => {
    setError(false);
    try {
      // One at a time + cached, so the aggregate rate limit is never hit in a burst
      setCapitalAgg(await cachedAggregate("capital", () => db.entities.AdminCapital.aggregate({
        dateBucket: { field: "created_date", unit: "month" },
        groupBy: "type",
        sum: "amount",
      })));
      setLoanAgg(await cachedAggregate("loans", () => db.entities.LoanApplication.aggregate({
        dateBucket: { field: "created_date", unit: "month" },
        groupBy: "status",
        sum: ["amount", "repayment_amount"],
      })));
      setWalletAgg(await cachedAggregate("wallet", () => db.entities.WalletTransaction.aggregate({
        query: { status: "completed" },
        dateBucket: { field: "created_date", unit: "month" },
        groupBy: "type",
        sum: "amount",
      })));
      setAssignmentAgg(await cachedAggregate("assignments", () => db.entities.PartnerLoanAssignment.aggregate({
        dateBucket: { field: "created_date", unit: "month" },
        sum: "profit_earned",
      })));

      const capList = await db.entities.AdminCapital.list("-created_date", 10);
      setCapital(capList);
    } catch (e) {
      setError(true);
    }
    setLoading(false);
  };

  const refreshAfterCapitalChange = () => {
    invalidateAggregate("capital");
    setLoading(true);
    loadData();
  };

  useEffect(() => { loadData(); }, []);

  // Month-wise aggregation (each month starts at 0).
  const monthly = useMemo(() => {
    const map = {};
    const ensure = (mk) => {
      if (!map[mk]) map[mk] = { disbursed: 0, profit: 0, repaid: 0, deposited: 0, withdrawn: 0, savings: 0, partnerProfit: 0, newLoans: 0, activeLoans: 0, rejected: 0 };
      return map[mk];
    };
    capitalAgg.rows.forEach((r) => {
      const m = ensure(monthKey(new Date(r.created_date)));
      if (r.type === "disbursement") m.disbursed += r.sum_amount;
      else if (r.type === "repayment_principal") m.repaid += r.sum_amount;
      else if (r.type === "repayment_interest") m.profit += r.sum_amount;
      else if (r.type === "deposit") m.deposited += r.sum_amount;
      else if (r.type === "withdrawal") m.withdrawn += r.sum_amount;
    });
    walletAgg.rows.forEach((r) => {
      if (r.type === "savings_back") ensure(monthKey(new Date(r.created_date))).savings += r.sum_amount || 0;
    });
    assignmentAgg.rows.forEach((r) => {
      if (r.sum_profit_earned) ensure(monthKey(new Date(r.created_date))).partnerProfit += r.sum_profit_earned;
    });
    loanAgg.rows.forEach((r) => {
      const m = ensure(monthKey(new Date(r.created_date)));
      m.newLoans += r.count;
      if (["disbursed", "pending_verification", "repaid", "overdue"].includes(r.status)) m.activeLoans += r.count;
      if (r.status === "rejected") m.rejected += r.count;
    });
    return map;
  }, [capitalAgg, loanAgg, walletAgg, assignmentAgg]);

  const allMonths = useMemo(() => {
    const keys = new Set(Object.keys(monthly));
    keys.add(monthKey(new Date()));
    return Array.from(keys).sort().reverse();
  }, [monthly]);

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;
  if (error) {
    return (
      <div className="neu-card p-6 text-center">
        <p className="text-sm text-slate-500 mb-3">Too many requests right now. Please wait a moment and try again.</p>
        <button onClick={() => { setLoading(true); loadData(); }} className="sdl-gradient px-5 py-2 rounded-xl text-white text-xs font-semibold">Retry</button>
      </div>
    );
  }

  // ---- All-time (fixed) totals (from aggregate rows) ----
  let totalDeposited = 0, totalWithdrawn = 0, totalDisbursed = 0, totalRepaidPrincipal = 0, totalProfit = 0;
  capitalAgg.rows.forEach((r) => {
    if (r.type === "deposit") totalDeposited += r.sum_amount;
    else if (r.type === "withdrawal") totalWithdrawn += r.sum_amount;
    else if (r.type === "disbursement") totalDisbursed += r.sum_amount;
    else if (r.type === "repayment_principal") totalRepaidPrincipal += r.sum_amount;
    else if (r.type === "repayment_interest") totalProfit += r.sum_amount;
  });
  const totalPartnerProfit = assignmentAgg.rows.reduce((s, r) => s + (r.sum_profit_earned || 0), 0);
  const totalRealProfit = totalProfit - totalPartnerProfit;
  let totalSavingWallet = 0;
  walletAgg.rows.forEach((r) => {
    if (r.type === "withdrawal") totalSavingWallet -= r.sum_amount;
    else totalSavingWallet += r.sum_amount;
  });
  const currentCapital = totalDeposited - totalWithdrawn - totalDisbursed + totalRepaidPrincipal + totalProfit;

  // Pending = total principal of all distributed (disbursed but not yet repaid) loans.
  let totalPendingAmount = 0, totalUpcomingAmount = 0;
  loanAgg.rows.forEach((r) => {
    if (["disbursed", "pending_verification", "overdue"].includes(r.status)) {
      totalPendingAmount += r.sum_amount || 0;
      totalUpcomingAmount += r.sum_repayment_amount || 0;
    }
  });

  // ---- Selected month (starts at 0) ----
  const cur = monthly[selectedMonth] || { disbursed: 0, profit: 0, repaid: 0, deposited: 0, withdrawn: 0, savings: 0, partnerProfit: 0, newLoans: 0, activeLoans: 0, rejected: 0 };
  const curRealProfit = cur.profit - cur.partnerProfit;

  // Chart data: last 6 months ascending.
  const chartMonths = allMonths.slice(0, 6).reverse();
  const chartData = chartMonths.map((mk) => ({
    month: monthLabel(mk),
    Disbursed: monthly[mk]?.disbursed || 0,
    Repaid: monthly[mk]?.repaid || 0,
    Profit: monthly[mk]?.profit || 0,
  }));

  const fixedCards = [
    { icon: PiggyBank, label: "Current Capital", value: formatINR(currentCapital), bg: "sdl-gradient", iconColor: "text-white" },
    { icon: Wallet, label: "Total Saving Wallet", value: formatINR(totalSavingWallet), bg: "bg-cyan-100", iconColor: "text-cyan-600" },
    { icon: HandCoins, label: "Total Partner Profit", value: formatINR(totalPartnerProfit), bg: "bg-orange-100", iconColor: "text-orange-600" },
    { icon: AlertCircle, label: "Total Pending Amount", value: formatINR(totalPendingAmount), bg: "bg-red-100", iconColor: "text-sdl-red" },
    { icon: ArrowUpRight, label: "Total Upcoming Amount", value: formatINR(totalUpcomingAmount), bg: "bg-indigo-100", iconColor: "text-indigo-600" },
  ];

  return (
    <div className="space-y-4">
      {/* Fixed summary — always visible */}
      <div>
        <h3 className="text-sm font-bold text-slate-600 mb-2">Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fixedCards.map((c) => (
            <SummaryCard key={c.label} icon={c.icon} label={c.label} value={c.value} bg={c.bg} iconColor={c.iconColor} />
          ))}
        </div>
      </div>

      {/* Monthly distribution target */}
      <MonthlyTarget monthly={monthly} allMonths={allMonths} />

      {/* Investment strategy calculator */}
      <InvestmentStrategy />

      {/* Month selector */}
      <div className="neu-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-sdl-orange" />
          <h3 className="text-sm font-bold text-slate-600">Month-wise Details</h3>
        </div>
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="neu-input w-full h-11 px-3 text-sm text-slate-700 rounded-xl appearance-none pr-10"
          >
            {allMonths.length === 0 && <option value={selectedMonth}>{monthLabel(selectedMonth)}</option>}
            {allMonths.map((mk) => (
              <option key={mk} value={mk}>{monthLabel(mk)}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Selected month breakdown — resets each month, except Pending & Upcoming show totals */}
      <div className="neu-card p-5">
        <h3 className="text-sm font-bold text-slate-600 mb-3">{monthLabel(selectedMonth)} — Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MonthStat label="Distribution" value={formatINR(cur.disbursed)} color="text-blue-600" />
          <MonthStat label="Profit" value={formatINR(cur.profit)} color="text-sdl-green" />
          <MonthStat label="Real Profit" value={formatINR(curRealProfit)} color="text-sdl-orange" />
          <MonthStat label="Repaid (Principal)" value={formatINR(cur.repaid)} color="text-slate-700" />
          <MonthStat label="Deposited" value={formatINR(cur.deposited)} color="text-violet-600" />
          <MonthStat label="Withdrawn" value={formatINR(cur.withdrawn)} color="text-sdl-red" />
          <MonthStat label="Saving Wallet" value={formatINR(cur.savings)} color="text-cyan-600" />
          <MonthStat label="Partner Profit" value={formatINR(cur.partnerProfit)} color="text-orange-600" />
          <MonthStat label="New Loans" value={String(cur.newLoans)} color="text-slate-700" />
          <MonthStat label="Active Loans" value={String(cur.activeLoans)} color="text-blue-600" />
          <MonthStat label="Pending Amount" value={formatINR(totalPendingAmount)} color="text-sdl-red" total />
          <MonthStat label="Upcoming Amount" value={formatINR(totalUpcomingAmount)} color="text-indigo-600" total />
        </div>
      </div>

      {/* 6-month trend chart */}
      <div className="neu-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-sdl-orange" />
          <h3 className="text-sm font-bold text-slate-600">6-Month Trend</h3>
        </div>
        {chartData.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No data yet.</p>
        ) : (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={{ stroke: "#CBD5E1" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Disbursed" fill="#FF8C42" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Repaid" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#FF4B2B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="neu-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-600">Capital Management</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowProfitList(true)} className="bg-slate-200 px-4 py-2 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1">
              <Coins className="w-3 h-3" /> Withdrawals
            </button>
            <button onClick={() => setShowProfitWithdraw(true)} className="bg-sdl-green px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1 shadow-lg">
              <Wallet className="w-3 h-3" /> Withdraw Profit
            </button>
            <button onClick={() => setShowAdd(true)} className="sdl-gradient px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1 shadow-lg">
              <Plus className="w-3 h-3" /> Add / Withdraw
            </button>
          </div>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {capital.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No capital transactions yet.</p> :
            capital.slice(0, 10).map((c) => (
              <div key={c.id} className="neu-inset-sm rounded-xl p-3 flex justify-between items-center gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 capitalize truncate">{c.type.replace(/_/g, " ")}</p>
                  <p className="text-[10px] text-slate-400 truncate">{formatDate(c.created_date)} {c.description ? `• ${c.description}` : ""}</p>
                </div>
                <span className={`text-sm font-semibold shrink-0 whitespace-nowrap ${["withdrawal", "disbursement"].includes(c.type) ? "text-sdl-red" : "text-sdl-green"}`}>
                  {["withdrawal", "disbursement"].includes(c.type) ? "-" : "+"}{formatINR(c.amount)}
                </span>
              </div>
            ))}
        </div>
      </div>

      {showAdd && <AddCapitalModal onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); refreshAfterCapitalChange(); }} />}
      {showProfitWithdraw && <ProfitWithdrawModal onClose={() => setShowProfitWithdraw(false)} onDone={() => { setShowProfitWithdraw(false); refreshAfterCapitalChange(); }} maxProfit={totalRealProfit} />}
      {showProfitList && <ProfitListModal onClose={() => setShowProfitList(false)} capital={capital} />}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, bg, iconColor }) {
  return (
    <div className="neu-card p-4">
      <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center mb-2`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="text-base font-bold text-slate-700">{value}</p>
    </div>
  );
}

function MonthStat({ label, value, color, total }) {
  return (
    <div className="neu-inset-sm rounded-xl p-3">
      <div className="flex items-center gap-1">
        <p className="text-[10px] text-slate-400">{label}</p>
        {total && <span className="text-[8px] font-bold text-sdl-orange bg-orange-100 px-1.5 py-0.5 rounded-full">TOTAL</span>}
      </div>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

function AddCapitalModal({ onClose, onDone }) {
  const [type, setType] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!amount || Number(amount) <= 0) { alert("Enter valid amount"); return; }
    setLoading(true);
    try {
      await db.entities.AdminCapital.create({
        type, amount: Number(amount), description: description.trim(), month_key: monthKey(new Date()),
      });
      onDone();
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">Add / Withdraw Capital</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setType("deposit")} className={`flex-1 h-11 rounded-xl text-sm font-medium ${type === "deposit" ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>Deposit</button>
            <button onClick={() => setType("withdrawal")} className={`flex-1 h-11 rounded-xl text-sm font-medium ${type === "withdrawal" ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>Withdraw</button>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Amount (₹)</label>
            <NeuInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Description (optional)</label>
            <NeuInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Note" />
          </div>
          <button onClick={submit} disabled={loading} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfitWithdrawModal({ onClose, onDone, maxProfit }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { alert("Enter valid amount"); return; }
    if (amt > maxProfit) { alert("Cannot withdraw more than available real profit"); return; }
    setLoading(true);
    try {
      await db.entities.AdminCapital.create({
        type: "withdrawal",
        amount: amt,
        description: description.trim() || "Admin profit withdrawal",
        month_key: monthKey(new Date()),
      });
      onDone();
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">Withdraw Profit</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="neu-inset-sm rounded-xl p-3 mb-4 flex justify-between items-center">
          <span className="text-xs text-slate-500">Available Real Profit</span>
          <span className="text-sm font-bold text-sdl-green">{formatINR(maxProfit)}</span>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Amount to Withdraw (₹)</label>
            <NeuInput type="number" max={maxProfit} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Description (optional)</label>
            <NeuInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Note" />
          </div>
          <button onClick={submit} disabled={loading} className="bg-sdl-green w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wallet className="w-4 h-4" /> Withdraw Profit</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfitListModal({ onClose, capital }) {
  const withdrawals = capital.filter((c) => c.type === "withdrawal");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">Profit Withdrawals</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        {withdrawals.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No profit withdrawals yet.</p>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((w) => (
              <div key={w.id} className="neu-inset-sm rounded-xl p-3 flex justify-between items-center gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-sdl-red">{formatINR(w.amount)}</p>
                  <p className="text-[10px] text-slate-400 truncate">{formatDate(w.created_date)} {w.description ? `• ${w.description}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}