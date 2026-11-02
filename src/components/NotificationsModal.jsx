const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { formatDate } from "@/lib/sdlUtils";
import { Bell, X, CheckCircle2, Clock, Wallet, TrendingUp, AlertTriangle, Info } from "lucide-react";

const typeMeta = {
  loan: { icon: TrendingUp, color: "text-sdl-orange", bg: "bg-orange-100" },
  wallet: { icon: Wallet, color: "text-sdl-green", bg: "bg-green-100" },
  transaction: { icon: CheckCircle2, color: "text-sdl-green", bg: "bg-green-100" },
  due_date: { icon: AlertTriangle, color: "text-sdl-red", bg: "bg-red-100" },
  system: { icon: Info, color: "text-slate-500", bg: "bg-slate-100" },
};

export default function NotificationsModal({ user, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await db.entities.Notification.filter({ user_id: user.id }, "-created_date", 50);
        setItems(list);
        const unread = list.filter((n) => !n.read);
        if (unread.length) {
          await Promise.all(unread.map((n) => db.entities.Notification.update(n.id, { read: true })));
        }
      } catch (e) {
        // ignore
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 text-center py-6">Loading...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full neu-card-sm mx-auto mb-3 flex items-center justify-center"><Bell className="w-6 h-6 text-slate-300" /></div>
            <p className="text-sm text-slate-400">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => {
              const m = typeMeta[n.type] || typeMeta.system;
              const Icon = m.icon;
              return (
                <div key={n.id} className={`neu-inset-sm rounded-xl p-3 flex items-start gap-3 ${!n.read ? "border-l-4 border-sdl-orange" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.bg}`}><Icon className={`w-4 h-4 ${m.color}`} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{n.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {formatDate(n.created_date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}