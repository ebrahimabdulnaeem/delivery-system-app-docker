import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// تنسيق التاريخ بالعربية
export function formatDate(date: Date | string): string {
  if (!date) return "";
  
  const d = typeof date === "string" ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(d);
}

// تنسيق العملة بالجنيه المصري
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
  }).format(amount);
}

// توليد رقم تسلسلي عشوائي
export function generateId(prefix = ""): string {
  return `${prefix}${Math.random().toString(36).substring(2, 9)}`;
}

// الحصول على اسم حالة الطلب بالعربية
export function getArabicOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    entered: "مدخل",
    assigned: "معين لسائق",
    out_for_delivery: "قيد التوصيل",
    delivered: "تم التوصيل",
    partial_return: "إرجاع جزئي",
    full_return: "إرجاع كامل"
  };

  return statusMap[status.toLowerCase()] || status;
}

// الحصول على لون حالة الطلب
export function getOrderStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    entered: "text-amber-600",
    assigned: "text-purple-600",
    out_for_delivery: "text-blue-600",
    delivered: "text-green-600",
    partial_return: "text-red-600",
    full_return: "text-red-600",
  };

  return colorMap[status.toLowerCase()] || "";
}

// تحقق من الصلاحيات
export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}
