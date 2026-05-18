'use client';
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SearchBar } from "../ui/buttons/search-bar";
import { NotificationBell } from "../ui/buttons/notification-bell-button";
import { UserIcon } from "../ui/buttons/user-profile-button";
import { SaveButton } from "../ui/buttons/assessment-save-button";
import { ExitSessionButton } from "../ui/buttons/exit-session-button";

export function Navbar() {

    const pathname = usePathname();
    const [timer, setTimer] = useState(60 * 60); // 60 minutes in seconds

    useEffect(() => {
        if (pathname !== "/assessment") {
            const interval = setInterval(() => {
                setTimer((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [pathname]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (pathname === "/assessment" || pathname === "/reports") {
        return (
            <header>
                <nav className="bg-secondary-surface border-b border-tertiary-surface py-4 px-24 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/assessment">
                            <Image src="/illustrations/AEGIS-logo-candidate-nav.png" alt="Logo" width={75} height={55} />
                        </Link>
                        <div className="flex items-center ml-2 gap-x-8 text-base text-default-text">
                            <Link href="/assessment" className="hover:underline hover:underline-offset-8 hover:decoration-system-red decoration-2 hover:scale-105 hover:-translate-y-0.5 transition-transform duration-200 origin-bottom">Assessments</Link>
                            <Link href="/reports" className="hover:underline hover:underline-offset-8 hover:decoration-system-red decoration-2 hover:scale-105 hover:-translate-y-0.5 transition-transform duration-400 origin-bottom">Reports</Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-16">
                        <SearchBar />
                        <NotificationBell />
                        <UserIcon />
                    </div>
                    
                </nav>
            </header>
        );
    }
    else {
        return (
            <header>
                <nav className="bg-secondary-surface border-b-2 border-tertiary-surface py-4 px-24 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/assessment">
                            <Image src="/illustrations/AEGIS-logo-candidate-nav.png" alt="Logo" width={75} height={55} />
                        </Link>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                        <Image src="/illustrations/icons/clock-icon.svg" alt="Timer Icon" width={24} height={24} />
                        <h1 className="text-2xl font-staatliches">Time Remaining: {formatTime(timer)}</h1>
                    </div>
                    
                    <div className="flex items-center gap-8">
                        <SaveButton />
                        <Link href="/assessment">
                            <ExitSessionButton />
                        </Link>
                    </div>
                </nav>
            </header>
        )
    }
    
}