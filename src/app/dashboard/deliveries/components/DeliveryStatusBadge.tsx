import { cn } from "@/lib/utils";

type DeliveryStatusBadgeProps = {
  status: string;
  recentlyUpdated?: boolean;
};

export function DeliveryStatusBadge({ status, recentlyUpdated = false }: DeliveryStatusBadgeProps) {
  // الحصول على الحالة بحروف صغيرة للمقارنة
  const lowerStatus = status.toLowerCase();
  
  // تحديد لون ونص الشارة بناءً على الحالة
  let classes = "";
  let displayText = status;
  
  // متغيرات للتأثيرات الزجاجية
  let glassEffect = "";
  let shinyColor = "bg-white/40";
  
  // تعيين اللون المناسب لكل حالة
  if (lowerStatus === "entered") {
    classes = "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400";
    glassEffect = "bg-gray-100/40 backdrop-blur-sm border border-gray-200/50";
    shinyColor = "bg-gray-200/60";
    displayText = "مدخل";
  } else if (lowerStatus === "assigned") {
    classes = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    glassEffect = "bg-blue-100/40 backdrop-blur-sm border border-blue-200/50";
    shinyColor = "bg-blue-200/60";
    displayText = "معين لسائق";
  } else if (lowerStatus === "out_for_delivery") {
    classes = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    glassEffect = "bg-yellow-100/40 backdrop-blur-sm border border-yellow-200/50";
    shinyColor = "bg-yellow-200/60";
    displayText = "قيد التوصيل";
  } else if (lowerStatus === "delivered") {
    classes = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    glassEffect = "bg-green-100/40 backdrop-blur-sm border border-green-200/50";
    shinyColor = "bg-green-200/60";
    displayText = "تم التسليم";
  } else if (lowerStatus === "partial_return") {
    classes = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    glassEffect = "bg-orange-100/40 backdrop-blur-sm border border-orange-200/50";
    shinyColor = "bg-orange-200/60";
    displayText = "إرجاع جزئي";
  } else if (lowerStatus === "full_return") {
    classes = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    glassEffect = "bg-red-100/40 backdrop-blur-sm border border-red-200/50";
    shinyColor = "bg-red-200/60";
    displayText = "إرجاع كامل";
  } else {
    // حالة افتراضية للحالات غير المعروفة
    classes = "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    glassEffect = "bg-gray-100/40 backdrop-blur-sm border border-gray-200/50";
    shinyColor = "bg-gray-200/60";
    displayText = status;
  }

  return (
    <span
      className={cn(
        "px-2.5 py-0.5 text-xs font-medium rounded-full inline-block relative overflow-hidden",
        recentlyUpdated ? glassEffect : classes
      )}
    >
      {recentlyUpdated && (
        <span 
          className={cn(
            "absolute right-[150%] h-full w-[120%] transform -skew-x-[45deg] transition-all duration-700 animate-shiny z-0",
            shinyColor
          )}
        />
      )}
      <span className="relative z-10">{displayText}</span>
    </span>
  );
} 