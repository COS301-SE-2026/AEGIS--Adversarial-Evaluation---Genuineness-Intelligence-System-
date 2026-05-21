import Link from "next/link";
import Button from "../ui/button";
import {ChevronDown} from "lucide-react"
import Image from "next/image";

const Navbar = () => {
  const linkClass = "text-xs lg:text-sm xl:text-base tracking-widest uppercase text-default-text hover:text-system-red transition-colors duration-200"
  return (
    <nav className="flex items-center justify-between mx-auto max-w-7xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-full w-full px-6 lg:px-6 xl:px-8 2xl:px-12 3xl:px-16 py-4 lg:py-5 xl:py-6 2xl:py-7 3xl:py-8">
      <div className="flex items-center gap-8 lg:gap-10 xl:gap-12 2xl:gap-14 3xl:gap-16">
        <Link href="/">
          <Image src="/illustrations/AEGIS-logo-candidate-nav.png" alt="Logo" width={75} height={55} />
        </Link>
        <div className="hidden lg:flex items-center gap-6 xl:gap-8 2xl:gap-10">
          <Link href="/" className={linkClass}>Home</Link>
          <Link href="/about" className={linkClass}>About</Link>
          <div className="relative group">
            <button className="flex items-center gap-1 text-xs lg:text-sm xl:text-base tracking-widest uppercase text-default-text hover:text-system-red transition-colors duration-200 cursor-pointer">
              Resources
              <ChevronDown size={14} className="mt-0.5" />
            </button>  
            <div className="absolute top-full left-0 mt-2 w-48 bg-secondary-surface border border-tertiary-surface hidden group-hover:flex flex-col z-50">
              <Link
                href="/resources/docs"
                className="text-xs tracking-widest uppercase text-default-text hover:bg-tertiary-surface hover:text-system-red px-4 py-3 transition-colors duration-200"
              >
              Docs
              </Link>
              <Link
                href="/resources/guides"
                className="text-xs tracking-widest uppercase text-default-text hover:bg-tertiary-surface hover:text-system-red px-4 py-3 transition-colors duration-200"
              >
              Guides
              </Link>
            </div>
          </div>          
        </div>
      </div>
      <div className="flex items-center gap-3 lg:gap-4 xl:gap-6 2xl:gap-7 3xl:gap-8">
        <Link href="/register" target="_blank">
          <Button variant="solid">Sign Up</Button>
        </Link>
        <Link href="/login" target="_blank">
          <Button variant="outline">Login</Button>
        </Link>
      </div>
    </nav>
  )
}

export default Navbar