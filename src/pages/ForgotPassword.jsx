import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import NeuAuthLayout from "@/components/NeuAuthLayout";
import NeuInput from "@/components/NeuInput";
import NeuButton from "@/components/NeuButton";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <NeuAuthLayout
      title="Reset Password"
      subtitle="We'll send you a link to reset it"
      footer={
        <Link to="/login" className="sdl-gradient-text font-semibold inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Back to log in
        </Link>
      }
    >
      {sent ? (
        <div className="text-center py-6 neu-fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full neu-card-sm mb-4">
            <CheckCircle2 className="w-8 h-8 text-sdl-green" />
          </div>
          <p className="text-sm text-slate-600">
            If an account exists with that email, you'll receive a password reset link shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 ml-1">Email Address</label>
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
          <NeuButton type="submit" variant="gradient" loading={loading} className="w-full h-12 rounded-2xl">
            Send Reset Link
          </NeuButton>
        </form>
      )}
    </NeuAuthLayout>
  );
}