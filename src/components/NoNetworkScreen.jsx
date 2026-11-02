import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/lib/apiBase";

async function reachable() {
  try {
    await fetch(`${API_BASE_URL || ""}/?ping=${Date.now()}`, { method: "GET", cache: "no-store", mode: "no-cors" });
    return true;
  } catch {
    return false;
  }
}

export default function NoNetworkScreen({ onRetry }) {
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    setRetrying(true);
    await onRetry();
    setRetrying(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-8 bg-neu-bg">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="neu-card w-28 h-28 rounded-full flex items-center justify-center mb-6"
      >
        <motion.div
          animate={{ y: [0, -6, 0], rotate: [0, -4, 4, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <WifiOff className="w-12 h-12 text-sdl-orange" />
        </motion.div>
      </motion.div>

      <h2 className="text-lg font-bold text-slate-700">No internet connection</h2>
      <p className="text-sm text-slate-500 text-center mt-2 max-w-xs">
        Your phone is offline. Check your mobile data or Wi-Fi and try again.
      </p>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={retry}
        disabled={retrying}
        className="mt-7 h-12 px-8 rounded-2xl sdl-gradient text-white text-sm font-semibold flex items-center gap-2 shadow-lg disabled:opacity-70"
      >
        <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
        {retrying ? "Checking..." : "Try Again"}
      </motion.button>
    </div>
  );
}

export function NetworkGate({ children }) {
  const [offline, setOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Keep the app mounted underneath so an in-progress form is not lost.
  return (
    <>
      {children}
      {offline && (
        <NoNetworkScreen
          onRetry={async () => {
            const ok = await reachable();
            if (ok) setOffline(false);
          }}
        />
      )}
    </>
  );
}
