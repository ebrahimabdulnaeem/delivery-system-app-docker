"use client";

import { SheetContentProps } from "./types";
import PrintStyles from "./PrintStyles";
import SheetHeader from "./SheetHeader";
import OrdersTable from "./OrdersTable";
import SheetFooter from "./SheetFooter";
import "./styles.css";

const SheetContent = (props: SheetContentProps) => {
  const { driver, orders, calculateTotalCOD, formatCurrency, sheetId, dateFormatted, timeFormatted } = props;
  
  // CSS للطباعة - تم تحديثه ليتناسب مع التنسيق الجديد
  const printStylesCSS = `
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
      justify-content: center;
      align-items: center;
    }
    .barcode-container svg {
      max-height: 60px;
    }
    table.orders-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    table.orders-table th, 
    table.orders-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: center;
    }
    table.orders-table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    table.orders-table .total-row {
      font-weight: bold;
      background-color: #f0f0f0;
    }
    .signatures-container {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
      padding-top: 10px;
      position: relative;
    }
    .signatures-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      border-top: 1px dashed #ddd;
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
  `;
  
  // سكريبت الباركود والطباعة
  const barcodeScript = `
    // إنشاء الباركود باستخدام مكتبة JsBarcode
    window.onload = function() {
      // إنشاء عنصر canvas للباركود
      var canvas = document.createElement('canvas');
      document.getElementById('barcode-container').appendChild(canvas);
      
      // توليد الباركود
      JsBarcode(canvas, '${sheetId}', {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
        margin: 5
      });
      
      // طباعة النافذة تلقائيًا بعد التحميل
      window.print();
      window.onfocus = function() {
        setTimeout(function() {
          window.close();
        }, 500);
      };
    };
  `;
  
  return (
    <div className="print-container">
      <PrintStyles css={printStylesCSS} />
      <SheetHeader 
        sheetId={sheetId} 
        dateFormatted={dateFormatted} 
        timeFormatted={timeFormatted} 
        driver={driver}
        orders={orders}
      />
      <OrdersTable 
        orders={orders} 
        formatCurrency={formatCurrency} 
        calculateTotalCOD={calculateTotalCOD} 
      />
      <SheetFooter 
        driver={driver}
        orders={orders}
        formatCurrency={formatCurrency}
        calculateTotalCOD={calculateTotalCOD}
      />
      <script src="https://unpkg.com/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <script dangerouslySetInnerHTML={{ __html: barcodeScript }} />
    </div>
  );
};

export default SheetContent;
