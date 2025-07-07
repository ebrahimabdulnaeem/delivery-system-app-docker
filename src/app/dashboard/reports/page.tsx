"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import OrdersByStatusReport from "@/components/reports/OrdersByStatusReport";
import OrdersByCityReport from "@/components/reports/OrdersByCityReport";
import DriversPerformanceReport from "@/components/reports/DriversPerformanceReport";
import FinancialReport from "@/components/reports/FinancialReport";

export default function ReportsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">التقارير</h1>
        
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="status">الطلبات حسب الحالة</TabsTrigger>
            <TabsTrigger value="city">الطلبات حسب المدينة</TabsTrigger>
            <TabsTrigger value="drivers">أداء السائقين</TabsTrigger>
            <TabsTrigger value="financial">التقارير المالية</TabsTrigger>
          </TabsList>

          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>تقرير الطلبات حسب الحالة</CardTitle>
                <CardDescription>يعرض توزيع الطلبات حسب حالة التسليم</CardDescription>
              </CardHeader>
              <CardContent>
                <OrdersByStatusReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="city">
            <Card>
              <CardHeader>
                <CardTitle>تقرير الطلبات حسب المدينة</CardTitle>
                <CardDescription>يعرض توزيع الطلبات حسب المدن</CardDescription>
              </CardHeader>
              <CardContent>
                <OrdersByCityReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drivers">
            <Card>
              <CardHeader>
                <CardTitle>تقرير أداء السائقين</CardTitle>
                <CardDescription>يعرض أداء السائقين وعدد الطلبات المسلمة</CardDescription>
              </CardHeader>
              <CardContent>
                <DriversPerformanceReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>التقارير المالية</CardTitle>
                <CardDescription>يعرض تقارير المبالغ المحصلة والإيرادات</CardDescription>
              </CardHeader>
              <CardContent>
                <FinancialReport />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
} 