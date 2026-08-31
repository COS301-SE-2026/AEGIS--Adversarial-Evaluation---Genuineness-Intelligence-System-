"use client";

import { SessionExpiredBanner } from "@/components/auth/session-expired-banner";
import { useSessionTimeout } from "@/hooks/use-session-timeout";

export function SessionTimeoutGate() {
  useSessionTimeout();
  return <SessionExpiredBanner />;
}