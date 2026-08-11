"use client";
import { NAV_ITEMS } from "../../../app/(admin)/types/mock-data";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

interface AdminTopbarProps {
  onOpenSideBar?: () => void;
}

export default function AdminTopbar({onOpenSideBar}: Readonly<AdminTopbarProps>) {
  const pathname = usePathname();
  const activePage = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}`));
  const title = activePage ? activePage.label : ""

  return (
    <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8 h-16 bg-secondary-surface border-b border-tertiary-surface ">
      
      <div className="flex items-center gap-3">
        <button 
          type="button"
          onClick={onOpenSideBar}
          className="lg:hidden text-default-text hover:text-system-red"
        >
          <Menu size={22}/>
        </button>
        <h1 className=" text-base sm:text-lg lg:text-xl truncate text-default-text">
          ADMIN / <span className="text-system-red">{title}</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-5">
        {/* Bell icon
        <button
          aria-label="Notifications"
          className="text-default-text hover:text-white-smoke transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button> */}
      </div>
    </div>
  );
}