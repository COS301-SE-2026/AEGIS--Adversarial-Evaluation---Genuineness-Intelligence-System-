import { ReactNode } from "react";

interface ProfileCardProps {
    title: string;
    children: ReactNode;
}

export function ProfileCard({title, children}: Readonly<ProfileCardProps>) {
    return (
        <section
            className="rounded-2xl border border-default-border bg-secondary-surface"
        >
            <div
                className="border-b border-default-border px-6 py-5"
            >
                <h2
                    className="text-2xl tracking-widest"
                >
                    {title}
                </h2>
            </div>
            <div
                className="p-6"
            >
                {children}
            </div>
        </section>
    );
}