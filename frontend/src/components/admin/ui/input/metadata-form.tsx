"use client"

import { QuestionCategory } from "@/app/(admin)/types/questions"


interface MetadataFormProps {
    title: string,
    setTitle: (value: string) => void,
    category_id: number,
    setCategoryId: (id: number) => void,
    categories: QuestionCategory[],
    difficulty: string,
    setDifficulty: (value: string) => void,
    tags: string,
    setTags: (value: string) => void,
    maxScore: number,
    setMaxScore: (value: number) => void
}

export default function MetaDataForm({
    title, setTitle,
    category_id, setCategoryId, categories,
    difficulty, setDifficulty,
    tags, setTags,
    maxScore, setMaxScore,
}: MetadataFormProps) {
    
    const difficulties = ["Easy", "Medium", "Hard"];

    return (
        <div className="space-y-6 bg-secondary-surface p-6 rounded-lg border border-tertiary-surface">
            <h2 className="text-xl text-default-text tracking-wider border-b border-tertiary-surface pb-2">
                Question Metadata
            </h2>
            
            <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider text-default-border">Question Title</label>
                <input
                    type="text"
                    value="title"
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g ZigZag Conversion"
                    className="w-full px-4 py-2 bg-background border border-default-border rounded text-default-border text-sm focus:outline-none focus:border-system-red transition-colors"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-xs text-default-border uppercase tracking-wider">Category</label>
                <select
                    value={category_id}
                    onChange={(event) => setCategoryId(Number(event.target.value))}
                    className="w-full px-4 py-2 bg-background border-default-border rounded text-default-text text-xs focus:outline-none focus:border-system-red transition-colors cursor-pointer"
                >
                    <option>Select Category...</option>
                    {categories.map((category)=> (
                        <option key={category.category_id} value={category.category_id}>{category.category_id}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider text-default-border">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                    {difficulties.map((level) => {
                        const isActive = difficulty === level;
                        const activeColors =
                            level === "Easy" ? "border-status-success text-status-success bg-status-success/10" :
                            level === "Medium" ? "border-status-warning text-status-warning bg-status-warning/10" :
                            "border-system-red text-system-red bg-system-red/10";

                        return (
                            <button
                                type="button"
                                key={level}
                                onClick={() => setDifficulty(level)}
                                className={`py-2 text-center rounded font-staatliches text-sm tracking-wider border transition-all duration-150 cursor-pointer
                                    ${isActive ? activeColors : "border-default-border/45 text-default-border hover:text-default-text hover:border-default-border"
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
                    value={maxScore || ""}
                    onChange={(event) => setMaxScore(Number(event.target.value))}
                    placeholder="e.g. 14"
                    className="w-full px-4 py-2 bg-background border-default-border rounded text-default-text text-xs focus:outline-none focus:border-system-red transition-colors"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider text-default-border">Indexed Tags (Comma Seperated)</label>
                <input
                    type="text"
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="e.g. 14"
                    className="w-full px-4 py-2 bg-background border-default-border rounded text-default-text text-xs focus:outline-none focus:border-system-red transition-colors"
                />
            </div>
        </div>
    )
}