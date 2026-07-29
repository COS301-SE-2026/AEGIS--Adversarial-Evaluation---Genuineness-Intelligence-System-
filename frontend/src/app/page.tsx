import Navbar from "../components/hero/layouts/navbar";
import Hero from "../components/hero/sections/hero";
import Image from "next/image";
export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
        <Image
          src="/illustrations/hero-background.jpg"
          alt="Background"
          fill
          sizes="100vw"
          className="absolute inset-0 object-cover brightness-14 -z-10 "
          priority
        />
        <Navbar/>
        <Hero />
    </div>

  );
}
