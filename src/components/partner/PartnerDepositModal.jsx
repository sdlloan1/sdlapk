import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import NeuButton from "@/components/NeuButton";
import NeuInput from "@/components/NeuInput";
import PaymentAppsGrid from "@/components/PaymentAppsGrid";
import { generatePartnerAgreementPdf } from "@/lib/partnerAgreementPdf";
import { formatINR, upiQrUrl } from "@/lib/sdlUtils";
import { FileDown, CheckCircle2, Upload, Loader2, X, ArrowLeft, ArrowRight } from "lucide-react";

export default function PartnerDepositModal({ user, settings, onClose, onSubmitted }) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [screenshot, setScreenshot] = useState("");
  const [uploading, setUploading] = useState(false);

  const qrUrl = upiQrUrl(settings?.admin_upi_id || "9310601973@ibl", amount, settings?.admin_upi_name);

  const generatePdf = async () => {
    const doc = await generatePartnerAgreementPdf({ user, settings, amount });
    const blob = doc.output("blob");
    const file = new File([blob], `SDL_Partner_Agreement_${Date.now()}.pdf`, { type: "application/pdf" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPdfUrl(file_url);
    return file_url;
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await generatePdf();
      setStep(3);
    } catch (e) {
      alert("Failed to generate agreement: " + (e.message || "error"));
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) { alert("JPG/PNG only"); return; }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setScreenshot(file_url);
    } catch { alert("Upload failed"); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (!screenshot) { alert("Please upload payment screenshot"); return; }
    setLoading(true);
    try {
      await base44.entities.PartnerDeposit.create({
        user_id: user.id,
        user_name: user.display_name || user.full_name,
        amount: Number(amount),
        status: "pending",
        agreement_pdf_url: pdfUrl,
        payment_screenshot: screenshot,
      });
      setStep(5);
    } catch (e) {
      alert("Failed: " + (e.message || "error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">
            {step >= 5 ? "Deposit Submitted" : "Partner Deposit"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        {/* Step 1: Amount */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="neu-inset-sm rounded-xl p-3 flex justify-between text-xs text-slate-500">
              <span>Min: {formatINR(5000)}</span>
              <span>Max: {formatINR(100000)}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Investment Amount</label>
              <NeuInput type="number" min={5000} max={100000} value={amount} onChange={(e) => setAmount(Math.min(Math.max(Number(e.target.value), 0), 100000))} />
            </div>
            <div className="neu-inset rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Investment</span><span className="font-semibold text-slate-700">{formatINR(amount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Profit Rate</span><span className="font-semibold text-sdl-green">10% per loan</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Lock Period</span><span className="font-semibold text-slate-700">6 months</span></div>
            </div>
            <button onClick={() => setStep(2)} disabled={amount < 5000 || amount > 100000} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
              Review <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-600 text-center">Review Your Investment</h4>
            <div className="neu-inset rounded-2xl p-5 space-y-3">
              <div className="flex justify-between"><span className="text-sm text-slate-500">Investment Amount</span><span className="text-lg font-bold sdl-gradient-text">{formatINR(amount)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Profit Share</span><span className="font-semibold text-sdl-green">10% per loan</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Lock Period</span><span className="font-semibold text-slate-700">6 months</span></div>
              <div className="neu-inset-sm rounded-xl p-3 mt-2">
                <p className="text-xs text-slate-500">By continuing, an agreement will be generated between you and the Lender. You'll need to accept the terms and make the payment.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="neu-btn flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-slate-600 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={handleGenerate} disabled={loading} className="sdl-gradient flex-1 h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileDown className="w-4 h-4" /> Generate Agreement</>}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: View agreement + accept terms */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full sdl-gradient mx-auto flex items-center justify-center mb-3">
                <FileDown className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">Agreement Generated</h4>
              <p className="text-xs text-slate-500 mt-1">Review your agreement, accept the terms, and proceed to payment.</p>
            </div>
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="neu-btn w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-slate-600 text-sm font-medium">
                <FileDown className="w-4 h-4" /> View / Download Agreement
              </a>
            )}
            <div className="neu-inset-sm rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Investment Amount</span><span className="font-semibold text-slate-700">{formatINR(amount)}</span></div>
            </div>
            <label className="flex items-start gap-2 cursor-pointer neu-inset-sm rounded-xl p-3">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 accent-sdl-orange shrink-0" />
              <span className="text-xs text-slate-600 leading-relaxed">I have read and accept the Terms and Conditions of the Partner Investment Agreement.</span>
            </label>
            <button onClick={() => setStep(4)} disabled={!termsAccepted} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
              Proceed to Payment <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 4: Payment + Upload proof */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-4">
            <div className="neu-inset rounded-2xl p-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Amount to Pay</span><span className="font-bold sdl-gradient-text text-lg">{formatINR(amount)}</span></div>
              <div className="flex justify-between text-xs text-slate-400"><span>Pay to UPI:</span><span className="font-mono">{settings?.admin_upi_id}</span></div>
            </div>
            <div className="neu-card-sm p-4 rounded-2xl inline-block mx-auto block">
              <img src={qrUrl} alt="Payment QR" className="w-52 h-52 rounded-xl mx-auto" />
            </div>
            <p className="text-xs text-slate-500 text-center">Scan this QR or use a UPI app to pay {formatINR(amount)}</p>
            </div>
            <PaymentAppsGrid settings={settings} amount={Number(amount)} note="SDL Partner Deposit" />

            <div className="neu-inset rounded-2xl p-3">
              <p className="text-xs font-medium text-slate-500 mb-2">Upload Payment Proof</p>
              <label className="block">
                <div className={`neu-inset rounded-2xl h-32 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${screenshot ? "border-2 border-sdl-green" : ""}`}>
                  {uploading ? <Loader2 className="w-6 h-6 text-sdl-orange animate-spin" /> :
                    screenshot ? <><img src={screenshot} alt="" className="absolute inset-0 w-full h-full object-cover" /><div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-sdl-green flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-white" /></div></> :
                    <><Upload className="w-6 h-6 text-slate-400 mb-1" /><span className="text-xs text-slate-400">JPG / PNG</span></>
                  }
                  <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleFile} className="hidden" />
                </div>
              </label>
            </div>
            <NeuButton variant="gradient" loading={loading} disabled={!screenshot} onClick={submit} className="w-full h-12 rounded-2xl">
              Submit Deposit Request
            </NeuButton>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full sdl-gradient mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-base font-bold text-slate-700">Deposit Request Submitted!</h4>
            <p className="text-sm text-slate-500">Your deposit of {formatINR(amount)} is under verification. It will be approved within 24 hours.</p>
            <button onClick={onSubmitted} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}