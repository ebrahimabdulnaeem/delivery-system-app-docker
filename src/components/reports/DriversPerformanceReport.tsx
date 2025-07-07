"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ReportFilters, { DateRangeFilter } from "./ReportFilters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// تعريف نوع البيانات
type DriverPerformanceData = {
  driver_id: number;
  driver_name: string;
  delivered_orders: number;
  returned_orders: number;
  total_orders: number;
  delivery_rate: number;
  average_delivery_time: number;
  total_cod_amount: number;
};

export default function DriversPerformanceReport() {
  const [data, setData] = useState<DriverPerformanceData[]>([]);
  const [filteredData, setFilteredData] = useState<DriverPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  
  // فلاتر إضافية
  const [driverSearch, setDriverSearch] = useState<string>("");
  const [minDeliveryRate, setMinDeliveryRate] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("total_orders");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // جلب البيانات
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // تنسيق التواريخ
      const fromDate = format(dateRange.from || new Date(), 'yyyy-MM-dd');
      const toDate = format(dateRange.to || new Date(), 'yyyy-MM-dd');
      
      const response = await fetch(`/api/reports/drivers-performance?from=${fromDate}&to=${toDate}`);
      
      if (!response.ok) {
        throw new Error('فشل في جلب البيانات');
      }
      
      const result = await response.json();
      
      setData(result.data || []);
      applyFilters(result.data || []);
    } catch (error) {
      console.error('Error fetching drivers performance data:', error);
      toast.error('حدث خطأ أثناء جلب بيانات أداء السائقين');
    } finally {
      setIsLoading(false);
    }
  };
  
  // تطبيق الفلاتر على البيانات
  const applyFilters = (dataToFilter: DriverPerformanceData[]) => {
    let filtered = [...dataToFilter];
    
    // فلتر بحث اسم السائق
    if (driverSearch.trim()) {
      filtered = filtered.filter(driver => 
        driver.driver_name.toLowerCase().includes(driverSearch.toLowerCase())
      );
    }
    
    // فلتر نسبة التوصيل
    if (minDeliveryRate && minDeliveryRate !== "0") {
      const rateValue = parseFloat(minDeliveryRate);
      if (!isNaN(rateValue)) {
        filtered = filtered.filter(driver => driver.delivery_rate >= rateValue);
      }
    }
    
    // ترتيب البيانات
    filtered.sort((a, b) => {
      const valueA = a[sortBy as keyof DriverPerformanceData] as number;
      const valueB = b[sortBy as keyof DriverPerformanceData] as number;
      
      return sortOrder === "asc" 
        ? valueA - valueB 
        : valueB - valueA;
    });
    
    setFilteredData(filtered);
  };

  // جلب البيانات عند تغيير نطاق التاريخ
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchData();
    }
  }, [dateRange]);
  
  // تطبيق الفلاتر عند تغييرها
  useEffect(() => {
    applyFilters(data);
  }, [driverSearch, minDeliveryRate, sortBy, sortOrder]);

  // تصدير البيانات كملف CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    // إنشاء محتوى الملف
    const headers = ['اسم السائق', 'الطلبات المكتملة', 'الطلبات المرتجعة', 'إجمالي الطلبات', 'نسبة التوصيل', 'متوسط وقت التوصيل (بالساعات)', 'إجمالي المبالغ المحصلة'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => 
        `${item.driver_name},${item.delivered_orders},${item.returned_orders},${item.total_orders},${item.delivery_rate.toFixed(2)}%,${item.average_delivery_time.toFixed(2)},${item.total_cod_amount}`
      )
    ].join('\n');
    
    // إنشاء رابط تنزيل
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_أداء_السائقين_${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
  
  // صياغة الوقت
  const formatTime = (hours: number) => {
    if (isNaN(hours) || hours === 0) return "لا يوجد";
    
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h} ساعة ${m} دقيقة`;
  };
  
  // صياغة المبالغ المالية
  const formatCurrency = (amount: number) => {
    if (isNaN(amount)) return "0 ج.م";
    
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // مكون فلاتر إضافية للتقرير
  const DriverFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <Label className="mb-2 block text-sm">بحث عن سائق</Label>
        <Input
          placeholder="اكتب اسم السائق"
          value={driverSearch}
          onChange={(e) => setDriverSearch(e.target.value)}
        />
      </div>
      
      <div>
        <Label className="mb-2 block text-sm">الحد الأدنى لنسبة التوصيل</Label>
        <Select
          value={minDeliveryRate}
          onValueChange={setMinDeliveryRate}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر نسبة التوصيل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">الكل</SelectItem>
            <SelectItem value="50">أكثر من 50%</SelectItem>
            <SelectItem value="75">أكثر من 75%</SelectItem>
            <SelectItem value="90">أكثر من 90%</SelectItem>
            <SelectItem value="95">أكثر من 95%</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="mb-2 block text-sm">ترتيب حسب</Label>
        <Select
          value={sortBy}
          onValueChange={setSortBy}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر طريقة الترتيب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="total_orders">إجمالي الطلبات</SelectItem>
            <SelectItem value="delivered_orders">الطلبات المكتملة</SelectItem>
            <SelectItem value="delivery_rate">نسبة التوصيل</SelectItem>
            <SelectItem value="average_delivery_time">متوسط وقت التوصيل</SelectItem>
            <SelectItem value="total_cod_amount">إجمالي المبالغ المحصلة</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="mb-2 block text-sm">اتجاه الترتيب</Label>
        <Select
          value={sortOrder}
          onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر اتجاه الترتيب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">تنازلي</SelectItem>
            <SelectItem value="asc">تصاعدي</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <ReportFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        isLoading={isLoading}
        onRefresh={fetchData}
        additionalFilters={<DriverFilters />}
      />
      
      {/* ملخص عام */}
      {!isLoading && filteredData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي السائقين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredData.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">متوسط نسبة التوصيل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {filteredData.length > 0 
                  ? `${(filteredData.reduce((sum, driver) => sum + driver.delivery_rate, 0) / filteredData.length).toFixed(1)}%`
                  : "0%"
                }
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">متوسط وقت التوصيل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {filteredData.length > 0 
                  ? formatTime(filteredData.reduce((sum, driver) => sum + (driver.average_delivery_time || 0), 0) / filteredData.length)
                  : "لا يوجد"
                }
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المبالغ المحصلة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {filteredData.length > 0 
                  ? formatCurrency(filteredData.reduce((sum, driver) => sum + (driver.total_cod_amount || 0), 0))
                  : formatCurrency(0)
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
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
        <>
          {/* الرسم البياني - نسبة التوصيل */}
          <div className="pt-4 h-[400px]">
            <h3 className="text-lg font-medium mb-2">نسبة التوصيل</h3>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={filteredData.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis 
                  dataKey="driver_name" 
                  type="category" 
                  width={120} 
                  tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value} 
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'نسبة التوصيل']}
                  labelFormatter={(label) => `السائق: ${label}`} 
                />
                <Legend />
                <Bar dataKey="delivery_rate" name="نسبة التوصيل" radius={[0, 4, 4, 0]}>
                  {filteredData.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* جدول البيانات */}
          <div className="pt-6">
            <h3 className="text-lg font-medium mb-2">تفاصيل أداء السائقين</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-right border">اسم السائق</th>
                    <th className="px-4 py-2 text-center border">إجمالي الطلبات</th>
                    <th className="px-4 py-2 text-center border">الطلبات المسلمة</th>
                    <th className="px-4 py-2 text-center border">الطلبات المرتجعة</th>
                    <th className="px-4 py-2 text-center border">نسبة التوصيل</th>
                    <th className="px-4 py-2 text-center border">متوسط وقت التوصيل</th>
                    <th className="px-4 py-2 text-center border">المبالغ المحصلة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((driver, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">
                        {driver.driver_name}
                        {driver.delivery_rate >= 95 && (
                          <Badge className="mr-2 bg-green-500">متميز</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center border">{driver.total_orders}</td>
                      <td className="px-4 py-2 text-center border">{driver.delivered_orders}</td>
                      <td className="px-4 py-2 text-center border">{driver.returned_orders}</td>
                      <td className="px-4 py-2 text-center border">
                        <span 
                          className={`
                            ${driver.delivery_rate >= 90 ? 'text-green-600' : ''}
                            ${driver.delivery_rate >= 75 && driver.delivery_rate < 90 ? 'text-blue-600' : ''}
                            ${driver.delivery_rate >= 50 && driver.delivery_rate < 75 ? 'text-orange-500' : ''}
                            ${driver.delivery_rate < 50 ? 'text-red-600' : ''}
                            font-semibold
                          `}
                        >
                          {driver.delivery_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center border">{formatTime(driver.average_delivery_time)}</td>
                      <td className="px-4 py-2 text-center border">{formatCurrency(driver.total_cod_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 