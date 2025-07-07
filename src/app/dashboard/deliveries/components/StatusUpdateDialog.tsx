"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface StatusUpdateDialogProps {
  orderId: string;
  currentStatus: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (orderId: string, newStatus: string) => void;
}

// تكوين الحالات مع ترجمتها وألوانها
const statusConfig = [
  { value: "entered", label: "مدخل", colors: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400" },
  { value: "assigned", label: "معين لسائق", colors: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "out_for_delivery", label: "قيد التوصيل", colors: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { value: "delivered", label: "تم التسليم", colors: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  { value: "partial_return", label: "إرجاع جزئي", colors: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  { value: "full_return", label: "إرجاع كامل", colors: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" }
];

// الحصول على النص العربي للحالة
const getStatusLabel = (value: string) => {
  const status = statusConfig.find(status => status.value === value);
  return status ? status.label : value;
};

// الحصول على ألوان الحالة
const getStatusColors = (value: string) => {
  const status = statusConfig.find(status => status.value === value);
  return status ? status.colors : "";
};

export function StatusUpdateDialog({
  orderId,
  currentStatus,
  isOpen,
  onClose,
  onUpdate,
}: StatusUpdateDialogProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async () => {
    if (selectedStatus === currentStatus) {
      return onClose();
    }

    setIsUpdating(true);

    try {
      console.log(`تحديث حالة الطلب: ${orderId} إلى ${selectedStatus}`);
      
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const responseData = await response.json().catch(() => null);
      
      if (!response.ok) {
        console.error("خطأ في استجابة API:", response.status, responseData);
        throw new Error(responseData?.message || "فشل تحديث حالة الطلب");
      }

      toast.success("تم تحديث حالة الطلب بنجاح");
      
      if (onUpdate) {
        onUpdate(orderId, selectedStatus);
      }
      
      router.refresh();
      
      onClose();
    } catch (error) {
      console.error("خطأ أثناء تحديث حالة الطلب:", error);
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء تحديث حالة الطلب");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تحديث حالة الطلب</DialogTitle>
          <DialogDescription>
            الطلب رقم: {orderId}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">حالة الطلب</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="اختر حالة الطلب">
                  {selectedStatus && (
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-full inline-block",
                      getStatusColors(selectedStatus)
                    )}>
                      {getStatusLabel(selectedStatus)}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {statusConfig.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-full inline-block",
                      status.colors
                    )}>
                      {status.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleStatusChange} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جارٍ التحديث...
              </>
            ) : (
              "تحديث"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 