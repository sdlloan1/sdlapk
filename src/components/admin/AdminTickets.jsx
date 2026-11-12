import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { formatDate } from "@/lib/sdlUtils";
import { createNotification } from "@/lib/notifications";
import { X, Send, CheckCircle2, Clock, Search } from "lucide-react";

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    const t = await base44.entities.SupportTicket.list("-created_date", 100);
    setTickets(t);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;

  let filtered = tickets;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = tickets.filter((t) =>
      (t.user_name || "").toLowerCase().includes(q) ||
      (t.user_mobile || "").includes(q) ||
      (t.message || "").toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, mobile, or message..."
          className="neu-input w-full h-11 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="neu-card p-8 text-center text-sm text-slate-400">No support tickets.</div>
      ) : (
        filtered.map((t) => {
          const convo = parseConversation(t);
          const lastMsg = convo[convo.length - 1];
          return (
            <div key={t.id} className="neu-card p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{t.user_name}</p>
                  <p className="text-xs text-slate-400">{t.user_mobile} • {formatDate(t.created_date)}</p>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0 ${t.status === "open" ? "bg-amber-100 text-amber-600" : t.status === "responded" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-sdl-green"}`}>
                  {t.status === "open" ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                  {t.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-1 line-clamp-2">{t.message}</p>
              {lastMsg && lastMsg.sender === "admin" && (
                <p className="text-xs text-sdl-orange line-clamp-1">↳ {lastMsg.message}</p>
              )}
              <button onClick={() => setSelected(t)} className="sdl-gradient-text text-xs font-medium">View & Respond</button>
            </div>
          );
        })
      )}
      {selected && <TicketModal ticket={selected} onClose={() => setSelected(null)} onDone={() => { setSelected(null); loadData(); }} />}
    </div>
  );
}

function parseConversation(ticket) {
  if (ticket.conversation) {
    try { return JSON.parse(ticket.conversation); } catch (e) {}
  }
  const convo = [{ sender: "user", message: ticket.message, timestamp: ticket.created_date }];
  if (ticket.admin_response) {
    convo.push({ sender: "admin", message: ticket.admin_response, timestamp: ticket.updated_date || ticket.created_date });
  }
  return convo;
}

function TicketModal({ ticket, onClose, onDone }) {
  const [convo, setConvo] = useState(parseConversation(ticket));
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [convo]);

  const sendReply = async () => {
    if (!response.trim()) return;
    setLoading(true);
    try {
      const newMsg = { sender: "admin", message: response.trim(), timestamp: new Date().toISOString() };
      const updatedConvo = [...convo, newMsg];
      await base44.entities.SupportTicket.update(ticket.id, {
        conversation: JSON.stringify(updatedConvo),
        admin_response: response.trim(),
        status: "responded",
      });
      await createNotification({
        user_id: ticket.user_id,
        title: "Support Ticket Updated",
        message: `Admin replied: ${response.trim().substring(0, 80)}${response.trim().length > 80 ? "..." : ""}`,
        type: "system",
        related_id: ticket.id,
      });
      setConvo(updatedConvo);
      setResponse("");
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  const closeTicket = async () => {
    setLoading(true);
    try {
      await base44.entities.SupportTicket.update(ticket.id, { status: "closed" });
      onDone();
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">Support Ticket</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="neu-inset-sm rounded-xl p-2 mb-3 text-xs text-slate-400 flex justify-between">
          <span>{ticket.user_name}</span>
          <span>{ticket.user_mobile}</span>
        </div>

        {/* Conversation */}
        <div ref={scrollRef} className="space-y-3 max-h-64 overflow-y-auto mb-4 p-1">
          {convo.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl p-3 ${msg.sender === "admin" ? "sdl-gradient text-white" : "neu-inset text-slate-700"}`}>
                <p className="text-sm">{msg.message}</p>
                <p className={`text-[9px] mt-1 ${msg.sender === "admin" ? "text-white/60" : "text-slate-400"}`}>{formatDate(msg.timestamp)}</p>
              </div>
            </div>
          ))}
          {ticket.screenshot_url && (
            <div className="flex justify-start">
              <a href={ticket.screenshot_url} target="_blank" rel="noreferrer" className="block">
                <img src={ticket.screenshot_url} alt="Screenshot" className="w-32 h-32 rounded-xl object-cover" />
              </a>
            </div>
          )}
        </div>

        {/* Reply */}
        {ticket.status !== "closed" && (
          <div className="mb-3">
            <div className="flex gap-2">
              <input
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !loading) sendReply(); }}
                placeholder="Type your reply..."
                className="neu-input flex-1 h-11 px-4 text-sm text-slate-700 placeholder:text-slate-400"
              />
              <button disabled={loading || !response.trim()} onClick={sendReply} className="sdl-gradient w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 disabled:opacity-50">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button disabled={loading} onClick={closeTicket} className="neu-btn flex-1 h-11 rounded-xl text-slate-500 text-sm font-medium">
            {ticket.status === "closed" ? "Closed" : "Close Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}