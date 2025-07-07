import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // الحصول على إجمالي عدد الطلبات
    const totalOrders = await prisma.orders.count();

    // الحصول على عدد الطلبات حسب الحالة
    const ordersByStatus = await prisma.$queryRaw`
      SELECT 
        status, 
        COUNT(*) as count,
        SUM(cod_amount) as total_amount
      FROM orders 
      GROUP BY status
    ` as Array<{ status: string; count: bigint; total_amount: number }>;

    // حساب الإحصائيات
    let totalDelivered = 0;
    let totalPending = 0;
    let totalReturned = 0;
    let totalAmount = 0;
    let deliveredAmount = 0;
    
    ordersByStatus.forEach((status) => {
      const count = Number(status.count);
      const amount = Number(status.total_amount);
      
      totalAmount += amount;
      
      if (status.status === 'delivered') {
        totalDelivered += count;
        deliveredAmount += amount;
      } else if (status.status === 'partial_return' || status.status === 'full_return') {
        totalReturned += count;
      } else {
        // الطلبات قيد التوصيل (معين، جاري التوصيل، مدخل)
        totalPending += count;
      }
    });

    return NextResponse.json({
      totalOrders,
      totalDelivered,
      totalPending,
      totalReturned,
      totalAmount,
      deliveredAmount
    });
  } catch (error) {
    console.error("خطأ في الحصول على إحصائيات الطلبات:", error);
    return NextResponse.json(
      { 
        message: "حدث خطأ أثناء الحصول على إحصائيات الطلبات",
        error: error instanceof Error ? error.message : "خطأ غير معروف"
      },
      { status: 500 }
    );
  }
} 