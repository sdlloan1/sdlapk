const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import NeuButton from "@/components/NeuButton";
import NeuInput from "@/components/NeuInput";
import { formatDate, formatAddress, getShareableDomain } from "@/lib/sdlUtils";
import {
  User, Phone, CreditCard, Mail, Wallet, CalendarDays, Users, Share2, MessageSquare,
  Upload, Camera, Check, Loader2, X, Shield, Info, ChevronRight, Copy, MessageCircle, LogOut,
  FileText, ChevronDown, ChevronUp, Download, Instagram, MapPin, Handshake, Send, Plus, ArrowLeft, Trash2
  } from "lucide-react";
  import { Image } from "@/components/ui/image";
  import DownloadAppModal from "@/components/DownloadAppModal";
  import PhotoAdjustModal from "@/components/PhotoAdjustModal";
  import { logoutToLogin } from "@/lib/logout";

export default function ProfilePage({ user, onUserUpdate, settings, active }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile");
  const [team, setTeam] = useState([]);
  const [showEdit, setShowEdit] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [infoModal, setInfoModal] = useState(null);
  const [showDocs, setShowDocs] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [showAdjust, setShowAdjust] = useState(false);

  useEffect(() => {
    if (active) db.entities.TeamMember.list("order").then((t) => setTeam(t));
  }, [active]);

  const canUpdateSalary = user.salary_date_set_date
    ? (new Date() - new Date(user.salary_date_set_date)) / (1000 * 60 * 60 * 24 * 30) >= 6
    : false;
  const canUpdateSalarySlip = user.salary_slip_updated_date
    ? (new Date() - new Date(user.salary_slip_updated_date)) / (1000 * 60 * 60 * 24 * 30) >= 6
    : false;

  const fields = [
    { icon: User, label: "Full Name", value: user.display_name || user.full_name },
    { icon: Mail, label: "Email", value: user.email },
    { icon: Phone, label: "Mobile", value: user.mobile_number },
    { icon: CreditCard, label: "PAN Number", value: user.pan_number },
    { icon: MapPin, label: "Address", value: formatAddress(user) },
    { icon: Wallet, label: "UPI ID", value: user.upi_id, editable: "upi" },
    { icon: CalendarDays, label: "Salary Date", value: user.salary_date ? `${user.salary_date} of every month` : "-", sub: `Fixed until ${user.salary_date_set_date ? formatDate(new Date(new Date(user.salary_date_set_date).setMonth(new Date(user.salary_date_set_date).getMonth() + 6)).toISOString()) : "-"}` },
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* Profile header */}
      <div className="neu-card p-5 text-center">
        <div className="relative inline-block mb-3">
          {user.profile_picture ? (
            <Image src={user.profile_picture} alt="profile" fittingType="fill" className="w-20 h-20 rounded-full mx-auto" />
          ) : (
            <div className="w-20 h-20 rounded-full sdl-gradient mx-auto flex items-center justify-center text-white text-2xl font-bold">
              {(user.display_name || user.full_name)?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
            </div>
          )}
          <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full sdl-gradient flex items-center justify-center cursor-pointer shadow-lg">
            <Camera className="w-3.5 h-3.5 text-white" />
            <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={(e) => {
              const file = e.target.files[0]; if (!file) return;
              setPhotoFile(file);
              setShowAdjust(true);
            }} />
          </label>
          {user.profile_picture && (
            <button onClick={async () => {
              if (!confirm("Remove your profile photo?")) return;
              await db.entities.User.update(user.id, { profile_picture: "" });
              onUserUpdate();
            }} className="absolute top-0 right-0 w-7 h-7 rounded-full bg-sdl-red flex items-center justify-center shadow-lg">
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>
        <h3 className="text-base font-bold text-slate-700">{user.display_name || user.full_name || "User"}</h3>
        <p className="text-xs text-slate-400">{user.email}</p>
        {user.kyc_status === "approved" && (
          <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-green-100 text-sdl-green text-xs font-medium">
            <Shield className="w-3 h-3" /> Verified
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setShowShare(true)} className="neu-card p-4 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <div className="w-10 h-10 rounded-full sdl-gradient flex items-center justify-center"><Share2 className="w-5 h-5 text-white" /></div>
          <span className="text-xs font-medium text-slate-600">Refer & Earn</span>
        </button>
        <button onClick={() => setShowTicket(true)} className="neu-card p-4 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <div className="w-10 h-10 rounded-full sdl-gradient flex items-center justify-center"><MessageSquare className="w-5 h-5 text-white" /></div>
          <span className="text-xs font-medium text-slate-600">Support Ticket</span>
        </button>
      </div>

      {/* Details */}
      <div className="neu-card p-5">
        <h3 className="text-sm font-bold text-slate-600 mb-3">My Details</h3>
        <div className="space-y-2">
          {fields.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="neu-inset-sm rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full neu-card-sm flex items-center justify-center"><Icon className="w-4 h-4 text-sdl-orange" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400">{f.label}</p>
                  <p className="text-sm font-medium text-slate-700 truncate">{f.value || "-"}</p>
                  {f.sub && <p className="text-[10px] text-slate-400">{f.sub}</p>}
                </div>
                {f.editable && (
                  <button onClick={() => setShowEdit(f.editable)} className="text-xs sdl-gradient-text font-medium">Edit</button>
                )}
              </div>
            );
          })}
        </div>

        {/* Documents */}
        <button onClick={() => setShowDocs((s) => !s)} className="w-full mt-4 flex items-center justify-between neu-inset-sm rounded-xl p-3 active:scale-[0.99] transition-transform">
          <span className="text-sm font-bold text-slate-600 flex items-center gap-2"><FileText className="w-4 h-4 text-sdl-orange" /> Documents</span>
          {showDocs ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {showDocs && (
          <div className="mt-2 neu-fade-up">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "PAN Card", url: user.pan_card_image },
                { label: "Aadhaar Front", url: user.aadhaar_front_image },
                { label: "Aadhaar Back", url: user.aadhaar_back_image },
                { label: "Salary Slip", url: user.salary_slip_image, updatable: true },
              ].map((doc, i) => (
                <div key={i} className="neu-inset-sm rounded-xl p-2">
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noreferrer" className="block">
                      <Image src={doc.url} alt={doc.label} fittingType="fill" className="w-full h-20 rounded-xl" />
                    </a>
                  ) : <div className="w-full h-20 rounded-xl flex items-center justify-center text-[10px] text-slate-400">Not uploaded</div>}
                  <p className="text-[10px] text-slate-500 text-center mt-1">{doc.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {!canUpdateSalarySlip && (
                <p className="text-[10px] text-slate-400 text-center">Salary slip can be updated every 6 months.</p>
              )}
              {canUpdateSalary && <p className="text-[10px] text-sdl-green text-center">You can now change your salary date (6 months passed).</p>}
            </div>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="neu-card p-2">
        <MenuItem icon={Handshake} label="SDL Partner" onClick={() => navigate("/partner")} />
        <MenuItem icon={Users} label="SDL Team" onClick={() => setTab("team")} />
        <MenuItem icon={Download} label="Download App" onClick={() => setShowDownload(true)} />
        <MenuItem icon={Shield} label="Privacy Policy" onClick={() => setInfoModal(settings?.privacy_policy)} />
        <MenuItem icon={Info} label="About Us" onClick={() => setInfoModal(settings?.about_us)} />
        <MenuItem icon={LogOut} label="Logout" onClick={() => logoutToLogin(navigate)} />
      </div>

      {/* Modals */}
      {showEdit && <EditModal type={showEdit} user={user} onClose={() => setShowEdit(null)} onSaved={() => { setShowEdit(null); onUserUpdate(); }} />}
      {showTicket && <TicketModal user={user} onClose={() => setShowTicket(false)} />}
      {showShare && <ShareModal user={user} settings={settings} onClose={() => setShowShare(false)} />}
      {tab === "team" && <TeamModal team={team} onClose={() => setTab("profile")} />}
      {infoModal && <InfoModal title={infoModal === settings?.privacy_policy ? "Privacy Policy" : "About Us"} content={infoModal} onClose={() => setInfoModal(null)} />}
      {showDownload && <DownloadAppModal onClose={() => setShowDownload(false)} user={user} />}
      {showAdjust && photoFile && (
        <PhotoAdjustModal
          file={photoFile}
          onClose={() => { setShowAdjust(false); setPhotoFile(null); }}
          onSaved={async (url) => {
            await db.entities.User.update(user.id, { profile_picture: url });
            setShowAdjust(false);
            setPhotoFile(null);
            onUserUpdate();
          }}
        />
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100/50 transition-colors">
      <div className="w-8 h-8 rounded-full neu-card-sm flex items-center justify-center"><Icon className="w-4 h-4 text-sdl-orange" /></div>
      <span className="text-sm font-medium text-slate-600 flex-1 text-left">{label}</span>
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </button>
  );
}

function EditModal({ type, user, onClose, onSaved }) {
  const [value, setValue] = useState(type === "upi" ? user.upi_id || "" : "");
  const [loading, setLoading] = useState(false);
  const handleSave = async () => {
    setLoading(true);
    try {
      await db.entities.User.update(user.id, { upi_id: value.trim() });
      onSaved();
    } catch (e) { alert("Failed"); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">Update UPI ID</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <NeuInput icon={Wallet} value={value} onChange={(e) => setValue(e.target.value)} placeholder="yourname@upi" />
        <NeuButton variant="gradient" loading={loading} onClick={handleSave} className="w-full h-12 rounded-2xl mt-4">Save</NeuButton>
      </div>
    </div>
  );
}

function TicketModal({ user, onClose }) {
  const [view, setView] = useState("list");
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [reply, setReply] = useState("");

  const loadTickets = async () => {
    const t = await db.entities.SupportTicket.filter({ user_id: user.id }, "-created_date");
    setTickets(t);
  };

  useEffect(() => { loadTickets(); }, []);

  const parseConversation = (ticket) => {
    if (ticket.conversation) {
      try { return JSON.parse(ticket.conversation); } catch (e) {}
    }
    const convo = [{ sender: "user", message: ticket.message, timestamp: ticket.created_date }];
    if (ticket.admin_response) {
      convo.push({ sender: "admin", message: ticket.admin_response, timestamp: ticket.updated_date || ticket.created_date });
    }
    return convo;
  };

  const handleFile = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) { alert("JPG/PNG only"); return; }
    setUploading(true);
    try { const { file_url } = await db.integrations.Core.UploadFile({ file }); setScreenshot(file_url); }
    catch { alert("Upload failed"); } finally { setUploading(false); }
  };

  const submit = async () => {
    if (!message.trim()) { alert("Please describe your issue"); return; }
    setLoading(true);
    try {
      const initialConvo = [{ sender: "user", message: message.trim(), timestamp: new Date().toISOString() }];
      await db.entities.SupportTicket.create({
        user_id: user.id, user_name: user.display_name || user.full_name, user_mobile: user.mobile_number,
        message: message.trim(), screenshot_url: screenshot, status: "open",
        conversation: JSON.stringify(initialConvo),
      });
      setDone(true);
      loadTickets();
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedTicket) return;
    setLoading(true);
    try {
      const convo = parseConversation(selectedTicket);
      const newMsg = { sender: "user", message: reply.trim(), timestamp: new Date().toISOString() };
      const updatedConvo = [...convo, newMsg];
      await db.entities.SupportTicket.update(selectedTicket.id, {
        conversation: JSON.stringify(updatedConvo),
        status: "open",
      });
      const updated = { ...selectedTicket, conversation: JSON.stringify(updatedConvo), status: "open" };
      setSelectedTicket(updated);
      setReply("");
      loadTickets();
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  const closeNewTicket = () => {
    setView("list");
    setMessage("");
    setScreenshot("");
    setDone(false);
  };

  const openTicket = (t) => {
    setSelectedTicket(t);
    setView("conversation");
    setReply("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {view !== "list" && (
              <button onClick={() => { setView("list"); setSelectedTicket(null); setDone(false); setMessage(""); }} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><ArrowLeft className="w-4 h-4" /></button>
            )}
            <h3 className="text-base font-bold sdl-gradient-text">
              {view === "list" ? "Support Tickets" : view === "new" ? "New Ticket" : "Conversation"}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        {/* List View */}
        {view === "list" && (
          <div className="space-y-3">
            <button onClick={() => setView("new")} className="sdl-gradient w-full h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg">
              <Plus className="w-4 h-4" /> New Ticket
            </button>
            {tickets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No tickets yet. Create one to get started.</p>
            ) : (
              tickets.map((t) => {
                const convo = parseConversation(t);
                const lastMsg = convo[convo.length - 1];
                return (
                  <button key={t.id} onClick={() => openTicket(t)} className="neu-inset-sm rounded-xl p-3 w-full text-left active:scale-[0.99] transition-transform">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className="text-xs font-semibold text-slate-700 line-clamp-1 flex-1">{t.message}</p>
                      <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full shrink-0 ${t.status === "open" ? "bg-amber-100 text-amber-600" : t.status === "responded" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-sdl-green"}`}>{t.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{formatDate(t.created_date)}</p>
                    {lastMsg && lastMsg.sender === "admin" && <p className="text-[10px] text-sdl-orange mt-1 line-clamp-1">↳ {lastMsg.message}</p>}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* New Ticket View */}
        {view === "new" && (
          done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full sdl-gradient mx-auto flex items-center justify-center"><Check className="w-8 h-8 text-white" /></div>
              <p className="text-sm text-slate-500">Your ticket has been submitted. SDL support will get back to you soon.</p>
              <button onClick={closeNewTicket} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg">Done</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Describe your issue</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="neu-input w-full p-4 text-sm text-slate-700 placeholder:text-slate-400 resize-none" placeholder="What issue are you facing?" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Attach Screenshot (optional)</label>
                <label className="block">
                  <div className={`neu-inset rounded-2xl h-32 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${screenshot ? "border-2 border-sdl-green" : ""}`}>
                    {uploading ? <Loader2 className="w-6 h-6 text-sdl-orange animate-spin" /> :
                      screenshot ? <><img src={screenshot} alt="" className="absolute inset-0 w-full h-full object-cover" /><div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-sdl-green flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div></> :
                      <><Upload className="w-6 h-6 text-slate-400 mb-1" /><span className="text-xs text-slate-400">JPG / PNG</span></>
                    }
                    <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleFile} className="hidden" />
                  </div>
                </label>
              </div>
              <NeuButton variant="gradient" loading={loading} onClick={submit} className="w-full h-12 rounded-2xl">Submit Ticket</NeuButton>
            </div>
          )
        )}

        {/* Conversation View */}
        {view === "conversation" && selectedTicket && (
          <div className="space-y-3">
            <div className="space-y-3 max-h-72 overflow-y-auto p-1">
              {parseConversation(selectedTicket).map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 ${msg.sender === "user" ? "sdl-gradient text-white" : "neu-inset text-slate-700"}`}>
                    <p className="text-sm whitespace-pre-line">{msg.message}</p>
                    <p className={`text-[9px] mt-1 ${msg.sender === "user" ? "text-white/60" : "text-slate-400"}`}>{formatDate(msg.timestamp)}</p>
                  </div>
                </div>
              ))}
              {selectedTicket.screenshot_url && (
                <div className="flex justify-start">
                  <a href={selectedTicket.screenshot_url} target="_blank" rel="noreferrer" className="block">
                    <img src={selectedTicket.screenshot_url} alt="" className="w-32 h-32 rounded-xl object-cover" />
                  </a>
                </div>
              )}
            </div>
            {selectedTicket.status !== "closed" ? (
              <div className="flex gap-2">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !loading) sendReply(); }}
                  placeholder="Type your reply..."
                  className="neu-input flex-1 h-11 px-4 text-sm text-slate-700 placeholder:text-slate-400"
                />
                <button disabled={loading || !reply.trim()} onClick={sendReply} className="sdl-gradient w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="neu-inset-sm rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-sdl-green">
                <Check className="w-3 h-3" /> This ticket is closed
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ShareModal({ user, settings, onClose }) {
  const [copied, setCopied] = useState(false);
  const refLink = `${getShareableDomain(settings)}/register?ref=${user.mobile_number || ""}`;
  const shareText = `🪔 Join SDL (Shubh Dhan Lakshmi) - India's friendly salary-backed loan platform!\n\nUse my referral:\nName: ${user.display_name || user.full_name}\nMobile: ${user.mobile_number}\n\n${refLink}\n\nBorrow and repay on your salary date. Earn from referrals!`;
  const shareUrl = encodeURIComponent(shareText);

  const copyLink = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareInstagram = async () => {
    await navigator.clipboard.writeText(shareText).catch(() => {});
    window.open("https://www.instagram.com/", "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">Refer & Earn</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-slate-500 mb-4">Earn 1% of your friend's loan amount into your savings wallet when they repay!</p>
        <div className="grid grid-cols-3 gap-3">
          <a href={`https://wa.me/?text=${shareUrl}`} target="_blank" rel="noreferrer" className="neu-card p-4 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-green-600" /></div>
            <span className="text-xs font-medium text-slate-600">WhatsApp</span>
          </a>
          <button onClick={shareInstagram} className="neu-card p-4 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center"><Instagram className="w-5 h-5 text-pink-600" /></div>
            <span className="text-xs font-medium text-slate-600">Instagram</span>
          </button>
          <button onClick={copyLink} className="neu-card p-4 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">{copied ? <Check className="w-5 h-5 text-sdl-green" /> : <Copy className="w-5 h-5 text-sdl-orange" />}</div>
            <span className="text-xs font-medium text-slate-600">{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
        <div className="neu-inset rounded-2xl p-3 mt-4">
          <p className="text-[10px] text-slate-400 mb-1">Your referral info:</p>
          <p className="text-xs text-slate-600">Name: <span className="font-semibold">{user.display_name || user.full_name}</span></p>
          <p className="text-xs text-slate-600">Mobile: <span className="font-semibold">{user.mobile_number}</span></p>
        </div>
      </div>
    </div>
  );
}

function TeamModal({ team, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">SDL Team</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          {team.map((m) => (
            <div key={m.id} className="neu-inset-sm rounded-2xl p-4 flex items-center gap-4">
              {m.photo_url ? <img src={m.photo_url} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" /> :
                <div className="w-14 h-14 rounded-full sdl-gradient flex items-center justify-center text-white text-xl font-bold shrink-0">{m.name?.[0]}</div>}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 leading-tight">{m.name}</p>
                <p className="text-xs text-sdl-orange font-medium mt-0.5">{m.role}</p>
                {m.education && <p className="text-[10px] text-slate-400 mt-1 leading-snug">{m.education}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoModal({ title, content, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="neu-inset rounded-2xl p-4">
          <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{content || "Loading..."}</p>
        </div>
      </div>
    </div>
  );
}