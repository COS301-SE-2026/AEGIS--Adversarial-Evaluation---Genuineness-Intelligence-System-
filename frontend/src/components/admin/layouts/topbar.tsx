"use client";
import { NAV_ITEMS } from "../../../app/(admin)/types/mock-data";
import { usePathname } from "next/navigation";

export default function AdminTopbar() {
  const pathname = usePathname();
  const activePage = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}`));
  const title = activePage ? activePage.label : ""

  return (
    <div className="bg-secondary-surface border-b border-tertiary-surface flex items-center justify-between px-6 py-6 shrink-0">
      <h1 className=" text-xl text-default-text">
        ADMIN / <span className="text-system-red">{title}</span>
      </h1>

      <div className="flex items-center gap-5">
        {/* Bell icon */}
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
        </button>
      </div>
    </div>
  );
}