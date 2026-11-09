const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { formatDate, formatINR } from "@/lib/sdlUtils";
import { Bell, Copy, Check, MessageCircle, RefreshCw, Loader2, Mail } from "lucide-react";

const STAGES = [
  { id: "t_minus_2", label: "2 days before" },
  { id: "t_minus_1", label: "1 day before" },
  { id: "due", label: "Due today" },
  { id: "plus_1", label: "1 day overdue" },
  { id: "plus_2", label: "2 days overdue" },
];

const STAGE_STYLE = {
  t_minus_2: "bg-blue-100 text-blue-600",
  t_minus_1: "bg-blue-100 text-blue-600",
  due: "bg-amber-100 text-amber-600",
  plus_1: "bg-red-100 text-sdl-red",
  plus_2: "bg-red-100 text-sdl-red",
};

function sanitizePhone(phone) {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits;
  else if (digits.length === 11 && digits.startsWith("0")) digits = "91" + digits.slice(1);
  return digits;
}

export default function AdminReminders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  const load = async () => {
    // Reminders are kept for 24 hours only — older ones are removed here.
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await db.entities.RepaymentReminder.deleteMany({ created_date: { $lt: cutoff } }).catch(() => {});

    const res = await db.entities.RepaymentReminder.list("-created_date", 200);
    setItems(res);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      // Generates today's reminders; emails only leave inside the 8–10 AM IST window.
      try { await db.functions.invoke("sendRepaymentReminders", {}); } catch (e) {}
      load();
    })();
  }, []);

  const copy = async (item) => {
    try {
      await navigator.clipboard.writeText(item.whatsapp_message);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = item.whatsapp_message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.stage === filter);

  return (
    <div className="space-y-4">
      <div className="neu-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Bell className="w-4 h-4 text-sdl-orange" /> Automatic Repayment Reminders
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Five reminders per loan — 2 days before, 1 day before, due date, 1 day overdue and 2 days overdue. Emails are sent
              daily at 8:00 AM IST to the borrower's registered email; the WhatsApp text below is ready to copy and send.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={load} title="Refresh" className="neu-btn w-10 h-10 rounded-xl flex items-center justify-center text-slate-500">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${filter === "all" ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>
          All ({items.length})
        </button>
        {STAGES.map((s) => (
          <button key={s.id} onClick={() => setFilter(s.id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${filter === s.id ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>
            {s.label} ({items.filter((i) => i.stage === s.id).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="neu-card p-8 text-center text-sm text-slate-400">No reminders here yet.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const waUrl = `https://wa.me/${sanitizePhone(item.user_mobile)}?text=${encodeURIComponent(item.whatsapp_message)}`;
            return (
              <div key={item.id} className="neu-card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STAGE_STYLE[item.stage] || "bg-slate-100 text-slate-600"}`}>
                        {item.stage_label || item.stage}
                      </span>
                      {item.loan_code && <span className="text-[10px] font-mono text-sdl-orange">ID: {item.loan_code}</span>}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${item.email_status === "sent" ? "bg-green-100 text-sdl-green" : item.email_status === "failed" ? "bg-red-100 text-sdl-red" : "bg-slate-100 text-slate-500"}`}>
                        <Mail className="w-2.5 h-2.5" /> {item.email_status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mt-1">{item.user_name}</p>
                    <p className="text-xs text-slate-400">
                      {item.user_mobile} • Due: {formatDate(item.due_date)} • {formatINR(item.repayment_amount)}
                      {(item.overdue_days > 0) ? ` • Overdue ${formatINR(item.total_payable)}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => window.open(waUrl, "_blank")} disabled={!item.user_mobile}
                      className="bg-sdl-green h-9 px-3 rounded-xl text-white text-xs font-semibold flex items-center gap-1 shadow-lg disabled:opacity-50">
                      <MessageCircle className="w-3.5 h-3.5" /> Send
                    </button>
                    <button onClick={() => copy(item)} className="neu-btn h-9 px-3 rounded-xl text-slate-600 text-xs font-medium flex items-center gap-1">
                      {copiedId === item.id ? <><Check className="w-3.5 h-3.5 text-sdl-green" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </button>
                  </div>
                </div>
                <textarea readOnly value={item.whatsapp_message} rows={6}
                  className="neu-input w-full p-3 text-xs text-slate-600 rounded-xl resize-none leading-relaxed" />
                {item.email_error && <p className="text-[10px] text-sdl-red mt-1">Email error: {item.email_error}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}