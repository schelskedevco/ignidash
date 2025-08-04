import { Button } from '@/components/catalyst/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <nav aria-label="Pagination" className="border-border flex items-center justify-between border-t py-3">
      <div className="hidden sm:block">
        <p className="text-muted-foreground text-sm">
          Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
          <span className="font-medium">20</span> results
        </p>
      </div>
      <div className="flex flex-1 justify-between sm:justify-end sm:gap-2">
        <Button onClick={() => onPageChange(currentPage - 1)} color="rose">
          Previous
        </Button>
        <Button onClick={() => onPageChange(currentPage + 1)} color="rose">
          Next
        </Button>
      </div>
    </nav>
  );
}
