const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { SDL_LOGO } from "@/lib/sdlUtils";
import { logoutToLogin } from "@/lib/logout";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminLoans from "@/components/admin/AdminLoans";
import AdminWallets from "@/components/admin/AdminWallets";
import AdminTickets from "@/components/admin/AdminTickets";
import AdminTeam from "@/components/admin/AdminTeam";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminPartners from "@/components/admin/AdminPartners";
import AdminMessages from "@/components/admin/AdminMessages";
import AdminEmailFlows from "@/components/admin/AdminEmailFlows";
import AdminReminders from "@/components/admin/AdminReminders";
import AdminTraffic from "@/components/admin/AdminTraffic";
import { LayoutDashboard, Users, HandCoins, Wallet, MessageSquare, MessageCircle, UsersRound, Settings, LogOut, Handshake, Mail, Bell, Activity } from "lucide-react";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users / KYC", icon: Users },
  { id: "loans", label: "Loans", icon: HandCoins },
  { id: "partners", label: "Partners", icon: Handshake },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "tickets", label: "Tickets", icon: MessageSquare },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "emails", label: "Email Flows", icon: Mail },
  { id: "traffic", label: "App Traffic", icon: Activity },
  { id: "team", label: "Team", icon: UsersRound },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Admin({ user }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");
  const [badges, setBadges] = useState({});

  const loadBadges = async () => {
    try {
      const [pendingUsers, pendingDisb, pendingVerif, pendingWallets, openTickets, pReqs, pDeps, pWds] = await Promise.all([
        db.entities.User.filter({ kyc_status: "pending" }).catch(() => []),
        db.entities.LoanApplication.count({ status: "pending_disbursement" }).catch(() => 0),
        db.entities.LoanApplication.count({ status: "pending_verification" }).catch(() => 0),
        db.entities.WalletTransaction.count({ status: "pending" }).catch(() => 0),
        db.entities.SupportTicket.count({ status: "open" }).catch(() => 0),
        db.entities.PartnerRequest.count({ status: "pending" }).catch(() => 0),
        db.entities.PartnerDeposit.count({ status: "pending" }).catch(() => 0),
        db.entities.PartnerWithdrawal.count({ status: "pending" }).catch(() => 0),
      ]);
      setBadges({
        users: pendingUsers.length,
        loans: pendingDisb + pendingVerif,
        wallets: pendingWallets,
        tickets: openTickets,
        partners: pReqs + pDeps + pWds,
      });
    } catch (e) {}
  };

  useEffect(() => { loadBadges(); }, []);

  return (
    <div className="min-h-screen admin-panel">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={SDL_LOGO} alt="SDL" className="w-12 h-12 rounded-xl object-cover" />
            <div>
              <p className="text-sm font-bold text-slate-800 leading-none">SDL Admin</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">{user.display_name || user.full_name || user.email}</p>
            </div>
          </div>
          <button onClick={() => logoutToLogin(navigate)} className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-sdl-red transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[73px] z-20 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              const count = badges[t.id];
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${active ? "sdl-gradient text-white shadow-md" : "admin-tab text-slate-600"}`}>
                  <Icon className="w-4 h-4 shrink-0" /> {t.label}
                  {count > 0 && (
                    <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${active ? "bg-white/25 text-white" : "sdl-gradient text-white"}`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-5">
        {tab === "dashboard" && <AdminDashboard />}
        {tab === "users" && <AdminUsers />}
        {tab === "loans" && <AdminLoans />}
        {tab === "partners" && <AdminPartners />}
        {tab === "wallets" && <AdminWallets />}
        {tab === "tickets" && <AdminTickets />}
        {tab === "messages" && <AdminMessages />}
        {tab === "reminders" && <AdminReminders />}
        {tab === "emails" && <AdminEmailFlows />}
        {tab === "traffic" && <AdminTraffic />}
        {tab === "team" && <AdminTeam />}
        {tab === "settings" && <AdminSettings />}
      </div>
    </div>
  );
}