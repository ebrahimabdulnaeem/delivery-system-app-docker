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
    
    // الحصول على تجميع الطلبات حسب المدينة
    const cityCounts = await prisma.$queryRaw`
      SELECT 
        recipient_city as city, 
        COUNT(*) as count
      FROM 
        orders
      WHERE 
        order_date BETWEEN ${fromDate} AND ${toDate}
      GROUP BY 
        recipient_city
      ORDER BY 
        count DESC
    `;
    
    // حساب إجمالي الطلبات للحصول على النسب المئوية
    const totalOrders = await prisma.orders.count({
      where: {
        order_date: {
          gte: fromDate,
          lte: toDate
        }
      }
    });
    
    // إضافة النسبة المئوية لكل مدينة
    const cityData = Array.isArray(cityCounts) ? 
      cityCounts.map((item: any) => {
        // التأكد من تحويل جميع القيم الرقمية إلى نوع Number
        const count = Number(item.count || 0);
        const total = Number(totalOrders || 1); // تجنب القسمة على صفر
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        return {
          city: item.city || 'غير معروف',
          count: count,
          percentage: percentage
        };
      }) : [];
    
    return NextResponse.json({ data: cityData }, { status: 200 });
  } catch (error) {
    console.error("خطأ في الحصول على تقرير الطلبات حسب المدينة:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب البيانات" },
      { status: 500 }
    );
  }
} 