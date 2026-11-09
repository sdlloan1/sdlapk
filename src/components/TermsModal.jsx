const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import NeuButton from "@/components/NeuButton";
import { ScrollText, Check } from "lucide-react";

const SDL_LOGO = "/logo.png";

export default function TermsModal({ user, onAccept }) {
  const [settings, setSettings] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    db.entities.AppSettings.list().then((s) => setSettings(s[0]));
  }, []);

  const handleAccept = async () => {
    if (!accepted) return;
    setLoading(true);
    try {
      await db.entities.User.update(user.id, { terms_accepted: true });
      onAccept();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute top-0 -left-20 w-64 h-64 rounded-full sdl-gradient opacity-10 blur-3xl" />
      <div className="w-full max-w-md relative z-10 neu-fade-up">
        <div className="flex justify-center mb-6">
          <div className="neu-card-sm p-3 rounded-3xl">
            <img src={SDL_LOGO} alt="SDL" className="w-20 h-20 rounded-2xl object-cover" />
          </div>
        </div>
        <div className="neu-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full sdl-gradient flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold sdl-gradient-text">Terms & Conditions</h2>
          </div>
          <div className="neu-inset p-4 rounded-2xl max-h-72 overflow-y-auto mb-4">
            <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
              {settings?.terms_conditions || "Loading terms..."}
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <button
              type="button"
              onClick={() => setAccepted(!accepted)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${accepted ? "sdl-gradient" : "neu-inset-sm"}`}
            >
              {accepted && <Check className="w-4 h-4 text-white" />}
            </button>
            <span className="text-sm text-slate-600">I have read and accept the Terms & Conditions</span>
          </label>
          <NeuButton variant="gradient" loading={loading} disabled={!accepted} onClick={handleAccept} className="w-full h-12 rounded-2xl">
            Accept & Continue
          </NeuButton>
        </div>
      </div>
    </div>
  );
}