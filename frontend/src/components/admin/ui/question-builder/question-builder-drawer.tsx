"use client"

import { ReactNode } from "react";
import { X, Save } from "lucide-react"

interface QuestionBuilderDrawerProps {
    open: boolean;
    title?: string;
    isSaving?: boolean;
    onClose: () => void;
    onSave: () => void;
    children: ReactNode;
}

export default function QuestionBuilderDrawer({
    open, 
    title = "Create Question",
    onClose,
    onSave,
    children
 }: QuestionBuilderDrawerProps) {

    return (
        <>
            <div
                className={`fixed insert-0 z-40 bg-background/70 backdrop:blur-sm transition-opacity duration-300
                    ${open
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                }`}
                onClick={onClose}
            />

            <aside
                className={`fixed right-0 top-0 z-50 flex flex-col h-screen w-full max-w-5xl border border-tertiary-surface bg-secondary-surface transition-transform duration-300 ease-out
                    ${open 
                        ? "translate-x-0"
                        : "translate-x-full"
                }`}
            >
                <header className="flex items-ceneter justify-between border-b border-tertiary-surface px-8 py-5">
                   
                    <div>
                        <h2 className="text-2xl tracking-widest">
                            {title}
                        </h2>
                        <p className="mt-1 text-sm text-default-border">
                            Configure your assessment question.
                        </p>
                    </div>

                    <button 
                        onClick={onClose}
                        className="text-default-border hover:text-system-red transition-colors cursor-pointer"
                    >
                        <X size={22}/>
                    </button>

                </header>

                <main className="felx-1 overflow-y-auto px-8 py-8">
                    {children}
                </main>

                <footer className="flex items center sticky botton-0 justify-end gap-4 border-t border-tertiary-surface bg-secondary-surface px-8 py-5">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="rounded border border-default-border px-5 py-2 transition hover:bg-tertiary-surface cursor-pointer"
                    
                    >
                        <h3 className="tracking-widest">
                            Cancel
                        </h3>
                    </button>

                    <button 
                        type="button"
                        onClick={onSave}
                        className="flex items-center gap-2 rounded bg-system-red px-5 py-2 transition disabled:opacity-50 cursor-pointer"
                    >
                        <Save size={16}/>
                        Save
                    </button>
                    
                </footer>
            </aside>
        </>
    )
}