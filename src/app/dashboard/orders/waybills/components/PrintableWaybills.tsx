import { useEffect, useState } from "react";
import Barcode from "react-barcode";
import Image from "next/image";

// نمط CSS للطباعة - سيتم تضمينه في المكون
const printStyles = `
  @media print {
    /* إخفاء جميع العناصر باستثناء محتوى الطباعة */
    body * {
      visibility: hidden;
    }
    #print-container, #print-container * {
      visibility: visible;
    }
    #print-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      margin: 0;
      padding: 0;
    }
    
    /* إخفاء العناصر غير المطلوبة عند الطباعة */
    .no-print {
      display: none !important;
    }
    
    /* إعداد خصائص الصفحة */
    @page {
      size: A4 portrait;
      margin: 0.3cm;
    }
    
    /* ضمان فاصل صفحة بعد كل مجموعة من 4 بوالص */
    .page-break {
      clear: both;
      page-break-after: always;
      page-break-inside: avoid;
      margin: 0;
      padding: 0;
      height: 0;
    }
    
    /* ضمان تقسيم البوليصة الواحدة على صفحتين */
    .waybill {
      page-break-inside: avoid !important;
      box-sizing: border-box;
      height: 24vh !important; /* ضبط ارتفاع ثابت لكل بوليصة */
      max-height: 24vh !important;
      min-height: 24vh !important;
      overflow: hidden !important;
      break-inside: avoid;
      margin-bottom: 0.1cm !important;
      position: relative;
      display: flex !important;
      flex-direction: column !important;
    }
    
    /* حاوية البوالص مع تنسيق الشبكة لضمان توزيع متساوٍ */
    .waybills-container {
      display: grid;
      grid-template-rows: repeat(4, 1fr);
      height: 98vh !important; /* ضبط ارتفاع كلي أقل من ارتفاع الصفحة */
      gap: 0.15cm !important; /* تقليل المسافة بين البوالص */
      padding: 0;
      margin: 0;
      page-break-inside: avoid;
    }
    
    /* ضمان وجود 4 بوالص فقط في كل صفحة */
    #print-container > div {
      height: 100vh;
      page-break-after: always;
      overflow: hidden;
    }
    
    /* تحسين ظهور النصوص */
    .text-xs {
      font-size: 10px !important;
      line-height: 1.3 !important;
    }
    
    .text-sm {
      font-size: 12px !important;
      line-height: 1.4 !important;
    }
    
    .text-base {
      font-size: 14px !important;
      line-height: 1.5 !important;
    }

    .font-bold {
      font-weight: 700 !important;
    }

    /* تنسيق الباركود */
    .barcode-container {
      width: 45% !important;
      max-height: 2cm !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-end !important;
      justify-content: center !important;
    }
    
    .barcode-container svg {
      max-width: 100% !important;
      height: auto !important;
      max-height: 1.5cm !important;
    }

    /* تنسيق عناصر معلومات الاتصال */
    .contact-info-container {
      display: flex !important;
      flex-wrap: wrap !important;
      width: 100% !important;
      justify-content: flex-start !important;
      align-items: center !important; 
    }

    .waybill-info-item {
      display: inline-block !important;
      margin-left: 0.5cm !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      max-width: 7cm !important;
    }
    
    /* تنسيق خطوط فواصل البوليصة */
    .waybill-divider {
      border-top: 1px solid #ddd;
      margin: 0.15cm 0;
      width: 100%;
    }
    
    /* تنسيق ترقيم الصفحات */
    .page-number {
      position: absolute;
      bottom: 0.2cm;
      width: 100%;
      text-align: center;
      font-size: 8pt;
      color: #888;
    }

    /* تنسيق هيكل البوليصة الجديد */
    .waybill-new-layout {
      display: flex !important;
      flex-direction: column !important;
      height: 100% !important;
      border: 1px solid #000;
      border-radius: 0;
      overflow: hidden;
    }

    .waybill-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.1cm 0.5cm;
      border-bottom: 1px solid #000;
      height: 1.9cm !important;
      max-height: 1.9cm !important;
      min-height: 1.9cm !important;
      flex-shrink: 0 !important;
    }

    /* تنسيق خاص للوجو الشركة */
    .company-logo {
      width: 1.8cm !important;
      height: 1.8cm !important;
      position: relative !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-right: 0.5cm !important;
    }

    /* عنصر الباركود واللوجو */
    .barcode-logo-container {
      display: flex !important;
      flex-direction: row-reverse !important;
      align-items: center !important;
      justify-content: flex-start !important;
      width: 100% !important;
    }

    /* تنسيق خاص لحاوية الباركود */
    .barcode-container {
      max-height: 1.8cm !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      width: 60% !important;
    }
    
    .barcode-container svg {
      max-width: 100% !important;
      height: auto !important;
      max-height: 1.5cm !important;
    }
    
    /* تنسيق رقم الباركود والتاريخ */
    .barcode-number {
      font-size: 11px !important;
      text-align: center !important;
      direction: ltr !important;
      margin-top: 0.1cm !important;
      white-space: nowrap !important;
      width: 100% !important;
    }
    
    /* تنسيق خاص لعرض الباركود ورقمه معاً */
    .barcode-display {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      width: 100% !important;
    }

    /* تنسيق خاص للعنوان للسماح بتعدد الأسطر */
    .address-value {
      display: inline !important;
      white-space: normal !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      line-height: 1.2 !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .address-label {
      font-weight: bold !important;
      display: inline !important;
      margin-left: 0.2cm !important;
    }

    .waybill-info-row {
      display: flex !important;
      justify-content: space-between !important;
      padding: 0.1cm 0.5cm !important;
      border-bottom: 1px solid #000 !important;
      height: 1.2cm !important;
      max-height: 1.2cm !important;
      min-height: 1.2cm !important;
      flex-shrink: 0 !important;
    }

    .waybill-payment-row {
      padding: 0.1cm 0.5cm;
      height: 1.1cm !important;
      min-height: 1.1cm !important;
      max-height: 1.1cm !important;
      overflow: hidden !important;
      flex-shrink: 0 !important;
    }

    .waybill-label {
      font-weight: bold;
      display: inline;
    }

    .waybill-value {
      display: inline;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* تنسيق خاص لاسم المستلم */
    .recipient-name-container {
      display: flex;
      align-items: center;
      width: 55%;
      overflow: hidden;
    }
    
    .recipient-name-value {
      display: inline-block !important;
      width: 90% !important;
      overflow-wrap: break-word !important;
      word-wrap: break-word !important;
      white-space: normal !important;
      line-height: 1.1 !important;
      max-height: 1.7cm !important;
      overflow: hidden !important;
    }

    /* تنسيق خاص لاسم المستلم في الصف العلوي */
    .header-recipient-name {
      width: 40% !important;
      text-align: right !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      height: 100% !important;
      overflow: hidden !important;
    }

    /* تنسيق لمبلغ الدفع */
    .payment-amount {
      font-weight: bold !important;
      display: inline-block !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      max-width: 50% !important;
    }

    .waybill-address-row {
      padding: 0.1cm 0.5cm;
      border-bottom: 1px solid #000;
      min-height: 1.3cm !important;
      max-height: 2.4cm !important;
      overflow: hidden !important;
      display: block !important;
      flex-grow: 1 !important;
      flex-shrink: 1 !important;
    }

    .waybill-details-row {
      padding: 0.1cm 0.5cm;
      border-bottom: 1px solid #000;
      min-height: 1cm !important;
      max-height: 1.2cm !important;
      overflow: hidden !important;
      flex-shrink: 0 !important;
    }
  }
`;

// واجهة الطلب
interface Order {
  id: string;
  barcode: string;
  order_date: string;
  recipient_name: string;
  recipient_phone1: string;
  recipient_phone2?: string | null;
  recipient_address: string;
  recipient_city: string;
  cod_amount: number;
  order_description?: string | null;
  special_instructions?: string | null;
  sender_reference?: string | null;
  number_of_pieces?: number | null;
  status: string;
  driver_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface PrintableWaybillsProps {
  orders: Order[];
  waybillsPerPage?: number;
}

// مكون الباركود مع معالجة الأخطاء
const BarcodeWithErrorHandling = ({ value }: { value: string }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!value || value.trim() === '') {
      setHasError(true);
    } else {
      setHasError(false);
    }
  }, [value]);

  if (hasError) {
    return (
      <div className="text-sm text-red-500">
        {value} [بدون باركود]
      </div>
    );
  }

  try {
    return (
      <Barcode
        value={value}
        format="CODE128"
        width={1.5}
        height={60}
        fontSize={9}
        margin={0}
        displayValue={false}
      />
    );
  } catch (error) {
    console.error('خطأ في إنشاء الباركود:', error);
    return (
      <div className="text-sm text-red-500">
        {value} [خطأ في الباركود]
      </div>
    );
  }
};

export const PrintableWaybills = ({ orders, waybillsPerPage = 4 }: PrintableWaybillsProps) => {
  // إضافة أنماط CSS للطباعة
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = printStyles;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // تنسيق المبلغ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // تقسيم الطلبات إلى صفحات
  const getWaybillPages = () => {
    if (!orders.length) return [];
    
    const pages: Order[][] = [];
    
    // تحديد عدد البوالص في كل صفحة بدقة ليكون 4
    for (let i = 0; i < orders.length; i += waybillsPerPage) {
      // ضمان عدم تجاوز آخر صفحة للعدد المحدد
      const pageOrders = orders.slice(i, i + waybillsPerPage);
      pages.push(pageOrders);
    }
    
    return pages;
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    try {
      const dateStr = dateString;
      const datePart = dateStr.split('T')[0];
      const [year, month, day] = datePart.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div id="print-container" className="space-y-0">
      {getWaybillPages().map((pageOrders, pageIndex) => (
        <div key={pageIndex} className={pageIndex > 0 ? "page-break" : ""}>
          {/* بوالص الصفحة */}
          <div className="grid grid-cols-1 gap-2 bg-white p-4 print:p-0 waybills-container">
            {pageOrders.map((order) => (
              <div 
                key={order.id} 
                className="waybill waybill-new-layout"
              >
                {/* صف الباركود واللوجو واسم المستلم */}
                <div className="waybill-header-row">
                  <div className="header-recipient-name">
                    <span className="waybill-label">اسم المستلم: </span>
                    <span className="recipient-name-value">{order.recipient_name}</span>
                  </div>
                  <div className="barcode-logo-container">
                    <div className="company-logo">
                      <Image 
                        src="/images/belladonna-logo.png" 
                        alt="شعار الشركة" 
                        width={64}
                        height={64}
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                    <div className="barcode-container">
                      <div className="barcode-display">
                        <BarcodeWithErrorHandling value={order.barcode} />
                        <div className="barcode-number">
                          {order.barcode} {formatDate(order.order_date)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* صف الهواتف والمدينة */}
                <div className="waybill-info-row">
                  <div className="contact-info-container">
                    <div className="waybill-info-item">
                      <span className="waybill-label">الهاتف: </span>
                      <span className="waybill-value">{order.recipient_phone1}</span>
                    </div>
                    {order.recipient_phone2 && (
                      <div className="waybill-info-item">
                        <span className="waybill-label">هاتف بديل: </span>
                        <span className="waybill-value">{order.recipient_phone2}</span>
                      </div>
                    )}
                    <div className="waybill-info-item">
                      <span className="waybill-label">المدينة: </span>
                      <span className="waybill-value">{order.recipient_city}</span>
                    </div>
                  </div>
                </div>
                
                {/* صف العنوان */}
                <div className="waybill-address-row">
                  <span className="address-label">العنوان:</span>{" "}
                  <span className="address-value">
                    {order.recipient_city} - {order.recipient_address}
                  </span>
                </div>

                {/* صف تفاصيل الطلب */}
                <div className="waybill-details-row">
                  <span className="waybill-label">تفاصيل الطلب: </span>
                  <span className="waybill-value">
                    {order.order_description || 'لا يوجد'}
                    {order.special_instructions && ` - ${order.special_instructions}`}
                  </span>
                </div>

                {/* صف مبلغ الدفع */}
                <div className="waybill-payment-row">
                  <span className="waybill-label">مبلغ الدفع عند الاستلام: </span>
                  <span className="payment-amount">{formatCurrency(order.cod_amount)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ترقيم الصفحة */}
          <div className="text-center mt-2 text-sm text-gray-500 print:visible page-number">
            صفحة {pageIndex + 1} من {getWaybillPages().length}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PrintableWaybills; 