import React from "react";

export default function NeuPageLoader() {
  return (
    <div className="space-y-4 pb-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-1">
        <div className="neu-skeleton w-5 h-5 rounded-lg" />
        <div className="neu-skeleton h-5 w-32 rounded-lg" />
      </div>
      <div className="neu-card p-6 space-y-4">
        <div className="neu-skeleton h-28 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="neu-skeleton h-16 rounded-2xl" />
          <div className="neu-skeleton h-16 rounded-2xl" />
        </div>
      </div>
      <div className="neu-card p-5 space-y-3">
        <div className="neu-skeleton h-4 w-40 rounded-lg" />
        <div className="neu-skeleton h-12 rounded-2xl" />
        <div className="neu-skeleton h-12 rounded-2xl" />
      </div>
    </div>
  );
}