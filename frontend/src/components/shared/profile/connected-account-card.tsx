"use client"

import { Link2, CheckCircle2 } from "lucide-react";
import type { ConnectedAccount } from "@/lib/profile";

interface ConnectedAccountProps {
    account: ConnectedAccount;
}

export function ConnectedAccountCard({ account }: Readonly<ConnectedAccountProps>) {
    return (
        <div className="flex flex-col gap-4 rounded-xl border border-default-border bg-background p-5 transition hover:border-system-red">
            
            <div className="flex items-center gap-4">
                 
                 <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-surface border border-default-border">
                    {account.icon}
                </div>

            </div>
            
            <div>
                <h3 className="text-default-text">
                    {account.name}
                </h3>
                <p className="text-sm text-default-border">
                    {account.description}
                </p>
            </div>

            {account.conencted ? (
                <div
                    className="flex items-center gap-2 rounded-lg bg-status-success-dim px-4 py-2 text-status-success"
                >
                    <CheckCircle2 size={18}/>
                    Connected
                </div>
            ) : (
                <button
                    className="flex items-center gap-2 rounded-lg border border-default-border px-4 py-4 transition hover:border-system-red hover:text-system-red"
                >

                    <Link2 size={18}/>
                    Connected
                </button>
            )}
               

        </div>
    )
}