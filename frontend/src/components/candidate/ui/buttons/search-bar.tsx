import Image from "next/image";


export function SearchBar() {
    return (
        <div className="flex items-center">
            <div className="relative flex items-center grow">
                <Image src="/illustrations/icons/search-icon.svg" alt="Search Icon" width={20} height={20} className="absolute left-3 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-40  h-[36] pl-10 pr-4 py-2 border  border-black-wool focus:outline-none focus:ring-2 focus:ring-white-smoke transition duration-200"
                />
            </div>
        </div>
    )
}