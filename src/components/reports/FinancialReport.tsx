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
  ResponsiveContainer 
} from "recharts";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import ReportFilters, { DateRangeFilter, GroupByOption } from "./ReportFilters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// تعريف لبيانات واجهة API
interface DailyData {
  date: string;
  amount: number;
  orders_count: number;
}

// تعريف نوع البيانات المالية
type FinancialData = {
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
  dateKey: string;
};

export default function FinancialReport() {
  const [data, setData] = useState<FinancialData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  
  // إضافة خيار التجميع (يوم، أسبوع، شهر)
  const [groupBy, setGroupBy] = useState<GroupByOption>("day");
  
  // فلتر الحد الأدنى للمبلغ
  const [minAmount, setMinAmount] = useState<string>("");

  // وظيفة جلب البيانات المالية
  const fetchData = async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    try {
      setIsLoading(true);
      
      // تنسيق التواريخ للطلب
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');
      
      const response = await fetch(`/api/reports/financial?from=${fromDate}&to=${toDate}&groupBy=${groupBy}`);
      
      if (!response.ok) {
        throw new Error('فشل في جلب البيانات المالية');
      }
      
      const result = await response.json();
      
      console.log('API Response:', result); // للتحقق من البيانات المستلمة
      
      // بيانات متوافقة مع API الحالي
      if (result.data) {
        // تحويل البيانات للتنسيق المطلوب للرسم البياني
        const chartData = (result.data.daily_data || []).map((item: DailyData) => ({
          label: item.date,
          revenue: item.amount || 0,
          expenses: 0, // ليس هناك مصروفات في البيانات الحالية
          profit: item.amount || 0, // الربح هو نفس الإيرادات للآن
          dateKey: item.date
        }));
        
        // تطبيق فلتر الحد الأدنى للمبلغ إذا كان محددًا
        let filteredData = chartData;
        if (minAmount && minAmount !== "none" && !isNaN(parseFloat(minAmount))) {
          const minAmountValue = parseFloat(minAmount);
          filteredData = chartData.filter((item: FinancialData) => item.revenue >= minAmountValue);
        }
        
        setData(filteredData);
        
        // تعيين المجاميع من البيانات المتاحة
        setTotalRevenue(result.data.total_amount || 0);
        setTotalExpenses(0); // ليس هناك مصروفات في البيانات الحالية
        setTotalProfit(result.data.total_amount || 0); // الربح هو نفس الإيرادات للآن
      } else {
        // تعيين القيم الافتراضية إذا كانت البيانات غير متوفرة
        setData([]);
        setTotalRevenue(0);
        setTotalExpenses(0);
        setTotalProfit(0);
        console.warn('شكل البيانات المستلمة من API غير متوقع:', result);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('حدث خطأ أثناء جلب البيانات المالية');
    } finally {
      setIsLoading(false);
    }
  };

  // جلب البيانات عند تغيير نطاق التاريخ أو طريقة التجميع
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchData();
    }
  }, [dateRange, groupBy]);
  
  // تطبيق فلتر الحد الأدنى للمبلغ
  useEffect(() => {
    if (!data.length) return;
    
    fetchData();
  }, [minAmount]);

  // تصدير البيانات كملف CSV
  const exportToCSV = () => {
    if (data.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    // إنشاء محتوى الملف
    const headers = ['التاريخ', 'الإيرادات', 'المصروفات', 'الربح'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => `${item.label},${item.revenue},${item.expenses},${item.profit}`)
    ].join('\n');
    
    // إنشاء رابط تنزيل
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `التقرير_المالي_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // صياغة القيم المالية لعرضها
  const formatCurrency = (amount: number) => {
    if (isNaN(amount)) return "0 ج.م";
    
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // فلاتر إضافية للتقرير المالي
  const FinancialFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label className="mb-2 block text-sm">الحد الأدنى للمبلغ</Label>
        <div className="flex">
          <Select 
            value={minAmount} 
            onValueChange={setMinAmount}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الحد الأدنى" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">الكل</SelectItem>
              <SelectItem value="100">أكثر من 100</SelectItem>
              <SelectItem value="500">أكثر من 500</SelectItem>
              <SelectItem value="1000">أكثر من 1000</SelectItem>
              <SelectItem value="5000">أكثر من 5000</SelectItem>
              <SelectItem value="10000">أكثر من 10000</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
        showGroupBy={true}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        additionalFilters={<FinancialFilters />}
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

      {/* بطاقات الملخص */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المصروفات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">صافي الربح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(totalProfit)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الرسم البياني */}
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          لا توجد بيانات مالية متاحة في النطاق الزمني المحدد
        </div>
      ) : (
        <div className="h-[400px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                labelFormatter={(label) => `التاريخ: ${label}`}
              />
              <Legend />
              <Bar dataKey="revenue" name="الإيرادات" fill="#4f46e5" />
              <Bar dataKey="expenses" name="المصروفات" fill="#ef4444" />
              <Bar dataKey="profit" name="الربح" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
} 