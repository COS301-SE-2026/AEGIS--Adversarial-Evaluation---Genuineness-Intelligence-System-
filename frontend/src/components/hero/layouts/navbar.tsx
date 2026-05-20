import Link from "next/link";
import Button from "../ui/button";
import {ChevronDown} from "lucide-react"
import Image from "next/image";

const Navbar = () => {
  const linkClass = "text-sm tracking-widest uppercase text-default-text hover:text-system-red transition-colors duration-200"
  return (
    <nav className="flex items-center justify-between lg:px-26 py-4 ">
      <div className="flex items-center gap-10">
        <Link href="/">
          <Image src="/illustrations/AEGIS-logo-candidate-nav.png" alt="Logo" width={75} height={55} />
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/" className={linkClass}>Home</Link>
          <Link href="/about" className={linkClass}>About</Link>
          <div className="relative group">
            <button className="flex items-center gap-1 text-sm tracking-widest uppercase text-default-text hover:text-system-red transition-colors duration-200 cursor-pointer">
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
      <div className="flex items-center lg:gap-9">
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