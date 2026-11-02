const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from "react";

import { formatINR, calcRepayment } from "@/lib/sdlUtils";
import NeuInput from "@/components/NeuInput";
import { PiggyBank, TrendingUp, Wallet, Calculator, Target, Loader2, ChevronDown } from "lucide-react";
import { ComposedChart, Area, Bar, Line, ReferenceLine, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function InvestmentStrategy() {
  const [settings, setSettings] = useState(null);
  const [principal, setPrincipal] = useState(10000);
  const [months, setMonths] = useState(12);
  const [target, setTarget] = useState(2000);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    db.entities.AppSettings.list().then((s) => setSettings(s[0] || {})).catch(() => setSettings({}));
  }, []);

  const firstCycle = useMemo(() => calcRepayment(principal, settings || {}), [principal, settings]);
  const netProfitRate = firstCycle.principal > 0
    ? (firstCycle.interest + firstCycle.portalCharge + firstCycle.processingFee - firstCycle.savingsBack) / firstCycle.principal
    : 0;

  const { rows, totalProfit, finalFund, totalInvested, monthsToTarget } = useMemo(() => {
    const n = Math.max(1, Math.min(60, Number(months) || 0));
    const tgt = Number(target) || 0;
    const p = Number(principal) || 0;
    const s = settings || {};
    const rate = ((Number(s.interest_rate) || 2) + (Number(s.portal_charge_percentage) || 8) + (Number(s.processing_fee_percentage) || 9) - (Number(s.savings_percentage) || 1)) / 100;
    const round2 = (v) => Math.round(v * 100) / 100;
    const out = [];
    let fund = 0;
    let lastProfit = 0;
    let reachedAt = null;
    for (let m = 1; m <= n; m++) {
      fund += p; // add monthly investment
      const investBase = fund;
      const profit = round2(fund * rate);
      fund = round2(fund + profit); // reinvest profit
      if (reachedAt === null && tgt > 0 && profit >= tgt) reachedAt = m;
      out.push({ month: `M${m}`, base: investBase, investment: p, profit, fund, target: tgt });
      lastProfit = profit;
    }
    return { rows: out, totalProfit: lastProfit, finalFund: fund, totalInvested: p * n, monthsToTarget: reachedAt };
  }, [principal, months, target, settings]);

  if (!settings) {
    return (
      <div className="neu-card p-5 flex items-center justify-center gap-2 text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading rates...
      </div>
    );
  }

  const targetMet = monthsToTarget !== null;

  return (
    <div className="neu-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-sdl-orange" />
        <h3 className="text-sm font-bold text-slate-600">Investment Strategy (SDL Loan Model)</h3>
      </div>
      <p className="text-[11px] text-slate-400 mb-3">Invests a fixed amount every month, earns profit per the app's loan charges, and reinvests the entire fund (principal + profit) each cycle.</p>

      {/* Inputs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">Investment (₹)</label>
          <NeuInput type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">Period (months)</label>
          <NeuInput type="number" value={months} onChange={(e) => setMonths(e.target.value)} />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">Monthly Target (₹)</label>
          <NeuInput type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
      </div>

      {/* First-cycle breakdown (as per app calculation) */}
      <div className="neu-inset rounded-2xl p-4 mb-4">
        <p className="text-[11px] font-semibold text-slate-500 mb-2">First Cycle Breakdown (per app rates: interest {settings.interest_rate ?? 2}%, portal {settings.portal_charge_percentage ?? 8}%, processing {settings.processing_fee_percentage ?? 9}%, savings {settings.savings_percentage ?? 1}%)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <BreakdownRow label="Interest" value={formatINR(firstCycle.interest)} color="text-sdl-green" />
          <BreakdownRow label="Portal Charge" value={formatINR(firstCycle.portalCharge)} color="text-blue-600" />
          <BreakdownRow label="Processing Fee" value={formatINR(firstCycle.processingFee)} color="text-violet-600" />
          <BreakdownRow label="Savings Back (paid out)" value={formatINR(firstCycle.savingsBack)} color="text-sdl-red" />
          <BreakdownRow label="Net Profit / cycle" value={formatINR(firstCycle.interest + firstCycle.portalCharge + firstCycle.processingFee - firstCycle.savingsBack)} color="text-sdl-orange" bold />
          <BreakdownRow label="Repayment Received" value={formatINR(firstCycle.total)} color="text-slate-700" />
        </div>
      </div>

      {/* Result cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <ResultCard icon={PiggyBank} label="Total Invested" value={formatINR(totalInvested)} color="text-slate-700" />
        <ResultCard icon={TrendingUp} label="Total Profit" value={formatINR(totalProfit)} color="text-sdl-green" />
        <ResultCard icon={Wallet} label="Final Fund" value={formatINR(finalFund)} color="text-sdl-orange" />
        <ResultCard icon={Target} label="Target Reached" value={targetMet ? `Month ${monthsToTarget}` : "Not reached"} color={targetMet ? "text-sdl-green" : "text-sdl-red"} />
      </div>

      {/* Chart */}
      {rows.length > 0 && (
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gFund" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF8C42" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#FF8C42" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748B" }} axisLine={{ stroke: "#CBD5E1" }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="fund" name="Fund" stroke="#FF8C42" fill="url(#gFund)" strokeWidth={2} />
              <Bar dataKey="profit" name="Monthly Profit" fill="#22C55E" radius={[3, 3, 0, 0]} barSize={10} />
              {Number(target) > 0 && <ReferenceLine y={Number(target)} stroke="#FF4B2B" strokeDasharray="4 4" label={{ value: "Target", fontSize: 9, fill: "#FF4B2B", position: "insideTopRight" }} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Month-by-month toggle */}
      <button onClick={() => setShowTable((s) => !s)} className="neu-btn w-full h-10 rounded-xl text-xs font-medium text-slate-600 flex items-center justify-center gap-1 mt-2">
        {showTable ? "Hide" : "Show"} month-wise breakdown <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTable ? "rotate-180" : ""}`} />
      </button>
      {showTable && (
        <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto">
          {rows.map((r) => {
            const met = Number(target) > 0 && r.profit >= Number(target);
            return (
              <div key={r.month} className="neu-inset-sm rounded-xl p-2.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500 w-10">{r.month}</span>
                <span className="text-slate-600 flex-1">Invest {formatINR(r.investment)}</span>
                <span className={`flex-1 text-right ${met ? "text-sdl-green font-semibold" : "text-slate-600"}`}>Profit {formatINR(r.profit)}</span>
                <span className="text-right font-semibold text-slate-700 w-24">Fund {formatINR(r.fund)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResultCard({ icon: Icon, label, value, color }) {
  return (
    <div className="neu-inset-sm rounded-xl p-3">
      <div className="flex items-center gap-1 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <p className="text-[10px] text-slate-400">{label}</p>
      </div>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

function BreakdownRow({ label, value, color, bold }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">{label}</span>
      <span className={`${color} ${bold ? "font-bold" : "font-medium"}`}>{value}</span>
    </div>
  );
}