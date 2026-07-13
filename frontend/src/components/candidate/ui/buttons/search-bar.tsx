
"use client"
import Image from "next/image";
import { useRouter,useSearchParams, usePathname } from "next/navigation"


export function SearchBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const searchQuery = searchParams.get("search") ?? "";

    const handleSearch = (element: React.ChangeEvent<HTMLInputElement>) => {
        const value = element.target.value;
        const params = new URLSearchParams(searchParams.toString());
        
        if(value) {
            params.set("search", value);
        }
        else {
            params.delete("seach");
        }
        router.replace(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="flex items-center">
            <div className="relative flex items-center grow">
                <Image src="/illustrations/icons/search-icon.svg" alt="Search Icon" width={20} height={20} className="absolute left-3 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search assessments..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-40  h-[36] pl-10 pr-4 py-2 border  border-default-border/75 rounded-md focus:outline-none focus:ring-2 focus:ring-white-smoke transition duration-200"
                />
            </div>
        </div>
    )
}