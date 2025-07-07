"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Loader2, 
  FileText, 
  Calendar, 
  User, 
  QrCode, 
  Printer, 
  Info, 
  AlertTriangle 
} from "lucide-react";
import DatePicker from "react-datepicker";
import { format, isValid, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// تعريف واجهة شيت المندوب
interface DelegateSheet {
  id: string;
  sheet_barcode: string;
  driver_id: string;
  total_amount: number;
  order_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  drivers: {
    id: string;
    driver_name: string;
    driver_phone: string;
    driver_id_number?: string | null;
  };
}

// تعريف واجهة الطلب
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
  status: string;
}

// تعريف واجهة المندوب
interface Driver {
  id: string;
  driver_name: string;
  driver_phone: string;
  driver_id_number?: string | null;
}

export default function DelegateSheetSearchPage() {
  const router = useRouter();
  
  // حالة البحث
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<DelegateSheet[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // معايير البحث
  const [searchBarcode, setSearchBarcode] = useState("");
  const [searchDriverId, setSearchDriverId] = useState("");
  const [searchDate, setSearchDate] = useState<Date | null>(null);
  
  // قائمة المناديب
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  // جلب قائمة المناديب عند تحميل الصفحة
  useEffect(() => {
    fetchDrivers();
  }, []);
  
  // جلب نتائج البحث عند تغيير معايير البحث أو الصفحة
  useEffect(() => {
    if (searchBarcode || searchDriverId || searchDate) {
      searchDelegateSheets();
    }
  }, [currentPage, pageSize, searchBarcode, searchDriverId, searchDate]);
  
  // جلب قائمة المناديب
  const fetchDrivers = async () => {
    try {
      const response = await fetch("/api/drivers");
      
      if (!response.ok) {
        throw new Error("فشل في جلب قائمة المناديب");
      }
      
      const data = await response.json();
      setDrivers(data.data || []);
    } catch (error) {
      console.error("خطأ في جلب المناديب:", error);
      toast.error("حدث خطأ أثناء جلب قائمة المناديب");
    }
  };
  
  // البحث عن شيتات المندوبين
  const searchDelegateSheets = async () => {
    try {
      setIsLoading(true);
      
      // بناء معايير البحث
      const searchParams = new URLSearchParams();
      searchParams.append("page", currentPage.toString());
      searchParams.append("limit", pageSize.toString());
      
      if (searchBarcode) {
        searchParams.append("barcode", searchBarcode);
      }
      
      if (searchDriverId && searchDriverId !== "all") {
        searchParams.append("driverId", searchDriverId);
      }
      
      if (searchDate && isValid(searchDate)) {
        searchParams.append("date", format(searchDate, "yyyy-MM-dd"));
      }
      
      // إرسال طلب البحث
      const response = await fetch(`/api/delegate-sheets?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error("فشل في البحث عن شيتات المندوبين");
      }
      
      const data = await response.json();
      setSearchResults(data.data || []);
      setTotalResults(data.meta?.total || 0);
      setTotalPages(data.meta?.pages || 1);
    } catch (error) {
      console.error("خطأ في البحث عن شيتات المندوبين:", error);
      toast.error("حدث خطأ أثناء البحث عن شيتات المندوبين");
    } finally {
      setIsLoading(false);
    }
  };
  
  // معالجة تغيير الصفحة
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  // معالجة تغيير حجم الصفحة
  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
    setCurrentPage(1); // إعادة التعيين إلى الصفحة الأولى عند تغيير حجم الصفحة
  };
  
  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "yyyy/MM/dd - HH:mm", { locale: ar });
    } catch (error) {
      return dateString;
    }
  };
  
  // تنسيق المبلغ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // إعادة طباعة الشيت
  const handleReprintSheet = (sheet: DelegateSheet) => {
    router.push(`/dashboard/delegate-sheets/details?id=${sheet.id}`);
  };
  
  // طباعة الشيت
  const handlePrintSheet = (sheet: DelegateSheet, orders: Order[]) => {
    // فتح نافذة طباعة جديدة
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error("يرجى السماح بالنوافذ المنبثقة للطباعة");
      return;
    }
    
    // الحصول على التاريخ والوقت الحالي
    const currentDate = new Date();
    const dateFormatted = currentDate.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeFormatted = currentDate.toLocaleTimeString('ar-EG');

    // إنشاء محتوى HTML للطباعة
    const printContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>شيت المندوب - ${sheet.drivers.driver_name}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 1cm;
            }
          }
          body {
            font-family: 'Arial', sans-serif;
            direction: rtl;
            padding: 20px;
          }
          .print-container {
            width: 100%;
          }
          
          /* أنماط الرأس الجديدة */
          .header-container {
            margin-bottom: 20px;
          }
          .header-top {
            text-align: center;
            margin-bottom: 10px;
          }
          .sheet-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .print-date {
            font-size: 12px;
            color: #666;
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .driver-info-box {
            border: 1px solid #ddd;
            padding: 10px;
            width: 60%;
          }
          .barcode-box {
            width: 35%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          #barcode-container {
            width: 100%;
            text-align: center;
            margin-bottom: 10px;
          }
          
          .sheet-id {
            margin-top: 10px;
            font-size: 14px;
            text-align: center;
            font-weight: bold;
            display: block;
            width: 100%;
          }
          
          /* أنماط الجدول الجديدة */
          table.orders-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            table-layout: fixed;
            direction: rtl;
          }
          
          /* تحديد عرض الأعمدة */
          table.orders-table th:nth-child(1) {
            width: 5%;  /* رقم */
          }
          
          table.orders-table th:nth-child(2) {
            width: 45%; /* البيانات والباركود */
          }
          
          table.orders-table th:nth-child(3) {
            width: 15%; /* التوقيع */
          }
          
          table.orders-table th:nth-child(4) {
            width: 20%; /* تعليمات خاصة */
          }
          
          table.orders-table th:nth-child(5) {
            width: 15%; /* المبلغ */
          }
          table.orders-table th, 
          table.orders-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
          }
          table.orders-table th {
            background-color: transparent;
            font-weight: bold;
            border-bottom: 2px solid #000;
          }
          table.orders-table .total-row {
            font-weight: bold;
            background-color: transparent;
            border-top: 2px solid #000;
          }
          
          table.orders-table .total-row td:first-child {
            text-align: left;
            padding-left: 15px;
          }
          
          /* أنماط الخلية المدمجة */
          .combined-cell {
            padding: 5px;
            vertical-align: top;
            text-align: right;
            width: 45%;
          }
          .barcode-container {
            width: 100%;
            margin-bottom: 10px;
            text-align: center;
          }
          canvas {
            display: block;
            margin: 0 auto;
            width: 80%;
          }
          
          /* بيانات العميل */
          .customer-data {
            margin-top: 10px;
          }
          .data-row {
            margin-bottom: 5px;
            font-size: 12px;
          }
          .data-label {
            font-weight: bold;
            display: inline-block;
            min-width: 60px;
          }
          
          /* قسم التوقيعات */
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
          }
          .signature-box {
            border-top: 1px solid #000;
            width: 200px;
            padding-top: 5px;
            text-align: center;
          }
          .signature-title {
            font-weight: bold;
            margin-bottom: 40px;
          }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      </head>
      <body>
        <div class="print-container" id="print-container">
          <!-- رأس الصفحة -->
          <div class="header-container">
            <div class="header-top">
              <div class="sheet-title">شيت مندوب</div>
              <div class="print-date">تاريخ الطباعة: ${dateFormatted} - ${timeFormatted}</div>
            </div>
            
            <div class="header-content">
              <div class="driver-info-box">
                <div><strong>اسم المندوب:</strong> ${sheet.drivers.driver_name}</div>
                <div><strong>رقم الهاتف:</strong> ${sheet.drivers.driver_phone}</div>
                ${sheet.drivers.driver_id_number ? `<div><strong>رقم الهوية:</strong> ${sheet.drivers.driver_id_number}</div>` : ''}
              </div>
              
              <div class="barcode-box">
                <canvas id="barcode-container"></canvas>
                <span class="sheet-id">رقم الشيت: ${sheet.sheet_barcode}</span>
              </div>
            </div>
          </div>
          
          <!-- جدول الطلبات -->
          <table class="orders-table">
            <thead>
              <tr>
                <th>م</th>
                <th>البيانات</th>
                <th>توقيع المستلم</th>
                <th>تعليمات خاصة</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map((order, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td class="combined-cell">
                    <div class="barcode-container">
                      <canvas id="order-barcode-${index}"></canvas>
                      <div class="barcode-text">${order.barcode.replace(/[^0-9]/g, '').slice(0, 10)}</div>
                    </div>
                    <div class="customer-data">
                      <div class="data-row recipient-name"><span class="data-label">العميل:</span> ${order.recipient_name}</div>
                      <div class="data-row recipient-address"><span class="data-label">العنوان:</span> ${order.recipient_city} - ${order.recipient_address}</div>
                      <div class="data-row recipient-phone"><span class="data-label">الهاتف:</span> ${order.recipient_phone1}</div>
                    </div>
                  </td>
                  <td></td>
                  <td>${order.special_instructions || ''}</td>
                  <td>${formatCurrency(Number(order.cod_amount))}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4">إجمالي مبلغ التحصيل</td>
                <td>${formatCurrency(Number(sheet.total_amount))}</td>
              </tr>
            </tfoot>
          </table>
          
          <!-- قسم التوقيعات -->
          <div class="signatures">
            <div class="signature-box">
              <div class="signature-title">توقيع المندوب</div>
            </div>
            <div class="signature-box">
              <div class="signature-title">توقيع المسؤول</div>
            </div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            // توليد الباركود الرئيسي (أرقام فقط)
            // التأكد من أن معرف الشيت يحتوي على أرقام فقط
            const numericSheetId = "${sheet.sheet_barcode}".replace(/[^0-9]/g, '').slice(0, 10);
            JsBarcode("#barcode-container", numericSheetId, {
              format: "CODE128",
              width: 2,
              height: 60,
              displayValue: false,
              fontSize: 14,
              margin: 10,
              lineColor: "#000000",
            });
            
            // توليد باركود لكل طلب
            ${orders.map((order, index) => `
              JsBarcode("#order-barcode-${index}", "${order.barcode}", {
                format: "CODE128",
                width: 1.5,
                height: 40,
                displayValue: false,
                fontSize: 12,
                margin: 5,
                lineColor: "#000000",
              });
            `).join('')}
            
            // فتح نافذة الطباعة تلقائياً
            setTimeout(function() {
              window.print();
              // إغلاق النافذة بعد الطباعة
              setTimeout(function() {
                window.close();
              }, 500);
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    
    // كتابة المحتوى في النافذة الجديدة
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    toast.success("تمت إعادة طباعة الشيت بنجاح");
  };
  
  // عرض تفاصيل الشيت
  const handleViewSheetDetails = (sheetId: string) => {
    router.push(`/dashboard/delegate-sheets/details?id=${sheetId}`);
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto py-8 max-w-6xl">
        {/* رأس الصفحة */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">البحث عن شيتات المندوبين</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard/orders/delegate-sheet")}
            className="px-6"
          >
            إنشاء شيت مندوب جديد
          </Button>
        </div>
        
        {/* قسم البحث */}
        <Card className="bg-white shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="space-y-5">
              <h2 className="text-xl font-bold mb-4">
                معايير البحث
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* البحث بالباركود */}
                <div>
                  <Label htmlFor="barcode_search" className="block mb-2 font-medium">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      <span>باركود الشيت</span>
                    </div>
                  </Label>
                  <div className="relative">
                    <Input
                      id="barcode_search"
                      type="text"
                      value={searchBarcode}
                      onChange={(e) => setSearchBarcode(e.target.value)}
                      placeholder="أدخل باركود الشيت"
                      className="w-full"
                    />
                  </div>
                </div>
                
                {/* البحث بالمندوب */}
                <div>
                  <Label htmlFor="driver_search" className="block mb-2 font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>المندوب</span>
                    </div>
                  </Label>
                  <Select
                    value={searchDriverId}
                    onValueChange={setSearchDriverId}
                  >
                    <SelectTrigger id="driver_search" className="w-full">
                      <SelectValue placeholder="اختر المندوب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المناديب</SelectItem>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.driver_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* البحث بالتاريخ */}
                <div>
                  <Label htmlFor="date_search" className="block mb-2 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>تاريخ الإنشاء</span>
                    </div>
                  </Label>
                  <div className="relative">
                    <DatePicker
                      id="date_search"
                      selected={searchDate}
                      onChange={(date) => setSearchDate(date)}
                      dateFormat="yyyy/MM/dd"
                      placeholderText="اختر التاريخ"
                      locale={ar}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      wrapperClassName="w-full"
                      isClearable
                    />
                  </div>
                </div>
              </div>
              
              {/* أزرار البحث */}
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchBarcode("");
                    setSearchDriverId("");
                    setSearchDate(null);
                    setSearchResults([]);
                    setTotalResults(0);
                    setCurrentPage(1);
                  }}
                  disabled={isLoading}
                >
                  إعادة تعيين
                </Button>
                
                <Button
                  onClick={() => {
                    setCurrentPage(1);
                    searchDelegateSheets();
                  }}
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري البحث...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      بحث
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* نتائج البحث */}
        {searchResults.length > 0 ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  نتائج البحث ({totalResults})
                </h2>
                
                {/* اختيار عدد النتائج في الصفحة */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">عدد النتائج:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue placeholder={pageSize.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="p-3 text-right">#</th>
                      <th className="p-3 text-right">باركود الشيت</th>
                      <th className="p-3 text-right">المندوب</th>
                      <th className="p-3 text-right">عدد البوالص</th>
                      <th className="p-3 text-right">إجمالي المبلغ</th>
                      <th className="p-3 text-right">تاريخ الإنشاء</th>
                      <th className="p-3 text-right">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((sheet, index) => (
                      <tr key={sheet.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-right">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {sheet.sheet_barcode}
                        </td>
                        <td className="p-3 text-right">
                          {sheet.drivers?.driver_name || "غير معروف"}
                        </td>
                        <td className="p-3 text-right">
                          {sheet.order_count}
                        </td>
                        <td className="p-3 text-right font-bold">
                          {formatCurrency(Number(sheet.total_amount))}
                        </td>
                        <td className="p-3 text-right">
                          {formatDate(sheet.created_at)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewSheetDetails(sheet.id)}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReprintSheet(sheet)}
                              className="text-green-500 hover:text-green-700 hover:bg-green-50"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* ترقيم الصفحات */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      الأولى
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      السابقة
                    </Button>
                    
                    <span className="mx-2 text-sm">
                      صفحة {currentPage} من {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      التالية
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      الأخيرة
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* رسالة عدم وجود نتائج (تظهر فقط بعد البحث) */}
            {(searchBarcode || searchDriverId || searchDate) && !isLoading && (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
                <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">لا توجد نتائج</h3>
                <p className="text-gray-500 mt-1">
                  لم يتم العثور على شيتات مطابقة لمعايير البحث
                </p>
              </div>
            )}
            
            {/* رسالة البدء (تظهر قبل البحث) */}
            {!searchBarcode && !searchDriverId && !searchDate && !isLoading && (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
                <Search className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">ابدأ البحث</h3>
                <p className="text-gray-500 mt-1">
                  استخدم معايير البحث أعلاه للعثور على شيتات المندوبين
                </p>
              </div>
            )}
          </>
        )}
        
        {/* عرض حالة التحميل */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-medium text-gray-900">جاري البحث</h3>
            <p className="text-gray-500 mt-1">يرجى الانتظار...</p>
          </div>
        )}
      </div>
      
    </MainLayout>
  );
}
