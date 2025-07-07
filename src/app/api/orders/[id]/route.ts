import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { OrderStatus } from "@/types";

// تعريف التحقق من البيانات لتحديث الطلبات
const updateOrderSchema = z.object({
  barcode: z.string().min(4, { message: "الباركود يجب أن يكون أكثر من 3 أحرف" }).optional(),
  recipient_name: z.string().min(2, { message: "اسم المستلم يجب أن يكون أكثر من حرفين" }).optional(),
  recipient_phone1: z.string().min(8, { message: "رقم الهاتف يجب أن يكون على الأقل 8 أرقام" }).optional(),
  recipient_phone2: z.string().optional(),
  recipient_address: z.string().min(5, { message: "العنوان يجب أن يكون أكثر من 4 أحرف" }).optional(),
  recipient_city: z.string().min(2, { message: "المدينة يجب أن تكون أكثر من حرفين" }).optional(),
  cod_amount: z.number().positive({ message: "المبلغ يجب أن يكون أكبر من صفر" }).optional(),
  order_description: z.string().optional(),
  special_instructions: z.string().optional(),
  sender_reference: z.string().optional(),
  number_of_pieces: z.number().int().positive().optional(),
  driver_id: z.string().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
});

// الحصول على تفاصيل طلب محدد
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // البحث عن الطلب في قاعدة البيانات
    const order = await prisma.orders.findUnique({
      where: { id: id },
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
      }
    });

    // التحقق من وجود الطلب
    if (!order) {
      return NextResponse.json(
        { message: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("خطأ في الحصول على تفاصيل الطلب:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء الحصول على تفاصيل الطلب" },
      { status: 500 }
    );
  }
}

// تحديث طلب محدد
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // التحقق أولاً من وجود الطلب
    const existingOrder = await prisma.orders.findUnique({
      where: { id: id }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { message: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    // التحقق من صحة البيانات
    const validationResult = updateOrderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        message: "البيانات المدخلة غير صالحة",
        errors: validationResult.error.errors 
      }, { status: 400 });
    }

    const updateData = validationResult.data;

    // إذا كان هناك تحديث للباركود، تأكد من أنه فريد
    if (updateData.barcode && updateData.barcode !== existingOrder.barcode) {
      const barcodeExists = await prisma.orders.findUnique({
        where: { barcode: updateData.barcode }
      });

      if (barcodeExists) {
        return NextResponse.json(
          { message: "الباركود مستخدم بالفعل" },
          { status: 409 }
        );
      }
    }

    // تحديث الطلب
    const updatedOrder = await prisma.orders.update({
      where: { id: id },
      data: {
        ...updateData,
        updated_at: new Date()
      },
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
      }
    });

    return NextResponse.json({
      message: "تم تحديث الطلب بنجاح",
      order: updatedOrder
    }, { status: 200 });
  } catch (error) {
    console.error("خطأ في تحديث الطلب:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحديث الطلب" },
      { status: 500 }
    );
  }
}

// حذف طلب محدد
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // التحقق من وجود الطلب
    const existingOrder = await prisma.orders.findUnique({
      where: { id: id }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { message: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    // حذف الطلب
    await prisma.orders.delete({
      where: { id: id }
    });

    return NextResponse.json({
      message: "تم حذف الطلب بنجاح"
    }, { status: 200 });
  } catch (error) {
    console.error("خطأ في حذف الطلب:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء حذف الطلب" },
      { status: 500 }
    );
  }
} 