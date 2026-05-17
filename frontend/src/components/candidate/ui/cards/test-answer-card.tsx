import { TestMultipleChoiceCard } from "./test-multiple-choice-card";
import { Question } from "./question.type";
import { CodeEditorCard } from "./test-code-editor-card";
import { TestFillInTheBlanksCard } from "./test-fill-in-the-blanks-card";

export function TestAnswerCard({ question }: { question: Question }) {

    const answerComponents = {
        'multiple-choice': <TestMultipleChoiceCard question={question} />,
        'coding': <CodeEditorCard question={question} />,
        'fill-in-the-blank': <TestFillInTheBlanksCard question={question} />
    };

    const selectedComponent = answerComponents[question.type as keyof typeof answerComponents];
    
    const getHeaderTitle = () => {
        switch(question.type) {
            case 'multiple-choice':
                return 'Multiple Choice';
            case 'coding':
                return 'Code Editor';
            case 'fill-in-the-blank':
                return 'Fill in the Blanks';
            default:
                return 'Answer';
        }
    };

    return (
        <div>
            <div className="flex items-center justify-center w-36 h-14 tracking-wider bg-code-editor border-b border-default-border p-4">
                <h3 className="text-sm uppercase text-default-text">{getHeaderTitle()}</h3>
            </div>
            <div className="bg-code-editor w-3xl h-168 p-4 rounded-md">
                {selectedComponent}
            </div>
        </div>
    )
}