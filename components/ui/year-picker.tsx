import * as React from 'react'
import { CalendarIcon, ChevronDownIcon } from 'lucide-react'

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

interface YearPickerProps {
  value?: number
  onChange: (year: number) => void
  placeholder?: string
  className?: string
}

export function YearPicker({ value, onChange, placeholder = "Pick a year", className }: YearPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')

  // Generate years from 1900 to current year + 10
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1900 + 11 }, (_, i) => currentYear + 10 - i)

  const filteredYears = years.filter(year =>
    year.toString().includes(searchValue) ||
    searchValue === '' ||
    year.toString().startsWith(searchValue)
  )

  const handleSelect = (year: number) => {
    onChange(year)
    setOpen(false)
    setSearchValue('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value ? value : placeholder}
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 z-[99999]" align="start">
        <Command>
          <CommandInput
            placeholder="Search years..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No years found.</CommandEmpty>
            <CommandGroup>
              {filteredYears.map((year) => (
                <CommandItem
                  key={year}
                  value={year.toString()}
                  onSelect={() => handleSelect(year)}
                >
                  {year}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
