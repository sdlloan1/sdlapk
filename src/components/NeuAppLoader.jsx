import React from "react";
import { SDL_LOGO } from "@/lib/sdlUtils";

export default function NeuAppLoader({ label = "Loading..." }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-neu-bg z-50">
      <div className="neu-float mb-6">
        <div className="w-20 h-20 rounded-2xl overflow-hidden sdl-glow">
          <img src={SDL_LOGO} alt="SDL" className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="neu-progress-track w-48 h-2 mb-4 overflow-hidden">
        <div className="neu-progress-fill-indeterminate" />
      </div>
      <p className="text-xs text-slate-400 font-medium neu-embossed-text">{label}</p>
    </div>
  );
}