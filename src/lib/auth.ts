import { User } from "@/types";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

// تسجيل الدخول
export async function login(email: string, password: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return null;

    // إخفاء كلمة المرور من الكائن المرجع
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    
    return userWithoutPassword as User;
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

// تسجيل الخروج
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("delivery_current_user");
  }
}

// جلب المستخدم الحالي
export async function getCurrentUserFromDb(id: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    // إخفاء كلمة المرور من الكائن المرجع
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    
    return userWithoutPassword as User;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

// جلب المستخدم الحالي من التخزين المحلي
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  
  const userJson = localStorage.getItem("delivery_current_user");
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
}

// التحقق من تسجيل الدخول
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

// تسجيل مستخدم جديد (للمدير فقط)
export async function registerUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User | null> {
  try {
    // التحقق من وجود مستخدم بنفس البريد الإلكتروني
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error("البريد الإلكتروني مستخدم بالفعل");
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // إنشاء معرف فريد
    const id = `user_${Date.now()}`;

    // إنشاء المستخدم الجديد
    const newUser = await prisma.user.create({
      data: {
        id,
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
      },
    });

    // إخفاء كلمة المرور من الكائن المرجع
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;
    
    return userWithoutPassword as User;
  } catch (error) {
    console.error("Register user error:", error);
    return null;
  }
}

// جلب جميع المستخدمين (للمدير فقط)
export async function getAllUsers(): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        password: false,
      },
    });
    
    return users as User[];
  } catch (error) {
    console.error("Get all users error:", error);
    return [];
  }
}

// تعريف أنواع للمستخدم والجلسة
interface CustomSession extends Session {
  user: {
    id: string;
    role: string;
  } & Session['user'];
}

// إعدادات المصادقة NextAuth
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("بيانات الاعتماد مفقودة");
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            throw new Error("لم يتم العثور على المستخدم");
          }

          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          if (!passwordMatch) {
            throw new Error("كلمة المرور غير صحيحة");
          }

          // التحقق من أن الحساب مفعل
          if (user.role === "pending") {
            throw new Error("حسابك قيد المراجعة. يرجى الانتظار حتى يتم تفعيله من قبل المسؤول.");
          }

          return {
            id: user.id,
            name: user.username,
            email: user.email,
            role: user.role
          };
        } catch (error) {
          console.error("خطأ في المصادقة:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: User | undefined }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: CustomSession; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 