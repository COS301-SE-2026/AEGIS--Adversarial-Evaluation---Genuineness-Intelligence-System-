"use client"

import { QuestionCategory } from "@/app/(admin)/types/questions"
import { QuestionBuilderState } from "@/app/(admin)/types/question-builder";
import { useState } from "react";


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
    const isFillBlanks = question.type === "FILL_BLANKS";
    const [tagsInput, setTagsInput] = useState("");

    const addTag = (raw: string) => {
        const tag = raw.trim();

        if (!tag) return;
        if (question.tags.includes(tag)) {
            setTagsInput("");
            return;
        }

        update("tags", [...question.tags, tag]);
        setTagsInput("");

    };

    const removeTag = (tag: string) => {
        update("tags", question.tags.filter(tg => tg !== tag));
    };

    const handleKeyDown = (element: React.KeyboardEvent<HTMLInputElement>) => {
        if (element.key === "," || element.key === "Enter") {
            element.preventDefault();
            addTag(tagsInput);
        }

        if(element.key === "Backspace" && tagsInput === "" && question.tags.length > 0) {
            removeTag(question.tags[question.tags.length - 1]);
        }

    }

    const handlePaste = (element: React.ClipboardEvent<HTMLInputElement>) => {
        element.preventDefault();

        const pasted = element.clipboardData.getData("text");

        const newTags = pasted.split(",").map(tag => tag.trim()).filter(Boolean);

        const merged = [
            ...new Set([
                ...question.tags,
                ...newTags
            ])
        ];

        update("tags", merged);
    }



    return (
        <div className="space-y-6 bg-secondary-surface p-6 rounded-lg border border-tertiary-surface">
            <h2 className="text-xl text-default-text tracking-wider border-b border-tertiary-surface pb-2">
                Question Metadata
            </h2>
            
            <div className="space-y-2">
                <label 
                    htmlFor="question-title"
                    className="block text-xs uppercase tracking-wider text-default-border">
                    Question Title
                </label>
                <input
                    id="question-title"
                    type="text"
                    value={question.title}
                    onChange={(event) => update("title", event.target.value)}
                    placeholder="e.g ZigZag Conversion"
                    className="w-full px-4 py-2 bg-background border border-default-border rounded text-default-text text-sm focus:outline-none focus:border-system-red transition-colors"
                />
            </div>
            {!isFillBlanks && (
            <div className="flex-1 flex flex-col bg-secondary-surface rounded-lg ">
                <label
                    htmlFor="question-description"
                    className="block text-xl text-default-text tracking-widest border-b border-tertiary-surface pb-2 mb-4"
                >
                    Description
                </label>
                <textarea
                    id="question-description"
                    value={question.content}
                    onChange={(event) => update("content", event.target.value)}
                    placeholder="Describe the constraints, requirements and edge cases here..."
                    className="w-full flex-1 min-h-30 p-4 bg-background border border-default-border rounded text-default-text text:sm focus:outline-none focus:border-system-red transition-colors resize-y"
                />
            </div>
            )}
            <div className="space-y-2">
                <label 
                    htmlFor="question-category"
                    className="block text-xs text-default-border uppercase tracking-wider"
                >   
                    Category
                </label>
                <select
                    id="question-category"
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

            <fieldset className="space-y-2">
                <legend className="block text-xs uppercase tracking-wider text-default-border">Difficulty</legend>
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
            </fieldset>

            <div className="space-y-2">
                <label 
                    htmlFor="question-score"
                    className="block text-xs uppercase tracking-wider text-default-border"
                >
                    Score Allocation
                </label>
                <input
                    id="question-score"
                    type="number"
                    value={question.maximum_score || ""}
                    onChange={(event) => update("maximum_score", Number(event.target.value))}
                    placeholder="e.g. 14"
                    className="w-full px-4 py-2 bg-background border-default-border rounded text-default-text text-sm focus:outline-none focus:border-system-red transition-colors"
                />
            </div>

            <div className="space-y-2">
                <label 
                    htmlFor="question-tags"
                    className="block text-xs uppercase tracking-wider text-default-border"
                >
                    Indexed Tags  (Press <kbd>,</kbd> OR <kbd>Enter</kbd> to add a tag)
                </label>
                <div className="rounded border border-default-border bg-background p-3 focus-within:border-system-red transition-colors">
                    <div className="flex flex-wrap gap-2 mb-2">
                        {question.tags.map(tag => (
                            <span
                                key={tag}
                                className="flex items-center gap-2 rounded-md px-3 py-1 text-xs text-default-text"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="text-default-border hover:text-system-red transition-colors"
                                >
                                    x
                                </button>
                            </span>
                        ))}
                        <input
                            id="question-tag"
                            type="text"
                            value={tagsInput}
                            onChange={(element) => setTagsInput(element.target.value)}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            placeholder={question.tags.length === 0 ?
                                "Type a tag" :
                                ""
                            }
                            className="flex-1 min-w-30 bg-transparent outline-none text-default-text text-sm"
                        />
                    </div>
                </div>

                    
            </div>
        </div>
    )
}