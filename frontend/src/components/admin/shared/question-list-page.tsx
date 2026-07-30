"use client"
import { useState, useMemo, useEffect, useCallback, ComponentType } from "react";
import { apiDelete, apiGet, apiPost, apiPatch } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import AdminSidebar from "@/components/admin/layouts/sidebar";
import AdminTopbar from "@/components/admin/layouts/topbar";
import QuestionFilters from "@/components/admin/ui/input/question-filter";
import QuestionTable from "@/components/admin/ui/cards/question-table";
import ConfirmationModal from "@/components/ui/confirmation/confirmationModal";
import { Plus, HelpCircle } from "lucide-react";
import { QuestionBank, QuestionPayload, QuestionCategory } from "@/app/(admin)/types/questions";
import MobileSidebar from "../layouts/mobile-sidebar";
import { buildSourceQuestionPayload, updateSavedQuestionList } from "@/lib/question-payload";
import PageHelpDrawer, { type PageHelpConfig } from "@/components/admin/ui/help/page-help-drawer";


export interface QuestionListModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  question_id?: number | null;
  questions: QuestionBank[];
  categories: QuestionCategory[];
  onClose: () => void;
  onSubmit: (payload: QuestionPayload) => void;
  isSaving?: boolean;
}

interface AdversarialQuestionResponse {
  adv_question_id: number;
  source_question_id: number;
  content: string;
  strategy_id: number;
  llm: string | null;
  generated_at: string;
  correct_answer: string | null;
  predicted_wrong_answer: string | null;
  trap_mechanism: string | null;
  pattern_used: string | null;
  validation_status: string;
}

export interface QuestionListPageConfig {
   //Text for the "create new" button
  newButtonLabel: string;
  //Text for the "create new" button on small screens
  newButtonLabelShort?: string;

  deleteHeaderText: string;
  deleteTitle: string;
  deleteDescription: string;
  //chooses which modal to render
  ModalComponent: ComponentType<QuestionListModalProps>;
  helpConfig?: PageHelpConfig;
  mode?: "source" | "adversarial";
}

export default function QuestionListPage({ config }: { config: QuestionListPageConfig }) {
  const { ModalComponent } = config;


  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<"title" | "category" | "difficulty" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionBank[]>([]);
  const [sourceQuestions, setSourceQuestions] = useState<QuestionBank[]>([]);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const loadSourceQuestions = useCallback(async (): Promise<QuestionBank[]> => {
    const response = await apiGet<QuestionBank[]>("/api/v1/questions/", {
      headers: getAuthHeaders(),
    });
    return response.map((question) => ({
      ...question,
      category_id: question.category_id ?? 0,
      difficulty: question.difficulty ?? "Easy",
    }));
  }, []);

  const fetchQuestions = useCallback(async (): Promise<{
    source: QuestionBank[];
    table: QuestionBank[];
  }> => {
    if (config.mode === "adversarial") {
      const [sourceResult, adversarialResult] = await Promise.all([
        loadSourceQuestions(),
        apiGet<AdversarialQuestionResponse[]>("/api/v1/adversarial-questions/all", {
          headers: getAuthHeaders(),
        }),
      ]);

      const table = adversarialResult.map((adversarialQuestion) => {
        const sourceQuestion = sourceResult.find(
          (question) => question.question_bank_id === adversarialQuestion.source_question_id
        );
        return {
          question_bank_id: adversarialQuestion.adv_question_id,
          title: sourceQuestion?.title ?? "Unknown source question",
          content: adversarialQuestion.content,
          tags: sourceQuestion?.tags ?? [],
          category_id: sourceQuestion?.category_id ?? 0,
          difficulty: sourceQuestion?.difficulty ?? "Easy",
          validation_status: adversarialQuestion.validation_status,
        };
      });

      return { source: sourceResult, table };
    }

    const sourceResult = await loadSourceQuestions();
    return { source: sourceResult, table: sourceResult };
  }, [config.mode, loadSourceQuestions]);

  const refetchQuestions = async () => {
    try {
      const { source, table } = await fetchQuestions();
      setSourceQuestions(source);
      setQuestions(table);
    } catch (error) {
      console.error("Failed to load questions:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const response = await apiGet<QuestionCategory[]>("/api/v1/categories/", {
          headers: getAuthHeaders(),
        });
        if (isMounted) {
          setCategories(response);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    const loadQuestions = async () => {
      try {
        const { source, table } = await fetchQuestions();
        if (isMounted) {
          setSourceQuestions(source);
          setQuestions(table);
        }
      } catch (error) {
        console.error("Failed to load questions:", error);
      }
    };

    void loadCategories();
    void loadQuestions();

    return () => {
      isMounted = false;
    };
  }, [fetchQuestions]);

  const categoriesMap = useMemo(() => {
    return categories.reduce((accumulator, currentCategory) => {
       accumulator[currentCategory.category_id] = currentCategory.category_name;
      return accumulator;
    }, {} as Record<number, string>);
  }, [categories]);

  const questionsFiltered = questions
    .filter((question) => {
      const matchTag = Array.isArray(question.tags)
        ? question.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        : typeof question.tags === "string"
        ? question.tags.toLowerCase().includes(searchTerm.toLowerCase())
        : false;

      const matchesSearch =
        question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        matchTag;

    const matchesCategory = categoryFilter === "all" || String(question.category_id) === categoryFilter;
      const matchesDifficulty = difficultyFilter === "all" || question.difficulty === difficultyFilter;
      return matchesSearch && matchesCategory && matchesDifficulty;
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;
    let aValue: string | number = "";
      let bValue: string | number = "";

      if (sortColumn === "title") {
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
      } else if (sortColumn === "category") {
        aValue = (categoriesMap[a.category_id] || "").toLowerCase();
        bValue = (categoriesMap[b.category_id] || "").toLowerCase();
      } else {
        const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };
        aValue = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0;

    bValue = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0;
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (bValue > aValue) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });

  const sortHandle = (column: "title" | "category" | "difficulty") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
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
    setUpdateError(null);
    setIsSaving(true);
    try {
      await apiPatch(`/api/v1/questions/source/${editQuestionId}`, buildSourceQuestionPayload(updatedData), {
        headers: getAuthHeaders(),
      });
      setQuestions((previousQuestions) =>
        updateSavedQuestionList(previousQuestions, editQuestionId, updatedData)
      );

      setUpdateSuccess("Question updated successfully.");
      setEditQuestionId(null);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeployment = async (newQuestion: QuestionPayload) => {
    setDeleteError(null);

    try {
      const createdQuestion = await apiPost<QuestionBank>(
        "/api/v1/questions/source",
        buildSourceQuestionPayload(newQuestion),
        {
          headers: getAuthHeaders(),
        }
      );

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
      setDeleteSuccess("Question created successfully.");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to create question.");
    }
  };

  const totalNumberOfPages = Math.ceil(questionsFiltered.length / itemsPerPage);
  const sectionedQuestions = questionsFiltered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (questionId: number) => {
    setDeleteTargetId(questionId);
  };

  const confirmDelete = async () => {
    if (deleteTargetId === null) return;
    setDeleteError(null);
    try {
      const deleteUrl =
        config.mode === "adversarial"
          ? `/api/v1/adversarial-questions/${deleteTargetId}`
          : `/api/v1/questions/${deleteTargetId}`;
      await apiDelete(deleteUrl, {
        headers: getAuthHeaders(),
      });
      const remainingQuestions = questions.filter((question) => question.question_bank_id !== deleteTargetId);
      const nextTotalPages = Math.max(1, Math.ceil(remainingQuestions.length / itemsPerPage));

      setQuestions(remainingQuestions);
      setCurrentPage((previousPage) => Math.min(previousPage, nextTotalPages));
      setOpenMenuId(null);
      setDeleteSuccess("Question deleted successfully.");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete question.");
    } finally {
      setDeleteTargetId(null);
    }
  };

  useEffect(() => {
    if (!deleteSuccess) return;
    const timeout = setTimeout(() => setDeleteSuccess(null), 3000);
    return () => clearTimeout(timeout);
  }, [deleteSuccess]);

  return (
    <div className="flex min-h-screen bg-background">
      
      <AdminSidebar />
      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 min-w-0">
        <AdminTopbar 
          onOpenSideBar={() => setSidebarOpen(true)}
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="p-4 py-6 sm:p-6 lg:px-8 md:p-8">
            <div className="flex flex-col sm:flex-row justify-content items-start sm:items-center gap-4 mb-6 sm:mb-8">
              <button
                title={config.newButtonLabel.toLowerCase().includes("adverserial") ? "Use AI to weaponise a source question." : config.newButtonLabel}
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 bg-default-text text-background border border-transparent hover:bg-transparent hover:text-system-red  hover:border-system-red hover:boarder-2 px-4 py-2 rounded transition-colors text-sm sm:text-base whitespace-nowrap duration-300 cursor-pointer"
              >
                <Plus size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{config.newButtonLabel}</span>
                <span className="sm:hidden">{config.newButtonLabelShort ?? "New"}</span>
              </button>

              {config.helpConfig && (
                <button title="Open the help guide." type="button" onClick={()=>setIsHelpOpen(true)} className="inline-flex items-center gap-2 bg-tertiary-surface text-default-text border border-default-border hover:bg-secondary-surface px-4 py-2 rounded transition-colors text-sm font-medium uppercase tracking-wide cursor-pointer">
                  <HelpCircle size={18}/>
                  <span>Help</span>
                </button>
              )}
            </div>

            {config.helpConfig && (
              <PageHelpDrawer open={isHelpOpen} onClose={()=>setIsHelpOpen(false)} config={config.helpConfig}/>
            )}

            <QuestionFilters
              searchTerm={searchTerm}
              onSearchChange={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              categoryFilter={categoryFilter}
              onChangeCategory={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}
              categories={categories}
              difficultyFilter={difficultyFilter}
              onDifficultyChange={(value) => {
                setDifficultyFilter(value);
                setCurrentPage(1);
              }}
              onClearFilters={clearFiltersHandle}
            />

            {deleteSuccess && (
              <div className="mb-4 rounded border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm text-status-success">
                {deleteSuccess}
              </div>
            )}

            {updateSuccess && (
              <div className="mb-4 rounded border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm text-status-success">
                {updateSuccess}
              </div>
            )}

            {updateError && (
              <div className="mb-4 rounded border border-system-red/30 bg-system-red/10 px-4 py-3 text-sm text-system-red">
                {updateError}
              </div>
            )}

            {deleteError && (
              <div className="mb-4 rounded border border-system-red/30 bg-system-red/10 px-4 py-3 text-sm text-system-red">
                {deleteError}
              </div>
            )}

            <div className="overflow-x-auto rounded-lg">
              <QuestionTable
                questions={sectionedQuestions}
                categoryMap={categoriesMap}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={sortHandle}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                onEdit={(id) => {
                  setEditQuestionId(id);
                  setOpenMenuId(null);
                }}
                onDelete={handleDelete}
              />
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-4 py-2 mt-10 border border-t border-default-border rounded-b-lg text-sm text-default-text">
              <div className="text-default-text order-2 sm:order-1">
                Page <span className="font-semibold">{currentPage}</span> of{" "}
                <span className="font-semibold">{totalNumberOfPages}</span>
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-3 order-3 sm:order-2 flex-wrap">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="text-default-text text-xs sm:text-sm disabled:text-default-border px-2 py-1 rounded border border-default-border bg-tertiary-surface hover:bg-background disabled:opacity-40 disabled:hover:bg-tertiary-surface disabled:cursor-not-allowed transition-colors "
                >
                  «
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="text-default-text text-xs sm:text-sm disabled:text-default-border px-2 py-1 rounded border border-default-border bg-tertiary-surface hover:bg-background disabled:opacity-40 disabled:hover:bg-tertiary-surface disabled:cursor-not-allowed transition-colors"
                >
                  ‹
                </button>

                {Array.from({ length: Math.min(3, totalNumberOfPages) }, (_, i) => {
                  const pageNumber = currentPage < 2 || currentPage === 2 ? i + 1 : currentPage + i - 1;
                  return pageNumber < totalNumberOfPages || pageNumber === totalNumberOfPages ? pageNumber : null;
                })
                  .filter((pageNumber): pageNumber is number => pageNumber !== null)
                  .map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transitions-colors
                      ${
                        currentPage === pageNumber
                          ? "bg-default-text text-background"
                          : "text-default-text hover:bg-tertiary-surface"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}

                <button
                  onClick={() => setCurrentPage(Math.min(totalNumberOfPages, currentPage + 1))}
                  disabled={currentPage === totalNumberOfPages || totalNumberOfPages === 0}
                  className="text-default-text text-xs sm:text-sm disabled:text-default-border px-2 py-1 rounded border border-default-border bg-tertiary-surface hover:bg-background disabled:opacity-40 disabled:hover:bg-tertiary-surface disabled:cursor-not-allowed transition-colors"
                >
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

      <ModalComponent
        key={isCreateOpen ? "create" : editQuestionId ?? "closed"}
        isOpen={isCreateOpen || editQuestionId !== null}
        mode={isCreateOpen ? "create" : "edit"}
        isSaving={isSaving}
        question_id={editQuestionId}
        questions={sourceQuestions}
        categories={categories}
        onClose={() => {
          setIsCreateOpen(false);
          setEditQuestionId(null);
          if (config.mode === "adversarial") {
            void refetchQuestions();
          }
        }}
        onSubmit={(payload) => {
          if (isCreateOpen) {
            handleDeployment(payload);
          } else {
            handleSavedChanges(payload);
          }
        }}
      />

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        headerText={config.deleteHeaderText}
        title={config.deleteTitle}
        description={config.deleteDescription}
        confirmText="DELETE"
        cancelText="CANCEL"
        isDanger
      />
    </div>
  );
}