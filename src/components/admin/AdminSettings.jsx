const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import NeuInput from "@/components/NeuInput";
import { Settings, Save, Loader2, X, ScrollText, FileText, Mail, Shield, Info, CreditCard, Smartphone, Bell } from "lucide-react";
import AgreementStyleEditor from "@/components/admin/AgreementStyleEditor";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("content");

  useEffect(() => {
    db.entities.AppSettings.list().then((s) => { setSettings(s[0]); setLoading(false); });
  }, []);

  const update = (field, value) => setSettings({ ...settings, [field]: value });

  const save = async () => {
    setSaving(true);
    try {
      const { id, ...data } = settings;
      await db.entities.AppSettings.update(id, data);
      alert("Settings saved!");
    } catch (e) { alert("Failed"); } finally { setSaving(false); }
  };

  if (loading) return <div className="neu-card p-6 text-center text-sm text-slate-400">Loading...</div>;
  if (!settings) return <div className="neu-card p-6 text-center text-sm text-slate-400">No settings record found.</div>;

  const tabs = [
    { id: "content", label: "Content", icon: ScrollText },
    { id: "agreement", label: "Agreement", icon: FileText },
    { id: "emails", label: "Emails", icon: Mail },
    { id: "reminders", label: "Reminders", icon: Bell },
    { id: "config", label: "Config", icon: Settings },
    { id: "app", label: "App", icon: Smartphone },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 h-10 rounded-xl text-xs font-medium ${tab === t.id ? "sdl-gradient text-white" : "neu-btn text-slate-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="sticky top-[126px] z-20 py-2 bg-[#F8FAFC] border-b border-slate-200">
        <button disabled={saving} onClick={save} className="sdl-gradient w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </div>

      {tab === "content" && (
        <div className="space-y-4">
          <Field label="Terms & Conditions" icon={ScrollText} value={settings.terms_conditions} onChange={(v) => update("terms_conditions", v)} rows={8} />
          <Field label="Loan Agreement Template" icon={FileText} value={settings.agreement_template} onChange={(v) => update("agreement_template", v)} rows={8} />
          <Field label="Privacy Policy" icon={Shield} value={settings.privacy_policy} onChange={(v) => update("privacy_policy", v)} rows={5} />
          <Field label="About Us" icon={Info} value={settings.about_us} onChange={(v) => update("about_us", v)} rows={4} />
        </div>
      )}

      {tab === "agreement" && (
        <AgreementStyleEditor value={settings.agreement_style} onChange={(v) => update("agreement_style", v)} />
      )}

      {tab === "emails" && (
        <div className="space-y-4">
          <div className="neu-card p-5 flex items-center gap-4">
            <img src="/logo.png" alt="SDL Logo" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-700">SDL Branded Email Template</p>
              <p className="text-xs text-slate-500 mt-1">Loan approval and closure emails are sent using the branded SDL template, with this logo in the header and footer. Triggered by admins from the Loans tab.</p>
            </div>
          </div>
          <div className="neu-inset-sm rounded-xl p-3">
            <p className="text-xs text-slate-500">Each email auto-fills the borrower's name, loan amount, repayment amount, due date, and a link to the loan agreement.</p>
          </div>
        </div>
      )}

      {tab === "reminders" && (
        <div className="space-y-4">
          <div className="neu-card p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Automatic Reminder Emails</p>
              <p className="text-xs text-slate-500 mt-1">When on, the five repayment reminders are emailed to borrowers every day between 8 AM and 10 AM.</p>
            </div>
            <button onClick={() => update("reminder_email_enabled", !(settings.reminder_email_enabled !== false))}
              className={`w-14 h-8 rounded-full shrink-0 transition-colors ${settings.reminder_email_enabled !== false ? "sdl-gradient" : "bg-slate-300"}`}>
              <span className={`block w-6 h-6 rounded-full bg-white shadow transition-transform ${settings.reminder_email_enabled !== false ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="neu-card p-4">
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Website Link In Reminders</label>
            <NeuInput value={settings.reminder_website_url || ""} onChange={(e) => update("reminder_website_url", e.target.value)} placeholder="https://shubhdhanlakshmi.in" />
            <p className="text-[10px] text-slate-400 mt-2">This link appears at the bottom of every reminder email and WhatsApp message. Change it any time.</p>
          </div>
          <div className="neu-inset-sm rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-600 mb-2">Reminder Schedule (per loan)</p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>1st — 2 days before the due date</li>
              <li>2nd — 1 day before the due date</li>
              <li>3rd — on the due date</li>
              <li>4th — 1 day overdue</li>
              <li>5th — 2 days overdue</li>
            </ul>
            <p className="text-[10px] text-slate-400 mt-3">Overdue reminders include the overdue days, overdue charges and the total payable now. Copy-ready WhatsApp text for all five is in the Reminders tab.</p>
          </div>
        </div>
      )}

      {tab === "config" && (
        <div className="space-y-4">
          <div className="neu-card p-4">
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Shareable App Domain</label>
            <NeuInput value={settings.shareable_domain} onChange={(e) => update("shareable_domain", e.target.value)} placeholder="shubhdhanlakshmi.com" />
            <p className="text-[10px] text-slate-400 mt-2">This domain is used for referral links and is included as the app link in all WhatsApp messages (e.g. <span className="font-mono">shubhdhanlakshmi.com</span>). Only change the host.</p>
          </div>
          <div className="neu-card p-4">
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">KYC Attempts Allowed Per Day</label>
            <NeuInput type="number" min={1} value={settings.kyc_daily_limit ?? 3} onChange={(e) => update("kyc_daily_limit", Number(e.target.value))} />
            <p className="text-[10px] text-slate-400 mt-2">After this many KYC submissions in a day the user is blocked until the next day. You can also set a custom unblock date on any user's profile.</p>
          </div>
          <div className="neu-card p-4">
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Admin UPI ID</label>
            <NeuInput value={settings.admin_upi_id} onChange={(e) => update("admin_upi_id", e.target.value)} />
          </div>
          <div className="neu-card p-4">
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Admin UPI Name</label>
            <NeuInput value={settings.admin_upi_name} onChange={(e) => update("admin_upi_name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <NumField label="Interest %" value={settings.interest_rate} onChange={(v) => update("interest_rate", v)} />
            <NumField label="Portal Charge %" value={settings.portal_charge_percentage} onChange={(v) => update("portal_charge_percentage", v)} />
            <NumField label="Processing Fee %" value={settings.processing_fee_percentage} onChange={(v) => update("processing_fee_percentage", v)} />
            <NumField label="Savings %" value={settings.savings_percentage} onChange={(v) => update("savings_percentage", v)} />
            <NumField label="Referral %" value={settings.referral_percentage} onChange={(v) => update("referral_percentage", v)} />
            <NumField label="Overdue Daily %" value={settings.overdue_daily_rate} onChange={(v) => update("overdue_daily_rate", v)} />
          </div>
          <div className="neu-card p-4">
            <p className="text-xs font-semibold text-slate-600 mb-3">SDL Partner Profit Settings</p>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Partner Profit %" value={settings.partner_profit_percentage} onChange={(v) => update("partner_profit_percentage", v)} />
              <NumField label="Partner Overdue Profit %" value={settings.partner_overdue_profit_percentage} onChange={(v) => update("partner_overdue_profit_percentage", v)} />
            </div>
          </div>
          <div className="neu-card p-4">
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Lender Name</label>
            <NeuInput value={settings.lender_name} onChange={(e) => update("lender_name", e.target.value)} />
          </div>
          <div className="neu-card p-4">
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Lender PAN</label>
            <NeuInput value={settings.lender_pan} onChange={(e) => update("lender_pan", e.target.value)} />
          </div>
          <div className="neu-card p-4">
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Lender Email</label>
            <NeuInput value={settings.lender_email} onChange={(e) => update("lender_email", e.target.value)} />
          </div>
          <Field label="Lender Address" icon={CreditCard} value={settings.lender_address} onChange={(v) => update("lender_address", v)} rows={3} />
        </div>
      )}

      {tab === "app" && (
        <div className="space-y-4">
          <ApkUpload label="Android APK" value={settings.apk_android_url} onChange={(v) => update("apk_android_url", v)} />
          <ApkUpload label="iOS App File" value={settings.apk_ios_url} onChange={(v) => update("apk_ios_url", v)} />
          <div className="neu-inset-sm rounded-xl p-3">
            <p className="text-xs text-slate-500">Users (not admins) see a "Download App" option. Leave the Android link empty to use the app's built-in APK at /download/SDL - Shubh Dhan Lakshmi.apk; iOS shows "Coming Soon" until a link is set.</p>
          </div>
        </div>
      )}

    </div>
  );
}

function Field({ label, icon: Icon, value, onChange, rows = 4 }) {
  return (
    <div className="neu-card p-4">
      <label className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2 ml-1">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </label>
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={rows} className="neu-input w-full p-4 text-sm text-slate-700 resize-none" />
    </div>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <div className="neu-card p-3">
      <label className="block text-[10px] font-medium text-slate-500 mb-1 text-center">{label}</label>
      <NeuInput type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="text-center" />
    </div>
  );
}

function ApkUpload({ label, value, onChange }) {
  return (
    <div className="neu-card p-4">
      <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">{label} — Direct Download Link</label>
      <NeuInput value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="https://example.com/app.apk" />
      <p className="text-[10px] text-slate-400 mt-2">Paste a direct download URL for this platform's app file (e.g. Google Drive direct link or your own host).</p>
    </div>
  );
}