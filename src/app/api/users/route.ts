import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { UserRole } from "@/types";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// تعريف التحقق من البيانات للمستخدمين
const userSchema = z.object({
  username: z.string().min(3, { message: "اسم المستخدم يجب أن يكون أكثر من حرفين" }),
  email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صحيح" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }).optional(),
  role: z.enum([UserRole.ADMIN, UserRole.DATA_ENTRY, UserRole.ACCOUNTS], {
    message: "الدور يجب أن يكون واحداً من: admin, data_entry, accounts"
  }),
});

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

// الحصول على قائمة المستخدمين
export async function GET(request: Request) {
  try {
    // التحقق من صلاحيات المستخدم
    const { authorized, message } = await checkAdminPermission();
    if (!authorized) {
      return NextResponse.json(
        { message },
        { status: 403 }
      );
    }
    
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    
    const skip = (page - 1) * limit;
    
    // بناء شروط البحث
    const whereClause: {
      OR?: Array<{ [key: string]: { contains: string; mode: 'insensitive' } }>;
    } = {};
    
    if (search) {
      whereClause.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // الحصول على مجموع عدد المستخدمين
    const totalUsers = await prisma.user.count({ where: whereClause });
    
    // الحصول على المستخدمين
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    });
    
    // إعداد معلومات الصفحات
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      pageSize: limit,
      totalItems: totalUsers
    };
    
    return NextResponse.json({
      data: users,
      pagination
    }, { status: 200 });
  } catch (error) {
    console.error("خطأ في الحصول على المستخدمين:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء الحصول على المستخدمين" },
      { status: 500 }
    );
  }
}

// إضافة مستخدم جديد
export async function POST(request: Request) {
  try {
    // التحقق من صلاحيات المستخدم
    const { authorized, message } = await checkAdminPermission();
    if (!authorized) {
      return NextResponse.json(
        { message },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // التحقق من صحة البيانات
    const validationResult = userSchema.safeParse(body);
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
    
    // التحقق من عدم وجود مستخدم بنفس البريد الإلكتروني
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
    const hashedPassword = await bcrypt.hash(password || "123456", 10);
    
    // إنشاء مستخدم جديد
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        username,
        email,
        password: hashedPassword,
        role,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json(
      { 
        message: "تم إضافة المستخدم بنجاح",
        user 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("خطأ في إضافة مستخدم:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء إضافة المستخدم" },
      { status: 500 }
    );
  }
} 