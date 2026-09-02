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
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("aegis_token");
    const role = getRole();

    const allowed =
      Boolean(token) && isAuthenticated() && role === allowedRole;

    setIsAllowed(allowed);
    setIsHydrated(true);

    if (!allowed) {
      router.replace("/auth?mode=login");
    }
  }, [allowedRole, pathname, router]);

  if (!isHydrated) {
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