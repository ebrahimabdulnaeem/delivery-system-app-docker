// واجهة بسيطة لمكتبة sonner
import { toast as sonnerToast, type ExternalToast } from "sonner"

// أنواع الإشعارات المتاحة
export type ToastType = "success" | "info" | "warning" | "error" | "default"

// استخدام نوع ExternalToast من مكتبة sonner
export type ToastOptions = ExternalToast

// دالة إظهار الإشعارات
export const toast = Object.assign(
  (message: React.ReactNode, options?: ToastOptions) => sonnerToast(message, options),
  {
    success: (message: React.ReactNode, options?: ToastOptions) => sonnerToast.success(message, options),
    info: (message: React.ReactNode, options?: ToastOptions) => sonnerToast.info(message, options),
    warning: (message: React.ReactNode, options?: ToastOptions) => sonnerToast.warning(message, options),
    error: (message: React.ReactNode, options?: ToastOptions) => sonnerToast.error(message, options),
    message: (message: React.ReactNode, options?: ToastOptions) => sonnerToast.message(message, options),
    custom: (fn: (id: string | number) => React.ReactElement, options?: ToastOptions) => sonnerToast.custom(fn, options),
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  }
)

// هوك useToast للتوافق مع الشيفرة القديمة
export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  }
} 