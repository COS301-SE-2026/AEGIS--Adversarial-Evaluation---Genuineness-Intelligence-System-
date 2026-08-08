"use client"

import { ConnectedAccount } from "@/lib/profile";
import { ConnectedAccountCard } from "./connected-account-card";

interface ConnectedAccountsProps {
    accounts: ConnectedAccount[];
}

export function ConnectedAccounts({ accounts }: Readonly<ConnectedAccountsProps>) {
    return (
        <div className="space-y-4">
            {accounts.map((account) => (
                <ConnectedAccountCard
                    key={account.id}
                    account={account}
                />
            ))}
        </div>
    )
}