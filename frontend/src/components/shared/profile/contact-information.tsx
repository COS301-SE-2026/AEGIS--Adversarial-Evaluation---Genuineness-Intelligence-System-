"use client"

import { Mail } from "lucide-react";
import type { UserProfile } from "@/lib/profile";

interface ContactInformationProps {
    values: UserProfile;
    onChange(values: Partial<UserProfile>): void;
}

export function ContactInformation({ values, onChange }: Readonly<ContactInformationProps>){
    return(
        <div className="max-w-2xl">

            <div className="space-y-2">

                <label className="text-sm text-default-text">
                    Email Address
                </label>
                
                <div className="relative">

                    <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-default-border"
                    />

                    <input
                        type="email"
                        value={values.email}
                        onChange={(element) => onChange({email: element.target.value})}
                        className="w-full bg-secondary-surface text-default-text placeholder:text-default-text/80 text-sm px-4 py-4 border border-transparent
                                focus:outline-none focus:border-default-border transition-colors duration-200"
                    />
                    
                </div>

                <p className="text-xs text-default-border">
                    This email is used for authentification and platform notifcations.
                </p>


            </div>

        </div>
    )
}

