import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Smartphone, Download, Clock, AlertTriangle, X } from "lucide-react";

const REMIND_KEY = "sdl_app_update_remind";
const INSTALLED_KEY = "sdl_app_installed_version";

// True only when the app runs as the installed app on the phone (APK / home-screen
// app), never for the website opened in a normal browser.
function runningAsInstalledApp() {
  try {
    const modes = ["standalone", "fullscreen", "minimal-ui"];
    if (modes.some((m) => window.matchMedia(`(display-mode: ${m})`).matches)) return true;
  } catch (e) {}
  return window.navigator.standalone === true;
}

function localInstalledVersion() {
  try {
    return localStorage.getItem(INSTALLED_KEY) || "";
  } catch (e) {
    return "";
  }
}

// Shows the latest published app version to users who installed the SDL app.
export default function AppUpdatePrompt({ user }) {
  const [update, setUpdate] = useState(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      // Website-only users never see the popup.
      if (!runningAsInstalledApp() && !user?.app_installed) return;

      const list = await base44.entities.AppUpdate.filter({ is_active: true }, "-created_date", 1).catch(() => []);
      const latest = list[0];
      if (!alive || !latest) return;

      // Already updated to this version — nothing to show.
      const installedVersion = String(user?.app_version || "").trim() || localInstalledVersion();
      if (installedVersion && installedVersion === String(latest.version).trim()) return;

      try {
        const saved = JSON.parse(localStorage.getItem(REMIND_KEY) || "null");
        if (saved && saved.version === latest.version && Number(saved.until) > Date.now()) return;
      } catch (e) {}
      setUpdate(latest);
    };

    load().catch(() => {});
    return () => { alive = false; };
  }, [user?.id, user?.app_installed, user?.app_version]);

  const remember = (days) => {
    try {
      localStorage.setItem(REMIND_KEY, JSON.stringify({ version: update.version, until: Date.now() + days * 86400000 }));
    } catch (e) {}
  };

  const remindLater = () => {
    remember(update.reminder_days || 2);
    setUpdate(null);
  };

  const install = () => {
    // Remember the installed version so this update is never shown again.
    try { localStorage.setItem(INSTALLED_KEY, update.version); } catch (e) {}
    remember(365);
    if (user?.id) {
      base44.auth.updateMe({ app_version: update.version, app_installed: true }).catch(() => {});
    }
    window.open(update.download_url, "_blank");
    setUpdate(null);
  };

  if (!update) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center px-4 pb-4 bg-black/40 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full sdl-gradient flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold sdl-gradient-text">App Update Available</h3>
              <p className="text-[10px] text-slate-400">New version v{update.version}</p>
            </div>
          </div>
          <button onClick={remindLater} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {update.notes && (
          <div className="neu-inset-sm rounded-xl p-3 mb-3">
            <p className="text-[10px] font-semibold text-slate-500 mb-1">What's new</p>
            <p className="text-xs text-slate-600 leading-relaxed">{update.notes}</p>
          </div>
        )}

        <div className="neu-inset rounded-2xl p-3 mb-4 flex items-start gap-2" style={{ background: "rgba(255,140,66,0.12)" }}>
          <AlertTriangle className="w-4 h-4 text-sdl-orange shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            Delete the existing SDL app from your phone first, then install the new version from the link.
          </p>
        </div>

        <button
          onClick={install}
          className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
          <Download className="w-4 h-4" /> Install
        </button>
        <button
          onClick={remindLater}
          className="neu-btn w-full h-11 rounded-2xl mt-2 text-slate-600 text-sm font-medium flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" /> Remind me later
        </button>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          We'll remind you again in {update.reminder_days || 2} day{(update.reminder_days || 2) === 1 ? "" : "s"}.
        </p>
      </div>
    </div>
  );
}
