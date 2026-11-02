import React from "react";
import { BadgeCheck } from "lucide-react";

export default function VerifiedLenderBadge({ settings }) {
  const name = settings?.lender_name;
  if (!name) return null;
  return (
    <div className="inline-flex items-center gap-1.5 neu-inset-sm rounded-full px-3 py-1.5">
      <span className="text-[11px] text-slate-500">SDL member:</span>
      <span className="text-xs font-semibold text-slate-700">{name}</span>
      <BadgeCheck className="w-3.5 h-3.5 text-sdl-green" />
      <span className="text-[10px] font-bold text-sdl-green">Verified</span>
    </div>
  );
}