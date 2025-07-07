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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, MapPin, Edit, Trash, Plus, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";

// Configuración para indicar que esta página es dinámica
export const dynamic = 'force-dynamic';

// تعريف نموذج التحقق
const formSchema = z.object({
  name: z.string().min(2, {
    message: "اسم المدينة يجب أن يكون أكثر من حرفين",
  }),
});

type City = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  // جلب قائمة المدن
  const fetchCities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/cities${searchTerm ? `?search=${searchTerm}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setCities(data.data || []);
      } else {
        toast.error("فشل في جلب بيانات المدن");
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast.error("حدث خطأ أثناء جلب بيانات المدن");
    } finally {
      setIsLoading(false);
    }
  };

  // جلب البيانات عند تحميل الصفحة أو تغيير البحث
  useEffect(() => {
    fetchCities();
  }, [searchTerm]);

  // إرسال نموذج إضافة مدينة جديدة
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("تم إضافة المدينة بنجاح");
        form.reset();
        fetchCities(); // تحديث القائمة
      } else {
        toast.error(data.message || "فشل في إضافة المدينة");
      }
    } catch (error) {
      console.error("Error adding city:", error);
      toast.error("حدث خطأ أثناء إضافة المدينة");
    } finally {
      setIsLoading(false);
    }
  }

  // حذف مدينة
  const handleDeleteCity = async () => {
    if (!cityToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/cities/${cityToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("تم حذف المدينة بنجاح");
        fetchCities(); // تحديث القائمة
        setCityToDelete(null);
      } else {
        // في حالة وجود طلبات مرتبطة
        if (response.status === 400 && data.ordersCount) {
          toast.error(`لا يمكن حذف المدينة لأنها مرتبطة بـ ${data.ordersCount} طلب/طلبات`);
        } else {
          toast.error(data.message || "فشل في حذف المدينة");
        }
      }
    } catch (error) {
      console.error("Error deleting city:", error);
      toast.error("حدث خطأ أثناء حذف المدينة");
    } finally {
      setIsDeleting(false);
    }
  };

  // بدء تحرير مدينة
  const startEditingCity = (city: City) => {
    setEditingCity(city);
    editForm.reset({ name: city.name });
  };

  // تحديث مدينة
  const onUpdateCity = async (values: z.infer<typeof formSchema>) => {
    if (!editingCity) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/cities/${editingCity.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("تم تحديث المدينة بنجاح");
        setEditingCity(null);
        fetchCities(); // تحديث القائمة
      } else {
        toast.error(data.message || "فشل في تحديث المدينة");
      }
    } catch (error) {
      console.error("Error updating city:", error);
      toast.error("حدث خطأ أثناء تحديث المدينة");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">إدارة المدن</h1>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="list">قائمة المدن</TabsTrigger>
            <TabsTrigger value="add">إضافة مدينة جديدة</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>قائمة المدن</CardTitle>
                <CardDescription>جميع المدن المسجلة في النظام</CardDescription>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="بحث عن طريق اسم المدينة..."
                    className="pr-10 pl-12"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center p-4">جاري التحميل...</div>
                ) : cities.length === 0 ? (
                  <div className="text-center p-4">لا يوجد مدن متاحة</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-right border">كود المدينة</th>
                          <th className="p-2 text-right border">اسم المدينة</th>
                          <th className="p-2 text-center border">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cities.map((city) => (
                          <tr key={city.id} className="hover:bg-gray-50">
                            <td className="p-2 border">{city.id}</td>
                            <td className="p-2 border">{city.name}</td>
                            <td className="p-2 border text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => startEditingCity(city)}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">تعديل</span>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => setCityToDelete(city)}
                                >
                                  <Trash className="h-4 w-4 text-red-500" />
                                  <span className="sr-only">حذف</span>
                                </Button>
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
                <CardTitle>إضافة مدينة جديدة</CardTitle>
                <CardDescription>أدخل اسم المدينة لإضافتها إلى النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم المدينة</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              <Input className="pr-10" placeholder="أدخل اسم المدينة" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          جاري الإضافة...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          إضافة المدينة
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* نافذة تحرير المدينة */}
        {editingCity && (
          <AlertDialog open={!!editingCity} onOpenChange={(open) => !open && setEditingCity(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تعديل المدينة</AlertDialogTitle>
                <AlertDialogDescription>
                  تعديل بيانات المدينة &quot;{editingCity.name}&quot;
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onUpdateCity)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المدينة</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input className="pr-10" placeholder="أدخل اسم المدينة" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        "حفظ التغييرات"
                      )}
                    </Button>
                  </AlertDialogFooter>
                </form>
              </Form>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* نافذة تأكيد الحذف */}
        <AlertDialog open={!!cityToDelete} onOpenChange={(open) => !open && setCityToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد من حذف هذه المدينة؟</AlertDialogTitle>
              <AlertDialogDescription>
                هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المدينة نهائياً من قاعدة البيانات.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteCity} 
                className="bg-red-500 hover:bg-red-600"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الحذف...
                  </>
                ) : (
                  "تأكيد الحذف"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
} 