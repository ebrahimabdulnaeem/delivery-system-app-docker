import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";

// الحصول على الطلبات المرتبطة بشيت المندوب
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // التحقق من جلسة المستخدم
    const session = await getServerSession(authOptions as any) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "غير مصرح لك بالوصول" },
        { status: 401 }
      );
    }

    const sheetId = params.id;

    // التحقق من وجود الشيت
    const sheet = await prisma.delegate_sheets.findUnique({
      where: { id: sheetId },
    });

    if (!sheet) {
      return NextResponse.json(
        { message: "لم يتم العثور على الشيت" },
        { status: 404 }
      );
    }

    // جلب الطلبات المرتبطة بالشيت
    const sheetOrders = await prisma.delegate_sheet_orders.findMany({
      where: { sheet_id: sheetId },
      include: {
        orders: true,
      },
    });

    // استخراج بيانات الطلبات
    const orders = sheetOrders.map(item => item.orders);

    return NextResponse.json({
      message: "تم جلب الطلبات بنجاح",
      data: orders,
    });
  } catch (error) {
    console.error("خطأ في جلب الطلبات المرتبطة بالشيت:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب الطلبات المرتبطة بالشيت" },
      { status: 500 }
    );
  }
}
