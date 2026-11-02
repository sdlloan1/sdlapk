import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import { formatINR } from "@/lib/sdlUtils";

export default function ChargeInfoButton({ principal, settings }) {
  const [open, setOpen] = useState(false);

  const interestRate = Number(settings?.interest_rate) || 3;
  const portalRate = Number(settings?.portal_charge_percentage) || 8;
  const processingRate = Number(settings?.processing_fee_percentage) || 8;
  const savingsRate = Number(settings?.savings_percentage) || 1;

  const interestAmount = Math.round((principal * interestRate) / 100);
  const portalCharge = Math.round((principal * portalRate) / 100);
  const processingFee = Math.round((principal * processingRate) / 100);
  const savingsWallet = Math.round((principal * savingsRate) / 100);

  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true); }} className="inline-flex items-center justify-center w-5 h-5 rounded-full neu-inset-sm text-slate-400 hover:text-sdl-orange shrink-0">
        <Info className="w-3 h-3" />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="neu-card p-6 w-full max-w-sm neu-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold sdl-gradient-text">Charge Breakdown</h3>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="neu-inset rounded-2xl p-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">Principal</p>
                <p className="text-[11px] text-slate-400">The amount you borrow and receive to your UPI.</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{formatINR(principal)}</p>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <p className="text-xs font-semibold text-slate-600 mb-1">Interest</p>
                <p className="text-[11px] text-slate-400">Payable on repayment date.</p>
                <p className="text-sm font-bold text-sdl-orange mt-0.5">{formatINR(interestAmount)}</p>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <p className="text-xs font-semibold text-slate-600 mb-1">Portal Charge</p>
                <p className="text-[11px] text-slate-400">Platform service fee.</p>
                <p className="text-sm font-bold text-sdl-orange mt-0.5">{formatINR(portalCharge)}</p>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <p className="text-xs font-semibold text-slate-600 mb-1">Processing Fee</p>
                <p className="text-[11px] text-slate-400">Loan processing and verification fee.</p>
                <p className="text-sm font-bold text-sdl-orange mt-0.5">{formatINR(processingFee)}</p>
              </div>
              {savingsWallet > 0 && (
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Savings Wallet (on repayment)</p>
                  <p className="text-[11px] text-slate-400">Credited back to your savings wallet when you repay on time.</p>
                  <p className="text-sm font-bold text-sdl-green mt-0.5">{formatINR(savingsWallet)}</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}