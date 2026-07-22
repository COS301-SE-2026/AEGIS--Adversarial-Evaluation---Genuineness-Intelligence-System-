'use client';

import { Question } from "./question.type";
import { useRef, useState } from "react";

export function TestFillInTheBlanksCard({ question }: { question: Question }) {
    const [orderedOptions, setOrderedOptions] = useState<string[]>(() => [...question.options]);
    const dragIndexRef = useRef<number | null>(null);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => {
        dragIndexRef.current = index;
        setDraggingIndex(index);
    };

    const handleDragEnd = () => {
        dragIndexRef.current = null;
        setDraggingIndex(null);
        setOverIndex(null);
    };

    const handleDrop = (index: number) => {
        const fromIndex = dragIndexRef.current;
        if (fromIndex === null || fromIndex === index) {
            handleDragEnd();
            return;
        }

        const updated = [...orderedOptions];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(index, 0, moved);
        setOrderedOptions(updated);
        handleDragEnd();
    };

    return (
        <div className="flex flex-col h-full">
            <div>
                <h3 className="text-base tracking-widest uppercase mt-4 mb-6">Arrange The Answers In The Correct Order</h3>
            </div>
            <div className="flex flex-col gap-4">
                {orderedOptions.map((option, index) => (
                    <div
                        key={`option-${index}`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(event) => event.preventDefault()}
                        onDragEnter={() => setOverIndex(index)}
                        onDragLeave={() => setOverIndex((current) => (current === index ? null : current))}
                        onDrop={() => handleDrop(index)}
                        className={`flex items-center gap-4 rounded-md border p-4 cursor-move transition-all ${
                            draggingIndex === index
                                ? "border-blue-400 bg-blue-400/10 scale-[0.99]"
                                : overIndex === index
                                    ? "border-blue-300 bg-blue-300/10"
                                    : "border-default-border"
                        }`}
                    >
                        <span className="text-lg min-w-fit">{index + 1}.</span>
                        <span className="text-default-text">{option}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}