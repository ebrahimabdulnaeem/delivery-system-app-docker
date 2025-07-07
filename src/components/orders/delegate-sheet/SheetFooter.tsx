"use client";

import { SheetContentProps } from "./types";
import "./styles.css";

const SheetFooter = ({ driver, orders, calculateTotalCOD, formatCurrency }: Pick<SheetContentProps, 'driver' | 'orders' | 'calculateTotalCOD' | 'formatCurrency'>) => {
  // الحصول على تاريخ اليوم بالتنسيق العربي
  const today = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <div className="receipt-footer">
      <div className="receipt-title">إذن استلام شحنات</div>
      <div className="receipt-subtitle">إذن استلام</div>
      
      <div className="receipt-text">
        أنا / <span className="receipt-value">{driver.driver_name}</span> / مندوب تسليم مرتجعات / 
        الشحنات الموضحة بالجدول المرفق وعددها / <span className="receipt-value">{orders.length}</span> / 
        وقيمتها <span className="receipt-value">{formatCurrency(calculateTotalCOD())}</span>. 
        وأتعهد بالمحافظة عليها بالحالة التي تسلمتها عليها لحين توصيل ورد قيمتها المحصلة من العميل للشركة أو تسليمها كمرتجع للشركة بالحالة التي تسلمتها عليها الي الشركة وفي حالة الفقد دون مصوغ قانوني أكون متحملا المسئولية المدنية والجنائية قِبَل الشركة وهذا إقرار مني بالإستلام.
      </div>
      
      <div className="receipt-signature-row">
        <div className="receipt-signature-item">
          <span className="receipt-label">الاسم /</span>
          <span className="receipt-value">{driver.driver_name}</span>
        </div>
        <div className="receipt-signature-item">
          <span className="receipt-label">التوقيع /</span>
          <div className="receipt-signature-line"></div>
        </div>
        <div className="receipt-signature-item">
          <span className="receipt-label">التاريخ /</span>
          <span className="receipt-value">{today}</span>
        </div>
      </div>
    </div>
  );
};

export default SheetFooter;
