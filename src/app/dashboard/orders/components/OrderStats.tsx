"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon, Package, Truck, CheckCircle, AlertCircle } from "lucide-react";

interface OrderStats {
  totalOrders: number;
  totalDelivered: number;
  totalPending: number;
  totalReturned: number;
  totalAmount: number;
  deliveredAmount: number;
}

export function OrderStats() {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/stats/orders');
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          const errorData = await response.json();
          setError(errorData.message || "فشل في استرجاع إحصائيات الطلبات");
        }
      } catch (error) {
        console.error("Error fetching order stats:", error);
        setError("حدث خطأ أثناء استرجاع إحصائيات الطلبات");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 w-24 bg-gray-200 rounded"></div>
              <div className="h-8 w-32 bg-gray-300 rounded mt-1"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 w-36 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return null; // عدم عرض شيء في حالة الخطأ
  }

  const percentDelivered = stats.totalOrders > 0 
    ? Math.round((stats.totalDelivered / stats.totalOrders) * 100) 
    : 0;
  
  const percentReturned = stats.totalOrders > 0 
    ? Math.round((stats.totalReturned / stats.totalOrders) * 100) 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* إجمالي الطلبات */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</CardTitle>
            <CardDescription className="text-2xl font-bold">{stats.totalOrders}</CardDescription>
          </div>
          <Package className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            {stats.totalPending} طلب قيد التوصيل
          </div>
        </CardContent>
      </Card>

      {/* الطلبات المسلمة */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">الطلبات المسلمة</CardTitle>
            <CardDescription className="text-2xl font-bold">
              {stats.totalDelivered}
              <span className="ml-2 text-sm font-medium text-green-600">
                ({percentDelivered}%)
              </span>
            </CardDescription>
          </div>
          <CheckCircle className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            {formatCurrency(stats.deliveredAmount)} تم تحصيلها
          </div>
        </CardContent>
      </Card>

      {/* الطلبات المرتجعة */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">الطلبات المرتجعة</CardTitle>
            <CardDescription className="text-2xl font-bold">
              {stats.totalReturned}
              <span className="ml-2 text-sm font-medium text-red-600">
                ({percentReturned}%)
              </span>
            </CardDescription>
          </div>
          <AlertCircle className="h-5 w-5 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            {formatCurrency(stats.totalAmount - stats.deliveredAmount)} لم يتم تحصيلها
          </div>
        </CardContent>
      </Card>

      {/* إجمالي المبالغ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المبالغ</CardTitle>
            <CardDescription className="text-2xl font-bold">
              {formatCurrency(stats.totalAmount)}
            </CardDescription>
          </div>
          <Truck className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ArrowUpIcon className="h-3 w-3 text-green-600" />
              <span className="text-green-600">{formatCurrency(stats.deliveredAmount)}</span>
            </div>
            <span>|</span>
            <div className="flex items-center gap-1">
              <ArrowDownIcon className="h-3 w-3 text-red-600" />
              <span className="text-red-600">{formatCurrency(stats.totalAmount - stats.deliveredAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 