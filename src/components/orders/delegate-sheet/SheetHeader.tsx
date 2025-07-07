"use client";

import { SheetContentProps } from "./types";
import "./styles.css";

const SheetHeader = ({ sheetId, dateFormatted, timeFormatted, driver, orders }: Pick<SheetContentProps, 'sheetId' | 'dateFormatted' | 'timeFormatted' | 'driver' | 'orders'>) => {
  // الحصول على تاريخ اليوم بالتنسيق العربي
  const today = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // حساب عدد الشحنات
  const ordersCount = orders.length;
  
  return (
    <div className="header-container">
      <div className="header-top">
        <div className="sheet-title">شيت تسليم المندوب</div>
        <div className="print-date">تاريخ الطباعة: {dateFormatted} - {timeFormatted}</div>
      </div>
      
      <div className="header-content">
        <div className="driver-info-box">
          <div>المندوب: {driver.driver_name}</div>
          <div>رقم الهاتف: {driver.driver_phone}</div>
          <div>تاريخ اليوم: {today}</div>
          <div>عدد الشحنات: {ordersCount}</div>
        </div>
        
        <div className="barcode-box">
          <div id="barcode-container"></div>
          <div className="sheet-id">{sheetId}</div>
        </div>
      </div>
    </div>
  );
};

export default SheetHeader;
