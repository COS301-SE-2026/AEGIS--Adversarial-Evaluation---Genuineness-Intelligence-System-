"use client"

import { useState } from "react";
import { X } from "lucide-react";
import MetaDataForm from "@/components/admin/ui/input/metadata-form";
import EditorPanel from "@/components/admin/ui/input/editor-panel";
import { Question_Categories, QuestionPayload } from "../../types/questions";


interface CreateQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeploy: (payload: QuestionPayload) => void;
}

export default function CreateQuestionModal({isOpen, onClose, onDeploy}: CreateQuestionModalProps) {
    const [title, setTitle] = useState("");
    const [category_id, setCategoryId] = useState<number>(0);
    const [difficulty, setDifficulty] = useState("Easy");
    const [tags, setTags] = useState("");
    const [maxScore, setMaxScore] = useState<number>(10);
    const [content, setContent] = useState("");
    const [correctAnswer, setCorrectAnswer] = useState("");

    if(!isOpen) return null;

    const resetFields = () => {
        setTitle("");
        setCategoryId(0);
        setDifficulty("Easy");
        setTags("");
        setMaxScore(10);
        setContent("");
        setCorrectAnswer("");
    }

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const payload = {
            title,
            category_id: category_id,
            difficulty,
            tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
            content,
            correct_answer: correctAnswer,
            created_at: new Date().toISOString()
        };

        onDeploy(payload);
        resetFields();
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
            <form
                onSubmit={handleSubmit}
                className="flex flex-col bg-background border border-tertiary-surface rounded-lg w-full max-w-6xl max-h-[90vh] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
            >
                <div className="flex justify-between items-center px-6 py-4 border border-tertiary-surface bg-secondary-surface">
                    <div>
                        <h2 className="text-xl text-default-text tracking-wide">
                            Initialize A New Question
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-default-border hover:text-system-red transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-5">
                            <MetaDataForm
                                title={title} setTitle={setTitle}
                                category_id={category_id} setCategoryId={setCategoryId}
                                categories={Question_Categories}
                                difficulty={difficulty} setDifficulty={setDifficulty}
                                tags={tags} setTags={setTags}
                                maxScore={maxScore} setMaxScore={setMaxScore}
                            />
                        </div>
                        <div className="lg:col-span-7">
                            <EditorPanel
                                content={content} setContent={setContent}
                                correctAnswer={correctAnswer} setCorrectAnswer={setCorrectAnswer}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-tertiary-surface bg-secondary-surface">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-default-border text-default-text rounded hover:bg-tertiary-surface transition-colors font-staatliches text-sm tracking-wider uppercase cursor-pointer"
                        >
                            Abort
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 bg-system-red text-default-text px-4 py-2 rounded font-staatliches text-sm tracking-widest uppercase transition-all duration-150 hover:shadow-glow-red hover:brightness-110 active:scale-95 cursor-pointer"
                        >
                            Deploy Question
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}