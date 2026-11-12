import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import NeuInput from "@/components/NeuInput";
import { MapPin, Building2, Loader2 } from "lucide-react";

export default function AddressFields({ value = {}, onChange }) {
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");

  const handlePinChange = async (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    onChange("pincode", val);
    setPinError("");
    if (val.length === 6) {
      setPinLoading(true);
      try {
        const response = await base44.functions.invoke("lookupPincode", { pincode: val });
        if (response.data?.city) {
          onChange("city", response.data.city);
          onChange("state", response.data.state);
        } else {
          setPinError("Could not auto-fill. Please enter manually.");
        }
      } catch (err) {
        setPinError("Could not auto-fill. Please enter manually.");
      }
      setPinLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Address Line 1 (House no., Building)</label>
        <NeuInput icon={MapPin} placeholder="House no., Building name" value={value.address_line1 || ""} onChange={(e) => onChange("address_line1", e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Address Line 2 (Area, Landmark)</label>
        <NeuInput placeholder="Area, Landmark" value={value.address_line2 || ""} onChange={(e) => onChange("address_line2", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">PIN Code</label>
          <div className="relative">
            <NeuInput type="tel" maxLength={6} placeholder="6-digit PIN" value={value.pincode || ""} onChange={handlePinChange} />
            {pinLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sdl-orange animate-spin" />}
          </div>
          {pinError && <p className="text-[10px] text-sdl-red mt-1 ml-1">{pinError}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">City / District</label>
          <NeuInput icon={Building2} placeholder="Auto-filled" value={value.city || ""} onChange={(e) => onChange("city", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">State</label>
        <NeuInput placeholder="Auto-filled" value={value.state || ""} onChange={(e) => onChange("state", e.target.value)} />
      </div>
    </div>
  );
}