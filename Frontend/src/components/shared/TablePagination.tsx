import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TablePaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  showPageSize?: boolean
  itemLabel?: string
  className?: string
}

const getPageNumbers = (currentPage: number, totalPages: number) => {
  const pageNumbers: (number | string)[] = []
  const maxPagesToShow = 5

  if (totalPages <= maxPagesToShow) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i)
  } else {
    if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pageNumbers.push(i)
      pageNumbers.push("...")
      pageNumbers.push(totalPages)
    } else if (currentPage >= totalPages - 2) {
      pageNumbers.push(1)
      pageNumbers.push("...")
      for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i)
    } else {
      pageNumbers.push(1)
      pageNumbers.push("...")
      for (let i = currentPage - 1; i <= currentPage + 1; i++)
        pageNumbers.push(i)
      pageNumbers.push("...")
      pageNumbers.push(totalPages)
    }
  }
  return pageNumbers
}

export function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [5, 10, 25, 50],
  onPageChange,
  onPageSizeChange,
  showPageSize = true,
  itemLabel = "entries",
  className = "",
}: TablePaginationProps) {
  if (totalItems <= 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  const goToPage = (p: number) => {
    onPageChange(Math.max(1, Math.min(p, totalPages)))
  }

  return (
    <div
      className={`mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4 ${className}`}
    >
      {showPageSize && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Rows per page:
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Showing {start} to {end} of {totalItems} {itemLabel}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers(page, totalPages).map((p, index) => (
          <Button
            key={index}
            variant={page === p ? "default" : "outline"}
            size="sm"
            onClick={() => typeof p === "number" && goToPage(p)}
            disabled={p === "..."}
            className={`h-8 w-8 p-0 ${p === "..." ? "cursor-default" : ""}`}
          >
            {p}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
