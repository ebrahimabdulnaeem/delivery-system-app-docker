"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// تعريف التحقق من البيانات لتحديث المستخدم
const formSchema = z.object({
  username: z.string().min(3, { message: "اسم المستخدم يجب أن يكون أكثر من حرفين" }),
  email: z.string().email({ message: "يرجى إدخال بريد إلكتروني صحيح" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }).optional().or(z.literal('')),
  role: z.enum([UserRole.ADMIN, UserRole.DATA_ENTRY, UserRole.ACCOUNTS], {
    message: "يرجى اختيار دور للمستخدم"
  }),
});

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: UserRole.DATA_ENTRY,
    },
  });

  // التأكد من صلاحيات المستخدم
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // جلب بيانات المستخدم
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // تعيين القيم الافتراضية للنموذج
          form.reset({
            username: data.username,
            email: data.email,
            password: "",
            role: data.role as UserRole,
          });
        } else {
          toast.error("حدث خطأ في جلب بيانات المستخدم");
          router.push("/dashboard/users");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("حدث خطأ أثناء جلب بيانات المستخدم");
        router.push("/dashboard/users");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, router, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // إزالة كلمة المرور إذا كانت فارغة
      const submitData = { ...values };
      if (!submitData.password) {
        delete submitData.password;
      }
      
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });
      
      if (response.ok) {
        toast.success("تم تحديث بيانات المستخدم بنجاح");
        router.push("/dashboard/users");
      } else {
        const error = await response.json();
        toast.error(error.message || "حدث خطأ أثناء تحديث بيانات المستخدم");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("حدث خطأ أثناء تحديث بيانات المستخدم");
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
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin h-8 w-8 mb-4 text-primary" />
          <p className="text-lg">جاري تحميل بيانات المستخدم...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">تعديل معلومات المستخدم</h1>
            <p className="text-muted-foreground mt-2">تحديث بيانات المستخدم وصلاحياته</p>
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
            <CardDescription>تعديل بيانات المستخدم الحالية</CardDescription>
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="example@example.com" type="email" />
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
                        <Input {...field} placeholder="أدخل كلمة المرور الجديدة" type="password" />
                      </FormControl>
                      <FormDescription>
                        اترك الحقل فارغاً إذا كنت لا تريد تغيير كلمة المرور
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
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/dashboard/users")}
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : "حفظ التغييرات"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
} 