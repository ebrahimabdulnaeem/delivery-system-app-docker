"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRange {
  from: Date;
  to?: Date;
}

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  dateRange?: DateRange
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(dateRange)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(dateRange?.from)

  React.useEffect(() => {
    if (dateRange) {
      setDate(dateRange)
      setSelectedDate(dateRange.from)
    }
  }, [dateRange])

  // Simplified date selection for our basic Calendar component
  const handleDateSelect = (selected: Date) => {
    // If no date is selected yet or both from and to are set, start a new range
    if (!date || (date.from && date.to)) {
      const newRange = { from: selected }
      setDate(newRange)
      setSelectedDate(selected)
      if (onDateRangeChange) {
        onDateRangeChange(newRange)
      }
    } 
    // If only from is set, set the to date
    else if (date.from && !date.to) {
      // Ensure the to date is after the from date
      if (selected >= date.from) {
        const newRange = { ...date, to: selected }
        setDate(newRange)
        setSelectedDate(selected)
        if (onDateRangeChange) {
          onDateRangeChange(newRange)
        }
      } else {
        // If selected date is before from date, start a new range
        const newRange = { from: selected }
        setDate(newRange)
        setSelectedDate(selected)
        if (onDateRangeChange) {
          onDateRangeChange(newRange)
        }
      }
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>اختر تاريخ</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-2">
            <Calendar
              selected={selectedDate}
              onSelect={handleDateSelect}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 