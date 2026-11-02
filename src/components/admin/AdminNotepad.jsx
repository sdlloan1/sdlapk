const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { StickyNote, Save, Loader2, Check, Trash2, Plus } from "lucide-react";

export default function AdminNotepad() {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState("");
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await db.entities.AppSettings.list();
        if (s[0]) {
          setSettingsId(s[0].id);
          try {
            const parsed = JSON.parse(s[0].admin_notes || "[]");
            setNotes(Array.isArray(parsed) ? parsed : []);
          } catch { setNotes([]); }
        }
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const persist = async (updated) => {
    if (!settingsId) return;
    setSaving(true);
    setSaved(false);
    try {
      await db.entities.AppSettings.update(settingsId, { admin_notes: JSON.stringify(updated) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert("Failed to save note"); }
    finally { setSaving(false); }
  };

  const addNote = () => {
    const text = input.trim();
    if (!text || !settingsId) return;
    const newNote = { id: Date.now().toString(), text, created_date: new Date().toISOString() };
    const updated = [newNote, ...notes];
    setNotes(updated);
    setInput("");
    persist(updated);
  };

  const deleteNote = (id) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    persist(updated);
  };

  if (loading) return null;

  return (
    <div className="neu-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="w-4 h-4 text-sdl-orange" />
        <h3 className="text-sm font-bold text-slate-600">Admin Notepad</h3>
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
        {saved && <Check className="w-3.5 h-3.5 text-sdl-green" />}
      </div>
      <div className="flex gap-2 mb-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a note, reminder, or to-do item..."
          className="neu-input flex-1 h-20 p-3 text-sm text-slate-700 rounded-xl resize-none leading-relaxed"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote(); }}
        />
        <button
          onClick={addNote}
          disabled={saving || !input.trim()}
          className="sdl-gradient px-4 h-10 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg disabled:opacity-50 self-end shrink-0"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> Save</>}
        </button>
      </div>
      {notes.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No notes yet. Write one above and click Save.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {notes.map((n) => (
            <div key={n.id} className="neu-inset-sm rounded-xl p-3 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{n.text}</p>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_date).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
              </div>
              <button
                onClick={() => deleteNote(n.id)}
                className="w-7 h-7 shrink-0 rounded-full bg-red-50 flex items-center justify-center text-sdl-red hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}