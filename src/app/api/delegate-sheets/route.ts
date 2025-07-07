import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// إنشاء شيت مندوب جديد
export async function POST(request: NextRequest) {
  try {
    // التحقق من المستخدم
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "غير مصرح لك بالوصول" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const data = await request.json();
    
    // التحقق من البيانات المطلوبة
    if (!data.driverId || !data.orders || !data.sheetBarcode || !data.totalAmount) {
      return NextResponse.json(
        { message: "البيانات غير مكتملة" },
        { status: 400 }
      );
    }

    // إنشاء معرف فريد للشيت
    const sheetId = uuidv4();
    
    // إنشاء شيت المندوب في قاعدة البيانات
    const delegateSheet = await prisma.delegate_sheets.create({
      data: {
        id: sheetId,
        sheet_barcode: data.sheetBarcode,
        driver_id: data.driverId,
        total_amount: data.totalAmount,
        order_count: data.orders.length,
        created_by: userId,
      },
    });

    // إضافة البوالص إلى جدول تفاصيل الشيت
    const sheetOrdersData = data.orders.map((orderId: string) => ({
      id: uuidv4(),
      sheet_id: sheetId,
      order_id: orderId,
    }));

    await prisma.delegate_sheet_orders.createMany({
      data: sheetOrdersData,
    });

    return NextResponse.json(
      { 
        message: "تم إنشاء شيت المندوب بنجاح", 
        data: delegateSheet 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("خطأ في إنشاء شيت المندوب:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء إنشاء شيت المندوب" },
      { status: 500 }
    );
  }
}

// الحصول على قائمة شيتات المندوب
export async function GET(request: NextRequest) {
  try {
    // التحقق من المستخدم
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "غير مصرح لك بالوصول" },
        { status: 401 }
      );
    }

    // استخراج المعايير من عنوان URL
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");
    const barcode = searchParams.get("barcode");
    const date = searchParams.get("date");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // بناء معايير البحث
    const where: any = {};
    
    // البحث حسب المندوب
    if (driverId) {
      where.driver_id = driverId;
    }
    
    // البحث حسب الباركود
    if (barcode) {
      where.sheet_barcode = {
        contains: barcode,
      };
    }
    
    // البحث حسب التاريخ
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.created_at = {
        gte: searchDate,
        lt: nextDay,
      };
    }

    // الحصول على إجمالي عدد السجلات
    const totalCount = await prisma.delegate_sheets.count({ where });

    // الحصول على شيتات المندوب مع معلومات المندوب
    const delegateSheets = await prisma.delegate_sheets.findMany({
      where,
      include: {
        drivers: true,
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      data: delegateSheets,
      meta: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("خطأ في جلب شيتات المندوب:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب شيتات المندوب" },
      { status: 500 }
    );
  }
}
