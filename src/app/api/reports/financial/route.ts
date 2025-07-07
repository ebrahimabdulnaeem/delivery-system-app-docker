import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from") || '';
    const to = url.searchParams.get("to") || '';
    const groupBy = url.searchParams.get("groupBy") || 'day';
    
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
    
    // الحصول على إجمالي المبالغ وعدد الطلبات
    const summary = await prisma.$queryRaw`
      SELECT 
        SUM(cod_amount) as total_amount,
        COUNT(*) as total_orders
      FROM 
        orders
      WHERE 
        order_date BETWEEN ${fromDate} AND ${toDate}
        AND status = 'delivered'
    `;
    
    // التحقق من وجود البيانات والتحويل إلى Number
    const summaryData = Array.isArray(summary) && summary.length > 0 ? summary[0] : {};
    const totalAmount = Number(summaryData.total_amount || 0);
    const totalOrders = Number(summaryData.total_orders || 0);
    
    // حساب متوسط قيمة الطلب
    const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;
    
    // الحصول على البيانات اليومية/الأسبوعية/الشهرية
    let dailyData: any[] = [];
    
    // إذا كان التجميع يوميًا
    if (groupBy === 'day') {
      // الحصول على البيانات اليومية
      dailyData = await prisma.$queryRaw`
        SELECT 
          DATE(order_date) as date,
          SUM(cod_amount) as amount,
          COUNT(*) as orders_count
        FROM 
          orders
        WHERE 
          order_date BETWEEN ${fromDate} AND ${toDate}
          AND status = 'delivered'
        GROUP BY 
          DATE(order_date)
        ORDER BY 
          date
      `;
    } 
    // إذا كان التجميع أسبوعيًا
    else if (groupBy === 'week') {
      // الحصول على البيانات الأسبوعية (تجميع حسب الأسبوع)
      dailyData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('week', order_date) as date,
          SUM(cod_amount) as amount,
          COUNT(*) as orders_count
        FROM 
          orders
        WHERE 
          order_date BETWEEN ${fromDate} AND ${toDate}
          AND status = 'delivered'
        GROUP BY 
          DATE_TRUNC('week', order_date)
        ORDER BY 
          date
      `;
    } 
    // إذا كان التجميع شهريًا
    else if (groupBy === 'month') {
      // الحصول على البيانات الشهرية (تجميع حسب الشهر)
      dailyData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', order_date) as date,
          SUM(cod_amount) as amount,
          COUNT(*) as orders_count
        FROM 
          orders
        WHERE 
          order_date BETWEEN ${fromDate} AND ${toDate}
          AND status = 'delivered'
        GROUP BY 
          DATE_TRUNC('month', order_date)
        ORDER BY 
          date
      `;
    }
    
    // الحصول على البيانات حسب المدينة
    const cityData = await prisma.$queryRaw`
      SELECT 
        recipient_city as city,
        SUM(cod_amount) as amount,
        COUNT(*) as orders_count
      FROM 
        orders
      WHERE 
        order_date BETWEEN ${fromDate} AND ${toDate}
        AND status = 'delivered'
      GROUP BY 
        recipient_city
      ORDER BY 
        amount DESC
    `;
    
    // تحويل جميع قيم BigInt إلى Number
    const processedCityData = Array.isArray(cityData) ? 
      cityData.map((item: any) => ({
        city: item.city || 'غير معروف',
        amount: Number(item.amount || 0),
        orders_count: Number(item.orders_count || 0)
      })) : [];
    
    // حساب النسبة المئوية لكل مدينة
    const cityDataWithPercentage = processedCityData.map(item => ({
      ...item,
      percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
    }));
    
    return NextResponse.json({
      data: {
        total_amount: totalAmount,
        total_orders: totalOrders,
        average_order_value: averageOrderValue,
        daily_data: Array.isArray(dailyData) ? dailyData.map((item: any) => ({
          date: format(new Date(item.date), 'yyyy-MM-dd'),
          amount: Number(item.amount || 0),
          orders_count: Number(item.orders_count || 0)
        })) : [],
        city_data: cityDataWithPercentage
      }
    }, { status: 200 });
  } catch (error) {
    console.error("خطأ في الحصول على التقارير المالية:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب البيانات المالية" },
      { status: 500 }
    );
  }
} 