import React, { useState } from "react";
import { X, Copy, Check, MessageCircle } from "lucide-react";

function sanitizePhone(phone) {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits;
  else if (digits.length === 11 && digits.startsWith("0")) digits = "91" + digits.slice(1);
  return digits;
}

export default function WhatsAppShareModal({ message, phone, onClose }) {
  const [copied, setCopied] = useState(false);
  const cleanPhone = sanitizePhone(phone);
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

  const openWhatsApp = async () => {
    await copy();
    window.open(waUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4 pb-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="neu-card p-5 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold flex items-center gap-2 text-sdl-green"><MessageCircle className="w-5 h-5" /> WhatsApp Message</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-[11px] text-slate-500 mb-2">Review the message. Tap "Open WhatsApp" to copy it and open chat, or copy it manually.</p>
        <textarea readOnly value={message} className="neu-input w-full h-52 p-3 text-sm text-slate-700 rounded-xl resize-none leading-relaxed" />
        <div className="flex gap-2 mt-3">
          <button onClick={openWhatsApp} className="flex-1 h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 bg-sdl-green shadow-lg">
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