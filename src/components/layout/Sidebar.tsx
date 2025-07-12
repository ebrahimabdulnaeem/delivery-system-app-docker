"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { User, UserRole } from "@/types";
import React, { useState } from 'react';
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
  Search,
  X,
  ChevronDown,
  Settings,
  ClipboardList
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}


// Updated NavItem type to support sub-items for dropdowns
type NavItem = {
  title: string;
  icon: React.ReactNode;
  href?: string; // Optional for parent items
  roles?: UserRole[];
  subItems?: NavItem[]; // For dropdowns
};

// Restructured navigation items
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
    title: "الشحن والبواليص",
    icon: <ClipboardList size={18} />,
    roles: [UserRole.ADMIN, UserRole.DATA_ENTRY, UserRole.ACCOUNTS],
    subItems: [
      {
        title: "عمليات البوليصة",
        href: "/dashboard/orders/bulk-operations",
        icon: <ScanBarcode size={18} />,
        roles: [UserRole.ADMIN, UserRole.ACCOUNTS],
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
    ]
  },
  {
    title: "الإعدادات والإضافات",
    icon: <Settings size={18} />,
    subItems: [
      {
        title: "إدارة المناديب",
        href: "/dashboard/drivers",
        icon: <Truck size={18} />,
      },
      {
        title: "إدارة المدن",
        href: "/dashboard/cities",
        icon: <Map size={18} />,
      },
      {
        title: "إدارة الموظفين",
        href: "/dashboard/users",
        icon: <Users size={18} />,
        roles: [UserRole.ADMIN],
      },
    ]
  },
  {
    title: "التقرير والتحليلات",
    icon: <BarChart3 size={18} />,
    roles: [UserRole.ADMIN],
    subItems: [
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
    ]
  }
];

// Helper component for collapsible navigation items
const CollapsibleNavItem = ({ item, user, pathname, onClose }: { item: NavItem, user: User, pathname: string, onClose: () => void }) => {
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isParentActive = hasSubItems && item.subItems!.some(sub => pathname.startsWith(sub.href!));
  const [isOpen, setIsOpen] = useState(isParentActive);

  const visibleSubItems = item.subItems?.filter(subItem => 
    !subItem.roles || subItem.roles.includes(user.role)
  ) || [];

  if (!visibleSubItems.length && hasSubItems) return null;

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        className={cn(
          "w-full flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          isParentActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          {item.icon}
          <span>{item.title}</span>
        </div>
        <ChevronDown size={16} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="mt-1 flex flex-col gap-1 pr-6 border-r-2 border-sidebar-accent/30 mr-4">
          {visibleSubItems.map((subItem) => (
            <Link
              key={subItem.href}
              href={subItem.href!}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === subItem.href
                  ? "text-sidebar-accent-foreground"
                  : "text-gray-400 hover:text-sidebar-accent-foreground"
              )}
            >
              {subItem.icon}
              <span>{subItem.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  const sidebarClasses = cn(
    "h-screen w-64 flex flex-col fixed top-0 right-0 z-50 border-l bg-sidebar transition-transform duration-300 ease-in-out",
    isOpen ? "translate-x-0" : "translate-x-full",
    "md:translate-x-0"
  );

  if (isLoading || !user) {
    return (
      <div className="hidden md:flex h-screen w-64 flex-col fixed top-0 right-0 z-40 border-l bg-sidebar animate-pulse">
        <div className="flex h-20 items-center border-b px-6"><div className="h-6 w-36 bg-gray-700 rounded"></div></div>
        <div className="flex-1 overflow-auto py-6 px-4 space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-gray-700 rounded"></div>)}
        </div>
        <div className="border-t p-4"><div className="h-12 bg-gray-700 rounded"></div></div>
      </div>
    );
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose}></div>}

      <div className={sidebarClasses}>
        <div className="flex h-20 items-center justify-between border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <LayoutGrid className="h-6 w-6" />
            <span className="font-semibold">نظام الإدارة</span>
          </Link>
          <button onClick={onClose} className="md:hidden p-2 rounded-md hover:bg-sidebar-accent/50" aria-label="إغلاق الشريط الجانبي">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto py-6 px-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item, index) => {
              if (item.roles && !item.roles.includes(user.role)) return null;

              if (item.subItems) {
                return <CollapsibleNavItem key={index} item={item} user={user} pathname={pathname} onClose={onClose} />;
              }

              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  onClick={onClose}
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
    </>
  );
} 