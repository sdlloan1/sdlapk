const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef, useCallback } from "react";

import { Loader2, X, Check } from "lucide-react";

const V = 280;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export default function PhotoAdjustModal({ file, onClose, onSaved }) {
  const [img, setImg] = useState(null);
  const [src, setSrc] = useState("");
  const [iw, setIw] = useState(0);
  const [ih, setIh] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const pointers = useRef(new Map());
  const drag = useRef({ active: false, lastX: 0, lastY: 0 });
  const pinch = useRef({ dist: 0, startZoom: 1, cx: 0, cy: 0 });
  const viewportRef = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setIw(image.naturalWidth);
      setIh(image.naturalHeight);
      const cover = Math.max(V / image.naturalWidth, V / image.naturalHeight);
      setOffset({
        x: (V - image.naturalWidth * cover) / 2,
        y: (V - image.naturalHeight * cover) / 2,
      });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const coverScale = iw && ih ? Math.max(V / iw, V / ih) : 1;
  const scale = coverScale * zoom;

  const clampOffset = useCallback((ox, oy, s) => {
    const minX = V - iw * s;
    const minY = V - ih * s;
    return {
      x: Math.min(0, Math.max(minX, ox)),
      y: Math.min(0, Math.max(minY, oy)),
    };
  }, [iw, ih]);

  const zoomAt = useCallback((newZoom, cx, cy) => {
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
    const oldScale = coverScale * zoom;
    const newScale = coverScale * z;
    const imgX = (cx - offset.x) / oldScale;
    const imgY = (cy - offset.y) / oldScale;
    const newOx = cx - imgX * newScale;
    const newOy = cy - imgY * newScale;
    setZoom(z);
    setOffset(clampOffset(newOx, newOy, newScale));
  }, [coverScale, zoom, offset, clampOffset]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      drag.current = { active: true, lastX: e.clientX, lastY: e.clientY };
    } else if (pointers.current.size === 2) {
      drag.current.active = false;
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const rect = viewportRef.current.getBoundingClientRect();
      pinch.current = {
        dist,
        startZoom: zoom,
        cx: ((pts[0].x + pts[1].x) / 2 - rect.left) * (V / rect.width),
        cy: ((pts[0].y + pts[1].y) / 2 - rect.top) * (V / rect.height),
      };
    }
  };

  const onPointerMove = (e) => {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinch.current.dist > 0) {
        const ratio = dist / pinch.current.dist;
        zoomAt(pinch.current.startZoom * ratio, pinch.current.cx, pinch.current.cy);
      }
    } else if (drag.current.active) {
      const dx = e.clientX - drag.current.lastX;
      const dy = e.clientY - drag.current.lastY;
      drag.current.lastX = e.clientX;
      drag.current.lastY = e.clientY;
      setOffset((o) => clampOffset(o.x + dx, o.y + dy, scale));
    }
  };

  const endPointer = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current.dist = 0;
    if (pointers.current.size === 0) drag.current.active = false;
  };

  const onWheel = (e) => {
    e.preventDefault();
    const rect = viewportRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (V / rect.width);
    const cy = (e.clientY - rect.top) * (V / rect.height);
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    zoomAt(zoom * factor, cx, cy);
  };

  const save = async () => {
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = V;
      canvas.height = V;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, V, V);
      if (img) ctx.drawImage(img, offset.x, offset.y, iw * scale, ih * scale);
      const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.92));
      const f = new File([blob], `profile_${Date.now()}.jpg`, { type: "image/jpeg" });
      const { file_url } = await db.integrations.Core.UploadFile({ file: f });
      onSaved(file_url);
    } catch (err) {
      alert("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
      <div className="neu-card p-6 w-full max-w-sm neu-pop">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold sdl-gradient-text">Crop Photo</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full neu-inset-sm flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <div
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onPointerLeave={endPointer}
          onWheel={onWheel}
          className="relative mx-auto mb-3 rounded-2xl overflow-hidden neu-inset select-none"
          style={{ width: V, height: V, touchAction: "none", background: "#0f172a" }}
        >
          {!img || !src ? (
            <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 text-sdl-orange animate-spin" /></div>
          ) : (
            <img
              src={src}
              alt="crop"
              draggable={false}
              style={{ position: "absolute", width: iw * scale, height: ih * scale, left: offset.x, top: offset.y, userSelect: "none", pointerEvents: "none" }}
            />
          )}
          <div className="absolute inset-0 pointer-events-none border-2 border-white/40 rounded-2xl" />
        </div>

        <p className="text-[11px] text-slate-400 text-center mb-4">Drag to adjust • Pinch or scroll to zoom</p>

        <button onClick={save} disabled={saving || !img} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save Photo</>}
        </button>
      </div>
    </div>
  );
}