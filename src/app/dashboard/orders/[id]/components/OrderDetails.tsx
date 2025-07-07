import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

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
  drivers?: {
    id: string;
    driver_name: string;
    driver_phone: string;
  } | null;
  users?: {
    id: string;
    username: string;
    email: string;
    role: string;
  } | null;
}

type OrderDetailsProps = {
  order: Order;
};

export function OrderDetails({ order }: OrderDetailsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>معلومات الطلب الأساسية</CardTitle>
          <CardDescription>بيانات الطلب والمعرفات الخاصة به</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="font-medium text-gray-500">رقم الطلب</dt>
              <dd className="mt-1">{order.id}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">الباركود</dt>
              <dd className="mt-1">{order.barcode}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">تاريخ الطلب</dt>
              <dd className="mt-1">{formatDate(order.order_date)}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">مرجع المرسل</dt>
              <dd className="mt-1">{order.sender_reference || "غير محدد"}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">مبلغ الدفع عند الاستلام</dt>
              <dd className="mt-1">{order.cod_amount} ريال</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">عدد القطع</dt>
              <dd className="mt-1">{order.number_of_pieces || 1}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-medium text-gray-500">وصف الطلب</dt>
              <dd className="mt-1">{order.order_description || "لا يوجد وصف"}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-medium text-gray-500">تعليمات خاصة</dt>
              <dd className="mt-1">{order.special_instructions || "لا توجد تعليمات خاصة"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>معلومات المستلم</CardTitle>
          <CardDescription>بيانات الشخص المستلم للطلب</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="font-medium text-gray-500">اسم المستلم</dt>
              <dd className="mt-1">{order.recipient_name}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">المدينة</dt>
              <dd className="mt-1">{order.recipient_city}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">رقم الهاتف الأساسي</dt>
              <dd className="mt-1 font-medium" dir="ltr">{order.recipient_phone1}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">رقم الهاتف الإضافي</dt>
              <dd className="mt-1" dir="ltr">{order.recipient_phone2 || "لا يوجد"}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-medium text-gray-500">العنوان</dt>
              <dd className="mt-1">{order.recipient_address}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>معلومات التوصيل</CardTitle>
          <CardDescription>بيانات حالة الطلب والسائق</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="font-medium text-gray-500">حالة الطلب</dt>
              <dd className="mt-1">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'entered' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                  order.status === 'out_for_delivery' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'partial_return' ? 'bg-orange-100 text-orange-800' :
                  order.status === 'full_return' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status === 'delivered' ? 'تم التسليم' :
                   order.status === 'entered' ? 'مدخل' :
                   order.status === 'assigned' ? 'معين لسائق' :
                   order.status === 'out_for_delivery' ? 'قيد التوصيل' :
                   order.status === 'partial_return' ? 'إرجاع جزئي' :
                   order.status === 'full_return' ? 'إرجاع كامل' :
                   order.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">السائق المعين</dt>
              <dd className="mt-1">{order.drivers ? order.drivers.driver_name : "لا يوجد سائق معين"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>معلومات إضافية</CardTitle>
          <CardDescription>بيانات إضافية عن الطلب</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="font-medium text-gray-500">تم إنشاؤه بواسطة</dt>
              <dd className="mt-1">{order.users ? order.users.username : "غير معروف"}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">البريد الإلكتروني للمنشئ</dt>
              <dd className="mt-1">{order.users ? order.users.email : "غير معروف"}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">تاريخ الإنشاء</dt>
              <dd className="mt-1">{formatDate(order.created_at)}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">آخر تحديث</dt>
              <dd className="mt-1">{formatDate(order.updated_at)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
} 