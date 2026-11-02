const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { formatDate } from "@/lib/sdlUtils";
import { MessageCircle, Search, Copy, Check, Trash2, ExternalLink } from "lucide-react";

const TYPE_LABELS = {
  kyc_approved: "KYC Approved",
  limit_increased: "Limit Increased",
  loan_disbursed: "Loan Disbursed",
  repayment_verified: "Repayment Verified",
  loan_rejected: "Loan Rejected",
  repayment_reminder: "Reminder",
};

function waLink(mobile, message) {
  const digits = String(mobile || "").replace(/\D/g, "");
  const number = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(message || "")}`;
}

export default function AdminMessages() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  const loadData = async () => {
    try {
      setLogs(await db.entities.WhatsAppLog.list("-created_date", 100));
    } catch (e) {
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const copy = async (log) => {
    try {
      await navigator.clipboard.writeText(log.message || "");
      setCopiedId(log.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {}
  };

  const remove = async (log) => {
    if (!confirm("Delete this message log?")) return;
    try {
      await db.entities.WhatsAppLog.delete(log.id);
      setLogs((prev) => prev.filter((l) => l.id !== log.id));
    } catch (e) { alert("Failed to delete"); }
  };

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;

  let filtered = logs;
  if (type !== "all") filtered = filtered.filter((l) => l.message_type === type);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((l) =>
      (l.user_name || "").toLowerCase().includes(q) ||
      (l.user_mobile || "").includes(q) ||
      (l.message || "").toLowerCase().includes(q) ||
      (l.loan_id || "").toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, mobile, loan ID, or message..."
          className="neu-input w-full h-11 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", ...Object.keys(TYPE_LABELS)].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${type === t ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}
          >
            {t === "all" ? "All" : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="neu-card p-8 text-center text-sm text-slate-400">No WhatsApp messages logged.</div>
      ) : (
        filtered.map((log) => (
          <div key={log.id} className="neu-card p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{log.user_name || "Unknown user"}</p>
                <p className="text-xs text-slate-400">
                  {log.user_mobile || "—"} • {formatDate(log.created_date)}
                  {log.loan_id ? ` • ${log.loan_id}` : ""}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0 bg-orange-100 text-sdl-orange">
                <MessageCircle className="w-3 h-3" />
                {TYPE_LABELS[log.message_type] || log.message_type}
              </span>
            </div>

            <p className="text-sm text-slate-600 whitespace-pre-line mb-3">{log.message}</p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copy(log)}
                className="neu-btn h-9 px-3 rounded-xl text-xs font-medium text-slate-500 flex items-center gap-1"
              >
                {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-sdl-green" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === log.id ? "Copied" : "Copy"}
              </button>
              <a
                href={waLink(log.user_mobile, log.message)}
                target="_blank"
                rel="noreferrer"
                className="neu-btn h-9 px-3 rounded-xl text-xs font-medium text-sdl-green flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> WhatsApp
              </a>
              <button
                onClick={() => remove(log)}
                className="ml-auto w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-sdl-red"
                aria-label="Delete message log"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
