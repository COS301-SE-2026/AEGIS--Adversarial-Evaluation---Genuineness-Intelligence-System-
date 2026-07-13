
"use client"
import Image from "next/image";
import { useRouter ,useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";


export function SearchBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentSearchValue = searchParams.get("search") ?? ""

    const [localQuery, setLocalQuery] = useState(currentSearchValue);
    const [prevSearch, setPrevSearch] = useState(currentSearchValue)

    if(currentSearchValue !== prevSearch) {
        setPrevSearch(currentSearchValue);
        setLocalQuery(currentSearchValue);
    }

    useEffect(() => {
        
        if(localQuery === currentSearchValue) return;
        
        const rateLimit = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());

            if(localQuery){
                params.set("search", localQuery);
            }
            else {
                params.delete("search");
            }

            router.replace(`${pathname}?${params.toString()}`, {scroll: false});
        }, 300)

        return () => clearTimeout(rateLimit);
    }, [localQuery, pathname, router, searchParams, currentSearchValue])


    return (
        <div className="flex items-center">
            <div className="relative flex items-center grow">
                <Image src="/illustrations/icons/search-icon.svg" alt="Search Icon" width={20} height={20} className="absolute left-3 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search..."
                    value={localQuery}
                    onChange={(event) => setLocalQuery(event.target.value)}
                    className="w-40  h-[36] pl-10 pr-4 py-2 border  border-default-border/75 rounded-md focus:outline-none focus:ring-2 focus:ring-white-smoke transition duration-200"
                />
            </div>
        </div>
    )
}