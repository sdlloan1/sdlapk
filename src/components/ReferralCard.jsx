import React, { useState } from "react";
import { formatINR, formatDate, getShareableDomain } from "@/lib/sdlUtils";
import {
  Users, Share2, MessageCircle, Instagram, Copy, Check,
  ChevronDown, ChevronUp, Gift, Phone
} from "lucide-react";

export default function ReferralCard({ user, friends = [], referralLoans = [], settings }) {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const refPct = settings?.referral_percentage || 1;
  const PAID_STATUSES = ["disbursed", "pending_verification", "repaid", "overdue"];
  const paidLoans = referralLoans.filter((l) => PAID_STATUSES.includes(l.status));
  const totalEarning = paidLoans.reduce((s, l) => s + Math.round((l.amount * refPct) / 100), 0);
  const credited = paidLoans
    .filter((l) => l.status === "repaid")
    .reduce((s, l) => s + Math.round((l.amount * refPct) / 100), 0);
  const pending = totalEarning - credited;

  const refLink = `${getShareableDomain(settings)}/register?ref=${user.mobile_number || ""}`;
  const shareText = `🪔 Join SDL (Shubh Dhan Lakshmi) - India's friendly salary-backed loan platform!\n\nUse my referral:\nName: ${user.display_name || user.full_name}\nMobile: ${user.mobile_number}\n\n${refLink}\n\nBorrow and repay on your salary date. Earn from referrals!`;
  const shareUrl = encodeURIComponent(shareText);
  const copyLink = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareInstagram = async () => {
    await navigator.clipboard.writeText(shareText).catch(() => {});
    window.open("https://www.instagram.com/", "_blank");
  };

  // Merge friends (with/without loans) so referred sign-ups show even before a loan.
  const loansByFriend = {};
  referralLoans.forEach((l) => {
    const key = l.friendMobile || l.friendName || "_";
    if (!loansByFriend[key]) loansByFriend[key] = { name: l.friendName, mobile: l.friendMobile, pic: l.friendPic, loans: [] };
    loansByFriend[key].loans.push(l);
  });
  const friendRows = [
    ...friends.map((f) => ({ name: f.name, mobile: f.mobile, pic: f.pic, kyc: f.kyc_status, loans: loansByFriend[f.mobile]?.loans || [] })),
    ...Object.values(loansByFriend).filter((g) => !friends.some((f) => f.mobile === g.mobile && g.mobile)),
  ];

  return (
    <div className="neu-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full sdl-gradient flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-600">Referral Earnings</span>
        </div>
        <button onClick={() => setShowShare((s) => !s)} className="neu-btn h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="neu-inset-sm rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-slate-400">Total</p>
          <p className="text-sm font-bold sdl-gradient-text">{formatINR(totalEarning)}</p>
        </div>
        <div className="neu-inset-sm rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-slate-400">Credited</p>
          <p className="text-sm font-bold text-sdl-green">{formatINR(credited)}</p>
        </div>
        <div className="neu-inset-sm rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-slate-400">Pending</p>
          <p className="text-sm font-bold text-amber-500">{formatINR(pending)}</p>
        </div>
      </div>

      {showShare && (
        <div className="neu-inset rounded-2xl p-3 mb-3 grid grid-cols-3 gap-2 neu-pop">
          <a href={`https://wa.me/?text=${shareUrl}`} target="_blank" rel="noreferrer" className="neu-card-sm p-3 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition-transform">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center"><MessageCircle className="w-4 h-4 text-green-600" /></div>
            <span className="text-[10px] font-medium text-slate-600">WhatsApp</span>
          </a>
          <button onClick={shareInstagram} className="neu-card-sm p-3 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition-transform">
            <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center"><Instagram className="w-4 h-4 text-pink-600" /></div>
            <span className="text-[10px] font-medium text-slate-600">Instagram</span>
          </button>
          <button onClick={copyLink} className="neu-card-sm p-3 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition-transform">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
              {copied ? <Check className="w-4 h-4 text-sdl-green" /> : <Copy className="w-4 h-4 text-sdl-orange" />}
            </div>
            <span className="text-[10px] font-medium text-slate-600">{copied ? "Copied!" : "Copy Link"}</span>
          </button>
        </div>
      )}

      {friendRows.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-2">No friends referred yet. Share your number to earn {refPct}% of their loans!</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Referred Friends</span>
            <span className="text-[10px] text-slate-400">{friendRows.length} friend{friendRows.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-2">
            {friendRows.slice(0, expanded ? 99 : 3).map((fr, i) => (
              <FriendRow key={i} fr={fr} refPct={refPct} />
            ))}
          </div>
          {friendRows.length > 3 && (
            <button onClick={() => setExpanded((e) => !e)} className="w-full mt-2 neu-btn h-9 rounded-xl flex items-center justify-center gap-1 text-xs font-medium text-slate-500">
              {expanded ? <>Show less <ChevronUp className="w-3.5 h-3.5" /></> : <>View all {friendRows.length} <ChevronDown className="w-3.5 h-3.5" /></>}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function FriendRow({ fr, refPct }) {
  const PAID_STATUSES = ["disbursed", "pending_verification", "repaid", "overdue"];
  const paidLoans = fr.loans.filter((l) => PAID_STATUSES.includes(l.status));
  const earning = paidLoans.reduce((s, l) => s + Math.round((l.amount * refPct) / 100), 0);
  return (
    <div className="neu-inset-sm rounded-xl p-3">
      <div className="flex items-center gap-2">
        {fr.pic ? (
          <img src={fr.pic} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full sdl-gradient flex items-center justify-center text-white text-xs font-bold">
            {fr.name?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-700 truncate">{fr.name}</p>
          <p className="text-[10px] text-slate-400 flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{fr.mobile}</p>
        </div>
        {paidLoans.length > 0 ? (
          <span className="text-xs font-bold text-sdl-green flex items-center gap-0.5"><Gift className="w-3 h-3" />{formatINR(earning)}</span>
        ) : fr.kyc === "approved" ? (
          <span className="text-[10px] text-sdl-green px-2 py-0.5 rounded-full bg-green-100 flex items-center gap-1"><Check className="w-2.5 h-2.5" />KYC Done</span>
        ) : (
          <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-100">Referred</span>
        )}
      </div>
      {paidLoans.map((l) => {
        const loanEarning = Math.round((l.amount * refPct) / 100);
        const isCredited = l.status === "repaid";
        return (
          <div key={l.id} className="mt-2 pt-2 border-t border-slate-200/70 grid grid-cols-2 gap-1 text-[10px] text-slate-500">
            <span>Principal: <span className="font-semibold text-slate-600">{formatINR(l.amount)}</span></span>
            <span>Total Repay: <span className="font-semibold text-slate-600">{formatINR(l.repayment_amount)}</span></span>
            <span>Repayment Date: <span className="font-semibold text-slate-600">{formatDate(l.due_date)}</span></span>
            <span className="text-sdl-green font-semibold">1%: {formatINR(loanEarning)} ({isCredited ? "Credited" : "On repay"})</span>
          </div>
        );
      })}
    </div>
  );
}