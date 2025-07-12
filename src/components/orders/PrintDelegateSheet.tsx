"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { PrintDelegateSheetProps } from "./delegate-sheet/types";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

/**
 * المكون الرئيسي لطباعة شيت المندوب
 * يقوم بإنشاء نافذة طباعة جديدة وتوليد محتوى HTML للطباعة
 */
export function PrintDelegateSheet({
  driver,
  orders,
  calculateTotalCOD,
  onSave,
}: PrintDelegateSheetProps & { onSave: () => Promise<boolean> }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

    const saveSheetAndRedirect = async () => {
    setIsSaving(true);
    try {
      const saveResult = await onSave();
      if (!saveResult) {
        toast.error("فشل في حفظ البوالص للمندوب");
        return;
      }

      const driverId = String(driver.id).replace(/[^0-9]/g, '');
      const driverIdPadded = driverId.padStart(2, '0').slice(0, 2);
      const timestamp = Date.now().toString().slice(-8);
      const sheetBarcode = `${driverIdPadded}${timestamp}`;

      const orderIds = orders.map(order => order.id);
      const response = await fetch('/api/delegate-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driver.id,
          orders: orderIds,
          sheetBarcode: sheetBarcode,
          totalAmount: calculateTotalCOD(),
        }),
      });

      if (!response.ok) {
        throw new Error('فشل في حفظ الشيت في قاعدة البيانات');
      }

      const newSheet = await response.json();
      toast.success("تم حفظ الشيت بنجاح!");
      router.push(`/dashboard/delegate-sheets/details?id=${newSheet.data.id}`);

    } catch (error) {
      console.error('خطأ في حفظ الشيت:', error);
      toast.error('حدث خطأ أثناء حفظ الشيت.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button
      onClick={saveSheetAndRedirect}
      variant="default"
      size="sm"
      className="px-4 gap-2"
      disabled={isSaving || orders.length === 0}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          جاري الحفظ...
        </>
      ) : (
        <>
          <Save className="h-4 w-4" />
          حفظ وتوجيه
        </>
      )}
    </Button>
  );
}