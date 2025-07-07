import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    
    // الحصول على تجميع الطلبات حسب الحالة
    const statusCounts = await prisma.$queryRaw`
      SELECT 
        status, 
        COUNT(*) as count
      FROM 
        orders
      WHERE 
        order_date BETWEEN ${fromDate} AND ${toDate}
      GROUP BY 
        status
      ORDER BY 
        count DESC
    `;
    
    // تحويل BigInt إلى Number
    const formattedStatusCounts = Array.isArray(statusCounts) ? 
      statusCounts.map((item: any) => {
        // التحقق من وجود البيانات وتحويلها
        const status = item.status || 'unknown';
        const count = Number(item.count || 0);
        
        return {
          status: status,
          count: count
        };
      }) : [];
    
    return NextResponse.json({ data: formattedStatusCounts }, { status: 200 });
  } catch (error) {
    console.error("خطأ في الحصول على تقرير الطلبات حسب الحالة:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب البيانات" },
      { status: 500 }
    );
  }
} 