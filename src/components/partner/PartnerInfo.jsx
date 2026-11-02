import React from "react";
import { useNavigate } from "react-router-dom";
import { SDL_LOGO } from "@/lib/sdlUtils";
import { HandCoins, TrendingUp, Lock, Wallet, ArrowRight, Percent } from "lucide-react";

export default function PartnerInfo({ user, onContinue }) {
  const navigate = useNavigate();

  const benefits = [
    { icon: Wallet, title: "Invest ₹5,000 – ₹1 Lakh", desc: "Choose an amount that works for you. Your capital is used to fund SDL borrower loans." },
    { icon: Percent, title: "Earn 10% of Loan Amount", desc: "Whenever your money funds a loan, you earn 10% of the loan amount as profit. Example: ₹1,000 loan → you earn ₹100 when the borrower repays." },
    { icon: TrendingUp, title: "0.5% Daily Overdue Bonus", desc: "If the borrower doesn't repay on time, you earn an extra 0.5% per day on the loan amount until full repayment." },
    { icon: Lock, title: "6-Month Lock & Withdrawal", desc: "Your invested amount is locked for 6 months. Profits can be withdrawn every 6 months." },
  ];

  return (
    <div className="min-h-screen px-4 py-6 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate("/")} className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center text-slate-500">
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
        <img src={SDL_LOGO} alt="SDL" className="w-10 h-10 rounded-xl object-cover" />
        <h1 className="text-lg font-bold sdl-gradient-text">SDL Partner</h1>
      </div>

      <div className="neu-card p-6 text-center mb-4">
        <div className="w-16 h-16 rounded-full sdl-gradient mx-auto flex items-center justify-center mb-3">
          <HandCoins className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-lg font-bold text-slate-700 mb-1">Become an SDL Partner</h2>
        <p className="text-xs text-slate-500">Invest your money, earn 10% profit on every loan funded, and grow your savings with SDL.</p>
      </div>

      <div className="space-y-3 mb-6">
        {benefits.map((b, i) => {
          const Icon = b.icon;
          return (
            <div key={i} className="neu-card p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full sdl-gradient flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700">{b.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={onContinue} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}