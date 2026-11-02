const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, HandCoins, ShieldCheck, Users, Wallet, Sparkles, Download } from "lucide-react";
import DownloadAppModal from "@/components/DownloadAppModal";

const SDL_LOGO = "https://media.base44.com/images/public/6a65ccde323b932e9e9dc990/b4f7eec46_b088026ec_play-store-icon.png";

const slides = [
  {
    icon: HandCoins,
    title: "Friendly Loans, Simplified",
    points: [
      "SDL (Shubh Dahan Lakshmi) is India's friendly loan platform built on trust.",
      "Borrow the amount and repay on your salary date — no hidden charges.",
      "A community-driven approach where friends help friends meet urgent needs.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Why SDL is Beneficial",
    points: [
      "Transparent Payment System — borrow ₹1000, repay ₹1200 on payday.",
      "Your limit grows with good transaction history and timely repayments.",
      "Refer friends and earn 1% of their loan amount into your savings wallet.",
    ],
  },
  {
    icon: Users,
    title: "Built on Trust & Community",
    points: [
      "All about trust — backed by a verified community of borrowers and referrers.",
      "Secure KYC process with approval within 24 hours.",
      "Quick loan disbursement directly to your UPI within 24 hours of approval.",
    ],
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [showDownload, setShowDownload] = useState(false);
  const navigate = useNavigate();
  const slide = slides[step];
  const Icon = slide.icon;

  const next = () => {
    if (step < slides.length - 1) setStep(step + 1);
    else navigate("/login");
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8 relative overflow-hidden">
      <div className="absolute top-0 -left-20 w-64 h-64 rounded-full sdl-gradient opacity-10 blur-3xl" />
      <div className="absolute bottom-0 -right-20 w-72 h-72 rounded-full bg-sdl-orange opacity-10 blur-3xl" />

      <button onClick={() => setShowDownload(true)} className="absolute top-5 right-5 neu-btn h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium text-slate-600 z-20">
        <Download className="w-3.5 h-3.5" /> Download APK
      </button>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="neu-card-sm p-3 rounded-3xl neu-float">
            <img src={SDL_LOGO} alt="SDL" className="w-24 h-24 rounded-2xl object-cover" />
          </div>
        </div>

        {/* Slide card */}
        <div key={step} className="neu-card p-8 neu-slide-in">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full neu-card-sm flex items-center justify-center">
              <div className="w-14 h-14 rounded-full sdl-gradient flex items-center justify-center">
                <Icon className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-xl font-bold text-center sdl-gradient-text mb-5">{slide.title}</h2>
          <ul className="space-y-4">
            {slide.points.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full neu-inset-sm flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-sdl-orange" />
                </span>
                <span className="text-sm text-slate-600 leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === step ? "w-8 sdl-gradient" : "w-2 neu-inset-sm"}`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={back}
              className="neu-btn flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-slate-600 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            onClick={next}
            className="sdl-gradient flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-white text-sm font-semibold shadow-lg transition-transform active:scale-95"
          >
            {step === slides.length - 1 ? "Get Started" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          <Wallet className="w-3 h-3 inline mr-1" /> India's No.1 Friendly Loan
        </p>
      </div>

      {showDownload && <DownloadAppModal onClose={() => setShowDownload(false)} />}
    </div>
  );
}