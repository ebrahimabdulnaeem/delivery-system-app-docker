"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Loader2, Printer, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

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

interface ViewDelegateSheetProps {
  sheetId: string;
  isOpen: boolean;
  onClose: () => void;
  onPrint: (sheet: DelegateSheet, orders: Order[]) => void;
}

export function ViewDelegateSheet({ 
  sheetId, 
  isOpen, 
  onClose, 
  onPrint 
}: ViewDelegateSheetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [sheet, setSheet] = useState<DelegateSheet | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // جلب بيانات الشيت والطلبات المرتبطة به
  useEffect(() => {
    if (isOpen && sheetId) {
      fetchSheetDetails();
    }
  }, [isOpen, sheetId]);
  
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
  
  // معالجة طباعة الشيت
  const handlePrint = () => {
    if (sheet && orders.length > 0) {
      onPrint(sheet, orders);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-[1200px] overflow-y-auto">
        <DialogHeader className="border-b pb-3 mb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            تفاصيل شيت المندوب
            {sheet && (
              <span className="mr-2 text-lg font-mono bg-gray-100 px-2 py-1 rounded-md">
                {sheet.sheet_barcode}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-gray-500">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <>
            {sheet ? (
              <div className="space-y-6">
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
                <p className="text-gray-500">لم يتم العثور على بيانات الشيت</p>
              </div>
            )}
          </>
        )}
        
        <DialogFooter className="flex justify-between items-center gap-2 mt-8 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="gap-2 px-6 py-5 text-base"
          >
            <X className="h-5 w-5" />
            إغلاق
          </Button>
          
          {sheet && orders.length > 0 && (
            <Button
              onClick={handlePrint}
              className="gap-2 px-6 py-5 text-base bg-green-600 hover:bg-green-700"
            >
              <Printer className="h-5 w-5" />
              طباعة الشيت
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
