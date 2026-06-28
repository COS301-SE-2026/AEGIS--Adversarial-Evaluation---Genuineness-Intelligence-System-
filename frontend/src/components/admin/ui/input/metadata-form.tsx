"use client"

import { QuestionCategory } from "@/app/(admin)/types/questions"
import { Tags } from "lucide-react";

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
        <div className="">
            <h2 className="">
                Question Metadata
            </h2>
            
            <div className="">
                <label className="">Question Title</label>
                <input
                    type="text"
                    value="title"
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g ZigZag Conversion"
                    className=""
                />
            </div>

            <div className="">
                <label className="">Category</label>
                <select
                    value={category_id}
                    onChange={(event) => setCategoryId(Number(event.target.value))}
                    className=""
                >
                    <option>Select Category...</option>
                    {categories.map((category)=> (
                        <option key={category.category_id} value={category.category_id}>{category.category_id}</option>
                    ))}
                </select>
            </div>

            <div className="">
                <label className="">Difficulty</label>
                <div className="">
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
                                className={``}
                            >
                                {level}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="">
                <label className="">Score Allocation</label>
                <input
                    type="number"
                    value={maxScore || ""}
                    onChange={(event) => setMaxScore(Number(event.target.value))}
                    placeholder="e.g. 14"
                    className=""
                />
            </div>

            <div className="">
                <label className="">Indexed Tags (Comma Seperated)</label>
                <input
                    type="text"
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="e.g. 14"
                    className=""
                />
            </div>
        </div>
    )
}