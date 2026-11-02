import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock, XCircle, ArrowRight } from "lucide-react";
import { SDL_LOGO } from "@/lib/sdlUtils";

export function PartnerPending() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen px-4 py-6 max-w-md mx-auto flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate("/")} className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center text-slate-500">
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
        <img src={SDL_LOGO} alt="SDL" className="w-10 h-10 rounded-xl object-cover" />
        <h1 className="text-lg font-bold sdl-gradient-text">SDL Partner</h1>
      </div>
      <div className="neu-card p-8 text-center">
        <div className="w-16 h-16 rounded-full neu-card-sm mx-auto mb-4 flex items-center justify-center">
          <Clock className="w-8 h-8 text-sdl-orange" />
        </div>
        <h2 className="text-lg font-bold text-slate-700 mb-2">Request Under Review</h2>
        <p className="text-sm text-slate-500">Your SDL Partner request is being reviewed. You will get an update within 24 hours.</p>
      </div>
    </div>
  );
}

export function PartnerRejected({ user }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen px-4 py-6 max-w-md mx-auto flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate("/")} className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center text-slate-500">
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
        <img src={SDL_LOGO} alt="SDL" className="w-10 h-10 rounded-xl object-cover" />
        <h1 className="text-lg font-bold sdl-gradient-text">SDL Partner</h1>
      </div>
      <div className="neu-card p-8 text-center">
        <div className="w-16 h-16 rounded-full neu-card-sm mx-auto mb-4 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-sdl-red" />
        </div>
        <h2 className="text-lg font-bold text-slate-700 mb-2">You Are Not Eligible Right Now</h2>
        <p className="text-sm text-slate-500 mb-4">We're sorry, but your SDL Partner request was not approved at this time.</p>
        {user?.rejection_reason && (
          <div className="neu-inset-sm rounded-xl p-3 mb-4">
            <p className="text-xs text-slate-400">Reason</p>
            <p className="text-sm text-slate-600 mt-1">{user.rejection_reason}</p>
          </div>
        )}
        <p className="text-xs text-slate-400">You may reapply in the future.</p>
      </div>
    </div>
  );
}