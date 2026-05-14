import Link from "next/link";
import Image from "next/image";

export function Navbar() {

    return (
        <header>
            <nav className="border-b-2 border-black-wool p-4 px-24 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Image src="/illustrations/image.png" alt="Logo" width={75} height={55} />
                    </Link>
                    <div className="flex items-center gap-4 text-base text-white-smoke">
                        <Link href="/assessment" className=" hover:underline hover:underline-offset-8 hover:decoration-signal-red decoration-2 hover:scale-105 hover:-translate-y-0.5 transition-transform duration-200 origin-bottom">Assessments</Link>
                        <Link href="/profile" className="hover:underline hover:underline-offset-8 hover:decoration-signal-red decoration-2 hover:scale-105 hover:-translate-y-0.5 transition-transform duration-400 origin-bottom">Reports</Link>
                    </div>
                </div>
            </nav>
        </header>
    );
}