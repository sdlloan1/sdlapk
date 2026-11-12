import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { formatINR, upiQrUrl, formatDate, isOverdue, daysOverdue, calcOverdue, resolvePayee } from "@/lib/sdlUtils";
import { downloadAllBrandedQrs } from "@/lib/qrBranded";
import ChargeInfoButton from "@/components/ChargeInfoButton";
import AllLoansModal from "@/components/AllLoansModal";
import UpiVerifiedBadge from "@/components/UpiVerifiedBadge";
import {
  Repeat2, CheckCircle2, Upload, Loader2, X, Clock, History, AlertTriangle, ScanLine, ChevronRight, Copy, Download,
  ChevronDown, FileText, FileImage
} from "lucide-react";
import NeuPageLoader from "@/components/NeuPageLoader";

export default function RepaymentPage({ user, settings, active }) {
  const [loans, setLoans] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repayModal, setRepayModal] = useState(null);
  const [showAllLoans, setShowAllLoans] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [myLoans, t] = await Promise.all([
      base44.entities.LoanApplication.filter({ user_id: user.id }, "-created_date"),
      base44.entities.TeamMember.list("order"),
    ]);
    setLoans(myLoans);
    setTeam(t);
    setLoading(false);
  };

  useEffect(() => { if (active) loadData(); }, [active]);

  const activeLoans = loans.filter((l) => ["disbursed", "pending_verification"].includes(l.status)).sort((a, b) => {
    const aOd = a.status === "disbursed" && isOverdue(a.due_date);
    const bOd = b.status === "disbursed" && isOverdue(b.due_date);
    if (aOd && !bOd) return -1;
    if (!aOd && bOd) return 1;
    return 0;
  });
  const historyLoans = loans.filter((l) => ["repaid", "rejected"].includes(l.status));
  const payee = resolvePayee(team, settings);

  if (loading || !settings) return <NeuPageLoader />;

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Repeat2 className="w-5 h-5 text-sdl-orange" />
          <h2 className="text-lg font-bold sdl-gradient-text">Repayment</h2>
        </div>
        {loans.length > 0 && (
          <button onClick={() => setShowAllLoans(true)} className="neu-btn h-8 px-3 rounded-xl flex items-center gap-1 text-xs font-medium text-slate-600">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {activeLoans.length === 0 ? (
        <div className="neu-card p-8 text-center">
          <div className="w-16 h-16 rounded-full neu-card-sm mx-auto mb-4 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-sdl-green" />
          </div>
          <h3 className="text-base font-bold text-slate-700 mb-1">No Active Loan</h3>
          <p className="text-sm text-slate-400">You have no pending repayments.</p>
        </div>
      ) : (
        activeLoans.map((loan) => (
          <RepaymentCard key={loan.id} loan={loan} settings={settings} onRepay={() => setRepayModal(loan)} />
        ))
      )}

      {/* History */}
      <div className="neu-card p-5">
        <button onClick={() => setShowHistory((s) => !s)} className="w-full flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-600">Payment History</span>
            <span className="text-[10px] text-slate-400">({historyLoans.length})</span>
          </span>
          {showHistory ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </button>
        {showHistory && (
          <div className="mt-3 neu-fade-up">
            {historyLoans.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No payment history yet.</p>
            ) : (
              <div className="space-y-2">
                {historyLoans.map((l) => (
                  <div key={l.id} className="neu-inset-sm rounded-xl p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{formatINR(l.amount)}</p>
                        <p className="text-[10px] text-slate-400">Repaid: {formatINR(l.repayment_amount)} • {formatDate(l.repaid_date)}</p>
                      </div>
                      <span className="text-xs font-medium text-sdl-green flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Paid
                      </span>
                    </div>
                    <LoanDocs loan={l} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {repayModal && (
        <RepayModal
          loan={repayModal}
          payee={payee}
          settings={settings}
          onClose={() => setRepayModal(null)}
          onSubmitted={() => { setRepayModal(null); loadData(); }}
        />
      )}
      {showAllLoans && <AllLoansModal loans={loans} onClose={() => setShowAllLoans(false)} />}
    </div>
  );
}

function RepaymentCard({ loan, settings, onRepay }) {
  const overdue = loan.status === "disbursed" && isOverdue(loan.due_date);
  const odDays = overdue ? daysOverdue(loan.due_date) : 0;
  const odCharge = overdue && !loan.overdue_waived ? calcOverdue(loan.amount, odDays, settings?.overdue_daily_rate || 1) : 0;
  const totalDue = loan.repayment_amount + odCharge;
  const serviceCharge = loan.interest_amount || 0;
  const savingsPct = settings?.savings_percentage || 1;
  const savingsBack = Math.round((loan.amount * savingsPct) / 100);

  return (
    <div className={`neu-card p-5 ${overdue ? "border-2 border-sdl-red" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${overdue ? "bg-red-100" : "bg-blue-100"}`}>
            {overdue ? <AlertTriangle className="w-5 h-5 text-sdl-red" /> : <Clock className="w-5 h-5 text-blue-600" />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">{formatINR(loan.amount)} Loan</p>
            {loan.loan_id && <p className="text-[10px] font-mono text-sdl-orange font-medium">ID: {loan.loan_id}</p>}
            <p className="text-[10px] text-slate-400">Loan Date: {formatDate(loan.loan_date || loan.created_date)}</p>
            <p className="text-[10px] text-slate-400">Repayment Date: {formatDate(loan.due_date)}</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${overdue ? "bg-red-100 text-sdl-red" : "bg-blue-100 text-blue-600"}`}>
          {overdue ? `Overdue ${odDays}d` : "Active"}
        </span>
      </div>

      <div className="neu-inset rounded-2xl p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Principal</span><span className="font-semibold text-slate-700">{formatINR(loan.amount)}</span></div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 flex items-center gap-1">Service Charge <ChargeInfoButton principal={loan.amount} settings={settings} /></span>
          <span className="font-semibold text-slate-700">{formatINR(serviceCharge)}</span>
        </div>
        <div className="flex justify-between"><span className="text-slate-500">Repayment Date</span><span className="font-semibold text-slate-700">{formatDate(loan.due_date)}</span></div>
        <div className="flex justify-between text-sdl-green"><span className="text-slate-500">Wallet Credit (on repayment)</span><span className="font-semibold">{formatINR(savingsBack)}</span></div>
        {overdue && (odCharge > 0 ? (
          <div className="flex justify-between text-sdl-red"><span>Overdue Charges ({odDays} days)</span><span className="font-semibold">{formatINR(odCharge)}</span></div>
        ) : (
          <div className="flex justify-between text-sdl-green"><span>Overdue Charges</span><span className="font-semibold">Waived</span></div>
        ))}
        <div className="flex justify-between border-t border-slate-200 pt-2">
          <span className="font-semibold text-slate-700">Total Due</span>
          <span className="font-bold sdl-gradient-text text-base">{formatINR(totalDue)}</span>
        </div>
      </div>

      <LoanDocs loan={loan} />

      {loan.status === "pending_verification" ? (
        <div className="mt-3 neu-inset-sm rounded-xl p-3 flex items-center gap-2 text-xs text-amber-600">
          <Loader2 className="w-3 h-3 animate-spin" /> Payment under verification (within 24h)
        </div>
      ) : (
        <button onClick={onRepay} className="sdl-gradient w-full h-12 rounded-2xl mt-4 flex items-center justify-center gap-2 text-white font-semibold text-sm shadow-lg active:scale-95 transition-transform">
          <ScanLine className="w-4 h-4" /> Repay Now
        </button>
      )}
    </div>
  );
}

function RepayModal({ loan, payee, settings, onClose, onSubmitted }) {
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);

  const overdue = isOverdue(loan.due_date);
  const odDays = overdue ? daysOverdue(loan.due_date) : 0;
  const odCharge = overdue && !loan.overdue_waived ? calcOverdue(loan.amount, odDays, settings?.overdue_daily_rate || 1) : 0;
  const totalDue = loan.repayment_amount + odCharge;
  const savingsPct = settings?.savings_percentage || 1;
  const savingsBack = Math.round((loan.amount * savingsPct) / 100);

  // Split into installments of max 2000 each (last one is the remainder).
  const buildInstallments = (total) => {
    if (total <= 2000) return [total];
    const chunks = [];
    let remaining = total;
    while (remaining > 0) {
      const chunk = Math.min(2000, remaining);
      chunks.push(chunk);
      remaining -= chunk;
    }
    return chunks;
  };
  const installments = buildInstallments(totalDue);
  const isMulti = installments.length > 1;
  const [payments, setPayments] = useState(installments.map((amt) => ({ amount: amt, screenshot: "" })));
  const allUploaded = payments.every((p) => p.screenshot);

  // One QR per unique amount (e.g. 4800 -> 2000 & 800), but a screenshot is
  // still required for every part.
  const uniqueAmounts = [...new Set(installments)];
  const qrSpecs = uniqueAmounts.map((amt) => ({
    amount: amt,
    count: installments.filter((a) => a === amt).length,
  }));

  const qrFor = (amt) => upiQrUrl(payee.upiId, amt, payee.upiName);

  const handleFile = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) { alert("JPG/PNG only"); return; }
    setUploadingIndex(idx);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPayments((prev) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], screenshot: file_url };
        return updated;
      });
    } catch { alert("Upload failed"); }
    finally { setUploadingIndex(null); }
  };

  const removeShot = (idx) => setPayments((prev) => {
    const updated = [...prev];
    updated[idx] = { ...updated[idx], screenshot: "" };
    return updated;
  });

  const copyUpi = () => {
    navigator.clipboard.writeText(payee.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAllQrs = async () => {
    setDownloading(true);
    try {
      await downloadAllBrandedQrs(qrSpecs, payee);
    } finally { setDownloading(false); }
  };

  const submit = async () => {
    if (!allUploaded) { alert("Please upload all payment screenshots"); return; }
    setSubmitting(true);
    try {
      const shots = payments.map((p) => ({ screenshot: p.screenshot, amount: p.amount }));
      await base44.functions.invoke("submitRepaymentProof", { loanId: loan.id, screenshots: shots });
      setDone(true);
    } catch (e) { alert("Failed: " + (e.response?.data?.error || e.message || "error")); }
    finally { setSubmitting(false); }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/30 backdrop-blur-sm">
        <div className="neu-card p-6 w-full max-w-md neu-pop text-center space-y-4">
          <div className="w-16 h-16 rounded-full sdl-gradient mx-auto flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-white" /></div>
          <h4 className="text-base font-bold text-slate-700">Proof Submitted!</h4>
          <p className="text-sm text-slate-500">Your payment is under verification. It will be confirmed within 24 hours.</p>
          <button onClick={onSubmitted} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">Repay Loan</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="neu-inset rounded-2xl p-4 text-sm space-y-2 mb-4">
          <div className="flex justify-between"><span className="text-slate-500">Principal</span><span className="font-semibold text-slate-700">{formatINR(loan.amount)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Service Charge</span><span className="font-semibold text-slate-700">{formatINR(loan.interest_amount || 0)}</span></div>
          {overdue && <div className="flex justify-between text-sdl-red"><span>Overdue ({odDays}d)</span><span className="font-semibold">{odCharge > 0 ? formatINR(odCharge) : "Waived"}</span></div>}
          <div className="flex justify-between text-sdl-green"><span className="text-slate-500">Wallet Credit (on repayment)</span><span className="font-semibold">{formatINR(savingsBack)}</span></div>
          <div className="flex justify-between border-t border-slate-200 pt-1"><span className="font-semibold text-slate-700">Total to Pay</span><span className="font-bold sdl-gradient-text text-lg">{formatINR(totalDue)}</span></div>
        </div>

        <div className="flex justify-center mb-4"><UpiVerifiedBadge name={payee.upiName} /></div>

        <div className="space-y-2 mb-4">
          {payments.map((p, i) => (
            <div key={i} className="neu-inset-sm rounded-xl p-3 flex justify-between items-center gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700">Payment {i + 1} of {payments.length}</p>
                <p className="text-sm font-bold text-slate-700">{formatINR(p.amount)}</p>
              </div>
              {p.screenshot ? (
                <div className="flex items-center gap-2 shrink-0">
                  <img src={p.screenshot} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <button onClick={() => removeShot(i)} className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center text-slate-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <label className={`neu-btn px-3 h-9 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-1 cursor-pointer ${uploadingIndex === i ? "opacity-50 pointer-events-none" : ""}`}>
                  {uploadingIndex === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Upload className="w-3.5 h-3.5" /> Upload</>}
                  <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={(e) => handleFile(e, i)} className="hidden" />
                </label>
              )}
            </div>
          ))}
        </div>

        {isMulti ? (
          <div className="flex flex-col items-center mb-4">
            <div className="relative neu-card-sm p-3 rounded-2xl">
              <img src={qrFor(installments[0])} alt="QR preview" className="w-40 h-40 rounded-xl blur-[6px] select-none pointer-events-none" />
              <div className="absolute inset-0 flex items-center justify-center p-2">
                <button onClick={downloadAllQrs} disabled={downloading} className="sdl-gradient px-4 h-10 rounded-xl text-white text-xs font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50">
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4" /> Download All QR</>}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">Download {uniqueAmounts.length} QR code{uniqueAmounts.length > 1 ? "s" : ""} (one per amount), scan & pay each part, then upload a screenshot for all {installments.length} payments above.</p>
          </div>
        ) : (
          <div className="text-center space-y-3 mb-4">
            <p className="text-xs text-slate-500">Pay {formatINR(totalDue)} via UPI</p>
            <div className="neu-card-sm p-3 rounded-2xl inline-block">
              <img src={qrFor(totalDue)} alt="Payment QR" className="w-48 h-48 rounded-xl" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <p className="text-xs text-slate-400">UPI ID:</p>
              <span className="text-xs font-mono text-slate-700">{payee.upiId}</span>
              <button onClick={copyUpi} className="w-7 h-7 rounded-full neu-inset-sm flex items-center justify-center text-slate-500">
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-sdl-green" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        <button onClick={submit} disabled={!allUploaded || submitting} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Submit for Verification</>}
        </button>
      </div>
    </div>
  );
}

// Agreement + disbursement proof, viewable and downloadable by the borrower.
function LoanDocs({ loan }) {
  const [proof, setProof] = useState(false);
  if (!loan.agreement_pdf_url && !loan.disbursement_screenshot) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-3">
        {loan.agreement_pdf_url && (
          <a href={loan.agreement_pdf_url} target="_blank" rel="noreferrer"
            className="neu-btn h-9 px-3 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-sdl-orange" /> Agreement <Download className="w-3 h-3" />
          </a>
        )}
        {loan.disbursement_screenshot && (
          <button onClick={() => setProof(true)}
            className="neu-btn h-9 px-3 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-1.5">
            <FileImage className="w-3.5 h-3.5 text-sdl-green" /> Payment Proof
          </button>
        )}
      </div>

      {proof && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" onClick={() => setProof(false)}>
          <div className="neu-card p-4 w-full max-w-sm neu-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-slate-700">Payment Proof</h4>
              <button onClick={() => setProof(false)} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <img src={loan.disbursement_screenshot} alt="Payment proof" className="w-full rounded-xl" />
            <a href={loan.disbursement_screenshot} download target="_blank" rel="noreferrer"
              className="sdl-gradient w-full h-11 rounded-xl mt-3 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg">
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
        </div>
      )}
    </>
  );
}