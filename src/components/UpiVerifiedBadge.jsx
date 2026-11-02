import React from "react";
import { BadgeCheck } from "lucide-react";

export default function UpiVerifiedBadge({ settings, name }) {
  const displayName = name || settings?.admin_upi_name || "SDL Shubh Dhan Lakshmi";
  return (
    <div className="inline-flex items-center gap-1.5 neu-inset-sm rounded-full px-3 py-1.5">
      <span className="text-[11px] text-slate-500">Pay to</span>
      <span className="text-xs font-semibold text-slate-700">{displayName}</span>
      <BadgeCheck className="w-3.5 h-3.5 text-sdl-green" />
      <span className="text-[10px] font-bold text-sdl-green">Verified</span>
    </div>
  );
}