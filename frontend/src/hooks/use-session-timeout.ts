import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { isTokenExpired, logout } from "@/lib/auth";

const INACTIVITY_MS = 15 * 60 * 1000;
const SESSION_BANNER_DELAY_MS = 5 * 1000;

export function useSessionTimeout() {
  const router = useRouter();
  const timeoutRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startTimer = () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("aegis_token");
    const isAuthPage =
      window.location.pathname === "/auth" ||
      window.location.pathname.startsWith("/auth");

    if (!token || isAuthPage) {
      clearTimer();
      return;
    }

    clearTimer();

    timeoutRef.current = window.setTimeout(() => {

      if (isTokenExpired()) {
        logout();
        return;
      }

      const message =
        "Your session has expired due to inactivity. Redirecting to login...";

      window.dispatchEvent(new CustomEvent("session-expired", { detail: { message } }));

      setTimeout(() => {
        logout();
      }, SESSION_BANNER_DELAY_MS);
    }, INACTIVITY_MS);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    const handleActivity = () => {
      if (!localStorage.getItem("aegis_token")) {
        return;
      }

      if (window.location.pathname.startsWith("/auth")) {
        return;
      }

      startTimer();
    };

    events.forEach((event) => window.addEventListener(event, handleActivity));

    startTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimer();
    };
  }, [router]);
}