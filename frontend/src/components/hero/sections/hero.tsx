import Button from "../ui/button";
import Image from "next/image"

const Hero = () => {
  return (
    <section className="flex items-center justify-between px-8 py-16 flex-1 gap-12">
        <div className="flex flex-col gap-8 max-w-xl">
            <div className="flex flex-col gap-0">
                <h1 className="font-staatliches text-8xl leading-none text-white-smoke">Prove Your</h1>
                <h1 className="font-staatliches text-8xl leading-none text-signal-red">
                    Humanity
                    <span className="text-white-smoke">.</span>
                </h1>
            </div>
            <p className="font-ibm-plex text-xs tracking-widest uppercase text-white-smoke leading-relaxed max-w-sm">
                The ultimate coding assessment where human reasoning battles AI logic.
                Artificial intelligence thrives on predictability.{" "}
                <span className="text-signal-red">
                Can you build an unpredictable logic path and bypass the machine
                detection grid?
                </span>
            </p>

            <div className="flex items-center gap-4">
                <Button variant="solid">Get Started →</Button>
                <Button variant="outline">Learn More</Button>
            </div>
        </div>            
        <div className="relative w-[420px] h-[400px] shrink-0 overflow-hidden">
                <Image
                    src="/illustrations/hero-image.jpg"
                    alt="Welder in protective mask"
                    fill
                    className="object-cover grayscale"
                    priority
                />
            </div>

    </section>
  )
}

export default Hero