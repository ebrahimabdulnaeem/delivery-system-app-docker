import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// التحقق من وجود المستخدم وإرجاع معرفه
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { message: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }
    
    console.log("البحث عن المستخدم بالمعرف:", id);
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    });
    
    console.log("نتيجة البحث عن المستخدم:", user);
    
    if (!user) {
      return NextResponse.json(
        { exists: false, message: "المستخدم غير موجود" },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { exists: true, userId: user.id, message: "تم العثور على المستخدم" },
      { status: 200 }
    );
  } catch (error) {
    console.error("خطأ في التحقق من المستخدم:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء التحقق من المستخدم" },
      { status: 500 }
    );
  }
} 