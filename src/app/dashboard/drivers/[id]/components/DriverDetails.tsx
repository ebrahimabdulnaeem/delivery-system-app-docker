import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// واجهة السائق
interface Driver {
  id: string;
  driver_name: string;
  driver_id_number?: string | null;
  driver_phone: string;
  assigned_areas?: string[] | null;
  created_at: string;
  updated_at: string;
  orders?: {
    id: string;
    barcode: string;
    recipient_name: string;
    recipient_address: string;
    recipient_city: string;
    status: string;
    created_at: string;
    cod_amount: number;
  }[];
}

type DriverDetailsProps = {
  driver: Driver;
};

export function DriverDetails({ driver }: DriverDetailsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>معلومات السائق الأساسية</CardTitle>
          <CardDescription>البيانات الشخصية للسائق</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="font-medium text-gray-500">الاسم</dt>
              <dd className="mt-1">{driver.driver_name}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">رقم الهاتف</dt>
              <dd className="mt-1 font-medium" dir="ltr">{driver.driver_phone}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">رقم الهوية</dt>
              <dd className="mt-1">{driver.driver_id_number || "غير محدد"}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">تاريخ الإضافة</dt>
              <dd className="mt-1">{formatDate(driver.created_at)}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-medium text-gray-500">المناطق المعين لها</dt>
              <dd className="mt-1">
                {driver.assigned_areas && driver.assigned_areas.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {driver.assigned_areas.map((area, index) => (
                      <Badge key={index} variant="outline" className="bg-gray-100">
                        {area}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  "لا توجد مناطق معينة"
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الطلبات المسندة</CardTitle>
          <CardDescription>الطلبات التي تم إسنادها للسائق</CardDescription>
        </CardHeader>
        <CardContent>
          {driver.orders && driver.orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-right border">الباركود</th>
                    <th className="p-2 text-right border">اسم المستلم</th>
                    <th className="p-2 text-right border">المدينة</th>
                    <th className="p-2 text-right border">الحالة</th>
                    <th className="p-2 text-right border">المبلغ</th>
                    <th className="p-2 text-right border">تاريخ الإنشاء</th>
                  </tr>
                </thead>
                <tbody>
                  {driver.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="p-2 border">{order.barcode}</td>
                      <td className="p-2 border">{order.recipient_name}</td>
                      <td className="p-2 border">{order.recipient_city}</td>
                      <td className="p-2 border">
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
                      </td>
                      <td className="p-2 border">{order.cod_amount} جنيه مصري</td>
                      <td className="p-2 border">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              لا توجد طلبات مسندة لهذا السائق
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 