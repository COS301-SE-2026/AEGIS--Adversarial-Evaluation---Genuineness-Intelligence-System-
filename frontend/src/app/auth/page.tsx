"use client"

import { useSearchParams } from "next/navigation";
import AuthForm from "@/components/admin/ui/input/auth-form";

export default function AuthPage() {
    const searchParams = useSearchParams();
    const modeParam = searchParams.get("mode");
    const selectedMode = modeParam === "register" ? "register" : "login";

    return (
        <AuthForm startMode={selectedMode}/>
    )
}