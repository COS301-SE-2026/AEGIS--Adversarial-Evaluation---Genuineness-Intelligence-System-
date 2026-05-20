"use client"
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const role = searchParams.get("role");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      localStorage.setItem("aegis_token", token);
      localStorage.setItem("aegis_role", role ?? "");

      if (role === "RECRUITER") {
        router.replace("/assessments");
      } else if (role === "CANDIDATE") {
        router.replace("/assessment");
      } else {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router, searchParams]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="font-ibm-plex text-default-text">Signing you in...</p>
    </main>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p className="font-ibm-plex text-default-text">Signing you in...</p>
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
