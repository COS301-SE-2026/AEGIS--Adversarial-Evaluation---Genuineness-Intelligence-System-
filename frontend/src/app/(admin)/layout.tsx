"use client"

import { useState } from "react";
import AdminSidebar from "@/components/admin/layouts/sidebar";
import AdminTopbar from "@/components/admin/layouts/topbar";
import MobileSidebar from "@/components/admin/layouts/mobile-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode } ) {
    const [mobileSidebarOpen, setMobileSideBarOpen] = useState(false);


    return (
        <div className="flex min-h-screen flex-col bg-background text-default-text">
           
            
            <AdminTopbar
                onOpenSideBar={() => setMobileSideBarOpen(true)}
            />
            
            <div className="flex flex-1 min-h-0">
               
                <AdminSidebar/>

                <main className="flex-1 min-w-0 overflow-y-auto">
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>

            </div>

            <MobileSidebar
                open={mobileSidebarOpen}
                onClose={() => setMobileSideBarOpen(false)}
            />

        </div>
    )
    
}