import React from "react";

export default function NeuInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
      )}
      <input
        {...props}
        className={`neu-input w-full h-12 px-4 text-sm text-slate-700 placeholder:text-slate-400 ${Icon ? "pl-11" : ""} ${props.className || ""}`}
      />
    </div>
  );
}