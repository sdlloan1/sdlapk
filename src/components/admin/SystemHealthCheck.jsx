import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function SystemHealthCheck() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("systemHealthCheck");
      setResult(res.data || res);
    } catch (e) {
      setResult({ overall: "error", error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const overallConfig = {
    healthy: { icon: CheckCircle2, color: "text-sdl-green", bg: "bg-green-50", label: "All Systems Operational" },
    warnings: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", label: "Minor Issues Detected" },
    issues: { icon: XCircle, color: "text-sdl-red", bg: "bg-red-50", label: "Critical Issues Found" },
    error: { icon: XCircle, color: "text-sdl-red", bg: "bg-red-50", label: "Health Check Failed" },
  };

  const oc = overallConfig[result?.overall] || null;

  return (
    <div className="neu-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sdl-orange" />
          <h3 className="text-sm font-bold text-slate-600">System Health Check</h3>
        </div>
        <button
          onClick={runCheck}
          disabled={loading}
          className="sdl-gradient px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {loading ? "Checking..." : "Run Check"}
        </button>
      </div>

      {!result && !loading && (
        <p className="text-xs text-slate-400 text-center py-3">Click "Run Check" to verify all systems are operational.</p>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="neu-skeleton h-10 rounded-lg" />
          ))}
        </div>
      )}

      {oc && (
        <div className={`flex items-center gap-2 p-3 rounded-xl mb-3 ${oc.bg}`}>
          <oc.icon className={`w-5 h-5 ${oc.color} shrink-0`} />
          <div className="min-w-0">
            <p className={`text-sm font-bold ${oc.color}`}>{oc.label}</p>
            {result.timestamp && (
              <p className="text-[10px] text-slate-400">Last checked: {new Date(result.timestamp).toLocaleString("en-IN")}</p>
            )}
          </div>
        </div>
      )}

      {result?.checks && (
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {result.checks.map((c, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-xs py-1.5 px-2 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2 min-w-0">
                {c.status === "ok" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-sdl-green shrink-0" />
                ) : c.status === "warning" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-sdl-red shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="text-slate-700 font-medium truncate">{c.name}</span>
                  <span className="text-slate-400 ml-1">• {c.category}</span>
                </div>
              </div>
              <span className={`shrink-0 whitespace-nowrap text-[10px] ${c.status === "ok" ? "text-slate-400" : c.status === "warning" ? "text-amber-600" : "text-sdl-red"}`}>
                {c.detail}
              </span>
            </div>
          ))}
        </div>
      )}

      {result?.error && (
        <p className="text-xs text-sdl-red text-center py-2">{result.error}</p>
      )}
    </div>
  );
}