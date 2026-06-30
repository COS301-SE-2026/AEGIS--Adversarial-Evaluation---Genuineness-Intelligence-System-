"use client"
import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/layouts/sidebar";
import AdminTopbar from "@/components/admin/layouts/topbar";
import QuestionFilters from "@/components/admin/ui/input/question-filter";
import QuestionTable from "@/components/admin/ui/cards/question-table";
import QuestionModal from "./question-modal";
import { Plus } from "lucide-react";
import { Mock_Questions, QuestionCategory, QuestionPayload } from "../../types/questions";
import { apiGet } from "@/lib/apiClient";

export default function ViewQuestionsPage() {
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<"title"|"category"|"difficulty"|null>(null);
  const [sortDirection, setSortDirection] = useState<"asc"|"desc">("asc");
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editQuestionId,setEditQuestionId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const response = await apiGet<QuestionCategory[]>("/api/v1/categories/");
        if (isMounted) {
          setCategories(response);
        }
      } catch (error) {
        console.error("Failed to load question categories:", error);
      }
    };
    void loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const categoriesMap = useMemo( () => { //use memo caches the results for quicker sorting
    return categories.reduce((accumulator, currentCategory) => {
      accumulator[currentCategory.category_id] = currentCategory.category_name;
      return accumulator;
    }, {} as Record<number, string>); // this tells the compiler that the empty starting object will map numeric IDs to string names. Objects keys must always be strings in Typescript
  }, [categories]);

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
      bValue = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0;
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
  const handleSavedChanges = (updatedData: QuestionPayload) => {
    console.log("Saving changes:", updatedData);
    //set up api point
    setEditQuestionId(null);
  }

  const handleDeployment = (newQuestion: QuestionPayload) => {
    console.log("Deploying New Question:", newQuestion);
     // In the real application, you would append local array state changes here, 
    // or trigger an automatic data mutation reload query to fetch your database records.
    setIsCreateOpen(false);
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
              <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-default-text text-background border border-transparent hover:bg-transparent hover:text-system-red  hover:border-system-red hover:boarder-2 px-4 py-2 rounded transition-colors text-sm sm:text-base duration-300 cursor-pointer">
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
              categories={categories}
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
              onEdit={(id) => {setEditQuestionId(id); setOpenMenuId(null);}}
              onDelete={(id) => {console.log("Delete question ID:", id); setOpenMenuId(null);}}

            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-2 mt-10 border border-t border-default-border rounded-b-lg text-sm text-default-text">
              <div className="text-default-text order-2 sm:order-1">
                Page <span className="font-semibold">{currentPage}</span> {" "}
                of {" "}<span className="font-semibold">{totalNumberOfPages}</span>
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-3 order-3 sm:order-2 flex-wrap">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="text-default-text text-xs sm:text-sm disabled:text-default-border px-2 py-1 rounded border border-default-border bg-tertiary-surface hover:bg-background disabled:opacity-40 disabled:hover:bg-tertiary-surface disabled:cursor-not-allowed transition-colors ">
                  «
                </button>
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="text-default-text text-xs sm:text-sm disabled:text-default-border px-2 py-1 rounded border border-default-border bg-tertiary-surface hover:bg-background disabled:opacity-40 disabled:hover:bg-tertiary-surface disabled:cursor-not-allowed transition-colors">
                  ‹
                </button>

                {Array.from({length: Math.min(3, totalNumberOfPages)}, (_,i) => {
                  const pageNumber = (currentPage < 2 || currentPage === 2 ) ? i + 1 : currentPage + i - 1;
                  return (pageNumber < totalNumberOfPages || pageNumber === totalNumberOfPages) ? pageNumber : null;
                }).filter((pageNumber): pageNumber is number => pageNumber !== null).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transitions-colors
                      ${currentPage === pageNumber ?
                        "bg-default-text text-background" :
                        "text-default-text hover:bg-tertiary-surface"
                      }`}>
                      {pageNumber}
                    </button>
                ))}

                <button
                  onClick={() => setCurrentPage(Math.min(totalNumberOfPages, currentPage + 1))}
                  disabled={currentPage === totalNumberOfPages || totalNumberOfPages === 0}
                  className="text-default-text text-xs sm:text-sm disabled:text-default-border px-2 py-1 rounded border border-default-border bg-tertiary-surface hover:bg-background disabled:opacity-40 disabled:hover:bg-tertiary-surface disabled:cursor-not-allowed transition-colors">
                  ›
                </button>
                <button 
                  onClick={() => setCurrentPage(totalNumberOfPages)}
                  disabled={currentPage === totalNumberOfPages || totalNumberOfPages === 0}
                  className="text-default-text text-xs sm:text-sm disabled:text-default-border px-2 py-1 rounded border border-default-border bg-tertiary-surface hover:bg-background disabled:opacity-40 disabled:hover:bg-tertiary-surface disabled:cursor-not-allowed transition-colors"
                >
                  »
                </button>
              </div>

              <div className="flex items-center gap-2 order-1 sm:order-3">
                <label htmlFor="items-select" className="text-default-text text-xs sm:text-sm whitespace-nowrap">
                  Per page:
                </label>
                <select
                  id="items-select"
                  value={itemsPerPage}
                  onChange={(event) => {
                    setItemsPerPage(Number(event.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2  bg-tertiary-surface border border-default-border rounded text-default-text text-xs sm:text-sm cursor-pointer"
                  >
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                    <option value={16}>16</option>
                    <option value={25}>25</option>
                  </select>
              </div>
            </div>
          </div>
        </main> 
      </div>

      <QuestionModal
        key={isCreateOpen ? "create" : (editQuestionId ?? "closed")}
        isOpen={isCreateOpen || editQuestionId !== null}
        mode={isCreateOpen ? "create" : "edit"}
        question_id={editQuestionId}
        categories={categories}
        onClose={() => {
          setIsCreateOpen(false);
          setEditQuestionId(null);
        }}
        onSubmit={(payload) => {
          if(isCreateOpen) {
            handleDeployment(payload);
          }
          else{
            handleSavedChanges(payload);
          }
        }}
      />
    </div>
  );
}
