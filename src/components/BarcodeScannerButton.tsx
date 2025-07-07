"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Scan } from "lucide-react";
import { toast } from "sonner";
import BarcodeScanListener from "./BarcodeScanListener";

interface BarcodeScannerButtonProps {
  onScan: (barcode: string) => void;
  variant?: "default" | "outline" | "secondary";
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

export default function BarcodeScannerButton({
  onScan,
  variant = "outline",
  className = "",
  fullWidth = false,
  disabled = false
}: BarcodeScannerButtonProps) {
  const [isScannerActive, setIsScannerActive] = useState(false);

  // تبديل حالة الماسح
  const toggleScanner = () => {
    if (disabled) return;
    
    setIsScannerActive(!isScannerActive);
    if (!isScannerActive) {
      toast.info("تم تفعيل ماسح الباركود. يمكنك المسح الآن.");
    } else {
      toast.info("تم إيقاف ماسح الباركود.");
    }
  };

  // مُعالج مسح الباركود
  const handleBarcodeScan = (barcode: string) => {
    // استدعاء دالة التعامل مع الباركود الممسوح
    onScan(barcode);
    // إظهار إشعار بنجاح المسح
    toast.success(`تم مسح الباركود: ${barcode}`);
  };

  return (
    <>
      {/* إضافة مكون الاستماع لماسح الباركود عندما يكون نشطًا وليس معطلاً */}
      {isScannerActive && !disabled && <BarcodeScanListener onScan={handleBarcodeScan} />}
      
      <Button
        onClick={toggleScanner}
        variant={isScannerActive ? "default" : variant}
        className={`flex items-center justify-center gap-2 ${fullWidth ? "w-full" : ""} ${className}`}
        disabled={disabled}
      >
        <Scan size={16} />
        {isScannerActive ? "إيقاف الماسح" : "تفعيل ماسح الباركود"}
      </Button>
    </>
  );
} 