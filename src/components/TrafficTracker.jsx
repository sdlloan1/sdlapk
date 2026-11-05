import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/appTraffic";

// Records one AppEvent per page per session so the admin traffic dashboard has
// real usage numbers from both the website and the Android WebView.
export default function TrafficTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith("/sdlsubr1250noida")) return; // admin activity is not app traffic
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
