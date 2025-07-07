"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { z } from "zod";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

// أنماط CSS مخصصة لمكون DatePicker
const datePickerCustomStyles = `
  .react-datepicker {
    font-family: var(--font-geist-sans);
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background-color: var(--background);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    direction: rtl;
    text-align: right;
  }
  .react-datepicker__header {
    background-color: var(--muted);
    border-bottom: 1px solid var(--border);
    padding: 1rem;
    text-align: center;
  }
  .react-datepicker__day-name, .react-datepicker__day {
    margin: 0.2rem;
    width: 2rem;
    height: 2rem;
    line-height: 2rem;
    border-radius: 0.25rem;
  }
  .react-datepicker__day:hover {
    background-color: var(--primary);
    color: var(--primary-foreground);
  }
  .react-datepicker__day--selected {
    background-color: var(--primary);
    color: var(--primary-foreground);
  }
  .react-datepicker__day--outside-month {
    color: var(--muted-foreground);
  }
  .react-datepicker__navigation {
    top: 1rem;
  }
  .react-datepicker__navigation--previous {
    left: 1rem;
    right: auto;
  }
  .react-datepicker__navigation--next {
    right: 1rem;
    left: auto;
  }
  .react-datepicker__today-button {
    background-color: var(--primary);
    color: var(--primary-foreground);
    border-top: 1px solid var(--border);
    padding: 0.5rem;
    font-weight: bold;
  }
  .react-datepicker__month-dropdown, 
  .react-datepicker__year-dropdown {
    background-color: var(--background);
    border: 1px solid var(--border);
    border-radius: 0.25rem;
  }
  .react-datepicker__month-option:hover,
  .react-datepicker__year-option:hover {
    background-color: var(--primary);
    color: var(--primary-foreground);
  }
`;

// تعريف التحقق من البيانات للطلبات
const orderSchema = z.object({
  barcode: z.string().min(4, { message: "الباركود يجب أن يكون أكثر من 3 أحرف" }),
  recipient_name: z.string().min(2, { message: "اسم المستلم يجب أن يكون أكثر من حرفين" }),
  recipient_phone1: z.string().min(8, { message: "رقم الهاتف يجب أن يكون على الأقل 8 أرقام" }),
  recipient_phone2: z.string().optional(),
  recipient_address: z.string().min(5, { message: "العنوان يجب أن يكون أكثر من 4 أحرف" }),
  recipient_city: z.string().min(2, { message: "المدينة يجب أن تكون أكثر من حرفين" }),
  cod_amount: z.number().positive({ message: "المبلغ يجب أن يكون أكبر من صفر" }),
  order_description: z.string().min(3, { message: "وصف الطلب يجب أن يكون أكثر من حرفين" }),
  special_instructions: z.string().optional(),
  sender_reference: z.string().optional(),
  number_of_pieces: z.number().int().positive().optional(),
  driver_id: z.string().optional(),
  order_date: z.date({ message: "يرجى تحديد تاريخ صالح" }),
});

export default function CreateOrderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; driver_name: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // حالة النموذج
  const [formData, setFormData] = useState({
    barcode: "",
    recipient_name: "",
    recipient_phone1: "",
    recipient_phone2: "",
    recipient_address: "",
    recipient_city: "",
    cod_amount: "",
    order_description: "",
    special_instructions: "",
    sender_reference: "",
    number_of_pieces: "1",
    driver_id: "none",
    order_date: new Date(),
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

  // إضافة الأنماط المخصصة للتاريخ
  useEffect(() => {
    // إضافة أنماط CSS المخصصة
    const styleEl = document.createElement("style");
    styleEl.innerHTML = datePickerCustomStyles;
    document.head.appendChild(styleEl);

    return () => {
      // إزالة الأنماط عند تفكيك المكون
      document.head.removeChild(styleEl);
    };
  }, []);

  // معالجة تغيير الحقول
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string | number | Date } }) => {
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

  // معالجة تغيير التاريخ
  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, order_date: date || new Date() }));
    
    // مسح رسالة الخطأ عند تغيير القيمة
    if (errors.order_date) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.order_date;
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
        // نتأكد أن التاريخ هو كائن Date صالح
        order_date: formData.order_date instanceof Date ? formData.order_date : new Date(),
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
    
    if (!user.id) {
      toast.error("معرف المستخدم غير متوفر، يرجى تسجيل الخروج وإعادة تسجيل الدخول");
      return;
    }
    
    // طباعة معلومات المستخدم للتحقق
    console.log("معلومات المستخدم:", JSON.stringify(user, null, 2));
    console.log("معرف المستخدم:", user.id);

    // التحقق من صحة البيانات
    if (!validateForm()) {
      toast.error("يرجى التحقق من البيانات المدخلة");
      return;
    }

    // التحقق من المستخدم في قاعدة البيانات قبل محاولة إنشاء الطلب
    try {
      const userCheckResponse = await fetch(`/api/users/check?id=${encodeURIComponent(user.id)}`);
      const userCheckData = await userCheckResponse.json();
      
      if (!userCheckResponse.ok || !userCheckData.exists) {
        toast.error("لم يتم التعرف على المستخدم الحالي", {
          description: "يرجى تسجيل الخروج وإعادة تسجيل الدخول ثم المحاولة مرة أخرى",
          duration: 5000,
          className: "rtl",
          style: { direction: 'rtl' }
        });
        return;
      }
      
      // استخدام معرف المستخدم من قاعدة البيانات
      const verifiedUserId = userCheckData.userId;
      
      setIsLoading(true);
      
      // إعداد البيانات للإرسال باستخدام معرف المستخدم المتحقق منه
      const submitData = {
        ...formData,
        cod_amount: Number(formData.cod_amount),
        number_of_pieces: Number(formData.number_of_pieces),
        driver_id: formData.driver_id === "none" ? undefined : formData.driver_id,
        userId: verifiedUserId,
        // تنسيق التاريخ بالشكل المطلوب للـ API
        order_date: formData.order_date ? format(formData.order_date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      };
      
      console.log("بيانات الإرسال:", JSON.stringify(submitData, null, 2));

      // إرسال البيانات لإنشاء طلب جديد
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        // إشعار نجاح محسن مع تفاصيل الطلب
        toast.success(
          `تم إضافة الطلب بنجاح`, 
          {
            description: `الطلب: ${data.order.barcode} | المستلم: ${data.order.recipient_name} | يمكنك الآن إضافة طلب آخر`,
            duration: 5000,
            action: {
              label: "عرض الطلبات",
              onClick: () => router.push("/dashboard/orders")
            },
            className: "rtl",
            style: { direction: 'rtl' }
          }
        );
        
        // إعادة تعيين النموذج لإضافة طلب جديد
        setFormData({
          barcode: "",
          recipient_name: "",
          recipient_phone1: "",
          recipient_phone2: "",
          recipient_address: "",
          recipient_city: "",
          cod_amount: "",
          order_description: "",
          special_instructions: "",
          sender_reference: "",
          number_of_pieces: "1",
          driver_id: "none",
          order_date: new Date(),
        });
        
        // توليد باركود جديد تلقائياً
        setTimeout(async () => {
          await generateBarcode();
        }, 100);
      } else {
        // عرض رسالة الخطأ من الخادم
        toast.error(data.message || "حدث خطأ أثناء إنشاء الطلب", {
          description: data.message?.includes("Foreign key constraint violated") ? 
            "حدث خطأ في العلاقة مع المستخدم. يرجى تسجيل الخروج وإعادة تسجيل الدخول ثم المحاولة مرة أخرى." : 
            "يرجى التحقق من البيانات والمحاولة مرة أخرى",
          duration: 5000,
          className: "rtl",
          style: { direction: 'rtl' }
        });
        
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
      console.error("خطأ في التحقق من المستخدم:", error);
      toast.error("حدث خطأ أثناء التحقق من المستخدم", {
        description: "يرجى المحاولة مرة أخرى أو تسجيل الخروج وإعادة تسجيل الدخول",
        duration: 5000,
        className: "rtl",
        style: { direction: 'rtl' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // توليد رقم باركود جديد
  const generateBarcode = async () => {
    setIsLoading(true);
    try {
      // سنبدأ بالحصول على آخر قيمة محلية للباركود
      const lastBarcodeValue = localStorage.getItem('lastBarcodeValue');
      let nextBarcodeNumber;
      
      if (lastBarcodeValue) {
        // زيادة القيمة المخزنة بمقدار 1
        nextBarcodeNumber = parseInt(lastBarcodeValue) + 1;
      } else {
        // إذا لم تكن هناك قيمة مخزنة، استخدم القيمة الأساسية المحددة
        nextBarcodeNumber = 3371118530;
      }
      
      // الحد الأقصى لمحاولات توليد باركود فريد
      const MAX_ATTEMPTS = 10;
      let currentAttempt = 0;
      let isUnique = false;
      let barcodeToUse = nextBarcodeNumber.toString();
      
      // استمر في المحاولة حتى نجد باركود فريد أو نصل للحد الأقصى من المحاولات
      while (!isUnique && currentAttempt < MAX_ATTEMPTS) {
        currentAttempt++;
        barcodeToUse = (nextBarcodeNumber + currentAttempt - 1).toString();
        
        // التحقق من وجود الباركود في قاعدة البيانات
        const checkResponse = await fetch(`/api/orders/check-barcode?barcode=${barcodeToUse}`);
        const checkData = await checkResponse.json();
        
        // إذا كان الباركود غير موجود، فهو فريد
        if (checkResponse.ok && !checkData.exists) {
          isUnique = true;
          // تخزين القيمة الجديدة للاستخدام المستقبلي
          localStorage.setItem('lastBarcodeValue', barcodeToUse);
          // تعيين الباركود الفريد في النموذج
          setFormData((prev) => ({ ...prev, barcode: barcodeToUse }));
        }
      }
      
      // إذا لم نجد باركود فريد بعد عدة محاولات
      if (!isUnique) {
        // نزيد رقم البدء بقيمة كبيرة لتفادي التضارب
        const newBaseNumber = nextBarcodeNumber + 1000;
        localStorage.setItem('lastBarcodeValue', newBaseNumber.toString());
        toast.error("تعذر العثور على باركود فريد بعد عدة محاولات، تم زيادة رقم البدء");
        // نضع باركود مؤقت في النموذج
        setFormData((prev) => ({ ...prev, barcode: newBaseNumber.toString() }));
      }
    } catch (error) {
      console.error("خطأ في توليد الباركود:", error);
      toast.error("حدث خطأ أثناء التحقق من الباركود، يرجى المحاولة مرة أخرى");
      // إذا فشلت العملية، نضع باركود عشوائي مؤقت
      const randomBarcode = Math.floor(3371118530 + Math.random() * 10000).toString();
      setFormData((prev) => ({ ...prev, barcode: randomBarcode }));
    } finally {
      setIsLoading(false);
    }
  };

  // توليد رقم باركود عند تحميل الصفحة
  useEffect(() => {
    const initializeBarcode = async () => {
      await generateBarcode();
    };
    
    initializeBarcode();
  }, []);

  return (
    <MainLayout>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">إنشاء طلب جديد</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard/orders")}
            className="px-6"
          >
            إلغاء
          </Button>
        </div>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* تاريخ الطلب */}
                <div>
                  <Label htmlFor="order_date" className="block mb-2 font-medium">
                    تاريخ الطلب <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <DatePicker
                      id="order_date"
                      selected={formData.order_date}
                      onChange={handleDateChange}
                      dateFormat="dd/MM/yyyy"
                      locale={ar}
                      className={`w-full rounded-md border p-3 ${errors.order_date ? "border-red-500" : "border-gray-200"}`}
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      placeholderText="حدد التاريخ"
                    />
                </div>
                  {errors.order_date && <p className="text-sm text-red-500 mt-1">{errors.order_date}</p>}
                </div>

                {/* اسم المستلم */}
                <div>
                  <Label htmlFor="recipient_name" className="block mb-2 font-medium">
                    اسم المستلم <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="recipient_name"
                    name="recipient_name"
                    value={formData.recipient_name}
                    onChange={handleChange}
                    placeholder="الاسم بالكامل"
                    className={`p-3 ${errors.recipient_name ? "border-red-500" : "border-gray-200"}`}
                  />
                  {errors.recipient_name && <p className="text-sm text-red-500 mt-1">{errors.recipient_name}</p>}
                </div>

                {/* رقم الهاتف 1 */}
                <div>
                  <Label htmlFor="recipient_phone1" className="block mb-2 font-medium">
                    رقم الهاتف 1 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="recipient_phone1"
                    name="recipient_phone1"
                    value={formData.recipient_phone1}
                    onChange={handleChange}
                    placeholder="الهاتف الرئيسي"
                    className={`p-3 ${errors.recipient_phone1 ? "border-red-500" : "border-gray-200"}`}
                  />
                  {errors.recipient_phone1 && <p className="text-sm text-red-500 mt-1">{errors.recipient_phone1}</p>}
                </div>

                {/* رقم الهاتف 2 */}
                <div>
                  <Label htmlFor="recipient_phone2" className="block mb-2 font-medium">
                    رقم الهاتف 2
                  </Label>
                  <Input
                    id="recipient_phone2"
                    name="recipient_phone2"
                    value={formData.recipient_phone2}
                    onChange={handleChange}
                    placeholder="هاتف إضافي (اختياري)"
                    className={`p-3 ${errors.recipient_phone2 ? "border-red-500" : "border-gray-200"}`}
                  />
                  {errors.recipient_phone2 && <p className="text-sm text-red-500 mt-1">{errors.recipient_phone2}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* المدينة */}
                <div>
                  <Label htmlFor="recipient_city" className="block mb-2 font-medium">
                    المدينة <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.recipient_city} 
                    onValueChange={(value) => handleSelectChange("recipient_city", value)}
                  >
                    <SelectTrigger className={`p-3 ${errors.recipient_city ? "border-red-500" : "border-gray-200"}`}>
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
                  {errors.recipient_city && <p className="text-sm text-red-500 mt-1">{errors.recipient_city}</p>}
                </div>

                {/* مبلغ الدفع عند الاستلام */}
                <div>
                  <Label htmlFor="cod_amount" className="block mb-2 font-medium">
                    مبلغ الدفع عند الاستلام <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cod_amount"
                    name="cod_amount"
                    type="number"
                    value={formData.cod_amount}
                    onChange={handleChange}
                    placeholder="أدخل المبلغ"
                    min="0"
                    step="0.01"
                    className={`p-3 ${errors.cod_amount ? "border-red-500" : "border-gray-200"}`}
                  />
                  {errors.cod_amount && <p className="text-sm text-red-500 mt-1">{errors.cod_amount}</p>}
                </div>
              </div>

              {/* عنوان المستلم */}
              <div>
                <Label htmlFor="recipient_address" className="block mb-2 font-medium">
                  عنوان المستلم <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="recipient_address"
                  name="recipient_address"
                  value={formData.recipient_address}
                  onChange={handleChange}
                  placeholder="أدخل العنوان بالتفصيل"
                  rows={2}
                  className={`p-3 ${errors.recipient_address ? "border-red-500" : "border-gray-200"}`}
                />
                {errors.recipient_address && <p className="text-sm text-red-500 mt-1">{errors.recipient_address}</p>}
              </div>

              {/* وصف الطلب */}
              <div>
                <Label htmlFor="order_description" className="block mb-2 font-medium">
                  وصف الطلب <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="order_description"
                  name="order_description"
                  value={formData.order_description}
                  onChange={handleChange}
                  placeholder="وصف الطلب"
                  rows={2}
                  className={`p-3 ${errors.order_description ? "border-red-500" : "border-gray-200"}`}
                />
                {errors.order_description && <p className="text-sm text-red-500 mt-1">{errors.order_description}</p>}
              </div>

              {/* تعليمات خاصة */}
              <div>
                <Label htmlFor="special_instructions" className="block mb-2 font-medium">
                  تعليمات خاصة
                </Label>
                <Textarea
                  id="special_instructions"
                  name="special_instructions"
                  value={formData.special_instructions}
                  onChange={handleChange}
                  placeholder="تعليمات خاصة اختيارية للتوصيل"
                  rows={2}
                  className={`p-3 ${errors.special_instructions ? "border-red-500" : "border-gray-200"}`}
                />
                {errors.special_instructions && <p className="text-sm text-red-500 mt-1">{errors.special_instructions}</p>}
              </div>

              {/* قسم الخيارات الإضافية (القائمة المنسدلة) */}
              <div className="border rounded-md p-4 mt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full flex justify-between items-center"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                >
                  <span className="font-medium">خيارات إضافية</span>
                  {showAdvancedOptions ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
                
                {showAdvancedOptions && (
                  <div className="mt-4 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* مرجع المرسل */}
                      <div>
                        <Label htmlFor="sender_reference" className="block mb-2 font-medium">
                          مرجع المرسل
                        </Label>
                        <Input
                          id="sender_reference"
                          name="sender_reference"
                          value={formData.sender_reference}
                          onChange={handleChange}
                          placeholder="مرجع اختياري"
                          className={`p-3 ${errors.sender_reference ? "border-red-500" : "border-gray-200"}`}
                        />
                        {errors.sender_reference && <p className="text-sm text-red-500 mt-1">{errors.sender_reference}</p>}
                      </div>

                      {/* عدد القطع */}
                      <div>
                        <Label htmlFor="number_of_pieces" className="block mb-2 font-medium">
                          عدد القطع
                        </Label>
                        <Input
                          id="number_of_pieces"
                          name="number_of_pieces"
                          type="number"
                          value={formData.number_of_pieces}
                          onChange={handleChange}
                          placeholder="عدد القطع في الطلب"
                          min="1"
                          className={`p-3 ${errors.number_of_pieces ? "border-red-500" : "border-gray-200"}`}
                        />
                        {errors.number_of_pieces && <p className="text-sm text-red-500 mt-1">{errors.number_of_pieces}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* السائق */}
                      <div>
                        <Label htmlFor="driver_id" className="block mb-2 font-medium">السائق</Label>
                  <Select 
                    value={formData.driver_id} 
                    onValueChange={(value) => handleSelectChange("driver_id", value)}
                  >
                          <SelectTrigger className={`p-3 ${errors.driver_id ? "border-red-500" : "border-gray-200"}`}>
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
                        {errors.driver_id && <p className="text-sm text-red-500 mt-1">{errors.driver_id}</p>}
                      </div>

                      {/* باركود */}
                      <div>
                        <Label htmlFor="barcode" className="block mb-2 font-medium">
                          رقم الباركود <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="barcode"
                            name="barcode"
                            value={formData.barcode}
                            onChange={handleChange}
                            placeholder="رقم الباركود"
                            className={`p-3 ${errors.barcode ? "border-red-500" : "border-gray-200"}`}
                            readOnly
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                            onClick={generateBarcode}
                            title="توليد باركود جديد"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                        {errors.barcode && <p className="text-sm text-red-500 mt-1">{errors.barcode}</p>}
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-muted-foreground">يتم توليد رقم باركود فريد لكل طلب تلقائياً</p>
                        </div>
                      </div>
                    </div>
                </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/orders")}
                  className="px-6"
            >
              إلغاء
            </Button>
                <Button 
                  type="submit" 
                  className="bg-[#13183F] text-white px-8 py-2.5"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin ml-2" /> : null}
              إنشاء الطلب
            </Button>
          </div>
        </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 