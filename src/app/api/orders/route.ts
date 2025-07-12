import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { OrderStatus } from "@/types";

// تعريف التحقق من البيانات للطلبات
const orderSchema = z.object({
  barcode: z.string().min(1, { message: "الباركود مطلوب" }),
  recipient_name: z.string().min(2, { message: "اسم المستلم يجب أن يكون أكثر من حرفين" }),
  recipient_phone1: z.string().min(8, { message: "رقم الهاتف يجب أن يكون على الأقل 8 أرقام" }),
  recipient_phone2: z.string().optional(),
  recipient_address: z.string().min(5, { message: "العنوان يجب أن يكون أكثر من 4 أحرف" }),
  recipient_city: z.string().min(2, { message: "المدينة يجب أن تكون أكثر من حرفين" }),
  cod_amount: z.number().min(0, { message: "المبلغ لا يمكن أن يكون سالبًا" }),
  order_description: z.string().optional(),
  special_instructions: z.string().optional(),
  sender_reference: z.string().optional(),
  number_of_pieces: z.number().int().positive().optional(),
  driver_id: z.string().optional(),
  order_date: z.string().optional(),
});

// الحصول على قائمة الطلبات
export async function GET(request: Request) {
  try {
    console.log("بدء استرجاع الطلبات من API");
    
    const url = new URL(request.url);
    const barcode = url.searchParams.get("barcode") || "";
    const recipientName = url.searchParams.get("name") || "";
    const status = url.searchParams.get("status") || undefined;
    const city = url.searchParams.get("city") || undefined;
    const driverId = url.searchParams.get("driverId") || undefined;
    const date = url.searchParams.get("date") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const all = url.searchParams.get("all") === "true";
    
    console.log("معلمات البحث:", { 
      barcode, 
      recipientName,
      status, 
      city,
      driverId, 
      date,
      page, 
      limit, 
      all,
      url: request.url 
    });
    
    const skip = (page - 1) * limit;
    
    // بناء شروط البحث
    const whereClause: Record<string, unknown> = {};
    
    // إضافة فلتر التاريخ إذا تم تحديده (بغض النظر عن قيمة all)
    if (date) {
      // استخدام أمر PostgreSQL للبحث عن الطلبات في تاريخ معين
      // هذا يتطابق مع العمود order_date إذا كان من نفس اليوم بغض النظر عن الوقت
      whereClause.order_date = {
        gte: new Date(`${date}T00:00:00Z`),
        lt: new Date(`${date}T23:59:59Z`),
      };
    }
    
    // تطبيق الفلاتر الإضافية فقط إذا كانت المعلمات موجودة وليس 'all'
    if (!all) {
      if (barcode) {
        // البحث بالباركود فقط بدلاً من البحث في جميع الحقول
        whereClause.barcode = { contains: barcode, mode: 'insensitive' };
      }
      
      if (recipientName) {
        // البحث باسم المستلم
        whereClause.recipient_name = { contains: recipientName, mode: 'insensitive' };
      }
      
      if (status) {
        whereClause.status = status;
      }
      
      if (city) {
        whereClause.recipient_city = city;
      }
      
      if (driverId) {
        whereClause.driver_id = driverId;
      }
    }
    
    console.log("شروط البحث:", JSON.stringify(whereClause));
    
    // الحصول على مجموع عدد الطلبات
    const totalOrders = await prisma.orders.count({ where: whereClause });
    console.log("إجمالي عدد الطلبات المطابقة:", totalOrders);
    
    // الحصول على الطلبات مع معلومات السائق والمنشئ
    const orders = await prisma.orders.findMany({
      where: whereClause,
      include: {
        drivers: true,
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          }
        }
      },
      orderBy: {
        created_at: "desc"
      },
      skip: all ? 0 : skip,
      take: all ? 1000 : limit // إذا كان 'all'، نجلب حتى 1000 طلب
    });
    
    console.log(`تم استرجاع ${orders.length} طلب بنجاح`);
    
    // إعداد معلومات الصفحات
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      pageSize: all ? orders.length : limit,
      totalItems: totalOrders
    };
    
    return NextResponse.json({
      data: orders,
      pagination
    }, { status: 200 });
  } catch (error) {
    console.error("خطأ في الحصول على الطلبات:", error);
    return NextResponse.json(
      { 
        message: "حدث خطأ أثناء الحصول على الطلبات",
        error: error instanceof Error ? error.message : "خطأ غير معروف" 
      },
      { status: 500 }
    );
  }
}

// إضافة طلب جديد
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // التحقق من صحة البيانات
    const validationResult = orderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        message: "البيانات المدخلة غير صالحة",
        errors: validationResult.error.errors 
      }, { status: 400 });
    }
    
    const {
      barcode,
      recipient_name,
      recipient_phone1,
      recipient_phone2,
      recipient_address,
      recipient_city,
      cod_amount,
      order_description,
      special_instructions,
      sender_reference,
      number_of_pieces,
      driver_id,
      order_date
    } = validationResult.data;
    
    console.log("التاريخ المستلم من الواجهة:", order_date);
    console.log("نوع التاريخ المستلم:", typeof order_date);
    
    // التحقق من صحة معرف المستخدم
    const userId = body.userId;
    console.log("معرف المستخدم المستلم:", userId);
    
    if (!userId) {
      return NextResponse.json(
        { message: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }
    
    // التحقق من وجود المستخدم في قاعدة البيانات
    try {
      const userExists = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      console.log("نتيجة البحث عن المستخدم:", userExists);
      
      if (!userExists) {
        return NextResponse.json(
          { message: "المستخدم غير موجود في قاعدة البيانات" },
          { status: 400 }
        );
      }
    } catch (userError) {
      console.error("خطأ في التحقق من المستخدم:", userError);
      return NextResponse.json(
        { message: "حدث خطأ أثناء التحقق من وجود المستخدم" },
        { status: 500 }
      );
    }
    
    // التحقق من عدم وجود طلب بنفس الباركود
    const existingOrder = await prisma.orders.findUnique({
      where: { barcode }
    });
    
    if (existingOrder) {
      return NextResponse.json(
        { message: "الباركود مستخدم بالفعل" },
        { status: 409 }
      );
    }
    
    // إنشاء طلب جديد
    try {
      console.log("محاولة إنشاء طلب جديد بالبيانات التالية:", {
        barcode,
        recipient_name,
        recipient_phone1,
        recipient_city,
        cod_amount,
        created_by: userId
      });

      // استخدام تاريخ الطلب مباشرة إذا تم تحديده أو استخدام تاريخ اليوم الحالي
      // تخزين التاريخ فقط بدون الوقت
      const dateString = order_date || new Date().toISOString().split('T')[0];
      
      console.log("سيتم حفظ التاريخ:", dateString);

      // استخدام أمر SQL مباشر لضمان حفظ التاريخ بشكل صحيح
      // إنشاء الطلب أولا
      const order = await prisma.$queryRaw`
        INSERT INTO orders (
          id, barcode, order_date, recipient_name, recipient_phone1, recipient_phone2,
          recipient_address, recipient_city, cod_amount, order_description,
          special_instructions, sender_reference, number_of_pieces,
          status, driver_id, created_by, created_at, updated_at
        ) VALUES (
          ${uuidv4()}, ${barcode}, ${dateString}::date, ${recipient_name}, 
          ${recipient_phone1}, ${recipient_phone2 || null}, ${recipient_address}, 
          ${recipient_city}, ${cod_amount}, ${order_description || null},
          ${special_instructions || null}, ${sender_reference || null}, ${number_of_pieces || 1},
          ${OrderStatus.ENTERED}, ${driver_id || null}, ${userId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING *;
      `;
      
      console.log("تم إنشاء الطلب بنجاح:", order);
    
    return NextResponse.json(
      { 
        message: "تم إضافة الطلب بنجاح",
        order 
      },
      { status: 201 }
    );
    } catch (createError) {
      console.error("خطأ في إنشاء الطلب:", createError);
      return NextResponse.json(
        { message: "حدث خطأ أثناء إنشاء الطلب: " + (createError instanceof Error ? createError.message : "خطأ غير معروف") },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("خطأ في إضافة طلب:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء إضافة الطلب: " + (error instanceof Error ? error.message : "خطأ غير معروف") },
      { status: 500 }
    );
  }
} 