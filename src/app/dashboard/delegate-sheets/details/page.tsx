"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Printer, ArrowRight, FileText, Download, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from 'xlsx';
import Barcode from 'react-barcode';
import './a4-styles.css';

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

function DelegateSheetDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sheetId = searchParams.get('id');
  const isPreview = searchParams.get('view') === 'preview';

  
  const [isLoading, setIsLoading] = useState(true);
  const [sheet, setSheet] = useState<DelegateSheet | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // جلب بيانات الشيت
  const fetchSheetDetails = useCallback(async () => {
    if (!sheetId) return;
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
  }, [sheetId]);

  // جلب بيانات الشيت والطلبات المرتبطة به
  useEffect(() => {
    if (sheetId) {
      fetchSheetDetails();
    } else {
      setIsLoading(false);
    }
  }, [sheetId, fetchSheetDetails]);

  // تشغيل الطباعة تلقائياً في وضع المعاينة
  useEffect(() => {
    if (isPreview && !isLoading && sheet) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000); // تأخير بسيط لضمان تحميل كل شيء في الصفحة
      return () => clearTimeout(timer);
    }
  }, [isPreview, isLoading, sheet]);
  
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
  

  
  // فتح مجموعة واتساب
  const handleOpenWhatsAppGroup = () => {
    window.open("https://chat.whatsapp.com/Blcm4H3NstkDHQgACYtNkx", "_blank");
    toast.success("تم فتح مجموعة واتساب Bella Donna pick up");
  };

  // فتح نافذة المعاينة
  const handleOpenPreview = () => {
    if (!sheetId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'preview');
    window.open(url.toString(), '_blank', 'width=1200,height=800');
  };
  
    const content = (
    <div className={isPreview ? 'a4-sheet' : ''}>
      <Card className={isPreview ? 'shadow-none border-none rounded-none' : ''}>
        <CardContent className={isPreview ? 'p-0' : 'p-6'}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-gray-500">جاري تحميل البيانات...</p>
            </div>
          ) : sheet ? (
            <div className="space-y-8">
              {/* New Sheet Info Section */}
              <div>
                <div className="bg-gray-100 p-4 rounded-lg shadow-md flex items-center justify-between">
                  <div className="text-right text-sm">
                    <p><span className="font-bold">التاريخ:</span> {new Date(sheet.created_at).toLocaleDateString()}</p>
                    <p><span className="font-bold">عدد الشحنات:</span> {orders.length}</p>
                    <p><span className="font-bold">المندوب:</span> {sheet.drivers?.driver_name}</p>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold">شيت المندوب</h3>
                    <p className="text-gray-500 font-mono tracking-widest">{sheet.sheet_barcode}</p>
                  </div>
                  <div>
                    <Barcode value={sheet.sheet_barcode} height={50} displayValue={false} />
                  </div>
                </div>
              </div>

              {/* Orders Table - New Design */}
              <div className="mt-8">
                <div className="overflow-x-auto rounded-md shadow-sm border">
                  <table className={`w-full border-collapse ${!isPreview ? 'min-w-[1200px]' : ''}`}>
                    <thead className="bg-gray-200">
                      <tr>
                        <th className={`p-2 border text-sm font-semibold text-gray-700 ${isPreview ? 'w-[5%]' : 'w-[5%]'}`}>#</th>
                        <th className={`p-2 border text-sm font-semibold text-gray-700 ${isPreview ? 'w-[40%]' : 'w-[45%]'}`}>بيانات الشحنة</th>
                        <th className={`p-2 border text-sm font-semibold text-gray-700 ${isPreview ? 'w-[15%]' : 'w-[20%]'}`}>المبلغ / عدد القطع</th>
                        <th className={`p-2 border text-sm font-semibold text-gray-700 ${isPreview ? 'w-[20%]' : 'w-[15%]'}`}>التوقيع</th>
                        <th className={`p-2 border text-sm font-semibold text-gray-700 ${isPreview ? 'w-[20%]' : 'w-[15%]'}`}>الملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, index) => (
                        <tr key={order.id} className="border-b">
                          <td className={`p-2 border align-top text-center font-bold ${isPreview ? 'text-base' : 'text-lg'}`}>{index + 1}</td>
                          
                          {/* Shipment Details Cell */}
                          <td className="p-2 border align-top">
                            <div className="flex flex-col items-start mb-2">
                              <Barcode value={order.barcode} height={40} width={isPreview ? 1.5 : 2} displayValue={true} fontSize={isPreview ? 12 : 14} />
                            </div>
                            <div className="text-right text-sm space-y-1">
                              <p><span className="font-bold">المرسل إليه:</span> {order.recipient_name}</p>
                              <p><span className="font-bold">موبايل:</span> {order.recipient_phone1}</p>
                              <p><span className="font-bold">العنوان:</span> {order.recipient_city} - {order.recipient_address}</p>
                            </div>
                          </td>

                          {/* Amount/Pieces Cell */}
                          <td className="p-2 border align-top text-center">
                            <div className="flex justify-around items-center text-sm mb-2">
                              <div>
                                <p className="font-semibold">عدد القطع</p>
                                <p className="text-gray-600">1</p>
                              </div>
                            </div>
                            <div className={`font-bold text-green-700 mt-4 ${isPreview ? 'text-lg' : 'text-2xl'}`}>
                              {formatCurrency(Number(order.cod_amount))}
                            </div>
                          </td>

                          {/* Signature Cell */}
                          <td className="p-2 border align-top"></td>

                          {/* Notes Cell */}
                          <td className="p-2 border align-top text-sm break-word">
                            {order.special_instructions || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className="mt-0">
                  <table className="w-full">
                    <tbody className="font-bold bg-gray-100 border-t-2 border-gray-300">
                      <tr>
                        <td className={`p-3 text-left ${isPreview ? 'text-base w-[45%]' : 'text-lg w-[50%]'}`}>الإجمالي:</td>
                        <td className={`p-3 text-center text-green-700 ${isPreview ? 'text-base w-[15%]' : 'text-lg w-[20%]'}`}>{formatCurrency(Number(sheet.total_amount))}</td>
                        <td className={`${isPreview ? 'w-[40%]' : 'w-[30%]'}`}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Declaration Footer */}
              <div className="mt-16">
                <h2 className="text-center text-2xl font-bold mb-6">إقرار استلام الشحنات</h2>
                <div className="border rounded-lg p-8 shadow-sm bg-white">
                  <p className="text-right leading-relaxed mb-16">
                    أقر أنا المندوب المذكور أعلاه بأنني قد استلمت جميع الشحنات المذكورة في هذا الشيت وعددها ({orders.length}) شحنة، وأتعهد بتسليمها للعملاء المذكورين في العناوين المحددة، وأتحمل المسؤولية الكاملة عن هذه الشحنات حتى تسليمها للعملاء أو إرجاعها للشركة في حالة عدم التسليم.
                  </p>
                  <div className="flex justify-between items-center mt-20 space-x-12 space-x-reverse">
                    <div className="text-center flex-1">
                      <div className="border-b-2 border-gray-300 h-10"></div>
                      <p className="mt-2 font-semibold">اسم المندوب</p>
                    </div>
                    <div className="text-center flex-1">
                      <div className="border-b-2 border-gray-300 h-10"></div>
                      <p className="mt-2 font-semibold">التوقيع</p>
                    </div>
                    <div className="text-center flex-1">
                      <div className="border-b-2 border-gray-300 h-10"></div>
                      <p className="mt-2 font-semibold">التاريخ</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">لم يتم العثور على بيانات الشيت</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (isPreview) {
    return content;
  }

  return (
    <MainLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">تفاصيل شيت المندوب</h1>
            <Button variant="outline" size="sm" onClick={handleOpenPreview} disabled={isLoading || !sheet} className="gap-2">
              <Printer className="h-4 w-4" />
              الطباعة
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              العودة
            </Button>
            <Button onClick={handleExportExcel} disabled={isLoading || !sheet} className="gap-2">
              <Download className="h-4 w-4" />
              تصدير Excel
            </Button>
            <Button onClick={handleOpenWhatsAppGroup} disabled={isLoading || !sheet} className="gap-2 bg-green-500 hover:bg-green-600">
              <MessageCircle className="h-4 w-4" />
              مجموعة واتساب
            </Button>
          </div>
        </div>
        {content}
      </div>
    </MainLayout>
  );
}

function FullPageLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <DelegateSheetDetailsPage />
    </Suspense>
  );
}
