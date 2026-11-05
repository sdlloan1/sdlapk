import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Smartphone, ShieldCheck, CheckCircle2 } from "lucide-react";

const APK_NAME = "SDL - Shubh Dhan Lakshmi.apk";
const APK_URL = `/download/${encodeURIComponent(APK_NAME)}`;

const formatSize = (bytes) => {
  if (!bytes) return "";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const steps = [
  "Tap Download APK and wait for the file to finish downloading.",
  "Open the downloaded file; if prompted, allow installs from this source.",
  "Install, open SDL and sign in with your existing account.",
];

export default function DownloadApp() {
  const navigate = useNavigate();
  const [apk, setApk] = useState({ checked: false, available: false, size: "" });

  useEffect(() => {
    fetch(APK_URL, { method: "HEAD" })
      .then((res) => {
        const length = Number(res.headers.get("content-length") || 0);
        setApk({ checked: true, available: res.ok, size: formatSize(length) });
      })
      .catch(() => setApk({ checked: true, available: false, size: "" }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8 relative overflow-hidden">
      <div className="absolute top-0 -left-20 w-64 h-64 rounded-full sdl-gradient opacity-10 blur-3xl" />
      <div className="absolute bottom-0 -right-20 w-72 h-72 rounded-full bg-sdl-orange opacity-10 blur-3xl" />

      <button
        onClick={() => navigate(-1)}
        className="absolute top-5 left-5 neu-btn h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium text-slate-600 z-20"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="w-full max-w-md relative z-10 space-y-4">
        <div className="flex justify-center">
          <div className="neu-card-sm p-3 rounded-3xl neu-float">
            <img src="/logo.png" alt="SDL" className="w-20 h-20 rounded-2xl object-cover" />
          </div>
        </div>

        {/* APK preview card */}
        <div className="neu-card p-5">
          <h1 className="text-lg font-bold sdl-gradient-text text-center">SDL Android App</h1>
          <p className="text-xs text-slate-500 text-center mt-1">The same SDL app, installed on your phone.</p>

          <div className="neu-inset-sm rounded-2xl p-4 mt-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{APK_NAME}</p>
              <p className="text-[11px] text-slate-400">
                {!apk.checked ? "Checking file..." : apk.available ? `Android · ${apk.size || "Ready"}` : "Not available yet"}
              </p>
            </div>
            <span className={`ml-auto text-[10px] font-semibold px-2 py-1 rounded-full ${apk.available ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
              {!apk.checked ? "Checking" : apk.available ? "Ready" : "Coming Soon"}
            </span>
          </div>

          <a
            href={APK_URL}
            download={APK_NAME}
            className={`sdl-gradient mt-4 h-12 rounded-2xl flex items-center justify-center gap-2 text-white text-sm font-semibold shadow-lg transition-transform active:scale-95 ${apk.checked && !apk.available ? "opacity-50 pointer-events-none" : ""}`}
          >
            <Download className="w-4 h-4" /> Download APK
          </a>
          <p className="text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" /> For SDL users only · Android 7.0 and above
          </p>
        </div>

        {/* Install steps */}
        <div className="neu-card p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-3">How to install</h2>
          <ol className="space-y-3">
            {steps.map((text, i) => (
              <li key={text} className="flex gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sdl-orange shrink-0 mt-0.5" />
                <span className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-600">{i + 1}. </span>
                  {text}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
