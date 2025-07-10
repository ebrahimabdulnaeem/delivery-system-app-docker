"use client";

import { ReactNode, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 md:mr-64">
        <Header>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
        </Header>
        <main className="pt-24 md:pt-28 px-4 sm:px-8 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
} 