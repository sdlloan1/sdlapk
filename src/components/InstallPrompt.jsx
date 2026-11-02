import React, { useState, useEffect } from "react";
import { Smartphone, Download, X } from "lucide-react";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      try {
        if (localStorage.getItem("sdl_install_dismissed")) return;
      } catch {}
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferred) return;
    try {
      deferred.prompt();
      await deferred.userChoice;
    } catch {}
    setVisible(false);
    setDeferred(null);
  };

  const dismiss = () => {
    try { localStorage.setItem("sdl_install_dismissed", "1"); } catch {}
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <div className="neu-card p-3 mb-3 flex items-center gap-3 neu-fade-up">
      <div className="w-9 h-9 rounded-full sdl-gradient flex items-center justify-center shrink-0">
        <Smartphone className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700">Add SDL to Home Screen</p>
        <p className="text-[10px] text-slate-400">Quick access like a native app.</p>
      </div>
      <button onClick={install} className="sdl-gradient h-9 px-3 rounded-full text-white text-xs font-semibold flex items-center gap-1 shrink-0 shadow">
        <Download className="w-3.5 h-3.5" /> Install
      </button>
      <button onClick={dismiss} className="w-7 h-7 rounded-full neu-inset-sm flex items-center justify-center text-slate-400 shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}