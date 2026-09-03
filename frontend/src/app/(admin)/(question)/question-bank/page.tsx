"use client"
import { useState, useMemo, useEffect } from "react";
import { apiDelete, apiGet, apiPost, apiPatch } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import QuestionFilters from "@/components/admin/ui/input/question-filter";
import QuestionTable from "@/components/admin/ui/cards/question-table";
import LegacyQuestionModal from "./legacy-question-modal";
import CreateQuestionContainer from "@/components/admin/ui/question-builder/create-question-container";
import ConfirmationModal from "@/components/ui/confirmation/confirmationModal";
import { Plus, HelpCircle } from "lucide-react";
import { QuestionBank, QuestionPayload, QuestionCategory } from "../../types/questions";
import { buildSourceQuestionPayload, updateSavedQuestionList } from "@/lib/question-payload";
import PageHelpDrawer from "@/components/admin/ui/help/page-help-drawer";
import { PAGE_HELP_CONTENT } from "@/components/admin/ui/help/page-help-content";

export default function ViewQuestionsPage() {
  //NOSONAR - this page is a thin wrapper around the shared QuestionListPage component
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<"title"|"category"|"difficulty"|null>(null);
  const [sortDirection, setSortDirection] = useState<"asc"|"desc">("asc");
  const [loading, setLoading] = useState(true);
  
  const [questions, setQuestions] = useState<QuestionBank[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editQuestionId,setEditQuestionId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const helpConfig = PAGE_HELP_CONTENT["/question-bank"];

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [categories, questions] = await Promise.all([
          apiGet<QuestionCategory[]>("/api/v1/categories/", {
            headers: getAuthHeaders(),
          }),
          apiGet<QuestionBank[]>("/api/v1/questions/", {
            headers: getAuthHeaders(),
          }),
        ]);

        if(!mounted) return;

        setCategories(categories);

        setQuestions(
          questions.map(question => ({
            ...question,
            category_id: question.category_id ?? 0,
            difficulty: question.difficulty ?? "Easy",
          }))
        );
      }
      catch(err) {
        console.error(err);
      } finally {
         if (mounted) setLoading(false);
      }
    };

    void loadData();

    return () => {
      mounted = false;
    }
  }, []);

  const categoriesMap = useMemo( () => {
    return categories.reduce((accumulator, currentCategory) => {
      accumulator[currentCategory.category_id] = currentCategory.category_name;
      return accumulator;
    }, {} as Record<number, string>); 
  }, [categories]);

  function getSortValue (
    question: QuestionBank,
    column: "title" | "category" | "difficulty",
    categoriesMap: Record<number, string>
  ): string | number {
    
    switch(column) {

      case "title":
        return question.title.toLowerCase();
      
      case "category":
        return (categoriesMap[question.category_id] ?? "").toLowerCase();

      case "difficulty":
        return {Easy: 1, Medium: 2, Hard: 3}[question.difficulty] ?? 0;
    }
  }

  const questionsFiltered = useMemo(() => {
    return questions
    .filter((question) => {
      const normalizedSearch = searchTerm.toLowerCase();

      const matchTag = Array.isArray(question.tags) ?
        question.tags.some((tag) => tag.toLocaleLowerCase().includes(normalizedSearch)) :
        typeof question.tags === "string" && question.tags.toLowerCase().includes(normalizedSearch);

      const matchesSearch = 
        question.title.toLowerCase().includes(normalizedSearch) ||
        question.content.toLowerCase().includes(normalizedSearch) ||
        matchTag;

      const matchesCategory =  categoryFilter === "all" || String(question.category_id) === categoryFilter;
      
      const matchesDifficulty = difficultyFilter === "all" || question.difficulty === difficultyFilter;
      
      return matchesSearch && matchesCategory && matchesDifficulty;

    }).sort ((a, b) => {
      
      if(!sortColumn) return 0;

      const aValue = getSortValue(a, sortColumn, categoriesMap);
      const bValue = getSortValue(b, sortColumn, categoriesMap);

      if(aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if(aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1
      }

      return 0;
    });
  }, [
    questions,
    searchTerm,
    categoryFilter,
    difficultyFilter,
    sortColumn,
    sortDirection,
    categoriesMap,
  ])
 
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
  };

  const handleSavedChanges = async (updatedData: QuestionPayload) => {
    if (editQuestionId === null) return;
    setError(null);
    setIsSaving(true);
    try{
      await apiPatch(`/api/v1/questions/source/${editQuestionId}`, buildSourceQuestionPayload(updatedData), {
        headers: getAuthHeaders()
      });
      setQuestions((previousQuestions) =>
        updateSavedQuestionList(previousQuestions, editQuestionId, updatedData)
      );

      setSuccess("Question updated successfully.");
      setEditQuestionId(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save changes.")
    } finally {
      setIsSaving(false);
    }
    
  };

  const handleDeployment = async (newQuestion: QuestionPayload) => {
    setError(null);

    try {
      const createdQuestion = await apiPost<QuestionBank>(
        "/api/v1/questions/source",
        buildSourceQuestionPayload(newQuestion),
        {
          headers: getAuthHeaders(),
        }
      );

      if (newQuestion.type === "CODING" && Array.isArray(newQuestion.testCases) && newQuestion.testCases.length > 0) {
        for (const testCase of newQuestion.testCases) {
          await apiPost(
            `/api/v1/questions/source/${createdQuestion.question_bank_id}/test-cases`,
            {
              description: null,
              input_data: testCase.input,
              expected_output: testCase.expectedOutput,
              is_hidden: testCase.hidden,
            },
            {
              headers: getAuthHeaders(),
            }
          );
        }
      }

      setQuestions((previousQuestions) => [
        {
          ...createdQuestion,
          category_id: newQuestion.category_id,
          difficulty: newQuestion.difficulty,
          maximum_score: newQuestion.maximum_score,
          tags: newQuestion.tags ?? [],
          type: createdQuestion.type ?? newQuestion.type,
        },
        ...previousQuestions,
      ]);
      setIsCreateOpen(false);
      setSuccess("Question created successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create question.");
    }
  };

  const totalNumberOfPages = Math.ceil(questionsFiltered.length / itemsPerPage)

  const sectionedQuestions = questionsFiltered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const updateFilter = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setter(value);
    setCurrentPage(1);
  }
  
  const handleDelete = async (quesetionId: number) => {
    setDeleteTargetId(quesetionId);
  }

  const confirmDelete = async() => {
    if (deleteTargetId === null) return;
    setError(null);
    try{
      await apiDelete(`/api/v1/questions/${deleteTargetId}`, {
        headers: getAuthHeaders()
      });
      const remainingQuestions = questions.filter((question) =>  question.question_bank_id !== deleteTargetId);
      const nextTotalPages = Math.max(1, Math.ceil(remainingQuestions.length / itemsPerPage));

      setQuestions(remainingQuestions);
      setCurrentPage((previousPage) => Math.min(previousPage, nextTotalPages));
      setOpenMenuId(null);
      setSuccess("Question deleted successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete question.")
    } finally {
      setDeleteTargetId(null);
    }
  };

  useEffect(()=>{
    if (!success) return;
    const timeout = setTimeout(()=> setSuccess(null), 3000);
    return ()=> clearTimeout(timeout);
  }, [success]);

  return (
    <div className="flex min-h-screen bg-background">

      <div className="flex-1 flex flex-col w-full min-w-0 overflow-hidden">

        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-content items-start sm:items-center gap-4 mb-6 sm:mb-8">
              <button title="Create a new custom source question" onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-default-text text-background border border-transparent hover:bg-transparent hover:text-system-red  hover:border-system-red hover:boarder-2 px-4 py-2 rounded transition-colors text-sm sm:text-base duration-300 cursor-pointer">
                <Plus size={18} className="sm:w-5 sm:h-5"/>
                <span className="hidden sm:inline">New Question</span>
                <span className="sm:hidden">New</span>
              </button>

              <button 
                title="Open the help guide." 
                type="button" onClick={()=>setIsHelpOpen(true)} 
                className="flex items-center gap-2 text-default-text border border-default-border hover:text-system-red hover:border-system-red px-4 py-2 rounded transition-colors text-sm font-medium uppercase tracking-wider cursor-pointer"
              >
                <HelpCircle size={18}/>
                <span>Help</span>
              </button>
            </div>

            <PageHelpDrawer
              open={isHelpOpen}
              onClose={()=>setIsHelpOpen(false)}
              config={helpConfig}
            />

            <QuestionFilters
              searchTerm={searchTerm}
              onSearchChange={(value) => updateFilter(setSearchTerm, value)}
              categoryFilter={categoryFilter}
              onChangeCategory={(value) => updateFilter(setCategoryFilter, value)}
              categories={categories}
              difficultyFilter={difficultyFilter}
              onDifficultyChange={(value) => updateFilter(setDifficultyFilter, value)}
              onClearFilters={clearFiltersHandle}
            />

            {success && (
              <div className="mb-4 rounded border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm text-status-success">
                {success}
              </div>
            )}      
            
            {error && (
              <div className="mb-4 rounded border border-system-red/30 bg-system-red/10 px-4 py-3 text-sm text-system-red">
                {error}
              </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="font-jetbrains text-[12px] text-white-smoke/40">
                    Loading questions...
                  </div>
                </div>
              ) : (
                <>

            <QuestionTable
              questions={sectionedQuestions}
              categoryMap={categoriesMap}  
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={sortHandle}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onEdit={(id) => {setEditQuestionId(id); setOpenMenuId(null);}}
              onDelete={handleDelete}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-2 mt-10 border border-t border-default-border rounded-b-lg text-sm text-default-text">
              <div className="text-default-text order-2 sm:order-1">
                Page <span className="font-semibold">{currentPage}</span> {" "}
                of {" "}<span className="font-semibold">{totalNumberOfPages}</span>
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-3 order-3 sm:order-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="text-default-text text-xs sm:text-sm disabled:text-default-border px-2 py-1 rounded border border-default-border bg-tertiary-surface hover:bg-background disabled:opacity-40 disabled:hover:bg-tertiary-surface disabled:cursor-not-allowed transition-colors ">
                  «
                </button>
                <button 
                  type="button"
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
                    type="button"
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
                  type="button"
                  onClick={() => setCurrentPage(Math.min(totalNumberOfPages, currentPage + 1))}
                  disabled={currentPage === totalNumberOfPages || totalNumberOfPages === 0}
                  className="text-default-text text-xs sm:text-sm disabled:text-default-border px-2 py-1 rounded border border-default-border bg-tertiary-surface hover:bg-background disabled:opacity-40 disabled:hover:bg-tertiary-surface disabled:cursor-not-allowed transition-colors">
                  ›
                </button>
                <button 
                  type="button"
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
            </>
              )}
          </div>
        </main> 
      </div>


      <CreateQuestionContainer
        open={isCreateOpen}
        categories={categories}
        isSaving={isSaving}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleDeployment}
      />

      <LegacyQuestionModal
        key={editQuestionId ?? "closed"}
        isOpen={editQuestionId !== null}
        mode={"edit"}
        isSaving={isSaving}
        question_id={editQuestionId}
        questions={questions}
        categories={categories}
        onClose={() => setEditQuestionId(null)}
        onSubmit={handleSavedChanges}
      />

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        headerText="Delete Question"
        title="Are you sure you want to delete this question?"
        description="This action cannot be undone. The question will be permanently removed from the question bank."
        confirmText="DELETE"
        cancelText="CANCEL"
        isDanger
      />
    </div>
  );
}
