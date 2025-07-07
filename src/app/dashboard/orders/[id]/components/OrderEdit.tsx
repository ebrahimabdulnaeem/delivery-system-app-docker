import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { OrderStatus } from "@/types";

// واجهة الطلب
interface Order {
  id: string;
  barcode: string;
  order_date: string;
  recipient_name: string;
  recipient_phone1: string;
  recipient_phone2?: string | null;
  recipient_address: string;
  recipient_city: string;
  cod_amount: number;
  order_description?: string | null;
  special_instructions?: string | null;
  sender_reference?: string | null;
  number_of_pieces?: number | null;
  status: string;
  driver_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  drivers?: {
    id: string;
    driver_name: string;
    driver_phone: string;
  } | null;
  users?: {
    id: string;
    username: string;
    email: string;
    role: string;
  } | null;
}

type OrderEditProps = {
  order: Order;
  onOrderUpdated: (updatedOrder: Order) => void;
};

// تعريف التحقق من البيانات للطلبات
const orderSchema = z.object({
  barcode: z.string().min(4, { message: "الباركود يجب أن يكون أكثر من 3 أحرف" }),
  recipient_name: z.string().min(2, { message: "اسم المستلم يجب أن يكون أكثر من حرفين" }),
  recipient_phone1: z.string().min(8, { message: "رقم الهاتف يجب أن يكون على الأقل 8 أرقام" }),
  recipient_phone2: z.string().optional(),
  recipient_address: z.string().min(5, { message: "العنوان يجب أن يكون أكثر من 4 أحرف" }),
  recipient_city: z.string().min(2, { message: "المدينة يجب أن تكون أكثر من حرفين" }),
  cod_amount: z.number().positive({ message: "المبلغ يجب أن يكون أكبر من صفر" }),
  order_description: z.string().optional(),
  special_instructions: z.string().optional(),
  sender_reference: z.string().optional(),
  number_of_pieces: z.number().int().positive().optional(),
  driver_id: z.string().optional(),
  status: z.string()
});

export function OrderEdit({ order, onOrderUpdated }: OrderEditProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; driver_name: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // حالة النموذج
  const [formData, setFormData] = useState({
    barcode: order.barcode,
    recipient_name: order.recipient_name,
    recipient_phone1: order.recipient_phone1,
    recipient_phone2: order.recipient_phone2 || "",
    recipient_address: order.recipient_address,
    recipient_city: order.recipient_city,
    cod_amount: String(order.cod_amount),
    order_description: order.order_description || "",
    special_instructions: order.special_instructions || "",
    sender_reference: order.sender_reference || "",
    number_of_pieces: String(order.number_of_pieces || "1"),
    driver_id: order.driver_id || "none",
    status: order.status
  });

  // جلب المدن والسائقين عند تحميل الصفحة
  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب المدن
        const citiesResponse = await fetch("/api/cities");
        if (citiesResponse.ok) {
          const citiesData = await citiesResponse.json();
          setCities(citiesData.data || citiesData);
        }

        // جلب السائقين
        const driversResponse = await fetch("/api/drivers");
        if (driversResponse.ok) {
          const driversData = await driversResponse.json();
          setDrivers(driversData.data || driversData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("حدث خطأ أثناء جلب البيانات");
      }
    };

    fetchData();
  }, []);

  // معالجة تغيير الحقول
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // مسح رسالة الخطأ عند تغيير القيمة
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // معالجة تغيير القوائم المنسدلة
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // مسح رسالة الخطأ عند تغيير القيمة
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // التحقق من صحة البيانات
  const validateForm = () => {
    try {
      // تحويل القيم النصية إلى أرقام حيث يلزم
      const validationData = {
        ...formData,
        cod_amount: formData.cod_amount ? Number(formData.cod_amount) : 0,
        number_of_pieces: formData.number_of_pieces ? Number(formData.number_of_pieces) : 1,
        recipient_phone2: formData.recipient_phone2 || undefined,
        order_description: formData.order_description || undefined,
        special_instructions: formData.special_instructions || undefined,
        sender_reference: formData.sender_reference || undefined,
        driver_id: formData.driver_id === "none" ? undefined : formData.driver_id,
      };

      orderSchema.parse(validationData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // معالجة إرسال النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    // التحقق من صحة البيانات
    if (!validateForm()) {
      toast.error("يرجى التحقق من البيانات المدخلة");
      return;
    }

    setIsLoading(true);
    
    try {
      // إعداد البيانات للإرسال
      const submitData = {
        ...formData,
        cod_amount: Number(formData.cod_amount),
        number_of_pieces: Number(formData.number_of_pieces),
        driver_id: formData.driver_id === "none" ? undefined : formData.driver_id,
      };

      // إرسال البيانات لتحديث الطلب
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        // استدعاء وظيفة التحديث لتحديث بيانات الطلب في الصفحة الرئيسية
        onOrderUpdated(data.order);
      } else {
        // عرض رسالة الخطأ من الخادم
        toast.error(data.message || "حدث خطأ أثناء تحديث الطلب");
        
        // إذا كانت هناك أخطاء تحقق من الخادم
        if (data.errors) {
          const serverErrors: Record<string, string> = {};
          data.errors.forEach((err: { path?: string[]; message: string }) => {
            if (err.path) {
              serverErrors[err.path[0].toString()] = err.message;
            }
          });
          setErrors(serverErrors);
        }
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>بيانات الطلب</CardTitle>
          <CardDescription>تعديل المعلومات الأساسية للطلب</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="barcode">رقم الباركود <span className="text-red-500">*</span></Label>
              <Input
                id="barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="أدخل رقم الباركود"
                className={errors.barcode ? "border-red-500" : ""}
              />
              {errors.barcode && <p className="text-sm text-red-500">{errors.barcode}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="sender_reference">مرجع المرسل</Label>
              <Input
                id="sender_reference"
                name="sender_reference"
                value={formData.sender_reference}
                onChange={handleChange}
                placeholder="أدخل رقم مرجع للمرسل (اختياري)"
                className={errors.sender_reference ? "border-red-500" : ""}
              />
              {errors.sender_reference && <p className="text-sm text-red-500">{errors.sender_reference}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cod_amount">مبلغ الدفع عند الاستلام <span className="text-red-500">*</span></Label>
              <Input
                id="cod_amount"
                name="cod_amount"
                type="number"
                value={formData.cod_amount}
                onChange={handleChange}
                placeholder="أدخل مبلغ الدفع عند الاستلام"
                min="0"
                step="0.01"
                className={errors.cod_amount ? "border-red-500" : ""}
              />
              {errors.cod_amount && <p className="text-sm text-red-500">{errors.cod_amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="number_of_pieces">عدد القطع</Label>
              <Input
                id="number_of_pieces"
                name="number_of_pieces"
                type="number"
                value={formData.number_of_pieces}
                onChange={handleChange}
                placeholder="أدخل عدد القطع"
                min="1"
                className={errors.number_of_pieces ? "border-red-500" : ""}
              />
              {errors.number_of_pieces && <p className="text-sm text-red-500">{errors.number_of_pieces}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_description">وصف الطلب</Label>
              <Input
                id="order_description"
                name="order_description"
                value={formData.order_description}
                onChange={handleChange}
                placeholder="وصف مختصر لمحتوى الطلب (اختياري)"
                className={errors.order_description ? "border-red-500" : ""}
              />
              {errors.order_description && <p className="text-sm text-red-500">{errors.order_description}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_instructions">تعليمات خاصة</Label>
            <Textarea
              id="special_instructions"
              name="special_instructions"
              value={formData.special_instructions}
              onChange={handleChange}
              placeholder="أي تعليمات خاصة متعلقة بالطلب (اختياري)"
              rows={3}
              className={errors.special_instructions ? "border-red-500" : ""}
            />
            {errors.special_instructions && <p className="text-sm text-red-500">{errors.special_instructions}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>بيانات المستلم</CardTitle>
          <CardDescription>تعديل معلومات المستلم</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipient_name">اسم المستلم <span className="text-red-500">*</span></Label>
            <Input
              id="recipient_name"
              name="recipient_name"
              value={formData.recipient_name}
              onChange={handleChange}
              placeholder="أدخل اسم المستلم"
              className={errors.recipient_name ? "border-red-500" : ""}
            />
            {errors.recipient_name && <p className="text-sm text-red-500">{errors.recipient_name}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="recipient_phone1">رقم هاتف المستلم <span className="text-red-500">*</span></Label>
              <Input
                id="recipient_phone1"
                name="recipient_phone1"
                value={formData.recipient_phone1}
                onChange={handleChange}
                placeholder="أدخل رقم هاتف المستلم"
                className={errors.recipient_phone1 ? "border-red-500" : ""}
              />
              {errors.recipient_phone1 && <p className="text-sm text-red-500">{errors.recipient_phone1}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient_phone2">رقم هاتف إضافي</Label>
              <Input
                id="recipient_phone2"
                name="recipient_phone2"
                value={formData.recipient_phone2}
                onChange={handleChange}
                placeholder="أدخل رقم هاتف إضافي (اختياري)"
                className={errors.recipient_phone2 ? "border-red-500" : ""}
              />
              {errors.recipient_phone2 && <p className="text-sm text-red-500">{errors.recipient_phone2}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient_address">عنوان المستلم <span className="text-red-500">*</span></Label>
            <Textarea
              id="recipient_address"
              name="recipient_address"
              value={formData.recipient_address}
              onChange={handleChange}
              placeholder="أدخل عنوان المستلم بالتفصيل"
              rows={3}
              className={errors.recipient_address ? "border-red-500" : ""}
            />
            {errors.recipient_address && <p className="text-sm text-red-500">{errors.recipient_address}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="recipient_city">المدينة <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.recipient_city} 
                onValueChange={(value) => handleSelectChange("recipient_city", value)}
              >
                <SelectTrigger className={errors.recipient_city ? "border-red-500" : ""}>
                  <SelectValue placeholder="اختر المدينة" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.recipient_city && <p className="text-sm text-red-500">{errors.recipient_city}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver_id">السائق</Label>
              <Select 
                value={formData.driver_id} 
                onValueChange={(value) => handleSelectChange("driver_id", value)}
              >
                <SelectTrigger className={errors.driver_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="تعيين سائق (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون سائق</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.driver_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.driver_id && <p className="text-sm text-red-500">{errors.driver_id}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>حالة الطلب</CardTitle>
          <CardDescription>تحديث حالة الطلب الحالية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="status">حالة الطلب <span className="text-red-500">*</span></Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                <SelectValue placeholder="اختر حالة الطلب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OrderStatus.ENTERED}>مدخل</SelectItem>
                <SelectItem value={OrderStatus.ASSIGNED}>معين لسائق</SelectItem>
                <SelectItem value={OrderStatus.OUT_FOR_DELIVERY}>قيد التوصيل</SelectItem>
                <SelectItem value={OrderStatus.DELIVERED}>تم التسليم</SelectItem>
                <SelectItem value={OrderStatus.PARTIAL_RETURN}>إرجاع جزئي</SelectItem>
                <SelectItem value={OrderStatus.FULL_RETURN}>إرجاع كامل</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} className="gap-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ التغييرات
        </Button>
      </div>
    </form>
  );
} 