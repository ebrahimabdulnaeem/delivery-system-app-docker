import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// تعريف التحقق من البيانات للمدن
const citySchema = z.object({
  name: z.string().min(2, {
    message: "اسم المدينة يجب أن يكون أكثر من حرفين",
  }),
});

// الحصول على قائمة المدن
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    
    const cities = await prisma.cities.findMany({
      where: {
        name: { contains: search, mode: 'insensitive' }
      },
      orderBy: {
        name: "asc"
      }
    });

    return NextResponse.json({ data: cities }, { status: 200 });
  } catch (error) {
    console.error("خطأ في الحصول على المدن:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء الحصول على المدن" },
      { status: 500 }
    );
  }
}

// إضافة مدينة جديدة
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // التحقق من صحة البيانات
    const validationResult = citySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        message: "البيانات المدخلة غير صالحة",
        errors: validationResult.error.errors 
      }, { status: 400 });
    }
    
    const { name } = validationResult.data;
    
    // التحقق من عدم وجود مدينة بنفس الاسم
    const existingCity = await prisma.cities.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });
    
    if (existingCity) {
      return NextResponse.json(
        { message: "المدينة موجودة بالفعل" },
        { status: 409 }
      );
    }
    
    // إنشاء معرف جديد للمدينة بصيغة city-XXX
    const citiesCount = await prisma.cities.count();
    const cityId = `city-${String(citiesCount + 1).padStart(3, '0')}`;

    // إنشاء مدينة جديدة
    const city = await prisma.cities.create({
      data: {
        id: cityId,
        name,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    return NextResponse.json(
      { 
        message: "تم إضافة المدينة بنجاح",
        city 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("خطأ في إضافة مدينة:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء إضافة المدينة" },
      { status: 500 }
    );
  }
} 