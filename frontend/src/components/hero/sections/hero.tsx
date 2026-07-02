import Button from "../ui/button";
import Image from "next/image"
import Link from "next/link";

const Hero = () => {
  return (
    <section className="flex flex-col lg:flex-row items-center justify-center mx-auto max-w-7xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-24 gap-4 lg:gap-5 xl:gap-6 2xl:gap-8 3xl:gap-10 py-12 lg:py-16 xl:py-20 2xl:py-24 3xl:py-32">
        <div className="flex flex-col justify-center flex-1">
            <div className="flex flex-col gap-6 lg:gap-8 xl:gap-10 2xl:gap-12 3xl:gap-14 max-w-2xl">
                <div className="flex flex-col gap-2 lg:gap-3 2xl:gap-4">
                    <h1 className="font-staatliches text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl 3xl:text-8xl leading-none text-default-text">
                        Prove Your
                    </h1>
                    <h1 className="font-staatliches text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl 3xl:text-8xl leading-none text-system-red">
                        Humanity.
                    </h1>
                </div>
                <h2 className="text-sm lg:text-base xl:text-lg 2xl:text-xl 3xl:text-2xl tracking-widest uppercase text-default-text leading-relaxed max-w-lg">
                    The ultimate coding assessment where human reasoning battles AI logic.
                    Artificial intelligence thrives on predictability.{" "}
                    <span className="text-system-red">
                        Can you build an unpredictable logic path and bypass the machine
                        detection grid?
                    </span>
                </h2>
                <div className="flex items-center gap-4 lg:gap-5 xl:gap-6 2xl:gap-7 3xl:gap-8 pt-4 lg:pt-6 xl:pt-8 2xl:pt-10 3xl:pt-12">
                    <Link href="/auth?mode=login">
                        <Button variant="solid">Get Started</Button>                
                    </Link>
                    <Link href="/resources/guides">
                        <Button variant="outline">Learn More</Button>                
                    </Link>
                </div>
            </div>            
        </div>

        <div className="hidden lg:flex relative w-72 xl:w-96 2xl:w-[28rem] 3xl:w-[32rem] h-96 xl:h-[28rem] 2xl:h-[32rem] 3xl:h-[36rem] shrink-0 overflow-hidden rounded-lg">
            <Image
                src="/illustrations/hero-image.jpg"
                alt="Welder in protective mask"
                sizes="100vw"
                fill
                className="object-cover grayscale"
                priority
            />
        </div>
    </section>
  )
}

export default Hero