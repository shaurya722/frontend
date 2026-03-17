'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationControlsProps {
  page: number
  pageSize: number
  totalCount: number
  currentCount: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  hasNext?: boolean
  hasPrev?: boolean
  label?: string
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
  className?: string
}

export function PaginationControls({
  page,
  pageSize,
  totalCount,
  currentCount,
  onPageChange,
  isLoading,
  hasNext,
  hasPrev,
  label = 'results',
  pageSizeOptions,
  onPageSizeChange,
  className,
}: PaginationControlsProps) {
  const safePageSize = pageSize > 0 ? pageSize : 1
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize))
  const resolvedHasPrev = typeof hasPrev === 'boolean' ? hasPrev : page > 1
  const resolvedHasNext = typeof hasNext === 'boolean' ? hasNext : page < totalPages

  const handleChangePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage === page || nextPage > totalPages) return
    onPageChange(nextPage)
  }

  const maxVisiblePages = 5
  const halfVisible = Math.floor(maxVisiblePages / 2)
  let startPage = Math.max(1, page - halfVisible)
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  const pages = []
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  const showPageSizeSelector = Array.isArray(pageSizeOptions) && pageSizeOptions.length > 0 && !!onPageSizeChange

  return (
    <div className={cn('flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-3', className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="text-sm text-gray-600">
          Showing {currentCount} of {totalCount} {label}
        </div>
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange?.(parseInt(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions!.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleChangePage(page - 1)}
            disabled={!resolvedHasPrev || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {pages.map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={pageNumber === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleChangePage(pageNumber)}
                disabled={isLoading}
                className="w-8 h-8 p-0"
              >
                {pageNumber}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleChangePage(page + 1)}
            disabled={!resolvedHasNext || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
