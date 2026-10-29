import Image from "next/image";
import Navbar from "@/components/hero/layouts/navbar";
import { teamMembers } from "./meet-the-team-content";

const linkClass = "break-all text-system-red hover:underline";

const MeetTheTeamPage = () => {
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
            <main className="flex-1 flex items-center justify-center px-5 sm:px-6 py-10 sm:py-16">
                <div className="w-full max-w-7xl rounded-2xl border border-white/10 bg-background/70 backdrop-blur-sm p-5 sm:p-10 lg:p-12">
                    <p className="text-sm uppercase tracking-[0.35em] text-system-red">
                        Team Members
                    </p>

                    <h1 className="mt-3 font-staatliches text-4xl md:text-5xl text-default-text">
                        Meet the Team
                    </h1>

                    <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {teamMembers.map((member) => (
                            <article key={member.name} className="flex flex-col rounded-lg border border-default-border bg-secondary-surface p-6">
                                <Image
                                    src={member.image}
                                    alt={`Portrait of ${member.name}`}
                                    width={250}
                                    height={250}
                                    className="h-62.5 w-62.5 self-center rounded-lg object-cover"
                                />

                                <h2 className="mt-5 text-center font-staatliches text-2xl text-default-text">
                                    {member.name}
                                </h2>

                                <p className="mt-3 text-sm leading-7 text-default-text/80">
                                    <span className="text-default-text">Role:</span> {member.role}
                                </p>

                                <p className="mt-3 text-sm leading-7 text-default-text/80">
                                    <span className="text-default-text">Profile description:</span>
                                    <br />
                                    {member.description}
                                </p>

                                <p className="mt-3 text-sm leading-7 text-default-text/80">
                                    <span className="text-default-text">LinkedIn:</span>{" "}
                                    (<a href={member.linkedin} target="_blank" rel="noopener noreferrer" className={linkClass}>{member.linkedin}</a>)
                                </p>

                                {member.cv && (
                                    <p className="mt-3 text-sm leading-7 text-default-text/80">
                                        <span className="text-default-text">CV:</span>{" "}
                                        <a href={member.cv} target="_blank" rel="noopener noreferrer" className={linkClass}>View CV</a>
                                    </p>
                                )}

                                {member.email && (
                                    <p className="mt-3 text-sm leading-7 text-default-text/80">
                                        <span className="text-default-text">Email:</span>{" "}
                                        (<a href={`mailto:${member.email}`} className={linkClass}>{member.email}</a>)
                                    </p>
                                )}
                            </article>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MeetTheTeamPage;
