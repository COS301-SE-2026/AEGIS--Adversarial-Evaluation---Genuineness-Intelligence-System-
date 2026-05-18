"use client";

import Link from "next/link";
import { NAV_ITEMS } from "../../../app/(admin)/types/mock-data";

export default function AdminSidebar() {
  return (
    <aside className="w-[220px] min-h-screen bg-[#1A1C1E] border-r border-[#333331] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[#333331] flex items-center gap-2.5">
        {/* Triangle logo mark */}
        <div
          className="w-7 h-7 bg-[#D32F2F] flex-shrink-0"
          style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}
        />
        <div>
          <div className="font-staatliches text-2xl tracking-widest leading-none text-[#F5F5F5]">
            AEGIS
          </div>
          <div className="font-jetbrains text-[8px] text-[rgba(245,245,245,0.42)] tracking-[0.05em] leading-none mt-0.5">
            ADMIN COMMAND CENTRE
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        <div className="px-5 py-2 font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)] tracking-[0.15em] uppercase">
          Operations
        </div>

        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`
              flex items-center gap-2.5 px-5 py-2.5
              font-staatliches text-base tracking-[0.05em]
              border-l-2 transition-all duration-150
              ${
                item.active
                  ? "text-[#D32F2F] border-[#D32F2F] bg-[rgba(211,47,47,0.10)]"
                  : "text-[rgba(245,245,245,0.42)] border-transparent hover:text-[#F5F5F5] hover:bg-[rgba(211,47,47,0.08)]"
              }
            `}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full opacity-60 flex-shrink-0 ${
                item.active ? "bg-[#D32F2F]" : "bg-current"
              }`}
            />
            {item.label}
          </Link>
        ))}

        <div className="px-5 py-2 mt-4 font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)] tracking-[0.15em] uppercase">
          System
        </div>
        {["Settings", "Audit Log"].map((label) => (
          <Link
            key={label}
            href="#"
            className="flex items-center gap-2.5 px-5 py-2.5 font-staatliches text-base tracking-[0.05em] text-[rgba(245,245,245,0.42)] border-l-2 border-transparent transition-all duration-150 hover:text-[#F5F5F5] hover:bg-[rgba(211,47,47,0.08)]"
          >
            <span className="w-1.5 h-1.5 rounded-full opacity-60 bg-current flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#333331] font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)]">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#388E3C] animate-pulse" />
          SYSTEM ONLINE
        </div>
        <div className="mt-1 text-[rgba(245,245,245,0.22)]">v1.0.0-alpha · BBD 2026</div>
      </div>
    </aside>
  );
}