import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { formatINR, formatDate, upiQrUrl, isOverdue, daysOverdue, getWhatsappUrl, payableTotal } from "@/lib/sdlUtils";
import { CheckCircle2, X, XCircle, Loader2, ScanLine, Upload, FileDown, FileImage, Plus, FileAudio, Download, Pencil } from "lucide-react";
import EditRepaymentModal from "@/components/admin/EditRepaymentModal";
import { createNotification } from "@/lib/notifications";
import WhatsAppShareModal from "@/components/WhatsAppShareModal";
import { loanDisbursedMessage, repaymentVerifiedMessage, loanRejectedMessage } from "@/lib/whatsappMessages";
import { logWhatsApp } from "@/lib/logWhatsApp";

export default function AdminLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending_disbursement");
  const [action, setAction] = useState(null);
  const [search, setSearch] = useState("");
  const [userDetail, setUserDetail] = useState(null);
  const [viewProof, setViewProof] = useState(null);
  const [settings, setSettings] = useState(null);
  const [usersMap, setUsersMap] = useState({});
  const [exporting, setExporting] = useState(false);
  const [editRepay, setEditRepay] = useState(null);

  const loadData = async () => {
    const [l, s] = await Promise.all([
      base44.entities.LoanApplication.list("-created_date", 200),
      base44.entities.AppSettings.list(),
    ]);
    setLoans(l);
    setSettings(s[0]);
    const ids = [...new Set(l.map((loan) => loan.user_id).filter(Boolean))];
    if (ids.length) {
      try {
        const users = await base44.entities.User.filter({ id: { $in: ids } });
        const map = {};
        users.forEach((u) => { map[u.id] = u; });
        setUsersMap(map);
      } catch (e) {}
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await base44.functions.invoke("exportToGoogleSheet", {});
      const data = res.data || res;
      if (data.url) window.open(data.url, "_blank");
      else alert("Export completed but no URL returned");
    } catch (e) {
      alert("Export failed: " + (e.message || "error"));
    } finally {
      setExporting(false);
    }
  };

  const filters = [
    { id: "pending_disbursement", label: "To Disburse" },
    { id: "disbursed", label: "Active" },
    { id: "overdue", label: "Overdue" },
    { id: "upcoming", label: "Upcoming" },
    { id: "pending_verification", label: "Repay Verify" },
    { id: "paid", label: "Paid" },
    { id: "rejected", label: "Rejected" },
    { id: "by_user", label: "By User" },
  ];

  const getFiltered = (id) => {
    if (id === "overdue") return loans.filter((l) => l.status === "disbursed" && isOverdue(l.due_date));
    if (id === "upcoming") return loans.filter((l) => l.status === "disbursed" && !isOverdue(l.due_date));
    if (id === "paid") return loans.filter((l) => l.status === "repaid");
    return loans.filter((l) => l.status === id);
  };

  let filtered = getFiltered(filter);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((l) =>
      (l.user_name || "").toLowerCase().includes(q) ||
      (l.user_mobile || "").includes(q) ||
      (l.loan_id || "").toLowerCase().includes(q)
    );
  }

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Search + Export */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, or loan ID..."
            className="neu-input w-full h-12 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <button onClick={handleExport} disabled={exporting} className="sdl-gradient h-12 px-4 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg disabled:opacity-50 shrink-0">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${filter === f.id ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>
            {f.label} ({getFiltered(f.id).length})
          </button>
        ))}
      </div>

      {filter === "by_user" ? (
        <ByUserView loans={loans} usersMap={usersMap} search={search} onSelect={(u) => setUserDetail(u)} />
      ) : filtered.length === 0 ? (
        <div className="neu-card p-8 text-center text-sm text-slate-400">No loans in this category.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <div key={l.id} className="neu-card p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700">{l.user_name} {formatINR(l.amount)}</p>
                  {l.loan_id && <p className="text-[10px] font-mono text-sdl-orange">ID: {l.loan_id}</p>}
                  <p className="text-xs text-slate-400">{l.user_mobile} • Due: {formatDate(l.due_date)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-semibold sdl-gradient-text whitespace-nowrap">Repay: {formatINR(payableTotal(l, settings))}</span>
                  {["pending_disbursement", "disbursed", "overdue", "pending_verification"].includes(l.status) && (
                    <button onClick={() => setEditRepay(l)} title="Change repayment amount"
                      className="w-7 h-7 rounded-full neu-btn flex items-center justify-center text-slate-500 shrink-0">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3 gap-2">
                <span className="min-w-0 truncate">UPI: {l.user_upi_id}</span>
                <span className="shrink-0 whitespace-nowrap">Loan Date: {formatDate(l.loan_date || l.created_date)}</span>
              </div>
              {(() => {
                const extra = l.additional_files ? (() => { try { return JSON.parse(l.additional_files); } catch { return []; } })() : [];
                const hasAny = l.agreement_pdf_url || l.repayment_screenshot || l.disbursement_screenshot || l.call_recording_url || extra.length;
                if (!hasAny) return null;
                return (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {l.agreement_pdf_url && (
                      <a href={l.agreement_pdf_url} target="_blank" rel="noreferrer" className="neu-btn px-3 h-9 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-1">
                        <FileDown className="w-3.5 h-3.5" /> Agreement
                      </a>
                    )}
                    {l.disbursement_screenshot && (
                      <button onClick={() => setViewProof(l.disbursement_screenshot)} className="neu-btn px-3 h-9 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-1">
                        <FileImage className="w-3.5 h-3.5" /> Disbursement Proof
                      </button>
                    )}
                    {l.repayment_screenshot && (
                      <button onClick={() => setViewProof(l.repayment_screenshot)} className="neu-btn px-3 h-9 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-1">
                        <FileImage className="w-3.5 h-3.5" /> Repayment Proof
                      </button>
                    )}
                    {l.call_recording_url && (
                      <a href={l.call_recording_url} target="_blank" rel="noreferrer" className="neu-btn px-3 h-9 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-1">
                        <FileAudio className="w-3.5 h-3.5" /> Call Recording
                      </a>
                    )}
                    {extra.map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noreferrer" className="neu-btn px-3 h-9 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-1">
                        <FileAudio className="w-3.5 h-3.5" /> {f.name || "File"}
                      </a>
                    ))}
                  </div>
                );
              })()}
              {filter === "rejected" && l.admin_rejection_reason && (
                <div className="neu-inset-sm rounded-xl p-3 mb-3" style={{ background: "rgba(244,67,54,0.06)" }}>
                  <p className="text-[10px] font-semibold text-sdl-red mb-0.5">Rejection Reason</p>
                  <p className="text-xs text-slate-600">{l.admin_rejection_reason}</p>
                </div>
              )}
              {filter === "pending_disbursement" && (
                <div className="flex gap-2">
                  <button onClick={() => setAction({ loan: l, type: "disburse" })}
                    className="sdl-gradient flex-1 h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg">
                    <ScanLine className="w-4 h-4" /> Disburse Loan
                  </button>
                  <button onClick={() => setAction({ loan: l, type: "reject" })}
                    className="bg-sdl-red flex-1 h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
              {filter === "disbursed" && (
                <div className="text-xs text-slate-500 neu-inset-sm rounded-xl p-2 text-center">Awaiting user repayment on {formatDate(l.due_date)}</div>
              )}
              {filter === "pending_verification" && (
                <div className="flex gap-2">
                  <button onClick={() => setAction({ loan: l, type: "confirm_repay" })}
                    className="sdl-green bg-sdl-green flex-1 h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg">
                    <CheckCircle2 className="w-4 h-4" /> Confirm
                  </button>
                  <button onClick={() => setAction({ loan: l, type: "reject_repay" })}
                    className="bg-sdl-red flex-1 h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
              {filter === "repaid" && (
                <div className="text-xs text-sdl-green neu-inset-sm rounded-xl p-2 text-center flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Repaid on {formatDate(l.repaid_date)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {action && <ActionModal action={action} settings={settings} onClose={() => setAction(null)} onDone={() => { setAction(null); loadData(); }} />}
      {userDetail && <UserLoansModal user={userDetail} onClose={() => setUserDetail(null)} />}
      {editRepay && (
        <EditRepaymentModal
          loan={editRepay}
          settings={settings}
          onClose={() => setEditRepay(null)}
          onSaved={() => { setEditRepay(null); loadData(); }}
        />
      )}
      {viewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" onClick={() => setViewProof(null)}>
          <div className="relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <img src={viewProof} alt="Proof" className="w-full rounded-xl" />
            <button onClick={() => setViewProof(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function ByUserView({ loans, usersMap, search, onSelect }) {
  const activeLoans = loans.filter((l) => l.status === "disbursed");
  const repaidLoans = loans.filter((l) => l.status === "repaid");
  const userMap = {};
  activeLoans.forEach((l) => {
    const u = usersMap[l.user_id];
    if (!userMap[l.user_id]) userMap[l.user_id] = { user_id: l.user_id, user_name: (u && (u.display_name || u.full_name)) || l.user_name || "Unknown User", user_mobile: l.user_mobile || (u && u.mobile_number), is_partner: u && u.partner_status === "approved", activeLoans: [], repaidLoans: [] };
    userMap[l.user_id].activeLoans.push(l);
  });
  repaidLoans.forEach((l) => {
    if (userMap[l.user_id]) userMap[l.user_id].repaidLoans.push(l);
  });
  let users = Object.values(userMap);
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    users = users.filter((u) => (u.user_name || "").toLowerCase().includes(q) || (u.user_mobile || "").includes(q));
  }
  if (users.length === 0) return <div className="neu-card p-8 text-center text-sm text-slate-400">No active loans.</div>;
  return (
    <div className="space-y-3">
      <div className="neu-card p-4 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-600">Total Users with Active Loans</span>
        <span className="text-lg font-bold sdl-gradient-text">{users.length}</span>
      </div>
      {users.map((u) => {
        const totalActive = u.activeLoans.reduce((s, l) => s + l.amount, 0);
        const totalRepaid = u.repaidLoans.reduce((s, l) => s + l.amount, 0);
        return (
          <button key={u.user_id} onClick={() => onSelect(u)} className="neu-card p-4 w-full text-left active:scale-[0.99] transition-transform">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-700">{u.user_name}</p>
                  {u.is_partner && <span className="text-[10px] font-bold text-sdl-orange bg-orange-100 px-2 py-0.5 rounded-full">SDL Partner</span>}
                </div>
                <p className="text-xs text-slate-400">{u.user_mobile}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-blue-600 font-medium">{u.activeLoans.length} active</p>
                <p className="text-sm font-bold text-slate-700">{formatINR(totalActive)}</p>
                {totalRepaid > 0 && <p className="text-[10px] text-sdl-green">Repaid: {formatINR(totalRepaid)}</p>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function UserLoansModal({ user, onClose }) {
  const [partnerLoans, setPartnerLoans] = useState([]);
  const [loadingPartner, setLoadingPartner] = useState(false);

  useEffect(() => {
    if (user.is_partner && user.user_id) {
      setLoadingPartner(true);
      base44.entities.PartnerLoanAssignment.filter({ partner_id: user.user_id, status: "active" }, "-created_date")
        .then((res) => setPartnerLoans(res))
        .catch(() => {})
        .finally(() => setLoadingPartner(false));
    }
  }, [user]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold sdl-gradient-text">{user.user_name}</h3>
              {user.is_partner && <span className="text-[10px] font-bold text-sdl-orange bg-orange-100 px-2 py-0.5 rounded-full">SDL Partner</span>}
            </div>
            <p className="text-xs text-slate-400">{user.user_mobile}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Active Loans ({user.activeLoans.length})</p>
            <div className="space-y-2">
              {user.activeLoans.map((l) => (
                <div key={l.id} className="neu-inset-sm rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{formatINR(l.amount)}</p>
                      {l.loan_id && <p className="text-[10px] font-mono text-sdl-orange">ID: {l.loan_id}</p>}
                      <p className="text-[10px] text-slate-400">Due: {formatDate(l.due_date)}</p>
                    </div>
                    <span className="text-xs font-medium text-blue-600">Active</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Repay: {formatINR(l.repayment_amount)}</p>
                </div>
              ))}
            </div>
          </div>
          {user.is_partner && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Partner-Funded Active Loans ({loadingPartner ? "..." : partnerLoans.length})</p>
              {loadingPartner ? <p className="text-xs text-slate-400 text-center py-2">Loading...</p> :
                partnerLoans.length === 0 ? <p className="text-xs text-slate-400 text-center py-2">No active partner-funded loans.</p> :
                <div className="space-y-2">
                  {partnerLoans.map((a) => (
                    <div key={a.id} className="neu-inset-sm rounded-xl p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{formatINR(a.loan_amount)}</p>
                          <p className="text-[10px] text-slate-400">Due: {formatDate(a.due_date)}</p>
                          <p className="text-[10px] text-sdl-green">Profit: {formatINR(a.profit_earned || 0)}</p>
                        </div>
                        <span className="text-xs font-medium text-sdl-orange">Funded</span>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>
          )}
          {user.repaidLoans.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Repaid Loans ({user.repaidLoans.length})</p>
              <div className="space-y-2">
                {user.repaidLoans.map((l) => (
                  <div key={l.id} className="neu-inset-sm rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{formatINR(l.amount)}</p>
                        {l.loan_id && <p className="text-[10px] font-mono text-sdl-orange">ID: {l.loan_id}</p>}
                        <p className="text-[10px] text-slate-400">Repaid: {formatDate(l.repaid_date)}</p>
                      </div>
                      <span className="text-xs font-medium text-sdl-green">Repaid</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionModal({ action, settings, onClose, onDone }) {
  const { loan, type } = action;
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [uploading, setUploading] = useState(false);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const isDisburse = type === "disburse";
  const isReject = type === "reject";
  const isRejectRepay = type === "reject_repay";
  const [reason, setReason] = useState("");
  const [waMsg, setWaMsg] = useState(null);
  const qrUrl = isDisburse ? upiQrUrl(loan.user_upi_id, loan.amount) : null;

  useEffect(() => {
    if (isDisburse) {
      base44.entities.User.list("-created_date", 200).then((users) => {
        setPartners(users.filter((u) => u.partner_status === "approved"));
      }).catch(() => {});
    }
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setScreenshot(file_url);
    } catch (err) { alert("Upload failed"); }
    finally { setUploading(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAdditionalFiles((prev) => [...prev, { url: file_url, name: file.name }]);
    } catch (err) { alert("Upload failed"); }
    finally { setUploadingFile(false); }
  };

  const handleDisburse = async () => {
    setLoading(true);
    try {
      const updateData = { status: "disbursed", disbursed_date: new Date().toISOString() };
      if (screenshot) updateData.disbursement_screenshot = screenshot;
      if (additionalFiles.length > 0) updateData.additional_files = JSON.stringify(additionalFiles);
      await base44.entities.LoanApplication.update(loan.id, updateData);
      await base44.entities.AdminCapital.create({ type: "disbursement", amount: loan.amount, related_loan_id: loan.id, related_user_id: loan.user_id, description: `Disbursed to ${loan.user_name}` });

      // Assign to partner if selected
      if (selectedPartner) {
        const profit = Math.round((loan.amount * (Number(settings?.partner_profit_percentage) || 10)) / 100);
        await base44.entities.PartnerLoanAssignment.create({
          loan_id: loan.id,
          partner_id: selectedPartner,
          loan_amount: loan.amount,
          repayment_amount: loan.repayment_amount,
          due_date: loan.due_date,
          profit_earned: profit,
          overdue_bonus: 0,
          status: "active",
        });
      }

      try { await base44.functions.invoke("sendLoanEmail", { loanId: loan.id, emailType: "approval" }); } catch (e) {}
      await createNotification({ user_id: loan.user_id, title: "Loan Disbursed", message: `Your loan of ${formatINR(loan.amount)} has been disbursed to your UPI. Please repay ${formatINR(loan.repayment_amount)} by ${formatDate(loan.due_date)}.`, type: "loan", related_id: loan.id });
      const waMessage = loanDisbursedMessage(loan.user_name, loan.amount, loan.repayment_amount, formatDate(loan.due_date), loan.loan_id, getWhatsappUrl(settings));
      await logWhatsApp({ user_id: loan.user_id, user_name: loan.user_name, user_mobile: loan.user_mobile, loan_id: loan.loan_id, message_type: "loan_disbursed", message: waMessage });
      setWaMsg({ message: waMessage, phone: loan.user_mobile });
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  const handleReject = async () => {
    if (!reason.trim()) { alert("Please enter a reason for rejection"); return; }
    setLoading(true);
    try {
      await base44.entities.LoanApplication.update(loan.id, { status: "rejected", admin_rejection_reason: reason.trim() });
      await createNotification({ user_id: loan.user_id, title: "Loan Rejected", message: `Your loan application of ${formatINR(loan.amount)} has been rejected. Reason: ${reason.trim()}`, type: "loan", related_id: loan.id });
      const waMessage = loanRejectedMessage(loan.user_name, loan.amount, reason.trim(), loan.loan_id, getWhatsappUrl(settings));
      await logWhatsApp({ user_id: loan.user_id, user_name: loan.user_name, user_mobile: loan.user_mobile, loan_id: loan.loan_id, message_type: "loan_rejected", message: waMessage });
      setWaMsg({ message: waMessage, phone: loan.user_mobile });
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  const handleConfirmRepay = async () => {
    setLoading(true);
    try {
      // Mark loan as repaid
      await base44.entities.LoanApplication.update(loan.id, { status: "repaid", repaid_date: new Date().toISOString() });
      await base44.entities.AdminCapital.create({ type: "repayment_principal", amount: loan.amount, related_loan_id: loan.id, related_user_id: loan.user_id, description: `Principal from ${loan.user_name}` });
      await base44.entities.AdminCapital.create({ type: "repayment_interest", amount: loan.interest_amount, related_loan_id: loan.id, related_user_id: loan.user_id, description: `Interest from ${loan.user_name}` });

      // Settle with SDL Partner if assigned
      const assignments = await base44.entities.PartnerLoanAssignment.filter({ loan_id: loan.id, status: "active" });
      if (assignments.length > 0) {
        const assignment = assignments[0];
        const overdue = isOverdue(loan.due_date);
        const odDays = overdue ? daysOverdue(loan.due_date) : 0;
        const odBonus = overdue ? Math.round((loan.amount * odDays * (Number(settings?.partner_overdue_profit_percentage) || 0.5)) / 100) : 0;
        await base44.entities.PartnerLoanAssignment.update(assignment.id, {
          status: "repaid",
          repaid_date: new Date().toISOString(),
          overdue_bonus: odBonus,
        });
        await createNotification({
          user_id: assignment.partner_id,
          title: "Loan Repaid — Profit Credited",
          message: `A loan you funded has been repaid. Profit: ${formatINR((assignment.profit_earned || 0) + odBonus)}${odBonus > 0 ? ` (incl. ${formatINR(odBonus)} overdue bonus)` : ""}.`,
          type: "wallet",
          related_id: loan.id,
        });
      }

      // Credit 1% savings back to user
      const settings = (await base44.entities.AppSettings.list())[0];
      const savingsPct = settings?.savings_percentage || 1;
      const savingsBack = Math.round((loan.amount * savingsPct) / 100);
      await base44.entities.WalletTransaction.create({ user_id: loan.user_id, type: "savings_back", amount: savingsBack, status: "completed", description: `Savings from loan repayment`, related_loan_id: loan.id });
      // Credit 1% referral earning to referrer
      if (!loan.referrer_earning_credited && loan.referrer_id) {
        const referralEarning = Math.round((loan.amount * (settings?.referral_percentage || 1)) / 100);
        await base44.entities.WalletTransaction.create({ user_id: loan.referrer_id, type: "referral_earning", amount: referralEarning, status: "completed", description: `Referral earning from ${loan.user_name}`, related_loan_id: loan.id });
        await createNotification({ user_id: loan.referrer_id, title: "Referral Earning Credited", message: `You earned ${formatINR(referralEarning)} from ${loan.user_name}'s loan repayment.`, type: "wallet", related_id: loan.id });
        await base44.entities.LoanApplication.update(loan.id, { referrer_earning_credited: true });
      } else {
        const borrower = await base44.entities.User.filter({ id: loan.user_id });
        if (borrower[0]?.referrer_mobile) {
          const referrers = await base44.entities.User.filter({ mobile_number: borrower[0].referrer_mobile });
          if (referrers[0]) {
            const referralEarning = Math.round((loan.amount * (settings?.referral_percentage || 1)) / 100);
            await base44.entities.WalletTransaction.create({ user_id: referrers[0].id, type: "referral_earning", amount: referralEarning, status: "completed", description: `Referral earning from ${loan.user_name}`, related_loan_id: loan.id });
            await createNotification({ user_id: referrers[0].id, title: "Referral Earning Credited", message: `You earned ${formatINR(referralEarning)} from ${loan.user_name}'s loan repayment.`, type: "wallet", related_id: loan.id });
            await base44.entities.LoanApplication.update(loan.id, { referrer_earning_credited: true, referrer_id: referrers[0].id });
          }
        }
      }
      try { await base44.functions.invoke("sendLoanEmail", { loanId: loan.id, emailType: "closure" }); } catch (e) {}
      await createNotification({ user_id: loan.user_id, title: "Loan Repaid & Closed", message: `Your loan repayment is confirmed. ${formatINR(savingsBack)} savings credited to your wallet.`, type: "loan", related_id: loan.id });
      const u = await base44.entities.User.filter({ id: loan.user_id });
      const waMessage = repaymentVerifiedMessage(loan.user_name, loan.repayment_amount, u[0]?.loan_limit || 0, loan.loan_id, getWhatsappUrl(settings));
      await logWhatsApp({ user_id: loan.user_id, user_name: loan.user_name, user_mobile: loan.user_mobile, loan_id: loan.loan_id, message_type: "repayment_verified", message: waMessage });
      setWaMsg({ message: waMessage, phone: loan.user_mobile });
    } catch (e) { alert("Failed: " + (e.message || "error")); } finally { setLoading(false); }
  };

  const handleRejectRepay = async () => {
    if (!reason.trim()) { alert("Please enter a reason for rejecting this repayment"); return; }
    setLoading(true);
    try {
      await base44.entities.LoanApplication.update(loan.id, { status: "disbursed", admin_rejection_reason: reason.trim() });
      await createNotification({ user_id: loan.user_id, title: "Repayment Rejected", message: `Your repayment proof for loan ${loan.loan_id || ""} was not accepted. Reason: ${reason.trim()}. Please re-upload a valid payment screenshot.`, type: "loan", related_id: loan.id });
      setWaMsg({ message: `🪔 *Repayment Rejected* 🙏\n\nDear *${loan.user_name}*,\n\nYour repayment proof for loan ${loan.loan_id || ""} was not accepted.\nReason: *${reason.trim()}*\n\nPlease re-upload a valid payment screenshot.\n\nVisit: ${getWhatsappUrl(settings)}\n\nRegards,\nSDL Team 🪔`, phone: loan.user_mobile });
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">{isReject ? "Reject Loan" : isRejectRepay ? "Reject Repayment" : isDisburse ? "Disburse Loan" : "Confirm Repayment"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="neu-inset rounded-2xl p-4 mb-4 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-slate-500">User</span><span className="font-semibold text-slate-700">{loan.user_name}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-semibold text-slate-700">{formatINR(loan.amount)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Repayment</span><span className="font-semibold text-slate-700">{formatINR(loan.repayment_amount)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">UPI ID</span><span className="font-mono text-slate-700 text-xs">{loan.user_upi_id}</span></div>
        </div>

        {isDisburse && (
          <>
            <div className="text-center mb-4">
              <div className="neu-card-sm p-4 rounded-2xl inline-block mb-3">
                <img src={qrUrl} alt="QR" className="w-48 h-48 rounded-xl" />
              </div>
              <p className="text-xs text-slate-500">Scan to pay {formatINR(loan.amount)} to user's UPI</p>
            </div>

            {/* Partner assignment (optional) */}
            <div className="neu-inset rounded-2xl p-4 mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-2">Assign to SDL Partner (Optional)</label>
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="neu-input w-full h-11 px-3 text-sm text-slate-700 rounded-xl"
              >
                <option value="">No partner — use SDL capital</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.display_name || p.full_name} (Profit: {formatINR(Math.round((loan.amount * (Number(settings?.partner_profit_percentage) || 10)) / 100))})</option>
                ))}
              </select>
              {selectedPartner && (
                <p className="text-[10px] text-sdl-green mt-2">Partner will earn {formatINR(Math.round((loan.amount * (Number(settings?.partner_profit_percentage) || 10)) / 100))} ({Number(settings?.partner_profit_percentage) || 10}% of loan) when borrower repays.</p>
              )}
            </div>

            {/* Payment proof (optional) */}
            <div className="neu-inset rounded-2xl p-4 mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-2">Payment Proof (Optional)</label>
              {screenshot ? (
                <div className="relative">
                  <img src={screenshot} alt="Proof" className="w-full rounded-lg" />
                  <button onClick={() => setScreenshot("")} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <label className="neu-btn w-full h-11 rounded-xl flex items-center justify-center gap-2 text-slate-500 text-sm font-medium cursor-pointer">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Upload Screenshot</>}
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Additional Files (multiple, any type) */}
            <div className="neu-inset rounded-2xl p-4 mb-4">
              <label className="block text-xs font-medium text-slate-500 mb-2">Additional Files (Call Recording, Documents, etc.)</label>
              {additionalFiles.length > 0 && (
                <div className="space-y-2 mb-2">
                  {additionalFiles.map((f, i) => (
                    <div key={i} className="neu-inset-sm rounded-xl p-2 flex items-center gap-2">
                      <FileAudio className="w-3.5 h-3.5 text-sdl-orange shrink-0" />
                      <span className="text-xs text-slate-600 flex-1 truncate">{f.name}</span>
                      <button onClick={() => setAdditionalFiles(additionalFiles.filter((_, idx) => idx !== i))} className="w-7 h-7 shrink-0 rounded-full bg-black/10 flex items-center justify-center text-slate-500"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
              <label className="neu-btn w-full h-11 rounded-xl flex items-center justify-center gap-2 text-slate-500 text-sm font-medium cursor-pointer">
                {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add File</>}
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </>
        )}

        {(isReject || isRejectRepay) && (
          <div className="neu-inset rounded-2xl p-4 mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-2">Reason for Rejection</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder={isRejectRepay ? "Explain why this repayment is being rejected..." : "Explain why this loan is being rejected..."} className="neu-input w-full p-3 text-sm text-slate-700 rounded-xl resize-none" />
          </div>
        )}

        {type === "confirm_repay" && (
          <div className="neu-inset-sm rounded-xl p-3 mb-4">
            {(() => {
              let shots = [];
              try { shots = loan.repayment_screenshots ? JSON.parse(loan.repayment_screenshots) : []; } catch { shots = []; }
              if (!shots.length && loan.repayment_screenshot) shots = [{ screenshot: loan.repayment_screenshot, amount: loan.repayment_amount }];
              if (!shots.length) return <p className="text-xs text-slate-400 text-center">No screenshot uploaded</p>;
              return (
                <div className="space-y-2">
                  {shots.map((s, i) => (
                    <a key={i} href={s.screenshot} target="_blank" rel="noreferrer" className="block">
                      <img src={s.screenshot} alt={`Payment ${i + 1}`} className="w-full rounded-lg" />
                      <p className="text-xs text-sdl-orange text-center mt-1">Payment {i + 1}{s.amount ? ` — ${formatINR(s.amount)}` : ""}</p>
                    </a>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        <button disabled={loading} onClick={isReject ? handleReject : isRejectRepay ? handleRejectRepay : isDisburse ? handleDisburse : handleConfirmRepay}
          className={`w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${isReject || isRejectRepay ? "bg-sdl-red" : isDisburse ? "sdl-gradient" : "bg-sdl-green sdl-green"}`}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isReject ? <><XCircle className="w-4 h-4" /> Reject Loan</> : isRejectRepay ? <><XCircle className="w-4 h-4" /> Reject Repayment</> : <><CheckCircle2 className="w-4 h-4" /> {isDisburse ? "Mark as Paid" : "Confirm & Close Loan"}</>}
        </button>

        {waMsg && <WhatsAppShareModal message={waMsg.message} phone={waMsg.phone} onClose={() => { setWaMsg(null); onDone(); }} />}
      </div>
    </div>
  );
}