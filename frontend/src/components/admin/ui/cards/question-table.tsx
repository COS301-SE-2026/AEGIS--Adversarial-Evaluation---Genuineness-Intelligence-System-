import { ArrowUp, ArrowDown, MoreVertical } from "lucide-react";
import { QuestionBank }   from "@/app/(admin)/types/questions";

interface QuestionTableProps {
    questions: QuestionBank[],
    categoryMap: Record<number,string>,
    sortColumn: "title" | "category" | "difficulty" | null,
    sortDirection: "asc" | "desc",
    onSort: (column: "title" | "category" | "difficulty") => void,
    openMenuId: number | null,
    setOpenMenuId: (id: number | null) => void,
    onEdit: (id: number) => void,
    onDelete: (id: number) => void
}

export default function QuestionTable({
    questions,
    categoryMap,
    sortColumn,
    sortDirection,
    onSort,
    openMenuId,
    setOpenMenuId,
    onEdit,
    onDelete,
}: QuestionTableProps) {
    const difficultyStyle = (difficulty: string) => {
        switch (difficulty) {
            case "Easy":  return "bg-status-success/20 text-status-success";
            case "Medium": return "bg-status-warning/20 text-status-warning";
            default: return "bg-system-red/20 text-system-red";
        }
    };

    return (
        <div className="bg-secondary-surface rounded-lg border border-default-border overflow-hidden">
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-default-border">
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left">
                                <input type="checkbox" className="w-4 h-4 cursor-pointer" />
                            </th>
                            <th onClick= {() => onSort("title")} className="px-4 sm:px-6 py-3 sm:py-4 text-left text-default-text font-semibold text-xs sm:text-sm cursor-pointer hover:text-system-red transistion-colors">
                                <div className="flex items-center gap-2">
                                    Title {sortColumn === "title" && (sortDirection === "asc" ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}
                                </div>
                            </th>
                            <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-default-text font-semibold text-xs sm:text-sm">
                                Description
                            </th>
                            <th onClick={() => onSort("category")} className="hidden lg:table-cell px-4 sm:px-6 py-3 sm:py-4 text-left text-default-text font-semibold text-xs sm:text-sm cursor-pointer hover:text-system-red transition-colors">
                                <div className="flex items-center gap-2">
                                    Category {sortColumn === "category" && (sortDirection === "asc" ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}
                                </div>
                            </th>
                            <th onClick={() => onSort("difficulty")} className="px-4 sm:px-6 py-4 text-left text-default-text font-semibold text-xs sm:text-sm cursor-pointer hover:text-system-red">
                                <div className="flex items-center gap-2">
                                    Difficulty {sortColumn === "difficulty" && (sortDirection === "asc" ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}
                                </div>
                            </th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-default-text font-semibold text-xs sm:text-sm">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {questions.map((question) => (
                            <tr key={question.question_bank_id} className="border-b border-default-border hover:bg-tertiary-surface transition-colors">
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    <input type="checkbox" className="w-4 h-4 cursor-pointer"/>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-default-text font-medium text-sm">{question.title}</td>
                                <td className="hidden md:table-cell px-4 sm:px-6 py-3 sm:py-4 text-default-text text-xs sm:text-sm max-w-xs truncate">{question.content}</td>
                                <td className="hidden lg:table-cell px-4 sm:px-6 py-3 sm:py-4 text-default-text text-xs sm:text-sm">
                                    {categoryMap[question.category_id] || "Unassigned"}
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyStyle(question.difficulty)}`}>
                                        {question.difficulty}
                                    </span>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-center relative">
                                    <button
                                        onClick={() => setOpenMenuId(openMenuId === question.question_bank_id ? null : question.question_bank_id)}
                                        className="inline-flex items-center justify-center p-1 hover:bg-tertiary-surface rounded transistion-colors">
                                            <MoreVertical size={16} className="text-default-border"/>
                                    </button>
                                    {openMenuId === question.question_bank_id && (
                                        <div className="absolute right-0 top-full mt-1 bg-secondary-surface border border-default-border rounded shadow-lg z-10">
                                            <button onClick={() => onEdit(question.question_bank_id)} className="block w-full text-left px-4 py-2 text-sm text-default-text hover:bg-tertiary-surface transition-colors">Edit</button>
                                            <button onClick={() => onDelete(question.question_bank_id)} className="block w-full text-left px-4 py-2 text-sm text-system-red hover:bg-tertiary-surface transition-colors border-t border-default-border">Delete</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
