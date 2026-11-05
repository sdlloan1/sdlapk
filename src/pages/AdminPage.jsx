import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import NeuAppLoader from "@/components/NeuAppLoader";
import NeuButton from "@/components/NeuButton";
import { ShieldAlert } from "lucide-react";
import Admin from "@/pages/Admin";

export default function AdminPage({ adminOnly = false }) {
  const { user, checkUserAuth, logout } = useAuth();

  if (!user) return <NeuAppLoader label="Loading admin panel..." />;

  if (user.role !== "admin") {
    // In the admin APK nothing else is reachable, so a non-admin account gets an
    // explicit dead end instead of being forwarded into the customer app.
    if (!adminOnly) return <Navigate to="/" replace />;
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center bg-[#E8EAF2]">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-sdl-red" />
        </div>
        <p className="text-lg font-semibold text-slate-800">Admins only</p>
        <p className="text-sm text-slate-500">This app can only be used by administrator accounts.</p>
        <NeuButton variant="gradient" className="mt-2 px-6" onClick={() => logout()}>
          Sign out
        </NeuButton>
      </div>
    );
  }

  return <Admin user={user} onUserUpdate={checkUserAuth} />;
}