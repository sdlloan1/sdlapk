const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { formatAddress } from "@/lib/sdlUtils";
import { User, Mail, Phone, CreditCard, Wallet, MapPin, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

export default function PartnerRequestForm({ user, onSubmitted }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const details = [
    { icon: User, label: "Full Name", value: user.display_name || user.full_name },
    { icon: Mail, label: "Email", value: user.email },
    { icon: Phone, label: "Mobile", value: user.mobile_number },
    { icon: CreditCard, label: "PAN Number", value: user.pan_number },
    { icon: Wallet, label: "UPI ID", value: user.upi_id },
    { icon: MapPin, label: "Address", value: formatAddress(user) },
  ];

  const submit = async () => {
    setLoading(true);
    try {
      await db.functions.invoke("submitPartnerRequest", {});
      setDone(true);
    } catch (e) {
      alert("Failed to submit: " + (e.response?.data?.error || e.message || "error"));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen px-4 py-6 max-w-md mx-auto flex flex-col justify-center">
        <div className="neu-card p-8 text-center">
          <div className="w-16 h-16 rounded-full sdl-gradient mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-lg font-bold text-slate-700 mb-2">Request Submitted!</h2>
          <p className="text-sm text-slate-500 mb-6">Your SDL Partner request has been submitted. You will get an update within 24 hours.</p>
          <button onClick={onSubmitted} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-md mx-auto">
      <h1 className="text-lg font-bold sdl-gradient-text mb-1">SDL Partner Application</h1>
      <p className="text-xs text-slate-500 mb-5">Your details are auto-captured. Review and submit your request.</p>

      <div className="neu-card p-5 mb-5">
        <h3 className="text-sm font-bold text-slate-600 mb-3">Your Details</h3>
        <div className="space-y-2">
          {details.map((d, i) => {
            const Icon = d.icon;
            return (
              <div key={i} className="neu-inset-sm rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full neu-card-sm flex items-center justify-center">
                  <Icon className="w-4 h-4 text-sdl-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400">{d.label}</p>
                  <p className="text-sm font-medium text-slate-700 truncate">{d.value || "-"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Submit Request <ArrowRight className="w-4 h-4" /></>}
      </button>
    </div>
  );
}