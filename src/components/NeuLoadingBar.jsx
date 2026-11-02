import React from "react";

export default function NeuLoadingBar({ progress = 0, showLabel = true, className = "", height = "h-3" }) {
  const pct = Math.min(Math.max(progress, 0), 100);
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-slate-500 neu-embossed-text">
            {pct < 100 ? "Loading..." : "Complete"}
          </span>
          <span className="text-xs font-bold sdl-gradient-text">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={`neu-progress-track ${height}`}>
        <div className="neu-progress-fill h-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}