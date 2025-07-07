"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Printer, Search, Loader2, FileDown } from "lucide-react";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import PrintableWaybills from "./components/PrintableWaybills";
import WaybillsDisplay from "./components/WaybillsDisplay";

// نمط CSS مخصص لمكون DatePicker
const datePickerCustomStyles = `
  .react-datepicker {
    font-family: var(--font-geist-sans);
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background-color: var(--background);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    direction: rtl;
    text-align: right;
  }
  .react-datepicker__header {
    background-color: var(--muted);
    border-bottom: 1px solid var(--border);
    padding: 1rem;
    text-align: center;
  }
  .react-datepicker__day-name, .react-datepicker__day {
    margin: 0.2rem;
    width: 2rem;
    height: 2rem;
    line-height: 2rem;
    border-radius: 0.25rem;
  }
  .react-datepicker__day:hover {
    background-color: var(--primary);
    color: var(--primary-foreground);
  }
  .react-datepicker__day--selected {
    background-color: var(--primary);
    color: var(--primary-foreground);
  }
  .react-datepicker__day--outside-month {
    color: var(--muted-foreground);
  }
`;

// واجهة الطلب
interface Order {
  id: string;
  barcode: string;
  order_date: string;
  recipient_name: string;
  recipient_phone1: string;
  recipient_phone2?: string | null;
  recipient_address: string;
  recipient_city: string;
  cod_amount: number;
  order_description?: string | null;
  special_instructions?: string | null;
  sender_reference?: string | null;
  number_of_pieces?: number | null;
  status: string;
  driver_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function WaybillsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showPrintView, setShowPrintView] = useState(false);
  const waybillsPerPage = 4; // قيمة ثابتة لعدد البوالص في كل صفحة

  // إضافة أنماط CSS المخصصة
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = datePickerCustomStyles;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // جلب البيانات عند تغيير التاريخ
  useEffect(() => {
    if (selectedDate && user) {
      handleSearch();
    }
  }, [selectedDate]);

  // معالجة تغيير التاريخ
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  // تنفيذ البحث عن الطلبات بناءً على التاريخ المحدد
  const handleSearch = async () => {
    if (!selectedDate) {
      toast.error("يرجى تحديد تاريخ للبحث");
      return;
    }

    try {
      setIsLoading(true);
      
      // تنسيق التاريخ بالشكل المناسب للبحث
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // استعلام عن الطلبات بناءً على التاريخ المحدد مع طلب جميع النتائج
      const response = await fetch(`/api/orders?date=${formattedDate}&all=true`);
      
      if (!response.ok) {
        throw new Error("فشل في جلب البيانات");
      }
      
      const data = await response.json();
      setOrders(data.data || []);
      
      if ((data.data || []).length === 0) {
        toast.info("لا توجد طلبات في هذا التاريخ");
      } else {
        toast.success(`تم العثور على ${data.data.length} طلب في التاريخ المحدد`);
      }
    } catch (error) {
      console.error("خطأ في جلب الطلبات:", error);
      toast.error("حدث خطأ أثناء جلب الطلبات");
    } finally {
      setIsLoading(false);
    }
  };

  // معالجة الطباعة
  const handlePrint = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setShowPrintView(false);
      }, 500);
    }, 300);
  };

  // تصدير البوالص إلى ملف CSV
  const exportToCsv = () => {
    if (orders.length === 0) {
      toast.error("لا توجد بوالص لتصديرها");
      return;
    }

    try {
      setIsExporting(true);

      // تحضير بيانات الملف بالتنسيق المطلوب
      const formattedDate = format(selectedDate as Date, 'ddMMyyyy');
      
      // تحويل البيانات إلى التنسيق المطلوب
      const csvData = orders.map(order => {
        // استخراج التاريخ فقط بدون الوقت (YYYY-MM-DD)
        const dateStr = order.order_date;
        const datePart = dateStr.split('T')[0];
        // تحويله إلى التنسيق المطلوب (dd/MM/yyyy)
        const [year, month, day] = datePart.split('-');
        const formattedOrderDate = `${day}/${month}/${year}`;
        
        // التعامل الآمن مع قيمة المبلغ
        let codAmount = "0.00";
        if (order.cod_amount !== null && order.cod_amount !== undefined) {
          // التحقق من نوع البيانات وتحويلها إلى رقم إذا لزم الأمر
          const numericAmount = typeof order.cod_amount === 'number' 
            ? order.cod_amount 
            : parseFloat(String(order.cod_amount));
          
          // التحقق من صحة الرقم
          if (!isNaN(numericAmount)) {
            codAmount = numericAmount.toFixed(2);
          }
        }
        
        return {
          WaybillSerial: order.barcode,
          ShipperReference: order.barcode,
          WaybillPieces: order.number_of_pieces || 1,
          WaybillComment: order.special_instructions || order.order_description || "",
          WaybillCODValue: codAmount,
          ConsigneeName: order.recipient_name,
          ConsigneeMobile: order.recipient_phone1,
          ConsigneePhone: order.recipient_phone2 || "",
          DestinationCityName: order.recipient_city,
          ConsigneeDestinationAddress: order.recipient_address,
          WaybillBickupDate: formattedOrderDate,
          PreviousStatusName: "",
          StatusCategoryName: "In Progress",
          LastStatusName: order.status === "delivered" ? "تم التسليم" :
                         order.status === "full_return" ? "مرتجع كلي" :
                         order.status === "partial_return" ? "مرتجع جزئي" :
                         order.status === "assigned" ? "معين لمندوب" :
                         order.status === "out_for_delivery" ? "خرج للتوصيل" : "مدخل",
          LastStatusUpdatedDate: formattedOrderDate,
          LastStatusComment: "",
          LastStatusRefusalReasonsName: "",
          CS_LastStatusName: "",
          CS_LastStatusUpdatedDate: "",
          CS_LastStatusComment: "",
          CS_LastStatusRefusalReasonsName: "",
          WaybillCondition: "Green"
        };
      });

      // تحويل البيانات إلى CSV
      const headers = Object.keys(csvData[0]);
      let csvContent = headers.join(',') + '\n';
      
      csvData.forEach(row => {
        const rowValues = headers.map(header => {
          const value = row[header as keyof typeof row];
          // إذا كانت البيانات تحتوي على فواصل أو سطور جديدة، نضعها بين علامتي اقتباس
          if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvContent += rowValues.join(',') + '\n';
      });

      // إنشاء وتنزيل الملف
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const fileName = `belladonna_${formattedDate}.csv`;
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("تم تصدير البوالص بنجاح");
    } catch (error) {
      console.error("خطأ في تصدير البوالص:", error);
      toast.error("حدث خطأ أثناء تصدير البوالص");
    } finally {
      setIsExporting(false);
    }
  };

  // عرض الواجهة
  return (
    <MainLayout>
      <div className="container mx-auto py-8 max-w-5xl">
        {/* رأس الصفحة */}
        <div className="flex justify-between items-center mb-8 no-print">
          <h1 className="text-3xl font-bold">إدارة بوالص الشحن</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard/orders")}
            className="px-6"
          >
            العودة إلى قائمة الطلبات
          </Button>
        </div>

        {/* بطاقة البحث واختيار التاريخ */}
        <Card className="bg-white shadow-sm mb-8 no-print">
          <CardContent className="p-6">
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                {/* اختيار التاريخ */}
                <div>
                  <Label htmlFor="order_date" className="block mb-2 font-medium">
                    تاريخ البوالص
                  </Label>
                  <div className="relative">
                    <DatePicker
                      id="order_date"
                      selected={selectedDate}
                      onChange={handleDateChange}
                      dateFormat="dd/MM/yyyy"
                      locale={ar}
                      className="w-full rounded-md border p-3 border-gray-200"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      placeholderText="حدد التاريخ"
                    />
                  </div>
                </div>

                {/* أزرار البحث والطباعة */}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSearch} 
                    className="flex-1 gap-2"
                    disabled={isLoading || !selectedDate}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    بحث
                  </Button>
                  <Button 
                    onClick={handlePrint} 
                    className="flex-1 gap-2"
                    variant="outline"
                    disabled={isLoading || orders.length === 0}
                  >
                    <Printer className="h-4 w-4" />
                    طباعة
                  </Button>
                  <Button 
                    onClick={exportToCsv} 
                    className="flex-1 gap-2"
                    variant="secondary"
                    disabled={isLoading || orders.length === 0 || isExporting}
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                    CSV تصدير
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* عرض نتائج البحث */}
        {orders.length > 0 && (
          <>
            {/* عرض البوالص للواجهة العادية */}
            {!showPrintView && <WaybillsDisplay orders={orders} />}
            
            {/* عرض البوالص للطباعة - يظهر فقط عند الطباعة */}
            {showPrintView && <PrintableWaybills orders={orders} waybillsPerPage={waybillsPerPage} />}
          </>
        )}

        {/* رسالة عدم وجود بيانات */}
        {orders.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">لا توجد بوالص شحن</h3>
            <p className="text-gray-500 mt-1">
              اختر تاريخًا آخر أو تحقق من وجود بوالص شحن تم إنشاؤها في التاريخ المحدد
            </p>
          </div>
        )}

        {/* عرض حالة التحميل */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-medium text-gray-900">جاري تحميل البيانات</h3>
            <p className="text-gray-500 mt-1">يرجى الانتظار...</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 