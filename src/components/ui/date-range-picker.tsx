"use client";

// استيراد TypeScript فقط للأنواع
import type { DateRange } from "react-day-picker";
import type { Locale } from "date-fns/locale";

interface DateRangePickerProps {
  className?: string;
  value: DateRange | undefined;
  onChange: (date: DateRange | undefined) => void;
  locale?: Locale;
}

// تم إزالة مكون اختيار المدة الزمنية
export function DateRangePicker({
  // تم تعليق المتغيرات غير المستخدمة
  /* className, value, onChange, locale */
}: DateRangePickerProps) {
  // المكون يرجع null وبالتالي لا يعرض أي شيء في الواجهة
  return null;
} 