"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { ProfileHeader } from "@/components/shared/profile/profile-header";
import { ProfileCard } from "@/components/shared/profile/profile-card";
import { PersonalInformation } from "@/components/shared/profile/personal-infromation";
import { ContactInformation } from "@/components/shared/profile/contact-information";
import { ConnectedAccounts } from "@/components/shared/profile/connected-accounts";
import { SaveChangesBar } from "@/components/shared/profile/save-changes-bar";

import type { UserProfile, ConnectedAccount } from "@/lib/profile";
import { ProfilePicture } from "@/components/shared/profile/profile-picture";

export default function ProfileManagementPage() {
    const [loading, setLoading] = useState(false);

    const [profile, setProfile] = useState<UserProfile>({
        fullName: "Luyanda Ndlovu",
        username: "lulu",
        email: "l@gmail.com",
        avatar: "",
    });

    const [accounts] = useState<ConnectedAccount[]>([
        {
            id: "google",
            name: "Google",
            description: "Use your Google account to sign in.",
            icon: <Save size={24}/>,
            conencted: true,
        },
        {
            id: "github",
            name: "GitHub",
            description: "Use your GitHub account to sign in.",
            icon: <Save size={24}/>,
            conencted: true,
        },
    ]);

    async function saveChanges() {
        setLoading(true);

        try {
            //add the actual post api
            console.log(profile);
        }
        finally {
            setLoading(false);
        } 
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 md:p-6 lg:p-8">

                <ProfileHeader
                    title="Profile"
                    description="Manage your account information"
                />

                <ProfilePicture
                    image={profile.avatar}
                    fullName={profile.fullName}
                    onUpload={(url) => setProfile((prev) => ({
                            ...prev,
                            avatar:url,
                        }))
                    }
                />

                <ProfileCard title="Personal Information">
                    
                    <PersonalInformation
                        values={profile}
                        onChange={(values) => 
                            setProfile((prev) => ({
                                ...prev,
                                ...values,
                            }))
                        }
                    />

                </ProfileCard>

                <ProfileCard title="Contact Information">
                    
                    <ContactInformation
                        values={profile}
                        onChange={(values) => 
                            setProfile((prev) => ({
                                ...prev,
                                ...values,
                            }))
                        }
                    />

                </ProfileCard>

                <ProfileCard title="Connected Accounts">

                    <ConnectedAccounts
                        accounts={accounts}
                    />

                </ProfileCard>
                
                <SaveChangesBar
                    loading={loading}
                    onSave={saveChanges}
                />
           
            </div>
        </main>
    )
}