"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getRole, isAuthenticated } from "@/lib/auth";

type AccessGateProps = {
  allowedRole: "CANDIDATE" | "RECRUITER";
  children: React.ReactNode;
};

export function AccessGate({ allowedRole, children }: Readonly<AccessGateProps>) {
  const router = useRouter();
  const pathname = usePathname();

  const isAllowed = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const token = localStorage.getItem("aegis_token");
    const role = getRole();

    return Boolean(token) && isAuthenticated() && role === allowedRole;
  }, [allowedRole, pathname]);

  useEffect(() => {
    if (!isAllowed) {
      router.replace("/auth?mode=login");
    }
  }, [isAllowed, router]);

  if (typeof window === "undefined") {
    return null;
  }

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-white-smoke">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-default-border border-t-system-red" />
          <p className="font-jetbrains text-xs uppercase tracking-[0.25em] text-white-smoke/60">
            Checking access...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}