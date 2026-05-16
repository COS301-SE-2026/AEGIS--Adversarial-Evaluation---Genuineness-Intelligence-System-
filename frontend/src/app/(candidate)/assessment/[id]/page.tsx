import { Question } from "@/components/candidate/ui/cards/question.type";
import { TestDescriptionCard } from "@/components/candidate/ui/cards/test-description-card";


export default function AssessmentCompletionPage() {

   const mockQuestions: Question[] = [
  // Multiple Choice
  {
    questionId: 1,
    questionTitle: "JavaScript Promise Resolution",
    questionText: "What is the output of this code?\n\nconst p = Promise.resolve(5);\np.then(x => x * 2).then(x => console.log(x));",
    type: 'multiple-choice',
    options: [
      "5",
      "10",
      "undefined",
      "Promise { 10 }"
    ],
    correctAnswer: "10",
    tags: ["javascript", "promises", "async"],
    attempted: true
  },

  // Coding Question
  {
    questionId: 2,
    questionTitle: "Reverse a String Function",
    questionText: "Write a function that reverses a string without using the built-in reverse() method.\n\nExample: reverseString('hello') should return 'olleh'",
    type: 'coding',
    options: [],
    correctAnswer: "function reverseString(str) { return str.split('').reduce((rev, char) => char + rev, ''); }",
    tags: ["javascript", "strings", "algorithms"],
    attempted: false
  },

  // Fill in the Blank
  {
    questionId: 3,
    questionTitle: "Array Method Completion",
    questionText: "Complete the code:\n\nconst numbers = [1, 2, 3, 4];\nconst doubled = numbers._____(x => x * 2);\n// doubled = [2, 4, 6, 8]",
    type: 'fill-in-the-blank',
    options: ["map", "filter", "reduce", "forEach"],
    correctAnswer: "map",
    tags: ["javascript", "arrays", "functional-programming"],
    attempted: false
  }
];
    return (
        <main>
            <div>
                {mockQuestions.map((question) => (
                    <TestDescriptionCard key={question.questionId} question={question} />
                ))}
            </div>
        </main>
    );
}