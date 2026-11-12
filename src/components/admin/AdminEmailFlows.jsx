import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, ToggleLeft, ToggleRight, Save, Loader2, CheckCircle2 } from "lucide-react";
import PromotionalEmailComposer from "@/components/admin/PromotionalEmailComposer";

export default function AdminEmailFlows() {
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeUserCount, setActiveUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingToggles, setSavingToggles] = useState(false);
  const [toggleSaved, setToggleSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, u] = await Promise.all([
          base44.entities.AppSettings.list(),
          base44.entities.User.filter({ role: "user" }),
        ]);
        setSettings(s[0]);
        setUsers(u);
        setActiveUserCount(u.filter((x) => x.account_status === "active").length);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, []);

  const toggleFlow = (field) => {
    setSettings({ ...settings, [field]: !settings[field] });
    setToggleSaved(false);
  };

  const saveToggles = async () => {
    setSavingToggles(true);
    try {
      await base44.entities.AppSettings.update(settings.id, {
        loan_email_enabled: settings.loan_email_enabled !== false,
        closure_email_enabled: settings.closure_email_enabled !== false,
      });
      setToggleSaved(true);
      setTimeout(() => setToggleSaved(false), 3000);
    } catch (e) {
      alert("Failed to save settings");
    } finally {
      setSavingToggles(false);
    }
  };

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;

  const flows = [
    {
      key: "loan_email_enabled",
      title: "Loan Approval Email",
      desc: "Sent automatically when a loan is disbursed. Includes loan amount, repayment details, due date, and a link to the loan agreement.",
      color: "sdl-gradient",
    },
    {
      key: "closure_email_enabled",
      title: "Loan Closure Email",
      desc: "Sent automatically when a loan repayment is confirmed. Includes closure confirmation and credit limit update notification.",
      color: "bg-sdl-green",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Existing Email Flows */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-sdl-orange" />
          <h3 className="text-sm font-bold text-slate-600">Existing Email Flows</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {flows.map((f) => {
            const enabled = settings[f.key] !== false;
            return (
              <div key={f.key} className="neu-card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={`w-9 h-9 rounded-full ${f.color} flex items-center justify-center shrink-0`}>
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <button onClick={() => toggleFlow(f.key)} className="shrink-0">
                    {enabled ? (
                      <ToggleRight className="w-10 h-10 text-sdl-green" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-300" />
                    )}
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">{f.title}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
                <p className={`text-[10px] font-semibold mt-2 ${enabled ? "text-sdl-green" : "text-slate-400"}`}>
                  {enabled ? "● Enabled" : "○ Disabled"}
                </p>
              </div>
            );
          })}
        </div>
        <button
          onClick={saveToggles}
          disabled={savingToggles}
          className="sdl-gradient mt-3 h-11 px-5 rounded-xl text-white text-xs font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50"
        >
          {savingToggles ? <Loader2 className="w-4 h-4 animate-spin" /> : toggleSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {toggleSaved ? "Saved!" : "Save Toggle Settings"}
        </button>
      </div>

      {/* Promotional Email Composer */}
      <PromotionalEmailComposer
        users={users}
        activeUserCount={activeUserCount}
      />
    </div>
  );
}