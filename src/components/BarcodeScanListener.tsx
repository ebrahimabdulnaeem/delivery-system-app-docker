"use client";

import { useEffect, useState } from "react";

interface BarcodeScanListenerProps {
  onScan: (barcode: string) => void;
  timeout?: number;
}

export default function BarcodeScanListener({ onScan, timeout = 30 }: BarcodeScanListenerProps) {
  const [buffer, setBuffer] = useState<string>("");
  const [lastKeyTime, setLastKeyTime] = useState<number>(0);

  useEffect(() => {
    // معالج أحداث ضغط المفاتيح
    const handleKeyDown = (e: KeyboardEvent) => {
      // تجاهل الأحداث إذا كان هناك عنصر تركيز من نوع مدخلات
      if (document.activeElement?.tagName === "INPUT" || 
          document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      const currentTime = new Date().getTime();

      // إعادة تعيين المخزن المؤقت إذا كان هناك توقف طويل بين الأحرف
      if (currentTime - lastKeyTime > timeout * 10) {
        setBuffer("");
      }
      
      setLastKeyTime(currentTime);

      // تجاهل مفاتيح التحكم ما عدا Enter
      if ((e.key.length > 1 && e.key !== "Enter") || e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      // تحديث المخزن المؤقت بالحرف المضغوط
      if (e.key !== "Enter") {
        setBuffer(prev => prev + e.key);
      } else {
        // عند الضغط على Enter وإذا كان هناك محتوى في المخزن المؤقت
        if (buffer.length > 3) {
          onScan(buffer);
        }
        setBuffer(""); // إعادة تعيين المخزن المؤقت
      }
    };

    // معالج مهلة للباركود (لمعالجة الباركود الذي لا ينتهي بـ Enter)
    const intervalId = setInterval(() => {
      const currentTime = new Date().getTime();
      // إذا مر وقت كافٍ منذ آخر ضغطة مفتاح وهناك محتوى في المخزن المؤقت
      if (buffer.length > 3 && currentTime - lastKeyTime > timeout) {
        onScan(buffer);
        setBuffer("");
      }
    }, timeout);

    // إضافة مستمعي الأحداث
    window.addEventListener("keydown", handleKeyDown);

    // تنظيف المستمعين عند إزالة المكون
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(intervalId);
    };
  }, [buffer, lastKeyTime, onScan, timeout]);

  // هذا المكون لا يعرض أي واجهة مستخدم
  return null;
} 