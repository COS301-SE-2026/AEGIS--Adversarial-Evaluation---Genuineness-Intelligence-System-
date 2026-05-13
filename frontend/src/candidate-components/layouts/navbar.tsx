import Link from "next/link";

export function Navbar() {

    return (
        <header>
            <nav className="border-b-2 border-black-wool p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-xl font-bold tracking-widest">CodeTest</Link>
                    <div className="flex items-center gap-4">
                        <Link href="/assessment" className="text-sm text-white-smoke hover:underline hover:underline-offset-8 hover:decoration-signal-red decoration-2 hover:scale-105 hover:-translate-y-0.5 transition-transform duration-200 origin-bottom">Assessments</Link>
                        <Link href="/profile" className="text-sm text-white-smoke hover:underline hover:underline-offset-8 hover:decoration-signal-red decoration-2 hover:scale-105 hover:-translate-y-0.5 transition-transform duration-400 origin-bottom">Profile</Link>
                    </div>
                </div>
            </nav>
        </header>
    );
}