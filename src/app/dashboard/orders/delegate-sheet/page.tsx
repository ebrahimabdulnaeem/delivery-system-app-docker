"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, TruckIcon, QrCode, AlertTriangle, Info } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrintDelegateSheet } from "@/components/orders/PrintDelegateSheet";
import { Driver } from "@/types/drivers";
import { Order } from "@/types/orders";
import BarcodeScannerButton from "@/components/BarcodeScannerButton";

export default function DelegateSheetPage() {
  const router = useRouter();
  
  // الحالة
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  
  // المراجع
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // جلب قائمة المناديب عند تحميل الصفحة
  useEffect(() => {
    fetchDrivers();
  }, []);
  
  // التركيز التلقائي على حقل الباركود
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [selectedDriver, assignedOrders]);
  
  // إضافة مستمع لمعالجة قراءة الباركود تلقائيًا (خارج الدالة الرئيسية)
  useEffect(() => {
    // إذا كان هناك قيمة باركود ولم تتغير لمدة معينة، نعالجها كباركود مكتمل
    if (barcodeInput && selectedDriver && !isSubmitting) {
      // إلغاء أي مؤقت سابق
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
      
      // تعيين مؤقت جديد للكشف عن انتهاء إدخال الباركود
      barcodeTimeoutRef.current = setTimeout(() => {
        // التأكد من أن الباركود لم يتغير لمدة معينة (مما يعني أنه اكتمل)
        if (barcodeInput.trim()) {
          handleBarcodeProcessing();
        }
      }, 300); // 300 مللي ثانية، وهو وقت كافٍ للتعرف على انتهاء القراءة
    }
    
    return () => {
      if (barcodeTimeoutRef.current) {
        clearTimeout(barcodeTimeoutRef.current);
      }
    };
  }, [barcodeInput, selectedDriver, isSubmitting]);
  
  // جلب قائمة المناديب
  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/drivers");
      
      if (!response.ok) {
        throw new Error("فشل في جلب قائمة المناديب");
      }
      
      const data = await response.json();
      setDrivers(data.data || []);
    } catch (error) {
      console.error("خطأ في جلب المناديب:", error);
      toast.error("حدث خطأ أثناء جلب قائمة المناديب");
    } finally {
      setIsLoading(false);
    }
  };
  
  // معالجة اختيار المندوب
  const handleDriverSelect = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      setSelectedDriver(driver);
      // إعادة تعيين قائمة الطلبات عند تغيير المندوب
      setAssignedOrders([]);
      // التركيز على حقل الباركود
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 0);
    }
  };
  
  // معالجة إدخال الباركود
  const handleBarcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcodeInput(value);
  };
  
  // معالجة مفتاح Enter في حقل الباركود
  const handleBarcodeKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await handleBarcodeProcessing();
    }
  };
  
  // معالجة الباركود من ماسح الباركود الخارجي
  const handleExternalBarcodeScan = (barcode: string) => {
    if (!selectedDriver) {
      toast.error("يرجى اختيار المندوب أولاً");
      return;
    }
    
    // تعيين الباركود الممسوح ومعالجته
    setBarcodeInput(barcode);
    processBarcode(barcode);
  };
  
  // معالجة الباركود (وظيفة مشتركة لكل من الإدخال التلقائي والضغط على Enter)
  const handleBarcodeProcessing = async () => {
      if (!selectedDriver) {
        toast.error("يرجى اختيار المندوب أولاً");
        return;
      }
      
      if (!barcodeInput.trim()) {
        toast.error("يرجى إدخال باركود صحيح");
        return;
      }
      
      // التحقق من عدم وجود الباركود بالفعل في القائمة
      const isDuplicate = assignedOrders.some(order => order.barcode === barcodeInput);
      if (isDuplicate) {
        toast.error("تم إضافة هذه البوليصة بالفعل");
        setBarcodeInput("");
        return;
      }
      
      await processBarcode(barcodeInput);
  };
  
  // معالجة الباركود المدخل
  const processBarcode = async (barcode: string) => {
    try {
      setIsSubmitting(true);
      
      // البحث عن البوليصة في قاعدة البيانات
      const response = await fetch(`/api/orders/barcode?barcode=${barcode}`);
      
      if (!response.ok) {
        throw new Error("فشل في العثور على البوليصة");
      }
      
      const data = await response.json();
      const order = data.data;
      
      if (!order) {
        toast.error("لم يتم العثور على بوليصة بهذا الباركود");
        return;
      }
      
      // التحقق من أن البوليصة غير معينة بالفعل لمندوب آخر (إلا إذا كان نفس المندوب المختار حالياً)
      if (order.driver_id && order.driver_id !== selectedDriver?.id) {
        toast.error("هذه البوليصة معينة بالفعل لمندوب آخر");
        return;
      }
      
      // إضافة البوليصة إلى القائمة المحلية بدون تحديثها في قاعدة البيانات
      setAssignedOrders(prev => [...prev, order]);
      toast.success("تمت إضافة البوليصة إلى القائمة المؤقتة");
      
    } catch (error) {
      console.error("خطأ في معالجة الباركود:", error);
      toast.error("حدث خطأ أثناء معالجة الباركود");
    } finally {
      setIsSubmitting(false);
      setBarcodeInput("");
      // إعادة التركيز على حقل الباركود
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }
  };
  
  // معالجة إزالة بوليصة من القائمة
  const handleRemoveOrder = async (orderId: string) => {
    // إزالة البوليصة من القائمة المحلية فقط
      setAssignedOrders(prev => prev.filter(order => order.id !== orderId));
    toast.success("تمت إزالة البوليصة من القائمة المؤقتة");
  };
  
  // حساب إجمالي مبلغ التحصيل
  const calculateTotalCOD = () => {
    return assignedOrders.reduce((total, order) => total + Number(order.cod_amount), 0);
  };
  
  // تنسيق المبلغ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // حفظ جميع البوالص المضافة للمندوب في قاعدة البيانات
  const saveOrdersToDriver = async (): Promise<boolean> => {
    if (!selectedDriver) {
      toast.error("يرجى اختيار المندوب أولاً");
      return false;
    }

    if (assignedOrders.length === 0) {
      toast.error("لا توجد بوالص لحفظها للمندوب");
      return false;
    }

    try {
      setIsSaving(true);
      
      // تعيين كل بوليصة للمندوب واحدة تلو الأخرى
      const savePromises = assignedOrders.map(order => 
        fetch(`/api/orders/${order.id}/assign-driver`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            driver_id: selectedDriver?.id,
          }),
        })
      );

      // انتظار انتهاء جميع عمليات الحفظ
      const results = await Promise.all(savePromises);
      
      // التحقق من نجاح جميع العمليات
      const allSuccessful = results.every(response => response.ok);
      
      if (allSuccessful) {
        // لا نعرض رسالة نجاح هنا لأن مكون PrintDelegateSheet سيعرضها
        return true;
      } else {
        toast.error("حدث خطأ أثناء حفظ بعض البوالص");
        return false;
      }
    } catch (error) {
      console.error("خطأ في حفظ البوالص للمندوب:", error);
      toast.error("حدث خطأ أثناء حفظ البوالص للمندوب");
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto py-8 max-w-6xl">
        {/* رأس الصفحة */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">شيت المندوب</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard/orders")}
            className="px-6"
          >
            العودة إلى قائمة الطلبات
          </Button>
        </div>
        
        {/* قسم اختيار المندوب */}
        <Card className="bg-white shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                {/* اختيار المندوب */}
                <div>
                  <Label htmlFor="driver_select" className="block mb-2 font-medium">
                    اختر المندوب
                  </Label>
                  <Select
                    disabled={isLoading}
                    onValueChange={handleDriverSelect}
                  >
                    <SelectTrigger id="driver_select" className="w-full">
                      <SelectValue placeholder="اختر المندوب" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.driver_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* عرض معلومات المندوب المختار */}
                {selectedDriver && (
                  <div className="bg-blue-50 p-3 rounded-md flex items-start gap-3">
                    <TruckIcon className="text-blue-500 h-5 w-5 mt-1" />
                    <div>
                      <div className="font-bold">{selectedDriver.driver_name}</div>
                      <div className="text-sm text-gray-600">
                        هاتف: {selectedDriver.driver_phone}
                      </div>
                      {selectedDriver.driver_id_number && (
                        <div className="text-sm text-gray-600">
                          رقم الهوية: {selectedDriver.driver_id_number}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* قسم مسح الباركود - يظهر فقط عند اختيار مندوب */}
        {selectedDriver && (
          <Card className="bg-white shadow-sm mb-8">
            <CardContent className="p-6">
              <div className="space-y-5">
                <h2 className="text-xl font-bold mb-4">
                  مسح باركود البوالص
                </h2>
                
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  {/* حقل إدخال الباركود */}
                  <div className="flex-1">
                    <Label htmlFor="barcode_input" className="block mb-2 font-medium">
                      أدخل أو امسح الباركود
                    </Label>
                    <div className="relative">
                      <Input
                        id="barcode_input"
                        ref={barcodeInputRef}
                        type="text"
                        value={barcodeInput}
                        onChange={handleBarcodeInputChange}
                        onKeyDown={handleBarcodeKeyDown}
                        placeholder="أدخل أو امسح الباركود"
                        className="w-full pr-10"
                        disabled={isSubmitting || !selectedDriver}
                        autoComplete="off"
                      />
                      <QrCode className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* زر تفعيل ماسح الباركود */}
                  <div className="md:self-end">
                    <BarcodeScannerButton
                      onScan={handleExternalBarcodeScan}
                      variant="outline"
                      disabled={isSubmitting || !selectedDriver}
                    />
                  </div>
                  
                  {/* عداد البوالص */}
                  <div className="bg-gray-100 px-4 py-3 rounded-md flex items-center gap-2 min-w-[150px]">
                    <Info className="h-5 w-5 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">عدد البوالص:</span>
                      <span className="text-xl font-bold mr-2">{assignedOrders.length}</span>
                    </div>
                  </div>
                </div>
                
                {/* رسالة توجيهية */}
                {selectedDriver && assignedOrders.length === 0 && (
                  <div className="flex items-center gap-2 text-amber-600 mt-4">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="text-sm">
                      قم بمسح باركود البوالص أو استخدم زر تفعيل ماسح الباركود لإضافتها إلى شيت المندوب.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* عرض البوالص المضافة */}
        {selectedDriver && assignedOrders.length > 0 && (
          <Card className="bg-white shadow-sm mb-8">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  البوالص المعينة للمندوب ({assignedOrders.length})
                </h2>
                
                {/* زر الحفظ والطباعة */}
                <div className="flex gap-2">
                {selectedDriver && assignedOrders.length > 0 && (
                  <PrintDelegateSheet
                    driver={selectedDriver}
                    orders={assignedOrders}
                    calculateTotalCOD={calculateTotalCOD}
                    formatCurrency={formatCurrency}
                    onSave={saveOrdersToDriver}
                  />
                )}
                </div>
              </div>
              
              {/* رسالة توضيحية */}
              <div className="flex items-center gap-2 text-amber-600 p-3 bg-amber-50 rounded-md mb-4">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">
                  ملاحظة: هذه البوالص في القائمة المؤقتة ولم يتم تعيينها بعد للمندوب. اضغط على زر "حفظ البوالص للمندوب" لتخزين التعيين في قاعدة البيانات.
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="p-3 text-right">#</th>
                      <th className="p-3 text-right">الباركود</th>
                      <th className="p-3 text-right">اسم المستلم</th>
                      <th className="p-3 text-right">العنوان</th>
                      <th className="p-3 text-right">الهاتف</th>
                      <th className="p-3 text-right">المبلغ</th>
                      <th className="p-3 text-right">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedOrders.map((order, index) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-right">{index + 1}</td>
                        <td className="p-3 text-right font-mono">{order.barcode}</td>
                        <td className="p-3 text-right">{order.recipient_name}</td>
                        <td className="p-3 text-right">{order.recipient_city} - {order.recipient_address}</td>
                        <td className="p-3 text-right">{order.recipient_phone1}</td>
                        <td className="p-3 text-right font-bold">{formatCurrency(order.cod_amount)}</td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOrder(order.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            disabled={isSubmitting}
                          >
                            إزالة
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold bg-gray-50">
                      <td colSpan={5} className="p-3 text-left">الإجمالي:</td>
                      <td className="p-3 text-right">{formatCurrency(calculateTotalCOD())}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* عرض حالة التحميل */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-medium text-gray-900">جاري تحميل البيانات</h3>
            <p className="text-gray-500 mt-1">يرجى الانتظار...</p>
          </div>
        )}
        
        {/* رسالة عدم وجود قائمة مناديب */}
        {!isLoading && drivers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">لا يوجد مناديب في النظام</h3>
            <p className="text-gray-500 mt-1">
              يرجى إضافة مناديب أولاً قبل استخدام هذه الصفحة
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 