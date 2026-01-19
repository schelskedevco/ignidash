'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/16/solid';
import { CopyIcon, CheckIcon, DownloadIcon } from 'lucide-react';

import type { TableColumn } from '@/lib/types/table';
import Pagination from '@/components/ui/pagination';
import Card from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useScrollPreservation } from '@/hooks/use-scroll-preserving-state';
import { Button } from '@/components/catalyst/button';

type SortDirection = 'asc' | 'desc' | null;

interface SortState<T> {
  column: keyof T | null;
  direction: SortDirection;
}

interface TableProps<T extends Record<string, unknown>> {
  className?: string;
  columns: TableColumn<T>[];
  data: T[];
  keyField: keyof T;
  itemsPerPage?: number;
  showPagination?: boolean;
  onRowClick?: (row: T) => void;
  exportFilename: string;
}

export default function Table<T extends Record<string, unknown>>({
  className,
  columns,
  data,
  keyField,
  itemsPerPage = 10,
  showPagination = true,
  onRowClick,
  exportFilename,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortState, setSortState] = useState<SortState<T>>({
    column: null,
    direction: null,
  });
  const [hoveredColumn, setHoveredColumn] = useState<keyof T | null>(null);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  const withScrollPreservation = useScrollPreservation();
  const handleSort = withScrollPreservation((column: keyof T) => {
    setSortState((prev) => {
      if (prev.column === column) {
        if (prev.direction === 'asc') return { column, direction: 'desc' };
        if (prev.direction === 'desc') return { column: null, direction: null };
      }
      return { column, direction: 'asc' };
    });
    setCurrentPage(1);
  });

  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortState.column!];
      const bVal = b[sortState.column!];

      const aIsNull = aVal == null;
      const bIsNull = bVal == null;

      if (aIsNull && bIsNull) return 0;
      if (aIsNull) return 1;
      if (bIsNull) return -1;

      if (aVal === bVal) return 0;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortState]);

  const { paginatedData, totalPages, emptyRows } = useMemo(() => {
    if (!showPagination) {
      return { paginatedData: sortedData, totalPages: 1, emptyRows: 0 };
    }

    const total = Math.ceil(sortedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = sortedData.slice(startIndex, endIndex);
    const emptyRowCount = itemsPerPage - paginated.length;

    return { paginatedData: paginated, totalPages: total, emptyRows: emptyRowCount };
  }, [sortedData, currentPage, itemsPerPage, showPagination]);

  const handlePageChange = withScrollPreservation((page: number) => setCurrentPage(page));
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setCurrentPage(1), [data]);

  const [copied, setCopied] = useState(false);

  const escapeCSVValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };

  const handleCopy = async () => {
    const headers = columns.map((col) => col.title).join('\t');
    const rows = sortedData
      .map((row) =>
        columns
          .map((col) => {
            const rawValue = row[col.key];
            return col.format ? col.format(rawValue) : String(rawValue ?? '');
          })
          .join('\t')
      )
      .join('\n');

    await navigator.clipboard.writeText(`${headers}\n${rows}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    const BOM = '\uFEFF';
    const headers = columns.map((col) => escapeCSVValue(col.title)).join(',');
    const rows = sortedData
      .map((row) =>
        columns
          .map((col) => {
            const rawValue = row[col.key];
            const formatted = col.format ? col.format(rawValue) : String(rawValue ?? '');
            return escapeCSVValue(formatted);
          })
          .join(',')
      )
      .join('\n');

    const csvContent = `${BOM}${headers}\n${rows}`;

    if ('showSaveFilePicker' in window) {
      try {
        const showSaveFilePicker = window.showSaveFilePicker as (options: {
          suggestedName: string;
          types: { description: string; accept: Record<string, string[]> }[];
        }) => Promise<FileSystemFileHandle>;

        const handle = await showSaveFilePicker({
          suggestedName: exportFilename,
          types: [{ description: 'CSV Files', accept: { 'text/csv': ['.csv'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(csvContent);
        await writable.close();
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card removeInternalPadding className={cn('-mx-2 my-0 border-x-0 sm:mx-0 sm:border', className)}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle">
                <table className="divide-border/50 bg-background relative min-w-full divide-y">
                  <thead className="bg-emphasized-background">
                    <tr className="text-foreground">
                      {columns.map((col, index) => {
                        const isSorted = sortState.column === col.key;
                        const sortDirection = isSorted ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'none';

                        const sortableButton = (
                          <button
                            onClick={() => handleSort(col.key)}
                            className="focus-outline inline-flex w-full cursor-pointer items-center text-left text-sm font-semibold whitespace-nowrap"
                            aria-label={`Sort by ${col.title}, currently ${sortDirection}`}
                          >
                            <span
                              className={cn(
                                'relative after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:bg-current/80',
                                'after:w-0 after:transition-all after:duration-300 after:ease-in-out',
                                'group-hover:after:w-full',
                                isSorted && 'after:w-full'
                              )}
                            >
                              {col.title}
                            </span>
                            <span className="text-muted-foreground ml-2 flex-none rounded-sm" aria-hidden="true">
                              {isSorted && sortState.direction === 'asc' ? (
                                <ChevronUpIcon className="size-5" />
                              ) : isSorted && sortState.direction === 'desc' ? (
                                <ChevronDownIcon className="size-5" />
                              ) : (
                                <ChevronDownIcon className="invisible size-5 group-hover:visible" />
                              )}
                            </span>
                          </button>
                        );

                        if (index === 0) {
                          return (
                            <th
                              key={String(col.key)}
                              scope="col"
                              className={cn(
                                'group py-3.5 pr-3 pl-4 sm:pl-6 lg:pl-8',
                                hoveredColumn === col.key && 'from-background bg-gradient-to-t to-rose-500/25'
                              )}
                              onMouseEnter={() => setHoveredColumn(col.key)}
                              onMouseLeave={() => setHoveredColumn(null)}
                              aria-sort={sortDirection}
                            >
                              {sortableButton}
                            </th>
                          );
                        }

                        return (
                          <th
                            key={String(col.key)}
                            scope="col"
                            className={cn(
                              'group border-border/50 border-l px-3 py-3.5',
                              hoveredColumn === col.key && 'from-background bg-gradient-to-t to-rose-500/25'
                            )}
                            onMouseEnter={() => setHoveredColumn(col.key)}
                            onMouseLeave={() => setHoveredColumn(null)}
                            aria-sort={sortDirection}
                          >
                            {sortableButton}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-border/25 border-border/50 divide-y border-b">
                    {paginatedData.map((row) => (
                      <tr
                        key={String(row[keyField])}
                        className={cn(
                          'focus-outline hover:bg-emphasized-background',
                          'even:bg-emphasized-background/50',
                          onRowClick && 'cursor-pointer',
                          selectedRow === String(row[keyField]) && 'bg-emphasized-background even:bg-emphasized-background'
                        )}
                        role={onRowClick ? 'button' : undefined}
                        aria-label={onRowClick ? `View details for simulation number ${String(row[keyField])}` : undefined}
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault();
                          withScrollPreservation(() => {
                            setSelectedRow(String(row[keyField]));
                            onRowClick?.(row);
                          })();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            withScrollPreservation(() => {
                              setSelectedRow(String(row[keyField]));
                              onRowClick?.(row);
                            })();
                          }
                        }}
                      >
                        {columns.map((col, index) => {
                          const rawValue = row[col.key];
                          const displayValue = col.format ? col.format(rawValue) : String(rawValue);

                          if (index === 0) {
                            return (
                              <td
                                key={String(col.key)}
                                className={cn(
                                  'text-foreground py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap sm:pl-6 lg:pl-8',
                                  hoveredColumn === col.key && 'bg-emphasized-background',
                                  onRowClick && 'text-primary hover:underline'
                                )}
                              >
                                {displayValue}
                              </td>
                            );
                          }

                          return (
                            <td
                              key={String(col.key)}
                              className={cn(
                                'text-muted-foreground border-border/25 border-l px-3 py-4 text-sm whitespace-nowrap',
                                hoveredColumn === col.key && 'bg-emphasized-background'
                              )}
                            >
                              {displayValue}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Empty rows to maintain consistent height */}
                    {emptyRows > 0 &&
                      showPagination &&
                      Array.from({ length: emptyRows }).map((_, index) => (
                        <tr key={`empty-${index}`}>
                          <td colSpan={columns.length + 1} className="py-4 text-sm whitespace-nowrap">
                            &nbsp;
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        {showPagination && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={data.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        )}
      </Card>
      <div className="mt-2 flex justify-end gap-x-2">
        <Button outline onClick={handleCopy}>
          {copied ? <CheckIcon data-slot="icon" /> : <CopyIcon data-slot="icon" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button color="dark/white" onClick={handleExport}>
          <DownloadIcon data-slot="icon" />
          Export CSV
        </Button>
      </div>
    </>
  );
}
