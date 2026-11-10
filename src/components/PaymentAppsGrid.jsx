import React from "react";
import { upiAppDeepLink } from "@/lib/sdlUtils";
import { parsePaymentApps } from "@/lib/notifications";
import VerifiedLenderBadge from "@/components/VerifiedLenderBadge";

export default function PaymentAppsGrid({ settings, amount, note = "SDL Payment" }) {
  const apps = parsePaymentApps(settings?.payment_apps);
  if (!apps.length) return null;
  const upiId = settings?.admin_upi_id || "9310601973@ibl";
  const upiName = settings?.admin_upi_name || "SDL Shubh Dhan Lakshmi";

  return (
    <div>
      <div className="flex justify-center mb-2">
        <VerifiedLenderBadge settings={settings} />
      </div>
      <p className="text-[11px] text-slate-400 mb-2">Pay via UPI app</p>
      <div className="grid grid-cols-4 gap-2">
        {apps.map((app) => (
          <a
            key={app.package}
            href={upiAppDeepLink(app.package, upiId, amount, upiName, note)}
            className="neu-card-sm p-2 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition-transform"
          >
            {app.icon_url ? (
              <img src={app.icon_url} alt={app.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: app.color || "#FF6600" }}
              >
                {app.name?.[0]}
              </div>
            )}
            <span className="text-[9px] font-medium text-slate-600 truncate w-full text-center">{app.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}