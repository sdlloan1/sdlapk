import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Navigate } from "react-router-dom";
import PartnerInfo from "@/components/partner/PartnerInfo";
import PartnerRequestForm from "@/components/partner/PartnerRequestForm";
import { PartnerPending, PartnerRejected } from "@/components/partner/PartnerStatusPages";
import PartnerDashboard from "@/components/partner/PartnerDashboard";

export default function PartnerPage() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("main");

  const loadData = async () => {
    const [u, s] = await Promise.all([
      base44.auth.me(),
      base44.entities.AppSettings.list(),
    ]);
    setUser(u);
    setSettings(s[0]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-sdl-orange rounded-full animate-spin" /></div>;
  if (!user || user.role === "admin") return <Navigate to="/" replace />;

  if (user.partner_status === "approved") return <PartnerDashboard user={user} settings={settings} onUserUpdate={loadData} />;
  if (user.partner_status === "pending") return <PartnerPending />;
  if (user.partner_status === "rejected") return <PartnerRejected user={user} />;

  // partner_status is "none" or undefined
  if (view === "request") return <PartnerRequestForm user={user} onSubmitted={loadData} />;
  return <PartnerInfo user={user} onContinue={() => setView("request")} />;
}