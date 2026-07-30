import Button from "../ui/button";
import Image from "next/image"
import Link from "next/link";

const Hero = () => {
  return (
    <section className="flex flex-col lg:flex-row items-center justify-center flex-1 min-h-[calc(100vh-5rem)] max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 gap-10 lg:gap-16 py-10">
        <div className="flex flex-col flex-1 items-center justify-center lg:items-start text-center lg:text-left ">
            <div className="flex flex-col gap-6 lg:gap-8 xl:gap-10 2xl:gap-12 3xl:gap-14 max-w-2xl">
                <div className="flex flex-col gap-2 lg:gap-3 2xl:gap-4">
                    <h1 className="font-staatliches text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl 3xl:text-8xl leading-none text-default-text">
                        Prove Your
                    </h1>
                    <h1 className="font-staatliches text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-none text-system-red">
                        Humanity.
                    </h1>
                </div>
                <h2 className="text-base sm:text-lg lg:text-xl tracking-widest uppercase text-default-text leading-relaxed max-w-xl mx-auto lg:mx-0">
                    The ultimate coding assessment where human reasoning battles AI logic.
                    Artificial intelligence thrives on predictability.{" "}
                    <span className="text-system-red">
                        Can you build an unpredictable logic path and bypass the machine
                        detection grid?
                    </span>
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4 lg:pt-6 xl:pt-8 2xl:pt-10 3xl:pt-12">
                   
                    <Link 
                        href="/auth?mode=login"
                        className="w-full sm:w-auto"
                    >
                        <Button variant="solid">Get Started</Button>                
                    </Link>
                    <Link 
                        href="/help"
                        className="w-full sm:w-auto"
                    >
                        <Button variant="outline">Learn More</Button>                
                    </Link>
            
                </div>
            </div>            
        </div>

        <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg aspect-4/4.5 order-first lg:order-last overflow-hidden rounded-lg">
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