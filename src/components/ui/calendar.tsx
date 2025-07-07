"use client"

import * as React from "react"
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns"
import { ChevronRight, ChevronLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// طريقة مبسطة لواجهة Props
export interface CalendarProps {
  className?: string;
  onSelect?: (date: Date) => void;
  selected?: Date;
}

function Calendar({
  className,
  onSelect,
  selected,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  
  // أسماء الأشهر العربية
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];
  
  // أسماء أيام الأسبوع العربية
  const weekdays = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
  
  // الانتقال للشهر السابق
  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // الانتقال للشهر التالي
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // الحصول على كل أيام الشهر
  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };
  
  // عرض عنوان الشهر والسنة
  const monthTitle = () => {
    const monthName = months[currentMonth.getMonth()];
    const year = currentMonth.getFullYear();
    return `${monthName} ${year}`;
  };
  
  // التعامل مع اختيار اليوم
  const handleDaySelect = (day: Date) => {
    if (onSelect) {
      onSelect(day);
    }
  };
  
  // توليد صفوف التقويم
  const renderCalendar = () => {
    const days = getDaysInMonth();
    const daysArray: React.ReactNode[] = [];
    
    // نبدأ من يوم الأحد للأسبوع الأول
    const firstDay = new Date(days[0]);
    const startingDay = firstDay.getDay(); // 0 = الأحد، 6 = السبت
    
    // إضافة خلايا فارغة قبل أول يوم في الشهر
    for (let i = 0; i < startingDay; i++) {
      daysArray.push(<div key={`empty-${i}`} className="h-9 w-9 flex items-center justify-center"></div>);
    }
    
    // إضافة أيام الشهر
    days.forEach((day, index) => {
      const dayNum = day.getDate();
      const isCurrentDay = isToday(day);
      const isSelectedDay = selected && 
        selected.getDate() === day.getDate() && 
        selected.getMonth() === day.getMonth() && 
        selected.getFullYear() === day.getFullYear();
      
      daysArray.push(
        <div key={`day-${index}`} className="h-9 w-9 flex items-center justify-center">
          <button
            onClick={() => handleDaySelect(day)}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-md",
              isSelectedDay ? "bg-primary text-primary-foreground" : "",
              isCurrentDay && !isSelectedDay ? "bg-accent text-accent-foreground font-bold" : "",
              !isSelectedDay && !isCurrentDay ? "hover:bg-accent/50" : ""
            )}
          >
            {dayNum}
          </button>
        </div>
      );
    });
    
    // إضافة خلايا فارغة في نهاية الشهر
    const totalCells = 42; // 6 صفوف × 7 أعمدة
    while (daysArray.length < totalCells) {
      daysArray.push(
        <div key={`empty-end-${daysArray.length}`} className="h-9 w-9 flex items-center justify-center"></div>
      );
    }
    
    return daysArray;
  };
  
  return (
    <div className={cn("p-3 bg-card text-card-foreground rounded-lg calendar-container", className)} dir="rtl">
      <div className="flex justify-center items-center relative py-1 mb-2">
        <button
          onClick={previousMonth}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "absolute right-8 h-7 w-7 p-0"
          )}
          aria-label="الشهر السابق"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        
        <div className="text-base font-medium">{monthTitle()}</div>
        
        <button
          onClick={nextMonth}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "absolute left-8 h-7 w-7 p-0"
          )}
          aria-label="الشهر التالي"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      
      {/* أيام الأسبوع */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {weekdays.map((day, index) => (
          <div key={index} className="flex items-center justify-center h-8">
            <span className="text-muted-foreground text-xs font-medium">{day}</span>
          </div>
        ))}
      </div>
      
      {/* أيام الشهر */}
      <div className="grid grid-cols-7 gap-0">
        {renderCalendar()}
      </div>
    </div>
  );
}

// أضف CSS عالمي لإصلاح عرض التقويم
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    .rdp {
      margin: 0;
    }
    .rdp-month {
      width: 100%;
    }
    .rdp-table {
      width: 100%;
    }
    .rdp-caption {
      position: relative;
      margin-bottom: 8px;
    }
    
    .rdp-head_row,
    .rdp-row {
      display: flex;
      justify-content: space-between;
      width: 100%;
    }
    
    .rdp-head_cell,
    .rdp-cell {
      width: calc(100% / 7);
      text-align: center;
    }
    
    .rdp-cell {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .rdp-head_cell {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 4px 0;
    }
    
    .rdp-button {
      width: 28px;
      height: 28px;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0;
    }
    
    .rdp-day_today:not(.rdp-day_outside) {
      font-weight: bold;
    }
    
    /* تعديل مخصص للتقويم العربي */
    [dir="rtl"] .rdp-nav {
      direction: rtl;
    }
    [dir="rtl"] .rdp-caption_label {
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}

Calendar.displayName = "Calendar"

export { Calendar }