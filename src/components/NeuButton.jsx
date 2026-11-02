import React from "react";
import { Loader2 } from "lucide-react";

export default function NeuButton({ children, loading, variant = "raised", className = "", ...props }) {
  const base = "px-6 py-3 font-semibold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2";
  const variants = {
    raised: "neu-btn text-slate-700",
    gradient: "sdl-gradient text-white shadow-md hover:shadow-lg",
  };
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}