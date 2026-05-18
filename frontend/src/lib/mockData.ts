import { Question } from "@/components/candidate/ui/cards/question.type";

export interface Assessment {
  assessmentId: number;
  title: string;
  description: string;
  num_questions: number;
  attempts: number;
  success_rate: number;
}

export interface CompletedAssessment extends Assessment {
  dateCompleted: string;
  graded: boolean;
}

// Mock assessments data
export const mockAssessments: Assessment[] = [
  { assessmentId: 1, title: "Test Assessment", description: "This is the first assessment", num_questions: 10, attempts: 3, success_rate: 80.97 },
  { assessmentId: 2, title: "JavaScript Basics", description: "Fundamentals of JavaScript programming", num_questions: 15, attempts: 2, success_rate: 92.5 },
  { assessmentId: 3, title: "React Fundamentals", description: "Core concepts of React framework", num_questions: 12, attempts: 1, success_rate: 88.33 },
  { assessmentId: 4, title: "CSS Advanced", description: "Advanced CSS styling techniques", num_questions: 20, attempts: 4, success_rate: 75.0 },
  { assessmentId: 5, title: "TypeScript Essentials", description: "TypeScript type system and features", num_questions: 14, attempts: 2, success_rate: 85.71 },
  { assessmentId: 6, title: "SQL Queries", description: "Database querying and optimization", num_questions: 18, attempts: 3, success_rate: 77.78 },
  { assessmentId: 7, title: "Web Security", description: "Security best practices for web apps", num_questions: 16, attempts: 5, success_rate: 68.75 },
  { assessmentId: 8, title: "Performance Optimization", description: "Optimizing web application performance", num_questions: 13, attempts: 2, success_rate: 84.62 },
];

// Mock completed assessments data for the report table
export const mockCompletedAssessments: CompletedAssessment[] = [
  { assessmentId: 1, title: "Test Assessment", description: "This is the first assessment", num_questions: 10, attempts: 3, success_rate: 80, dateCompleted: "12/05/2026", graded: true },
  { assessmentId: 2, title: "JavaScript Basics", description: "Fundamentals of JavaScript programming", num_questions: 15, attempts: 2, success_rate: 92, dateCompleted: "12/05/2026", graded: true },
  { assessmentId: 3, title: "React Fundamentals", description: "Core concepts of React framework", num_questions: 12, attempts: 1, success_rate: 0, dateCompleted: "12/05/2026", graded: true },
];

// Mock questions data mapped to assessment IDs
export const mockAssessmentQuestions: { [key: string]: Question[] } = {
  '1': [
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
    {
      questionId: 2,
      questionTitle: "Reverse a String Function",
      questionText: "Write a function that reverses a string without using the built-in reverse() method.\n\nExample: reverseString('hello') should return 'olleh'",
      type: 'coding',
      options: [],
      correctAnswer: "function reverseString(str) { return str.split('').reduce((rev, char) => char + rev, ''); }",
      tags: ["javascript", "strings", "algorithms"],
      attempted: true
    },
    {
      questionId: 3,
      questionTitle: "Array Method Completion",
      questionText: "Complete the code:\n\nconst numbers = [1, 2, 3, 4];\nconst doubled = numbers._____(x => x * 2);\n// doubled = [2, 4, 6, 8]",
      type: 'fill-in-the-blank',
      options: ["map", "filter", "reduce", "forEach"],
      correctAnswer: "map",
      tags: ["javascript", "arrays", "functional-programming"],
      attempted: true
    }
  ],
  '2': [
    {
      questionId: 4,
      questionTitle: "Variable Hoisting",
      questionText: "What will be printed to the console?\n\nconsole.log(x);\nvar x = 5;",
      type: 'multiple-choice',
      options: [
        "5",
        "undefined",
        "ReferenceError",
        "null"
      ],
      correctAnswer: "undefined",
      tags: ["javascript", "hoisting", "variables"],
      attempted: true
    },
    {
      questionId: 5,
      questionTitle: "Closure Definition",
      questionText: "What is a closure in JavaScript?",
      type: 'multiple-choice',
      options: [
        "A function that closes the program",
        "A function that has access to variables from its outer scope",
        "A way to hide variables permanently",
        "A deprecated JavaScript feature"
      ],
      correctAnswer: "A function that has access to variables from its outer scope",
      tags: ["javascript", "closures", "scope"],
      attempted: true
    },
    {
      questionId: 6,
      questionTitle: "Array Destructuring",
      questionText: "What does this code output?\n\nconst [a, b, c] = [1, 2, 3];\nconsole.log(b);",
      type: 'multiple-choice',
      options: ["1", "2", "3", "undefined"],
      correctAnswer: "2",
      tags: ["javascript", "es6", "destructuring"],
      attempted: true
    }
  ],
  '3': [
    {
      questionId: 7,
      questionTitle: "React Component Lifecycle",
      questionText: "Which lifecycle method is called after a component is mounted?",
      type: 'multiple-choice',
      options: [
        "componentWillMount",
        "componentDidMount",
        "componentWillUpdate",
        "render"
      ],
      correctAnswer: "componentDidMount",
      tags: ["react", "lifecycle", "hooks"],
      attempted: true
    },
    {
      questionId: 8,
      questionTitle: "Hooks in Functional Components",
      questionText: "Which hook is used to manage state in functional components?",
      type: 'multiple-choice',
      options: [
        "useEffect",
        "useState",
        "useContext",
        "useRef"
      ],
      correctAnswer: "useState",
      tags: ["react", "hooks", "state"],
      attempted: true
    },
    {
      questionId: 9,
      questionTitle: "Virtual DOM Purpose",
      questionText: "What is the primary purpose of React's Virtual DOM?",
      type: 'multiple-choice',
      options: [
        "To store data permanently",
        "To improve performance by minimizing direct DOM manipulation",
        "To replace the browser DOM",
        "To handle routing"
      ],
      correctAnswer: "To improve performance by minimizing direct DOM manipulation",
      tags: ["react", "virtual-dom", "performance"],
      attempted: true
    }
  ],
  '4': [
    {
      questionId: 10,
      questionTitle: "CSS Flexbox Direction",
      questionText: "What does the 'flex-direction: column' property do?",
      type: 'multiple-choice',
      options: [
        "Arranges items horizontally",
        "Arranges items vertically",
        "Creates a grid layout",
        "Hides flex items"
      ],
      correctAnswer: "Arranges items vertically",
      tags: ["css", "flexbox", "layout"],
      attempted: true
    },
    {
      questionId: 11,
      questionTitle: "CSS Grid Template Columns",
      questionText: "What does 'grid-template-columns: repeat(3, 1fr)' create?",
      type: 'multiple-choice',
      options: [
        "3 rows of equal height",
        "3 columns of equal width",
        "3 items stacked vertically",
        "A 3x3 grid"
      ],
      correctAnswer: "3 columns of equal width",
      tags: ["css", "grid", "layout"],
      attempted: false
    },
    {
      questionId: 12,
      questionTitle: "CSS Box Model",
      questionText: "Write the CSS property to set padding on all sides to 10px",
      type: 'fill-in-the-blank',
      options: ["margin: 10px", "padding: 10px", "border: 10px", "padding-all: 10px"],
      correctAnswer: "padding: 10px",
      tags: ["css", "box-model", "properties"],
      attempted: false
    }
  ],
  '5': [
    {
      questionId: 13,
      questionTitle: "TypeScript Type Annotation",
      questionText: "How do you annotate a variable as a string in TypeScript?",
      type: 'multiple-choice',
      options: [
        "let x: string = 'hello';",
        "let x = <string>'hello';",
        "let x: String = 'hello';",
        "Both A and B"
      ],
      correctAnswer: "let x: string = 'hello';",
      tags: ["typescript", "types", "annotations"],
      attempted: true
    },
    {
      questionId: 14,
      questionTitle: "TypeScript Interfaces",
      questionText: "What is the purpose of an interface in TypeScript?",
      type: 'multiple-choice',
      options: [
        "To define class inheritance",
        "To define the structure of an object",
        "To create instances of objects",
        "To declare variables"
      ],
      correctAnswer: "To define the structure of an object",
      tags: ["typescript", "interfaces", "types"],
      attempted: false
    },
    {
      questionId: 15,
      questionTitle: "Union Types",
      questionText: "What does 'string | number' represent in TypeScript?",
      type: 'multiple-choice',
      options: [
        "A string and number together",
        "Either a string or a number",
        "A string concatenated with a number",
        "An invalid type"
      ],
      correctAnswer: "Either a string or a number",
      tags: ["typescript", "union-types", "types"],
      attempted: false
    }
  ],
  '6': [
    {
      questionId: 16,
      questionTitle: "SQL SELECT Statement",
      questionText: "Write a query to select all columns from a 'users' table where age > 18",
      type: 'coding',
      options: [],
      correctAnswer: "SELECT * FROM users WHERE age > 18;",
      tags: ["sql", "select", "queries"],
      attempted: true
    },
    {
      questionId: 17,
      questionTitle: "SQL JOIN Types",
      questionText: "What is the difference between INNER JOIN and LEFT JOIN?",
      type: 'multiple-choice',
      options: [
        "INNER JOIN returns all rows, LEFT JOIN returns matching rows",
        "INNER JOIN returns matching rows, LEFT JOIN returns all rows from left table",
        "No difference",
        "INNER JOIN is faster"
      ],
      correctAnswer: "INNER JOIN returns matching rows, LEFT JOIN returns all rows from left table",
      tags: ["sql", "joins", "queries"],
      attempted: false
    },
    {
      questionId: 18,
      questionTitle: "SQL GROUP BY",
      questionText: "What is the purpose of the GROUP BY clause?",
      type: 'multiple-choice',
      options: [
        "To order results",
        "To group rows that have the same values",
        "To filter results",
        "To delete data"
      ],
      correctAnswer: "To group rows that have the same values",
      tags: ["sql", "groupby", "aggregation"],
      attempted: false
    }
  ],
  '7': [
    {
      questionId: 19,
      questionTitle: "HTTPS Encryption",
      questionText: "What is the main purpose of HTTPS?",
      type: 'multiple-choice',
      options: [
        "To make websites load faster",
        "To encrypt data transmitted between client and server",
        "To prevent all hacking attempts",
        "To cache website data"
      ],
      correctAnswer: "To encrypt data transmitted between client and server",
      tags: ["web-security", "https", "encryption"],
      attempted: true
    },
    {
      questionId: 20,
      questionTitle: "SQL Injection Prevention",
      questionText: "What is the best way to prevent SQL injection attacks?",
      type: 'multiple-choice',
      options: [
        "Use parameterized queries",
        "Disable all database access",
        "Don't use databases",
        "Use plain text for passwords"
      ],
      correctAnswer: "Use parameterized queries",
      tags: ["web-security", "sql-injection", "prevention"],
      attempted: false
    },
    {
      questionId: 21,
      questionTitle: "CORS Explanation",
      questionText: "What does CORS stand for and why is it important?",
      type: 'fill-in-the-blank',
      options: [
        "Cross-Origin Request Security",
        "Cross-Origin Resource Sharing",
        "Cross-Origin Response System",
        "Cross-Origin Routing Service"
      ],
      correctAnswer: "Cross-Origin Resource Sharing",
      tags: ["web-security", "cors", "headers"],
      attempted: false
    }
  ],
  '8': [
    {
      questionId: 22,
      questionTitle: "Code Splitting",
      questionText: "What is code splitting in web applications?",
      type: 'multiple-choice',
      options: [
        "Breaking code into multiple files",
        "Loading code only when needed to improve performance",
        "Separating frontend and backend code",
        "All of the above"
      ],
      correctAnswer: "Loading code only when needed to improve performance",
      tags: ["performance", "optimization", "bundling"],
      attempted: true
    },
    {
      questionId: 23,
      questionTitle: "Lazy Loading",
      questionText: "What is lazy loading?",
      type: 'multiple-choice',
      options: [
        "Loading all assets at once",
        "Deferring the loading of non-critical resources until they're needed",
        "Loading resources slowly",
        "Skipping resource loading"
      ],
      correctAnswer: "Deferring the loading of non-critical resources until they're needed",
      tags: ["performance", "optimization", "loading"],
      attempted: false
    },
    {
      questionId: 24,
      questionTitle: "Cache Strategy",
      questionText: "Which caching strategy is best for static assets with version numbers?",
      type: 'multiple-choice',
      options: [
        "No-cache",
        "Cache forever",
        "Cache with version/hash in filename",
        "Always revalidate"
      ],
      correctAnswer: "Cache with version/hash in filename",
      tags: ["performance", "caching", "optimization"],
      attempted: false
    }
  ]
};
