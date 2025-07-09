"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({
    message: "يرجى إدخال بريد إلكتروني صحيح",
  }),
  password: z.string().min(6, {
    message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
  }),
  remember: z.boolean(),
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      const success = await login(values.email, values.password);
      
      if (success) {
        toast.success("تم تسجيل الدخول بنجاح");
        router.push("/dashboard");
      } else {
        toast.error("فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.");
      }
    } catch (error) {
      let errorMessage = "حدث خطأ غير متوقع.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(`فشل تسجيل الدخول: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-background-pan [background-size:200%] text-white">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:forwards]">
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg">مرحبا بك في بيلا دونا</h1>
          <p className="mt-2 text-lg text-gray-200">
            سجل الدخول للمتابعة إلى لوحة التحكم
          </p>
        </div>

        <Card className="shadow-2xl bg-white/10 backdrop-blur-sm border-white/20 animate-fade-in-up [animation-delay:400ms] [animation-fill-mode:forwards]">
          <CardHeader>
            <CardTitle className="text-2xl text-white">تسجيل الدخول</CardTitle>
            <CardDescription className="text-gray-300">
              أدخل بياناتك للوصول إلى حسابك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="name@example.com" 
                          {...field} 
                          className="h-12 text-base bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:bg-white/30 focus:ring-white/50 transition-all duration-300"
                        />
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
                      <FormLabel className="text-white">كلمة المرور</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="h-12 text-base bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:bg-white/30 focus:ring-white/50 transition-all duration-300"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="remember"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                       <FormControl>
                        <Checkbox
                          id="remember"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel htmlFor="remember" className="cursor-pointer text-white">
                        تذكرني
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 text-base font-bold bg-white text-purple-600 hover:bg-gray-200 hover:scale-105 transition-all duration-300 shadow-lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      جاري التحقق...
                    </> 
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}