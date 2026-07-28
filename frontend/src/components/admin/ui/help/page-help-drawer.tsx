"use client";

import { HelpCircle, X, ChevronRight } from "lucide-react";

export interface HelpItem{
    title: string;
    body: string;
}

export interface HelpFaq{
    question: string;
    answer: string;
}

export interface PageHelpConfig{
    title: string;
    description: string;
    steps: HelpItem[];
    faq?: HelpFaq[];
    footerLabel?: string;
    footerHref?: string;
}

interface PageHelpDrawerProps{
    open: boolean;
    onClose: () => void;
    config: PageHelpConfig;
}

const PageHelpDrawer = ({
    open,
    onClose,
    config
}: Readonly<PageHelpDrawerProps>)=>{
    if (!open) return null;

    return (
    <div className="fixed inset-0 z-50 flex justify-start">
        <button 
            type="button" 
            aria-label="Close help drawer" 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}
        />
            <aside className="relative w-full max-w-md h-full bg-background border-r border-default-border overflow-hidden flex flex-col">                
                <div className="flex items-center justify-between p-6 border-b border-default-border bg-background">
                    <h2 className="text-xl font-staatliches tracking-wide flex items-center gap-3 text-default-text">
                        <span className="p-2 rounded-full">
                            <HelpCircle size={20}/>
                        </span>
                        {config.title}
                    </h2>

                    <button type="button" 
                        onClick={onClose} 
                        className="p-2 rounded hover:text-system-red hover text-default-text" aria-label="Close help"
                    >
                        <X size={20}/>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-default-text">
                    <section>
                        <h3 className="text-lg tracking-widest text-system-red mb-4">
                            How do I use it?
                        </h3>

                        <ul className="space-y-5">
                        {config.steps.map((step, index) => (
                            <li key={step.title} className="flex gap-4 items-start">
                            <div className="w-6 h-6 rounded  text-default-text flex items-center justify-center shrink-0 text-sm">
                                {index + 1}
                            </div>
                            <div>
                                <strong className="text-white-smoke block mb-1 font-medium tracking-wide">
                                {step.title}
                                </strong>
                                <span className="opacity-80">{step.body}</span>
                            </div>
                            </li>
                        ))}
                        </ul>
                    </section>

                    {config.faq?.length ? (
                        <section className="bg-background p-5 rounded border border-default-border">
                            <h3 className="text-lg font-staatliches tracking-widest text-system-red mb-4">
                                Frequently Asked Questions
                            </h3>
                            <div className="space-y-6">
                                {config.faq.map((item) => (
                                <div key={item.question}>
                                    <h4 className=" text-default-text mb-1 tracking-wider">
                                    {item.question}
                                    </h4>
                                    <p className="text-default-text opacity-80 mt-1 leading-relaxed">
                                    {item.answer}
                                    </p>
                                </div>
                                ))}
                            </div>
                        </section>
                    ) : null}
                </div>

                {config.footerHref && config.footerLabel ? (
                    <div className="p-6 border-t border-default-border bg-background">
                        <a href={config.footerHref} className="text-default-text hover:text-system-red font-medium text-sm flex items-center gap-1 transition-colors uppercase tracking-widest font-staatliches">
                        {config.footerLabel}
                        <ChevronRight size={16}/>
                        </a>
                    </div>
                ) : null}                
            </aside>
        </div>
    )
}

export default PageHelpDrawer