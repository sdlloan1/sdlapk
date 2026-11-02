const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { formatINR, formatDate, isOverdue, daysOverdue, upiQrUrl } from "@/lib/sdlUtils";
import NeuInput from "@/components/NeuInput";
import {
  CheckCircle2, XCircle, Clock, X, Loader2, Handshake, ArrowDownLeft, ArrowUpRight,
  FileDown, FileImage, Gift, TrendingUp, ChevronRight, Search, Upload
} from "lucide-react";
import PartnerDetailModal from "@/components/admin/PartnerDetailModal";

export default function AdminPartners() {
  const [tab, setTab] = useState("partners");
  const [counts, setCounts] = useState({});
  const [search, setSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);

  const loadCounts = async () => {
    const [reqs, deps, wds, pendingLoans, verifyLoans] = await Promise.all([
      db.entities.PartnerRequest.filter({ status: "pending" }).catch(() => []),
      db.entities.PartnerDeposit.filter({ status: "pending" }).catch(() => []),
      db.entities.PartnerWithdrawal.filter({ status: "pending" }).catch(() => []),
      db.entities.LoanApplication.filter({ status: "pending_disbursement" }).catch(() => []),
      db.entities.LoanApplication.filter({ status: "pending_verification" }).catch(() => []),
    ]);
    setCounts({
      requests: reqs.length,
      deposits: deps.length,
      withdrawals: wds.length,
      assign: pendingLoans.length,
      settle: verifyLoans.length,
    });
  };

  useEffect(() => { loadCounts(); }, [tab]);

  const tabs = [
    { id: "partners", label: "Partners" },
    { id: "requests", label: "Requests", count: counts.requests },
    { id: "deposits", label: "Deposits", count: counts.deposits },
    { id: "withdrawals", label: "Withdrawals", count: counts.withdrawals },
    { id: "assign", label: "Assign Loans", count: counts.assign },
    { id: "settle", label: "Settle", count: counts.settle },
    { id: "history", label: "History" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Handshake className="w-5 h-5 text-sdl-orange" />
        <h2 className="text-lg font-bold sdl-gradient-text">SDL Partners</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 ${tab === t.id ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>
            {t.label}
            {t.count > 0 && <span className="bg-white text-sdl-red text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[18px] text-center">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by partner name..."
          className="neu-input w-full h-11 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400"
        />
      </div>

      {tab === "partners" && <PartnersTab onSelect={setSelectedPartner} search={search} />}
      {tab === "requests" && <RequestsTab onUpdate={loadCounts} search={search} />}
      {tab === "deposits" && <DepositsTab onUpdate={loadCounts} />}
      {tab === "withdrawals" && <WithdrawalsTab onUpdate={loadCounts} />}
      {tab === "assign" && <AssignLoansTab onUpdate={loadCounts} />}
      {tab === "settle" && <SettleTab onUpdate={loadCounts} />}
      {tab === "history" && <HistoryTab />}

      {selectedPartner && <PartnerDetailModal partner={selectedPartner} onClose={() => setSelectedPartner(null)} />}
    </div>
  );
}

function PartnersTab({ onSelect, search }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.entities.User.list("-created_date", 200).then((users) => {
      setPartners(users.filter((u) => u.partner_status === "approved"));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  let filtered = partners;
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    filtered = partners.filter((p) =>
      (p.display_name || p.full_name || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q)
    );
  }

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-3">
      {filtered.length === 0 ? <div className="neu-card p-8 text-center text-sm text-slate-400">No approved partners yet. Approve from the Requests tab.</div> :
        filtered.map((p) => (
          <button key={p.id} onClick={() => onSelect(p)} className="neu-card p-4 w-full text-left active:scale-[0.99] transition-transform">
            <div className="flex items-center gap-3">
              {p.profile_picture ? (
                <img src={p.profile_picture} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full sdl-gradient flex items-center justify-center text-white text-lg font-bold shrink-0">
                  {(p.display_name || p.full_name)?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700">{p.display_name || p.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{p.email} • {p.mobile_number || "No mobile"}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
            </div>
          </button>
        ))}
    </div>
  );
}

function RequestsTab({ onUpdate, search }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);

  const load = async () => {
    const list = await db.entities.PartnerRequest.list("-created_date", 100);
    setRequests(list);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  let filtered = requests;
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    filtered = requests.filter((r) =>
      (r.user_name || "").toLowerCase().includes(q) ||
      (r.user_email || "").toLowerCase().includes(q)
    );
  }

  const approve = async (req) => {
    await db.entities.PartnerRequest.update(req.id, { status: "approved" });
    await db.entities.User.update(req.user_id, { partner_status: "approved" });
    load(); onUpdate();
  };
  const reject = async (req, reason) => {
    await db.entities.PartnerRequest.update(req.id, { status: "rejected", rejection_reason: reason });
    await db.entities.User.update(req.user_id, { partner_status: "rejected", rejection_reason: reason });
    setAction(null); load(); onUpdate();
  };

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-3">
      {filtered.length === 0 ? <div className="neu-card p-8 text-center text-sm text-slate-400">No partner requests.</div> :
        filtered.map((r) => (
          <div key={r.id} className="neu-card p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-bold text-slate-700">{r.user_name}</p>
                <p className="text-xs text-slate-400">{r.user_email} • {r.user_mobile}</p>
                <p className="text-xs text-slate-400">PAN: {r.user_pan}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${r.status === "pending" ? "bg-amber-100 text-amber-600" : r.status === "approved" ? "bg-green-100 text-sdl-green" : "bg-red-100 text-sdl-red"}`}>
                {r.status}
              </span>
            </div>
            {r.status === "pending" && (
              <div className="flex gap-2">
                <button onClick={() => approve(r)} className="sdl-green bg-sdl-green flex-1 h-10 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => setAction(r)} className="bg-sdl-red flex-1 h-10 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            )}
            {r.status === "rejected" && r.rejection_reason && (
              <p className="text-xs text-sdl-red mt-2">Reason: {r.rejection_reason}</p>
            )}
          </div>
        ))}
      {action && <RejectModal title="Reject Partner Request" onReject={(reason) => reject(action, reason)} onClose={() => setAction(null)} />}
    </div>
  );
}

function DepositsTab({ onUpdate }) {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(null);
  const [action, setAction] = useState(null);

  const load = async () => {
    const list = await db.entities.PartnerDeposit.list("-created_date", 100);
    setDeposits(list);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async (d) => {
    await db.entities.PartnerDeposit.update(d.id, { status: "approved", approved_date: new Date().toISOString() });
    await db.entities.AdminCapital.create({ type: "deposit", amount: d.amount, related_user_id: d.user_id, description: `Partner deposit from ${d.user_name}` });
    load(); onUpdate();
  };
  const reject = async (d, reason) => {
    await db.entities.PartnerDeposit.update(d.id, { status: "rejected", rejection_reason: reason });
    setAction(null); load(); onUpdate();
  };

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-3">
      {deposits.length === 0 ? <div className="neu-card p-8 text-center text-sm text-slate-400">No deposits.</div> :
        deposits.map((d) => (
          <div key={d.id} className="neu-card p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-bold text-slate-700">{formatINR(d.amount)}</p>
                <p className="text-xs text-slate-400">{d.user_name}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${d.status === "pending" ? "bg-amber-100 text-amber-600" : d.status === "approved" ? "bg-green-100 text-sdl-green" : "bg-red-100 text-sdl-red"}`}>
                {d.status}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              {d.payment_screenshot && (
                <button onClick={() => setView(d.payment_screenshot)} className="neu-btn px-3 h-9 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-1">
                  <FileImage className="w-3.5 h-3.5" /> Proof
                </button>
              )}
              {d.agreement_pdf_url && (
                <a href={d.agreement_pdf_url} target="_blank" rel="noreferrer" className="neu-btn px-3 h-9 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-1">
                  <FileDown className="w-3.5 h-3.5" /> Agreement
                </a>
              )}
              {d.status === "pending" && (
                <>
                  <button onClick={() => approve(d)} className="sdl-green bg-sdl-green flex-1 h-9 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => setAction(d)} className="bg-sdl-red flex-1 h-9 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </>
              )}
            </div>
            {d.rejection_reason && <p className="text-xs text-sdl-red mt-2">Reason: {d.rejection_reason}</p>}
          </div>
        ))}
      {view && <ImageViewer url={view} onClose={() => setView(null)} />}
      {action && <RejectModal title="Reject Deposit" onReject={(reason) => reject(action, reason)} onClose={() => setAction(null)} />}
    </div>
  );
}

function WithdrawalsTab({ onUpdate }) {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);

  const load = async () => {
    const list = await db.entities.PartnerWithdrawal.list("-created_date", 100);
    setWithdrawals(list);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async (w) => {
    await db.entities.PartnerWithdrawal.update(w.id, { status: "approved", paid_date: new Date().toISOString() });
    load(); onUpdate();
  };
  const reject = async (w, reason) => {
    await db.entities.PartnerWithdrawal.update(w.id, { status: "rejected", rejection_reason: reason });
    setAction(null); load(); onUpdate();
  };

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-3">
      {withdrawals.length === 0 ? <div className="neu-card p-8 text-center text-sm text-slate-400">No withdrawals.</div> :
        withdrawals.map((w) => (
          <div key={w.id} className="neu-card p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-bold text-slate-700">{formatINR(w.amount)} <span className="text-[10px] font-normal text-slate-400 capitalize">({w.withdrawal_type || "profit"})</span></p>
                <p className="text-xs text-slate-400">{w.user_name}</p>
                {w.user_upi_id && <p className="text-xs text-slate-400">UPI: <span className="font-mono font-medium text-slate-600">{w.user_upi_id}</span></p>}
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${w.status === "pending" ? "bg-amber-100 text-amber-600" : w.status === "approved" ? "bg-green-100 text-sdl-green" : "bg-red-100 text-sdl-red"}`}>
                {w.status}
              </span>
            </div>
            {w.status === "pending" && (
              <p className="text-[10px] text-slate-400 mb-2">Pay {formatINR(w.amount)} to partner's UPI ID above, then mark as paid.</p>
            )}
            <div className="flex gap-2">
              {w.status === "pending" && (
                <>
                  <button onClick={() => approve(w)} className="sdl-green bg-sdl-green flex-1 h-9 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid
                  </button>
                  <button onClick={() => setAction(w)} className="bg-sdl-red flex-1 h-9 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </>
              )}
            </div>
            {w.rejection_reason && <p className="text-xs text-sdl-red mt-2">Reason: {w.rejection_reason}</p>}
          </div>
        ))}
      {action && <RejectModal title="Reject Withdrawal" onReject={(reason) => reject(action, reason)} onClose={() => setAction(null)} />}
    </div>
  );
}

function AssignLoansTab({ onUpdate }) {
  const [loans, setLoans] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState({});
  const [assignModal, setAssignModal] = useState(null);

  const load = async () => {
    const [pendingLoans, allUsers] = await Promise.all([
      db.entities.LoanApplication.filter({ status: "pending_disbursement" }, "-created_date"),
      db.entities.User.list("-created_date", 200),
    ]);
    setLoans(pendingLoans);
    setPartners(allUsers.filter((u) => u.partner_status === "approved"));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const assign = async (loan, screenshotUrl) => {
    const partnerId = selectedPartner[loan.id];
    const profit = Math.round(loan.amount * 0.1);
    await db.entities.PartnerLoanAssignment.create({
      loan_id: loan.id,
      partner_id: partnerId,
      loan_amount: loan.amount,
      repayment_amount: loan.repayment_amount,
      due_date: loan.due_date,
      profit_earned: profit,
      overdue_bonus: 0,
      status: "active",
    });
    const updateData = { status: "disbursed", disbursed_date: new Date().toISOString() };
    if (screenshotUrl) updateData.disbursement_screenshot = screenshotUrl;
    await db.entities.LoanApplication.update(loan.id, updateData);
    load(); onUpdate();
  };

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-3">
      {loans.length === 0 ? <div className="neu-card p-8 text-center text-sm text-slate-400">No pending disbursement loans.</div> :
        loans.map((loan) => (
          <div key={loan.id} className="neu-card p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-bold text-slate-700">{formatINR(loan.amount)}</p>
                {loan.loan_id && <p className="text-[10px] font-mono text-sdl-orange">ID: {loan.loan_id}</p>}
                <p className="text-xs text-slate-400">{loan.user_name}</p>
                <p className="text-[10px] text-slate-400">Due: {formatDate(loan.due_date)} • Repay: {formatINR(loan.repayment_amount)}</p>
                <p className="text-[10px] text-sdl-green">Partner profit: {formatINR(Math.round(loan.amount * 0.1))} (10% of loan)</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={selectedPartner[loan.id] || ""}
                onChange={(e) => setSelectedPartner({ ...selectedPartner, [loan.id]: e.target.value })}
                className="neu-input flex-1 h-10 px-3 text-xs text-slate-700 rounded-xl"
              >
                <option value="">Select Partner</option>
                {partners.map((p) => <option key={p.id} value={p.id}>{p.display_name || p.full_name}</option>)}
              </select>
              <button
                onClick={() => {
                  if (!selectedPartner[loan.id]) { alert("Select a partner first"); return; }
                  setAssignModal(loan);
                }}
                className="sdl-gradient px-4 h-10 rounded-xl text-white text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Assign & Disburse
              </button>
            </div>
          </div>
        ))
      }
      {assignModal && (
        <AssignDisburseModal
          loan={assignModal}
          partnerName={partners.find((p) => p.id === selectedPartner[assignModal.id])?.display_name || partners.find((p) => p.id === selectedPartner[assignModal.id])?.full_name || "Unknown"}
          onClose={() => setAssignModal(null)}
          onConfirm={async (screenshotUrl) => { await assign(assignModal, screenshotUrl); setAssignModal(null); }}
        />
      )}
    </div>
  );
}

function AssignDisburseModal({ loan, partnerName, onClose, onConfirm }) {
  const [screenshot, setScreenshot] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const qrUrl = upiQrUrl(loan.user_upi_id, loan.amount);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      setScreenshot(file_url);
    } catch (err) { alert("Upload failed"); }
    finally { setUploading(false); }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(screenshot); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">Assign & Disburse</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="neu-inset rounded-2xl p-4 mb-4 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-slate-500">User</span><span className="font-semibold text-slate-700">{loan.user_name}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-semibold text-slate-700">{formatINR(loan.amount)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">UPI ID</span><span className="font-mono text-slate-700 text-xs">{loan.user_upi_id}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Partner</span><span className="font-semibold text-slate-700">{partnerName}</span></div>
        </div>
        <div className="text-center mb-4">
          <div className="neu-card-sm p-4 rounded-2xl inline-block mb-3">
            <img src={qrUrl} alt="QR" className="w-44 h-44 rounded-xl" />
          </div>
          <p className="text-xs text-slate-500">Scan to pay {formatINR(loan.amount)} to user's UPI</p>
        </div>
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
        <button onClick={handleConfirm} disabled={loading || uploading} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Confirm & Disburse</>}
        </button>
      </div>
    </div>
  );
}

function SettleTab({ onUpdate }) {
  const [loans, setLoans] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [verifyLoans, allAssignments] = await Promise.all([
      db.entities.LoanApplication.filter({ status: "pending_verification" }, "-created_date"),
      db.entities.PartnerLoanAssignment.filter({ status: "active" }, "-created_date"),
    ]);
    setLoans(verifyLoans);
    setAssignments(allAssignments);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const settle = async (loan) => {
    const assignment = assignments.find((a) => a.loan_id === loan.id);
    if (!assignment) { alert("No partner assignment found for this loan"); return; }
    const overdue = isOverdue(loan.due_date);
    const odDays = overdue ? daysOverdue(loan.due_date) : 0;
    const odBonus = overdue ? Math.round((loan.amount * odDays * 0.5) / 100) : 0;
    await db.entities.PartnerLoanAssignment.update(assignment.id, {
      status: "repaid",
      repaid_date: new Date().toISOString(),
      overdue_bonus: odBonus,
    });
    await db.entities.LoanApplication.update(loan.id, { status: "repaid", repaid_date: new Date().toISOString() });
    load(); onUpdate();
  };

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-3">
      {loans.length === 0 ? <div className="neu-card p-8 text-center text-sm text-slate-400">No loans pending settlement.</div> :
        loans.map((loan) => {
          const assignment = assignments.find((a) => a.loan_id === loan.id);
          const overdue = isOverdue(loan.due_date);
          const odDays = overdue ? daysOverdue(loan.due_date) : 0;
          const odBonus = overdue ? Math.round((loan.amount * odDays * 0.5) / 100) : 0;
          return (
            <div key={loan.id} className="neu-card p-4">
              <div className="mb-2">
                <p className="text-sm font-bold text-slate-700">{formatINR(loan.amount)}</p>
                <p className="text-xs text-slate-400">Due: {formatDate(loan.due_date)} • Repay: {formatINR(loan.repayment_amount)}</p>
              </div>
              {assignment ? (
                <>
                  <div className="neu-inset-sm rounded-xl p-3 mb-2 space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-slate-500">Partner Profit</span><span className="font-semibold text-sdl-green">{formatINR(assignment.profit_earned || 0)}</span></div>
                    {overdue && <div className="flex justify-between text-sdl-red"><span>Overdue Bonus ({odDays}d)</span><span className="font-semibold">{formatINR(odBonus)}</span></div>}
                    <div className="flex justify-between border-t border-slate-200 pt-1"><span className="font-semibold text-slate-700">Total to Partner</span><span className="font-bold sdl-gradient-text">{formatINR((assignment.profit_earned || 0) + odBonus)}</span></div>
                  </div>
                  <button onClick={() => settle(loan)} className="sdl-gradient w-full h-10 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Settle & Mark Repaid
                  </button>
                </>
              ) : (
                <p className="text-xs text-amber-600">No partner assigned. Settle from Loans tab.</p>
              )}
            </div>
          );
        })}
    </div>
  );
}

function HistoryTab() {
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [deps, wds, assigns] = await Promise.all([
        db.entities.PartnerDeposit.list("-created_date", 100),
        db.entities.PartnerWithdrawal.list("-created_date", 100),
        db.entities.PartnerLoanAssignment.list("-created_date", 100),
      ]);
      setDeposits(deps);
      setWithdrawals(wds);
      setAssignments(assigns);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-3">
      <div className="neu-card p-4">
        <h3 className="text-sm font-bold text-slate-600 mb-2">Deposits</h3>
        {deposits.length === 0 ? <p className="text-xs text-slate-400 text-center py-2">None</p> :
          deposits.map((d) => (
            <div key={d.id} className="neu-inset-sm rounded-xl p-2.5 mb-1.5 flex justify-between items-center text-xs">
              <div><span className="font-semibold text-slate-700">{d.user_name}</span> <span className="text-slate-400">{formatDate(d.created_date)}</span></div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sdl-green">{formatINR(d.amount)}</span>
                <span className={`px-2 py-0.5 rounded-full ${d.status === "approved" ? "bg-green-100 text-sdl-green" : d.status === "pending" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-sdl-red"}`}>{d.status}</span>
              </div>
            </div>
          ))
        }
      </div>
      <div className="neu-card p-4">
        <h3 className="text-sm font-bold text-slate-600 mb-2">Withdrawals</h3>
        {withdrawals.length === 0 ? <p className="text-xs text-slate-400 text-center py-2">None</p> :
          withdrawals.map((w) => (
            <div key={w.id} className="neu-inset-sm rounded-xl p-2.5 mb-1.5 flex justify-between items-center text-xs">
              <div><span className="font-semibold text-slate-700">{w.user_name}</span> <span className="text-slate-400">{formatDate(w.created_date)}</span></div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sdl-red">{formatINR(w.amount)}</span>
                <span className={`px-2 py-0.5 rounded-full ${w.status === "approved" ? "bg-green-100 text-sdl-green" : w.status === "pending" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-sdl-red"}`}>{w.status}</span>
              </div>
            </div>
          ))
        }
      </div>
      <div className="neu-card p-4">
        <h3 className="text-sm font-bold text-slate-600 mb-2">Loan Assignments</h3>
        {assignments.length === 0 ? <p className="text-xs text-slate-400 text-center py-2">None</p> :
          assignments.map((a) => (
            <div key={a.id} className="neu-inset-sm rounded-xl p-2.5 mb-1.5 flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-slate-700">{formatINR(a.loan_amount)}</span>
                <span className="text-slate-400 ml-2">Due: {formatDate(a.due_date)}</span>
                {a.status === "repaid" && <span className="text-sdl-green ml-2">Profit: {formatINR((a.profit_earned || 0) + (a.overdue_bonus || 0))}</span>}
              </div>
              <span className={`px-2 py-0.5 rounded-full ${a.status === "active" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-sdl-green"}`}>{a.status}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function RejectModal({ title, onReject, onClose }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <NeuInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection" />
        <button onClick={() => { if (!reason.trim()) { alert("Enter a reason"); return; } onReject(reason.trim()); }} className="bg-sdl-red w-full h-12 rounded-2xl text-white font-semibold text-sm mt-4">
          Confirm Rejection
        </button>
      </div>
    </div>
  );
}

function ImageViewer({ url, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <img src={url} alt="Proof" className="w-full rounded-xl" />
        <button onClick={onClose} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}