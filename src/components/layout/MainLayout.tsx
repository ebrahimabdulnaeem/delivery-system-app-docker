"use client";

import { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 mr-64">
        <Header />
        <main className="pt-28 px-8 pb-10 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 