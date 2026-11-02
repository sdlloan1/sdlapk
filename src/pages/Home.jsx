import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import NeuAppLoader from "@/components/NeuAppLoader";
import TermsModal from "@/components/TermsModal";
import KycOnboarding from "@/components/KycOnboarding";
import UserAppShell from "@/components/UserAppShell";

export default function Home() {
  const { user, checkUserAuth } = useAuth();

  if (!user) return <NeuAppLoader label="Loading your account..." />;

  if (user?.role === "admin") return <Navigate to="/sdlsubr1250noida" replace />;

  if (!user?.terms_accepted)
    return <TermsModal user={user} onAccept={checkUserAuth} />;

  if (!user?.registration_complete)
    return <KycOnboarding user={user} onComplete={checkUserAuth} />;

  return <UserAppShell user={user} onUserUpdate={checkUserAuth} />;
}