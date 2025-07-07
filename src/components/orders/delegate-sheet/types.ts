import { Driver } from "@/types/drivers";
import { Order } from "@/types/orders";

export interface PrintDelegateSheetProps {
  driver: Driver;
  orders: Order[];
  calculateTotalCOD: () => number;
  formatCurrency: (amount: number) => string;
}

export interface SheetContentProps {
  driver: Driver;
  orders: Order[];
  calculateTotalCOD: () => number;
  formatCurrency: (amount: number) => string;
  sheetId: string;
  dateFormatted: string;
  timeFormatted: string;
}

export interface PrintStylesProps {
  css: string;
}
