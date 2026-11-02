const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from "react";

import { formatINR, monthKey } from "@/lib/sdlUtils";
import NeuInput from "@/components/NeuInput";
import { Target, Loader2, X, CheckCircle2, ChevronDown, Calendar, Pencil, Trash2 } from "lucide-react";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(mk) {
  const [y, m] = mk.split("-");
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
}

export default function MonthlyTarget({ monthly, allMonths }) {
  const [settingsId, setSettingsId] = useState(null);
  const [targets, setTargets] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));
  const [showSet, setShowSet] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await db.entities.AppSettings.list();
        if (s[0]) {
          setSettingsId(s[0].id);
          try {
            const parsed = JSON.parse(s[0].monthly_targets || "{}");
            setTargets(parsed && typeof parsed === "object" ? parsed : {});
          } catch { setTargets({}); }
        }
      } catch (e) {}
    })();
  }, []);

  const persist = async (updated) => {
    if (!settingsId) return;
    setSaving(true);
    try {
      await db.entities.AppSettings.update(settingsId, { monthly_targets: JSON.stringify(updated) });
    } catch (e) { alert("Failed to save target"); }
    finally { setSaving(false); }
  };

  const monthOptions = useMemo(() => {
    const list = allMonths && allMonths.length ? allMonths : [monthKey(new Date())];
    return list.includes(selectedMonth) ? list : [selectedMonth, ...list];
  }, [allMonths, selectedMonth]);

  const savedMonths = useMemo(
    () => Object.keys(targets).sort((a, b) => (a < b ? 1 : -1)),
    [targets]
  );

  const disbursed = Number(monthly?.[selectedMonth]?.disbursed) || 0;
  const target = Number(targets[selectedMonth]) || 0;
  const pct = target > 0 ? Math.min(100, Math.round((disbursed / target) * 100)) : 0;

  const saveTarget = () => {
    const value = Number(targetInput);
    if (!value || value <= 0) return;
    const updated = { ...targets, [selectedMonth]: value };
    setTargets(updated);
    setShowSet(false);
    setTargetInput("");
    persist(updated);
  };

  const removeTarget = (mk) => {
    const updated = { ...targets };
    delete updated[mk];
    setTargets(updated);
    persist(updated);
  };

  return (
    <div className="neu-card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-sdl-orange" />
          <h3 className="text-sm font-bold text-slate-600">Monthly Disbursement Target</h3>
        </div>
        <button
          onClick={() => { setShowSet((v) => !v); setTargetInput(target || ""); }}
          className="neu-btn h-8 px-3 rounded-xl text-xs font-medium text-slate-500 flex items-center gap-1"
        >
          {target ? <Pencil className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
          {target ? "Edit" : "Set"}
        </button>
      </div>

      <div className="relative mb-3">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
        <select
          value={selectedMonth}
          onChange={(e) => { setSelectedMonth(e.target.value); setShowSet(false); }}
          className="neu-input w-full h-11 pl-9 pr-9 text-sm text-slate-700 rounded-xl appearance-none"
        >
          {monthOptions.map((mk) => (
            <option key={mk} value={mk}>{monthLabel(mk)}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>

      {showSet && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <NeuInput
              type="number"
              min={0}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="Target amount (₹)"
            />
          </div>
          <button
            disabled={saving}
            onClick={saveTarget}
            className="sdl-gradient h-12 w-12 rounded-xl text-white flex items-center justify-center disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { setShowSet(false); setTargetInput(""); }}
            className="neu-btn h-12 w-12 rounded-xl text-slate-400 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {target > 0 ? (
        <div>
          <div className="flex items-end justify-between mb-1">
            <p className="text-xs text-slate-500">Disbursed {formatINR(disbursed)} of {formatINR(target)}</p>
            <p className={`text-xs font-bold ${pct >= 100 ? "text-emerald-600" : "text-sdl-orange"}`}>{pct}%</p>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : "sdl-gradient"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct >= 100 && (
            <p className="text-[11px] text-emerald-600 font-medium mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Target achieved for {monthLabel(selectedMonth)}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          No target set for {monthLabel(selectedMonth)}. Disbursed {formatINR(disbursed)}.
        </p>
      )}

      {savedMonths.length > 1 && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">All targets</p>
          {savedMonths.map((mk) => {
            const t = Number(targets[mk]) || 0;
            const d = Number(monthly?.[mk]?.disbursed) || 0;
            const p = t > 0 ? Math.min(100, Math.round((d / t) * 100)) : 0;
            return (
              <div key={mk} className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => { setSelectedMonth(mk); setShowSet(false); }}
                  className={`w-20 text-left ${mk === selectedMonth ? "text-sdl-orange font-semibold" : "text-slate-500"}`}
                >
                  {monthLabel(mk)}
                </button>
                <span className="flex-1 text-slate-400">{formatINR(d)} / {formatINR(t)}</span>
                <span className={`w-9 text-right font-semibold ${p >= 100 ? "text-emerald-600" : "text-slate-500"}`}>{p}%</span>
                <button onClick={() => removeTarget(mk)} className="text-slate-300 hover:text-sdl-red" aria-label="Delete target">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
