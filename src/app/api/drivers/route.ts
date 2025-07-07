import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// تعريف التحقق من البيانات للسائقين
const driverSchema = z.object({
  driver_name: z.string().min(2, {
    message: "اسم السائق يجب أن يكون أكثر من حرفين",
  }),
  driver_id_number: z.string().optional(),
  driver_phone: z.string().min(8, {
    message: "رقم الهاتف يجب أن يكون على الأقل 8 أرقام",
  }),
  assigned_areas: z.array(z.string()).optional(),
});

// الحصول على قائمة السائقين
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const all = searchParams.get("all") === "true";
    
    const skip = (page - 1) * limit;
    
    // بناء شروط البحث
    const whereClause: Record<string, unknown> = {};
    
    if (search) {
      whereClause.OR = [
        { driver_name: { contains: search, mode: 'insensitive' } },
        { driver_phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // الحصول على مجموع عدد المناديب
    const totalDrivers = await prisma.drivers.count({ where: whereClause });
    
    // الحصول على المناديب
    const drivers = await prisma.drivers.findMany({
      where: whereClause,
      orderBy: {
        driver_name: "asc"
      },
      skip: all ? 0 : skip,
      take: all ? undefined : limit
    });
    
    // إعداد معلومات الصفحات
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalDrivers / limit),
      pageSize: all ? drivers.length : limit,
      totalItems: totalDrivers
    };
    
    return NextResponse.json({
      data: drivers,
      pagination
    }, { status: 200 });
  } catch (error) {
    console.error("خطأ في الحصول على المناديب:", error);
    return NextResponse.json(
      { 
        error: "حدث خطأ أثناء الحصول على قائمة المناديب" 
      }, 
      { status: 500 }
    );
  }
}

// إضافة سائق جديد
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // التحقق من صحة البيانات
    const validationResult = driverSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        message: "البيانات المدخلة غير صالحة",
        errors: validationResult.error.errors 
      }, { status: 400 });
    }
    
    const { driver_name, driver_phone, driver_id_number, assigned_areas } = validationResult.data;
    
    // التحقق من عدم وجود سائق بنفس رقم الهاتف
    const existingDriver = await prisma.drivers.findFirst({
      where: { driver_phone }
    });
    
    if (existingDriver) {
      return NextResponse.json(
        { message: "رقم الهاتف مستخدم بالفعل" },
        { status: 409 }
      );
    }
    
    // إنشاء سائق جديد
    const driver = await prisma.drivers.create({
      data: {
        id: uuidv4(),
        driver_name,
        driver_id_number,
        driver_phone,
        assigned_areas: assigned_areas ? assigned_areas : undefined,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    return NextResponse.json(
      { 
        message: "تم إضافة السائق بنجاح",
        driver 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("خطأ في إضافة سائق:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء إضافة السائق" },
      { status: 500 }
    );
  }
} 