"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="container mx-auto flex flex-col items-center justify-center space-y-12 px-4 py-28 md:py-40 text-center">
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">نظام إدارة التوصيل</h1>
            <p className="mx-auto max-w-[700px] text-xl text-muted-foreground">
              منصة متكاملة لإدارة طلبات التوصيل، تتبع السائقين، وتحسين عمليات الشحن
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="min-w-[140px]">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="min-w-[140px]">
              <Link href="#features">اكتشف المزيد</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="container mx-auto space-y-16 py-20">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold">مميزات النظام</h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground">
              كل ما تحتاجه لإدارة عمليات التوصيل بكفاءة وفعالية
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3 rounded-lg border p-6 transition-all hover:shadow-md">
              <h3 className="text-lg font-medium">إدارة الطلبات</h3>
              <p className="text-muted-foreground">تسجيل وتتبع الطلبات بسهولة مع إمكانية البحث المتقدم</p>
            </div>
            <div className="space-y-3 rounded-lg border p-6 transition-all hover:shadow-md">
              <h3 className="text-lg font-medium">تتبع السائقين</h3>
              <p className="text-muted-foreground">إدارة السائقين والمناطق المخصصة لكل منهم</p>
            </div>
            <div className="space-y-3 rounded-lg border p-6 transition-all hover:shadow-md">
              <h3 className="text-lg font-medium">لوحة تحكم ذكية</h3>
              <p className="text-muted-foreground">رؤية شاملة لأداء النظام مع إحصائيات مفصلة</p>
            </div>
            <div className="space-y-3 rounded-lg border p-6 transition-all hover:shadow-md">
              <h3 className="text-lg font-medium">تقارير متقدمة</h3>
              <p className="text-muted-foreground">تحليل البيانات واستخراج التقارير بصيغ متعددة</p>
            </div>
            <div className="space-y-3 rounded-lg border p-6 transition-all hover:shadow-md">
              <h3 className="text-lg font-medium">متعدد المستخدمين</h3>
              <p className="text-muted-foreground">صلاحيات مختلفة لأدوار متعددة (مدير، مدخل بيانات، محاسب)</p>
            </div>
            <div className="space-y-3 rounded-lg border p-6 transition-all hover:shadow-md">
              <h3 className="text-lg font-medium">واجهة عربية</h3>
              <p className="text-muted-foreground">تصميم متكامل باللغة العربية مع تجربة مستخدم سلسة</p>
            </div>
          </div>
        </section>

        <section className="container mx-auto space-y-16 py-20">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold">تنبيهات</h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground">
              مثال بسيط لاستخدام التنبيهات الجديدة
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Button onClick={() => toast("مرحباً بك في نظام التوصيل!")}>
              تنبيه عادي
            </Button>
            
            <Button onClick={() => toast.success("تم إنشاء الطلب بنجاح")}>
              تنبيه نجاح
            </Button>
            
            <Button onClick={() => toast.error("حدث خطأ أثناء المعالجة")}>
              تنبيه خطأ
            </Button>
            
            <Button 
              onClick={() => 
                toast.info("جاري معالجة طلبك...", {
                  description: "سيتم إشعارك عند الانتهاء من المعالجة",
                  action: {
                    label: "إلغاء",
                    onClick: () => console.log("تم الإلغاء"),
                  },
                })
              }
            >
              تنبيه مع وصف وزر
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-8">
        <div className="container mx-auto flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} نظام إدارة التوصيل. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}
