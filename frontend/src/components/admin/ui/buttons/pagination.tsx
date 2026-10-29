"use client";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPagechange: (itemsPerPage: number) => void;
}

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPagechange,
}: PaginationProps) {
    
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    // prevent the current page from exceeding total pages in data changes
    const safeCurrentPage = Math.min(currentPage, totalPages);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-4 py-2 mt-10 border border-t border-default-border rounded-b-lg text-sm text-default-text">
      <div className="text-default-text order-2 sm:order-1">
        Page <span className="font-semibold">{safeCurrentPage}</span> of{" "}
        <span className="font-semibold">{totalPages}</span>
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-3 order-3 sm:order-2 flex-wrap">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          className="text-default-text text-xs sm:text-sm disabled:text-default-border px-2 py-1 rounded border border-default-border bg-tertiary-surface hover:bg-background disabled:opacity-40 disabled:hover:bg-tertiary-surface disabled:cursor-not-allowed transition-colors "
        >
          «
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={currentPage === 1}
          className="text-default-text text-xs sm:text-sm disabled:text-default-border px-2 py-1 rounded border border-default-border bg-tertiary-surface hover:bg-background disabled:opacity-40 disabled:hover:bg-tertiary-surface disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>

        {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
          const pageNumber = currentPage < 2 || currentPage === 2 ? i + 1 : currentPage + i - 1;
          return pageNumber <= totalPages ? pageNumber: null;
        })
          .filter((pageNumber): pageNumber is number => pageNumber !== null)
          .map((pageNumber) => (
            <button
              type="button"
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transitions-colors
                      ${
                        safeCurrentPage === pageNumber
                          ? "bg-default-text text-background"
                          : "text-default-text hover:bg-tertiary-surface"
                      }`}
            >
              {pageNumber}
            </button>
          ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage === totalPages || totalPages === 0}
          className="text-default-text text-xs sm:text-sm disabled:text-default-border px-2 py-1 rounded border border-default-border bg-tertiary-surface hover:bg-background disabled:opacity-40 disabled:hover:bg-tertiary-surface disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="text-default-text text-xs sm:text-sm disabled:text-default-border px-2 py-1 rounded border border-default-border bg-tertiary-surface hover:bg-background disabled:opacity-40 disabled:hover:bg-tertiary-surface disabled:cursor-not-allowed transition-colors"
        >
          »
        </button>
      </div>

      <div className="flex items-center gap-2 order-1 sm:order-3">
        <label
          htmlFor="items-select"
          className="text-default-text text-xs sm:text-sm whitespace-nowrap"
        >
          Per page:
        </label>
        <select
          id="items-select"
          value={itemsPerPage}
          onChange={(event) => {
            const newLimit = Number(event.target.value);
            onItemsPerPagechange(newLimit);
            onPageChange(1)
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
  );
}
