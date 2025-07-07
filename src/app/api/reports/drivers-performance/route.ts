import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define the type for driver performance data
interface DriverPerformance {
  driver_id: string;
  driver_name: string;
  total_orders: number;
  delivered_orders: number;
  returned_orders: number;
  delivery_rate: number;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from") || '';
    const to = url.searchParams.get("to") || '';
    
    // تحقق من صحة المدخلات
    if (!from || !to) {
      return NextResponse.json(
        { message: "يرجى تحديد نطاق التاريخ (from, to)" },
        { status: 400 }
      );
    }
    
    // إنشاء كائنات التاريخ والوقت لبداية ونهاية الفترة
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDate = new Date(`${to}T23:59:59.999Z`);
    
    // التحقق من صحة التواريخ
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { message: "تنسيق التاريخ غير صحيح. يرجى استخدام تنسيق YYYY-MM-DD" },
        { status: 400 }
      );
    }
    
    // الحصول على جميع السائقين
    const allDrivers = await prisma.drivers.findMany({
      select: {
        id: true,
        driver_name: true
      }
    });
    
    // الحصول على إحصائيات الطلبات لكل سائق
    const driversPerformance: DriverPerformance[] = [];
    
    for (const driver of allDrivers) {
      // إجمالي الطلبات المخصصة للسائق
      const totalOrders = await prisma.orders.count({
        where: {
          driver_id: driver.id,
          order_date: {
            gte: fromDate,
            lte: toDate
          }
        }
      });
      
      // طلبات تم تسليمها
      const deliveredOrders = await prisma.orders.count({
        where: {
          driver_id: driver.id,
          status: 'delivered',
          order_date: {
            gte: fromDate,
            lte: toDate
          }
        }
      });
      
      // طلبات مرتجعة
      const returnedOrders = await prisma.orders.count({
        where: {
          driver_id: driver.id,
          status: 'returned',
          order_date: {
            gte: fromDate,
            lte: toDate
          }
        }
      });
      
      // إضافة البيانات فقط للسائقين الذين لديهم طلبات
      if (totalOrders > 0) {
        // حساب معدل التسليم
        const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
        
        driversPerformance.push({
          driver_id: driver.id,
          driver_name: driver.driver_name,
          total_orders: totalOrders,
          delivered_orders: deliveredOrders,
          returned_orders: returnedOrders,
          delivery_rate: deliveryRate
        });
      }
    }
    
    // ترتيب السائقين حسب عدد الطلبات (تنازليًا)
    driversPerformance.sort((a, b) => b.total_orders - a.total_orders);
    
    return NextResponse.json({ data: driversPerformance }, { status: 200 });
  } catch (error) {
    console.error("خطأ في الحصول على تقرير أداء السائقين:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب البيانات" },
      { status: 500 }
    );
  }
} 