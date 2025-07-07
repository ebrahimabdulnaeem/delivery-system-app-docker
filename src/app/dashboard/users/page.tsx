"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { User, UserRole } from "@/types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Pencil, Trash, Plus, Users, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function UsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // تحقق من صلاحيات المستخدم
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  // دالة لجلب المستخدمين
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });
      
      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      const response = await fetch(`/api/users?${queryParams.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error("حدث خطأ في جلب بيانات المستخدمين");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("حدث خطأ أثناء جلب بيانات المستخدمين");
    } finally {
      setIsLoading(false);
    }
  };

  // دالة لحذف مستخدم
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    
    try {
      const response = await fetch(`/api/users/${deleteUserId}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        toast.success("تم حذف المستخدم بنجاح");
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || "حدث خطأ أثناء حذف المستخدم");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("حدث خطأ أثناء حذف المستخدم");
    } finally {
      setShowDeleteDialog(false);
      setDeleteUserId(null);
    }
  };

  // تحديد لون البادج بناءً على الدور
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case UserRole.DATA_ENTRY:
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case UserRole.ACCOUNTS:
        return "bg-green-100 text-green-800 hover:bg-green-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // ترجمة الدور إلى العربية
  const getRoleInArabic = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "مدير";
      case UserRole.DATA_ENTRY:
        return "مدخل بيانات";
      case UserRole.ACCOUNTS:
        return "محاسب";
      default:
        return role;
    }
  };

  // إذا لم يكن المستخدم مديراً، قم بتوجيهه للوحة التحكم
  if (user?.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
            <p className="text-muted-foreground mt-2">إدارة حسابات المستخدمين والصلاحيات</p>
          </div>
          
          <Button onClick={() => router.push("/dashboard/users/new")} className="flex items-center gap-2">
            <Plus size={16} />
            إضافة مستخدم
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">قائمة المستخدمين</CardTitle>
            <CardDescription>عرض وإدارة جميع المستخدمين في النظام</CardDescription>
            
            <div className="mt-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو البريد الإلكتروني..."
                  className="pl-3 pr-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="text-lg">جاري التحميل...</div>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users size={48} className="text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">لا يوجد مستخدمين</h3>
                <p className="text-muted-foreground mt-1">
                  {searchTerm 
                    ? "لا توجد نتائج مطابقة لبحثك" 
                    : "لم يتم إضافة أي مستخدمين بعد"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المستخدم</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>تاريخ الإنشاء</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userData) => (
                      <TableRow key={userData.id}>
                        <TableCell className="font-medium">{userData.username}</TableCell>
                        <TableCell>{userData.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleBadgeColor(userData.role as UserRole)}>
                            {getRoleInArabic(userData.role as UserRole)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {userData.createdAt && format(new Date(userData.createdAt), "d MMMM yyyy", { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/users/${userData.id}`)}
                            >
                              <Pencil size={14} />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => {
                                setDeleteUserId(userData.id);
                                setShowDeleteDialog(true);
                              }}
                              disabled={userData.id === "user_1" || userData.id === user?.id}
                            >
                              <Trash size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* التصفح بين الصفحات */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                
                <span className="flex items-center mx-2 text-sm">
                  صفحة {currentPage} من {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* حوار تأكيد الحذف */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا المستخدم؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف بيانات المستخدم بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-red-500 hover:bg-red-600"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
} 