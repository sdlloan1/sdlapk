import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { StickyNote, Loader2, Check, Trash2, Plus, Copy, Pencil, X, ChevronRight } from "lucide-react";

function noteTitle(n) {
  return (n.title || "").trim() || (n.text || "").split("\n")[0].slice(0, 60) || "Untitled note";
}

export default function AdminNotepad() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [input, setInput] = useState("");
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await base44.entities.AppSettings.list();
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
      await base44.entities.AppSettings.update(settingsId, { admin_notes: JSON.stringify(updated) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert("Failed to save note"); }
    finally { setSaving(false); }
  };

  const addNote = () => {
    const text = input.trim();
    if (!text || !settingsId) return;
    const newNote = {
      id: Date.now().toString(),
      title: title.trim() || text.split("\n")[0].slice(0, 60),
      text,
      created_date: new Date().toISOString(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    setTitle("");
    setInput("");
    persist(updated);
  };

  const deleteNote = (id) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    if (open?.id === id) setOpen(null);
    persist(updated);
  };

  const copyNote = async (n, fromModal = false) => {
    const payload = `${noteTitle(n)}\n\n${n.text}`;
    try {
      await navigator.clipboard.writeText(payload);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = payload;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(fromModal ? "modal" : n.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const openNote = (n) => {
    setOpen(n);
    setEditTitle(noteTitle(n));
    setRenaming(false);
  };

  const saveTitle = () => {
    if (!open) return;
    const newTitle = editTitle.trim() || noteTitle(open);
    const updated = notes.map((n) => (n.id === open.id ? { ...n, title: newTitle } : n));
    setNotes(updated);
    setOpen({ ...open, title: newTitle });
    setRenaming(false);
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

      {/* Composer */}
      <div className="space-y-2 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note headline"
          className="neu-input w-full h-10 px-3 text-sm font-semibold text-slate-700 rounded-xl"
        />
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write the full note here..."
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
      </div>

      {notes.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No notes yet. Write a headline and note above, then click Save.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {notes.map((n) => (
            <div key={n.id} className="neu-inset-sm rounded-xl p-2 flex items-center gap-2">
              <button onClick={() => openNote(n)} className="flex-1 min-w-0 text-left px-1 py-1">
                <p className="text-sm font-semibold text-slate-700 truncate">{noteTitle(n)}</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {new Date(n.created_date).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                </p>
              </button>
              <button onClick={() => copyNote(n)} title="Copy note"
                className="w-7 h-7 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                {copiedId === n.id ? <Check className="w-3.5 h-3.5 text-sdl-green" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => deleteNote(n.id)} title="Delete note"
                className="w-7 h-7 shrink-0 rounded-full bg-red-50 flex items-center justify-center text-sdl-red">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Full note modal */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4 pb-4 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="neu-card p-5 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start gap-2 mb-3">
              <div className="min-w-0 flex-1">
                {renaming ? (
                  <div className="flex gap-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="neu-input flex-1 h-9 px-3 text-sm font-semibold text-slate-700 rounded-xl"
                      autoFocus
                    />
                    <button onClick={saveTitle} className="sdl-gradient h-9 px-3 rounded-xl text-white text-xs font-semibold">Save</button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <h3 className="text-sm font-bold text-slate-700 break-words">{noteTitle(open)}</h3>
                    <button onClick={() => setRenaming(true)} title="Rename note" className="w-6 h-6 shrink-0 rounded-full neu-inset-sm flex items-center justify-center text-slate-500">
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1">{new Date(open.created_date).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
              </div>
              <button onClick={() => setOpen(null)} className="w-8 h-8 shrink-0 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <textarea readOnly value={open.text} rows={10}
              className="neu-input w-full p-3 text-sm text-slate-700 rounded-xl resize-none leading-relaxed" />
            <div className="flex gap-2 mt-3">
              <button onClick={() => copyNote(open, true)} className="sdl-gradient flex-1 h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg">
                {copiedId === "modal" ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Note</>}
              </button>
              <button onClick={() => deleteNote(open.id)} className="neu-btn h-11 px-4 rounded-xl text-sdl-red text-sm font-medium flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}