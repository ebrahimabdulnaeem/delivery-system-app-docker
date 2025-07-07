"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search, UserPlus, Phone, UserCheck, Edit, Eye } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import Link from "next/link";
import BarcodeScannerButton from "@/components/BarcodeScannerButton";

// تعريف نموذج التحقق
const formSchema = z.object({
  driver_name: z.string().min(2, {
    message: "اسم السائق يجب أن يكون أكثر من حرفين",
  }),
  driver_id_number: z.string().optional(),
  driver_phone: z.string().min(8, {
    message: "رقم الهاتف يجب أن يكون على الأقل 8 أرقام",
  }),
  assigned_areas: z.string().optional(),
});

type Driver = {
  id: string;
  driver_name: string;
  driver_id_number?: string | null;
  driver_phone: string;
  assigned_areas?: string[] | null;
  created_at: string;
  updated_at: string;
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      driver_name: "",
      driver_id_number: "",
      driver_phone: "",
      assigned_areas: "",
    },
  });

  // جلب قائمة السائقين
  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/drivers${searchTerm ? `?search=${searchTerm}` : ''}`);
      if (response.ok) {
        const result = await response.json();
        // استخراج البيانات من كائن الاستجابة
        setDrivers(result.data || []);
      } else {
        toast.error("فشل في جلب بيانات السائقين");
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
      toast.error("حدث خطأ أثناء جلب بيانات السائقين");
    } finally {
      setIsLoading(false);
    }
  };

  // جلب البيانات عند تحميل الصفحة أو تغيير البحث
  useEffect(() => {
    fetchDrivers();
  }, [searchTerm]);

  // إرسال النموذج
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      
      // تحويل المناطق المفصولة بفواصل إلى مصفوفة
      const areas = values.assigned_areas 
        ? values.assigned_areas.split(",").map(area => area.trim()).filter(area => area)
        : [];
        
      const submitData = {
        ...values,
        assigned_areas: areas,
      };
      
      const response = await fetch("/api/drivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("تم إضافة السائق بنجاح");
        form.reset();
        fetchDrivers(); // تحديث القائمة
      } else {
        toast.error(data.message || "فشل في إضافة السائق");
      }
    } catch (error) {
      console.error("Error adding driver:", error);
      toast.error("حدث خطأ أثناء إضافة السائق");
    } finally {
      setIsLoading(false);
    }
  }

  // مُعالج مسح باركود بطاقة هوية السائق
  const handleBarcodeScan = (barcode: string) => {
    setSearchTerm(barcode);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">إدارة السائقين</h1>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="list">قائمة السائقين</TabsTrigger>
            <TabsTrigger value="add">إضافة سائق جديد</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>قائمة السائقين</CardTitle>
                <CardDescription>جميع السائقين المسجلين في النظام</CardDescription>
                <div className="flex flex-col md:flex-row gap-2 mt-2">
                  <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="بحث عن طريق الاسم أو رقم الهاتف..."
                    className="pr-10 pl-12"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  </div>
                  <div className="md:w-[200px]">
                    <BarcodeScannerButton 
                      onScan={handleBarcodeScan} 
                      fullWidth
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center p-4">جاري التحميل...</div>
                ) : drivers.length === 0 ? (
                  <div className="text-center p-4">لا يوجد سائقين متاحين</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-right border">الاسم</th>
                          <th className="p-2 text-right border">رقم الهوية</th>
                          <th className="p-2 text-right border">رقم الهاتف</th>
                          <th className="p-2 text-right border">المناطق</th>
                          <th className="p-2 text-right border">تاريخ الإضافة</th>
                          <th className="p-2 text-center border">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drivers.map((driver) => (
                          <tr key={driver.id} className="hover:bg-gray-50">
                            <td className="p-2 border">{driver.driver_name}</td>
                            <td className="p-2 border">{driver.driver_id_number || "غير محدد"}</td>
                            <td className="p-2 border">{driver.driver_phone}</td>
                            <td className="p-2 border">
                              {driver.assigned_areas && driver.assigned_areas.length > 0
                                ? driver.assigned_areas.join(", ")
                                : "غير محدد"}
                            </td>
                            <td className="p-2 border">{new Date(driver.created_at).toLocaleDateString("ar")}</td>
                            <td className="p-2 border text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Link href={`/dashboard/drivers/${driver.id}`} passHref>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">عرض</span>
                                  </Button>
                                </Link>
                                <Link href={`/dashboard/drivers/${driver.id}?tab=edit`} passHref>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">تعديل</span>
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>إضافة سائق جديد</CardTitle>
                <CardDescription>أدخل بيانات السائق لإضافته إلى النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="driver_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم السائق</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input className="pr-10" placeholder="أدخل اسم السائق" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="driver_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input className="pr-10" placeholder="أدخل رقم الهاتف" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="driver_id_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهوية (اختياري)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserPlus className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input className="pr-10" placeholder="أدخل رقم الهوية" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="assigned_areas"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>المناطق (اختياري)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input className="pr-3" placeholder="أدخل المناطق مفصولة بفواصل (مثال: الرياض، جدة، الدمام)" {...field} />
                              </div>
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">المناطق التي سيعمل بها السائق، مفصولة بفواصل</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? "جاري الإضافة..." : "إضافة السائق"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
} 