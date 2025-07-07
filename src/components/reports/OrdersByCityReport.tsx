"use client";

import { useState, useEffect } from "react";
import { 
  PieChart, 
  Pie, 
  ResponsiveContainer, 
  Tooltip, 
  Cell,
  Legend 
} from "recharts";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ReportFilters, { DateRangeFilter } from "./ReportFilters";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// تعريف نوع البيانات
type OrderCityData = {
  city: string;
  count: number;
  percentage: number;
};

export default function OrdersByCityReport() {
  const [data, setData] = useState<OrderCityData[]>([]);
  const [filteredData, setFilteredData] = useState<OrderCityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  
  // فلتر المدينة
  const [cityFilter, setCityFilter] = useState<string>("");

  // جلب البيانات
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // تنسيق التواريخ
      const fromDate = format(dateRange.from || new Date(), 'yyyy-MM-dd');
      const toDate = format(dateRange.to || new Date(), 'yyyy-MM-dd');
      
      const response = await fetch(`/api/reports/orders-by-city?from=${fromDate}&to=${toDate}`);
      
      if (!response.ok) {
        throw new Error('فشل في جلب البيانات');
      }
      
      const result = await response.json();
      
      setData(result.data);
      filterData(result.data, cityFilter);
    } catch (error) {
      console.error('Error fetching city report:', error);
      toast.error('حدث خطأ أثناء جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };
  
  // تطبيق الفلتر على البيانات
  const filterData = (data: OrderCityData[], filter: string) => {
    if (!filter.trim()) {
      setFilteredData(data);
      return;
    }
    
    const filtered = data.filter(item => 
      item.city.toLowerCase().includes(filter.toLowerCase())
    );
    
    // إعادة حساب النسب المئوية للعناصر المفلترة
    const total = filtered.reduce((sum, item) => sum + item.count, 0);
    const recalculated = filtered.map(item => ({
      ...item,
      percentage: total > 0 ? (item.count / total) * 100 : 0
    }));
    
    setFilteredData(recalculated);
  };

  // جلب البيانات عند تغيير نطاق التاريخ
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchData();
    }
  }, [dateRange]);
  
  // تطبيق الفلتر عند تغييره أو تغيير البيانات
  useEffect(() => {
    filterData(data, cityFilter);
  }, [data, cityFilter]);

  // تصدير البيانات كملف CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    // إنشاء محتوى الملف
    const headers = ['المدينة', 'عدد الطلبات', 'النسبة المئوية'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => `${item.city},${item.count},${item.percentage.toFixed(2)}%`)
    ].join('\n');
    
    // إنشاء رابط تنزيل
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_الطلبات_حسب_المدينة_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // الألوان للرسم البياني
  const COLORS = [
    "#4f46e5", "#0ea5e9", "#10b981", "#22c55e", "#f97316", "#ef4444",
    "#a855f7", "#ec4899", "#14b8a6", "#f59e0b", "#d946ef", "#0284c7"
  ];
  
  // مكون فلتر المدينة
  const CityFilter = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label className="mb-2 block text-sm">بحث حسب المدينة</Label>
        <Input
          placeholder="اكتب اسم المدينة للبحث"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        />
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
        additionalFilters={<CityFilter />}
      />
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={exportToCSV}
          disabled={isLoading || filteredData.length === 0}
        >
          <FileDown className="ml-2 h-4 w-4" />
          تصدير لملف CSV
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          لا توجد بيانات متاحة في النطاق الزمني المحدد
        </div>
      ) : (
        <div className="pt-4 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="count"
                nameKey="city"
                label={({ city, percentage }) => `${city}: ${percentage.toFixed(1)}%`}
              >
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => {
                  return [`${value} طلب (${props.payload.percentage.toFixed(1)}%)`, props.payload.city];
                }} 
              />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {filteredData.length > 0 && (
        <div className="pt-6">
          <h3 className="text-lg font-medium mb-2">ملخص الطلبات حسب المدينة</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-right border">المدينة</th>
                  <th className="px-4 py-2 text-center border">عدد الطلبات</th>
                  <th className="px-4 py-2 text-center border">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{item.city}</td>
                    <td className="px-4 py-2 text-center border">{item.count}</td>
                    <td className="px-4 py-2 text-center border">{item.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 