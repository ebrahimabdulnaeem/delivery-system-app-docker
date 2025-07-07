import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Función para verificar la autenticación
async function checkAuthentication() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return { authenticated: false, message: "يجب تسجيل الدخول أولاً" };
  }
  
  return { authenticated: true, message: "", userId: session.user.id };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const barcode = url.searchParams.get("barcode");

    if (!barcode) {
      return NextResponse.json(
        { error: "معلمة الباركود مطلوبة" },
        { status: 400 }
      );
    }

    const order = await prisma.orders.findFirst({
      where: {
        barcode: {
          equals: barcode,
          mode: 'insensitive'
        }
      },
      include: {
        drivers: {
          select: {
            id: true,
            driver_name: true,
            driver_phone: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "لم يتم العثور على طلب بهذا الباركود" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "تم العثور على الطلب بنجاح",
      data: order
    });
  } catch (error) {
    console.error("خطأ في البحث عن الطلب بالباركود:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء البحث عن الطلب" },
      { status: 500 }
    );
  }
} 