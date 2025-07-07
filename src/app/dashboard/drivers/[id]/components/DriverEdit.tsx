import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";

// واجهة السائق
interface Driver {
  id: string;
  driver_name: string;
  driver_id_number?: string | null;
  driver_phone: string;
  assigned_areas?: string[] | null;
  created_at: string;
  updated_at: string;
  orders?: {
    id: string;
    barcode: string;
    recipient_name: string;
    recipient_address: string;
    recipient_city: string;
    status: string;
    created_at: string;
    cod_amount: number;
  }[];
}

type DriverEditProps = {
  driver: Driver;
  onDriverUpdated: (updatedDriver: Driver) => void;
};

// تعريف التحقق من البيانات للسائقين
const driverSchema = z.object({
  driver_name: z.string().min(2, {
    message: "اسم السائق يجب أن يكون أكثر من حرفين",
  }),
  driver_id_number: z.string().optional(),
  driver_phone: z.string().min(8, {
    message: "رقم الهاتف يجب أن يكون على الأقل 8 أرقام",
  }),
  assigned_areas: z.string().optional(),
});

export function DriverEdit({ driver, onDriverUpdated }: DriverEditProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // حالة النموذج
  const [formData, setFormData] = useState({
    driver_name: driver.driver_name,
    driver_id_number: driver.driver_id_number || "",
    driver_phone: driver.driver_phone,
    assigned_areas: driver.assigned_areas ? driver.assigned_areas.join(", ") : "",
  });

  // معالجة تغيير الحقول
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // التحقق من صحة البيانات
  const validateForm = () => {
    try {
      driverSchema.parse(formData);
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
      // تحويل المناطق المفصولة بفواصل إلى مصفوفة
      const areas = formData.assigned_areas 
        ? formData.assigned_areas.split(",").map(area => area.trim()).filter(area => area)
        : [];
        
      const submitData = {
        ...formData,
        assigned_areas: areas,
      };

      // إرسال البيانات لتحديث السائق
      const response = await fetch(`/api/drivers/${driver.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        // استدعاء وظيفة التحديث لتحديث بيانات السائق في الصفحة الرئيسية
        onDriverUpdated(data.driver);
      } else {
        // عرض رسالة الخطأ من الخادم
        toast.error(data.message || "حدث خطأ أثناء تحديث بيانات السائق");
        
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
      console.error("Error updating driver:", error);
      toast.error("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>تعديل بيانات السائق</CardTitle>
        <CardDescription>تعديل معلومات السائق</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="driver_name">اسم السائق <span className="text-red-500">*</span></Label>
              <Input
                id="driver_name"
                name="driver_name"
                value={formData.driver_name}
                onChange={handleChange}
                placeholder="أدخل اسم السائق"
                className={errors.driver_name ? "border-red-500" : ""}
              />
              {errors.driver_name && <p className="text-sm text-red-500">{errors.driver_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver_phone">رقم الهاتف <span className="text-red-500">*</span></Label>
              <Input
                id="driver_phone"
                name="driver_phone"
                value={formData.driver_phone}
                onChange={handleChange}
                placeholder="أدخل رقم الهاتف"
                className={errors.driver_phone ? "border-red-500" : ""}
              />
              {errors.driver_phone && <p className="text-sm text-red-500">{errors.driver_phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver_id_number">رقم الهوية (اختياري)</Label>
              <Input
                id="driver_id_number"
                name="driver_id_number"
                value={formData.driver_id_number}
                onChange={handleChange}
                placeholder="أدخل رقم الهوية"
                className={errors.driver_id_number ? "border-red-500" : ""}
              />
              {errors.driver_id_number && <p className="text-sm text-red-500">{errors.driver_id_number}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_areas">المناطق (مفصولة بفواصل)</Label>
              <Input
                id="assigned_areas"
                name="assigned_areas"
                value={formData.assigned_areas}
                onChange={handleChange}
                placeholder="أدخل المناطق مفصولة بفواصل"
                className={errors.assigned_areas ? "border-red-500" : ""}
              />
              {errors.assigned_areas && <p className="text-sm text-red-500">{errors.assigned_areas}</p>}
              <p className="text-sm text-muted-foreground">مثال: الرياض، جدة، الدمام</p>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 