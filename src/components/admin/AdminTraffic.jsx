const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Download, Eye, Smartphone, Users, Loader2 } from "lucide-react";

const DAY = 24 * 60 * 60 * 1000;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const dayKey = (value) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="neu-card p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="w-4 h-4" />
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-slate-800 mt-1">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminTraffic() {
  const [downloads, setDownloads] = useState([]);
  const [events, setEvents] = useState([]);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [d, e, total] = await Promise.all([
          db.entities.AppDownload.list("-created_date", 2000),
          db.entities.AppEvent.list("-created_date", 3000),
          db.entities.AppDownload.count({}),
        ]);
        setDownloads(d || []);
        setEvents(e || []);
        setTotalDownloads(total || 0);
      } catch (err) {
        setFailed(true);
      }
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const since = Date.now() - 7 * DAY;
    const recentDownloads = downloads.filter((d) => new Date(d.created_date).getTime() >= since);
    const recentEvents = events.filter((e) => new Date(e.created_date).getTime() >= since);

    const sessions = new Set(recentEvents.map((e) => e.session_id).filter(Boolean));
    const pages = {};
    recentEvents.forEach((e) => { pages[e.page] = (pages[e.page] || 0) + 1; });

    const platforms = { web: 0, android: 0, ios: 0 };
    recentEvents.forEach((e) => { platforms[e.platform || "web"] += 1; });

    const series = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(Date.now() - i * DAY);
      const key = dayKey(date);
      series.push({
        day: DAY_LABELS[date.getDay()],
        views: recentEvents.filter((e) => dayKey(e.created_date) === key).length,
        downloads: recentDownloads.filter((d) => dayKey(d.created_date) === key).length,
      });
    }

    return {
      downloads7: recentDownloads.length,
      views7: recentEvents.length,
      sessions7: sessions.size,
      todayDownloads: downloads.filter((d) => dayKey(d.created_date) === dayKey(Date.now())).length,
      topPages: Object.entries(pages).sort((a, b) => b[1] - a[1]).slice(0, 6),
      platforms,
      series,
    };
  }, [downloads, events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading app traffic...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat icon={Download} label="Total downloads" value={totalDownloads} sub={`${stats.todayDownloads} today`} />
        <Stat icon={Smartphone} label="Downloads this week" value={stats.downloads7} sub="Direct APK downloads" />
        <Stat icon={Eye} label="Page views this week" value={stats.views7} sub="Web + Android app" />
        <Stat icon={Users} label="Active sessions" value={stats.sessions7} sub="Last 7 days" />
      </div>

      <div className="neu-card p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Last 7 days</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.series} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e2e8f0" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="views" name="Page views" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="downloads" name="Downloads" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="neu-card p-4">
          <p className="text-sm font-semibold text-slate-700 mb-2">Top screens (7 days)</p>
          {stats.topPages.length === 0 ? (
            <p className="text-xs text-slate-400">No page views recorded yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {stats.topPages.map(([page, count]) => (
                <li key={page} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 truncate mr-2">{page}</span>
                  <span className="font-semibold text-slate-800">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="neu-card p-4">
          <p className="text-sm font-semibold text-slate-700 mb-2">Where traffic comes from (7 days)</p>
          <ul className="space-y-1.5">
            <li className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Website</span>
              <span className="font-semibold text-slate-800">{stats.platforms.web}</span>
            </li>
            <li className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Android app</span>
              <span className="font-semibold text-slate-800">{stats.platforms.android}</span>
            </li>
          </ul>
          {failed && (
            <p className="text-[10px] text-slate-400 mt-3">
              Tracking tables are still being set up — numbers appear after the next app update.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
