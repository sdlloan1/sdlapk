const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from "react";

import { useAuth } from "@/lib/AuthContext";
import { HandCoins, Repeat2, Wallet as WalletIcon, UserCircle, Bell } from "lucide-react";
import LoanPage from "@/pages/app/LoanPage";
import RepaymentPage from "@/pages/app/RepaymentPage";
import WalletPage from "@/pages/app/WalletPage";
import ProfilePage from "@/pages/app/ProfilePage";
import InstallPrompt from "@/components/InstallPrompt";
import NotificationsModal from "@/components/NotificationsModal";
import NeuAppLoader from "@/components/NeuAppLoader";
import { SDL_LOGO } from "@/lib/sdlUtils";
import { initPushNotifications, isNative, pushNewNotifications } from "@/lib/pushNotifications";
import { motion } from "framer-motion";

const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

const tabs = [
  { id: "loan", label: "Loan", icon: HandCoins },
  { id: "repayment", label: "Repayment", icon: Repeat2 },
  { id: "wallet", label: "Wallet", icon: WalletIcon },
  { id: "profile", label: "Profile", icon: UserCircle },
];

export default function UserAppShell({ user, onUserUpdate }) {
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("loan");
  const [showNotif, setShowNotif] = useState(false);
  const [unread, setUnread] = useState(0);
  const [settings, setSettings] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    db.entities.AppSettings.list().then((s) => setSettings(s[0]));
  }, []);

  // Auto-logout after 10 minutes inactivity
  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        db.auth.logout("/login");
      }, INACTIVITY_LIMIT);
    };
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const loadUnread = async () => {
    try {
      const list = await db.entities.Notification.filter({ user_id: user.id, read: false }, "-created_date", 50);
      setUnread(list.length);
      // On Android, mirror new records as system notifications.
      pushNewNotifications(user.id, list);
    } catch (e) {}
  };

  // Android notification channel + permission, then poll so new records reach the phone.
  useEffect(() => {
    if (!isNative()) return;
    initPushNotifications();
    const poll = setInterval(loadUnread, 60000);
    return () => clearInterval(poll);
  }, [user.id]);
  // Refresh user profile + notification count every time the user switches tabs
  useEffect(() => {
    refreshUser();
    loadUnread();
  }, [activeTab]);

  if (!settings) return <NeuAppLoader label="Preparing your dashboard..." />;

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto relative">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between sticky top-0 z-20 bg-neu-bg/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img src={SDL_LOGO} alt="SDL" className="w-12 h-12 rounded-xl object-cover" />
          <div>
            <p className="text-sm font-bold sdl-gradient-text leading-none">SDL</p>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5">Friendly Loan</p>
          </div>
        </div>
        <button
          onClick={() => setShowNotif(true)}
          className="neu-btn w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 relative"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full sdl-gradient text-white text-[9px] font-bold flex items-center justify-center">{unread}</span>
          )}
        </button>
      </div>

      {/* Content — all pages stay mounted; hidden when inactive for instant tab switching */}
      <div className="px-4">
        <InstallPrompt />
        <motion.div
          animate={{ opacity: activeTab === "loan" ? 1 : 0, y: activeTab === "loan" ? 0 : 10 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={activeTab === "loan" ? "" : "hidden"}
        >
          <LoanPage user={user} onUserUpdate={onUserUpdate} settings={settings} active={activeTab === "loan"} />
        </motion.div>
        <motion.div
          animate={{ opacity: activeTab === "repayment" ? 1 : 0, y: activeTab === "repayment" ? 0 : 10 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={activeTab === "repayment" ? "" : "hidden"}
        >
          <RepaymentPage user={user} settings={settings} active={activeTab === "repayment"} />
        </motion.div>
        <motion.div
          animate={{ opacity: activeTab === "wallet" ? 1 : 0, y: activeTab === "wallet" ? 0 : 10 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={activeTab === "wallet" ? "" : "hidden"}
        >
          <WalletPage user={user} settings={settings} active={activeTab === "wallet"} />
        </motion.div>
        <motion.div
          animate={{ opacity: activeTab === "profile" ? 1 : 0, y: activeTab === "profile" ? 0 : 10 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={activeTab === "profile" ? "" : "hidden"}
        >
          <ProfilePage user={user} onUserUpdate={onUserUpdate} settings={settings} active={activeTab === "profile"} />
        </motion.div>
      </div>

      {showNotif && <NotificationsModal user={user} onClose={() => { setShowNotif(false); loadUnread(); }} />}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-4 z-30">
        <div className="neu-card px-2 py-2 rounded-3xl flex justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all"
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${active ? "sdl-gradient shadow-lg" : "neu-inset-sm"}`}>
                  <Icon className={`w-5 h-5 ${active ? "text-white" : "text-slate-400"}`} />
                </div>
                <span className={`text-[10px] font-medium ${active ? "sdl-gradient-text" : "text-slate-400"}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}