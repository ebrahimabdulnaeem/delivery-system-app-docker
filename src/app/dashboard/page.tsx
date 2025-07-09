"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Order, Driver } from "@/types";
import { MainLayout } from "@/components/layout/MainLayout";
import { getArabicOrderStatus, getOrderStatusColor, formatCurrency } from "@/lib/utils";
import { 
  Package, 
  PackageCheck,
  Clock as PackageClock,
  PackageX,
  Clock,
  ArrowUpRight,
  Truck,
  Users,
  Navigation,
  Home
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// تعريف واجهة لإحصائيات الطلبات
interface OrderStats {
  totalOrders: number;
  delivered: number;
  pending: number;
  returned: number;
  totalAmount: number;
  deliveredAmount: number;
}

// تكوين بيانات الصفحة
export const dynamic = 'force-dynamic';

// استخدام كائن عالمي للتخزين المؤقت خارج المكون
const CACHE: {
  orderStats: OrderStats | null;
  recentOrders: Order[] | null;
  drivers: Driver[] | null;
  lastFetch: number;
  staleTime: number;
} = {
  orderStats: null,
  recentOrders: null,
  drivers: null,
  lastFetch: 0,
  staleTime: 5 * 60 * 1000
};

// دالة لحساب النسبة المئوية بأمان
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  if (value === undefined || total === undefined) return 0;
  
  // تحويل القيم إلى أرقام
  const numValue = Number(value);
  const numTotal = Number(total);
  
  // فحص إذا كانت القيم صالحة
  if (isNaN(numValue) || isNaN(numTotal) || numTotal === 0) return 0;
  
  const percentage = Math.round((numValue / numTotal) * 100);
  return percentage;
};

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    delivered: 0,
    pending: 0,
    returned: 0,
    totalAmount: 0,
    deliveredAmount: 0
  });
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // التحقق من صلاحية البيانات المخزنة مؤقتًا
  const isCacheValid = useCallback(() => {
    return CACHE.lastFetch > 0 && (Date.now() - CACHE.lastFetch) < CACHE.staleTime;
  }, []);



  // التحقق من وجود المستخدم
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // جلب البيانات بشكل مستقل لكل نوع
  const fetchOrderStats = useCallback(async () => {
    try {
      const statsResponse = await fetch('/api/stats/orders', {
        cache: 'no-store',
        headers: { 'x-force-fetch': Date.now().toString() }
      });
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        
        // معالجة البيانات واستخراج الأرقام
        const sanitizedStats = {
          totalOrders: Number(stats.totalOrders) || 0,
          delivered: Number(stats.totalDelivered) || 0,
          pending: Number(stats.totalPending) || 0,
          returned: Number(stats.totalReturned) || 0,
          totalAmount: Number(stats.totalAmount) || 0,
          deliveredAmount: Number(stats.deliveredAmount) || 0
        };
        
        // تحديث التخزين المؤقت والحالة
        CACHE.orderStats = sanitizedStats;
        setOrderStats(sanitizedStats);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("حدث خطأ في جلب إحصائيات الطلبات:", error);
      return false;
    }
  }, []);

  const fetchRecentOrders = useCallback(async () => {
    try {
      const ordersResponse = await fetch('/api/orders?limit=5&page=1', {
        cache: 'no-store',
        headers: { 'x-force-fetch': Date.now().toString() }
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        
        // تحديث التخزين المؤقت والحالة
        CACHE.recentOrders = ordersData.data;
        setRecentOrders(ordersData.data);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("حدث خطأ في جلب بيانات الطلبات:", error);
      return false;
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      const driversResponse = await fetch('/api/drivers?limit=5', {
        cache: 'no-store',
        headers: { 'x-force-fetch': Date.now().toString() }
      });
      
      if (driversResponse.ok) {
        const driversData = await driversResponse.json();
        const driversArray = driversData.data || driversData;
        
        // تحديث التخزين المؤقت والحالة
        CACHE.drivers = driversArray;
        setDrivers(driversArray);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("حدث خطأ في جلب بيانات السائقين:", error);
      return false;
    }
  }, []);

  // جلب جميع البيانات
  const fetchAllData = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    // التحقق من صلاحية البيانات المخزنة مؤقتًا
    if (!forceRefresh && isCacheValid()) {
      // استخدام البيانات المخزنة
      if (CACHE.orderStats) setOrderStats(CACHE.orderStats);
      if (CACHE.recentOrders) setRecentOrders(CACHE.recentOrders);
      if (CACHE.drivers) setDrivers(CACHE.drivers);
      
      setIsLoadingData(false);
      return;
    }
    
    setIsLoadingData(true);
    
    // جلب جميع البيانات بالتوازي
    const results = await Promise.all([
      fetchOrderStats(),
      fetchRecentOrders(),
      fetchDrivers()
    ]);
    
    // تحديث وقت آخر جلب للبيانات
    CACHE.lastFetch = Date.now();
    
    // إذا فشلت أي من عمليات الجلب
    if (results.includes(false)) {
      toast.error("حدث خطأ أثناء جلب بعض البيانات");
    }
    
    setIsLoadingData(false);
  }, [user, isCacheValid, fetchOrderStats, fetchRecentOrders, fetchDrivers]);

  // تحديث البيانات عند تحميل الصفحة
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
    
    // استمع إلى أحداث تغيير التركيز (focus)
    const handleFocus = () => {
      // تحديث البيانات إذا كانت قديمة
      if (user && !isCacheValid()) {
        fetchAllData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchAllData, isCacheValid]);

  if (isLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // حساب النسب المئوية


  return (
    <MainLayout>
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">لوحة التحكم</h1>
            <p className="text-muted-foreground mt-2">مرحباً بك في نظام إدارة التوصيل</p>
          </div>
  
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden dashboard-card bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                <Package className="h-4 w-4 text-blue-100" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats.totalOrders}</div>
                <p className="text-xs text-blue-200 mt-1">جميع طلبات التوصيل الموجودة في النظام</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden dashboard-card bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">تم التوصيل</CardTitle>
                <PackageCheck className="h-4 w-4 text-green-100" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats.delivered}</div>
                <p className="text-xs text-green-200 mt-1">{calculatePercentage(orderStats.delivered, orderStats.totalOrders)}% من إجمالي الطلبات</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden dashboard-card bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
                <PackageClock className="h-4 w-4 text-amber-100" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats.pending}</div>
                <p className="text-xs text-amber-200 mt-1">{calculatePercentage(orderStats.pending, orderStats.totalOrders)}% من إجمالي الطلبات</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden dashboard-card bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">مرتجع</CardTitle>
                <PackageX className="h-4 w-4 text-red-100" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats.returned}</div>
                <p className="text-xs text-red-200 mt-1">{calculatePercentage(orderStats.returned, orderStats.totalOrders)}% من إجمالي الطلبات</p>
              </CardContent>
            </Card>
          </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>أحدث الطلبات</CardTitle>
                <CardDescription>آخر خمسة طلبات تم إدخالها في النظام</CardDescription>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map(order => (
                    <Link 
                      key={order.id} 
                      href={`/dashboard/orders/${order.id}`}
                      className="block rounded-md border p-4 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{order.recipient_name}</div>
                          <div className="text-sm text-muted-foreground">{order.recipient_city}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {typeof order.cod_amount === 'number' 
                              ? formatCurrency(order.cod_amount)
                              : formatCurrency(Number(order.cod_amount))}
                          </div>
                          <div className={`text-sm mt-1 ${getOrderStatusColor(order.status)}`}>
                            {getArabicOrderStatus(order.status)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">لا توجد طلبات حتى الآن</div>
                )}
                {recentOrders.length > 0 && (
                  <Button variant="outline" asChild className="w-full mt-2 gap-2">
                    <Link href="/dashboard/orders">
                      <span>عرض جميع الطلبات</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>السائقين</CardTitle>
                <CardDescription>قائمة السائقين النشطين في النظام</CardDescription>
              </div>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {drivers.length > 0 ? (
                  drivers.slice(0, 5).map(driver => (
                    <div key={driver.id} className="rounded-md border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{driver.driver_name}</div>
                          <div className="text-sm text-muted-foreground">{driver.driver_phone}</div>
                        </div>
                        {driver.assigned_areas && driver.assigned_areas.length > 0 && (
                          <div className="text-sm text-muted-foreground text-left">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                              {Array.isArray(driver.assigned_areas) 
                                ? driver.assigned_areas[0]
                                : typeof driver.assigned_areas === 'object' && driver.assigned_areas !== null
                                  ? String(Object.values(driver.assigned_areas)[0])
                                  : "غير محدد"}
                            </span>
                            {Array.isArray(driver.assigned_areas) && driver.assigned_areas.length > 1 && (
                              <span className="text-xs"> +{driver.assigned_areas.length - 1}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">لا يوجد سائقين حتى الآن</div>
                )}
                {user && user.role === "admin" && (
                  <Button variant="outline" asChild className="w-full mt-2 gap-2">
                    <Link href="/dashboard/drivers">
                      <span>إدارة السائقين</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/dashboard/orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <Package className="h-8 w-8 text-blue-500" />
                <div>
                  <CardTitle>إدارة الطلبات</CardTitle>
                  <CardDescription>عرض، إضافة وتحديث الطلبات</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p>الوصول إلى جميع الطلبات في النظام، متابعة الحالة والتعديل عليها حسب الصلاحيات.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/drivers">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <Truck className="h-8 w-8 text-green-500" />
                <div>
                  <CardTitle>إدارة السائقين</CardTitle>
                  <CardDescription>عرض وإضافة بيانات السائقين</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p>إدارة السائقين المسجلين في النظام، إضافة سائقين جدد وتعيين المناطق لهم.</p>
              </CardContent>
            </Card>
          </Link>

          {user.role === "admin" && (
            <Link href="/dashboard/users">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Users className="h-8 w-8 text-purple-500" />
                  <div>
                    <CardTitle>إدارة المستخدمين</CardTitle>
                    <CardDescription>إدارة حسابات المستخدمين</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>إضافة وتعديل مستخدمي النظام، تعيين الصلاحيات وإدارة الأدوار.</p>
                </CardContent>
              </Card>
            </Link>
          )}

          <Link href="/dashboard/cities">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <Navigation className="h-8 w-8 text-yellow-500" />
                <div>
                  <CardTitle>إدارة المدن</CardTitle>
                  <CardDescription>عرض وإضافة المدن</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p>إدارة المدن المتاحة في النظام للتوصيل واستخدامها في الطلبات.</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <Home className="h-8 w-8 text-gray-500" />
                <div>
                  <CardTitle>الصفحة الرئيسية</CardTitle>
                  <CardDescription>العودة للصفحة الرئيسية</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p>العودة إلى الصفحة الرئيسية للموقع والواجهة العامة.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
} 