'use client';

import { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/16/solid';

import { type TableColumn } from '@/lib/types/table';
import Pagination from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

interface TableProps<T extends Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  keyField: keyof T;
  itemsPerPage?: number;
  showPagination?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState<T> {
  column: keyof T | null;
  direction: SortDirection;
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  itemsPerPage = 10,
  showPagination = true,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortState, setSortState] = useState<SortState<T>>({
    column: null,
    direction: null,
  });
  const [hoveredColumn, setHoveredColumn] = useState<keyof T | null>(null);

  const handleSort = (column: keyof T) => {
    setSortState((prev) => {
      if (prev.column === column) {
        if (prev.direction === 'asc') return { column, direction: 'desc' };
        if (prev.direction === 'desc') return { column: null, direction: null };
      }
      return { column, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortState.column!];
      const bVal = b[sortState.column!];

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

  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="divide-border relative min-w-full divide-y">
              <thead>
                <tr className="text-foreground">
                  {columns.map((col, index) => {
                    const isSorted = sortState.column === col.key;
                    const sortableButton = (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="inline-flex cursor-pointer items-center text-left text-sm font-semibold whitespace-nowrap"
                      >
                        {col.title}
                        <span className="ml-2 flex-none rounded-sm text-gray-400">
                          {isSorted && sortState.direction === 'asc' ? (
                            <ChevronUpIcon aria-hidden="true" className="size-5" />
                          ) : isSorted && sortState.direction === 'desc' ? (
                            <ChevronDownIcon aria-hidden="true" className="size-5" />
                          ) : (
                            <ChevronDownIcon aria-hidden="true" className="invisible size-5 group-hover:visible" />
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
                            hoveredColumn === col.key && 'bg-emphasized-background/50'
                          )}
                          onMouseEnter={() => setHoveredColumn(col.key)}
                          onMouseLeave={() => setHoveredColumn(null)}
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
                          hoveredColumn === col.key && 'bg-emphasized-background/50'
                        )}
                        onMouseEnter={() => setHoveredColumn(col.key)}
                        onMouseLeave={() => setHoveredColumn(null)}
                      >
                        {sortableButton}
                      </th>
                    );
                  })}
                  <th scope="col" className="border-border/50 border-l py-3.5 pr-4 pl-3 sm:pr-6 lg:pr-8">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border/50 divide-y">
                {paginatedData.map((row) => (
                  <tr key={String(row[keyField])} className="hover:bg-emphasized-background/50">
                    {columns.map((col, index) => {
                      const rawVal = row[col.key];
                      const displayVal = col.format ? col.format(rawVal) : String(rawVal);

                      if (index === 0) {
                        return (
                          <td
                            key={String(col.key)}
                            className={cn(
                              'text-foreground py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap sm:pl-6 lg:pl-8',
                              hoveredColumn === col.key && 'bg-emphasized-background/50'
                            )}
                          >
                            {displayVal}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={String(col.key)}
                          className={cn(
                            'text-muted-foreground border-border/50 border-l px-3 py-4 text-sm whitespace-nowrap',
                            hoveredColumn === col.key && 'bg-emphasized-background/50'
                          )}
                        >
                          {displayVal}
                        </td>
                      );
                    })}
                    <td
                      key="Edit"
                      className="border-border/50 border-l py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6 lg:pr-8"
                    >
                      <a href="#" className="text-primary hover:text-primary/75">
                        Edit {/* <span className="sr-only">, {person.name}</span> */}
                      </a>
                    </td>
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
      {showPagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={data.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
