"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { OrderDetails } from "./components/OrderDetails";
import { OrderEdit } from "./components/OrderEdit";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2, Trash } from "lucide-react";
import BarcodeScannerButton from "@/components/BarcodeScannerButton";

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
  drivers?: {
    id: string;
    driver_name: string;
    driver_phone: string;
  } | null;
  users?: {
    id: string;
    username: string;
    email: string;
    role: string;
  } | null;
}

export default function OrderPage() {
  const { id } = useParams();
  const orderId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // جلب تفاصيل الطلب
  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        const error = await response.json();
        toast.error(error.message || "حدث خطأ أثناء جلب تفاصيل الطلب");
        // إعادة التوجيه إلى صفحة الطلبات إذا كان الطلب غير موجود
        if (response.status === 404) {
          router.push("/dashboard/orders");
        }
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  // حذف الطلب
  const handleDeleteOrder = async () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("تم حذف الطلب بنجاح");
        router.push("/dashboard/orders");
      } else {
        const error = await response.json();
        toast.error(error.message || "حدث خطأ أثناء حذف الطلب");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setIsDeleting(false);
    }
  };

  // تحديث بيانات الطلب بعد التعديل
  const handleOrderUpdated = (updatedOrder: Order) => {
    setOrder(updatedOrder);
    toast.success("تم تحديث الطلب بنجاح");
  };

  // مُعالج مسح الباركود
  const handleBarcodeScan = async (barcode: string) => {
    try {
      setIsLoading(true);
      // البحث عن الطلب بالباركود
      const response = await fetch(`/api/orders/find-by-barcode?barcode=${encodeURIComponent(barcode)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          // التنقل إلى صفحة تفاصيل الطلب الجديد
          router.push(`/dashboard/orders/${data.id}`);
          toast.success("تم العثور على الطلب");
        } else {
          toast.error("لم يتم العثور على طلب بهذا الباركود");
        }
      } else {
        toast.error("لم يتم العثور على طلب بهذا الباركود");
      }
    } catch (error) {
      console.error("Error finding order by barcode:", error);
      toast.error("حدث خطأ أثناء البحث عن الطلب");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push("/dashboard/orders")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">تفاصيل الطلب</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <BarcodeScannerButton 
              onScan={handleBarcodeScan} 
              variant="outline"
              className="ml-2"
            />
          
          {order && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4 mr-2" />}
                  حذف الطلب
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد من حذف هذا الطلب؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الطلب نهائياً من قاعدة البيانات.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteOrder} className="bg-red-500 hover:bg-red-600">
                    تأكيد الحذف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : order ? (
          <Tabs defaultValue="details">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="details">تفاصيل الطلب</TabsTrigger>
                <TabsTrigger value="edit">تعديل الطلب</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">حالة الطلب:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'entered' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                  order.status === 'out_for_delivery' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'partial_return' ? 'bg-orange-100 text-orange-800' :
                  order.status === 'full_return' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status === 'delivered' ? 'تم التسليم' :
                   order.status === 'entered' ? 'مدخل' :
                   order.status === 'assigned' ? 'معين لسائق' :
                   order.status === 'out_for_delivery' ? 'قيد التوصيل' :
                   order.status === 'partial_return' ? 'إرجاع جزئي' :
                   order.status === 'full_return' ? 'إرجاع كامل' :
                   order.status}
                </span>
              </div>
            </div>

            <TabsContent value="details">
              <OrderDetails order={order} />
            </TabsContent>
            
            <TabsContent value="edit">
              <OrderEdit 
                order={order} 
                onOrderUpdated={handleOrderUpdated} 
              />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-10">
                <p className="text-muted-foreground">لم يتم العثور على الطلب المطلوب</p>
                <Button 
                  className="mt-4" 
                  onClick={() => router.push("/dashboard/orders")}
                >
                  العودة إلى صفحة الطلبات
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
} 