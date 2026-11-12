import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Check, CheckCircle2, Copy, Download, Images, Package, ShieldCheck, Smartphone, UserRound,
} from "lucide-react";
import { SDL_LOGO } from "@/lib/sdlUtils";
import { trackDownload } from "@/lib/appTraffic";

// Files published by scripts/build-apk.sh, scripts/build-admin-apk.sh and
// scripts/build-aab.sh. The page reads their real size from the server, so it
// always shows what is actually downloadable.
const FILES = [
  {
    key: "customer",
    title: "Customer App",
    platform: "Android APK",
    name: "SDL - Shubh Dhan Lakshmi.apk",
    description: "The SDL app for borrowers — loans, repayments, wallet and referrals.",
    icon: UserRound,
    tint: "bg-green-100 text-green-600",
    cta: "Download customer APK",
  },
  {
    key: "admin",
    title: "Admin App",
    platform: "Android APK",
    name: "SDL Admin - Shubh Dhan Lakshmi.apk",
    description: "Admin panel only. Installs alongside the customer app with its own icon.",
    icon: ShieldCheck,
    tint: "bg-orange-100 text-sdl-orange",
    cta: "Download admin APK",
  },
  {
    key: "play",
    title: "Play Store Bundle",
    platform: "Android AAB",
    name: "sdl.aab",
    description: "Google Play upload bundle for the release team — not installable on a phone. Rebuild it with npm run aab when the upload keystore is available.",
    icon: Package,
    tint: "bg-blue-100 text-blue-600",
    cta: "Download AAB",
  },
  {
    key: "screenshots",
    title: "Store Screenshots",
    platform: "ZIP",
    name: "sdl-play-store-screenshots.zip",
    description: "Screenshots used for the Play Store listing.",
    icon: Images,
    tint: "bg-slate-100 text-slate-600",
    cta: "Download screenshots ZIP",
  },
];

const filePath = (name) => `${import.meta.env.BASE_URL}download/${encodeURIComponent(name)}`;

const absoluteUrl = (name) => {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`;
  return new URL(filePath(name), base).href;
};

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const steps = [
  "Download the APK and wait for the file to finish saving.",
  "Open the file; if Android asks, allow installs from this source.",
  "Install, open SDL and sign in with your existing account.",
];

export default function DownloadsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState({});
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let alive = true;
    FILES.forEach(async (file) => {
      const result = { checked: true, available: false, size: "" };
      try {
        const res = await fetch(filePath(file.name), { method: "HEAD" });
        // A dev server without the file answers the HTML app shell with 200, so
        // only a real (non-HTML) response counts as published.
        const type = res.headers.get("content-type") || "";
        result.available = res.ok && !type.includes("text/html");
        result.size = result.available ? formatSize(Number(res.headers.get("content-length") || 0)) : "";
      } catch {
        /* keep the unavailable state */
      }
      if (alive) setStatus((prev) => ({ ...prev, [file.key]: result }));
    });
    return () => { alive = false; };
  }, []);

  const copyLink = async (file) => {
    const url = absoluteUrl(file.name);
    let ok = true;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // The clipboard API is blocked in some embedded browsers; fall back to a selection copy.
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand("copy");
      ta.remove();
    }
    setCopied(ok ? file.key : "");
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-5 py-8 relative overflow-hidden">
      <div className="absolute top-0 -left-20 w-64 h-64 rounded-full sdl-gradient opacity-10 blur-3xl" />
      <div className="absolute bottom-0 -right-20 w-72 h-72 rounded-full bg-sdl-orange opacity-10 blur-3xl" />

      <button
        onClick={() => navigate(-1)}
        className="absolute top-5 left-5 neu-btn h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium text-slate-600 z-20"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="w-full max-w-md relative z-10 space-y-4 mt-8">
        <div className="flex flex-col items-center text-center">
          <div className="neu-card-sm p-3 rounded-3xl neu-float">
            <img src={SDL_LOGO} alt="SDL" className="w-20 h-20 rounded-2xl object-cover" />
          </div>
          <h1 className="text-lg font-bold sdl-gradient-text mt-3">Download SDL Apps</h1>
          <p className="text-xs text-slate-500 mt-1">
            Every current SDL file, with its direct download link.
          </p>
        </div>

        {FILES.map((file) => {
          const info = status[file.key];
          const ready = info?.available;
          const Icon = file.icon;
          const url = filePath(file.name);
          return (
            <div key={file.key} className="neu-card p-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${file.tint}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700">{file.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{file.name}</p>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${
                    !info ? "bg-slate-100 text-slate-500" : ready ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {!info ? "Checking" : ready ? file.platform : "Coming Soon"}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{file.description}</p>
              <p className="text-[10px] text-slate-400 mt-1">
                {file.platform}
                {info?.size ? ` · ${info.size}` : ""}
              </p>

              <div className="neu-inset-sm rounded-2xl p-2.5 mt-3 flex items-center gap-2">
                <a href={url} className="text-[11px] text-slate-600 break-all leading-snug flex-1">
                  {absoluteUrl(file.name)}
                </a>
                <button
                  onClick={() => copyLink(file)}
                  aria-label={`Copy ${file.title} link`}
                  className="neu-btn w-8 h-8 rounded-full flex items-center justify-center text-slate-500 shrink-0"
                >
                  {copied === file.key ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <a
                href={url}
                download={file.name}
                onClick={() => trackDownload("downloads_page", file.name)}
                className={`sdl-gradient mt-2.5 h-10 rounded-2xl flex items-center justify-center gap-2 text-white text-xs font-semibold shadow-lg transition-transform active:scale-95 ${
                  info && !ready ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                {file.cta}
              </a>
            </div>
          );
        })}

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
          <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
            <Smartphone className="w-3 h-3" /> Android 7.0 and above · For SDL users only
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-400 pb-2">
          Links point at this site, so they stay current after every build.
        </p>
      </div>
    </div>
  );
}
