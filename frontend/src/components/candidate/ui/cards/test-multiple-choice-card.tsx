'use client';
import { Question } from "./question.type";
import React, { useState } from "react";

export function TestMultipleChoiceCard({question}: {question: Question}) {

    const options = question.options;
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    return (
        <div>
            <div>
                <h3 className="text-base tracking-widest uppercase mt-4 mb-6">Choose The Most Correct answer</h3>
            </div>
            <div className="flex flex-col gap-4">
                {options.map((option, index) => (
                    <label 
                        key={index} 
                        className={`flex items-center gap-4 p-4 rounded-md cursor-pointer border transition-colors ${
                            selectedOption === option ? 'border-blue-400' : 'border-default-border'
                        }`}
                    >
                        <input
                            type="radio"
                            name="multiple-choice"
                            value={option}
                            checked={selectedOption === option}
                            onChange={() => setSelectedOption(option)}
                            className="hidden"
                        />
                        <span className="text-lg min-w-fit">{String.fromCharCode(65 + index)}.</span>
                        <span className="text-default-text">{option}</span>
                    </label>
                ))}
            </div>
        </div>
    )
}