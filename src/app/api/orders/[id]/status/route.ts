import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { OrderStatus } from "@/types";

// مخطط التحقق من صحة تحديث الحالة
const updateStatusSchema = z.object({
  status: z.enum([
    'entered',
    'assigned',
    'out_for_delivery',
    'delivered',
    'partial_return',
    'full_return'
  ] as [OrderStatus, ...OrderStatus[]]),
});

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
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

    // استخراج بيانات التحديث
    const body = await request.json();
    
    // التحقق من صحة البيانات
    const validationResult = updateStatusSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "حالة الطلب غير صالحة",
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { status } = validationResult.data;

    // تحديث حالة الطلب
    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: { 
        status: status,
        updated_at: new Date()
      }
    });

    // إرجاع الطلب المحدث
    return NextResponse.json({
      message: "تم تحديث حالة الطلب بنجاح",
      data: updatedOrder
    });
  } catch (error) {
    console.error("خطأ في تحديث حالة الطلب:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث حالة الطلب" },
      { status: 500 }
    );
  }
} 