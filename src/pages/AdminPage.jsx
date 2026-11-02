import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import NeuAppLoader from "@/components/NeuAppLoader";
import Admin from "@/pages/Admin";

export default function AdminPage() {
  const { user, checkUserAuth } = useAuth();

  if (!user) return <NeuAppLoader label="Loading admin panel..." />;

  if (user.role !== "admin") return <Navigate to="/" replace />;

  return <Admin user={user} onUserUpdate={checkUserAuth} />;
}