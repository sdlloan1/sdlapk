const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { formatINR, formatDate, formatAddress, getWhatsappUrl } from "@/lib/sdlUtils";
import NeuInput from "@/components/NeuInput";
import WhatsAppShareModal from "@/components/WhatsAppShareModal";
import { kycApprovedMessage, kycDonePendingLimitMessage, limitIncreasedMessage } from "@/lib/whatsappMessages";
import { logWhatsApp } from "@/lib/logWhatsApp";
import {
  CheckCircle2, XCircle, Pause, Play, X, TrendingUp, FileImage,
  User, Mail, Phone, CreditCard, Wallet, CalendarDays, Users, MapPin,
  ArrowDownLeft, ArrowUpRight, Gift, Edit3, Save, Loader2, Plus, ShieldAlert
} from "lucide-react";

export default function UserDetailTabs({ user, onClose, onUpdated }) {
  const [tab, setTab] = useState("personal");
  const [limit, setLimit] = useState(user.loan_limit || "");
  const [reason, setReason] = useState(user.rejection_reason || "");
  const [loading, setLoading] = useState(false);
  const [newLimit, setNewLimit] = useState("");
  const [loans, setLoans] = useState([]);
  const [walletTxns, setWalletTxns] = useState([]);
  const [referrals, setReferrals] = useState({ friends: [], loans: [] });
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [waMsg, setWaMsg] = useState(null);
  const [extraDocs, setExtraDocs] = useState(() => { try { return user.additional_documents ? JSON.parse(user.additional_documents) : []; } catch { return []; } });
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [settings, setSettings] = useState(null);
  const [blockDate, setBlockDate] = useState(user.kyc_blocked_until || "");
  const todayStr = new Date().toLocaleDateString("en-CA");

  useEffect(() => { setBlockDate(user.kyc_blocked_until || ""); }, [user.id, user.kyc_blocked_until]);

  const saveBlockDate = async () => {
    setLoading(true);
    try {
      await db.entities.User.update(user.id, {
        kyc_blocked_until: blockDate || "",
        kyc_attempt_count: 0,
        kyc_attempt_date: "",
      });
      onUpdated();
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  useEffect(() => {
    (async () => {
      try {
        const [userLoans, userTxns, s] = await Promise.all([
          db.entities.LoanApplication.filter({ user_id: user.id }, "-created_date"),
          db.entities.WalletTransaction.filter({ user_id: user.id }, "-created_date"),
          db.entities.AppSettings.list(),
        ]);
        setLoans(userLoans);
        setWalletTxns(userTxns);
        setSettings(s[0]);

        if (user.mobile_number) {
          const friends = await db.entities.User.filter({ referrer_mobile: user.mobile_number });
          const refLoans = [];
          for (const f of friends) {
            const fls = await db.entities.LoanApplication.filter({ user_id: f.id }, "-created_date");
            fls.forEach((l) => refLoans.push({ ...l, friendName: f.display_name || f.full_name, friendMobile: f.mobile_number }));
          }
          setReferrals({ friends, loans: refLoans });
        }
      } catch (e) {}
    })();
  }, [user.id]);

  const update = async (data) => {
    setLoading(true);
    try {
      await db.entities.User.update(user.id, data);
      onUpdated();
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  const kycDone = async () => {
    setLoading(true);
    try {
      const name = user.display_name || user.full_name || "User";
      await db.entities.User.update(user.id, { kyc_status: "approved", account_status: "active" });
      const waMessage = kycDonePendingLimitMessage(name, getWhatsappUrl(settings));
      await logWhatsApp({ user_id: user.id, user_name: name, user_mobile: user.mobile_number, message_type: "kyc_approved", message: waMessage });
      setWaMsg({ message: waMessage, phone: user.mobile_number });
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  const increaseLimit = async () => {
    if (!newLimit) return;
    setLoading(true);
    try {
      const name = user.display_name || user.full_name || "User";
      const prevLimit = Number(user.loan_limit) || 0;
      const newLim = Number(newLimit);
      await db.entities.User.update(user.id, { loan_limit: newLim });
      try { await db.functions.invoke("sendLimitAssignedEmail", { userId: user.id, limit: newLim }); } catch (e) {}
      const waMessage = limitIncreasedMessage(name, newLim - prevLimit, newLim, getWhatsappUrl(settings));
      await logWhatsApp({ user_id: user.id, user_name: name, user_mobile: user.mobile_number, message_type: "limit_increased", message: waMessage });
      setWaMsg({ message: waMessage, phone: user.mobile_number });
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  const startEdit = () => {
    setEditData({
      display_name: user.display_name || user.full_name || "",
      mobile_number: user.mobile_number || "",
      pan_number: user.pan_number || "",
      upi_id: user.upi_id || "",
      salary_date: user.salary_date || "",
      address_line1: user.address_line1 || "",
      address_line2: user.address_line2 || "",
      city: user.city || "",
      state: user.state || "",
      pincode: user.pincode || "",
    });
    setEditMode(true);
  };

  const saveEdit = async () => {
    setLoading(true);
    try {
      await db.entities.User.update(user.id, editData);
      setEditMode(false);
      onUpdated();
    } catch (e) { alert("Failed to save"); } finally { setLoading(false); }
  };

  const editField = (field, value) => setEditData({ ...editData, [field]: value });

  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      const updated = [...extraDocs, { url: file_url, name: file.name }];
      setExtraDocs(updated);
      await db.entities.User.update(user.id, { additional_documents: JSON.stringify(updated) });
      onUpdated();
    } catch (err) { alert("Upload failed"); }
    finally { setUploadingDoc(false); }
  };

  const removeDoc = async (i) => {
    const updated = extraDocs.filter((_, idx) => idx !== i);
    setExtraDocs(updated);
    try {
      await db.entities.User.update(user.id, { additional_documents: JSON.stringify(updated) });
      onUpdated();
    } catch (e) { alert("Failed"); }
  };

  const tabs = [
    { id: "personal", label: "Personal" },
    { id: "documents", label: "Documents" },
    { id: "payments", label: "Payments" },
    { id: "wallet", label: "Wallet" },
    { id: "referrals", label: "Referrals" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">User Review</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        {/* User header */}
        <div className="flex items-center gap-3 mb-4 neu-inset-sm rounded-xl p-3">
          {user.profile_picture ? <img src={user.profile_picture} alt="" className="w-10 h-10 rounded-full object-cover" /> :
            <div className="w-10 h-10 rounded-full sdl-gradient flex items-center justify-center text-white font-bold">{(user.display_name || user.full_name)?.[0] || "?"}</div>}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700">{user.display_name || user.full_name || "Incomplete"}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap ${tab === t.id ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Personal Details */}
        {tab === "personal" && (
          <div className="space-y-3">
            <div className="neu-inset rounded-2xl p-4 space-y-2.5">
              <DetailRow icon={User} label="Name" value={user.display_name || user.full_name} />
              <DetailRow icon={Mail} label="Email" value={user.email} />
              <DetailRow icon={Phone} label="Mobile" value={user.mobile_number} />
              <DetailRow icon={CreditCard} label="PAN" value={user.pan_number} />
              <DetailRow icon={MapPin} label="Address" value={formatAddress(user)} />
              <DetailRow icon={Wallet} label="UPI ID" value={user.upi_id} />
              <DetailRow icon={CalendarDays} label="Salary Date" value={user.salary_date ? `${user.salary_date} of month` : "-"} />
              <DetailRow icon={Users} label="Referrer" value={`${user.referrer_name || "-"} (${user.referrer_mobile || "-"})`} />
              <DetailRow icon={TrendingUp} label="Current Limit" value={formatINR(user.loan_limit || 0)} />
              <DetailRow icon={CheckCircle2} label="Status" value={`${user.kyc_status} / ${user.account_status}`} />
              <DetailRow icon={ShieldAlert} label="KYC Attempts Today" value={user.kyc_attempt_date === todayStr ? String(user.kyc_attempt_count || 0) : "0"} />
              <DetailRow icon={ShieldAlert} label="KYC Blocked Until" value={user.kyc_blocked_until || "-"} />
            </div>

            <div className="neu-inset rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-sdl-orange" /> KYC Limit Control
              </p>
              <p className="text-[10px] text-slate-400">Set the date from which this user can submit KYC again. Leave empty to unblock immediately. Saving also resets today's attempt count.</p>
              <div className="flex gap-2">
                <input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} className="neu-input flex-1 h-10 px-3 text-xs text-slate-700" />
                <button onClick={saveBlockDate} disabled={loading}
                  className="sdl-gradient px-4 rounded-xl text-white text-xs font-semibold shrink-0 disabled:opacity-50 flex items-center gap-1">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5" /> Save</>}
                </button>
              </div>
            </div>

            {editMode ? (
              <div className="neu-inset rounded-2xl p-4 space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">Full Name</label>
                  <NeuInput value={editData.display_name} onChange={(e) => editField("display_name", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">Mobile Number</label>
                  <NeuInput value={editData.mobile_number} onChange={(e) => editField("mobile_number", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">PAN Number</label>
                  <NeuInput value={editData.pan_number} onChange={(e) => editField("pan_number", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">UPI ID</label>
                  <NeuInput value={editData.upi_id} onChange={(e) => editField("upi_id", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">Salary Date (day of month)</label>
                  <NeuInput type="number" min={1} max={31} value={editData.salary_date} onChange={(e) => editField("salary_date", Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">Address Line 1</label>
                  <NeuInput value={editData.address_line1} onChange={(e) => editField("address_line1", e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">Address Line 2</label>
                  <NeuInput value={editData.address_line2} onChange={(e) => editField("address_line2", e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">City</label>
                    <NeuInput value={editData.city} onChange={(e) => editField("city", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">State</label>
                    <NeuInput value={editData.state} onChange={(e) => editField("state", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1 ml-1">Pincode</label>
                    <NeuInput value={editData.pincode} onChange={(e) => editField("pincode", e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={loading} className="sdl-gradient flex-1 h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
                  </button>
                  <button onClick={() => setEditMode(false)} className="neu-btn flex-1 h-11 rounded-xl text-slate-500 text-sm font-medium">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={startEdit} className="neu-btn w-full h-11 rounded-xl text-slate-600 text-sm font-medium flex items-center justify-center gap-2">
                <Edit3 className="w-4 h-4" /> Edit KYC Details
              </button>
            )}

            {user.kyc_status === "pending" && (
              <div className="neu-inset rounded-2xl p-4 space-y-3">
                <div className="neu-inset-sm rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">Click <span className="font-semibold text-sdl-green">KYC Done</span> to verify this user. You can assign a loan limit later — the user will see "KYC done, limit will be assigned soon" until then.</p>
                </div>
                <button disabled={loading} onClick={kycDone}
                  className="sdl-green bg-sdl-green w-full h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> KYC Done</>}
                </button>
                <div className="flex gap-2">
                  <NeuInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rejection reason" />
                  <button disabled={loading} onClick={() => update({ kyc_status: "rejected", rejection_reason: reason })}
                    className="bg-sdl-red px-4 rounded-xl text-white text-xs font-semibold flex items-center gap-1 shrink-0 disabled:opacity-50">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            )}

            {user.kyc_status === "approved" && (
              <div className="space-y-3">
                <div className="neu-inset rounded-2xl p-4 space-y-2">
                  <label className="block text-xs font-medium text-slate-500">{(user.loan_limit || 0) > 0 ? "Increase Limit" : "Set Limit"}</label>
                  <div className="flex gap-2">
                    <NeuInput type="number" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} placeholder={`Current: ${formatINR(user.loan_limit || 0)}`} />
                    <button disabled={loading || !newLimit} onClick={increaseLimit}
                      className="sdl-gradient px-4 rounded-xl text-white text-xs font-semibold flex items-center gap-1 shrink-0 disabled:opacity-50">
                      <TrendingUp className="w-4 h-4" /> Set
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">Setting a limit sends an email notification to the user.</p>
                </div>
                <div className="flex gap-2">
                  {user.account_status === "active" ? (
                    <button disabled={loading} onClick={() => update({ account_status: "hold" })} className="neu-btn flex-1 h-11 rounded-xl text-amber-600 text-sm font-medium flex items-center justify-center gap-1">
                      <Pause className="w-4 h-4" /> Hold Account
                    </button>
                  ) : (
                    <button disabled={loading} onClick={() => update({ account_status: "active" })} className="sdl-green bg-sdl-green flex-1 h-11 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-1">
                      <Play className="w-4 h-4" /> Activate
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Documents */}
        {tab === "documents" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "PAN Card", url: user.pan_card_image },
                { label: "Aadhaar Front", url: user.aadhaar_front_image },
                { label: "Aadhaar Back", url: user.aadhaar_back_image },
                { label: "Salary Slip", url: user.salary_slip_image },
              ].map((d, i) => (
                <div key={i} className="neu-inset-sm rounded-xl p-2">
                  {d.url ? <a href={d.url} target="_blank" rel="noreferrer"><img src={d.url} alt={d.label} className="w-full h-24 rounded-lg object-cover" /></a> :
                    <div className="w-full h-24 rounded-lg neu-inset flex items-center justify-center"><FileImage className="w-6 h-6 text-slate-300" /></div>}
                  <p className="text-[10px] text-slate-500 text-center mt-1">{d.label}</p>
                </div>
              ))}
            </div>

            {extraDocs.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-slate-500 mb-2 ml-1">Additional Documents</p>
                <div className="grid grid-cols-2 gap-2">
                  {extraDocs.map((d, i) => (
                    <div key={i} className="neu-inset-sm rounded-xl p-2 relative">
                      <a href={d.url} target="_blank" rel="noreferrer"><img src={d.url} alt={d.name} className="w-full h-24 rounded-lg object-cover" /></a>
                      <p className="text-[10px] text-slate-500 text-center mt-1 truncate">{d.name || "Document"}</p>
                      <button onClick={() => removeDoc(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="neu-btn w-full h-11 rounded-xl flex items-center justify-center gap-2 text-slate-600 text-sm font-medium cursor-pointer">
              {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Document</>}
              <input type="file" accept="image/*,application/pdf" onChange={handleDocUpload} className="hidden" />
            </label>
          </div>
        )}

        {/* Payment History */}
        {tab === "payments" && (
          <div className="space-y-2">
            {loans.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No loan history.</p> :
              loans.map((l) => (
                <div key={l.id} className="neu-inset-sm rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{formatINR(l.amount)}</p>
                      <p className="text-[10px] text-slate-400">Due: {formatDate(l.due_date)} • Repay: {formatINR(l.repayment_amount)}</p>
                    </div>
                    <span className="text-[10px] font-medium capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{l.status.replace(/_/g, " ")}</span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Saving Wallet */}
        {tab === "wallet" && (
          <div className="space-y-2">
            {walletTxns.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No wallet transactions.</p> :
              walletTxns.map((t) => {
                const isOut = t.type === "withdrawal";
                return (
                  <div key={t.id} className="neu-inset-sm rounded-xl p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isOut ? "bg-red-100" : "bg-green-100"}`}>
                        {isOut ? <ArrowUpRight className="w-3.5 h-3.5 text-sdl-red" /> : t.type === "referral_earning" ? <Gift className="w-3.5 h-3.5 text-sdl-green" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-sdl-green" />}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700 capitalize">{t.type.replace(/_/g, " ")}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(t.created_date)} • {t.status}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${isOut ? "text-sdl-red" : "text-sdl-green"}`}>
                      {isOut ? "-" : "+"}{formatINR(t.amount)}
                    </span>
                  </div>
                );
              })}
          </div>
        )}

        {/* Referral Details */}
        {tab === "referrals" && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400">{referrals.friends.length} friend(s) • {referrals.loans.length} loan(s)</p>
            {referrals.friends.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No referrals yet.</p> :
              referrals.friends.map((f) => {
                const fLoans = referrals.loans.filter((l) => l.user_id === f.id);
                return (
                  <div key={f.id} className="neu-inset-sm rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      {f.profile_picture ? <img src={f.profile_picture} alt="" className="w-7 h-7 rounded-full object-cover" /> :
                        <div className="w-7 h-7 rounded-full sdl-gradient flex items-center justify-center text-white text-xs font-bold">{f.full_name?.[0] || "?"}</div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{f.full_name || "Incomplete"}</p>
                        <p className="text-[10px] text-slate-400">{f.mobile_number}</p>
                      </div>
                    </div>
                    {fLoans.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/70 space-y-1">
                        {fLoans.map((l) => (
                          <div key={l.id} className="grid grid-cols-2 gap-1 text-[10px] text-slate-500">
                            <span>Loan: <span className="font-semibold text-slate-600">{formatINR(l.amount)}</span></span>
                            <span>Repay: <span className="font-semibold text-slate-600">{formatINR(l.repayment_amount)}</span></span>
                            <span>Due: <span className="font-semibold text-slate-600">{formatDate(l.due_date)}</span></span>
                            <span className="capitalize">Status: <span className="font-semibold text-slate-600">{l.status.replace(/_/g, " ")}</span></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {waMsg && <WhatsAppShareModal message={waMsg.message} phone={waMsg.phone} onClose={() => { setWaMsg(null); onUpdated(); }} />}
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-slate-400 text-xs">{label}: </span>
        <span className="text-slate-700 font-medium text-xs break-words">{value || "-"}</span>
      </div>
    </div>
  );
}