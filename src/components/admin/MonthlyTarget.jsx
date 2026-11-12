import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { formatINR, monthKey } from "@/lib/sdlUtils";
import NeuInput from "@/components/NeuInput";
import { Target, Loader2, X, CheckCircle2, ChevronDown, Calendar, Pencil, Trash2 } from "lucide-react";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(mk) {
  const [y, m] = mk.split("-");
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
}

export default function MonthlyTarget({ monthly, allMonths }) {
  // targets: { "2026-11": { id, amount } } — stored in the MonthlyTarget entity
  const [targets, setTargets] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));
  const [showSet, setShowSet] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTargets = async () => {
    try {
      const rows = await base44.entities.MonthlyTarget.list("-created_date", 500);
      const map = {};
      rows.forEach((r) => {
        if (r.month_key) map[r.month_key] = { id: r.id, amount: Number(r.amount) || 0 };
      });
      setTargets(map);
    } catch (e) {
      setTargets({});
    }
    setLoading(false);
  };

  useEffect(() => { loadTargets(); }, []);

  const availableMonths = useMemo(() => {
    const keys = new Set(allMonths || []);
    Object.keys(targets).forEach((k) => keys.add(k));
    keys.add(monthKey(new Date()));
    // Add 12 future months for advance target setting
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      keys.add(monthKey(new Date(now.getFullYear(), now.getMonth() + i, 1)));
    }
    return Array.from(keys).sort().reverse();
  }, [allMonths, targets]);

  const currentTarget = targets[selectedMonth]?.amount || 0;
  const distributed = monthly[selectedMonth]?.disbursed || 0;
  const progress = currentTarget > 0 ? Math.min(100, (distributed / currentTarget) * 100) : 0;
  const completed = currentTarget > 0 && distributed >= currentTarget;

  const openSet = (mk = selectedMonth) => {
    const saved = targets[mk]?.amount || 0;
    setTargetInput(saved ? String(saved) : "");
    setShowSet(true);
  };

  const removeTarget = async (mk) => {
    const existing = targets[mk];
    if (!existing) return;
    if (!window.confirm(`Delete the target for ${monthLabel(mk)}?`)) return;
    setSaving(true);
    try {
      await base44.entities.MonthlyTarget.delete(existing.id);
      const updated = { ...targets };
      delete updated[mk];
      setTargets(updated);
    } catch (e) { alert("Failed to delete target"); }
    finally { setSaving(false); }
  };

  const save = async () => {
    const val = Number(targetInput) || 0;
    setSaving(true);
    try {
      const existing = targets[selectedMonth];
      if (val > 0) {
        if (existing) {
          await base44.entities.MonthlyTarget.update(existing.id, { amount: val });
          setTargets({ ...targets, [selectedMonth]: { id: existing.id, amount: val } });
        } else {
          const created = await base44.entities.MonthlyTarget.create({ month_key: selectedMonth, amount: val });
          setTargets({ ...targets, [selectedMonth]: { id: created.id, amount: val } });
        }
      } else if (existing) {
        await base44.entities.MonthlyTarget.delete(existing.id);
        const updated = { ...targets };
        delete updated[selectedMonth];
        setTargets(updated);
      }
      setShowSet(false);
    } catch (e) { alert("Failed to save target"); }
    finally { setSaving(false); }
  };

  const targetMonths = Object.keys(targets).sort().reverse();

  return (
    <div className="neu-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full sdl-gradient flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-bold text-slate-600">Monthly Distribution Target</h3>
        </div>
        <button onClick={() => openSet()} className="neu-btn px-3 h-9 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-1">
          <Target className="w-3 h-3" /> {currentTarget > 0 ? "Update" : "Set Target"}
        </button>
      </div>

      {/* Month selector */}
      <div className="relative mb-4">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="neu-input w-full h-11 px-3 text-sm text-slate-700 rounded-xl appearance-none pr-10"
        >
          {availableMonths.map((mk) => (
            <option key={mk} value={mk}>{monthLabel(mk)}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>

      {/* Selected month progress */}
      {loading ? (
        <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
      ) : currentTarget > 0 ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Distributed: <span className="font-semibold text-slate-700">{formatINR(distributed)}</span></span>
            <span className="text-xs text-slate-500">Target: <span className="font-semibold text-slate-700">{formatINR(currentTarget)}</span></span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${completed ? "bg-sdl-green" : "sdl-gradient"}`} style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-medium text-slate-500">{progress.toFixed(0)}% completed</span>
            {completed ? (
              <span className="text-xs font-bold text-sdl-green flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Goal Completed!
              </span>
            ) : (
              <span className="text-xs text-slate-400">{formatINR(currentTarget - distributed)} to go</span>
            )}
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-400 text-center py-3">No target set for {monthLabel(selectedMonth)}. Click "Set Target" to define a goal.</p>
      )}

      {/* All targets list */}
      {targetMonths.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> All Saved Targets
          </p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {targetMonths.map((mk) => {
              const t = targets[mk]?.amount || 0;
              const d = monthly[mk]?.disbursed || 0;
              const done = t > 0 && d >= t;
              return (
                <div key={mk} className="neu-inset-sm rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 w-20">{monthLabel(mk)}</span>
                  <span className="text-slate-500 flex-1 text-center">Target {formatINR(t)}</span>
                  <span className="text-slate-500 flex-1 text-center">Distributed {formatINR(d)}</span>
                  <div className="flex items-center gap-1">
                    {done ? (
                      <span className="text-sdl-green font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    ) : (
                      <span className="text-slate-400">{formatINR(t - d)} left</span>
                    )}
                    <button onClick={() => { setSelectedMonth(mk); openSet(mk); }} title="Edit target"
                      className="w-6 h-6 rounded-full neu-btn flex items-center justify-center text-slate-500 shrink-0">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeTarget(mk)} title="Delete target"
                      className="w-6 h-6 rounded-full neu-btn flex items-center justify-center text-sdl-red shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
          <div className="neu-card p-6 w-full max-w-md neu-pop">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold sdl-gradient-text">Set Target — {monthLabel(selectedMonth)}</h3>
              <button onClick={() => setShowSet(false)} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-3">Set the distribution goal for {monthLabel(selectedMonth)}. The goal is marked complete when this month's total distribution reaches the target.</p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Target Amount (₹)</label>
              <NeuInput type="number" value={targetInput} onChange={(e) => setTargetInput(e.target.value)} placeholder="Enter target amount" />
            </div>
            <button onClick={save} disabled={saving} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Target className="w-4 h-4" /> Save Target</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}