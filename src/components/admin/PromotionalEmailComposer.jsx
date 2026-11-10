const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import NeuInput from "@/components/NeuInput";
import { Send, Eye, Loader2, X, Users, User, AlertCircle, CheckCircle2, Mail, Code, FileText } from "lucide-react";

const NAME_TOKEN = "{name}";

export default function PromotionalEmailComposer({ users, activeUserCount }) {
  const [subject, setSubject] = useState("");
  const [bodyMode, setBodyMode] = useState("html");
  const [body, setBody] = useState("");
  const [recipientType, setRecipientType] = useState("single");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const kycIncompleteCount = users.filter((u) => u.kyc_status !== "approved").length;
  const kycApprovedCount = users.filter((u) => u.kyc_status === "approved").length;

  const recipientCount =
    recipientType === "single" ? (selectedUserId ? 1 : 0)
    : recipientType === "kyc_incomplete" ? kycIncompleteCount
    : recipientType === "active_loans" ? activeUserCount
    : kycApprovedCount;

  const buildHtml = () => {
    if (bodyMode === "plain") {
      return body
        .split("\n")
        .map((p) => `<p style="font-size:15px;color:#4a4a4a;line-height:1.6;margin:0 0 12px 0;">${p || "&nbsp;"}</p>`)
        .join("");
    }
    return body;
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) { alert("Subject and body are required"); return; }
    if (recipientType === "single" && !selectedUserId) { alert("Please select a user"); return; }
    if (recipientType !== "single" && recipientCount === 0) { alert("No recipients found in this category"); return; }

    const confirmSend = recipientType === "all"
      ? window.confirm(`This will send an email to ALL ${recipientCount} KYC-approved users. Continue?`)
      : true;
    if (!confirmSend) return;

    setSending(true);
    setSendResult(null);
    try {
      const res = await db.functions.invoke("sendPromotionalEmail", {
        recipientType,
        userId: recipientType === "single" ? selectedUserId : undefined,
        subject: subject.trim(),
        htmlBody: buildHtml(),
        fromName: "SDL Shubh Dhan Lakshmi",
      });
      const data = res.data || res;
      setSendResult(data);
    } catch (e) {
      setSendResult({ error: e.message || "Failed to send email" });
    } finally {
      setSending(false);
    }
  };

  const recipientOptions = [
    { id: "single", label: "Single User", icon: User, desc: "Select one specific user" },
    { id: "kyc_incomplete", label: "KYC Incomplete", icon: AlertCircle, desc: "Users with pending/incomplete KYC" },
    { id: "active_loans", label: "Active Users", icon: Users, desc: "All users with an active account" },
    { id: "all", label: "All Users", icon: Mail, desc: "Every user whose KYC is approved" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-sdl-orange" />
        <h3 className="text-sm font-bold text-slate-600">Promotional Email</h3>
      </div>

      <div className="neu-card p-5 space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Subject</label>
          <NeuInput value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" />
        </div>

        {/* Body mode toggle */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Email Body</label>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setBodyMode("plain")}
              className={`flex-1 h-10 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 ${bodyMode === "plain" ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}
            >
              <FileText className="w-3.5 h-3.5" /> Plain Text
            </button>
            <button
              onClick={() => setBodyMode("html")}
              className={`flex-1 h-10 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 ${bodyMode === "html" ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}
            >
              <Code className="w-3.5 h-3.5" /> HTML
            </button>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={bodyMode === "html" ? 10 : 8}
            placeholder={bodyMode === "html" ? "Write HTML content here... Use {{name}} for recipient name personalization." : "Write your email content here... Use {{name}} for recipient name personalization."}
            className="neu-input w-full p-4 text-sm text-slate-700 resize-y font-mono"
          />
          {bodyMode === "html" && (
            <p className="text-[10px] text-slate-400 mt-1">
              Tip: Use <code className="text-sdl-orange">{NAME_TOKEN}</code> to personalize with each recipient's name. Write full HTML with inline styles for best email rendering.
            </p>
          )}
        </div>

        {/* Recipient selector */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Recipients</label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {recipientOptions.map((opt) => {
              const Icon = opt.icon;
              const active = recipientType === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setRecipientType(opt.id)}
                  className={`neu-inset-sm rounded-xl p-3 text-left transition-all ${active ? "ring-2 ring-sdl-orange" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${active ? "text-sdl-orange" : "text-slate-400"}`} />
                    <span className={`text-xs font-semibold ${active ? "text-slate-700" : "text-slate-500"}`}>{opt.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{opt.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Single user dropdown */}
          {recipientType === "single" && (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="neu-input w-full h-11 px-3 text-sm text-slate-700 rounded-xl"
            >
              <option value="">Select a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name || u.full_name || "Unknown"} ({u.email || "no email"})
                </option>
              ))}
            </select>
          )}

          {/* Recipient count badge */}
          {recipientType !== "single" && (
            <div className="neu-inset-sm rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">Recipients in this category</span>
              <span className="text-sm font-bold text-sdl-orange">{recipientCount} users</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(true)}
            disabled={!subject.trim() || !body.trim()}
            className="neu-btn flex-1 h-12 rounded-xl text-slate-600 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim() || (recipientType === "single" && !selectedUserId)}
            className="sdl-gradient flex-1 h-12 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>

        {/* Send result */}
        {sendResult && (
          <div className={`neu-inset-sm rounded-xl p-4 ${sendResult.error ? "bg-red-50" : "bg-green-50"}`}>
            {sendResult.error ? (
              <div className="flex items-center gap-2 text-sm text-sdl-red">
                <AlertCircle className="w-4 h-4 shrink-0" /> {sendResult.error}
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-sdl-green">
                  <CheckCircle2 className="w-4 h-4" /> Email sent successfully!
                </div>
                <p className="text-xs text-slate-600">
                  Sent: <span className="font-bold text-sdl-green">{sendResult.sent}</span> / {sendResult.total}
                  {sendResult.failed > 0 && (
                    <span className="text-sdl-red"> · Failed: {sendResult.failed}</span>
                  )}
                </p>
                {sendResult.failedEmails?.length > 0 && (
                  <p className="text-[10px] text-slate-400">Failed: {sendResult.failedEmails.join(", ")}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
          <div className="neu-card p-0 w-full max-w-2xl neu-pop max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h3 className="text-base font-bold sdl-gradient-text">Email Preview</h3>
              <button onClick={() => setShowPreview(false)} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-slate-200 space-y-1">
              <div className="flex gap-2 text-xs">
                <span className="text-slate-400 font-medium shrink-0">From:</span>
                <span className="text-slate-600">SDL Shubh Dhan Lakshmi &lt;shubhdhanlakshmifund@gmail.com&gt;</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-slate-400 font-medium shrink-0">Subject:</span>
                <span className="text-slate-700 font-semibold">{subject}</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-slate-400 font-medium shrink-0">To:</span>
                <span className="text-slate-600">
                  {recipientType === "single"
                    ? `${users.find((u) => u.id === selectedUserId)?.display_name || users.find((u) => u.id === selectedUserId)?.full_name || "Selected User"}`
                    : `${recipientCount} users (${recipientOptions.find((o) => o.id === recipientType)?.label})`}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              <div dangerouslySetInnerHTML={{ __html: buildHtml().replace(/\{\{name\}\}/g, "Recipient Name") }} />
            </div>
            <div className="p-4 border-t border-slate-200 flex gap-2">
              <button onClick={() => setShowPreview(false)} className="neu-btn flex-1 h-11 rounded-xl text-slate-600 text-sm font-medium">
                Close
              </button>
              <button
                onClick={() => { setShowPreview(false); handleSend(); }}
                disabled={sending || (recipientType === "single" && !selectedUserId)}
                className="sdl-gradient flex-1 h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}