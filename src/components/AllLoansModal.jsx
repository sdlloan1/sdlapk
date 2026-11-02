import React, { useState, useMemo } from "react";
import { formatINR, formatDate } from "@/lib/sdlUtils";
import { X, ChevronDown, ChevronUp, Calendar } from "lucide-react";

function istDate(iso) {
  let s = String(iso || "");
  if (!s.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(s)) s += "Z";
  return new Date(s);
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function groupKey(iso, mode) {
  const d = istDate(iso);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).formatToParts(d);
  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  return mode === "year" ? y : `${y}-${m}`;
}

function groupLabel(key, mode) {
  if (mode === "year") return key;
  const [y, m] = key.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

const STATUS_META = {
  pending_disbursement: { label: "Pending", color: "text-amber-600" },
  disbursed: { label: "Active", color: "text-blue-600" },
  pending_verification: { label: "Pending", color: "text-amber-600" },
  repaid: { label: "Repaid", color: "text-sdl-green" },
  overdue: { label: "Overdue", color: "text-sdl-red" },
  rejected: { label: "Rejected", color: "text-sdl-red" },
};

export default function AllLoansModal({ loans = [], onClose }) {
  const [mode, setMode] = useState("month");
  const [open, setOpen] = useState({});

  const groups = useMemo(() => {
    const map = {};
    loans.forEach((l) => {
      const k = groupKey(l.created_date, mode);
      if (!map[k]) map[k] = [];
      map[k].push(l);
    });
    return Object.keys(map)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((k) => ({ key: k, label: groupLabel(k, mode), items: map[k] }));
  }, [loans, mode]);

  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">All Loans</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="neu-inset-sm rounded-xl p-1 flex mb-4">
          <button onClick={() => setMode("month")} className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-colors ${mode === "month" ? "sdl-gradient text-white" : "text-slate-500"}`}>By Month</button>
          <button onClick={() => setMode("year")} className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-colors ${mode === "year" ? "sdl-gradient text-white" : "text-slate-500"}`}>By Year</button>
        </div>

        {groups.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No loans found.</p>
        ) : (
          <div className="space-y-3">
            {groups.map((g, i) => {
              const isOpen = open[g.key] !== undefined ? open[g.key] : i === 0;
              return (
                <div key={g.key} className="neu-inset-sm rounded-xl overflow-hidden">
                  <button onClick={() => toggle(g.key)} className="w-full flex items-center justify-between p-3">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-sdl-orange" />{g.label}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{g.items.length} loan{g.items.length !== 1 ? "s" : ""}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-2 pb-2 space-y-1.5">
                      {g.items.map((l) => {
                        const meta = STATUS_META[l.status] || { label: l.status, color: "text-slate-500" };
                        return (
                          <div key={l.id} className="neu-card-sm rounded-xl p-2.5 flex justify-between items-center">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{formatINR(l.amount)}</p>
                              {l.loan_id && <p className="text-[10px] font-mono text-sdl-orange">ID: {l.loan_id}</p>}
                              <p className="text-[10px] text-slate-400">Loan: {formatDate(l.created_date)}</p>
                              <p className="text-[10px] text-slate-400">Due: {formatDate(l.due_date)}</p>
                            </div>
                            <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}