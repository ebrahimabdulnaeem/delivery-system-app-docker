"use client"

import * as React from "react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog"

interface CalendarDialogProps {
  date?: Date
  onSelect?: (date?: Date) => void
  label?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CalendarDialog({
  date,
  onSelect,
  label,
  placeholder = "اختر تاريخ",
  className,
  disabled = false,
}: CalendarDialogProps) {
  const [open, setOpen] = React.useState(false)
  
  const handleSelect = React.useCallback((selectedDate: Date) => {
    onSelect?.(selectedDate)
    setOpen(false)
  }, [onSelect])

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <span className="text-sm font-medium">{label}</span>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-right font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="ml-2 h-4 w-4 opacity-70" />
            {date ? format(date, "yyyy/MM/dd", { locale: ar }) : placeholder}
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0 sm:max-w-[300px]">
          <DialogTitle className="sr-only">اختيار التاريخ</DialogTitle>
          <Calendar
            selected={date}
            onSelect={handleSelect}
            className="border-0 shadow-none"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// مكون لاختيار نطاق تاريخ (من - إلى)
interface DateRangeDialogProps {
  from?: Date
  to?: Date
  onRangeChange?: (range: { from?: Date; to?: Date }) => void
  className?: string
}

export function DateRangeDialog({
  from,
  to,
  onRangeChange,
  className,
}: DateRangeDialogProps) {
  const handleFromChange = React.useCallback((date?: Date) => {
    onRangeChange?.({ from: date, to })
  }, [to, onRangeChange])

  const handleToChange = React.useCallback((date?: Date) => {
    onRangeChange?.({ from, to: date })
  }, [from, onRangeChange])

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center gap-2 rtl:space-x-reverse">
        <CalendarDialog
          date={from}
          onSelect={handleFromChange}
          placeholder="تاريخ البداية"
          className="flex-1"
        />
        <span className="text-muted-foreground mx-2">-</span>
        <CalendarDialog
          date={to}
          onSelect={handleToChange}
          placeholder="تاريخ النهاية"
          className="flex-1"
        />
      </div>
    </div>
  )
} 