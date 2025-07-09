"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

import { LogOut, Search } from "lucide-react";
import { ReactNode } from 'react';

interface HeaderProps {
  children?: ReactNode;
}

export function Header({ children }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <header className="fixed left-0 right-0 md:right-64 top-0 z-30 border-b bg-background h-20 flex items-center justify-between md:justify-normal px-4 sm:px-8">
      <div className="flex items-center gap-4">
        {children}
        <div className="hidden md:block flex-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="بحث..."
            className="w-full rounded-md border border-input bg-background py-2.5 px-4 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 p-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 shadow-inner">
        <div className="text-right">
          <p className="font-bold text-md bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400">
            {user.username}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 font-mono tracking-wider">{user.role}</p>
        </div>
        <button 
          onClick={handleLogout} 
          title="تسجيل الخروج"
          className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-purple-500 transition-all duration-200 transform hover:scale-110">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
} 