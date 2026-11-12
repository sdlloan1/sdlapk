import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import NeuAuthLayout from "@/components/NeuAuthLayout";
import NeuInput from "@/components/NeuInput";
import PasswordInput from "@/components/PasswordInput";
import NeuButton from "@/components/NeuButton";
import { Mail, Lock, UserPlus, KeyRound } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) localStorage.setItem("sdl_ref_mobile", ref);
    } catch (e) {}
    base44.auth.isAuthenticated().then((authed) => {
      if (authed) window.location.href = "/";
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("exist") || msg.includes("verified")) {
        try {
          await base44.auth.loginViaEmailPassword(email, password);
          window.location.href = "/";
          return;
        } catch (loginErr) {
          setError("Account already exists. Please log in instead.");
          return;
        }
      }
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = "/";
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("already verified") || msg.includes("verified")) {
        try {
          await base44.auth.loginViaEmailPassword(email, password);
          window.location.href = "/";
          return;
        } catch (loginErr) {
          setError("Account already verified. Please log in.");
          return;
        }
      }
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  if (showOtp) {
    return (
      <NeuAuthLayout
        title="Verify Your Email"
        subtitle={`We sent a 6-digit code to ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-sdl-red text-sm text-center neu-inset-sm">{error}</div>
        )}
        <div className="mb-6">
          <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Enter OTP</label>
          <NeuInput
            type="text"
            icon={KeyRound}
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit code"
            className="text-center tracking-[0.5em] text-lg font-semibold"
            autoFocus
          />
        </div>
        <NeuButton variant="gradient" loading={loading} onClick={handleVerify} disabled={otpCode.length < 6} className="w-full h-12 rounded-2xl">
          Verify & Continue
        </NeuButton>
        <p className="text-center text-sm text-slate-500 mt-4">
          Didn't receive the code?{" "}
          <button onClick={handleResend} className="sdl-gradient-text font-semibold">Resend</button>
        </p>
      </NeuAuthLayout>
    );
  }

  return (
    <NeuAuthLayout
      title="Create Account"
      subtitle="Sign up to get started with SDL"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="sdl-gradient-text font-semibold">Log in</Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-sdl-red text-sm text-center neu-inset-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Email</label>
          <NeuInput
            type="email"
            icon={Mail}
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Password</label>
          <PasswordInput
            icon={Lock}
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Confirm Password</label>
          <PasswordInput
            icon={Lock}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <NeuButton type="submit" variant="gradient" loading={loading} className="w-full h-12 rounded-2xl mt-2">
          {!loading && <UserPlus className="w-4 h-4" />}
          {loading ? "Creating account..." : "Create Account"}
        </NeuButton>
      </form>
    </NeuAuthLayout>
  );
}