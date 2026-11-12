import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { formatINR, formatDate } from "@/lib/sdlUtils";
import NeuInput from "@/components/NeuInput";
import { CheckCircle2, XCircle, X, ArrowDownLeft, ArrowUpRight, Loader2, Plus, ScanLine } from "lucide-react";
import { createNotification } from "@/lib/notifications";

export default function AdminWallets() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [action, setAction] = useState(null);
  const [adjust, setAdjust] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    const t = await base44.entities.WalletTransaction.list("-created_date", 200);
    setTxns(t);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  let filtered = filter === "pending" ? txns.filter((t) => t.status === "pending") : txns.filter((t) => t.status === "completed");
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((t) =>
      (t.description || "").toLowerCase().includes(q) ||
      (t.type || "").toLowerCase().includes(q)
    );
  }

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by type or description..."
          className="neu-input w-full h-11 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400"
        />
      </div>
      <div className="flex gap-2 items-center">
        <button onClick={() => setFilter("pending")} className={`flex-1 h-10 rounded-xl text-xs font-medium ${filter === "pending" ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>Pending ({txns.filter((t) => t.status === "pending").length})</button>
        <button onClick={() => setFilter("completed")} className={`flex-1 h-10 rounded-xl text-xs font-medium ${filter === "completed" ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>Completed</button>
        <button onClick={() => setAdjust(true)} className="sdl-gradient h-10 px-3 rounded-xl text-white text-xs font-semibold flex items-center gap-1 shrink-0">
          <Plus className="w-4 h-4" /> Adjust
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="neu-card p-8 text-center text-sm text-slate-400">No transactions.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="neu-card p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${t.type === "withdrawal" ? "bg-red-100" : "bg-green-100"}`}>
                    {t.type === "withdrawal" ? <ArrowUpRight className="w-4 h-4 text-sdl-red" /> : <ArrowDownLeft className="w-4 h-4 text-sdl-green" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 capitalize truncate">{t.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-slate-400">{formatDate(t.created_date)}</p>
                  </div>
                </div>
                <span className="text-sm font-bold sdl-gradient-text shrink-0 whitespace-nowrap">{formatINR(t.amount)}</span>
              </div>
              {t.description && <p className="text-xs text-slate-500 mb-2">{t.description}</p>}
              {t.screenshot_url && (
                <a href={t.screenshot_url} target="_blank" rel="noreferrer" className="block mb-2">
                  <img src={t.screenshot_url} alt="Proof" className="w-full h-24 rounded-lg object-cover" />
                </a>
              )}
              {t.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => setAction({ txn: t, type: "approve" })} className="sdl-green bg-sdl-green flex-1 h-10 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Approve
                  </button>
                  <button onClick={() => setAction({ txn: t, type: "reject" })} className="bg-sdl-red flex-1 h-10 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1">
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                </div>
              )}
              {t.status === "rejected" && t.admin_reason && (
                <p className="text-xs text-sdl-red mt-1">Reason: {t.admin_reason}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {action && <WalletActionModal action={action} onClose={() => setAction(null)} onDone={() => { setAction(null); loadData(); }} />}
      {adjust && <AdjustWalletModal onClose={() => setAdjust(false)} onDone={() => { setAdjust(false); loadData(); }} />}
    </div>
  );
}

function WalletActionModal({ action, onClose, onDone }) {
  const { txn, type } = action;
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const isApprove = type === "approve";

  const submit = async () => {
    setLoading(true);
    try {
      const data = { status: isApprove ? "completed" : "rejected", processed_date: new Date().toISOString() };
      if (!isApprove) data.admin_reason = reason;
      await base44.entities.WalletTransaction.update(txn.id, data);
      let nTitle = "Wallet Update", nMsg = "";
      if (isApprove) {
        if (txn.type === "deposit") { nTitle = "Deposit Approved"; nMsg = `Your wallet deposit of ${formatINR(txn.amount)} has been approved.`; }
        else if (txn.type === "withdrawal") { nTitle = "Withdrawal Approved"; nMsg = `Your withdrawal of ${formatINR(txn.amount)} has been approved and sent to your UPI.`; }
        else { nTitle = "Wallet Updated"; nMsg = `${formatINR(txn.amount)} credited to your wallet.`; }
      } else {
        nTitle = "Withdrawal Rejected"; nMsg = `Your withdrawal of ${formatINR(txn.amount)} was rejected${reason ? ": " + reason : ""}.`;
      }
      await createNotification({ user_id: txn.user_id, title: nTitle, message: nMsg, type: "wallet", related_id: txn.id });
      onDone();
    } catch (e) { alert("Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">{isApprove ? "Verify Transaction" : "Reject Transaction"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="neu-inset rounded-2xl p-4 mb-4 text-sm">
          <p><span className="text-slate-500">Type:</span> <span className="font-semibold capitalize">{txn.type.replace(/_/g, " ")}</span></p>
          <p><span className="text-slate-500">Amount:</span> <span className="font-semibold">{formatINR(txn.amount)}</span></p>
        </div>
        {!isApprove && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Reason for rejection</label>
            <NeuInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why rejected?" />
          </div>
        )}
        <button disabled={loading || (!isApprove && !reason)} onClick={submit}
          className={`w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${isApprove ? "sdl-green bg-sdl-green" : "bg-sdl-red"}`}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isApprove ? "Confirm" : "Reject"}
        </button>
      </div>
    </div>
  );
}

function AdjustWalletModal({ onClose, onDone }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.entities.User.list("-created_date", 300).then((list) => setUsers(list.filter((u) => u.role !== "admin"))).catch(() => {});
  }, []);

  const submit = async () => {
    if (!userId) { alert("Select a user"); return; }
    if (!amount || Number(amount) <= 0) { alert("Enter a valid amount"); return; }
    setLoading(true);
    try {
      await base44.entities.WalletTransaction.create({
        user_id: userId,
        type: "admin_adjustment",
        amount: Number(amount),
        status: "completed",
        description: reason.trim() || "Admin adjustment",
        processed_date: new Date().toISOString(),
      });
      await createNotification({
        user_id: userId,
        title: "Wallet Updated",
        message: `${formatINR(Number(amount))} added to your wallet${reason.trim() ? ": " + reason.trim() : ""}.`,
        type: "wallet",
      });
      onDone();
    } catch (e) { alert("Failed: " + (e.message || "error")); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-md neu-pop">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">Adjust Wallet</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Select User</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className="neu-input w-full h-12 px-4 text-sm text-slate-700">
              <option value="">Choose a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name || "Incomplete"} ({u.mobile_number})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Amount to Add (₹)</label>
            <NeuInput type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Reason</label>
            <NeuInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why adding this amount?" />
          </div>
          <button disabled={loading} onClick={submit} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add to Wallet</>}
          </button>
        </div>
      </div>
    </div>
  );
}