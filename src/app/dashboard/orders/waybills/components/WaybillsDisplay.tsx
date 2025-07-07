import Image from "next/image";
import Barcode from "react-barcode";

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

interface WaybillsDisplayProps {
  orders: Order[];
}

// مكون الباركود مع معالجة الأخطاء
const BarcodeWithErrorHandling = ({ value }: { value: string }) => {
  if (!value || value.trim() === '') {
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
        width={2}
        height={60}
        fontSize={10}
        margin={5}
        displayValue={false}
      />
    );
  } catch {
    return (
      <div className="text-sm text-red-500">
        {value} [خطأ في الباركود]
      </div>
    );
  }
};

// مكون عرض البوالص في واجهة المستخدم (ليس للطباعة)
export const WaybillsDisplay = ({ orders }: WaybillsDisplayProps) => {
  // تنسيق المبلغ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    try {
      const dateStr = dateString;
      const datePart = dateStr.split('T')[0];
      const [year, month, day] = datePart.split('-');
      
      // إنشاء سلسلة نصية منسقة باللغة العربية
      const formatter = new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
      
      // إنشاء كائن تاريخ يحدد اليوم فقط بدون تأثير المنطقة الزمنية
      return formatter.format(new Date(Number(year), Number(month) - 1, Number(day)));
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div 
          key={order.id} 
          className="border border-gray-300 p-4 rounded-md bg-white shadow-sm"
        >
          {/* الجزء العلوي: رقم البوليصة + الباركود + العلامة التجارية */}
          <div className="flex justify-between items-start mb-4">
            {/* شعار الشركة */}
            <div className="w-16 h-16 rounded overflow-hidden">
              <Image 
                src="/images/belladonna-logo.png" 
                alt="شعار الشركة" 
                width={64}
                height={64}
                className="object-contain"
              />
            </div>

            {/* رقم البوليصة والتاريخ */}
            <div className="text-center">
              <div className="text-xl font-bold">{order.barcode}</div>
              <div className="text-sm text-gray-500">{formatDate(order.order_date)}</div>
            </div>

            {/* الباركود */}
            <div className="w-40">
              <div style={{ transform: 'scale(0.9)' }}>
                <BarcodeWithErrorHandling value={order.barcode} />
              </div>
            </div>
          </div>
          
          {/* معلومات العميل والطلب */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* العمود الأول: المستلم والعنوان ومبلغ الدفع */}
            <div className="space-y-2">
              <div>
                <span className="font-bold ml-1">اسم المستلم:</span>
                <span>{order.recipient_name}</span>
              </div>
              
              <div>
                <span className="font-bold ml-1">العنوان:</span>
                <span>{order.recipient_city} - {order.recipient_address}</span>
              </div>
              
              <div>
                <span className="font-bold ml-1">مبلغ الدفع عند الاستلام:</span>
                <span className="text-lg font-bold">{formatCurrency(order.cod_amount)}</span>
              </div>
            </div>
            
            {/* العمود الثاني: أرقام الهواتف والتفاصيل الإضافية */}
            <div className="space-y-2">
              <div>
                <span className="font-bold ml-1">الهاتف:</span>
                <span dir="ltr">{order.recipient_phone1}</span>
              </div>
              
              {order.recipient_phone2 && (
                <div>
                  <span className="font-bold ml-1">هاتف بديل:</span>
                  <span dir="ltr">{order.recipient_phone2}</span>
                </div>
              )}
              
              <div>
                <span className="font-bold ml-1">المدينة:</span>
                <span>{order.recipient_city}</span>
              </div>
              
              <div>
                <span className="font-bold ml-1">تفاصيل الطلب:</span>
                <span>{order.order_description || 'لا يوجد'}</span>
              </div>
              
              {order.special_instructions && (
                <div>
                  <span className="font-bold ml-1">تعليمات خاصة:</span>
                  <span>{order.special_instructions}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WaybillsDisplay; 