"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getRole, isAuthenticated } from "@/lib/auth";

type AccessGateProps = {
  allowedRole: "CANDIDATE" | "RECRUITER";
  children: React.ReactNode;
};

export function AccessGate({ allowedRole, children }: Readonly<AccessGateProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("aegis_token") : null;
    const role = getRole();

    const isAllowed =
      Boolean(token) &&
      isAuthenticated() &&
      role === allowedRole;

    if (!isAllowed) {
      router.replace("/auth?mode=login");
      return;
    }

    setCheckingAccess(false);
  }, [allowedRole, pathname, router]);

  if (checkingAccess) {
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