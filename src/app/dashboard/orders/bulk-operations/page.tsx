"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Order, OrderStatus } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  QrCode,
  Undo2,
  Package,
  PackageCheck,
  PackageX,
} from "lucide-react";
import BarcodeScannerButton from "@/components/BarcodeScannerButton";
import { Separator } from "@/components/ui/separator";

export default function BulkOperationsPage() {
  const router = useRouter();
  
  // الحالة
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannedOrders, setScannedOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // المراجع
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // التركيز التلقائي على حقل الباركود
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [scannedOrders]);
  
  // إضافة مستمع لمعالجة قراءة الباركود تلقائيًا
  useEffect(() => {
    // إذا كان هناك قيمة باركود ولم تتغير لمدة معينة، نعالجها كباركود مكتمل
    if (barcodeInput && !isSubmitting) {
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
  }, [barcodeInput, isSubmitting]);
  
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
    // تعيين الباركود الممسوح ومعالجته
    setBarcodeInput(barcode);
    processBarcode(barcode);
  };
  
  // معالجة الباركود (وظيفة مشتركة لكل من الإدخال التلقائي والضغط على Enter)
  const handleBarcodeProcessing = async () => {
    if (!barcodeInput.trim()) {
      toast.error("يرجى إدخال باركود صحيح");
      return;
    }
    
    // التحقق من عدم وجود الباركود بالفعل في القائمة
    const isDuplicate = scannedOrders.some(order => order.barcode === barcodeInput);
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
      
      // إضافة البوليصة إلى القائمة المحلية
      setScannedOrders(prev => [...prev, order]);
      setSelectedOrders(prev => [...prev, order.id]);
      toast.success("تمت إضافة البوليصة إلى القائمة");
      
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

  // تحديد/إلغاء تحديد كل البوالص
  const toggleSelectAll = () => {
    if (selectedOrders.length === scannedOrders.length) {
      // إذا كانت كل البوالص محددة، قم بإلغاء تحديد الكل
      setSelectedOrders([]);
    } else {
      // قم بتحديد كل البوالص
      setSelectedOrders(scannedOrders.map(order => order.id));
    }
  };

  // تحديد/إلغاء تحديد بوليصة واحدة
  const toggleSelectOrder = (orderId: string) => {
    if (selectedOrders.includes(orderId)) {
      // إزالة البوليصة من المحددة
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    } else {
      // إضافة البوليصة إلى المحددة
      setSelectedOrders(prev => [...prev, orderId]);
    }
  };

  // تطبيق الحالة على البوالص المحددة
  const updateOrdersStatus = async () => {
    if (selectedOrders.length === 0) {
      toast.error("يرجى تحديد بوليصة واحدة على الأقل");
      return;
    }

    if (!selectedStatus) {
      toast.error("يرجى اختيار حالة للبوالص");
      return;
    }

    try {
      setIsUpdating(true);
      
      // تحديث حالة كل بوليصة محددة
      const updatePromises = selectedOrders.map(orderId => 
        fetch(`/api/orders/${orderId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: selectedStatus,
          }),
        })
      );

      // انتظار انتهاء جميع عمليات التحديث
      const results = await Promise.all(updatePromises);
      
      // التحقق من نجاح جميع العمليات
      const allSuccessful = results.every(response => response.ok);
      
      if (allSuccessful) {
        toast.success(`تم تحديث حالة ${selectedOrders.length} بوليصة بنجاح`);
        
        // تحديث حالة البوالص في القائمة المحلية
        setScannedOrders(prev => 
          prev.map(order => {
            if (selectedOrders.includes(order.id)) {
              return { ...order, status: selectedStatus as OrderStatus };
            }
            return order;
          })
        );
        
        // إعادة تعيين التحديد والحالة
        setSelectedOrders([]);
        setSelectedStatus("");
      } else {
        toast.error("حدث خطأ أثناء تحديث بعض البوالص");
      }
    } catch (error) {
      console.error("خطأ في تحديث حالة البوالص:", error);
      toast.error("حدث خطأ أثناء تحديث حالة البوالص");
    } finally {
      setIsUpdating(false);
    }
  };

  // إزالة بوليصة من القائمة
  const removeOrder = (orderId: string) => {
    setScannedOrders(prev => prev.filter(order => order.id !== orderId));
    setSelectedOrders(prev => prev.filter(id => id !== orderId));
  };

  // الحصول على أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <PackageCheck className="h-4 w-4 text-green-500" />;
      case 'full_return':
        return <PackageX className="h-4 w-4 text-red-500" />;
      case 'partial_return':
        return <Undo2 className="h-4 w-4 text-amber-500" />;
      default:
        return <Package className="h-4 w-4 text-blue-500" />;
    }
  };

  // الحصول على وصف الحالة
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered':
        return "تم التسليم";
      case 'full_return':
        return "مرتجع نهائي";
      case 'partial_return':
        return "مرتجع جزئي";
      case 'entered':
        return "مدخلة";
      case 'assigned':
        return "معينة لمندوب";
      case 'out_for_delivery':
        return "خرجت للتسليم";
      default:
        return status;
    }
  };

  // إعادة تعيين الصفحة
  const resetPage = () => {
    setScannedOrders([]);
    setSelectedOrders([]);
    setSelectedStatus("");
    setBarcodeInput("");
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };
  
  // تنسيق المبلغ بشكل آمن
  const formatAmount = (amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined) {
      return '0.00';
    }
    
    try {
      // محاولة تحويل القيمة إلى رقم
      const numValue = typeof amount === 'number' ? amount : Number(amount);
      
      // التحقق من صحة الرقم
      if (isNaN(numValue)) {
        return '0.00';
      }
      
      return numValue.toFixed(2);
    } catch (error) {
      console.error("خطأ في تنسيق المبلغ:", error);
      return '0.00';
    }
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto py-8 max-w-6xl">
        {/* رأس الصفحة */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">عمليات البوليصة</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push("/dashboard/orders")}
              className="px-6"
            >
              العودة إلى قائمة الطلبات
            </Button>
          </div>
        </div>
        
        {/* قسم مسح الباركود */}
        <Card className="bg-white shadow-sm mb-8">
          <CardHeader>
            <CardTitle>مسح باركود البوالص</CardTitle>
            <CardDescription>
              قم بمسح باركود البوالص بشكل متتالي لإضافتها إلى القائمة وتحديث حالتها بشكل جماعي
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-5">
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
                      disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                </div>
                
                {/* عداد البوالص */}
                <div className="bg-gray-100 px-4 py-3 rounded-md flex items-center gap-2 min-w-[180px]">
                  <Info className="h-5 w-5 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">عدد البوالص الممسوحة:</span>
                    <span className="text-xl font-bold mr-2">{scannedOrders.length}</span>
                  </div>
                </div>
              </div>
              
              {/* رسالة توجيهية */}
              {scannedOrders.length === 0 && (
                <div className="flex items-center gap-2 text-amber-600 mt-4">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="text-sm">
                    قم بمسح باركود البوالص واحدة تلو الأخرى ثم اختر الحالة المناسبة وانقر على زر تطبيق الحالة.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* قسم تحديث الحالة */}
        {scannedOrders.length > 0 && (
          <Card className="bg-white shadow-sm mb-8">
            <CardHeader>
              <CardTitle>تحديث حالة البوالص</CardTitle>
              <CardDescription>
                حدد البوالص المراد تحديث حالتها ثم اختر الحالة الجديدة
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label htmlFor="status_select" className="block mb-2 font-medium">
                    اختر الحالة
                  </Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                    disabled={isUpdating || selectedOrders.length === 0}
                  >
                    <SelectTrigger id="status_select" className="w-full">
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivered">
                        <div className="flex items-center gap-2">
                          <PackageCheck className="h-4 w-4 text-green-500" />
                          <span>تم تسليم الشحنة كاملة</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="full_return">
                        <div className="flex items-center gap-2">
                          <PackageX className="h-4 w-4 text-red-500" />
                          <span>مرتجع نهائي</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="partial_return">
                        <div className="flex items-center gap-2">
                          <Undo2 className="h-4 w-4 text-amber-500" />
                          <span>مرتجع جزئي</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end gap-3">
                  <Button
                    onClick={updateOrdersStatus}
                    disabled={isUpdating || selectedOrders.length === 0 || !selectedStatus}
                    className="px-6 h-10"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        جاري التحديث...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        تطبيق الحالة
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={resetPage}
                    className="px-6 h-10"
                  >
                    إعادة تعيين
                  </Button>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="select_all"
                      checked={selectedOrders.length === scannedOrders.length && scannedOrders.length > 0}
                      onCheckedChange={toggleSelectAll}
                      disabled={scannedOrders.length === 0}
                    />
                    <Label
                      htmlFor="select_all"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      تحديد الكل ({scannedOrders.length})
                    </Label>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-500">
                      تم تحديد {selectedOrders.length} من {scannedOrders.length} بوليصة
                    </span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-3 text-right"></th>
                        <th className="p-3 text-right">#</th>
                        <th className="p-3 text-right">الباركود</th>
                        <th className="p-3 text-right">اسم المستلم</th>
                        <th className="p-3 text-right">المدينة</th>
                        <th className="p-3 text-right">الحالة الحالية</th>
                        <th className="p-3 text-right">المبلغ</th>
                        <th className="p-3 text-right">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scannedOrders.map((order, index) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-center">
                            <Checkbox
                              checked={selectedOrders.includes(order.id)}
                              onCheckedChange={() => toggleSelectOrder(order.id)}
                            />
                          </td>
                          <td className="p-3 text-right">{index + 1}</td>
                          <td className="p-3 text-right font-mono">{order.barcode}</td>
                          <td className="p-3 text-right">{order.recipient_name}</td>
                          <td className="p-3 text-right">{order.recipient_city}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              <span>{getStatusLabel(order.status)}</span>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            {formatAmount(order.cod_amount)} ج.م
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOrder(order.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              إزالة
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
} 