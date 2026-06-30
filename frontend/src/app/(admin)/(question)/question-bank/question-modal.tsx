"use client"

import { useState } from "react";
import { X, Save } from "lucide-react";
import MetaDataForm from "@/components/admin/ui/input/metadata-form";
import EditorPanel from "@/components/admin/ui/input/editor-panel";
import { QuestionBank, QuestionCategory, QuestionPayload } from "../../types/questions";


interface QuestionModalProps {
    isOpen: boolean;
    mode: "create" | "edit"
    question_id?: number | null;
    questions: QuestionBank[];
    categories: QuestionCategory[];
    onClose: () => void;
    onSubmit: (payload: QuestionPayload) => void;
}

export default function QuestionModal({isOpen, mode, question_id, questions, categories, onClose, onSubmit}: QuestionModalProps) {
    
    const questionTargeted = 
    mode === "edit" && question_id !== null ?  
    questions.find((question) => question.question_bank_id === question_id):
    null;
        
    const [title, setTitle] = useState(questionTargeted?.title || "");
    const [category_id, setCategoryId] = useState<number>(questionTargeted?.category_id || 0);
    const [difficulty, setDifficulty] = useState(questionTargeted?.difficulty || "Easy");
    const [tags, setTags] = useState(Array.isArray(questionTargeted?.tags) ? questionTargeted.tags.join(", ") : "");
    const [maxScore, setMaxScore] = useState<number>(questionTargeted?.maximum_score || 10);
    const [content, setContent] = useState(questionTargeted?.content || "");
    const [correctAnswer, setCorrectAnswer] = useState(questionTargeted?.correct_answer || "");
    

    if(!isOpen) return null;

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const standardPayload = {
            title,
            category_id: category_id,
            difficulty,
            tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
            content,
            correct_answer: correctAnswer,
        };

        const payload = mode === "create" ?
            {...standardPayload, created_at: new Date().toISOString()} :
            {...standardPayload, updated_at: new Date().toISOString()}

        onSubmit(payload);
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
                            {mode === "create" ? "Initialize A New Question" : `Edit Question: ${question_id}`}
                        </h2>
                        {mode === "edit" && (
                            <p className="text-[9px] text-default-text uppercase tracking-widest mt-1">
                                Override Data Cache
                            </p>
                        )}
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
                                categories={categories}
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
                            {mode === "create" ? "Abort" : "Abort Changes"}
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 bg-system-red text-default-text px-4 py-2 rounded font-staatliches text-sm tracking-widest uppercase transition-all duration-150 hover:shadow-glow-red hover:brightness-110 active:scale-95 cursor-pointer"
                        >
                            {mode === "edit" && <Save size={16}/>}
                            {mode === "create" ? "Deploy Question" : "Commit Changes"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}