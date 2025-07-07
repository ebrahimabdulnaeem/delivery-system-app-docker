"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2, Trash } from "lucide-react";
import { DriverDetails } from "./components/DriverDetails";
import { DriverEdit } from "./components/DriverEdit";

// واجهة السائق
interface Driver {
  id: string;
  driver_name: string;
  driver_id_number?: string | null;
  driver_phone: string;
  assigned_areas?: string[] | null;
  created_at: string;
  updated_at: string;
  orders?: {
    id: string;
    barcode: string;
    recipient_name: string;
    recipient_address: string;
    recipient_city: string;
    status: string;
    created_at: string;
    cod_amount: number;
  }[];
}

export default function DriverPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const driverId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // جلب تفاصيل السائق
  const fetchDriverDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/drivers/${driverId}`);
      
      if (response.ok) {
        const data = await response.json();
        setDriver(data);
      } else {
        const error = await response.json();
        toast.error(error.message || "حدث خطأ أثناء جلب تفاصيل السائق");
        // إعادة التوجيه إلى صفحة السائقين إذا كان السائق غير موجود
        if (response.status === 404) {
          router.push("/dashboard/drivers");
        }
      }
    } catch (error) {
      console.error("Error fetching driver details:", error);
      toast.error("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  // حذف السائق
  const handleDeleteDriver = async () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("تم حذف السائق بنجاح");
        router.push("/dashboard/drivers");
      } else {
        // في حالة وجود طلبات مرتبطة
        if (response.status === 400 && data.ordersCount) {
          toast.error(`لا يمكن حذف السائق لأنه مرتبط بـ ${data.ordersCount} طلب/طلبات`);
        } else {
          toast.error(data.message || "حدث خطأ أثناء حذف السائق");
        }
      }
    } catch (error) {
      console.error("Error deleting driver:", error);
      toast.error("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setIsDeleting(false);
    }
  };

  // تحديث بيانات السائق بعد التعديل
  const handleDriverUpdated = (updatedDriver: Driver) => {
    setDriver(updatedDriver);
    toast.success("تم تحديث بيانات السائق بنجاح");
  };

  // تغيير التبويب النشط بناءً على معلمات URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'edit') {
      setActiveTab('edit');
    } else {
      setActiveTab('details');
    }
  }, [searchParams]);

  useEffect(() => {
    if (driverId) {
      fetchDriverDetails();
    }
  }, [driverId]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push("/dashboard/drivers")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">تفاصيل السائق</h1>
          </div>
          
          {driver && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4 mr-2" />}
                  حذف السائق
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد من حذف هذا السائق؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    هذا الإجراء لا يمكن التراجع عنه. سيتم حذف السائق نهائياً من قاعدة البيانات.
                    {driver.orders && driver.orders.length > 0 ? (
                      <p className="text-red-500 mt-2">
                        تنبيه: هذا السائق مرتبط بـ {driver.orders.length} طلب/طلبات. يجب إلغاء ارتباط الطلبات أولاً.
                      </p>
                    ) : null}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteDriver} className="bg-red-500 hover:bg-red-600">
                    تأكيد الحذف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : driver ? (
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="details">تفاصيل السائق</TabsTrigger>
              <TabsTrigger value="edit">تعديل البيانات</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <DriverDetails driver={driver} />
            </TabsContent>
            
            <TabsContent value="edit">
              <DriverEdit 
                driver={driver} 
                onDriverUpdated={handleDriverUpdated} 
              />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-10">
                <p className="text-muted-foreground">لم يتم العثور على السائق المطلوب</p>
                <Button 
                  className="mt-4" 
                  onClick={() => router.push("/dashboard/drivers")}
                >
                  العودة إلى صفحة السائقين
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
} 