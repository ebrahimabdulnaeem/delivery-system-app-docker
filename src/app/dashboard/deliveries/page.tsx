"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { DriverFilter } from "./components/DriverFilter";
import { DateFilter } from "./components/DateFilter";
import { StatusSummary } from "./components/StatusSummary";
import { DeliveryStatusBadge } from "./components/DeliveryStatusBadge";
import { StatusUpdateDialog } from "./components/StatusUpdateDialog";

// نوع بيانات الطلب
type Order = {
  id: string;
  barcode: string;
  order_date: string;
  recipient_name: string;
  recipient_phone1: string;
  recipient_city: string;
  cod_amount: number;
  status: string;
  driver_id?: string;
  drivers?: {
    driver_name: string;
  };
  created_at: string;
  recentlyUpdated?: boolean;
};

// نوع بيانات التصفح
type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
};

// نوع بيانات ملخص الحالة بعد التعديل
type StatusSummaryType = {
  total: number;
  entered: number;
  assigned: number;
  out_for_delivery: number;
  delivered: number;
  partial_return: number;
  full_return: number;
};

// مكون تحميل
function LoadingState() {
  return (
    <div className="py-8 flex justify-center">
      <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}

// مكون خطأ
function ErrorState({ error }: { error: string }) {
  return (
    <div className="py-8 text-center text-red-500">{error}</div>
  );
}

// مكون لا توجد بيانات
function EmptyState() {
  return (
    <div className="py-8 text-center text-gray-500">
      <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <p>لا توجد طلبات تطابق معايير البحث</p>
    </div>
  );
}

// المكون الرئيسي الذي يستخدم useSearchParams
function DeliveriesContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalItems: 0
  });
  
  // تحديث هيكل ملخص الحالة
  const [statusSummary, setStatusSummary] = useState<StatusSummaryType>({
    total: 0,
    entered: 0,
    assigned: 0,
    out_for_delivery: 0,
    delivered: 0,
    partial_return: 0,
    full_return: 0
  });
  
  // حالة حوار تحديث الحالة
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  
  // قوائم للفلترة
  const [drivers, setDrivers] = useState<{ id: string; driver_name: string }[]>([]);

  // إنشاء مرجع للإلغاء
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);

  // جلب السائقين
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch("/api/drivers");
        if (response.ok) {
          const data = await response.json();
          setDrivers(data.data || data);
        }
      } catch (error) {
        console.error("Error fetching drivers:", error);
      }
    };

    fetchDrivers();
  }, []);

  // عند تفكيك المكون، تعيين isMounted إلى false
  useEffect(() => {
    return () => {
      isMounted.current = false;
      // إلغاء أي طلب معلق عند تفكيك المكون
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // الحصول على معلمات URL الحالية
  const getURLParams = () => {
    // نسخة جديدة من SearchParams لاستخدامها في عمليات التعديل
    return new URLSearchParams(searchParams.toString());
  };

  // جلب قائمة الطلبات
  const fetchOrders = async (page = 1) => {
    try {
      // إلغاء الطلب السابق إذا كان موجودًا
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // إنشاء متحكم إلغاء جديد
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;
      
      setIsLoading(true);
      setError(null); // مسح الأخطاء السابقة
      
      // الحصول على قيم الفلترة الحالية من URL
      const params = getURLParams();
      params.set("page", page.toString());
      params.set("limit", pagination.pageSize.toString());
      
      // تحويل driver_id إلى driverId للتوافق مع API
      if (params.has("driver_id")) {
        const driverId = params.get("driver_id");
        params.delete("driver_id");
        params.set("driverId", driverId || "");
      }
      
      console.log(`جاري جلب الطلبات: ${params.toString()}`);
      
      const response = await fetch(`/api/orders?${params.toString()}`, { signal });
      
      // التأكد من أن المكون لا يزال موجودًا قبل تحديث الحالة
      if (!isMounted.current) return;
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data);
        setPagination(data.pagination);
        
        // حساب ملخص الحالة
        calculateStatusSummary(data.data);
      } else {
        setOrders([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          pageSize: 10,
          totalItems: 0
        });
        setStatusSummary({
          total: 0,
          entered: 0,
          assigned: 0,
          out_for_delivery: 0,
          delivered: 0,
          partial_return: 0,
          full_return: 0
        });
        
        // محاولة الحصول على رسالة الخطأ
        try {
          const errorData = await response.json();
          const errorMessage = errorData.message || errorData.error || "فشل في جلب بيانات الطلبات";
          setError(errorMessage);
          toast.error(errorMessage);
        } catch {
          // تجاهل خطأ تحليل البيانات
          setError("فشل في جلب بيانات الطلبات");
          toast.error("فشل في جلب بيانات الطلبات");
        }
      }
    } catch (error: unknown) {
      // التأكد من أن المكون لا يزال موجودًا قبل تحديث الحالة
      if (!isMounted.current) return;
      
      // التحقق مما إذا كان الخطأ بسبب الإلغاء
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('تم إلغاء الطلب');
        return;
      }
      
      console.error("Error fetching orders:", error);
      
      setOrders([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        pageSize: 10,
        totalItems: 0
      });
      setStatusSummary({
        total: 0,
        entered: 0,
        assigned: 0,
        out_for_delivery: 0,
        delivered: 0,
        partial_return: 0,
        full_return: 0
      });
      
      if (error instanceof Error && error.message === 'Failed to fetch') {
        setError('فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.');
        toast.error('فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.');
      } else {
        setError('حدث خطأ أثناء جلب بيانات الطلبات');
        toast.error("حدث خطأ أثناء جلب بيانات الطلبات");
      }
    } finally {
      // التأكد من أن المكون لا يزال موجودًا قبل تحديث الحالة
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // تحديث دالة حساب ملخص الحالة لتعكس الحالات الفعلية
  const calculateStatusSummary = (orders: Order[]) => {
    const summary = {
      total: orders.length,
      entered: 0,
      assigned: 0,
      out_for_delivery: 0,
      delivered: 0,
      partial_return: 0,
      full_return: 0
    };
    
    orders.forEach(order => {
      const status = order.status.toLowerCase();
      
      if (status === "entered") {
        summary.entered++;
      } else if (status === "assigned") {
        summary.assigned++;
      } else if (status === "out_for_delivery") {
        summary.out_for_delivery++;
      } else if (status === "delivered") {
        summary.delivered++;
      } else if (status === "partial_return") {
        summary.partial_return++;
      } else if (status === "full_return") {
        summary.full_return++;
      }
      // إذا كانت الحالة غير معروفة، فلن يتم عدها في أي فئة
    });
    
    setStatusSummary(summary);
  };

  // تنقل بين الصفحات
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      // الحصول على معلمات URL الحالية للحفاظ على حالة الفلترة
      const params = getURLParams();
      params.set("page", newPage.toString());
      
      // تحديث URL بدون إعادة تحميل الصفحة
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
      
      // جلب الطلبات للصفحة الجديدة
      fetchOrders(newPage);
    }
  };

  // جلب البيانات عند تحميل الصفحة أو تغيير معلمات URL
  useEffect(() => {
    const handleURLChange = () => {
      const params = getURLParams();
      const page = parseInt(params.get("page") || "1");
      fetchOrders(page);
    };

    // جلب البيانات عند تحميل الصفحة
    handleURLChange();

    // الاستماع لتغييرات التاريخ في المتصفح (عند استخدام أزرار التقدم/الرجوع)
    window.addEventListener('popstate', handleURLChange);
    
    return () => {
      window.removeEventListener('popstate', handleURLChange);
    };
  }, []);

  // مراقبة التغييرات في معلمات البحث وإعادة جلب البيانات عند تغييرها
  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1");
    fetchOrders(page);
  }, [searchParams]);

  // فتح حوار تحديث الحالة
  const openStatusUpdateDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsStatusDialogOpen(true);
  };

  // تحديث الصفحة
  const handleRefresh = () => {
    const page = parseInt(searchParams.get("page") || "1");
    fetchOrders(page);
  };

  // تحديث حالة الطلب في القائمة مباشرة عند تغييرها
  const handleOrderStatusUpdate = (orderId: string, newStatus: string) => {
    // تحديث الطلب في القائمة المحلية
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return { ...order, status: newStatus, recentlyUpdated: true };
      }
      return order;
    });
    
    // تحديث القائمة
    setOrders(updatedOrders);
    
    // إزالة تأثير التحديث بعد 3 ثوانٍ
    setTimeout(() => {
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.id === orderId) {
            return { ...order, recentlyUpdated: false };
          }
          return order;
        })
      );
    }, 3000);
    
    // إعادة حساب ملخص الحالة
    calculateStatusSummary(updatedOrders);
  };

  // التحقق من وجود فلاتر نشطة
  const hasActiveFilters = () => {
    return searchParams.has("driver_id") || 
           searchParams.has("date") || 
           searchParams.has("status");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">إدارة التسليمات</h1>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>
      
      {/* فلاتر البحث */}
      <Card>
        <CardHeader>
          <CardTitle>فلاتر البحث</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DriverFilter drivers={drivers} />
            <DateFilter />
            
            {/* فلتر الحالة المعدل */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="status" className="text-sm font-medium">الحالة</label>
              <select
                id="status"
                className="p-2 border rounded-md"
                value={searchParams.get("status") || ""}
                onChange={(e) => {
                  const params = getURLParams();
                  if (e.target.value) {
                    params.set("status", e.target.value);
                  } else {
                    params.delete("status");
                  }
                  params.set("page", "1");
                  window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                  fetchOrders(1);
                }}
              >
                <option value="">جميع الحالات</option>
                <option value="entered">مدخل</option>
                <option value="assigned">معين لسائق</option>
                <option value="out_for_delivery">قيد التوصيل</option>
                <option value="delivered">تم التسليم</option>
                <option value="partial_return">إرجاع جزئي</option>
                <option value="full_return">إرجاع كامل</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* ملخص الحالة - يظهر عند تصفية البيانات حسب السائق والتاريخ */}
      {hasActiveFilters() && (
        <StatusSummary summary={statusSummary} />
      )}
      
      {/* قائمة الطلبات */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>قائمة التسليمات</CardTitle>
        </CardHeader>
        <CardContent>
          {/* عرض الجدول على الشاشات المتوسطة والكبيرة */}
          <div className="hidden sm:block mt-4">
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState error={error} />
            ) : orders.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="p-2 text-right border">الباركود</th>
                      <th className="p-2 text-right border">تاريخ الطلب</th>
                      <th className="p-2 text-right border">اسم المستلم</th>
                      <th className="p-2 text-right border">المدينة</th>
                      <th className="p-2 text-right border">المبلغ</th>
                      <th className="p-2 text-right border">المندوب</th>
                      <th className="p-2 text-right border">الحالة</th>
                      <th className="p-2 text-right border">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr 
                        key={order.id} 
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="p-2 border">{order.barcode}</td>
                        <td className="p-2 border">{new Date(order.order_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}</td>
                        <td className="p-2 border">{order.recipient_name}</td>
                        <td className="p-2 border">{order.recipient_city}</td>
                        <td className="p-2 border">{formatCurrency(order.cod_amount)}</td>
                        <td className="p-2 border">{order.drivers?.driver_name || "غير مسند"}</td>
                        <td className="p-2 border">
                          <DeliveryStatusBadge 
                            status={order.status} 
                            recentlyUpdated={order.recentlyUpdated}
                          />
                        </td>
                        <td className="p-2 border">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openStatusUpdateDialog(order)}
                          >
                            تحديث الحالة
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* عرض البطاقات على الجوال فقط */}
          <div className="sm:hidden space-y-4 mt-4">
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState error={error} />
            ) : orders.length === 0 ? (
              <EmptyState />
            ) : (
              orders.map((order) => (
                <div key={order.id} className="rounded-lg border p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">{order.barcode}</span>
                    <DeliveryStatusBadge status={order.status} recentlyUpdated={order.recentlyUpdated} />
                  </div>
                  <div className="mb-1"><span className="font-semibold">تاريخ الطلب: </span>{new Date(order.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  <div className="mb-1"><span className="font-semibold">اسم المستلم: </span>{order.recipient_name}</div>
                  <div className="mb-1"><span className="font-semibold">المدينة: </span>{order.recipient_city}</div>
                  <div className="mb-1"><span className="font-semibold">المبلغ: </span>{formatCurrency(order.cod_amount)}</div>
                  <div className="mb-1"><span className="font-semibold">المندوب: </span>{order.drivers?.driver_name || "غير مسند"}</div>
                  <div className="flex justify-end mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openStatusUpdateDialog(order)}
                    >
                      تحديث الحالة
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* التصفح (نفسه للجوال والديسكتوب) */}
          {orders.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
              <div className="text-sm text-gray-500">
                عرض {(pagination.currentPage - 1) * pagination.pageSize + 1} - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} من {pagination.totalItems}
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1 || isLoading}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages || isLoading}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* حوار تحديث الحالة */}
      {selectedOrder && (
        <StatusUpdateDialog
          isOpen={isStatusDialogOpen}
          onClose={() => setIsStatusDialogOpen(false)}
          orderId={selectedOrder.id}
          currentStatus={selectedOrder.status}
          onUpdate={handleOrderStatusUpdate}
        />
      )}
    </div>
  );
}

// الصفحة الرئيسية 
export default function DeliveriesPage() {
  return (
    <MainLayout>
      <Suspense fallback={<LoadingState />}>
        <DeliveriesContent />
      </Suspense>
    </MainLayout>
  );
} 