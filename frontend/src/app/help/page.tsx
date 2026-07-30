import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/hero/layouts/navbar";
import Button from "@/components/hero/ui/button";
import { helpSections } from "./help-content";

const HelpPage = () => {
    return (
        <div className="relative min-h-screen flex flex-col overflow-x-hidden">
            <Image
                src="/illustrations/hero-background.jpg"
                alt="Background"
                fill
                sizes="100vw"
                className="absolute inset-0 object-cover brightness-14 -z-10"
                priority
            />
            <Navbar />
            <main className="flex-1 flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-background/70 backdrop-blur-sm p-8 sm:p-10 lg:p-12">
                    <p className="text-sm uppercase tracking-[0.35em] text-system-red">
                        Help Center
                    </p>

                    <h1 className="mt-3 font-staatliches text-4xl md:text-5xl text-default-text">
                        How AEGIS works
                    </h1>

                    <p className="mt-4 max-w-2xl text-lg leading-8 text-default-text/80">
                        Welcome to AEGIS. Learn how to get started with the application below.
                    </p>

                    <div className="mt-8 grid gap-6 md:grid-cols-3">
                        {helpSections.map((section)=>(
                            <div key={section.title} className="rounded-lg border border-default-border bg-secondary-surface p-6 transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:scale-102">
                                <h2 className="font-staatliches text-2xl text-default-text">
                                    {section.title}
                                </h2>

                                <p className="mt-3 text-sm leading-7 text-default-text/80">
                                    {section.body}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex flex-wrap gap-4 items-center justify-center">
                        <Link href="/auth?mode=login">
                            <Button variant="solid" className="transition-transform duration-300 ease-in-out hover:scale-105">Get Started</Button>
                        </Link>

                        <Link href="/">
                            <Button variant="outline" className="transition-transform duration-300 ease-in-out hover:scale-105">Back Home</Button>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default HelpPage;