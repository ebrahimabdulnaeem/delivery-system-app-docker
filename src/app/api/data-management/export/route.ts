import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// دالة لتحويل بيانات الجدول إلى تنسيق CSV
function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // استخراج أسماء الأعمدة من الكائن الأول
  const headers = Object.keys(data[0]);
  
  // إنشاء سطر العناوين
  const headerRow = headers.join(',');
  
  // إنشاء سطور البيانات
  const rows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      
      // معالجة القيم الخاصة
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'object') {
        // تحويل الكائنات إلى نص JSON
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      } else if (typeof value === 'string') {
        // إضافة علامات اقتباس للنصوص وإلغاء علامات الاقتباس الموجودة
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
  });
  
  // دمج الصفوف في نص واحد
  return [headerRow, ...rows].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    // الحصول على جلسة المستخدم الحالي
    // نحتاج إلى تجاوز مشكلة نوع authOptions
    // @ts-expect-error - تجاوز التحقق من النوع للحصول على الجلسة
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "غير مصرح لك بالوصول" },
        { status: 401 }
      );
    }
    
    // التحقق من دور المستخدم (للمدراء فقط)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { message: "ليس لديك صلاحية للقيام بهذه العملية" },
        { status: 403 }
      );
    }
    
    // الحصول على نوع البيانات المطلوب تصديرها
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    
    if (!type) {
      return NextResponse.json(
        { message: "يجب تحديد نوع البيانات" },
        { status: 400 }
      );
    }
    
    let data: Record<string, unknown>[] = [];
    
    // استخدام Prisma للوصول إلى البيانات
    switch (type) {
      case "orders":
        const orders = await prisma.orders.findMany({
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            barcode: true,
            recipient_name: true,
            recipient_phone1: true,
            recipient_phone2: true,
            recipient_city: true,
            recipient_address: true,
            cod_amount: true,
            status: true,
            number_of_pieces: true,
            order_description: true,
            special_instructions: true,
            sender_reference: true,
            driver_id: true,
            created_by: true,
            order_date: true,
            created_at: true,
            updated_at: true
          }
        });
        
        data = orders.map(order => {
          // معالجة التواريخ وتحويلها إلى نص
          const formattedOrder: Record<string, unknown> = { ...order };
          
          if (order.order_date instanceof Date) {
            formattedOrder.order_date = order.order_date.toISOString().split('T')[0];
          }
          
          if (order.created_at instanceof Date) {
            formattedOrder.created_at = order.created_at.toISOString();
          }
          
          if (order.updated_at instanceof Date) {
            formattedOrder.updated_at = order.updated_at.toISOString();
          }
          
          return formattedOrder;
        });
        break;
      case "drivers":
        const drivers = await prisma.drivers.findMany({
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            driver_name: true,
            driver_phone: true,
            driver_id_number: true,
            assigned_areas: true,
            created_at: true,
            updated_at: true
          }
        });
        
        data = drivers.map(driver => {
          // معالجة التواريخ والبيانات المعقدة
          const formattedDriver: Record<string, unknown> = { ...driver };
          
          if (driver.assigned_areas) {
            formattedDriver.assigned_areas = JSON.stringify(driver.assigned_areas);
          }
          
          if (driver.created_at instanceof Date) {
            formattedDriver.created_at = driver.created_at.toISOString();
          }
          
          if (driver.updated_at instanceof Date) {
            formattedDriver.updated_at = driver.updated_at.toISOString();
          }
          
          return formattedDriver;
        });
        break;
      case "cities":
        const cities = await prisma.cities.findMany({
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            created_at: true,
            updated_at: true
          }
        });
        
        data = cities.map(city => {
          // معالجة التواريخ
          const formattedCity: Record<string, unknown> = { ...city };
          
          if (city.created_at instanceof Date) {
            formattedCity.created_at = city.created_at.toISOString();
          }
          
          if (city.updated_at instanceof Date) {
            formattedCity.updated_at = city.updated_at.toISOString();
          }
          
          return formattedCity;
        });
        break;
      case "users":
        const users = await prisma.user.findMany({
          // استخدام camelCase للحقول في prisma.user
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        });
        
        data = users.map(user => {
          // تحويل camelCase إلى snake_case للتوافق مع باقي البيانات
          const formattedUser: Record<string, unknown> = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            created_at: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
            updated_at: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt
          };
          
          return formattedUser;
        });
        break;
      default:
        return NextResponse.json(
          { message: "نوع البيانات غير صالح" },
          { status: 400 }
        );
    }
    
    // تحويل البيانات إلى تنسيق CSV
    const csvData = convertToCSV(data);
    
    // إرجاع البيانات
    return NextResponse.json(
      { 
        success: true, 
        csv: csvData, 
        count: data.length 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("خطأ في تصدير البيانات:", error);
    
    return NextResponse.json(
      { 
        message: "حدث خطأ أثناء تصدير البيانات", 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 