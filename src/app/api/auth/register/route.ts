import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { UserRole } from "@/types";

// تعريف التحقق من البيانات باستخدام zod
const registerSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(request: Request) {
  try {
    // استخراج البيانات من الطلب
    const body = await request.json();

    // التحقق من صحة البيانات
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        message: "البيانات المدخلة غير صالحة",
        errors: validationResult.error.errors 
      }, { status: 400 });
    }

    const { username, email, password } = validationResult.data;

    // التحقق من وجود المستخدم بالفعل
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "البريد الإلكتروني مستخدم بالفعل" },
        { status: 409 }
      );
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء المستخدم الجديد
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        username,
        email,
        password: hashedPassword,
        role: UserRole.DATA_ENTRY, // تعيين الدور الافتراضي
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // إنشاء كائن للإستجابة بدون كلمة المرور
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json(
      { 
        message: "تم إنشاء الحساب بنجاح",
        user: userResponse 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("خطأ في التسجيل:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء إنشاء الحساب" },
      { status: 500 }
    );
  }
} 