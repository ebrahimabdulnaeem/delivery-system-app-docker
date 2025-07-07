"use client";

import * as React from "react";
import { addDays } from "date-fns";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { CalendarDialog } from "@/components/ui/calendar-dialog";

// أنواع الفلاتر
export type DateRangeFilter = {
  from: Date;
  to: Date;
};

export type TimeRangeOption = "today" | "yesterday" | "last7days" | "last30days" | "thisMonth" | "lastMonth" | "custom";

export type GroupByOption = "day" | "week" | "month";

export type ReportFilterProps = {
  dateRange: DateRangeFilter;
  onDateRangeChange: (dateRange: DateRangeFilter) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  // الخيارات الإضافية حسب نوع التقرير
  showGroupBy?: boolean;
  groupBy?: GroupByOption;
  onGroupByChange?: (groupBy: GroupByOption) => void;
  // خيارات إضافية حسب التقرير
  additionalFilters?: React.ReactNode;
};

export default function ReportFilters({
  dateRange,
  onDateRangeChange,
  isLoading = false,
  onRefresh,
  showGroupBy = false,
  groupBy = "day",
  onGroupByChange,
  additionalFilters,
}: ReportFilterProps) {
  // حالة الفترة الزمنية المحددة
  const [timeRange, setTimeRange] = React.useState<TimeRangeOption>("last30days");
  
  // تحديث نطاق التاريخ بناءً على الفترة الزمنية المحددة
  const updateDateRange = React.useCallback((option: TimeRangeOption) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    let fromDate: Date;
    let toDate = today;
    
    switch (option) {
      case "today":
        fromDate = new Date(today);
        fromDate.setHours(0, 0, 0, 0);
        break;
      case "yesterday":
        fromDate = addDays(today, -1);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(fromDate);
        toDate.setHours(23, 59, 59, 999);
        break;
      case "last7days":
        fromDate = addDays(today, -6);
        fromDate.setHours(0, 0, 0, 0);
        break;
      case "last30days":
        fromDate = addDays(today, -29);
        fromDate.setHours(0, 0, 0, 0);
        break;
      case "thisMonth": {
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        fromDate.setHours(0, 0, 0, 0);
        break;
      }
      case "lastMonth": {
        const lastMonth = today.getMonth() - 1;
        const year = lastMonth < 0 ? today.getFullYear() - 1 : today.getFullYear();
        const month = lastMonth < 0 ? 11 : lastMonth;
        fromDate = new Date(year, month, 1);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(year, month + 1, 0);
        toDate.setHours(23, 59, 59, 999);
        break;
      }
      case "custom":
        // لا تغير نطاق التاريخ للاختيار المخصص
        return;
      default:
        fromDate = addDays(today, -29);
        fromDate.setHours(0, 0, 0, 0);
    }
    
    onDateRangeChange({ from: fromDate, to: toDate });
  }, [onDateRangeChange]);
  
  // تحديث الفترة الزمنية عند تغيير نطاق التاريخ خارجيًا
  React.useEffect(() => {
    // تعيين الفترة الزمنية "مخصص" افتراضيًا عند تحميل المكون
    setTimeRange("custom");
  }, [dateRange]);
  
  // معالجة تغيير الفترة الزمنية
  const handleTimeRangeChange = (value: TimeRangeOption) => {
    setTimeRange(value);
    updateDateRange(value);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid gap-4 md:grid-cols-12">
          {/* فلتر الفترة الزمنية */}
          <div className="md:col-span-4">
            <Label className="mb-2 block text-sm">الفترة الزمنية</Label>
            <Select 
              value={timeRange} 
              onValueChange={(value) => handleTimeRangeChange(value as TimeRangeOption)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الفترة الزمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="yesterday">أمس</SelectItem>
                <SelectItem value="last7days">آخر 7 أيام</SelectItem>
                <SelectItem value="last30days">آخر 30 يوم</SelectItem>
                <SelectItem value="thisMonth">الشهر الحالي</SelectItem>
                <SelectItem value="lastMonth">الشهر الماضي</SelectItem>
                <SelectItem value="custom">مخصص</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* عرض نطاق التاريخ المحدد مع إمكانية اختيار تاريخ مخصص */}
          <div className="md:col-span-4">
            <Label className="mb-2 block text-sm">نطاق التاريخ</Label>
            <div className="flex space-x-2 rtl:space-x-reverse">
              {/* مكون التاريخ من */}
              <div className="flex-1">
                <CalendarDialog
                  date={dateRange.from}
                  onSelect={(date) => date && onDateRangeChange({ ...dateRange, from: date })}
                  disabled={timeRange !== 'custom'}
                  placeholder="تاريخ البداية"
                />
              </div>
              
              <span className="flex items-center">-</span>
              
              {/* مكون التاريخ إلى */}
              <div className="flex-1">
                <CalendarDialog
                  date={dateRange.to}
                  onSelect={(date) => date && onDateRangeChange({ ...dateRange, to: date })}
                  disabled={timeRange !== 'custom'}
                  placeholder="تاريخ النهاية"
                />
              </div>
            </div>
          </div>
          
          {/* فلتر التجميع حسب (إذا كان مطلوبًا) */}
          {showGroupBy && onGroupByChange && (
            <div className="md:col-span-2">
              <Label className="mb-2 block text-sm">تجميع حسب</Label>
              <Select 
                value={groupBy} 
                onValueChange={(value) => onGroupByChange(value as GroupByOption)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="تجميع حسب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">يوم</SelectItem>
                  <SelectItem value="week">أسبوع</SelectItem>
                  <SelectItem value="month">شهر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* زر التحديث */}
          <div className={`flex items-end ${showGroupBy ? "md:col-span-2" : "md:col-span-4"}`}>
            {onRefresh && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={onRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="ml-2 h-4 w-4" />
                )}
                تحديث
              </Button>
            )}
          </div>
        </div>
        
        {/* فلاتر إضافية خاصة بكل تقرير */}
        {additionalFilters && (
          <>
            <Separator className="my-4" />
            {additionalFilters}
          </>
        )}
      </CardContent>
    </Card>
  );
} 