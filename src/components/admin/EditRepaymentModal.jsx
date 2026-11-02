const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { formatINR, formatDate, isOverdue, daysOverdue, calcOverdue, payableTotal } from "@/lib/sdlUtils";
import { createNotification } from "@/lib/notifications";
import NeuInput from "@/components/NeuInput";
import { X, Loader2, Save, BadgePercent } from "lucide-react";

export default function EditRepaymentModal({ loan, settings, onClose, onSaved }) {
  const overdue = loan.status === "disbursed" && isOverdue(loan.due_date);
  const odDays = overdue ? daysOverdue(loan.due_date) : 0;
  const odCharge = overdue && !loan.overdue_waived
    ? calcOverdue(loan.amount, odDays, Number(settings?.overdue_daily_rate) || 1)
    : 0;
  const currentTotal = payableTotal(loan, settings);

  const [amount, setAmount] = useState(String(currentTotal));
  const [waive, setWaive] = useState(true);
  const [saving, setSaving] = useState(false);

  const waiver = Math.max(0, Math.round(currentTotal - (Number(amount) || 0)));

  const save = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const update = { repayment_amount: value };
      if (overdue) {
        update.overdue_waived = waive;
        update.waiver_amount = waive ? waiver : 0;
        if (waive && !loan.original_repayment_amount) {
          update.original_repayment_amount = loan.original_repayment_amount || loan.repayment_amount;
        }
      }
      await db.entities.LoanApplication.update(loan.id, update);
      try {
        await createNotification({
          user_id: loan.user_id,
          title: "Repayment Amount Updated",
          message: overdue && waive
            ? `Your repayment for loan ${loan.loan_id || ""} has been revised. Overdue charges are waived — total payable is now ${formatINR(value)}.`
            : `Your repayment amount for loan ${loan.loan_id || ""} is now ${formatINR(value)}, due on ${formatDate(loan.due_date)}.`,
          type: "loan",
          related_id: loan.id,
        });
      } catch (e) {}
      onSaved();
    } catch (e) {
      alert("Failed to update repayment amount");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">
            {overdue ? "Waive / Revise Amount" : "Change Repayment Amount"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="neu-inset rounded-2xl p-4 mb-4 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-slate-500">User</span><span className="font-semibold text-slate-700">{loan.user_name}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Loan ID</span><span className="font-mono text-xs text-slate-700">{loan.loan_id || "-"}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Loan Amount</span><span className="font-semibold text-slate-700">{formatINR(loan.amount)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Repayment</span><span className="font-semibold text-slate-700">{formatINR(loan.repayment_amount)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Due Date</span><span className="font-semibold text-slate-700">{formatDate(loan.due_date)}</span></div>
          {overdue && (
            <>
              <div className="flex justify-between text-sdl-red"><span>Overdue</span><span className="font-semibold">{odDays} day{odDays > 1 ? "s" : ""}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Overdue Charges</span><span className="font-semibold text-slate-700">{loan.overdue_waived && !odCharge ? "Waived" : formatINR(odCharge)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-semibold text-slate-700">Total Payable</span><span className="font-bold sdl-gradient-text">{formatINR(currentTotal)}</span></div>
            </>
          )}
        </div>

        <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">
          {overdue ? "New Total Payable (₹)" : "New Repayment Amount (₹)"}
        </label>
        <NeuInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />

        {overdue && (
          <>
            <button onClick={() => setWaive(!waive)}
              className={`mt-3 w-full h-11 rounded-xl flex items-center justify-between px-4 text-xs font-semibold transition-colors ${waive ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>
              <span className="flex items-center gap-2"><BadgePercent className="w-4 h-4" /> Waive overdue charges</span>
              <span>{waive ? "ON" : "OFF"}</span>
            </button>
            <p className="text-[10px] text-slate-400 mt-2 ml-1">
              {waive
                ? `No further overdue charges will be added. The borrower pays only the new total${waiver > 0 ? ` (waiver ${formatINR(waiver)})` : ""}.`
                : "Overdue charges keep adding up daily on top of the new amount."}
            </p>
          </>
        )}

        {!overdue && (
          <p className="text-[10px] text-slate-400 mt-2 ml-1">The user is notified and reminders use this amount from the next run.</p>
        )}

        <button onClick={save} disabled={saving}
          className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Amount</>}
        </button>
      </div>
    </div>
  );
}