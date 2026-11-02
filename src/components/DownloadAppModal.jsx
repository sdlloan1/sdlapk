const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { X, Download, Apple, Smartphone } from "lucide-react";

export default function DownloadAppModal({ onClose }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    db.entities.AppSettings.list().then((s) => { setSettings(s[0]); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // The bundled APK (built by scripts/build-apk.sh) is served from /download/sdl.apk,
  // so Android works out of the box without an admin-configured link.
  const androidUrl = settings?.apk_android_url || "/download/sdl.apk";

  const download = (url, label) => {
    if (!url) {
      setMsg(`${label} app is coming soon!`);
      setTimeout(() => setMsg(""), 2500);
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-sm neu-pop">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">Download App</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">Choose your platform to download the SDL app.</p>
        {loading ? (
          <div className="text-center text-sm text-slate-400 py-6">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => download(androidUrl, "Android")} className="neu-card p-4 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center"><Smartphone className="w-5 h-5 text-green-600" /></div>
              <span className="text-xs font-semibold text-slate-700">Android</span>
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                <Download className="w-3 h-3" /> Download
              </span>
            </button>
            <button onClick={() => download(settings?.apk_ios_url, "iOS")} className="neu-card p-4 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center"><Apple className="w-5 h-5 text-slate-700" /></div>
              <span className="text-xs font-semibold text-slate-700">iOS</span>
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                <Download className="w-3 h-3" /> {settings?.apk_ios_url ? "Download" : "Coming Soon"}
              </span>
            </button>
          </div>
        )}
        {msg && <p className="text-center text-sm text-sdl-orange font-medium mt-4">{msg}</p>}
      </div>
    </div>
  );
}