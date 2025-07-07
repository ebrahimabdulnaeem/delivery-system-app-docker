import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, CheckCircle, XCircle, Truck, Clock, Clipboard } from "lucide-react";

type StatusSummaryProps = {
  summary: {
    total: number;
    entered: number;
    assigned: number;
    out_for_delivery: number;
    delivered: number;
    partial_return: number;
    full_return: number;
  };
};

export function StatusSummary({ summary }: StatusSummaryProps) {
  // حساب النسب المئوية
  const getPercentage = (value: number) => {
    return summary.total > 0 ? Math.round((value / summary.total) * 100) : 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ملخص الحالة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* إجمالي الطلبات */}
          <div className="bg-muted rounded-lg p-4 flex items-center space-x-4 space-x-reverse">
            <div className="bg-primary/10 p-2 rounded-full">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
              <h4 className="text-2xl font-bold">{summary.total}</h4>
            </div>
          </div>

          {/* طلبات جديدة (مدخلة) */}
          <div className="bg-gray-50 dark:bg-gray-900/10 rounded-lg p-4 flex items-center space-x-4 space-x-reverse">
            <div className="bg-gray-100 dark:bg-gray-900/20 p-2 rounded-full">
              <Clipboard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600/70 dark:text-gray-400/70">مدخل</p>
              <h4 className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {summary.entered}
                <span className="text-sm font-normal text-gray-600/70 dark:text-gray-400/70 mr-1">
                  ({getPercentage(summary.entered)}%)
                </span>
              </h4>
            </div>
          </div>

          {/* طلبات معينة لمندوب */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 flex items-center space-x-4 space-x-reverse">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-600/70 dark:text-blue-400/70">معين لسائق</p>
              <h4 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {summary.assigned}
                <span className="text-sm font-normal text-blue-600/70 dark:text-blue-400/70 mr-1">
                  ({getPercentage(summary.assigned)}%)
                </span>
              </h4>
            </div>
          </div>

          {/* طلبات قيد التوصيل */}
          <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-4 flex items-center space-x-4 space-x-reverse">
            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-full">
              <Truck className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-yellow-600/70 dark:text-yellow-400/70">قيد التوصيل</p>
              <h4 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {summary.out_for_delivery}
                <span className="text-sm font-normal text-yellow-600/70 dark:text-yellow-400/70 mr-1">
                  ({getPercentage(summary.out_for_delivery)}%)
                </span>
              </h4>
            </div>
          </div>

          {/* طلبات تم تسليمها */}
          <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 flex items-center space-x-4 space-x-reverse">
            <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-green-600/70 dark:text-green-400/70">تم التسليم</p>
              <h4 className="text-2xl font-bold text-green-600 dark:text-green-400">
                {summary.delivered}
                <span className="text-sm font-normal text-green-600/70 dark:text-green-400/70 mr-1">
                  ({getPercentage(summary.delivered)}%)
                </span>
              </h4>
            </div>
          </div>

          {/* طلبات إرجاع جزئي */}
          <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-4 flex items-center space-x-4 space-x-reverse">
            <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded-full">
              <XCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-orange-600/70 dark:text-orange-400/70">إرجاع جزئي</p>
              <h4 className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {summary.partial_return}
                <span className="text-sm font-normal text-orange-600/70 dark:text-orange-400/70 mr-1">
                  ({getPercentage(summary.partial_return)}%)
                </span>
              </h4>
            </div>
          </div>

          {/* طلبات إرجاع كامل */}
          <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 flex items-center space-x-4 space-x-reverse">
            <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded-full">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-red-600/70 dark:text-red-400/70">إرجاع كامل</p>
              <h4 className="text-2xl font-bold text-red-600 dark:text-red-400">
                {summary.full_return}
                <span className="text-sm font-normal text-red-600/70 dark:text-red-400/70 mr-1">
                  ({getPercentage(summary.full_return)}%)
                </span>
              </h4>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 