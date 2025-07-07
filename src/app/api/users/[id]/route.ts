import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@/types";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// تعريف التحقق من البيانات لتحديث المستخدم
const updateUserSchema = z.object({
  username: z.string().min(3, { message: "اسم المستخدم يجب أن يكون أكثر من حرفين" }).optional(),
  email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صحيح" }).optional(),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }).optional(),
  role: z.enum([UserRole.ADMIN, UserRole.DATA_ENTRY, UserRole.ACCOUNTS], {
    message: "الدور يجب أن يكون واحداً من: admin, data_entry, accounts"
  }).optional(),
});

// نوع البيانات للتحديث
interface UpdateData {
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  updatedAt?: Date;
}

// دالة للتحقق من صلاحيات المستخدم
async function checkAdminPermission() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return { authorized: false, message: "يجب تسجيل الدخول أولاً", userId: "" };
  }
  
  if (session.user.role !== UserRole.ADMIN) {
    return { authorized: false, message: "غير مصرح لك بهذه العملية", userId: "" };
  }
  
  return { authorized: true, message: "", userId: session.user.id };
}

// الحصول على مستخدم محدد
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // التحقق من صلاحيات المستخدم
    const { authorized, message } = await checkAdminPermission();
    if (!authorized) {
      return NextResponse.json(
        { message },
        { status: 403 }
      );
    }

    const userId = params.id;

    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("خطأ في الحصول على المستخدم:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء الحصول على المستخدم" },
      { status: 500 }
    );
  }
}

// تحديث مستخدم
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // التحقق من صلاحيات المستخدم
    const { authorized, message, userId: currentUserId } = await checkAdminPermission();
    if (!authorized) {
      return NextResponse.json(
        { message },
        { status: 403 }
      );
    }

    const userId = params.id;
    const body = await request.json();

    // التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    // التحقق من صحة البيانات
    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        message: "البيانات المدخلة غير صالحة",
        errors: validationResult.error.errors 
      }, { status: 400 });
    }

    const {
      username,
      email,
      password,
      role,
    } = validationResult.data;

    // تحضير البيانات للتحديث
    const updateData: UpdateData = {};

    if (username) updateData.username = username;
    if (role) updateData.role = role;

    // التحقق من البريد الإلكتروني إذا تم تغييره
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      
      if (emailExists) {
        return NextResponse.json(
          { message: "البريد الإلكتروني مستخدم بالفعل" },
          { status: 409 }
        );
      }
      
      updateData.email = email;
    }

    // تشفير كلمة المرور إذا تم تقديمها
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // تحديث المستخدم
    updateData.updatedAt = new Date();
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "تم تحديث المستخدم بنجاح",
      user: updatedUser
    }, { status: 200 });
  } catch (error) {
    console.error("خطأ في تحديث المستخدم:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحديث المستخدم" },
      { status: 500 }
    );
  }
}

// حذف مستخدم
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // التحقق من صلاحيات المستخدم
    const { authorized, message, userId: currentUserId } = await checkAdminPermission();
    if (!authorized) {
      return NextResponse.json(
        { message },
        { status: 403 }
      );
    }

    const userId = params.id;

    // التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    // منع حذف المستخدم نفسه أو المستخدم الأساسي
    if (userId === "user_1") {
      return NextResponse.json(
        { message: "لا يمكن حذف المستخدم الأساسي" },
        { status: 403 }
      );
    }

    // منع حذف نفسه
    if (userId === currentUserId) {
      return NextResponse.json(
        { message: "لا يمكن حذف حسابك الشخصي" },
        { status: 403 }
      );
    }

    // حذف المستخدم
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: "تم حذف المستخدم بنجاح"
    }, { status: 200 });
  } catch (error) {
    console.error("خطأ في حذف المستخدم:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء حذف المستخدم" },
      { status: 500 }
    );
  }
} 