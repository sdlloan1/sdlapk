import React, { useState } from "react";
import NeuInput from "@/components/NeuInput";
import { FileText, Eye } from "lucide-react";

const DEFAULTS = {
  font: "helvetica",
  bodySize: 9,
  headingSize: 11,
  subheadingSize: 9,
  lineHeight: 4.2,
  margin: 18,
  headerAlign: "center",
  bodyAlign: "left",
  tableAlign: "left",
  primaryColor: "#FF4B2B",
  textColor: "#1a1a1a",
  subColor: "#555555",
  importantColor: "#CC2200",
  paragraphSpacing: 5,
  sectionSpacing: 7,
};

function parseStyle(str) {
  try { return { ...DEFAULTS, ...JSON.parse(str || "{}") }; } catch { return { ...DEFAULTS }; }
}

export default function AgreementStyleEditor({ value, onChange }) {
  const [style, setStyle] = useState(() => parseStyle(value));

  const update = (key, val) => {
    const next = { ...style, [key]: val };
    setStyle(next);
    onChange(JSON.stringify(next));
  };

  const reset = () => {
    setStyle({ ...DEFAULTS });
    onChange(JSON.stringify(DEFAULTS));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sdl-orange" />
          <span className="text-sm font-semibold text-slate-700">Agreement PDF Style</span>
        </div>
        <button onClick={reset} className="text-xs text-sdl-red font-medium neu-btn px-3 py-1.5 rounded-xl">Reset to Default</button>
      </div>

      {/* Fonts & Sizes */}
      <div className="neu-card p-4">
        <p className="text-xs font-semibold text-slate-500 mb-3">Typography</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Font Family</label>
            <select value={style.font} onChange={e => update("font", e.target.value)} className="neu-input w-full h-10 px-3 text-sm text-slate-700 rounded-xl">
              <option value="helvetica">Helvetica</option>
              <option value="times">Times New Roman</option>
              <option value="courier">Courier</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Body Size (pt)</label>
            <NeuInput type="number" step="0.5" min="7" max="14" value={style.bodySize} onChange={e => update("bodySize", Number(e.target.value))} />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Heading Size (pt)</label>
            <NeuInput type="number" step="0.5" min="9" max="18" value={style.headingSize} onChange={e => update("headingSize", Number(e.target.value))} />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Subheading Size (pt)</label>
            <NeuInput type="number" step="0.5" min="7" max="14" value={style.subheadingSize} onChange={e => update("subheadingSize", Number(e.target.value))} />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Line Height (mm)</label>
            <NeuInput type="number" step="0.1" min="3" max="8" value={style.lineHeight} onChange={e => update("lineHeight", Number(e.target.value))} />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Page Margin (mm)</label>
            <NeuInput type="number" step="1" min="10" max="30" value={style.margin} onChange={e => update("margin", Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Alignment */}
      <div className="neu-card p-4">
        <p className="text-xs font-semibold text-slate-500 mb-3">Alignment</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "headerAlign", label: "Header Align" },
            { key: "bodyAlign", label: "Body Text Align" },
            { key: "tableAlign", label: "Table Align" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-[10px] text-slate-400 block mb-1">{label}</label>
              <select value={style[key]} onChange={e => update(key, e.target.value)} className="neu-input w-full h-10 px-3 text-sm text-slate-700 rounded-xl">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Spacing */}
      <div className="neu-card p-4">
        <p className="text-xs font-semibold text-slate-500 mb-3">Spacing (mm)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Paragraph Spacing</label>
            <NeuInput type="number" step="0.5" min="2" max="15" value={style.paragraphSpacing} onChange={e => update("paragraphSpacing", Number(e.target.value))} />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Section Spacing</label>
            <NeuInput type="number" step="0.5" min="3" max="20" value={style.sectionSpacing} onChange={e => update("sectionSpacing", Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="neu-card p-4">
        <p className="text-xs font-semibold text-slate-500 mb-3">Colors</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "primaryColor", label: "Primary / Accent" },
            { key: "textColor", label: "Main Text" },
            { key: "subColor", label: "Subtitle Text" },
            { key: "importantColor", label: "Important / Alert" },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <label className="text-[10px] text-slate-400 text-center">{label}</label>
              <input
                type="color"
                value={style[key]}
                onChange={e => update(key, e.target.value)}
                className="w-12 h-10 rounded-xl border-0 cursor-pointer"
                style={{ padding: "2px" }}
              />
              <span className="text-[9px] font-mono text-slate-400">{style[key]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="neu-inset-sm rounded-xl p-3">
        <p className="text-xs text-slate-500">
          These settings control the font, size, spacing, alignment, and colors of the auto-generated loan agreement PDF. Changes take effect on the next loan agreement generated. Save settings after editing.
        </p>
      </div>
    </div>
  );
}