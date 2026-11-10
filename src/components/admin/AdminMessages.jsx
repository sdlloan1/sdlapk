const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { formatDate, formatINR, getWhatsappUrl } from "@/lib/sdlUtils";
import { repaymentReminderMessage } from "@/lib/whatsappMessages";
import AdminNotepad from "@/components/admin/AdminNotepad";
import { Search, Copy, Check, MessageCircle, X, RefreshCw, Loader2, Bell, CalendarClock } from "lucide-react";

const TYPE_LABELS = {
  kyc_approved: { label: "KYC Approved", color: "bg-green-100 text-sdl-green" },
  limit_increased: { label: "Limit Increased", color: "bg-blue-100 text-blue-600" },
  loan_disbursed: { label: "Loan Disbursed", color: "bg-orange-100 text-orange-600" },
  repayment_verified: { label: "Repayment Verified", color: "bg-violet-100 text-violet-600" },
  loan_rejected: { label: "Loan Rejected", color: "bg-red-100 text-sdl-red" },
  repayment_reminder: { label: "Repayment Reminder", color: "bg-amber-100 text-amber-600" },
};

function sanitizePhone(phone) {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits;
  else if (digits.length === 11 && digits.startsWith("0")) digits = "91" + digits.slice(1);
  return digits;
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminMessages() {
  const [logs, setLogs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // WhatsApp messages are kept for 24 hours only — older ones are removed here.
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await db.entities.WhatsAppLog.deleteMany({ created_date: { $lt: cutoff } }).catch(() => {});

      const [l, s, dueLoans] = await Promise.all([
        db.entities.WhatsAppLog.list("-created_date", 200),
        db.entities.AppSettings.list(),
        db.entities.LoanApplication.filter({ status: "disbursed", due_date: tomorrowStr() }, "-created_date"),
      ]);
      setLogs(l);
      setSettings(s[0]);
      setReminders(dueLoans);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const appUrl = getWhatsappUrl(settings);

  let filtered = filter === "all" ? logs : logs.filter((l) => l.message_type === filter);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((l) =>
      (l.user_name || "").toLowerCase().includes(q) ||
      (l.user_mobile || "").includes(q) ||
      (l.loan_id || "").toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Stored WhatsApp messages — copy or resend anytime. Messages auto-delete after 24 hours.</p>
        <button onClick={loadData} className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center text-slate-500">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      {/* Repayment reminders — due tomorrow */}
      {!loading && reminders.length > 0 && (
        <div className="neu-card p-5 border-l-4 border-amber-400">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-600">Repayment Due Tomorrow ({reminders.length})</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">Auto-generated reminder messages — copy and send to each user now.</p>
          <div className="space-y-3">
            {reminders.map((loan) => {
              const msg = repaymentReminderMessage(loan.user_name, loan.amount, loan.repayment_amount, formatDate(loan.due_date), loan.loan_id, appUrl);
              return <ReminderCard key={loan.id} loan={loan} message={msg} />;
            })}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, mobile, or loan ID..."
          className="neu-input w-full h-12 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${filter === "all" ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>
          All ({logs.length})
        </button>
        {Object.entries(TYPE_LABELS).map(([id, t]) => (
          <button key={id} onClick={() => setFilter(id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${filter === id ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>
            {t.label} ({logs.filter((l) => l.message_type === id).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="neu-card p-8 text-center text-sm text-slate-400">No messages found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => {
            const t = TYPE_LABELS[l.message_type] || { label: l.message_type, color: "bg-slate-100 text-slate-600" };
            return (
              <div key={l.id} className="neu-card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.color}`}>{t.label}</span>
                      {l.loan_id && <span className="text-[10px] font-mono text-sdl-orange">ID: {l.loan_id}</span>}
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mt-1">{l.user_name || "—"}</p>
                    <p className="text-xs text-slate-400">{l.user_mobile} • {formatDate(l.created_date)}</p>
                  </div>
                  <button onClick={() => setOpen(l)} className="neu-btn px-3 h-9 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-1 shrink-0">
                    <MessageCircle className="w-3.5 h-3.5" /> View
                  </button>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 whitespace-pre-wrap">{l.message}</p>
              </div>
            );
          })}
        </div>
      )}

      <AdminNotepad />

      {open && <MessageModal log={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function ReminderCard({ loan, message }) {
  const [copied, setCopied] = useState(false);
  const cleanPhone = sanitizePhone(loan.user_mobile);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="neu-inset-sm rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">Repayment Reminder</span>
            {loan.loan_id && <span className="text-[10px] font-mono text-sdl-orange">ID: {loan.loan_id}</span>}
          </div>
          <p className="text-sm font-semibold text-slate-700 mt-1">{loan.user_name || "—"}</p>
          <p className="text-xs text-slate-400">{loan.user_mobile} • Due: {formatDate(loan.due_date)} • {formatINR(loan.repayment_amount)}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => window.open(waUrl, "_blank")} disabled={!cleanPhone} className="bg-sdl-green h-9 px-3 rounded-xl text-white text-xs font-semibold flex items-center gap-1 shadow-lg disabled:opacity-50">
            <MessageCircle className="w-3.5 h-3.5" /> Send
          </button>
          <button onClick={copy} className="neu-btn h-9 px-3 rounded-xl text-slate-600 text-xs font-medium flex items-center gap-1">
            {copied ? <><Check className="w-3.5 h-3.5 text-sdl-green" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 line-clamp-3 whitespace-pre-wrap">{message}</p>
    </div>
  );
}

function MessageModal({ log, onClose }) {
  const [copied, setCopied] = useState(false);
  const t = TYPE_LABELS[log.message_type] || { label: log.message_type, color: "bg-slate-100 text-slate-600" };
  const cleanPhone = sanitizePhone(log.user_mobile);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(log.message)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(log.message);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = log.message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4 pb-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="neu-card p-5 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.color}`}>{t.label}</span>
            <h3 className="text-sm font-bold text-sdl-green flex items-center gap-1"><MessageCircle className="w-4 h-4" /> WhatsApp</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="text-xs text-slate-500 mb-2 space-y-0.5">
          <p><span className="text-slate-400">To:</span> {log.user_name || "—"} {log.user_mobile ? `• ${log.user_mobile}` : ""}</p>
          {log.loan_id && <p><span className="text-slate-400">Loan ID:</span> {log.loan_id}</p>}
          <p><span className="text-slate-400">Generated:</span> {formatDate(log.created_date)}</p>
        </div>
        <textarea readOnly value={log.message} className="neu-input w-full h-56 p-3 text-sm text-slate-700 rounded-xl resize-none leading-relaxed" />
        <div className="flex gap-2 mt-3">
          <button onClick={() => window.open(waUrl, "_blank")} disabled={!cleanPhone} className="flex-1 h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 bg-sdl-green shadow-lg disabled:opacity-50">
            <MessageCircle className="w-4 h-4" /> Open WhatsApp
          </button>
          <button onClick={copy} className="neu-btn h-11 px-4 rounded-xl text-slate-600 text-sm font-medium flex items-center gap-2">
            {copied ? <><Check className="w-4 h-4 text-sdl-green" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
          </button>
        </div>
      </div>
    </div>
  );
}