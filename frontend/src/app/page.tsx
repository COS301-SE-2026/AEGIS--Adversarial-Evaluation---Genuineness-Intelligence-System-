import Navbar from "../components/hero/layouts/navbar";
import Hero from "../components/hero/sections/hero";
import Image from "next/image";
export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
        <Image
          src="/illustrations/hero-background.jpg"
          alt="Background"
          fill
          className="absolute inset-0 object-cover grayscale brightness-25 -z-10 "
          priority
        />
        <Navbar/>
        <Hero />
        {/*  Forgot to add closing*/}
    </div>

  );
}
