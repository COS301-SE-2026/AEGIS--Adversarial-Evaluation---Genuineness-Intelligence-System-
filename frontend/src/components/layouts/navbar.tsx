import Link from "next/link";
import Button from "../ui/button";
import {ChevronDown} from "lucide-react"
import { link } from "fs";
import Image from "next/image";

const Navbar = () => {
  const linkClass = "font-jetbrains-mono text-sm tracking-widest uppercase text-white-smoke hover:text-signal-red transition-colors duration-200"
  return (
    <nav className="flex items-center justify-between px-8 py-4 w-full">
      <div className="flex items-center gap-10">
        <Link href="/">
          {/* <Image 
            src="/illustrations/AEGIS-logo.png" 
            alt="AEGIS Logo" 
            width={36} 
            height={36}>
          </Image> */}
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/" className={linkClass}>Home</Link>
          <Link href="/about" className={linkClass}>About</Link>
          <div className="relative group">
            <button className="flex items-center gap-1 font-jetbrains-mono text-sm tracking-widest uppercase text-white-smoke hover:text-signal-red transition-colors duration-200 cursor-pointer">
              Resources
              <ChevronDown size={14} className="mt-0.5" />
            </button>  
            <div className="absolute top-full left-0 mt-2 w-48 bg-bunker-grey border border-black-wool hidden group-hover:flex flex-col z-50">
              <Link
                href="/resources/docs"
                className="font-jetbrains-mono text-xs tracking-widest uppercase text-white-smoke hover:bg-black-wool hover:text-signal-red px-4 py-3 transition-colors duration-200"
              >
              Docs
              </Link>
              <Link
                href="/resources/guides"
                className="font-jetbrains-mono text-xs tracking-widest uppercase text-white-smoke hover:bg-black-wool hover:text-signal-red px-4 py-3 transition-colors duration-200"
              >
              Guides
              </Link>
            </div>
          </div>          
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="solid">Sign Up</Button>
        <Button variant="outline">Login</Button>
      </div>
    
    </nav>
  )
}

export default Navbar