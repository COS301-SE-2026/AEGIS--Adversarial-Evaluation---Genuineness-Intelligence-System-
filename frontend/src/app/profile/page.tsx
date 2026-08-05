"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { ProfileHeader } from "@/components/shared/profile/profile-header";

export default function ProfileManagementPage() {
    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 md:p-6 lg:p-8">

                <ProfileHeader
                    title="Profile"
                    description="Manage your account information"
                />

            </div>
        </main>
    )
}