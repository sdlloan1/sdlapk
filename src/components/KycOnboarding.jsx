const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import NeuButton from "@/components/NeuButton";
import { logoutToLogin } from "@/lib/logout";
import NeuInput from "@/components/NeuInput";
import {
  User, Phone, CreditCard, Mail, Upload, Wallet, CalendarDays,
  Users, ArrowRight, ArrowLeft, CheckCircle2, Image as ImageIcon, Loader2, XCircle
} from "lucide-react";
import AddressFields from "@/components/AddressFields";

function FileUploadBox({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      alert("Please upload a JPG or PNG image only.");
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      onChange(file_url);
    } catch (err) {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-500 mb-2 ml-1">{label}</span>
      <div className={`neu-inset rounded-2xl h-32 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${value ? "border-2 border-sdl-green" : ""}`}>
        {uploading ? (
          <Loader2 className="w-6 h-6 text-sdl-orange animate-spin" />
        ) : value ? (
          <>
            <img src={value} alt={label} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full sdl-green bg-sdl-green flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-slate-400 mb-1" />
            <span className="text-xs text-slate-400">JPG / PNG</span>
          </>
        )}
        <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleFile} className="hidden" />
      </div>
    </label>
  );
}

export default function KycOnboarding({ user, onComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dailyLimit, setDailyLimit] = useState(3);

  // Daily KYC attempt limit (admin configurable) + admin-set unblock date.
  const todayStr = new Date().toLocaleDateString("en-CA");
  const attemptsToday = user.kyc_attempt_date === todayStr ? Number(user.kyc_attempt_count) || 0 : 0;
  const blockedUntil = user.kyc_blocked_until || "";
  const isBlocked = blockedUntil && todayStr < blockedUntil;
  const attemptsLeft = Math.max(0, dailyLimit - attemptsToday);

  useEffect(() => {
    db.entities.AppSettings.list()
      .then((s) => {
        const lim = Number(s[0]?.kyc_daily_limit);
        if (lim > 0) setDailyLimit(lim);
      })
      .catch(() => {});
  }, []);

  const DRAFT_KEY = `sdl_kyc_draft_${user.email || "anon"}`;
  const draft = (() => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}"); } catch { return {}; } })();
  const refInitial = draft.referrerMobile || (typeof window !== "undefined" ? (localStorage.getItem("sdl_ref_mobile") || "") : "");

  // Step 1
  const [fullName, setFullName] = useState(draft.fullName || "");
  const [mobile, setMobile] = useState(draft.mobile || "");
  const [pan, setPan] = useState(draft.pan || "");
  const [email, setEmail] = useState(user.email || "");
  // Step 2
  const [panCard, setPanCard] = useState(draft.panCard || "");
  const [aadhaarFront, setAadhaarFront] = useState(draft.aadhaarFront || "");
  const [aadhaarBack, setAadhaarBack] = useState(draft.aadhaarBack || "");
  const [salarySlip, setSalarySlip] = useState(draft.salarySlip || "");
  // Step 3
  const [upiId, setUpiId] = useState(draft.upiId || "");
  const [salaryDate, setSalaryDate] = useState(draft.salaryDate || "");
  const [referrerName, setReferrerName] = useState(draft.referrerName || "");
  const [referrerMobile, setReferrerMobile] = useState(refInitial);
  const [address, setAddress] = useState(draft.address || {});
  const updateAddress = (key, val) => setAddress((prev) => ({ ...prev, [key]: val }));

  // Persist draft so users can resume after going back to login
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ fullName, mobile, pan, panCard, aadhaarFront, aadhaarBack, salarySlip, upiId, salaryDate, referrerName, referrerMobile, address }));
    } catch (e) {}
  }, [fullName, mobile, pan, panCard, aadhaarFront, aadhaarBack, salarySlip, upiId, salaryDate, referrerName, referrerMobile, address]);

  const validateStep1 = async () => {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!/^\d{10}$/.test(mobile)) return "Mobile number must be exactly 10 digits.";
    const panUpper = pan.toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panUpper)) return "Invalid PAN format.";
    if (email.trim().toLowerCase() !== (user.email || "").toLowerCase()) return "Email cannot be changed. Please use the email ID you registered with.";
    if (!address.address_line1?.trim()) return "Please enter your address (House no., Building).";
    if (!/^\d{6}$/.test(address.pincode || "")) return "Please enter a valid 6-digit PIN code.";
    if (!address.city?.trim()) return "Please enter your city.";
    if (!address.state?.trim()) return "Please enter your state.";
    try {
      const existingMobile = await db.entities.User.filter({ mobile_number: mobile });
      if (existingMobile.some((u) => u.id !== user.id)) return "This mobile number is already registered.";
      const existingPan = await db.entities.User.filter({ pan_number: panUpper });
      if (existingPan.some((u) => u.id !== user.id)) return "This PAN number is already registered.";
    } catch (e) {
      // Non-admin users cannot query other users; uniqueness is enforced server-side on save.
    }
    return null;
  };

  const validateStep2 = () => {
    if (!panCard) return "Please upload your PAN card.";
    if (!aadhaarFront) return "Please upload your Aadhaar card (front).";
    if (!aadhaarBack) return "Please upload your Aadhaar card (back).";
    if (!salarySlip) return "Please upload your salary slip.";
    return null;
  };

  const validateStep3 = async () => {
    if (!upiId.trim()) return "Please enter your UPI ID.";
    if (!salaryDate || salaryDate < 1 || salaryDate > 31) return "Please select a valid salary date (1-31).";
    if (!referrerName.trim()) return "Please enter the referrer's name.";
    if (!/^\d{10}$/.test(referrerMobile)) return "Referrer mobile must be 10 digits.";
    if (referrerMobile === mobile) return "Referrer cannot be yourself.";
    try {
      const res = await db.functions.invoke("verifyReferrer", { mobile_number: referrerMobile });
      const data = res.data || res;
      if (!data.found) return data.error || "Referrer not found. Only a registered SDL user's number can be used.";
    } catch (e) {
      return "Could not verify referrer. Please try again.";
    }
    return null;
  };

  const handleNext = async () => {
    setError("");
    let err = null;
    if (step === 1) err = await validateStep1();
    else if (step === 2) err = validateStep2();
    else if (step === 3) err = await validateStep3();
    if (err) { setError(err); return; }
    if (step < 3) { setStep(step + 1); window.scrollTo(0, 0); }
    else await submit();
  };

  const submit = async () => {
    if (attemptsLeft <= 0) {
      setError(`You have used all ${dailyLimit} KYC attempts for today. Please try again tomorrow.`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const today = new Date().toISOString().split("T")[0];
      const reachedLimit = attemptsToday + 1 >= dailyLimit;
      const nextDay = new Date(Date.now() + 86400000).toLocaleDateString("en-CA");
      await db.entities.User.update(user.id, {
        full_name: fullName.trim(),
        display_name: fullName.trim(),
        mobile_number: mobile,
        pan_number: pan.toUpperCase(),
        upi_id: upiId.trim(),
        salary_date: parseInt(salaryDate),
        salary_date_set_date: today,
        salary_slip_updated_date: today,
        referrer_name: referrerName.trim(),
        referrer_mobile: referrerMobile,
        address_line1: address.address_line1?.trim() || "",
        address_line2: address.address_line2?.trim() || "",
        city: address.city?.trim() || "",
        state: address.state?.trim() || "",
        pincode: address.pincode || "",
        pan_card_image: panCard,
        aadhaar_front_image: aadhaarFront,
        aadhaar_back_image: aadhaarBack,
        salary_slip_image: salarySlip,
        kyc_status: "pending",
        registration_complete: true,
        kyc_attempt_count: attemptsToday + 1,
        kyc_attempt_date: todayStr,
        ...(reachedLimit ? { kyc_blocked_until: nextDay } : {}),
      });
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      onComplete();
    } catch (e) {
      setError(e.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  if (isBlocked) {
    return (
      <div className="min-h-screen px-4 py-10 flex items-center justify-center">
        <div className="neu-card p-6 w-full max-w-md text-center neu-slide-in">
          <div className="w-14 h-14 rounded-full bg-red-50 mx-auto flex items-center justify-center mb-3">
            <XCircle className="w-7 h-7 text-sdl-red" />
          </div>
          <h1 className="text-lg font-bold sdl-gradient-text mb-2">KYC Limit Reached</h1>
          <p className="text-sm text-slate-500">
            You have used all {dailyLimit} KYC attempts for now. You can try again on{" "}
            <span className="font-semibold text-slate-700">
              {new Date(blockedUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>.
          </p>
          <button onClick={() => logoutToLogin(navigate)} className="neu-btn w-full h-11 rounded-2xl mt-5 text-sm font-medium text-slate-600">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 relative overflow-hidden">
      <div className="absolute top-0 -left-20 w-64 h-64 rounded-full sdl-gradient opacity-10 blur-3xl" />
      <div className="w-full max-w-md mx-auto relative z-10">
        <h1 className="text-xl font-bold text-center sdl-gradient-text mb-1">Complete Your KYC</h1>
        <p className="text-xs text-center text-slate-500 mb-1">Approval within 24 hours</p>
        <p className="text-[10px] text-center text-slate-400 mb-4">
          {attemptsLeft} of {dailyLimit} KYC attempt(s) left today
        </p>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s <= step ? "sdl-gradient text-white" : "neu-inset-sm text-slate-400"}`}>
                {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-1 rounded-full ${s < step ? "sdl-gradient" : "neu-inset-sm"}`} />}
            </div>
          ))}
        </div>

        <div className="neu-card p-6 neu-slide-in" key={step}>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Full Name</label>
                <NeuInput icon={User} placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Mobile Number (10 digits)</label>
                <NeuInput icon={Phone} type="tel" maxLength={10} placeholder="9876543210" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">PAN Number</label>
                <NeuInput icon={CreditCard} maxLength={10} placeholder="ABCDE1234F" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Email ID (Login ID)</label>
                <NeuInput icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Full Address</label>
                <AddressFields value={address} onChange={updateAddress} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 text-center mb-2">Upload clear images (JPG/PNG only)</p>
              <FileUploadBox label="PAN Card" value={panCard} onChange={setPanCard} />
              <FileUploadBox label="Aadhaar Card (Front)" value={aadhaarFront} onChange={setAadhaarFront} />
              <FileUploadBox label="Aadhaar Card (Back)" value={aadhaarBack} onChange={setAadhaarBack} />
              <FileUploadBox label="Salary Slip" value={salarySlip} onChange={setSalarySlip} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">UPI ID</label>
                <NeuInput icon={Wallet} placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Salary Date (day of month)</label>
                <NeuInput icon={CalendarDays} type="number" min={1} max={31} placeholder="e.g. 5" value={salaryDate} onChange={(e) => setSalaryDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Who told you about SDL? (Referrer Name)</label>
                <NeuInput icon={Users} placeholder="Referrer's full name" value={referrerName} onChange={(e) => setReferrerName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Referrer's Mobile Number</label>
                <NeuInput icon={Phone} type="tel" maxLength={10} placeholder="Referrer's 10-digit number" value={referrerMobile} onChange={(e) => setReferrerMobile(e.target.value.replace(/\D/g, ""))} />
              </div>
            </div>
          )}

          {error && <div className="mt-4 p-3 rounded-xl bg-red-50 text-sdl-red text-sm text-center neu-inset-sm">{error}</div>}

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button onClick={() => { setStep(step - 1); setError(""); }} className="neu-btn flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-slate-600 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            <NeuButton variant="gradient" loading={loading} onClick={handleNext} className="flex-1 h-12 rounded-2xl">
              {step === 3 ? "Submit Application" : "Next"} {!loading && <ArrowRight className="w-4 h-4" />}
            </NeuButton>
          </div>
        </div>

        <button onClick={() => logoutToLogin(navigate)} className="mx-auto mt-4 text-xs text-slate-400 font-medium flex items-center gap-1 hover:text-sdl-orange transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Login
        </button>
      </div>
    </div>
  );
}