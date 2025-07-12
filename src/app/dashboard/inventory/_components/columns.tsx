'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { Product } from '@/generated/prisma/client';
import { differenceInMonths, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: 'اسم المنتج',
    cell: ({ row }) => {
      const product = row.original;
      const expiryDate = product.expiry_date ? new Date(product.expiry_date) : null;
      let showWarning = false;

      if (expiryDate) {
        const monthsUntilExpiry = differenceInMonths(expiryDate, new Date());
        if (monthsUntilExpiry <= 3) {
          showWarning = true;
        }
      }

      return (
        <div className="flex items-center">
          {product.name}
          {showWarning && (
            <Badge variant="destructive" className="mr-2">
              <AlertTriangle className="h-4 w-4 mr-1" />
              صلاحية قريبة
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'quantity',
    header: 'الكمية',
  },
  {
    accessorKey: 'price',
    header: 'السعر',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('price'));
      const formatted = new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
      }).format(amount);
      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: 'unit',
    header: 'وحدة القياس',
    cell: ({ row }) => {
        const unit = row.getValue('unit') as string;
        const unitMap: { [key: string]: string } = {
            PIECE: 'قطعة',
            KG: 'كيلو',
            CARTON: 'كرتونة',
        };
        return <div>{unitMap[unit] || unit}</div>;
    }
  },
  {
    accessorKey: 'barcode',
    header: 'الباركود',
  },
  {
    accessorKey: 'expiry_date',
    header: 'تاريخ الصلاحية',
    cell: ({ row }) => {
      const date = row.getValue('expiry_date');
      return date ? format(new Date(date as string), 'yyyy-MM-dd') : 'N/A';
    },
  },
];
