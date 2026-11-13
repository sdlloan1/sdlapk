import React, { useEffect, useState } from "react";
import { Smartphone, Globe, Monitor, Maximize, Languages, Tag } from "lucide-react";
import { getAppVersion, getDeviceInfo } from "@/lib/deviceInfo";

// Shows the customer what app version, browser and device they are using.
export default function AppInfoCard() {
  const [info] = useState(getDeviceInfo);
  const [version, setVersion] = useState(info.native ? "" : "Web app");

  useEffect(() => {
    if (!info.native) return;
    let alive = true;
    getAppVersion().then((v) => alive && setVersion(v || "-"));
    return () => { alive = false; };
  }, [info.native]);

  const rows = [
    { icon: Tag, label: "App version", value: version || "Checking..." },
    { icon: Smartphone, label: "Platform", value: info.platform },
    { icon: Globe, label: "Browser", value: info.browser },
    { icon: Monitor, label: "Operating system", value: info.os },
    { icon: Maximize, label: "Screen", value: info.screen },
    { icon: Languages, label: "Language · timezone", value: info.language },
  ];

  return (
    <div className="neu-card p-5">
      <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-sdl-orange" /> App &amp; Device Info
      </h3>
      <div className="space-y-2">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="neu-inset-sm rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full neu-card-sm flex items-center justify-center">
              <Icon className="w-4 h-4 text-sdl-orange" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400">{label}</p>
              <p className="text-sm font-medium text-slate-700 truncate">{value || "-"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
