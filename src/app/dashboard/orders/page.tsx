"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Package, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, getArabicOrderStatus } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdvancedSearch } from "./components/AdvancedSearch";
import { OrderStats } from "./components/OrderStats";

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
};

type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
};

// مكون OrderContent المغلف بحدود Suspense
function OrdersContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 50,
    totalItems: 0
  });
  
  // قوائم للفلترة
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; driver_name: string }[]>([]);

  // إنشاء مرجع للإلغاء
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);

  // خيارات عدد العناصر لكل صفحة
  const pageSizeOptions = [10, 25, 50, 100];

  // جلب البيانات الثابتة للفلترة (المدن والسائقين)
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        // جلب المدن
        const citiesResponse = await fetch("/api/cities");
        if (citiesResponse.ok) {
          const citiesData = await citiesResponse.json();
          setCities(citiesData.data || citiesData);
        }

        // جلب السائقين
        const driversResponse = await fetch("/api/drivers");
        if (driversResponse.ok) {
          const driversData = await driversResponse.json();
          setDrivers(driversData.data || driversData);
        }
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };

    fetchFilterData();
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

  // معالج تغيير عدد العناصر لكل صفحة
  const handlePageSizeChange = (newSize: number) => {
    // الحصول على معلمات URL الحالية
    const params = getURLParams();
    
    // تحديث عدد العناصر في الصفحة
    params.set("limit", newSize.toString());
    
    // إعادة تعيين رقم الصفحة إلى 1 عند تغيير حجم الصفحة
    params.set("page", "1");
    
    // تحديث URL بدون إعادة تحميل الصفحة
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    
    // تحديث حالة الصفحة المحلية
    setPagination(prev => ({
      ...prev,
      pageSize: newSize,
      currentPage: 1
    }));
    
    // جلب الطلبات بالعدد الجديد
    fetchOrders(1, newSize);
  };

  // جلب قائمة الطلبات
  const fetchOrders = async (page = 1, pageSize = pagination.pageSize) => {
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
      params.set("limit", pageSize.toString());
      
      console.log(`جاري جلب الطلبات: ${params.toString()}`);
      
      const response = await fetch(`/api/orders?${params.toString()}`, { signal });
      
      // التأكد من أن المكون لا يزال موجودًا قبل تحديث الحالة
      if (!isMounted.current) return;
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data);
        setPagination(data.pagination);
      } else {
        setOrders([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          pageSize: 50,
          totalItems: 0
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
        pageSize: 50,
        totalItems: 0
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

  // تنقل بين الصفحات
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      // الحصول على معلمات URL الحالية للحفاظ على حالة الفلترة
      const params = getURLParams();
      params.set("page", newPage.toString());
      
      // تحديث URL بدون إعادة تحميل الصفحة
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
      
      // جلب الطلبات للصفحة الجديدة
      fetchOrders(newPage, pagination.pageSize);
    }
  };

  // جلب البيانات عند تحميل الصفحة أو تغيير معلمات URL
  useEffect(() => {
    const handleURLChange = () => {
      const params = getURLParams();
      const page = parseInt(params.get("page") || "1");
      const limit = parseInt(params.get("limit") || "50");
      
      // تحديث حالة الصفحة المحلية
      setPagination(prev => ({
        ...prev,
        pageSize: limit
      }));
      
      fetchOrders(page, limit);
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
    const limit = parseInt(searchParams.get("limit") || "50");
    fetchOrders(page, limit);
  }, [searchParams]);

  // فحص حالة الاتصال بالإنترنت
  useEffect(() => {
    const handleOnline = () => {
      if (error) {
        toast.success("تم استعادة الاتصال بالإنترنت");
        const params = getURLParams();
        const page = parseInt(params.get("page") || "1");
        const limit = parseInt(params.get("limit") || "50");
        fetchOrders(page, limit);
      }
    };
    
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [error]);

  // الحصول على لون خلفية حالة الطلب
  const getStatusBgColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch(statusLower) {
      case "entered": return "bg-gray-100 text-gray-800";
      case "assigned": return "bg-blue-100 text-blue-800";
      case "out_for_delivery": return "bg-yellow-100 text-yellow-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "partial_return": return "bg-orange-100 text-orange-800";
      case "full_return": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // معالج إعادة تحميل البيانات
  const handleRefresh = () => {
    const params = getURLParams();
    const page = parseInt(params.get("page") || "1");
    const limit = parseInt(params.get("limit") || "50");
    fetchOrders(page, limit);
  };

  // التحقق إذا كان هناك معايير بحث نشطة
  const hasActiveFilters = () => {
    return !!(
      searchParams.get("barcode") || 
      searchParams.get("name") || 
      searchParams.get("status") || 
      searchParams.get("city") || 
      searchParams.get("driverId") || 
      searchParams.get("date")
    );
  };

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
          <div className="flex items-center gap-2">
          {user && (user.role === "admin" || user.role === "data_entry") && (
              <>
                <Button asChild variant="outline" className="flex items-center gap-2">
                  <Link href="/dashboard/orders/waybills">
                    <Package size={16} />
                    إدارة بوالص الشحن
                  </Link>
                </Button>
                <Button asChild className="flex items-center gap-2">
                  <Link href="/dashboard/orders/new">
                    <Plus size={16} />
                    إضافة طلب جديد
                  </Link>
                </Button>
              </>
          )}
          </div>
        </div>
      
      {/* عرض إحصائيات الطلبات إذا لم يكن هناك بحث نشط */}
      {!hasActiveFilters() && (
        <OrderStats />
      )}
      
      {/* إضافة مكون البحث المتقدم */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <AdvancedSearch cities={cities} drivers={drivers} />
        </CardContent>
      </Card>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
            <CardTitle>قائمة الطلبات</CardTitle>
            <CardDescription>
              إجمالي الطلبات: {pagination.totalItems} | عرض الصفحة {pagination.currentPage} من {pagination.totalPages}
            </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">عناصر لكل صفحة:</span>
                  <select 
                    className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm"
                    value={pagination.pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  >
                    {pageSizeOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                title="إعادة تحميل البيانات"
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* عرض الجدول على الشاشات المتوسطة والكبيرة */}
            <div className="hidden sm:block">
            {isLoading ? (
              <div className="text-center p-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p>جاري التحميل...</p>
              </div>
            ) : error ? (
              <div className="text-center p-10">
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-red-600">{error}</p>
                  <Button 
                    onClick={handleRefresh} 
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    إعادة المحاولة
                  </Button>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center p-10">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">لا يوجد طلبات متطابقة مع البحث</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                        #
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                        الباركود
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                        المستلم
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                        المدينة
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                        المبلغ
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                        الحالة
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                        السائق
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                        تاريخ الطلب
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {orders.map((order, index) => {
                      const sequentialNumber = (pagination.currentPage - 1) * pagination.pageSize + (index + 1);
                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-500 text-center">
                            {sequentialNumber}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                            {order.barcode}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div>{order.recipient_name}</div>
                            <div className="text-xs text-gray-500">{order.recipient_phone1}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{order.recipient_city}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {formatCurrency(order.cod_amount)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs ${getStatusBgColor(order.status)}`}>
                              {getArabicOrderStatus(order.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {order.drivers?.driver_name || (
                              <span className="text-gray-400">غير معين</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {(() => {
                              const dateStr = order.order_date;
                              const datePart = dateStr.split('T')[0];
                              const [year, month, day] = datePart.split('-');
                              const formatter = new Intl.DateTimeFormat('ar-EG', {
                                year: 'numeric',
                                month: 'numeric',
                                day: 'numeric'
                              });
                              return formatter.format(new Date(Number(year), Number(month) - 1, Number(day)));
                            })()}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="flex justify-end space-x-2 space-x-reverse">
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/dashboard/orders/${order.id}`}>
                                  عرض
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            </div>
            {/* عرض البطاقات على الجوال فقط */}
            <div className="sm:hidden space-y-4">
              {isLoading ? (
                <div className="text-center p-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p>جاري التحميل...</p>
                </div>
              ) : error ? (
                <div className="text-center p-10">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <p className="text-red-600">{error}</p>
                    <Button 
                      onClick={handleRefresh} 
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      إعادة المحاولة
                    </Button>
                  </div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center p-10">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">لا يوجد طلبات متطابقة مع البحث</p>
                </div>
              ) : (
                orders.map((order, index) => {
                  const sequentialNumber = (pagination.currentPage - 1) * pagination.pageSize + (index + 1);
                  return (
                    <div key={order.id} className="rounded-lg border p-4 bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-muted-foreground">#{sequentialNumber}</span>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs ${getStatusBgColor(order.status)}`}>
                          {getArabicOrderStatus(order.status)}
                        </span>
                      </div>
                      <div className="mb-1"><span className="font-semibold">الباركود: </span>{order.barcode}</div>
                      <div className="mb-1"><span className="font-semibold">المستلم: </span>{order.recipient_name}</div>
                      <div className="mb-1"><span className="font-semibold">رقم المستلم: </span>{order.recipient_phone1}</div>
                      <div className="mb-1"><span className="font-semibold">المدينة: </span>{order.recipient_city}</div>
                      <div className="mb-1"><span className="font-semibold">المبلغ: </span>{formatCurrency(order.cod_amount)}</div>
                      <div className="mb-1"><span className="font-semibold">السائق: </span>{order.drivers?.driver_name || <span className="text-gray-400">غير معين</span>}</div>
                      <div className="mb-1"><span className="font-semibold">تاريخ الطلب: </span>{(() => {
                        const dateStr = order.order_date;
                        const datePart = dateStr.split('T')[0];
                        const [year, month, day] = datePart.split('-');
                        const formatter = new Intl.DateTimeFormat('ar-EG', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric'
                        });
                        return formatter.format(new Date(Number(year), Number(month) - 1, Number(day)));
                      })()}</div>
                      <div className="flex justify-end mt-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/orders/${order.id}`}>عرض</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* Pagination (نفسه للجوال والديسكتوب) */}
            {pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-2">
                <div className="text-sm text-muted-foreground">
                  عرض {(pagination.currentPage - 1) * pagination.pageSize + 1} إلى {
                    Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)
                  } من {pagination.totalItems} طلب
                </div>
                <nav className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1 || isLoading}
                  >
                    السابق
                  </Button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page =>
                      page === 1 ||
                      page === pagination.totalPages ||
                      (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                    )
                    .reduce((acc: (number | string)[], page, idx, array) => {
                      if (idx > 0 && array[idx - 1] !== page - 1) {
                        acc.push('...');
                      }
                      acc.push(page);
                      return acc;
                    }, [])
                    .map((page, idx) =>
                      typeof page === 'number' ? (
                        <Button
                          key={idx}
                          variant={pagination.currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page as number)}
                          disabled={isLoading}
                        >
                          {page}
                        </Button>
                      ) : (
                        <span key={idx} className="px-2">
                          {page}
                        </span>
                      )
                    )
                  }
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages || isLoading}
                  >
                    التالي
                  </Button>
                </nav>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}

// مكون Loading للاستخدام في Suspense
function Loading() {
  return (
    <div className="text-center p-10">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
      <p>جاري تحميل البيانات...</p>
    </div>
  );
}

// الصفحة الرئيسية التي ترجع المكون المغلف بـ Suspense
export default function OrdersPage() {
  return (
    <MainLayout>
      <Suspense fallback={<Loading />}>
        <OrdersContent />
      </Suspense>
    </MainLayout>
  );
} 