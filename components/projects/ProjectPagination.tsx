"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
}

export function ProjectPagination({ totalItems, itemsPerPage, currentPage }: PaginationProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getPageUrl = (page: number, limit?: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    if (limit) {
      params.set("limit", limit.toString());
    }
    return `/projects?${params.toString()}`;
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    router.push(getPageUrl(1, newLimit));
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const maxVisiblePages = 5;
  let visiblePages = pages;

  if (pages.length > maxVisiblePages) {
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    const adjustedStart = Math.max(1, endPage - maxVisiblePages + 1);
    visiblePages = pages.slice(adjustedStart - 1, endPage);
  }

  if (totalPages <= 1) {
    return (
      <div className="mt-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm text-text-secondary">Éléments par page:</label>
          <select value={itemsPerPage} onChange={handleLimitChange} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
            <option value="12">12</option>
            <option value="24">24</option>
            <option value="48">48</option>
            <option value="96">96</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 flex items-center justify-between gap-6">
      {/* Items per page selector - Left */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-text-secondary">Éléments par page:</label>
        <select value={itemsPerPage} onChange={handleLimitChange} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40">
          <option value="12">12</option>
          <option value="24">24</option>
          <option value="48">48</option>
          <option value="96">96</option>
        </select>
      </div>

      {/* Pagination - Right */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        {currentPage > 1 ? (
          <Link
            href={getPageUrl(currentPage - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-sm font-medium text-text-primary transition-colors hover:bg-surface"
          >
            ←
          </Link>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border/40 bg-background text-sm font-medium text-text-secondary/50">
            ←
          </div>
        )}

        {/* Page numbers */}
        {visiblePages[0] > 1 && (
          <>
            <Link
              href={getPageUrl(1)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-sm font-medium text-text-primary transition-colors hover:bg-surface"
            >
              1
            </Link>
            {visiblePages[0] > 2 && <span className="text-text-secondary">...</span>}
          </>
        )}

        {visiblePages.map((page) => (
          <Link
            key={page}
            href={getPageUrl(page)}
            className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
              page === currentPage
                ? "border-accent bg-accent text-white"
                : "border-border bg-background text-text-primary hover:bg-surface"
            }`}
          >
            {page}
          </Link>
        ))}

        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="text-text-secondary">...</span>
            )}
            <Link
              href={getPageUrl(totalPages)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-sm font-medium text-text-primary transition-colors hover:bg-surface"
            >
              {totalPages}
            </Link>
          </>
        )}

        {/* Next button */}
        {currentPage < totalPages ? (
          <Link
            href={getPageUrl(currentPage + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-sm font-medium text-text-primary transition-colors hover:bg-surface"
          >
            →
          </Link>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border/40 bg-background text-sm font-medium text-text-secondary/50">
            →
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectPagination;
