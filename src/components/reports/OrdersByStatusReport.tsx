"use client";

import { useState, useEffect } from "react";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend 
} from "recharts";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ReportFilters, { DateRangeFilter } from "./ReportFilters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// تعريف نوع البيانات
type OrderStatusData = {
  status: string;
  count: number;
};

// ترجمة حالات الطلب
const statusTranslations: Record<string, string> = {
  "pending": "قيد الانتظار",
  "assigned": "تم التعيين",
  "out_for_delivery": "قيد التوصيل",
  "delivered": "تم التسليم",
  "returned": "مرتجع",
  "cancelled": "ملغي"
};

export default function OrdersByStatusReport() {
  const [data, setData] = useState<OrderStatusData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  
  // فلتر حالة الطلب
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // جلب البيانات
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // تنسيق التواريخ
      const fromDate = format(dateRange.from || new Date(), 'yyyy-MM-dd');
      const toDate = format(dateRange.to || new Date(), 'yyyy-MM-dd');
      
      // إضافة فلتر الحالة للطلب إذا كان محددًا
      const statusParam = statusFilter !== "all" ? `&status=${statusFilter}` : '';
      
      const response = await fetch(`/api/reports/orders-by-status?from=${fromDate}&to=${toDate}${statusParam}`);
      
      if (!response.ok) {
        throw new Error('فشل في جلب البيانات');
      }
      
      const result = await response.json();
      
      // تحويل البيانات وترجمة الحالات
      const formattedData = result.data.map((item: { status: string; count: number }) => ({
        status: statusTranslations[item.status] || item.status,
        count: item.count
      }));
      
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching status report:', error);
      toast.error('حدث خطأ أثناء جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  // جلب البيانات عند تغيير نطاق التاريخ أو فلتر الحالة
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchData();
    }
  }, [dateRange, statusFilter]);

  // تصدير البيانات كملف CSV
  const exportToCSV = () => {
    if (data.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    // إنشاء محتوى الملف
    const headers = ['الحالة', 'عدد الطلبات'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => `${item.status},${item.count}`)
    ].join('\n');
    
    // إنشاء رابط تنزيل
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_الطلبات_حسب_الحالة_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // الألوان للرسم البياني
  const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#22c55e", "#f97316", "#ef4444"];
  
  // مكون فلتر حالة الطلب
  const StatusFilter = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label className="mb-2 block text-sm">حالة الطلب</Label>
        <Select 
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر حالة الطلب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
            <SelectItem value="assigned">تم التعيين</SelectItem>
            <SelectItem value="out_for_delivery">قيد التوصيل</SelectItem>
            <SelectItem value="delivered">تم التسليم</SelectItem>
            <SelectItem value="returned">مرتجع</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <ReportFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        isLoading={isLoading}
        onRefresh={fetchData}
        additionalFilters={<StatusFilter />}
      />
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={exportToCSV}
          disabled={isLoading || data.length === 0}
        >
          <FileDown className="ml-2 h-4 w-4" />
          تصدير لملف CSV
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          لا توجد بيانات متاحة في النطاق الزمني المحدد
        </div>
      ) : (
        <div className="pt-4 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="status" type="category" width={120} />
              <Tooltip formatter={(value) => [`${value} طلب`, 'عدد الطلبات']} />
              <Legend />
              <Bar dataKey="count" name="عدد الطلبات" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {data.length > 0 && (
        <div className="pt-6">
          <h3 className="text-lg font-medium mb-2">ملخص الطلبات حسب الحالة</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.map((item, index) => (
              <div 
                key={item.status} 
                className="border rounded-lg p-4 flex flex-col items-center"
                style={{ borderColor: COLORS[index % COLORS.length] }}
              >
                <div className="text-2xl font-bold">{item.count}</div>
                <div className="text-sm text-muted-foreground">{item.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 