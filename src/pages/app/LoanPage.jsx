const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from "react";

import NeuButton from "@/components/NeuButton";
import NeuInput from "@/components/NeuInput";
import ConfettiPopup from "@/components/ConfettiPopup";
import { generateAgreementPdf } from "@/lib/agreementPdf";
import ReferralCard from "@/components/ReferralCard";
import { SDL_LOGO, formatINR, calcRepayment, getDueDate, formatDate, isOverdue, daysOverdue, generateLoanId } from "@/lib/sdlUtils";
import { ensureDueDateNotifications } from "@/lib/notifications";
import ChargeInfoButton from "@/components/ChargeInfoButton";
import AllLoansModal from "@/components/AllLoansModal";
import NeuPageLoader from "@/components/NeuPageLoader";
import {
  Clock, CheckCircle2, XCircle, TrendingUp, HandCoins, ArrowRight, ArrowLeft,
  FileDown, Users, Loader2, Sparkles, Wallet, X, ChevronRight
} from "lucide-react";

export default function LoanPage({ user, onUserUpdate, settings, active }) {
  const [loans, setLoans] = useState([]);
  const [referralLoans, setReferralLoans] = useState([]);
  const [referralFriends, setReferralFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCongrats, setShowCongrats] = useState(false);
  const [applyModal, setApplyModal] = useState(false);
  const [showAllLoans, setShowAllLoans] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [myLoans, referralRes] = await Promise.all([
      db.entities.LoanApplication.filter({ user_id: user.id }, "-created_date"),
      db.functions.invoke("getReferralDashboard").catch(() => null),
    ]);
    setLoans(myLoans);
    ensureDueDateNotifications(user, myLoans);
    if (referralRes) {
      const data = referralRes.data || referralRes;
      setReferralFriends(data.friends || []);
      setReferralLoans(data.loans || []);
    }
    setLoading(false);
  };

  const shownLimitRef = useRef(null);
  useEffect(() => {
    const currentLimit = user.loan_limit || 0;
    const acknowledged = user.limit_acknowledged || 0;
    // Show the calibration popup exactly once when the admin sets a new limit
    // (first time or any increase) that the user hasn't acknowledged yet.
    if (
      user.kyc_status === "approved" &&
      currentLimit > 0 &&
      currentLimit > acknowledged &&
      shownLimitRef.current !== currentLimit
    ) {
      shownLimitRef.current = currentLimit;
      setShowCongrats(true);
    }
  }, [user.loan_limit, user.limit_acknowledged, user.kyc_status]);

  useEffect(() => {
    if (active) loadData();
  }, [active]);

  // KYC Pending
  if (user.kyc_status === "pending") return <KycPending />;

  // KYC Rejected
  if (user.kyc_status === "rejected")
    return <KycRejected user={user} reason={user.rejection_reason} onReapply={handleReapply} />;

  // KYC Hold
  if (user.kyc_status === "hold" || user.account_status === "hold")
    return <KycHold />;

  // KYC approved but limit not yet assigned by admin
  if (user.kyc_status === "approved" && !user.loan_limit)
    return <KycApprovedPendingLimit />;

  if (loading || !settings) return <NeuPageLoader />;

  // Approved
  const activeLoans = loans.filter((l) => ["pending_disbursement", "disbursed", "pending_verification", "overdue"].includes(l.status));
  const usedLimit = activeLoans.reduce((sum, l) => sum + l.amount, 0);
  const availableLimit = (user.loan_limit || 0) - usedLimit;
  const myLoans = loans.filter((l) => l.status !== "repaid");

  return (
    <div className="space-y-4 pb-4">
      {showCongrats && (
        <ConfettiPopup
          title={user.limit_acknowledged > 0 ? "Limit Increased!" : "Congratulations!"}
          message={user.limit_acknowledged > 0
            ? `Your limit has been increased to ${formatINR(user.loan_limit)}. Your limit will increase based on your good transaction history.`
            : `A limit of ${formatINR(user.loan_limit)} is approved. Your limit will increase based on your good transaction history.`}
          onClose={async () => {
            setShowCongrats(false);
            try {
              await db.auth.updateMe({ limit_acknowledged: user.loan_limit });
              onUserUpdate();
            } catch (e) {
              // limit acknowledgement is best-effort
            }
          }}
        />
      )}

      {/* Greeting */}
      <div className="px-1 pt-1">
        <p className="text-sm text-slate-400">Hello,</p>
        <p className="text-xl font-bold text-slate-800">{(user.display_name || user.full_name || "User").split(" ")[0]} 👋</p>
      </div>

      {/* Limit Card */}
      <div className="neu-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full sdl-gradient flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-600">Available Limit</span>
          </div>
          <span className="text-xs text-slate-400">of {formatINR(user.loan_limit || 0)}</span>
        </div>
        <p className="text-3xl font-bold sdl-gradient-text">{formatINR(availableLimit)}</p>
        <p className="text-xs text-slate-400 mt-1">Available to borrow</p>
        {usedLimit > 0 && (
          <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full sdl-gradient rounded-full" style={{ width: `${Math.min(100, (usedLimit / (user.loan_limit || 1)) * 100)}%` }} />
          </div>
        )}
        <button
          onClick={() => setApplyModal(true)}
          disabled={availableLimit < 500}
          className="sdl-gradient w-full h-12 rounded-2xl mt-4 flex items-center justify-center gap-2 text-white font-semibold text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          <HandCoins className="w-4 h-4" /> Apply for Loan
        </button>
      </div>

      {/* My Loans */}
      <div className="neu-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-600">My Loans</h3>
          {myLoans.length > 5 && (
            <button onClick={() => setShowAllLoans(true)} className="text-xs font-medium sdl-gradient-text flex items-center gap-0.5">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {myLoans.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No loans yet. Apply to get started.</p>
        ) : (
          <div className="space-y-2">
            {myLoans.slice(0, 5).map((l) => <LoanRow key={l.id} loan={l} />)}
          </div>
        )}
      </div>

      {/* Referral earnings + share */}
      <ReferralCard user={user} friends={referralFriends} referralLoans={referralLoans} settings={settings} />

      {applyModal && (
        <ApplyLoanModal
          user={user}
          settings={settings}
          availableLimit={availableLimit}
          onClose={() => setApplyModal(false)}
          onSubmitted={() => { setApplyModal(false); loadData(); onUserUpdate(); }}
        />
      )}
      {showAllLoans && <AllLoansModal loans={myLoans} onClose={() => setShowAllLoans(false)} />}
    </div>
  );

  async function handleReapply() {
    await db.functions.invoke("submitKyc", { reapply: true });
    onUserUpdate();
  }
}

function LoanRow({ loan }) {
  const overdue = loan.status === "disbursed" && isOverdue(loan.due_date);
  const statusColors = {
    pending_disbursement: "text-amber-600",
    disbursed: overdue ? "text-sdl-red" : "text-blue-600",
    pending_verification: "text-amber-600",
    repaid: "text-sdl-green",
    overdue: "text-sdl-red",
    rejected: "text-sdl-red",
  };
  const statusLabels = {
    pending_disbursement: "Pending",
    disbursed: overdue ? "Overdue" : "Active",
    pending_verification: "Verifying",
    repaid: "Repaid",
    overdue: "Overdue",
    rejected: "Rejected",
  };
  return (
    <div className="neu-inset-sm rounded-xl p-3 flex justify-between items-center">
      <div>
        <p className="text-sm font-semibold text-slate-700">{formatINR(loan.amount)}</p>
        {loan.loan_id && <p className="text-[10px] font-mono text-sdl-orange">ID: {loan.loan_id}</p>}
        <p className="text-[10px] text-slate-400">Loan Date: {formatDate(loan.created_date)}</p>
        <p className="text-[10px] text-slate-400">Due: {formatDate(loan.due_date)}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`text-xs font-medium ${statusColors[loan.status]}`}>{statusLabels[loan.status]}</span>
        {loan.status === "pending_disbursement" && (
          <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" /> Within 24h
          </span>
        )}
        {loan.status === "pending_verification" && (
          <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Under verification (within 24h)
          </span>
        )}
      </div>
    </div>
  );
}

function ReferralLoanRow({ loan, settings }) {
  const earning = Math.round((loan.amount * (settings?.referral_percentage || 1)) / 100);
  return (
    <div className="neu-inset-sm rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        {loan.friendPic ? (
          <img src={loan.friendPic} alt="" className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full sdl-gradient flex items-center justify-center text-white text-xs font-bold">
            {loan.friendName?.[0]?.toUpperCase()}
          </div>
        )}
        <span className="text-sm font-semibold text-slate-700">{loan.friendName}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
        <span>Loan: {formatINR(loan.amount)}</span>
        <span>Repay: {formatINR(loan.repayment_amount)}</span>
        <span>Due: {formatDate(loan.due_date)}</span>
        <span className="text-sdl-green font-semibold">Your earning: {formatINR(earning)}</span>
      </div>
      <div className="mt-2 text-[10px] text-slate-400">
        Status: {loan.status === "repaid" ? "Repaid" : loan.status === "disbursed" ? "Active" : "Processing"}
      </div>
    </div>
  );
}

function KycPending() {
  return (
    <div className="neu-card p-6 text-center mt-4">
      <div className="w-16 h-16 rounded-full neu-card-sm mx-auto mb-4 flex items-center justify-center">
        <Clock className="w-8 h-8 text-sdl-orange" />
      </div>
      <h3 className="text-lg font-bold sdl-gradient-text mb-2">KYC Under Review</h3>
      <p className="text-sm text-slate-500 mb-1">Your application is being verified.</p>
      <p className="text-sm text-slate-500">Approval within 24 hours. You'll be notified once your limit is set.</p>
    </div>
  );
}

function KycRejected({ reason, onReapply }) {
  return (
    <div className="neu-card p-6 text-center mt-4">
      <div className="w-16 h-16 rounded-full neu-card-sm mx-auto mb-4 flex items-center justify-center">
        <XCircle className="w-8 h-8 text-sdl-red" />
      </div>
      <h3 className="text-lg font-bold text-slate-700 mb-2">We're Sorry</h3>
      <p className="text-sm text-slate-500 mb-2">
        We cannot provide the loan at this time due to our internal verification process.
      </p>
      {reason && <p className="text-xs text-slate-400 neu-inset-sm rounded-xl p-3 mb-3">Reason: {reason}</p>}
      <p className="text-sm text-slate-500 mb-4">You can try again after a few months. We will notify you.</p>
      <button onClick={onReapply} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg active:scale-95 transition-transform">
        Apply Again
      </button>
    </div>
  );
}

function KycHold() {
  return (
    <div className="neu-card p-6 text-center mt-4">
      <div className="w-16 h-16 rounded-full neu-card-sm mx-auto mb-4 flex items-center justify-center">
        <Clock className="w-8 h-8 text-amber-500" />
      </div>
      <h3 className="text-lg font-bold text-slate-700 mb-2">Account On Hold</h3>
      <p className="text-sm text-slate-500">Your account is temporarily on hold. Please contact SDL support.</p>
    </div>
  );
}

function KycApprovedPendingLimit() {
  return (
    <div className="neu-card p-6 text-center mt-4">
      <div className="w-16 h-16 rounded-full sdl-gradient mx-auto mb-4 flex items-center justify-center shadow-lg">
        <CheckCircle2 className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg font-bold sdl-gradient-text mb-2">KYC Done</h3>
      <p className="text-sm text-slate-500 mb-1">Your KYC verification is complete.</p>
      <p className="text-sm text-slate-500">Your loan limit will be assigned soon. You'll receive an email notification once it's set.</p>
    </div>
  );
}

function ApplyLoanModal({ user, settings, availableLimit, onClose, onSubmitted }) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loanId, setLoanId] = useState(null);
  const { principal, interest, totalCharges, total, portalCharge, processingFee, savingsBack } = calcRepayment(amount, settings);
  const dueDate = getDueDate(user.salary_date);

  const loanIdRef = React.useRef(null);
  const generatePdf = async () => {
    if (!loanIdRef.current) loanIdRef.current = generateLoanId(user);
    const doc = await generateAgreementPdf({ user, settings, principal, interest, portalCharge, processingFee, savingsBack, totalCharges, total, dueDate, loanId: loanIdRef.current, requestDate: new Date().toISOString() });
    const blob = doc.output("blob");
    const file = new File([blob], `SDL_Agreement_${Date.now()}.pdf`, { type: "application/pdf" });
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setPdfUrl(file_url);
    setPdfBlobUrl(URL.createObjectURL(blob));
    return file_url;
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const url = await generatePdf();
      setPdfUrl(url);
      setStep(3);
    } catch (e) {
      alert("Failed to generate agreement: " + (e.message || "error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!termsAccepted) { alert("Please accept the terms and conditions to continue."); return; }
    setLoading(true);
    try {
      const loan = await db.entities.LoanApplication.create({
        user_id: user.id,
        user_name: user.display_name || user.full_name,
        user_mobile: user.mobile_number,
        user_upi_id: user.upi_id,
        loan_id: loanIdRef.current || generateLoanId(user),
        amount: principal,
        interest_amount: totalCharges,
        repayment_amount: total,
        due_date: dueDate,
        status: "pending_disbursement",
        agreement_pdf_url: pdfUrl,
        terms_accepted: true,
      });
      setLoanId(loan.id);
      setStep(4);
    } catch (e) {
      alert("Failed to submit loan: " + (e.message || "error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">
            {step === 4 ? "Loan Submitted" : "Apply for Loan"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="neu-inset-sm rounded-xl p-3 flex justify-between text-xs text-slate-500">
              <span>Available: {formatINR(availableLimit)}</span>
              <span>Min: ₹500</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Loan Amount</label>
              <NeuInput type="number" min={500} max={availableLimit} value={amount || ""} onChange={(e) => { const val = e.target.value; if (val === "") { setAmount(0); return; } setAmount(Math.min(Number(val), availableLimit)); }} />
            </div>
            <div className="neu-inset rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Principal</span><span className="font-semibold text-slate-700">{formatINR(principal)}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1">Service Charge <ChargeInfoButton principal={principal} settings={settings} /></span>
                <span className="font-semibold text-slate-700">{formatINR(totalCharges)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-semibold text-slate-700">Repayment</span><span className="font-bold sdl-gradient-text">{formatINR(total)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Due Date</span><span className="font-semibold text-slate-700">{formatDate(dueDate)}</span></div>
            </div>
            <button onClick={() => setStep(2)} disabled={amount < 500} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
              Review <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-600 text-center">Review Your Loan</h4>
            <div className="neu-inset rounded-2xl p-5 space-y-3">
              <div className="flex justify-between"><span className="text-sm text-slate-500">Principal</span><span className="text-lg font-bold sdl-gradient-text">{formatINR(principal)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-500 flex items-center gap-1">Service Charge <ChargeInfoButton principal={principal} settings={settings} /></span><span className="font-semibold text-slate-700">{formatINR(totalCharges)}</span></div>
              <div className="flex justify-between text-sm border-t border-slate-200 pt-2"><span className="font-semibold text-slate-700">Repayment</span><span className="font-semibold text-slate-700">{formatINR(total)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Repayment Date</span><span className="font-semibold text-slate-700">{formatDate(dueDate)}</span></div>
              <div className="flex justify-between text-sm text-sdl-green"><span className="text-slate-500">Wallet Credit (on repayment)</span><span className="font-semibold">{formatINR(savingsBack)}</span></div>
              <div className="neu-inset-sm rounded-xl p-3 mt-2">
                <p className="text-xs text-slate-500">By continuing, you agree to the loan agreement terms. A PDF agreement will be generated for your records.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="neu-btn flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-slate-600 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={handleGenerate} disabled={loading} className="sdl-gradient flex-1 h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileDown className="w-4 h-4" /> Continue & Generate</>}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full sdl-gradient mx-auto flex items-center justify-center mb-3">
                <FileDown className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">Agreement Generated</h4>
              <p className="text-xs text-slate-500 mt-1">Review your agreement, accept the terms, and submit your request.</p>
            </div>
            {pdfBlobUrl && (
              <a href={pdfBlobUrl} download={`SDL_Agreement_${loanIdRef.current || "document"}.pdf`} className="neu-btn w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-slate-600 text-sm font-medium">
                <FileDown className="w-4 h-4" /> Download Agreement
              </a>
            )}
            <div className="neu-inset-sm rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Principal</span><span className="font-semibold text-slate-700">{formatINR(principal)}</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-slate-500 flex items-center gap-1">Service Charge <ChargeInfoButton principal={principal} settings={settings} /></span><span className="font-semibold text-slate-700">{formatINR(totalCharges)}</span></div>
              <div className="flex justify-between text-sm border-t border-slate-200 pt-1"><span className="font-semibold text-slate-700">Repayment</span><span className="font-semibold text-slate-700">{formatINR(total)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Due Date</span><span className="font-semibold text-slate-700">{formatDate(dueDate)}</span></div>
            </div>
            <label className="flex items-start gap-2 cursor-pointer neu-inset-sm rounded-xl p-3">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 accent-sdl-orange shrink-0" />
              <span className="text-xs text-slate-600 leading-relaxed">I have read and accept the Terms and Conditions of the loan agreement. I authorize SDL to disburse the loan to my UPI ID.</span>
            </label>
            <button onClick={handleSubmit} disabled={loading || !termsAccepted} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full sdl-gradient mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-base font-bold text-slate-700">Loan Application Submitted!</h4>
            <p className="text-xs font-mono text-sdl-orange font-semibold">Loan ID: {loanIdRef.current}</p>
            <p className="text-sm text-slate-500">Your loan of {formatINR(principal)} is awaiting disbursement. The amount will be sent to your UPI ID within 24 hours.</p>
            {pdfBlobUrl && (
              <a href={pdfBlobUrl} download={`SDL_Agreement_${loanIdRef.current || "document"}.pdf`} className="neu-btn w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-slate-600 text-sm font-medium">
                <FileDown className="w-4 h-4" /> Download Agreement
              </a>
            )}
            <button onClick={onSubmitted} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}