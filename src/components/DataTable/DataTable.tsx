import React, { useState, ReactNode } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { EmptyState } from '../EmptyState/EmptyState';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => ReactNode);
  className?: string;
  sortable?: boolean;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  id?: string;
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  renderMobileCard?: (item: T, index: number) => ReactNode;
  headerAction?: ReactNode;
  filterControls?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  pageSizeDefault?: number;
  isLoading?: boolean;
}

export function DataTable<T>({
  id = 'data-table',
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Cari data...',
  searchFilter,
  renderMobileCard,
  headerAction,
  filterControls,
  emptyTitle = 'Belum ada data',
  emptyDescription = 'Data belum tersedia atau tidak sesuai dengan filter pencarian.',
  emptyActionLabel,
  onEmptyAction,
  pageSizeDefault = 10,
  isLoading = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeDefault);

  // Filter data by search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim() || !searchFilter) return data;
    return data.filter((item) => searchFilter(item, searchQuery.trim()));
  }, [data, searchQuery, searchFilter]);

  // Pagination calculation
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedData = React.useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, validCurrentPage, pageSize]);

  return (
    <div id={id} className="space-y-4">
      {/* Top Search, Filters & Header Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {searchFilter && (
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id={`${id}-search-input`}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          {filterControls}
        </div>
        {headerAction && <div className="shrink-0 flex items-center gap-2">{headerAction}</div>}
      </div>

      {/* Content: Mobile Cards or Desktop Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4 mx-auto mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-full"></div>
            <div className="h-4 bg-slate-100 rounded w-full"></div>
            <div className="h-4 bg-slate-100 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      ) : filteredData.length === 0 ? (
        <EmptyState
          id={`${id}-empty`}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      ) : (
        <>
          {/* Mobile View (Card based if renderMobileCard provided) */}
          {renderMobileCard && (
            <div className="md:hidden space-y-3">
              {paginatedData.map((item, idx) => (
                <div key={keyExtractor(item)}>
                  {renderMobileCard(item, (validCurrentPage - 1) * pageSize + idx + 1)}
                </div>
              ))}
            </div>
          )}

          {/* Desktop Table View */}
          <div className={`${renderMobileCard ? 'hidden md:block' : 'block'} bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    {columns.map((col, idx) => (
                      <th
                        key={idx}
                        className={`px-4 py-3.5 ${col.className || ''} ${
                          col.hideOnMobile ? 'hidden sm:table-cell' : ''
                        }`}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedData.map((row, rowIdx) => (
                    <tr
                      key={keyExtractor(row)}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {columns.map((col, colIdx) => (
                        <td
                          key={colIdx}
                          className={`px-4 py-3.5 ${col.className || ''} ${
                            col.hideOnMobile ? 'hidden sm:table-cell' : ''
                          }`}
                        >
                          {typeof col.accessor === 'function'
                            ? col.accessor(row)
                            : col.accessor
                            ? (row[col.accessor] as any)
                            : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-1 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>
                Menampilkan <strong>{(validCurrentPage - 1) * pageSize + 1}</strong> -{' '}
                <strong>{Math.min(validCurrentPage * pageSize, totalItems)}</strong> dari{' '}
                <strong>{totalItems}</strong> data
              </span>
              <select
                id={`${id}-pagesize-select`}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value={5}>5 / hal</option>
                <option value={10}>10 / hal</option>
                <option value={25}>25 / hal</option>
                <option value={50}>50 / hal</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                id={`${id}-first-page-btn`}
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman pertama"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                id={`${id}-prev-page-btn`}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={validCurrentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800">
                {validCurrentPage} / {totalPages}
              </span>

              <button
                id={`${id}-next-page-btn`}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={validCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                id={`${id}-last-page-btn`}
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Halaman terakhir"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
