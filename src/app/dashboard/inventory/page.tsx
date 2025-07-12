'use client';

import { useQuery } from '@tanstack/react-query';
import { ProductsDataTable } from './_components/products-data-table';
import { columns } from './_components/columns';
import { Skeleton } from '@/components/ui/skeleton';
import { MainLayout } from '@/components/layout/MainLayout';

async function getProducts() {
  const res = await fetch('/api/products');
  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }
  return res.json();
}

export default function InventoryPage() {
  const { data: products, isLoading, error } = useQuery({ 
    queryKey: ['products'], 
    queryFn: getProducts 
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (error) {
      return <div className="text-red-500">حدث خطأ: {error.message}</div>;
    }

    return <ProductsDataTable columns={columns} data={products || []} />;
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">إدارة المخزن</h1>
        {renderContent()}
      </div>
    </MainLayout>
  );
}
