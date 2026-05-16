export default function QuestionTagIcon({tag}: {tag: string}) {
    return (
        <div className="w-auto h-4 bg-[#252729]">
            {tag === "easy" && <p className="text-xs text-green-500 p-1">{tag}</p>}
            {tag === "medium" && <p className="text-xs text-yellow-500 p-1">{tag}</p>}
            {tag === "hard" && <p className="text-xs text-red-500 p-1">{tag}</p>}
            {tag !== "easy" && tag !== "medium" && tag !== "hard" && <p className="text-xs text-default-text p-1">{tag}</p>}
        </div>
    )
}