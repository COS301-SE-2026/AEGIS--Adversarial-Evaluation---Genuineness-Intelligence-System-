"use client"

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AuthForm from "@/components/admin/ui/input/auth-form";

function AuthContent() {
    const searchParams = useSearchParams();
    const modeParam = searchParams.get("mode");
    const selectedMode = modeParam === "register" ? "register" : "login";

    return (
        <AuthForm startMode={selectedMode}/>
    )
}

export default function AuthPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-default-text text-sm">Loading...</p>
                </div>
            }
        >
            <AuthContent/>
        </Suspense>
    )
}