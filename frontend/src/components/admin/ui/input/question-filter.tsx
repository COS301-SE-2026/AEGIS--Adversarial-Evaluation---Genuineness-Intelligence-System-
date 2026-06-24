import { Search, ChevronDown} from "lucide-react"
import { QuestionCategory } from "@/app/(admin)/types/questions"

interface QuestionFilterProps {
    searchTerm: string,
    onSearchChange: (value: string) => void,
    categoryFilter: string,
    onChangeCategory: (value: string) => void,
    categories: QuestionCategory[],
    difficultyFilter: string,
    onDifficultyChange: (value: string) => void,
    onClearFilters: () => void,
}

export default function QuestionFilters({
    searchTerm,
    onSearchChange,
    categoryFilter,
    onChangeCategory,
    categories,
    difficultyFilter,
    onDifficultyChange,
    onClearFilters
} :QuestionFilterProps) {
    const showClearBtn = searchTerm || categoryFilter !== "all" || difficultyFilter !== "all";
    
    return (
        <div className="bg-tertiary-surface rounded-lg p-4 sm:p-6 mb-6 border-default-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid:cols-4 gap-3 sm:gap-4 mb-4">
                <div className="relative col-span-1 sm:col-span-2 lg:col-span-2">
                    <Search className="absolute left-3 top-3 text-default-border shrink-0" size={18}/>
                    <input
                        type="text"
                        placeholder= "Search..."
                        value={searchTerm}
                        onChange={(element) => onSearchChange(element.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-secondary-surface border border-default-border rounded text-default-text text-sm placeholder-default-border focus:outline-none focus:border-white-smoke"
                    />
                </div>

                <div className="relative">
                    <select 
                        value={categoryFilter}
                        onChange={(element) => onChangeCategory(element.target.value)}
                        className="w-full px-3 sm:px-4 py-2 bg-secondary-surface border border-default-border rounded text-default-text text-sm focus:outline-none focus:border-white-smoke appearance-none cursor-pointer"
                    >
                        <option value="all">Category</option>
                        {categories.map((cat) => (
                            <option key={cat.category_id} value={String(cat.category_id)}>
                                {cat.category_name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-default-border pointer-events-none shrink-0" size={18}/>
                </div>

                <div className="relative">
                    <select
                        value={difficultyFilter}
                        onChange={(element) => onDifficultyChange(element.target.value)}
                        className="w-full px-3 sm:px-4 py-2 bg-secondary-surface border border-default-border rounded text-default-text text-sm focus:outline-none focus:border-white-smoke appearance-none cursor-pointer"
                    >
                        <option value="all">Difficulty</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-default-border pointer-events-none shrink-0" size={18}/>
                </div>
            </div>

            {showClearBtn && (
                <button onClick={onClearFilters} className="text-white-smoke hover:text-system-red text-sm">
                    Clear filter
                </button>
            )}
        </div>
    )
}