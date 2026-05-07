'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface SearchableOption {
  value: string
  label: string
  disabled?: boolean
  /** Stable list key when `value` may repeat */
  itemKey?: string
}

interface SearchableSelectProps {
  options: SearchableOption[]
  value?: string
  onValueChange: (value: string) => void
  /** Fired when the user types in the search box (for server-side filtering). */
  onSearchChange?: (search: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  triggerClassName?: string
  contentClassName?: string
  /** Fired when the options list scrolls (in addition to built-in load-more). */
  onOptionsScroll?: (e: React.UIEvent<HTMLDivElement>) => void
  /** Shown below options (overrides default “loading more” row when `isFetchingNextPage`). */
  listFooter?: React.ReactNode
  /** When set with `onFetchNextPage`, scroll near the bottom triggers the next page (e.g. React Query infinite). */
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onFetchNextPage?: () => void | Promise<unknown>
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  onSearchChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  disabled = false,
  triggerClassName,
  contentClassName,
  onOptionsScroll,
  listFooter,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const selectedOption = options.find((o) => o.value === value)

  const handleListScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      onOptionsScroll?.(e)
      if (!onFetchNextPage || !hasNextPage || isFetchingNextPage) return
      const el = e.currentTarget
      const threshold = 120
      if (el.scrollHeight - el.scrollTop - el.clientHeight > threshold) return
      void onFetchNextPage()
    },
    [onOptionsScroll, onFetchNextPage, hasNextPage, isFetchingNextPage],
  )

  const scrollHandler =
    onOptionsScroll || onFetchNextPage ? handleListScroll : undefined

  const resolvedFooter =
    listFooter ??
    (isFetchingNextPage ? (
      <div className="flex justify-center gap-2 py-2 text-xs text-muted-foreground border-t bg-popover">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        Loading more…
      </div>
    ) : null)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next && onSearchChange) {
      onSearchChange('')
    }
  }

  return (
    <Popover modal={false} open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            triggerClassName
          )}
        >
          {selectedOption?.label ?? placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'p-0 z-111111 w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-2rem,24rem)] flex flex-col',
          contentClassName,
        )}
        // Wheel would otherwise scroll the dialog behind the portaled popover
        onWheel={(e) => e.stopPropagation()}
      >
        <Command className="h-auto max-h-[min(70vh,320px)] min-h-0 flex flex-col">
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={(q) => onSearchChange?.(q)}
          />
          <CommandList className="min-h-0 flex-1" onScroll={scrollHandler}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.itemKey ?? option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                  disabled={option.disabled}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {resolvedFooter}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
