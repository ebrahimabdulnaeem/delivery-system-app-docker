import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";

// الحصول على تفاصيل شيت المندوب
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
      include: {
        drivers: true,
      },
    });

    if (!sheet) {
      return NextResponse.json(
        { message: "لم يتم العثور على الشيت" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "تم جلب بيانات الشيت بنجاح",
      data: sheet,
    });
  } catch (error) {
    console.error("خطأ في جلب بيانات الشيت:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب بيانات الشيت" },
      { status: 500 }
    );
  }
}
