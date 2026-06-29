"use client"

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import MetaDataForm from "@/components/admin/ui/input/metadata-form";
import EditorPanel from "@/components/admin/ui/input/editor-panel";
import { Question_Categories, Mock_Questions } from "../../types/questions";

interface EditQuestionModalProps {
    question_id: number | null;
    onClose: () => void;
    onSave: (payload: any) => void;
}

export default function EditQuestionModal({question_id, onClose, onSave}: EditQuestionModalProps) {
    const [title, setTitle] = useState("");
    const [category_id, setCategoryId] = useState<number>(0);
    const [difficulty, setDifficulty] = useState("Easy");
    const [tags, setTags] = useState("");
    const [maxScore, setMaxScore] = useState<number>(10);
    const [content, setContent] = useState("");
    const [correctAnswer, setCorrectAnswer] = useState("");

    useEffect(() => {
        if(question_id === null) return;

        const questionTargeted = Mock_Questions.find((question) => question.question_bank_id === question_id);
        if(questionTargeted) {
            setTitle(questionTargeted.title);
            setCategoryId(questionTargeted.category_id);
            setDifficulty(questionTargeted.difficulty);
            setTags(Array.isArray(questionTargeted.tags) ? questionTargeted.tags.join(", ") : "");
            setMaxScore(questionTargeted.maximum_score || 10);
            setContent(questionTargeted.content);
            setCorrectAnswer(questionTargeted.correct_answer || "");
        }
    }, [question_id]);

    if(question_id === null) return null;

        const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const payload = {
            title,
            category_id: category_id,
            difficulty,
            tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
            content,
            maximum_score: maxScore,
            correct_answer: correctAnswer,
            updated_at: new Date().toISOString()
        };

        onSave(payload)
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
                            Edit Question
                        </h2>
                        <p className="text-[9px] text-default-text uppercase tracking-widest mt-1">
                            Override Data Cache
                        </p>
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
                            Abort Changes
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 bg-system-red text-default-text px-4 py-2 rounded font-staatliches text-sm tracking-widest uppercase transition-all duration-150 hover:shadow-glow-red hover:brightness-110 active:scale-95 cursor-pointer"
                        >
                            <Save size={16} />
                            Commit Changes
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}