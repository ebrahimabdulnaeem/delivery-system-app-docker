"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DateFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedDate = searchParams.get("date") || "";

  // إنشاء معلمات URL جديدة
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.set("page", "1"); // إعادة تعيين الصفحة عند تغيير المعلمات
      return params.toString();
    },
    [searchParams]
  );

  // معالجة تغيير التاريخ
  const handleDateChange = (date: Date) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      router.push(`?${createQueryString("date", formattedDate)}`);
    } else {
      router.push(`?${createQueryString("date", "")}`);
    }
  };

  // معالجة مسح التاريخ
  const handleClearDate = () => {
    router.push(`?${createQueryString("date", "")}`);
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <label htmlFor="date" className="text-sm font-medium">
        تاريخ الطلب
      </label>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-right"
              id="date"
            >
              <CalendarIcon className="ml-2 h-4 w-4" />
              {selectedDate ? format(new Date(selectedDate), "dd/MM/yyyy") : "اختر تاريخًا"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              selected={selectedDate ? new Date(selectedDate) : undefined}
              onSelect={handleDateChange}
              className="border-none"
            />
          </PopoverContent>
        </Popover>
        {selectedDate && (
          <Button variant="ghost" size="sm" onClick={handleClearDate}>
            مسح
          </Button>
        )}
      </div>
    </div>
  );
} 