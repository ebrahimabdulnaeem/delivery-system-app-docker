import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// تعريف التحقق من البيانات لتحديث السائقين
const updateDriverSchema = z.object({
  driver_name: z.string().min(2, {
    message: "اسم السائق يجب أن يكون أكثر من حرفين",
  }).optional(),
  driver_id_number: z.string().optional(),
  driver_phone: z.string().min(8, {
    message: "رقم الهاتف يجب أن يكون على الأقل 8 أرقام",
  }).optional(),
  assigned_areas: z.array(z.string()).optional(),
});

// الحصول على تفاصيل سائق محدد
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // البحث عن السائق في قاعدة البيانات
    const driver = await prisma.drivers.findUnique({
      where: { id: id },
      include: {
        orders: {
          select: {
            id: true,
            barcode: true,
            recipient_name: true,
            recipient_address: true,
            recipient_city: true,
            status: true,
            created_at: true,
            cod_amount: true
          }
        }
      }
    });

    // التحقق من وجود السائق
    if (!driver) {
      return NextResponse.json(
        { message: "السائق غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json(driver, { status: 200 });
  } catch (error) {
    console.error("خطأ في الحصول على تفاصيل السائق:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء الحصول على تفاصيل السائق" },
      { status: 500 }
    );
  }
}

// تحديث سائق محدد
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // التحقق أولاً من وجود السائق
    const existingDriver = await prisma.drivers.findUnique({
      where: { id: id }
    });

    if (!existingDriver) {
      return NextResponse.json(
        { message: "السائق غير موجود" },
        { status: 404 }
      );
    }

    // التحقق من صحة البيانات
    const validationResult = updateDriverSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        message: "البيانات المدخلة غير صالحة",
        errors: validationResult.error.errors 
      }, { status: 400 });
    }

    const updateData = validationResult.data;

    // إذا كان هناك تحديث لرقم الهاتف، تأكد من أنه فريد
    if (updateData.driver_phone && updateData.driver_phone !== existingDriver.driver_phone) {
      const phoneExists = await prisma.drivers.findFirst({
        where: { 
          driver_phone: updateData.driver_phone,
          id: { not: id }
        }
      });

      if (phoneExists) {
        return NextResponse.json(
          { message: "رقم الهاتف مستخدم بالفعل" },
          { status: 409 }
        );
      }
    }

    // تحديث السائق
    const updatedDriver = await prisma.drivers.update({
      where: { id: id },
      data: {
        ...updateData,
        updated_at: new Date()
      },
      include: {
        orders: {
          select: {
            id: true,
            barcode: true,
            recipient_name: true,
            recipient_address: true,
            recipient_city: true,
            status: true,
            created_at: true,
            cod_amount: true
          }
        }
      }
    });

    return NextResponse.json({
      message: "تم تحديث بيانات السائق بنجاح",
      driver: updatedDriver
    }, { status: 200 });
  } catch (error) {
    console.error("خطأ في تحديث السائق:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحديث بيانات السائق" },
      { status: 500 }
    );
  }
}

// حذف سائق محدد
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // التحقق من وجود السائق
    const existingDriver = await prisma.drivers.findUnique({
      where: { id: id },
      include: {
        orders: true
      }
    });

    if (!existingDriver) {
      return NextResponse.json(
        { message: "السائق غير موجود" },
        { status: 404 }
      );
    }

    // التحقق مما إذا كان السائق لديه طلبات مرتبطة به
    if (existingDriver.orders && existingDriver.orders.length > 0) {
      return NextResponse.json(
        { 
          message: "لا يمكن حذف السائق لأنه مرتبط بطلبات",
          ordersCount: existingDriver.orders.length
        },
        { status: 400 }
      );
    }

    // حذف السائق
    await prisma.drivers.delete({
      where: { id: id }
    });

    return NextResponse.json({
      message: "تم حذف السائق بنجاح"
    }, { status: 200 });
  } catch (error) {
    console.error("خطأ في حذف السائق:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء حذف السائق" },
      { status: 500 }
    );
  }
} 