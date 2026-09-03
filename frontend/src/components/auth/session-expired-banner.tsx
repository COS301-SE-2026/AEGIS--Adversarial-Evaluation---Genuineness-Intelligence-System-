"use client";

import { useEffect, useState } from "react";

export function SessionExpiredBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string }>;
      setMessage(customEvent.detail?.message ?? "Your session has expired. Redirecting to login...");
    };

    window.addEventListener("session-expired", handler);

    return () => {
      window.removeEventListener("session-expired", handler);
    };
  }, []);

  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded border border-red-500 bg-red-950/90 px-4 py-3 text-sm text-white shadow-lg">
      {message}
    </div>
  );
}