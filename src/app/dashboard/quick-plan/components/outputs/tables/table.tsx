import { useState, useMemo } from 'react';
import { ChevronDownIcon } from '@heroicons/react/16/solid';

import { type TableColumn } from '@/lib/types/table';
import Pagination from '@/components/ui/pagination';

interface TableProps<T extends Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  keyField: keyof T;
  itemsPerPage?: number;
  showPagination?: boolean;
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  itemsPerPage = 10,
  showPagination = true,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const { paginatedData, totalPages, emptyRows } = useMemo(() => {
    if (!showPagination) {
      return { paginatedData: data, totalPages: 1, emptyRows: 0 };
    }

    const total = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = data.slice(startIndex, endIndex);
    const emptyRowCount = itemsPerPage - paginated.length;

    return { paginatedData: paginated, totalPages: total, emptyRows: emptyRowCount };
  }, [data, currentPage, itemsPerPage, showPagination]);

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
                    const sortableButton = (
                      <button className="group inline-flex">
                        {col.title}
                        <span className="invisible ml-2 flex-none rounded-sm text-gray-400 group-hover:visible group-focus:visible">
                          <ChevronDownIcon
                            aria-hidden="true"
                            className="invisible ml-2 size-5 flex-none rounded-sm text-gray-400 group-hover:visible group-focus:visible"
                          />
                        </span>
                      </button>
                    );

                    if (index === 0) {
                      return (
                        <th key={String(col.key)} scope="col" className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold sm:pl-6 lg:pl-8">
                          {sortableButton}
                        </th>
                      );
                    }

                    return (
                      <th key={String(col.key)} scope="col" className="px-3 py-3.5 text-left text-sm font-semibold">
                        {sortableButton}
                      </th>
                    );
                  })}
                  <th scope="col" className="py-3.5 pr-4 pl-3 sm:pr-6 lg:pr-8">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border/50 divide-y">
                {paginatedData.map((row) => (
                  <tr key={String(row[keyField])}>
                    {columns.map((col, index) => {
                      const rawVal = row[col.key];
                      const displayVal = col.format ? col.format(rawVal) : String(rawVal);

                      if (index === 0) {
                        return (
                          <td
                            key={String(col.key)}
                            className="text-foreground py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap sm:pl-6 lg:pl-8"
                          >
                            {displayVal}
                          </td>
                        );
                      }

                      return (
                        <td key={String(col.key)} className="text-muted-foreground px-3 py-4 text-sm whitespace-nowrap">
                          {displayVal}
                        </td>
                      );
                    })}
                    <td key="Edit" className="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6 lg:pr-8">
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
