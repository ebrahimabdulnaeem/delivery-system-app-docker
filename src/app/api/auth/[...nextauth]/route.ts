import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

// إنشاء المعالج باستخدام خيارات المصادقة من ملف auth.ts
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };