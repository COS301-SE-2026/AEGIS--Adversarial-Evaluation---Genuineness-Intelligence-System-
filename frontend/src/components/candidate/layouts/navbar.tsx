import Link from "next/link";
import Image from "next/image";
import { SearchBar } from "../ui/buttons/search-bar";
import { NotificationBell } from "../ui/buttons/notification-bell";
import { UserIcon } from "../ui/buttons/user-profile";

export function Navbar() {

    return (
        <header>
            <nav className="border-b-2 border-black-wool py-4 px-24 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Image src="/illustrations/AEGIS-logo-candidate-nav.png" alt="Logo" width={75} height={55} />
                    </Link>
                    <div className="flex items-center ml-2 gap-x-8 text-base text-white-smoke">
                        <Link href="/assessment" className=" hover:underline hover:underline-offset-8 hover:decoration-signal-red decoration-2 hover:scale-105 hover:-translate-y-0.5 transition-transform duration-200 origin-bottom">Assessments</Link>
                        <Link href="/reports" className="hover:underline hover:underline-offset-8 hover:decoration-signal-red decoration-2 hover:scale-105 hover:-translate-y-0.5 transition-transform duration-400 origin-bottom">Reports</Link>
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