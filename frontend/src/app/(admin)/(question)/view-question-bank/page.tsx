"use client"
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/layouts/sidebar";
import AdminTopbar from "@/components/admin/layouts/topbar";
import QuestionFilters from "@/components/admin/ui/input/question-filter";
import QuestionTable from "@/components/admin/ui/cards/question-table";
import { Plus, Menu, X} from "lucide-react";
import { Mock_Questions, Question_Categories } from "../../types/questions";

export default function ViewQuestionsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<"title"|"category"|"difficulty"|null>(null);
  const [sortDirection, setSortDirection] = useState<"asc"|"desc">("asc");

  const categoriesMap = useMemo( () => { //use memo caches the results for quicker sorting
    return Question_Categories.reduce((accumulator, currentCategory) => {
      accumulator[currentCategory.category_id] = currentCategory.category_name;
      return accumulator;
    }, {} as Record<number, string>); // this tells the compiler that the empty starting object will map numeric IDs to string names. Objects keys must always be strings in Typescript
  }, []);

  const questionsFiltered = Mock_Questions.filter((question) => {
    const matchTag = Array.isArray(question.tags) ?
    question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) :
    typeof question.tags === "string" ?
    question.tags.toLowerCase().includes(searchTerm.toLowerCase()):
    false;

    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          matchTag;

    const matchesCategory = categoryFilter === "all" || String(question.category_id) === categoryFilter;
    const matchesDifficulty = difficultyFilter === "all" || question.difficulty === difficultyFilter;
    return matchesSearch && matchesCategory && matchesDifficulty;
  }).sort ((a, b) => {
    if(!sortColumn) return 0;
    let aValue: string | number = "";
    let bValue: string | number = "";

    if(sortColumn === "title") {
      aValue = a.title.toLowerCase();
      bValue = b.title.toLowerCase();
    }
    else if (sortColumn === "category") {
      aValue = (categoriesMap[a.category_id] || "").toLowerCase();
      bValue = (categoriesMap[b.category_id] || "").toLowerCase();
    }
    else {
      const difficultyOrder = {"Easy" : 1, "Medium" : 2, "Hard" : 3};
      aValue = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0;
      aValue = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0;
    }

    if(aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1;
    }

    if(bValue > aValue) {
      return sortDirection === "asc" ? 1 : -1;
    }

    return 0;
  });

  const sortHandle = (column: "title" | "category" | "difficulty") => {
    if(sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    }
    else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const clearFiltersHandle = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setDifficultyFilter("all");
    setCurrentPage(1);
  }

  const totalNumberOfPages = Math.ceil(questionsFiltered.length / itemsPerPage)
  const sectionedQuestions = questionsFiltered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  return (
    <div className="flex min-h-screen bg-background">
      <div className="fixed md:static top-0 left-0 w-55 h-screen md:min-h-screen z-50 transform transition-transform md:transform-none">
        <AdminSidebar/>
      </div>

      <div className="flex-1 flex flex-col w-full">
        <AdminTopbar onNewAssessment={() => {}}/>

        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-content items-start sm:items-center gap-4 mb-6 sm:mb-8">
              <button onClick={() => router.push("/question/create")} className="flex items-center gap-2 bg-default-text text-background hover:bg-transparent hover:text-system-red  hover:border-system-red  px-4 py-2 rounded transition-colors text-sm sm:text-base duration-300 cursor-pointer">
                <Plus size={18} className="sm:w-5 sm:h-5"/>
                <span className="hidden sm:inline">New Question</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>

            <QuestionFilters
              searchTerm={searchTerm}
              onSearchChange={(value) => {setSearchTerm(value); setCurrentPage(1);}}
              categoryFilter={categoryFilter}
              onChangeCategory={(value) => {setCategoryFilter(value); setCurrentPage(1);}}
              categories={Question_Categories}
              difficultyFilter={difficultyFilter}
              onDifficultyChange={(value) => {setDifficultyFilter(value); setCurrentPage(1);}}
              onClearFilters={clearFiltersHandle}
            />

            <QuestionTable
              questions={sectionedQuestions}
              categoryMap={categoriesMap}  
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={sortHandle}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onEdit={(id) => {router.push(`/question/edit/${id}`); setOpenMenuId(null);}}
              onDelete={(id) => {console.log("Delete question ID:", id); setOpenMenuId(null);}}

            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 mt-10 border border-t-0 border-l-0 border-r-0 border-default-border rounded-b-lg text-sm text-default-text">
              <div>
                Showing{" "}
                <span className="font-medium text-default-text">
                  {questionsFiltered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                </span>
                {" "} to {" "}
                <span className="font-medium text-default-text">
                  {Math.min(currentPage * itemsPerPage, questionsFiltered.length)}
                </span>
                {" "} of {" "}
                <span className="font-medium text-default-text"></span>
                {" "}questions
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded border border-default-border bg-tertiary-surface hover:bg-background disabled:opacity-40 disabled:hover:bg-tertiary-surface disabled:cursor-not-allowed transition-colors text-default-text">
                  Prev
                </button>

                <div className="hidden sm:flex iterms-center gap-1">
                  {Array.from({length: totalNumberOfPages}, (_, i ) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded border transition-colors entry-animantion
                        ${currentPage === page ? 
                          "bg-system-red text-default-text" :
                          "bg-tertiary-surface border-default-border text-default-text"
                        }`}
                    >
                      {page}

                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalNumberOfPages))}
                  disabled={currentPage === totalNumberOfPages || totalNumberOfPages === 0}
                  className="px-3 py-2 rounded border border-default-border bg-tertiary-surface hover:bg-background disabled:opacity-40 disabled:hover:bg-tertiary-surface disabled:cursor-not-allowed transition-colors text-default-text"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main> 
      </div>
    </div>
  );
}
