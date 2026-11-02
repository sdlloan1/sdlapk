import React, { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { X, PartyPopper } from "lucide-react";

export default function ConfettiPopup({ title, message, onClose }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ["#FF6B35", "#FF4757", "#FFB74D", "#27AE60"];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/30 backdrop-blur-sm">
      <div className="neu-card p-8 max-w-sm w-full text-center neu-pop relative">
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400">
          <X className="w-4 h-4" />
        </button>
        <div className="w-16 h-16 rounded-full sdl-gradient mx-auto mb-4 flex items-center justify-center">
          <PartyPopper className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-lg font-bold sdl-gradient-text mb-2">{title}</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-5">{message}</p>
        <button onClick={onClose} className="sdl-gradient w-full h-11 rounded-2xl text-white font-semibold text-sm shadow-lg active:scale-95 transition-transform">
          Awesome!
        </button>
      </div>
    </div>
  );
}