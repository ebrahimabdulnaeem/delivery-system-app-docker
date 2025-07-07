"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, FilterIcon, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AdvancedSearchProps {
  cities: { id: string; name: string }[];
  drivers: { id: string; driver_name: string }[];
}

export function AdvancedSearch({ cities, drivers }: AdvancedSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // استخراج معلمات البحث من URL
  const currentBarcode = searchParams.get("barcode") || "";
  const currentName = searchParams.get("name") || "";
  const currentStatus = searchParams.get("status") || "all";
  const currentCity = searchParams.get("city") || "all";
  const currentDriver = searchParams.get("driverId") || "all";
  const currentDate = searchParams.get("date") || "";
  
  // حالة لعرض البحث المتقدم
  const [showAdvanced, setShowAdvanced] = useState(
    !!(currentName || (currentStatus && currentStatus !== "all") || (currentCity && currentCity !== "all") || (currentDriver && currentDriver !== "all") || currentDate)
  );
  
  // حالة للبحث
  const [filters, setFilters] = useState({
    barcode: currentBarcode,
    name: currentName,
    status: currentStatus,
    city: currentCity,
    driverId: currentDriver,
    date: currentDate ? new Date(currentDate) : undefined,
  });
  
  // مؤشر عدد الفلاتر النشطة
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.name) count++;
    if (filters.status && filters.status !== "all") count++;
    if (filters.city && filters.city !== "all") count++;
    if (filters.driverId && filters.driverId !== "all") count++;
    if (filters.date) count++;
    return count;
  };
  
  // معالج تغيير البحث السريع (الباركود فقط)
  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams(searchParams);
    
    // إضافة أو حذف معلمة الباركود
    if (filters.barcode) {
      params.set("barcode", filters.barcode);
    } else {
      params.delete("barcode");
    }
    
    // إعادة تعيين رقم الصفحة
    params.set("page", "1");
    
    // التنقل إلى URL الجديد
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  
  // معالج تطبيق جميع الفلاتر
  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams);
    
    // إعادة تعيين رقم الصفحة
    params.set("page", "1");
    
    // تحديث/إزالة معلمات البحث
    if (filters.barcode) {
      params.set("barcode", filters.barcode);
    } else {
      params.delete("barcode");
    }
    
    if (filters.name) {
      params.set("name", filters.name);
    } else {
      params.delete("name");
    }
    
    if (filters.status && filters.status !== "all") {
      params.set("status", filters.status);
    } else {
      params.delete("status");
    }
    
    if (filters.city && filters.city !== "all") {
      params.set("city", filters.city);
    } else {
      params.delete("city");
    }
    
    if (filters.driverId && filters.driverId !== "all") {
      params.set("driverId", filters.driverId);
    } else {
      params.delete("driverId");
    }
    
    if (filters.date) {
      params.set("date", format(filters.date, "yyyy-MM-dd"));
    } else {
      params.delete("date");
    }
    
    // التنقل إلى URL الجديد
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  
  // معالج إعادة تعيين جميع الفلاتر
  const handleResetFilters = () => {
    setFilters({
      barcode: "",
      name: "",
      status: "all",
      city: "all",
      driverId: "all",
      date: undefined,
    });
    
    // إعادة تعيين URL
    router.push(pathname, { scroll: false });
  };
  
  // تحديث حالة الفلاتر عند تغيير URL
  useEffect(() => {
    setFilters({
      barcode: currentBarcode,
      name: currentName,
      status: currentStatus,
      city: currentCity,
      driverId: currentDriver,
      date: currentDate ? new Date(currentDate) : undefined,
    });
  }, [currentBarcode, currentName, currentStatus, currentCity, currentDriver, currentDate]);
  
  return (
    <div className="space-y-4">
      {/* البحث السريع (بالباركود) */}
      <form onSubmit={handleQuickSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم الباركود..."
            value={filters.barcode}
            onChange={(e) => setFilters({ ...filters, barcode: e.target.value })}
            className="pl-9 w-full"
          />
        </div>
        <Button type="submit" variant="default">بحث</Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1"
        >
          <FilterIcon size={16} />
          فلترة متقدمة
          {getActiveFiltersCount() > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 ml-1 text-xs font-medium text-white bg-primary rounded-full">
              {getActiveFiltersCount()}
            </span>
          )}
        </Button>
      </form>
      
      {/* البحث المتقدم */}
      {showAdvanced && (
        <div className="p-4 border rounded-md space-y-4 bg-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* اسم المستلم */}
            <div className="space-y-2">
              <Label>اسم المستلم</Label>
              <Input 
                placeholder="البحث باسم المستلم" 
                value={filters.name} 
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
            </div>
            
            {/* حالة الطلب */}
            <div className="space-y-2">
              <Label>حالة الطلب</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="entered">مدخل</SelectItem>
                  <SelectItem value="assigned">معين لسائق</SelectItem>
                  <SelectItem value="out_for_delivery">قيد التوصيل</SelectItem>
                  <SelectItem value="delivered">تم التوصيل</SelectItem>
                  <SelectItem value="partial_return">إرجاع جزئي</SelectItem>
                  <SelectItem value="full_return">إرجاع كامل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* المدينة */}
            <div className="space-y-2">
              <Label>المدينة</Label>
              <Select 
                value={filters.city} 
                onValueChange={(value) => setFilters({ ...filters, city: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="جميع المدن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المدن</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* السائق */}
            <div className="space-y-2">
              <Label>السائق</Label>
              <Select 
                value={filters.driverId} 
                onValueChange={(value) => setFilters({ ...filters, driverId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="جميع السائقين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع السائقين</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.driver_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* التاريخ */}
            <div className="space-y-2">
              <Label>تاريخ الطلب</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between text-right font-normal",
                      !filters.date && "text-muted-foreground"
                    )}
                  >
                    {filters.date ? (
                      format(filters.date, "PPP")
                    ) : (
                      <span>اختر التاريخ</span>
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    className="w-auto"
                    selected={filters.date}
                    onSelect={(date) => setFilters({ ...filters, date })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* زر مسح التاريخ */}
            {filters.date && (
              <div className="flex items-end">
                <Button 
                  variant="ghost" 
                  onClick={() => setFilters({ ...filters, date: undefined })}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  مسح التاريخ
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleResetFilters}>
              إعادة تعيين
            </Button>
            <Button onClick={handleApplyFilters}>
              تطبيق الفلاتر
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 