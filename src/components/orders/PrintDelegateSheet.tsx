"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, Save } from "lucide-react";
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
  formatCurrency,
  onSave,
}: PrintDelegateSheetProps & { onSave: () => Promise<boolean> }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const saveAndPrint = async () => {
    setIsProcessing(true);

    try {
      // أولاً: حفظ البوالص للمندوب
      const saveResult = await onSave();
      
      if (!saveResult) {
        toast.error("فشل في حفظ البوالص للمندوب");
        setIsProcessing(false);
        return;
      }
      
      toast.success("تم حفظ البوالص للمندوب بنجاح");
      
      // ثانياً: إنشاء نافذة الطباعة ومحتواها
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        toast.error("يرجى السماح بالنوافذ المنبثقة للطباعة");
        setIsProcessing(false);
        return;
      }
    
    // إنشاء معرف فريد للشيت مكون من 10 أرقام فقط
    // الرقمين الأولين يمثلان رقم المندوب (مع إضافة صفر إذا كان رقم المندوب مكون من رقم واحد)
    // الأرقام الثمانية المتبقية تمثل الطابع الزمني
    // التأكد من أن معرف المندوب يحتوي على أرقام فقط
    const driverId = String(driver.id).replace(/[^0-9]/g, '');
    const driverIdPadded = driverId.padStart(2, '0').slice(0, 2);
    const timestamp = Date.now().toString().slice(-8);
    const sheetBarcode = `${driverIdPadded}${timestamp}`;
    
    // حفظ الشيت في قاعدة البيانات
    try {
      // تجميع معرفات الطلبات
      const orderIds = orders.map(order => order.id);
      
      // إرسال البيانات إلى API
      const response = await fetch('/api/delegate-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId: driver.id,
          orders: orderIds,
          sheetBarcode: sheetBarcode,
          totalAmount: calculateTotalCOD(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('فشل في حفظ الشيت في قاعدة البيانات:', errorData);
        // نستمر في الطباعة حتى لو فشل الحفظ في قاعدة البيانات
      }
    } catch (error) {
      console.error('خطأ في حفظ الشيت في قاعدة البيانات:', error);
      // نستمر في الطباعة حتى لو فشل الحفظ في قاعدة البيانات
    }

    // الحصول على التاريخ والوقت الحالي
    const currentDate = new Date();
    const dateFormatted = currentDate.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeFormatted = currentDate.toLocaleTimeString('ar-EG');

    // إنشاء محتوى HTML للطباعة
    const printContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>شيت المندوب - ${driver.driver_name}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 1cm;
            }
          }
          body {
            font-family: 'Arial', sans-serif;
            direction: rtl;
            padding: 20px;
          }
          .print-container {
            width: 100%;
          }
          
          /* أنماط الرأس الجديدة */
          .header-container {
            margin-bottom: 20px;
          }
          .header-top {
            text-align: center;
            margin-bottom: 10px;
          }
          .sheet-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .print-date {
            font-size: 12px;
            color: #666;
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .driver-info-box {
            border: 1px solid #ddd;
            padding: 10px;
            width: 60%;
          }
          .barcode-box {
            width: 35%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          #barcode-container {
            width: 100%;
            text-align: center;
            margin-bottom: 10px;
          }
          
          .sheet-id {
            margin-top: 10px;
            font-size: 14px;
            text-align: center;
            font-weight: bold;
            display: block;
            width: 100%;
          }
          
          /* أنماط الجدول الجديدة */
          table.orders-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            table-layout: fixed;
            direction: rtl;
          }
          
          /* تحديد عرض الأعمدة */
          table.orders-table th:nth-child(1) {
            width: 5%;  /* رقم */
          }
          
          table.orders-table th:nth-child(2) {
            width: 45%; /* البيانات والباركود */
          }
          
          table.orders-table th:nth-child(3) {
            width: 15%; /* التوقيع */
          }
          
          table.orders-table th:nth-child(4) {
            width: 20%; /* تعليمات خاصة */
          }
          
          table.orders-table th:nth-child(5) {
            width: 15%; /* المبلغ */
          }
          table.orders-table th, 
          table.orders-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
          }
          table.orders-table th {
            background-color: transparent;
            font-weight: bold;
            border-bottom: 2px solid #000;
          }
          table.orders-table .total-row {
            font-weight: bold;
            background-color: transparent;
            border-top: 2px solid #000;
          }
          
          table.orders-table .total-row td:first-child {
            text-align: left;
            padding-left: 15px;
          }
          
          /* أنماط الخلية المدمجة */
          .combined-cell {
            padding: 5px;
            vertical-align: top;
            text-align: right;
            width: 45%;
          }
          .barcode-container {
            width: 100%;
            margin-bottom: 10px;
            text-align: center;
          }
          canvas {
            display: block;
            margin: 0 auto;
            width: 80%;
            height: 40px;
            image-rendering: -webkit-optimize-contrast; /* For Edge/Chrome */
            image-rendering: crisp-edges; /* For Firefox */
            image-rendering: pixelated; /* For Safari */
            -ms-interpolation-mode: nearest-neighbor; /* For IE */
          }
          
          /* أنماط خلية الباركود */
          .barcode-cell {
            padding: 5px 2px;
            vertical-align: middle;
            width: 15%;
          }
          canvas {
            display: block;
            margin: 0 auto;
            max-width: 100%;
            height: auto;
          }
          .barcode-text {
            font-size: 14px;
            text-align: center;
            margin-top: 5px;
            font-weight: bold;
            font-family: monospace;
            letter-spacing: 1px;
            color: #000;
            background-color: transparent;
            padding: 3px 5px;
            border: 1px solid #ddd;
            display: inline-block;
            margin-left: auto;
            margin-right: auto;
            width: auto;
          }
          
          /* أنماط خلية البيانات */
          .customer-data-cell {
            vertical-align: top;
            text-align: right;
            padding: 5px;
            width: 30%;
          }
          .customer-data {
            font-size: 14px;
            border-top: 1px dashed #ddd;
            padding-top: 8px;
            margin-top: 8px;
            text-align: right;
            direction: rtl;
          }
          
          .data-row {
            margin-bottom: 5px;
            line-height: 1.5;
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
          }
          
          .recipient-name {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          
          .recipient-phone {
            font-size: 15px;
            font-weight: 500;
            margin-bottom: 6px;
          }
          
          .recipient-address {
            font-size: 15px;
            line-height: 1.6;
            margin-top: 4px;
          }
          
          .data-label {
            font-weight: bold;
            margin-left: 5px;
            min-width: 100px;
            display: inline-block;
          }
          /* تم تعريف .data-row بالفعل في الأعلى */
          .signature-box-print {
            border: 1px solid #ddd;
            height: 60px;
            width: 100%;
            margin: 0 auto;
          }
          /* تم تعريف .data-label بالفعل في الأعلى */
          
          /* أنماط خلية التوقيع */
          .signature-cell {
            width: 15%;
            vertical-align: middle;
            padding: 5px;
          }
          .signature-box-print {
            border: 1px solid #000;
            height: 80px;
            width: 100%;
          }
          
          /* أنماط خلية التعليمات */
          .instructions-cell {
            width: 25%;
            font-size: 16px;
            vertical-align: top;
            padding: 8px;
            text-align: right;
            line-height: 1.6;
            font-weight: 700;
            color: #000;
            white-space: pre-line;
          }
          
          /* أنماط خلية المبلغ */
          .amount-cell {
            width: 10%;
            font-weight: bold;
            vertical-align: middle;
          }
          
          /* أنماط التوقيعات الجديدة */
          .signatures-container {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
          }
          .signature-box {
            width: 45%;
            text-align: center;
          }
          .signature-title {
            margin-bottom: 10px;
            font-weight: bold;
          }
          .signature-line {
            margin: 40px auto 0;
            width: 100%;
            border-top: 1px solid #000;
          }
        </style>
        <script src="https://unpkg.com/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      </head>
      <body>
        <div class="print-container">
          <!-- رأس الشيت الجديد -->
          <div class="header-container">
            <div class="header-top">
              <div class="sheet-title">شيت تسليم المندوب</div>
              <div class="print-date">تاريخ الطباعة: ${dateFormatted} - ${timeFormatted}</div>
            </div>
            
            <div class="header-content">
              <div class="driver-info-box">
                <div>المندوب: ${driver.driver_name}</div>
                <div>رقم الهاتف: ${driver.driver_phone}</div>
                <div>تاريخ اليوم: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div>عدد الشحنات: ${orders.length}</div>
              </div>
              
              <div class="barcode-box">
                <canvas id="barcode-container"></canvas>
                <span class="sheet-id">رقم الشيت: ${sheetBarcode}</span>
              </div>
            </div>
          </div>
          
          <!-- جدول الطلبات الجديد -->
          <table class="orders-table">
            <thead>
              <tr>
                <th>#</th>
                <th>البيانات والباركود</th>
                <th>التوقيع</th>
                <th>تعليمات خاصة</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map((order, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td class="combined-cell">
                    <div class="barcode-container">
                      <canvas id="order-barcode-${index}"></canvas>
                      <div class="barcode-text">${order.barcode.replace(/[^0-9]/g, '').slice(0, 10)}</div>
                    </div>
                    <div class="customer-data">
                      <div class="data-row recipient-name"><span class="data-label">العميل:</span> ${order.recipient_name}</div>
                      <div class="data-row recipient-phone"><span class="data-label">موبايل العميل:</span> ${order.recipient_phone1}</div>
                      ${order.recipient_phone2 ? `<div class="data-row recipient-phone"><span class="data-label">موبايل 2:</span> ${order.recipient_phone2}</div>` : ''}
                      <div class="data-row recipient-address"><span class="data-label">عنوان العميل:</span> ${order.recipient_city} - ${order.recipient_address}</div>
                    </div>
                  </td>
                  <td class="signature-cell">
                    <div class="signature-box-print"></div>
                  </td>
                  <td class="instructions-cell">
                    ${order.special_instructions || "-"}
                  </td>
                  <td class="amount-cell">
                    ${formatCurrency(order.cod_amount)}
                  </td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4">الإجمالي:</td>
                <td>${formatCurrency(calculateTotalCOD())}</td>
              </tr>
            </tbody>
          </table>
          
          <!-- ذيل الشيت الجديد -->
          <div class="receipt-footer">
            <div class="receipt-title">إذن استلام شحنات</div>
            <div class="receipt-subtitle">إذن استلام</div>
            
            <div class="receipt-text">
              أنا / <span class="receipt-value">${driver.driver_name}</span> / مندوب تسليم مرتجعات / 
              الشحنات الموضحة بالجدول المرفق وعددها / <span class="receipt-value">${orders.length}</span> / 
              وقيمتها <span class="receipt-value">${formatCurrency(calculateTotalCOD())}</span>. 
              وأتعهد بالمحافظة عليها بالحالة التي تسلمتها عليها لحين توصيل ورد قيمتها المحصلة من العميل للشركة أو تسليمها كمرتجع للشركة بالحالة التي تسلمتها عليها الي الشركة وفي حالة الفقد دون مصوغ قانوني أكون متحملا المسئولية المدنية والجنائية قِبَل الشركة وهذا إقرار مني بالإستلام.
            </div>
            
            <div class="receipt-signature-row">
              <div class="receipt-signature-item">
                <span class="receipt-label">الاسم /</span>
                <span class="receipt-value">${driver.driver_name}</span>
              </div>
              <div class="receipt-signature-item">
                <span class="receipt-label">التوقيع /</span>
                <div class="receipt-signature-line"></div>
              </div>
              <div class="receipt-signature-item">
                <span class="receipt-label">التاريخ /</span>
                <span class="receipt-value">${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          // تنفيذ هذا السكريبت عند تحميل الصفحة
          window.onload = function() {
            // توليد الباركود الرئيسي (أرقام فقط)
            // التأكد من أن معرف الشيت يحتوي على أرقام فقط
            const numericSheetId = "${sheetBarcode}".replace(/[^0-9]/g, '').slice(0, 10);
            JsBarcode("#barcode-container", numericSheetId, {
              format: "CODE128",
              width: 2,
              height: 60,
              displayValue: false,
              fontSize: 14,
              margin: 10,
              lineColor: "#000000",
              background: "#ffffff"
            });
            
            // توليد باركود لكل شحنة في الجدول (أرقام فقط بحد أقصى 10 أرقام)
            ${orders.map((order, index) => {
              // استخراج الأرقام فقط من الباركود وأخذ أول 10 أرقام
              const numericBarcode = order.barcode.replace(/[^0-9]/g, '').slice(0, 10);
              return `
              JsBarcode("#order-barcode-${index}", "${numericBarcode}", {
                format: "CODE128",
                width: 1.5,
                height: 40,
                displayValue: false,
                fontSize: 12,
                margin: 8,
                lineColor: "#000000",
                background: "#ffffff"
              });`;
            }).join('')}
            
            // إغلاق النافذة بعد الطباعة
            window.onafterprint = function() {
              setTimeout(function() {
                window.close();
              }, 500);
            };
            
            // طباعة الصفحة تلقائيًا بعد تحميل الباركودات
            setTimeout(function() {
              window.print();
            }, 1000); // انتظار ثانية واحدة للتأكد من تحميل الباركودات
          };
        </script>
      </body>
      </html>
    `;

    // كتابة محتوى HTML في نافذة الطباعة
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();

    setIsProcessing(false);
  } catch (error) {
    console.error('خطأ في العملية:', error);
    toast.error('حدث خطأ أثناء العملية. يرجى المحاولة مرة أخرى.');
    setIsProcessing(false);
  }
};
  
return (
  <Button
    onClick={saveAndPrint}
    variant="default"
    size="sm"
    className="px-4 gap-2"
    disabled={isProcessing || orders.length === 0}
  >
    {isProcessing ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري الحفظ والطباعة...
      </>
    ) : (
      <>
        <Save className="h-4 w-4 mr-1" />
        <Printer className="h-4 w-4" />
        حفظ وطباعة الشيت
      </>
    )}
  </Button>
);
}