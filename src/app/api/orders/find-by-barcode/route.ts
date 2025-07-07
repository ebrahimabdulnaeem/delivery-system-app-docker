import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const barcode = searchParams.get("barcode");

    if (!barcode) {
      return NextResponse.json(
        { message: "الباركود مطلوب" },
        { status: 400 }
      );
    }

    // البحث عن الطلب بالباركود
    const order = await prisma.orders.findFirst({
      where: {
        barcode: barcode.trim(),
      },
      select: {
        id: true,
        barcode: true,
        recipient_name: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "لم يتم العثور على طلب بهذا الباركود" },
        { status: 404 }
      );
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("خطأ في البحث عن الطلب بالباركود:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء البحث عن الطلب" },
      { status: 500 }
    );
  }
} 