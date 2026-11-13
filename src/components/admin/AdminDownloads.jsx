const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from "react";

import { X, RefreshCw, Eye, MousePointerClick, Smartphone, Users, MapPin, Loader2 } from "lucide-react";

const PLATFORM_LABEL = { android: "Android APK", ios: "iOS", pwa: "Home screen" };

function when(v) {
  if (!v) return "";
  return new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function place(r) {
  return [r.city, r.region, r.country].filter(Boolean).join(", ") || "Location not recorded";
}

function deviceLabel(r) {
  return [r.device_model || r.device_type, r.os_version].filter(Boolean).join(" • ") || "Unknown device";
}

function tally(rows, pick) {
  const map = {};
  rows.forEach((r) => {
    const k = pick(r);
    if (!k) return;
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
}

// Drill-down for the Total Downloads card: traffic, clicks, devices and locations.
export default function AdminDownloads({ onClose }) {
  const [downloads, setDownloads] = useState([]);
  const [visits, setVisits] = useState([]);
  const [installedUsers, setInstalledUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [d, v, users] = await Promise.all([
        db.entities.AppDownload.list("-created_date", 300).catch(() => []),
        db.entities.AppVisit.list("-created_date", 300).catch(() => []),
        db.entities.User.filter({ role: "user" }).catch(() => []),
      ]);
      setDownloads(d || []);
      setVisits(v || []);
      setInstalledUsers((users || []).filter((u) => u.app_installed).length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => [
    { icon: Eye, label: "Total Traffic", value: String(visits.length), hint: "app opens", color: "text-blue-600", bg: "bg-blue-100" },
    { icon: MousePointerClick, label: "Download Clicks", value: String(downloads.length), hint: "download link taps", color: "text-emerald-600", bg: "bg-emerald-100" },
    { icon: Smartphone, label: "Installed App Users", value: String(installedUsers), hint: "app on phone", color: "text-orange-600", bg: "bg-orange-100" },
    { icon: Users, label: "Unique Visitors", value: String(new Set(visits.map((v) => v.user_id).filter(Boolean)).size), hint: "distinct users", color: "text-violet-600", bg: "bg-violet-100" },
  ], [visits, downloads, installedUsers]);

  const deviceRows = useMemo(() => tally([...visits, ...downloads], (r) => deviceLabel(r)), [visits, downloads]);
  const locationRows = useMemo(() => tally([...visits, ...downloads], (r) => place(r)), [visits, downloads]);
  const platformRows = useMemo(() => tally(downloads, (r) => PLATFORM_LABEL[r.platform] || r.platform), [downloads]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Downloads &amp; Traffic</h3>
            <p className="text-[10px] text-slate-400">Clicks, installed devices and locations</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 p-3">
                <div className={`w-8 h-8 rounded-full ${s.bg} flex items-center justify-center mb-2`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-[10px] text-slate-400">{s.label}</p>
                <p className="text-base font-bold text-slate-700">{s.value}</p>
                <p className="text-[9px] text-slate-400">{s.hint}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1"><Smartphone className="w-3.5 h-3.5 text-slate-400" /> Devices used</p>
              {deviceRows.length === 0 ? (
                <p className="text-[11px] text-slate-400 py-2">No device data yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {deviceRows.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                      <span className="text-[11px] text-slate-600 truncate">{name}</span>
                      <span className="text-[11px] font-semibold text-slate-700 shrink-0">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Locations</p>
              {locationRows.length === 0 ? (
                <p className="text-[11px] text-slate-400 py-2">No location data yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {locationRows.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                      <span className="text-[11px] text-slate-600 truncate">{name}</span>
                      <span className="text-[11px] font-semibold text-slate-700 shrink-0">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {platformRows.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {platformRows.map(([name, count]) => (
                <span key={name} className="text-[10px] font-semibold text-slate-600 bg-slate-100 rounded-full px-2.5 py-1">{name}: {count}</span>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-slate-600 mb-2">App Update Installations (APK)</p>
            {installedUsers === 0 ? (
              <p className="text-[11px] text-slate-400 py-2">No user has installed the app yet.</p>
            ) : (
              <p className="text-[11px] text-slate-500">
                {installedUsers} user{installedUsers === 1 ? "" : "s"} use the SDL app installed on their phone and receive app update popups.
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-slate-600 mb-2">Recent Download Clicks</p>
            {downloads.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-2">No download clicks yet.</p>
            ) : (
              <div className="space-y-1.5">
                {downloads.slice(0, 20).map((d) => (
                  <div key={d.id} className="rounded-lg border border-slate-100 px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700 truncate">{d.user_name || "User"}</span>
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 shrink-0">{PLATFORM_LABEL[d.platform] || d.platform || "App"}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{deviceLabel(d)}</p>
                    <p className="text-[10px] text-slate-400 truncate">{place(d)} • {when(d.created_date)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-slate-600 mb-2">Recent Traffic</p>
            {visits.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-2">No app visits recorded yet.</p>
            ) : (
              <div className="space-y-1.5">
                {visits.slice(0, 20).map((v) => (
                  <div key={v.id} className="rounded-lg border border-slate-100 px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700 truncate">{v.user_name || "User"}</span>
                      <span className="text-[9px] text-slate-400 shrink-0">{when(v.created_date)}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{deviceLabel(v)}</p>
                    <p className="text-[10px] text-slate-400 truncate">{place(v)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
