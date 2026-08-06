"use client"

import type { UserProfile } from "@/lib/profile";

interface PersonalInformationProps {
    values: UserProfile;
    onChange(values: Partial<UserProfile>) : void //Partial turns the all the properties in UserProfile to optional 
}

export function PersonalInformation({ values, onChange }: Readonly<PersonalInformationProps>) {
    return (
        <div className="grid gril-cols-1 gap-6 lg:grid-cols-2">

            <div className="space-y-2">

                <label className="text-sm text-default-text">
                    Full Name
                </label>

                <input
                    type="text"
                    value={values.fullName}
                    onChange={(element) => onChange({ fullName: element.target.value, })}
                    className="w-full bg-secondary-surface text-default-text placeholder:text-default-text/80 text-sm px-4 py-4 border border-transparent
                                focus:outline-none focus:border-default-border transition-colors duration-200"
                />

            </div>

            <div className="space-y-2">

                 <label className="text-sm text-default-text">
                    Username
                </label>

                <input
                    type="text"
                    value={values.username}
                    onChange={(element) => onChange({ username: element.target.value, })}
                    className="w-full bg-secondary-surface text-default-text placeholder:text-default-text/80 text-sm px-4 py-4 border border-transparent
                                focus:outline-none focus:border-default-border transition-colors duration-200"
                />
            </div>

        </div>
    )
}