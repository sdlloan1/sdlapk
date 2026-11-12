import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import NeuAuthLayout from "@/components/NeuAuthLayout";
import NeuInput from "@/components/NeuInput";
import NeuButton from "@/components/NeuButton";
import { Lock, AlertTriangle } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <NeuAuthLayout
        title="Invalid Reset Link"
        subtitle="This password reset link is missing or invalid"
        footer={
          <Link to="/forgot-password" className="sdl-gradient-text font-semibold">Request a new link</Link>
        }
      >
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full neu-card-sm mb-4">
            <AlertTriangle className="w-8 h-8 text-sdl-red" />
          </div>
          <p className="text-sm text-slate-600">
            The link you used appears to be incomplete. Please request a new password reset email.
          </p>
        </div>
      </NeuAuthLayout>
    );
  }

  return (
    <NeuAuthLayout title="New Password" subtitle="Enter your new password below">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-sdl-red text-sm text-center neu-inset-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">New Password</label>
          <NeuInput
            type="password"
            icon={Lock}
            autoComplete="new-password"
            autoFocus
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Confirm Password</label>
          <NeuInput
            type="password"
            icon={Lock}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <NeuButton type="submit" variant="gradient" loading={loading} className="w-full h-12 rounded-2xl">
          Reset Password
        </NeuButton>
      </form>
    </NeuAuthLayout>
  );
}