"use client"

import { QuestionCategory } from "@/app/(admin)/types/questions"
import { QuestionBuilderState } from "@/app/(admin)/types/question-builder";


type UniversalFieldsProps = Readonly <{
    question: QuestionBuilderState;
    categories: QuestionCategory[];
    update<K extends keyof QuestionBuilderState>(
        key: K,
        value: QuestionBuilderState[K]
    ) : void
}>


export default function UniversalFields({
    question,
    categories,
    update,
}: UniversalFieldsProps) {
    
    const difficulties = ["Easy", "Medium", "Hard"] as const;

    return (
        <div className="space-y-6 bg-secondary-surface p-6 rounded-lg border border-tertiary-surface">
            <h2 className="text-xl text-default-text tracking-wider border-b border-tertiary-surface pb-2">
                Question Metadata
            </h2>
            
            <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider text-default-border">Question Title</label>
                <input
                    type="text"
                    value={question.title}
                    onChange={(event) => update("title", event.target.value)}
                    placeholder="e.g ZigZag Conversion"
                    className="w-full px-4 py-2 bg-background border border-default-border rounded text-default-text text-sm focus:outline-none focus:border-system-red transition-colors"
                />
            </div>

            <div className="flex-1 flex flex-col bg-secondary-surface rounded-lg ">
                <h2 className="text-xl text-default-text tracking-wider border-b border-tertiary-surface pb-2 mb-4">
                    Description
                </h2>
                <textarea
                    value={question.content}
                    onChange={(event) => update("content", event.target.value)}
                    placeholder="Describe the constraints, requirements and edge cases here..."
                    className="w-full flex-1 min-h-30 p-4 bg-background border border-default-border rounded text-default-text text:sm focus:outline-none focus:border-system-red transition-colors resize-y"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-xs text-default-border uppercase tracking-wider">Category</label>
                <select
                    value={question.category_id}
                    onChange={(event) => update("category_id",Number(event.target.value))}
                    className="w-full px-4 py-2 bg-background border-default-border rounded text-default-text text-sm focus:outline-none focus:border-system-red transition-colors cursor-pointer"
                >
                    <option value={0} disabled>Select Category...</option>
                    {categories.map((category)=> (
                        <option key={category.category_id} value={category.category_id}>{category.category_name}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider text-default-border">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                    {difficulties.map((level) => {
                        const isActive = question.difficulty === level;
                        
                        const difficultyColors = {
                            Easy : "border-status-success text-status-success bg-status-success/10",
                            Medium: "border-status-warning text-status-warning bg-status-warning/10",
                            Hard: "border-system-red text-system-red bg-system-red/10",
                        }

                        const activeColor = difficultyColors[level];
                            
                        return (
                            <button
                                type="button"
                                key={level}
                                onClick={() => update("difficulty", level as QuestionBuilderState["difficulty"])}
                                className={`py-2 text-center rounded font-staatliches text-sm tracking-wider border transition-all duration-150 cursor-pointer
                                    ${isActive ? activeColor : "border-default-border/45 text-default-border hover:text-default-text hover:border-default-border"
                                    }`}
                            >
                                {level}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider text-default-border">Score Allocation</label>
                <input
                    type="number"
                    value={question.maximum_score || ""}
                    onChange={(event) => update("maximum_score", Number(event.target.value))}
                    placeholder="e.g. 14"
                    className="w-full px-4 py-2 bg-background border-default-border rounded text-default-text text-sm focus:outline-none focus:border-system-red transition-colors"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider text-default-border">Indexed Tags (Comma Seperated)</label>
                <input
                    type="text"
                    value={question.tags.join(", ")}
                    onChange={(event) => update("tags", event.target.value.split(",").map(tag => tag.trim()).filter(Boolean))}
                    placeholder="e.g. Algorithm, Python"
                    className="w-full px-4 py-2 bg-background border-default-border rounded text-default-text text-sm focus:outline-none focus:border-system-red transition-colors"
                />
            </div>
        </div>
    )
}