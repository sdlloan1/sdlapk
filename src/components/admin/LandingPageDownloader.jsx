const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { Download, Eye, Loader2, Globe, CheckCircle2, RefreshCw } from "lucide-react";

export default function LandingPageDownloader({ settings }) {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [regenerated, setRegenerated] = useState(false);

  const generateAndOpen = async (mode) => {
    setGenerating(true);
    setDone(false);
    setRegenerated(false);
    try {
      const res = await db.functions.invoke("generateLandingPage", {});
      const data = res.data || res;
      if (!data.html) throw new Error("No HTML returned");
      const blob = new Blob([data.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      if (mode === "download") {
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || "sdl-landing-page.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setDone(true);
        setTimeout(() => setDone(false), 3000);
      } else {
        window.open(url, "_blank");
        if (mode === "regenerate") {
          setRegenerated(true);
          setTimeout(() => setRegenerated(false), 3000);
        }
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      alert("Failed: " + (e.message || "error"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="neu-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl sdl-gradient flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">SDL Landing Page Generator</p>
            <p className="text-xs text-slate-500 mt-0.5">Generate a self-contained HTML landing page with 3D limit card, SEO meta tags, and mouse-track effects.</p>
          </div>
        </div>

        <div className="neu-inset-sm rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">What's included:</p>
          <ul className="text-xs text-slate-500 space-y-1">
            <li>&#8226; 3D <strong>&#8377;20,000 limit card</strong> with mouse-track tilt &amp; shine</li>
            <li>&#8226; Mouse / touch tracking <strong>orange blur background</strong></li>
            <li>&#8226; <strong>Terms &amp; Privacy as clickable links</strong> — open in a modal popup</li>
            <li>&#8226; <strong>logo.png</strong> option — place your own logo file next to the HTML</li>
            <li>&#8226; Full <strong>SEO meta tags</strong> — Open Graph, Twitter, JSON-LD, canonical</li>
            <li>&#8226; Mobile-friendly responsive layout with hamburger menu</li>
            <li>&#8226; Features grid with 3D tilt, FAQ accordion, About section</li>
            <li>&#8226; Login &rarr; <span className="font-mono text-sdl-orange">/login</span> &nbsp; Create Account &rarr; <span className="font-mono text-sdl-orange">/register</span></li>
            <li>&#8226; Fully self-contained — all CSS, JS inline (no external dependencies)</li>
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => generateAndOpen("preview")}
            disabled={generating}
            className="neu-btn h-12 rounded-2xl text-slate-700 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Preview
          </button>
          <button
            onClick={() => generateAndOpen("regenerate")}
            disabled={generating}
            className="neu-btn h-12 rounded-2xl text-slate-700 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : regenerated ? <CheckCircle2 className="w-4 h-4 text-sdl-green" /> : <RefreshCw className="w-4 h-4" />}
            {regenerated ? "Regenerated!" : "Regenerate"}
          </button>
          <button
            onClick={() => generateAndOpen("download")}
            disabled={generating}
            className="sdl-gradient h-12 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {done ? "Downloaded!" : "Download"}
          </button>
        </div>
      </div>

      <div className="neu-inset-sm rounded-xl p-4 space-y-2">
        <p className="text-xs text-slate-500">
          <strong className="text-slate-700">Regenerate:</strong> Click "Regenerate" to create a fresh copy and open it in a new tab. If you don't like the result, click again — each click reads your latest settings.
        </p>
        <p className="text-xs text-slate-500">
          <strong className="text-slate-700">Custom Logo:</strong> After downloading, place a <span className="font-mono text-sdl-orange">logo.png</span> file next to the HTML. It will automatically replace the default SDL logo in the nav, footer, and favicon. If the file is missing, the SVG fallback is shown.
        </p>
        <p className="text-xs text-slate-500">
          <strong className="text-slate-700">Tip:</strong> The downloaded HTML is fully standalone — host it on any web server or upload it to your custom domain. It uses your current Terms, Privacy, and About content from the Content tab.
        </p>
      </div>
    </div>
  );
}