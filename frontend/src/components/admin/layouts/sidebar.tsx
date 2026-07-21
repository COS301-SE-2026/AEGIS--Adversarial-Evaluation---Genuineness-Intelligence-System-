"use client";

import Link from "next/link";
import { NAV_ITEMS } from "../../../app/(admin)/types/mock-data";
import { usePathname } from "next/navigation";
import Image from "next/image";
import  logo from "../../../../public/illustrations/AEGIS-logo-candidate-nav.png"

interface AdminSidebarProps {
  mobile?: boolean;
}

export default function AdminSidebar({mobile}: AdminSidebarProps) {
  const pathname = usePathname();
  return (
    <aside className={`flex flex-col bg-secondary-surface border-r border-tertiary-surface
      ${mobile 
        ? "w-full flex-1 min-h-0 overflow-y-auto"
        : "hidden lg:flex lg:w-64 xl:w-72 min-h-screen shrink-0"
      }
    `}>
      <div className="flex items-center gap-2 px-5 mt-2 shrink-0">
       <Link href="/">
          <Image 
            src={logo} 
            alt="Logo" 
            className="w-12 sm:w-14 lg:w-16 h-auto"
           />
        </Link>
        <div>
          <div className="font-staatliches text-2xl tracking-widest leading-none text-white-smoke">
            AEGIS
          </div>
          <div className="font-jetbrains text-[8px] text-default-border tracking-wider leading-none mt-0.5">
            ADMIN COMMAND CENTRE
          </div>
        </div>
      </div>


      <nav className="flex-1 mt-4 py-4">
        
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}`);
          
          return(
            <Link
              key={item.label}
              href={item.href}
              className={`
                flex items-center gap-2.5 px-5 py-2.5
                font-staatliches text-sm xl:text-base tracking-wider
                border-l-2 transition-all duration-150
                ${
                  isActive
                    ? "text-system-red border-system-red bg-system-red/10"
                    : "text-white-smoke/40 border-transparent hover:text-white-smoke hover:bg-system-red/8"
                }
              `}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full opacity-60 shrink-0 ${
                  isActive ? "bg-system-red" : "bg-current"
                }`}
              />
              {item.label}
            </Link>
          );
        })}


        <div className="px-5 py-2 mt-4 font-jetbrains text-[9px] text-white-smoke/40 tracking-[0.15em] uppercase">
          System
        </div>
        {["Settings", "Audit Log"].map((label) => (
          <Link
            key={label}
            href="#"
            className="flex items-center gap-2.5 px-5 py-2.5 font-staatliches text-base tracking-widest text-white-smoke/40 border-l-2 border-transparent transition-all duration-150 hover:text-white-smoke hover:bg-system-red/8"
          >
            <span className="w-1.5 h-1.5 rounded-full opacity-60 bg-current shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-tertiary-surface font-jetbrains text-[10px] text-white-smoke/40">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-status-success-dim animate-pulse" />
          SYSTEM ONLINE
        </div>
        <div className="mt-1 text-white-smoke/20">v1.0.0-alpha · BBD 2026</div>
      </div>
    </aside>
  );
}