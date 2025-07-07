"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Download, Upload, FileSpreadsheet, Database, FileX, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function DataManagementPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState("export");
  const [exportType, setExportType] = useState("orders");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importType, setImportType] = useState("orders");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      processed: number;
      added: number;
      skipped: number;
      failed: number;
    };
  } | null>(null);
  
  // التحقق من وجود المستخدم وصلاحياته
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    
    // التحقق من صلاحيات المستخدم (للمدراء فقط)
    if (!isLoading && user && user.role !== "admin") {
      router.push("/dashboard");
      toast.error("ليس لديك صلاحية للوصول إلى هذه الصفحة");
    }
  }, [user, isLoading, router]);

  // معالجة اختيار ملف الاستيراد
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    // التحقق من نوع الملف (يجب أن يكون CSV)
    if (file && !file.name.toLowerCase().endsWith('.csv')) {
      toast.error("يرجى اختيار ملف بتنسيق CSV فقط");
      event.target.value = '';
      return;
    }
    
    setSelectedFile(file);
    setImportResult(null);
  };

  // معالجة النقر على زر اختيار الملف
  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  // تنفيذ عملية تصدير البيانات
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // التحقق من نوع البيانات المراد تصديرها
      if (!exportType) {
        toast.error("يرجى اختيار نوع البيانات المراد تصديرها");
        setIsExporting(false);
        return;
      }
      
      // إنشاء الطلب لتصدير البيانات
      const response = await fetch(`/api/data-management/export?type=${exportType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "حدث خطأ أثناء تصدير البيانات");
      }
      
      // الحصول على البيانات وتحويلها إلى ملف CSV للتنزيل
      const data = await response.json();
      
      if (!data || !data.csv) {
        throw new Error("لم يتم العثور على بيانات للتصدير");
      }
      
      // إنشاء رابط تنزيل للملف CSV
      const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exportType}_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("تم تصدير البيانات بنجاح");
    } catch (error) {
      console.error("خطأ في تصدير البيانات:", error);
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء تصدير البيانات");
    } finally {
      setIsExporting(false);
    }
  };

  // تنفيذ عملية استيراد البيانات
  const handleImport = async () => {
    try {
      if (!selectedFile) {
        toast.error("يرجى اختيار ملف CSV للاستيراد");
        return;
      }
      
      if (!importType) {
        toast.error("يرجى اختيار نوع البيانات المراد استيرادها");
        return;
      }
      
      setIsImporting(true);
      setImportProgress(0);
      setImportResult(null);
      
      // إنشاء كائن FormData لإرفاق الملف
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', importType);
      
      // إنشاء الطلب لاستيراد البيانات مع متابعة التقدم
      const response = await fetch('/api/data-management/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "حدث خطأ أثناء استيراد البيانات");
      }
      
      const result = await response.json();
      
      setImportResult({
        success: true,
        message: "تم استيراد البيانات بنجاح",
        details: {
          processed: result.processed || 0,
          added: result.added || 0,
          skipped: result.skipped || 0,
          failed: result.failed || 0
        }
      });
      
      toast.success("تم استيراد البيانات بنجاح");
      // إعادة تعيين الملف المختار بعد الاستيراد الناجح
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);
      
    } catch (error) {
      console.error("خطأ في استيراد البيانات:", error);
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : "حدث خطأ أثناء استيراد البيانات"
      });
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء استيراد البيانات");
    } finally {
      setIsImporting(false);
      setImportProgress(100);
    }
  };
  
  // محاكاة تقدم الاستيراد
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isImporting && importProgress < 90) {
      interval = setInterval(() => {
        setImportProgress((prev) => {
          // زيادة التقدم بشكل تدريجي حتى 90%
          const increment = Math.random() * 10;
          const newProgress = Math.min(prev + increment, 90);
          return newProgress;
        });
      }, 500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isImporting, importProgress]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة البيانات</h1>
            <p className="text-muted-foreground mt-2">تصدير واستيراد بيانات النظام</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download size={16} />
              <span>تصدير البيانات</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload size={16} />
              <span>استيراد البيانات</span>
            </TabsTrigger>
          </TabsList>
          
          {/* قسم تصدير البيانات */}
          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download size={18} />
                  <span>تصدير البيانات</span>
                </CardTitle>
                <CardDescription>
                  تصدير البيانات من النظام بصيغة CSV للاستخدام في برامج أخرى
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exportType">نوع البيانات</Label>
                  <Select
                    value={exportType}
                    onValueChange={setExportType}
                  >
                    <SelectTrigger id="exportType">
                      <SelectValue placeholder="اختر نوع البيانات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orders">الطلبات</SelectItem>
                      <SelectItem value="drivers">السائقين</SelectItem>
                      <SelectItem value="cities">المدن</SelectItem>
                      <SelectItem value="users">المستخدمين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertTitle>ملاحظة هامة</AlertTitle>
                  <AlertDescription>
                    سيتم تصدير جميع بيانات {exportType === "orders" ? "الطلبات" : 
                                           exportType === "drivers" ? "السائقين" : 
                                           exportType === "cities" ? "المدن" : "المستخدمين"} 
                    المسجلة في النظام. قد تستغرق العملية بعض الوقت حسب حجم البيانات.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleExport} 
                  disabled={isExporting} 
                  className="w-full md:w-auto flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      <span>جاري التصدير...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>تصدير البيانات</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* قسم استيراد البيانات */}
          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload size={18} />
                  <span>استيراد البيانات</span>
                </CardTitle>
                <CardDescription>
                  استيراد بيانات جديدة إلى النظام من ملف CSV
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="importType">نوع البيانات</Label>
                  <Select
                    value={importType}
                    onValueChange={setImportType}
                  >
                    <SelectTrigger id="importType">
                      <SelectValue placeholder="اختر نوع البيانات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orders">الطلبات</SelectItem>
                      <SelectItem value="drivers">السائقين</SelectItem>
                      <SelectItem value="cities">المدن</SelectItem>
                      <SelectItem value="users">المستخدمين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="csvFile">ملف CSV</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={fileInputRef}
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleSelectFileClick}
                      className="flex items-center gap-2 flex-1"
                      disabled={isImporting}
                    >
                      <FileSpreadsheet size={16} />
                      {selectedFile ? selectedFile.name : "اختر ملف CSV"}
                    </Button>
                    {selectedFile && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        disabled={isImporting}
                      >
                        <FileX size={16} />
                      </Button>
                    )}
                  </div>
                </div>
                
                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>تقدم الاستيراد</Label>
                      <span className="text-sm text-muted-foreground">{Math.round(importProgress)}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                )}
                
                {importResult && (
                  <Alert variant={importResult.success ? "default" : "destructive"}>
                    {importResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <AlertTitle>{importResult.success ? "تم الاستيراد بنجاح" : "فشل الاستيراد"}</AlertTitle>
                    <AlertDescription>
                      {importResult.message}
                      {importResult.details && (
                        <div className="mt-2 text-sm">
                          <div>عدد السجلات المعالجة: {importResult.details.processed}</div>
                          <div>تمت إضافة: {importResult.details.added}</div>
                          <div>تم تخطي: {importResult.details.skipped}</div>
                          <div>فشل في الإضافة: {importResult.details.failed}</div>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>تنسيق الملف</AlertTitle>
                  <AlertDescription>
                    <p>يجب أن يكون الملف بتنسيق CSV ويحتوي على العناوين الصحيحة المطابقة لحقول جدول {importType === "orders" ? "الطلبات" : 
                    importType === "drivers" ? "السائقين" : 
                    importType === "cities" ? "المدن" : "المستخدمين"}.</p>
                    <Separator className="my-2" />
                    <p className="text-sm font-medium">الحقول المطلوبة:</p>
                    <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                      {importType === "orders" && (
                        <>
                          <li>recipient_name - اسم المستلم</li>
                          <li>recipient_phone1 - رقم هاتف المستلم</li>
                          <li>recipient_city - مدينة المستلم</li>
                          <li>recipient_address - عنوان المستلم</li>
                          <li>cod_amount - مبلغ الدفع عند الاستلام</li>
                          <li>status - حالة الطلب</li>
                        </>
                      )}
                      {importType === "drivers" && (
                        <>
                          <li>driver_name - اسم السائق</li>
                          <li>driver_phone - رقم هاتف السائق</li>
                          <li>assigned_areas - المناطق المكلف بها</li>
                        </>
                      )}
                      {importType === "cities" && (
                        <>
                          <li>name - اسم المدينة</li>
                        </>
                      )}
                      {importType === "users" && (
                        <>
                          <li>username - اسم المستخدم</li>
                          <li>email - البريد الإلكتروني</li>
                          <li>role - الدور (admin, user)</li>
                          <li>password - كلمة المرور</li>
                        </>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting || !selectedFile} 
                  className="w-full md:w-auto flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      <span>جاري الاستيراد...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>استيراد البيانات</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
} 