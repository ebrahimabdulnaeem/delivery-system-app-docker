import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// مخطط التحقق من صحة تعيين السائق
const assignDriverSchema = z.object({
  driver_id: z.string().nullable(),
});

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // استخراج المعلمات مع await
    const params = await context.params;
    const orderId = params.id;
    
    if (!orderId) {
      return NextResponse.json(
        { error: "معرف الطلب مطلوب" },
        { status: 400 }
      );
    }

    // التحقق من وجود الطلب
    const order = await prisma.orders.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json(
        { error: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    // استخراج بيانات الطلب
    const body = await request.json();
    
    // التحقق من صحة البيانات
    const validationResult = assignDriverSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "البيانات المرسلة غير صالحة",
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { driver_id } = validationResult.data;

    // إذا كان هناك معرف للسائق، نتحقق من وجوده
    if (driver_id) {
      const driver = await prisma.drivers.findUnique({
        where: { id: driver_id }
      });

      if (!driver) {
        return NextResponse.json(
          { error: "المندوب غير موجود" },
          { status: 404 }
        );
      }
    }

    // تحديث الطلب بمعرف السائق
    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: { 
        driver_id: driver_id,
        updated_at: new Date()
      },
      include: {
        drivers: true
      }
    });

    // إرجاع الطلب المحدث
    return NextResponse.json({
      message: driver_id 
        ? "تم تعيين المندوب للطلب بنجاح" 
        : "تم إلغاء تعيين المندوب من الطلب",
      data: updatedOrder
    });
  } catch (error) {
    console.error("خطأ في تعيين المندوب للطلب:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تعيين المندوب للطلب" },
      { status: 500 }
    );
  }
} 