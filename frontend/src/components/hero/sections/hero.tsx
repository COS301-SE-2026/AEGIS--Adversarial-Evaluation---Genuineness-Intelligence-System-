import Button from "../ui/button";
import Image from "next/image"
import Link from "next/link";

const Hero = () => {
  return (
    <section className="flex px-26 flex-1 gap-12">
        <div className="flex flex-row justify-center lg:mt-22 lg:ml-48 xxl:ml-42">
            <div className="flex flex-col lg:gap-12 lg:max-w-lg">
                <div className="flex flex-col gap-2">
                    <h1 className="font-staatliches lg:text-6xl xxl:text-8xl leading-none text-default-text">Prove Your</h1>
                    <h1 className="font-staatliches lg:text-6xl xxl:text-8xl leading-none text-system-red">
                        Humanity.
                    </h1>
                </div>
                <h2 className="text-base lg:text-xl tracking-widest uppercase text-default-text leading-relaxed">
                    The ultimate coding assessment where human reasoning battles AI logic.
                    Artificial intelligence thrives on predictability.{" "}
                    <span className="text-system-red">
                    Can you build an unpredictable logic path and bypass the machine
                    detection grid?
                    </span>
                </h2>

                <div className="flex items-center gap-4">
                    <Link href="/login" target="_blank">
                        <Button variant="solid">Get Started →</Button>                
                    </Link>
                    <Link href="/resources/guides">
                        <Button variant="outline">Learn More</Button>                
                    </Link>

                </div>
            </div>            
            <div className="relative w-72 lg:w-100 h-98 lg:h-116 lg:ml-20 shrink-0 overflow-hidden">
                    <Image
                        src="/illustrations/hero-image.jpg"
                        alt="Welder in protective mask"
                        fill
                        className="object-cover grayscale rounded-md"
                        priority
                    />
            </div>
        </div>
    </section>
  )
}

export default Hero