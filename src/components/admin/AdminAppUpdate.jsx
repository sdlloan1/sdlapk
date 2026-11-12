import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { formatDate } from "@/lib/sdlUtils";
import { Smartphone, Send, Loader2, CheckCircle2, ExternalLink, History, AlertTriangle } from "lucide-react";

export default function AdminAppUpdate() {
  const [version, setVersion] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [reminderDays, setReminderDays] = useState("2");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUpdates = async () => {
    try {
      const list = await base44.entities.AppUpdate.list("-created_date", 20);
      setUpdates(list);
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => { loadUpdates(); }, []);

  const handleSend = async () => {
    setError("");
    setResult(null);
    if (!version.trim()) { setError("Add the updated version."); return; }
    if (!/^https?:\/\/\S+$/i.test(url.trim())) { setError("Paste a valid download link starting with http:// or https://"); return; }
    if (!window.confirm(`Publish v${version.trim()}? Every user will see the update popup.`)) return;

    setSending(true);
    try {
      const res = await base44.functions.invoke("sendAppUpdate", {
        version: version.trim(),
        download_url: url.trim(),
        notes: notes.trim(),
        reminder_days: Number(reminderDays),
      });
      const data = res.data || {};
      if (data.error) { setError(data.error); return; }
      setResult(data);
      setVersion(""); setUrl(""); setNotes("");
      loadUpdates();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Could not send the notification.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="neu-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-full sdl-gradient flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700">Publish App Update</h3>
            <p className="text-xs text-slate-400">Every user sees an in-app popup with an Install button.</p>
          </div>
        </div>

        <label className="block text-xs font-medium text-slate-500 mb-1">Updated version</label>
        <input
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="e.g. v2.1"
          className="neu-input w-full h-11 px-3 text-sm text-slate-700 rounded-xl mb-3"
        />

        <label className="block text-xs font-medium text-slate-500 mb-1">Download link (APK / app URL)</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="neu-input w-full h-11 px-3 text-sm text-slate-700 rounded-xl mb-3"
        />

        <label className="block text-xs font-medium text-slate-500 mb-1">What's new (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Short note shown inside the notification..."
          className="neu-input w-full p-3 text-sm text-slate-700 rounded-xl resize-none mb-3"
        />

        <label className="block text-xs font-medium text-slate-500 mb-1">Re-show notification after "Remind me later"</label>
        <div className="flex gap-2 mb-4">
          {["1", "2"].map((d) => (
            <button
              key={d}
              onClick={() => setReminderDays(d)}
              className={`flex-1 h-10 rounded-xl text-xs font-semibold ${reminderDays === d ? "sdl-gradient text-white shadow" : "neu-btn text-slate-500"}`}>
              {d} day{d === "1" ? "" : "s"}
            </button>
          ))}
        </div>

        {error && (
          <div className="neu-inset-sm rounded-xl p-3 mb-3 flex items-start gap-2" style={{ background: "rgba(244,67,54,0.06)" }}>
            <AlertTriangle className="w-4 h-4 text-sdl-red shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="neu-inset-sm rounded-xl p-3 mb-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-sdl-green shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600">Update v{result.update?.version} is live. The popup will show for all users.</p>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending}
          className="sdl-gradient w-full h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Publish Update</>}
        </button>
      </div>

      <div className="neu-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700">Sent Updates</h3>
        </div>
        {loading ? (
          <p className="text-xs text-slate-400 text-center py-4">Loading...</p>
        ) : updates.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No update sent yet.</p>
        ) : (
          <div className="space-y-2">
            {updates.map((u) => (
              <div key={u.id} className="neu-inset-sm rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-700">v{u.version}</p>
                      {u.is_active ? (
                        <span className="text-[10px] font-bold text-sdl-green bg-green-100 px-2 py-0.5 rounded-full">Active</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Archived</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Sent {formatDate(u.sent_at || u.created_date)} • {u.sent_count || 0} user{u.sent_count === 1 ? "" : "s"}
                    </p>
                    {u.notes && <p className="text-xs text-slate-500 mt-1">{u.notes}</p>}
                  </div>
                  <a href={u.download_url} target="_blank" rel="noreferrer" className="neu-btn h-8 px-3 rounded-lg text-[10px] font-medium text-slate-600 flex items-center gap-1 shrink-0">
                    <ExternalLink className="w-3 h-3" /> Link
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
