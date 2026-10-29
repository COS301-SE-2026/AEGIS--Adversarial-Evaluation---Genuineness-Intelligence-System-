'use client';
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAssessmentTimer } from "../context/assessment-timer";
import { SearchBar } from "../ui/buttons/search-bar";
import { NotificationBell } from "../ui/buttons/notification-bell-button";
import { UserIcon } from "../ui/buttons/user-profile-button";
import { ExitSessionButton } from "../ui/buttons/exit-session-button";
import ConfirmationModal from "@/components/ui/confirmation/confirmationModal";
import { logout } from "@/lib/auth";

export function Navbar() {

    const pathname = usePathname();
    const {endTime} = useAssessmentTimer();
    const [timer, setTimer] = useState(0);
    const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(function updateAssessmentTimer() {
        if (!endTime) return;
        const assessmentEndTime = endTime;

        function updateTimer() {
            const remainingTime = Math.floor((new Date(assessmentEndTime).getTime() - Date.now()) / 1000);
            setTimer(remainingTime > 0 ? remainingTime : 0);
        }

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return function clearAssessmentTimer() {
            clearInterval(interval);
        };
    }, [endTime]);

    function isAssessmentTaking(): boolean {
        return pathname !== "/assessment" && pathname !== "/reports";
    }

    function handleLogout(): void {
        if (isAssessmentTaking()) {
            setLogoutConfirmationOpen(true);
            return;
        }
        setIsLoggingOut(true);
        void logout();
    }

    function handleLogoLogout(): void {
        handleLogout();
    }

    function handleConfirmLogout(): void {
        setIsLoggingOut(true);
        setLogoutConfirmationOpen(false);
        void logout();
    }

    function handleCloseLogoutConfirmation(): void {
        setLogoutConfirmationOpen(false);
    }


    function formatTime(seconds: number) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    if (pathname === "/assessment" || pathname === "/reports") {
        return (
            <header>
                <nav className="bg-secondary-surface border-b border-tertiary-surface py-4 px-6 lg:px-12 2xl:px-24 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            aria-label="Log out"
                            onClick={handleLogoLogout}
                            className="cursor-pointer border-0 bg-transparent p-0"
                        >
                            <Image src="/illustrations/AEGIS-logo-candidate-nav.png" alt="Logo" width={75} height={55} />
                        </button>
                        <div className="flex items-center ml-2 gap-x-8 text-base text-default-text">
                            <Link href="/assessment" className="hover:underline hover:underline-offset-8 hover:decoration-system-red decoration-2 hover:scale-105 hover:-translate-y-0.5 transition-transform duration-200 origin-bottom">Assessments</Link>
                            {/* <Link href="/reports" className="hover:underline hover:underline-offset-8 hover:decoration-system-red decoration-2 hover:scale-105 hover:-translate-y-0.5 transition-transform duration-400 origin-bottom">Reports</Link> */}
                        </div>
                    </div>
                    <div className="flex items-center gap-16">
                        <Suspense fallback={<div className="w-40  h-[36] bg-default-border/20 rounded-md animated-pulse"/>}
                        >
                            <SearchBar />
                        </Suspense>
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            aria-busy={isLoggingOut}
                            className="rounded border border-default-border/45 px-4 py-2 font-staatliches text-sm tracking-wider text-default-border transition-all duration-150 hover:border-system-red hover:text-system-red disabled:cursor-not-allowed disabled:border-tertiary-surface disabled:bg-tertiary-surface disabled:text-default-border disabled:opacity-50"
                        >
                            {isLoggingOut ? "Logging out..." : "Log out"}
                        </button>
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
                        <button
                            type="button"
                            aria-label="Log out"
                            onClick={handleLogoLogout}
                            className="cursor-pointer border-0 bg-transparent p-0"
                        >
                            <Image src="/illustrations/AEGIS-logo-candidate-nav.png" alt="Logo" width={75} height={55} />
                        </button>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                        <Image src="/illustrations/icons/clock-icon.svg" alt="Timer Icon" width={24} height={24} />
                        <h1 className="text-2xl font-staatliches">Time Remaining: {formatTime(timer)}</h1>
                    </div>
                    
                    <div className="flex items-center gap-8">
                        {/* <TestSaveButton /> */}
                        <Link href="/assessment">
                            <ExitSessionButton />
                        </Link>
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            aria-busy={isLoggingOut}
                            className="rounded border border-default-border/45 px-4 py-2 font-staatliches text-sm tracking-wider text-default-border transition-all duration-150 hover:border-system-red hover:text-system-red disabled:cursor-not-allowed disabled:border-tertiary-surface disabled:bg-tertiary-surface disabled:text-default-border disabled:opacity-50"
                        >
                            {isLoggingOut ? "Logging out..." : "Log out"}
                        </button>
                    </div>
                </nav>
                <ConfirmationModal
                    isOpen={logoutConfirmationOpen}
                    onClose={handleCloseLogoutConfirmation}
                    onConfirm={handleConfirmLogout}
                    headerText="Confirm logout"
                    title="Log out of AEGIS?"
                    description="You will be logged out. Unsaved changes to your current answer may be lost."
                    confirmText="LOG OUT"
                    cancelText="STAY"
                    isDanger
                />
            </header>
        )
    }
    
}