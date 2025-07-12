"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// تعريف التحقق من البيانات
const formSchema = z.object({
  username: z.string().min(3, { message: "اسم المستخدم يجب أن يكون أكثر من حرفين" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
  role: z.enum([UserRole.ADMIN, UserRole.DATA_ENTRY, UserRole.ACCOUNTS, UserRole.INVENTORY, UserRole.ORDER_SEARCH], {
    message: "يرجى اختيار دور للمستخدم"
  }),
});

export default function NewUserPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      role: UserRole.DATA_ENTRY,
    },
  });

  // التأكد من صلاحيات المستخدم
  if (user?.role !== UserRole.ADMIN) {
    router.push("/dashboard");
    return null;
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          email: `${values.username}@example.com` // Generate a dummy email
        }),
      });
      
      if (response.ok) {
        toast.success("تم إضافة المستخدم بنجاح");
        router.push("/dashboard/users");
      } else {
        const error = await response.json();
        toast.error(error.message || "حدث خطأ أثناء إضافة المستخدم");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("حدث خطأ أثناء إضافة المستخدم");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ترجمة الدور إلى العربية
  const getRoleInArabic = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "مدير";
      case UserRole.DATA_ENTRY:
        return "مدخل بيانات";
      case UserRole.ACCOUNTS:
        return "محاسب";
      case UserRole.INVENTORY:
        return "مخزن";
      case UserRole.ORDER_SEARCH:
        return "البحث عن أوردر";
      default:
        return role;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إضافة مستخدم جديد</h1>
            <p className="text-muted-foreground mt-2">إنشاء حساب مستخدم جديد في النظام</p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard/users")}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            العودة للقائمة
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>معلومات المستخدم</CardTitle>
            <CardDescription>أدخل بيانات المستخدم الجديد</CardDescription>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المستخدم</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="أدخل اسم المستخدم" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                

                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="أدخل كلمة المرور" type="password" />
                      </FormControl>
                      <FormDescription>
                        يجب أن تكون كلمة المرور 6 أحرف على الأقل
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>دور المستخدم</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر دور المستخدم" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(UserRole).map((role) => (
                            <SelectItem key={role} value={role}>
                              {getRoleInArabic(role)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        يحدد الدور صلاحيات المستخدم في النظام
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              
              <CardFooter className="border-t pt-6 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/dashboard/users")}
                  type="button"
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "جاري الإضافة..." : "إضافة المستخدم"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
} 