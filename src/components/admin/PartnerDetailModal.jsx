import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { formatINR, formatDate, isOverdue, daysOverdue } from "@/lib/sdlUtils";
import { X, CheckCircle2, FileDown, FileImage, LockOpen, Lock } from "lucide-react";

export default function PartnerDetailModal({ partner, onClose }) {
  const [tab, setTab] = useState("assign");
  const [data, setData] = useState({ requests: [], deposits: [], withdrawals: [], assignments: [], settleLoans: [], allLoans: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    const [reqs, deps, wds, assigns, allLoans] = await Promise.all([
      base44.entities.PartnerRequest.filter({ user_id: partner.id }).catch(() => []),
      base44.entities.PartnerDeposit.filter({ user_id: partner.id }).catch(() => []),
      base44.entities.PartnerWithdrawal.filter({ user_id: partner.id }).catch(() => []),
      base44.entities.PartnerLoanAssignment.filter({ partner_id: partner.id }).catch(() => []),
      base44.entities.LoanApplication.list("-created_date", 200).catch(() => []),
    ]);
    const activeLoanIds = assigns.filter((a) => a.status === "active").map((a) => a.loan_id);
    const settleLoans = allLoans.filter((l) => activeLoanIds.includes(l.id) && l.status === "pending_verification");
    setData({ requests: reqs, deposits: deps, withdrawals: wds, assignments: assigns, settleLoans, allLoans });
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const settle = async (loan, assignment) => {
    setActionLoading(true);
    try {
      const overdue = isOverdue(loan.due_date);
      const odDays = overdue ? daysOverdue(loan.due_date) : 0;
      const odBonus = overdue ? Math.round((loan.amount * odDays * 0.5) / 100) : 0;
      await base44.entities.PartnerLoanAssignment.update(assignment.id, {
        status: "repaid", repaid_date: new Date().toISOString(), overdue_bonus: odBonus,
      });
      await base44.entities.LoanApplication.update(loan.id, { status: "repaid", repaid_date: new Date().toISOString() });
      await loadData();
    } catch (e) { alert("Failed to settle"); } finally { setActionLoading(false); }
  };

  const unlockDeposit = async (deposit) => {
    if (!confirm(`Force unlock capital of ${formatINR(deposit.amount)} for this partner? This overrides the 6-month lock period.`)) return;
    setActionLoading(true);
    try {
      const unlockedDate = new Date(Date.now() - 190 * 24 * 60 * 60 * 1000).toISOString();
      await base44.entities.PartnerDeposit.update(deposit.id, { approved_date: unlockedDate });
      await loadData();
    } catch (e) { alert("Failed to unlock"); } finally { setActionLoading(false); }
  };

  const lockDeposit = async (deposit) => {
    if (!confirm(`Lock capital of ${formatINR(deposit.amount)} for this partner? This enforces the 6-month lock period.`)) return;
    setActionLoading(true);
    try {
      await base44.entities.PartnerDeposit.update(deposit.id, { approved_date: new Date().toISOString() });
      await loadData();
    } catch (e) { alert("Failed to lock"); } finally { setActionLoading(false); }
  };

  const tabs = [
    { id: "assign", label: "Assign Loans" },
    { id: "settle", label: "Settle" },
    { id: "deposits", label: "Deposits" },
    { id: "withdrawals", label: "Withdrawals" },
    { id: "requests", label: "Requests" },
    { id: "history", label: "History" },
  ];

  const req = data.requests[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 pb-0 sm:pb-4 bg-black/40 backdrop-blur-sm">
      <div className="neu-card w-full max-w-lg sm:rounded-3xl rounded-t-3xl neu-pop max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-200/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {partner.profile_picture ? (
                <img src={partner.profile_picture} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full sdl-gradient flex items-center justify-center text-white text-lg font-bold">
                  {(partner.display_name || partner.full_name)?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-slate-700">{partner.display_name || partner.full_name}</h3>
                <p className="text-xs text-slate-400">{partner.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
          </div>
          {req && (
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {req.user_pan && <div><span className="text-slate-400">PAN: </span><span className="font-medium text-slate-600">{req.user_pan}</span></div>}
              {req.user_upi_id && <div><span className="text-slate-400">UPI: </span><span className="font-medium text-slate-600">{req.user_upi_id}</span></div>}
              {req.user_mobile && <div><span className="text-slate-400">Mobile: </span><span className="font-medium text-slate-600">{req.user_mobile}</span></div>}
              {req.user_address && <div className="col-span-2"><span className="text-slate-400">Address: </span><span className="font-medium text-slate-600">{req.user_address}</span></div>}
            </div>
          )}
        </div>

        {/* Sub-tabs */}
        <div className="px-3 py-2 overflow-x-auto border-b border-slate-200/50">
          <div className="flex gap-2 min-w-max">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${tab === t.id ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? <div className="text-center text-sm text-slate-400 py-8">Loading...</div> : (
            <>
              {tab === "assign" && <AssignLoansContent assignments={data.assignments} allLoans={data.allLoans} />}
              {tab === "settle" && <SettleContent settleLoans={data.settleLoans} assignments={data.assignments} onSettle={settle} loading={actionLoading} />}
              {tab === "deposits" && <DepositsContent deposits={data.deposits} onUnlock={(d) => unlockDeposit(d)} onLock={(d) => lockDeposit(d)} />}
              {tab === "withdrawals" && <WithdrawalsContent withdrawals={data.withdrawals} />}
              {tab === "requests" && <RequestsContent requests={data.requests} />}
              {tab === "history" && <HistoryContent data={data} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignLoansContent({ assignments, allLoans }) {
  if (assignments.length === 0) return <Empty msg="No loans assigned to this partner yet." />;
  return (
    <div className="space-y-3">
      {assignments.map((a) => {
        const loan = allLoans.find((l) => l.id === a.loan_id);
        return (
          <div key={a.id} className="neu-inset-sm rounded-xl p-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-bold text-slate-700">{formatINR(a.loan_amount)}</p>
                {loan && <p className="text-[10px] text-slate-400">{loan.user_name} • Due: {formatDate(a.due_date)}</p>}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.status === "active" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-sdl-green"}`}>{a.status}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Profit: <span className="font-semibold text-sdl-green">{formatINR(a.profit_earned || 0)}</span></span>
              {(a.overdue_bonus || 0) > 0 && <span className="text-sdl-red">Overdue Bonus: {formatINR(a.overdue_bonus)}</span>}
              {a.status === "repaid" && <span className="text-slate-400">Repaid: {formatDate(a.repaid_date)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SettleContent({ settleLoans, assignments, onSettle, loading }) {
  if (settleLoans.length === 0) return <Empty msg="No loans pending settlement." />;
  return (
    <div className="space-y-3">
      {settleLoans.map((loan) => {
        const assignment = assignments.find((a) => a.loan_id === loan.id);
        const overdue = isOverdue(loan.due_date);
        const odDays = overdue ? daysOverdue(loan.due_date) : 0;
        const odBonus = overdue ? Math.round((loan.amount * odDays * 0.5) / 100) : 0;
        return (
          <div key={loan.id} className="neu-inset-sm rounded-xl p-3">
            <p className="text-sm font-bold text-slate-700">{formatINR(loan.amount)} <span className="text-xs font-normal text-slate-400">— {loan.user_name}</span></p>
            <p className="text-[10px] text-slate-400">Due: {formatDate(loan.due_date)} • Repay: {formatINR(loan.repayment_amount)}</p>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Partner Profit</span><span className="font-semibold text-sdl-green">{formatINR(assignment?.profit_earned || 0)}</span></div>
              {overdue && <div className="flex justify-between text-sdl-red"><span>Overdue Bonus ({odDays}d)</span><span className="font-semibold">{formatINR(odBonus)}</span></div>}
              <div className="flex justify-between border-t border-slate-200 pt-1"><span className="font-semibold text-slate-700">Total to Partner</span><span className="font-bold sdl-gradient-text">{formatINR((assignment?.profit_earned || 0) + odBonus)}</span></div>
            </div>
            <button onClick={() => onSettle(loan, assignment)} disabled={loading} className="sdl-gradient w-full h-10 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1 mt-3 disabled:opacity-50">
              <CheckCircle2 className="w-3.5 h-3.5" /> Settle & Mark Repaid
            </button>
          </div>
        );
      })}
    </div>
  );
}

function DepositsContent({ deposits, onUnlock, onLock }) {
  if (deposits.length === 0) return <Empty msg="No deposits from this partner." />;
  const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return (
    <div className="space-y-3">
      {deposits.map((d) => {
        const depositDate = new Date(d.approved_date || d.created_date);
        const isLocked = d.status === "approved" && depositDate > sixMonthsAgo;
        return (
          <div key={d.id} className="neu-inset-sm rounded-xl p-3">
            <div className="flex justify-between items-start mb-1">
              <p className="text-sm font-bold text-slate-700">{formatINR(d.amount)}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === "approved" ? "bg-green-100 text-sdl-green" : d.status === "pending" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-sdl-red"}`}>{d.status}</span>
            </div>
            <p className="text-[10px] text-slate-400">{formatDate(d.created_date)}</p>
            {isLocked && (
              <p className="text-[10px] text-amber-600 mt-1">Locked — unlocks {formatDate(new Date(depositDate.setMonth(depositDate.getMonth() + 6)))}</p>
            )}
            {d.status === "approved" && (
              <div className="flex gap-2 mt-2">
                {isLocked ? (
                  <button onClick={() => onUnlock(d)} className="neu-btn px-3 h-8 rounded-lg text-[10px] font-medium text-sdl-orange flex items-center gap-1">
                    <LockOpen className="w-3 h-3" /> Force Unlock
                  </button>
                ) : (
                  <button onClick={() => onLock(d)} className="neu-btn px-3 h-8 rounded-lg text-[10px] font-medium text-amber-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Lock Capital
                  </button>
                )}
              </div>
            )}
            {(d.payment_screenshot || d.agreement_pdf_url) && (
              <div className="flex gap-2 mt-2">
                {d.payment_screenshot && <a href={d.payment_screenshot} target="_blank" rel="noreferrer" className="neu-btn px-3 h-8 rounded-lg text-[10px] font-medium text-slate-600 flex items-center gap-1"><FileImage className="w-3 h-3" /> Proof</a>}
                {d.agreement_pdf_url && <a href={d.agreement_pdf_url} target="_blank" rel="noreferrer" className="neu-btn px-3 h-8 rounded-lg text-[10px] font-medium text-slate-600 flex items-center gap-1"><FileDown className="w-3 h-3" /> Agreement</a>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WithdrawalsContent({ withdrawals }) {
  if (withdrawals.length === 0) return <Empty msg="No withdrawals from this partner." />;
  return (
    <div className="space-y-3">
      {withdrawals.map((w) => (
        <div key={w.id} className="neu-inset-sm rounded-xl p-3">
          <div className="flex justify-between items-start mb-1">
            <div>
              <p className="text-sm font-bold text-slate-700">{formatINR(w.amount)} <span className="text-[10px] font-normal text-slate-400 capitalize">({w.withdrawal_type || "profit"})</span></p>
              {w.user_upi_id && <p className="text-[10px] text-slate-400">UPI: {w.user_upi_id}</p>}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${w.status === "approved" ? "bg-green-100 text-sdl-green" : w.status === "pending" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-sdl-red"}`}>{w.status}</span>
          </div>
          <p className="text-[10px] text-slate-400">{formatDate(w.created_date)}</p>
        </div>
      ))}
    </div>
  );
}

function RequestsContent({ requests }) {
  if (requests.length === 0) return <Empty msg="No partner request found." />;
  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="neu-inset-sm rounded-xl p-3 space-y-1 text-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-700">Partner Request</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "approved" ? "bg-green-100 text-sdl-green" : r.status === "pending" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-sdl-red"}`}>{r.status}</span>
          </div>
          {r.user_pan && <div className="flex justify-between"><span className="text-slate-400">PAN</span><span className="font-medium text-slate-600">{r.user_pan}</span></div>}
          {r.user_upi_id && <div className="flex justify-between"><span className="text-slate-400">UPI ID</span><span className="font-medium text-slate-600">{r.user_upi_id}</span></div>}
          {r.user_mobile && <div className="flex justify-between"><span className="text-slate-400">Mobile</span><span className="font-medium text-slate-600">{r.user_mobile}</span></div>}
          {r.user_email && <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="font-medium text-slate-600">{r.user_email}</span></div>}
          {r.user_address && <div className="mt-1"><span className="text-slate-400">Address: </span><span className="font-medium text-slate-600">{r.user_address}</span></div>}
          {r.rejection_reason && <p className="text-sdl-red mt-1">Reason: {r.rejection_reason}</p>}
        </div>
      ))}
    </div>
  );
}

function HistoryContent({ data }) {
  const totalDeposited = data.deposits.filter((d) => d.status === "approved").reduce((s, d) => s + d.amount, 0);
  const totalWithdrawn = data.withdrawals.filter((w) => w.status === "approved").reduce((s, w) => s + w.amount, 0);
  const totalProfit = data.assignments.filter((a) => a.status === "repaid").reduce((s, a) => s + (a.profit_earned || 0) + (a.overdue_bonus || 0), 0);
  const activeCount = data.assignments.filter((a) => a.status === "active").length;
  const repaidCount = data.assignments.filter((a) => a.status === "repaid").length;

  return (
    <div className="space-y-3">
      <div className="neu-inset-sm rounded-xl p-3 space-y-2 text-xs">
        <div className="flex justify-between"><span className="text-slate-500">Total Deposited</span><span className="font-semibold text-sdl-green">{formatINR(totalDeposited)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Total Withdrawn</span><span className="font-semibold text-sdl-red">{formatINR(totalWithdrawn)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Total Profit Earned</span><span className="font-semibold text-sdl-green">{formatINR(totalProfit)}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-semibold text-slate-700">Net Balance</span><span className="font-bold sdl-gradient-text">{formatINR(totalDeposited - totalWithdrawn + totalProfit)}</span></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="neu-inset-sm rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-400">Active Loans</p>
          <p className="text-lg font-bold text-blue-600">{activeCount}</p>
        </div>
        <div className="neu-inset-sm rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-400">Repaid Loans</p>
          <p className="text-lg font-bold text-sdl-green">{repaidCount}</p>
        </div>
      </div>
    </div>
  );
}

function Empty({ msg }) {
  return <div className="text-center text-sm text-slate-400 py-8">{msg}</div>;
}