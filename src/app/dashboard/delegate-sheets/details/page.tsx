"use client";

import { useState, useEffect, Suspense } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Printer, ArrowRight, FileText, Download, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from 'xlsx';

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

function DelegateSheetDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sheetId = searchParams.get('id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [sheet, setSheet] = useState<DelegateSheet | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // جلب بيانات الشيت والطلبات المرتبطة به
  useEffect(() => {
    if (sheetId) {
      fetchSheetDetails();
    } else {
      setIsLoading(false);
    }
  }, [sheetId]);
  
  // جلب بيانات الشيت
  const fetchSheetDetails = async () => {
    try {
      setIsLoading(true);
      
      // جلب بيانات الشيت
      const sheetResponse = await fetch(`/api/delegate-sheets/${sheetId}`);
      
      if (!sheetResponse.ok) {
        throw new Error("فشل في جلب بيانات الشيت");
      }
      
      const sheetData = await sheetResponse.json();
      setSheet(sheetData.data);
      
      // جلب الطلبات المرتبطة بالشيت
      const ordersResponse = await fetch(`/api/delegate-sheets/${sheetId}/orders`);
      
      if (!ordersResponse.ok) {
        throw new Error("فشل في جلب الطلبات المرتبطة بالشيت");
      }
      
      const ordersData = await ordersResponse.json();
      setOrders(ordersData.data || []);
      
    } catch (error) {
      console.error("خطأ في جلب بيانات الشيت:", error);
      toast.error("حدث خطأ أثناء جلب بيانات الشيت");
    } finally {
      setIsLoading(false);
    }
  };
  
  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "yyyy/MM/dd - HH:mm", { locale: ar });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  
  // تصدير البوالص بتنسيق Excel
  const handleExportExcel = () => {
    if (!sheet || orders.length === 0) return;
    
    try {
      // تحضير البيانات
      const currentDate = new Date();
      const formattedDate = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
      
      const excelData = orders.map(order => ({
        "WaybillSerial": order.barcode,
        "ShipperReference": order.barcode,
        "WaybillPieces": 1,
        "WaybillComment": order.order_description || '',
        "WaybillCODValue": order.cod_amount,
        "ConsigneeName": order.recipient_name,
        "ConsigneeMobile": order.recipient_phone1,
        "ConsigneePhone": order.recipient_phone2 || '',
        "DestinationCityName": order.recipient_city,
        "ConsigneeDestinationAddress": order.recipient_address,
        "WaybillBickupDate": formattedDate,
        "PreviousStatusName": '',
        "StatusCategoryName": 'In Progress',
        "LastStatusName": 'مدخل',
        "LastStatusUpdatedDate": formattedDate,
        "LastStatusComment": '',
        "LastStatusRefusalReasonsName": '',
        "CS_LastStatusName": '',
        "CS_LastStatusUpdatedDate": '',
        "CS_LastStatusComment": '',
        "CS_LastStatusRefusalReasonsName": '',
        "WaybillCondition": 'Green'
      }));
      
      // إنشاء كتاب عمل جديد
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
      
      // تسمية الملف باسم المندوب والتاريخ
      const driverName = sheet.drivers.driver_name.replace(/\s+/g, '_');
      const fileName = `${driverName}_${currentDate.getDate().toString().padStart(2, '0')}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}${currentDate.getFullYear()}.xlsx`;
      
      // تنزيل الملف
      XLSX.writeFile(workbook, fileName);
      
      toast.success("تم تصدير ملف Excel بنجاح");
    } catch (e) {
      console.error("خطأ في تصدير ملف Excel:", e);
      toast.error("حدث خطأ أثناء تصدير ملف Excel");
    }
  };
  
  // طباعة الشيت
  const handlePrint = () => {
    if (sheet && orders.length > 0) {
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
              border-collapse: separate;
              border-spacing: 0;
              margin-bottom: 20px;
              table-layout: fixed;
              direction: rtl;
            }
            
            /* ضمان ظهور الحدود في الطباعة */
            @media print {
              table.orders-table td {
                border: 1px solid #bbb !important;
              }
              
              table.orders-table tbody tr:not(:last-child) td {
                border-bottom: 3px solid #000 !important;
              }
              
              table.orders-table th {
                border-bottom: 2px solid #000 !important;
              }
              
              table.orders-table .total-row {
                border-top: 2px solid #000 !important;
              }
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
            
            /* خط سميك لفصل البوالص عن بعضها */
            table.orders-table tbody tr:not(:last-child) td {
              border-bottom: 3px solid #000;
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
      
      toast.success("تمت طباعة الشيت بنجاح");
    }
  };
  
  // فتح مجموعة واتساب
  const handleOpenWhatsAppGroup = () => {
    window.open("https://chat.whatsapp.com/Blcm4H3NstkDHQgACYtNkx", "_blank");
    toast.success("تم فتح مجموعة واتساب Bella Donna pick up");
  };
  
  return (
    <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/delegate-sheets')}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              العودة للبحث
            </Button>
            <h1 className="text-2xl font-bold mr-4">تفاصيل شيت المندوب</h1>
            {sheet && (
              <span className="mr-2 text-lg font-mono bg-gray-100 px-3 py-1 rounded-md">
                {sheet.sheet_barcode}
              </span>
            )}
          </div>
          
          {sheet && orders.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleOpenWhatsAppGroup}
                className="gap-2 px-6 py-2 bg-green-500 hover:bg-green-600"
              >
                <MessageCircle className="h-5 w-5" />
                واتساب
              </Button>
              <Button
                onClick={handleExportExcel}
                className="gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-5 w-5" />
                تصدير Excel
              </Button>
              <Button
                onClick={handlePrint}
                className="gap-2 px-6 py-2 bg-green-600 hover:bg-green-700"
              >
                <Printer className="h-5 w-5" />
                طباعة الشيت
              </Button>
            </div>
          )}
        </div>
        
        <Card className="shadow-md">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-gray-500">جاري تحميل البيانات...</p>
              </div>
            ) : (
              <>
                {sheet ? (
                  <div className="space-y-8">
                    {/* معلومات الشيت */}
                    <div className="bg-gray-50 p-6 rounded-md shadow-sm">
                      <h3 className="text-xl font-bold mb-4 border-r-4 border-primary pr-3">معلومات الشيت</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4 bg-white p-4 rounded-md shadow-sm">
                          <h4 className="text-md font-bold text-gray-700 border-b pb-2">معلومات الشيت</h4>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600">باركود الشيت:</span>
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">{sheet.sheet_barcode}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600">تاريخ الإنشاء:</span>
                            <span className="text-gray-800">{formatDate(sheet.created_at)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600">عدد البوالص:</span>
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">{sheet.order_count}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-4 bg-white p-4 rounded-md shadow-sm">
                          <h4 className="text-md font-bold text-gray-700 border-b pb-2">معلومات المندوب</h4>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600">اسم المندوب:</span>
                            <span className="text-gray-800 font-semibold">{sheet.drivers?.driver_name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600">هاتف المندوب:</span>
                            <span dir="ltr" className="text-gray-800 font-mono">{sheet.drivers?.driver_phone}</span>
                          </div>
                          {sheet.drivers?.driver_id_number && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-600">رقم الهوية:</span>
                              <span className="text-gray-800 font-mono">{sheet.drivers?.driver_id_number}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4 bg-white p-4 rounded-md shadow-sm">
                          <h4 className="text-md font-bold text-gray-700 border-b pb-2">المعلومات المالية</h4>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600">إجمالي المبلغ:</span>
                            <span className="font-bold text-lg text-green-600">{formatCurrency(Number(sheet.total_amount))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* جدول البوالص */}
                    <div className="mt-8">
                      <h3 className="text-xl font-bold mb-4 border-r-4 border-primary pr-3 flex items-center">
                        <span>البوالص المضمنة</span>
                        <span className="mr-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">{orders.length}</span>
                      </h3>
                      <div className="overflow-x-auto rounded-md shadow-sm border">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-primary text-white">
                              <th className="p-3 text-right">#</th>
                              <th className="p-3 text-right">الباركود</th>
                              <th className="p-3 text-right">اسم المستلم</th>
                              <th className="p-3 text-right">العنوان</th>
                              <th className="p-3 text-right">الهاتف</th>
                              <th className="p-3 text-right">المبلغ</th>
                              <th className="p-3 text-right">ملاحظات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((order, index) => (
                              <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="p-3 text-right">{index + 1}</td>
                                <td className="p-3 text-right">
                                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{order.barcode}</span>
                                </td>
                                <td className="p-3 text-right font-medium">{order.recipient_name}</td>
                                <td className="p-3 text-right">{order.recipient_city} - {order.recipient_address}</td>
                                <td className="p-3 text-right" dir="ltr">{order.recipient_phone1}</td>
                                <td className="p-3 text-right font-bold text-green-600">{formatCurrency(Number(order.cod_amount))}</td>
                                <td className="p-3 text-right">{order.special_instructions || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-bold bg-gray-100 border-t-2 border-gray-300">
                              <td colSpan={5} className="p-3 text-left text-lg">الإجمالي:</td>
                              <td className="p-3 text-right text-lg text-green-600">{formatCurrency(Number(sheet.total_amount))}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">لم يتم العثور على بيانات الشيت</p>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard/delegate-sheets')}
                      className="gap-2 mt-4"
                    >
                      <ArrowRight className="h-4 w-4" />
                      العودة للبحث
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
  );
}

export default function DelegateSheetDetails() {
  return (
    <MainLayout>
      <Suspense fallback={
        <div className="container mx-auto py-6 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-gray-500">جاري تحميل البيانات...</p>
        </div>
      }>
        <DelegateSheetDetailsContent />
      </Suspense>
    </MainLayout>
  );
}
