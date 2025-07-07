"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import { 
  LayoutDashboard, 
  Package, 
  PackagePlus, 
  Users, 
  Truck, 
  BarChart3,
  LayoutGrid,
  Map,
  FileText,
  Database,
  PackageCheck,
  ScanBarcode,
  Search
} from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: UserRole[];
};

const navItems: NavItem[] = [
  {
    title: "لوحة التحكم",
    href: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    title: "الطلبات",
    href: "/dashboard/orders",
    icon: <Package size={18} />,
  },
  {
    title: "التسليمات",
    href: "/dashboard/deliveries",
    icon: <PackageCheck size={18} />,
  },
  {
    title: "إنشاء طلب",
    href: "/dashboard/orders/new",
    icon: <PackagePlus size={18} />,
    roles: [UserRole.ADMIN, UserRole.DATA_ENTRY],
  },
  {
    title: "عمليات البوليصة",
    href: "/dashboard/orders/bulk-operations",
    icon: <ScanBarcode size={18} />,
    roles: [UserRole.ADMIN, UserRole.ACCOUNTS],
  },
  {
    title: "بوالص الشحن",
    href: "/dashboard/orders/waybills",
    icon: <Package size={18} />,
    roles: [UserRole.ADMIN, UserRole.DATA_ENTRY],
  },
  {
    title: "شيت المندوب",
    href: "/dashboard/orders/delegate-sheet",
    icon: <FileText size={18} />,
    roles: [UserRole.ADMIN, UserRole.DATA_ENTRY],
  },
  {
    title: "البحث عن الشيتات",
    href: "/dashboard/delegate-sheets",
    icon: <Search size={18} />,
    roles: [UserRole.ADMIN, UserRole.DATA_ENTRY, UserRole.ACCOUNTS],
  },
  {
    title: "السائقين",
    href: "/dashboard/drivers",
    icon: <Truck size={18} />,
  },
  {
    title: "المدن",
    href: "/dashboard/cities",
    icon: <Map size={18} />,
  },
  {
    title: "التقارير",
    href: "/dashboard/reports",
    icon: <BarChart3 size={18} />,
  },
  {
    title: "إدارة البيانات",
    href: "/dashboard/data-management",
    icon: <Database size={18} />,
    roles: [UserRole.ADMIN],
  },
  {
    title: "المستخدمين",
    href: "/dashboard/users",
    icon: <Users size={18} />,
    roles: [UserRole.ADMIN],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // عرض هيكل عظمي أثناء التحميل أو إذا لم يكن هناك مستخدم
  if (isLoading || !user) {
    return (
      <div className="hidden md:flex h-screen w-64 flex-col fixed top-0 right-0 z-40 border-l bg-sidebar animate-pulse">
        <div className="flex h-20 items-center border-b px-6">
          <div className="h-6 w-36 bg-gray-300 rounded"></div>
        </div>
        <div className="flex-1 overflow-auto py-6 px-4 space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-300 rounded"></div>
          ))}
        </div>
        <div className="border-t p-4">
          <div className="h-12 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex h-screen w-64 flex-col fixed top-0 right-0 z-40 border-l bg-sidebar">
      <div className="flex h-20 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <LayoutGrid className="h-6 w-6" />
          <span className="font-semibold">نظام إدارة التوصيل</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-6 px-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            // تحقق من صلاحيات الوصول
            if (item.roles && !item.roles.includes(user.role)) {
              return null;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-md bg-sidebar-accent/20 px-3 py-2 text-sm">
          <div className="flex flex-col">
            <span className="font-medium">{user.username}</span>
            <span className="text-xs text-muted-foreground">
              {user.role === UserRole.ADMIN && "مدير"}
              {user.role === UserRole.DATA_ENTRY && "مدخل بيانات"}
              {user.role === UserRole.ACCOUNTS && "محاسب"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 