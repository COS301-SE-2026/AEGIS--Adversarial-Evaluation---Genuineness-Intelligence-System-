"use client"

import { X } from "lucide-react";
import AdminSidebar from "./sidebar";

interface MobileSidebarProps {
    open: boolean;
    onClose: () => void;
}

export default function MobileSidebar({open, onClose}: Readonly<MobileSidebarProps>) {
    if(!open) return null;

    return (
        <>
            <button
                type="button"
                aria-label="Close sidebar overlay"
                className="fixed z-40 inset-0 bg-background/60 lg:hidden"
                onClick={onClose}
            />

            <div className="flex flex-col fixed left-0 top-0 z-50 h-screen w-72 bg-secondary-surface shadow-2xl lg:hidden min-h-0 overflow-hidden">
                <div className="flex justify-end p-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="text-default-text hover:text-system-red"
                    >
                        <X size={22}/>
                    </button>
                </div>
                <AdminSidebar mobile/>
            </div>
        
        </>
    )
}