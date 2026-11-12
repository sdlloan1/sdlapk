const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { Link } from "react-router-dom";

import NeuAuthLayout from "@/components/NeuAuthLayout";
import NeuInput from "@/components/NeuInput";
import PasswordInput from "@/components/PasswordInput";
import NeuButton from "@/components/NeuButton";
import { Shield, Mail, Lock, LogIn, AlertTriangle } from "lucide-react";

// In the admin APK the customer login does not exist, so the link back to it
// would only bounce to this same screen.
const ADMIN_APP = import.meta.env.VITE_ADMIN_APP === "true";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await db.auth.loginViaEmailPassword(email, password);
      window.location.href = `${import.meta.env.BASE_URL}sdlsubr1250noida`;
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <NeuAuthLayout
      title="Admin Access"
      subtitle="Shubh Dhan Lakshmi Admin Panel"
      footer={
        ADMIN_APP ? null : (
          <Link to="/login" className="sdl-gradient-text font-semibold">← Back to user login</Link>
        )
      }
    >
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-2xl sdl-gradient flex items-center justify-center sdl-glow">
          <Shield className="w-8 h-8 text-white" />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-sdl-red text-sm text-center neu-inset-sm flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Admin Email</label>
          <NeuInput
            type="email"
            icon={Mail}
            autoComplete="email"
            autoFocus
            placeholder="admin@sdl.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Password</label>
          <PasswordInput
            icon={Lock}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <NeuButton type="submit" variant="gradient" loading={loading} className="w-full h-12 rounded-2xl mt-2">
          {!loading && <LogIn className="w-4 h-4" />}
          {loading ? "Verifying..." : "Admin Login"}
        </NeuButton>
        <div className="text-center">
          <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-sdl-orange font-medium">Forgot password?</Link>
        </div>
      </form>
    </NeuAuthLayout>
  );
}