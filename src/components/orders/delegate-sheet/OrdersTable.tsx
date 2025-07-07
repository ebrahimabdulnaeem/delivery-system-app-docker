"use client";

import { SheetContentProps } from "./types";
import "./styles.css";

const OrdersTable = ({ orders, formatCurrency, calculateTotalCOD }: Pick<SheetContentProps, 'orders' | 'formatCurrency' | 'calculateTotalCOD'>) => {
  return (
    <table className="orders-table">
      <thead>
        <tr>
          <th>#</th>
          <th>البيانات والباركود</th>
          <th>التوقيع</th>
          <th>تعليمات خاصة</th>
          <th>المبلغ</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order, index) => (
          <tr key={order.id || index}>
            <td>{index + 1}</td>
            <td className="combined-cell">
              <div className="barcode-container">
                <canvas id={`order-barcode-${index}`} className="order-barcode"></canvas>
                <div className="barcode-text">{order.barcode}</div>
              </div>
              <div className="customer-data">
                <div className="data-row"><span className="data-label">الراسل:</span> belladonna</div>
                <div className="data-row"><span className="data-label">المرسل اليه:</span> {order.recipient_name}</div>
                <div className="data-row"><span className="data-label">موبايل المرسل اليه:</span> {order.recipient_phone1}</div>
                {order.recipient_phone2 && <div className="data-row"><span className="data-label">موبايل 2:</span> {order.recipient_phone2}</div>}
                <div className="data-row"><span className="data-label">عنوان المرسل اليه:</span> {order.recipient_city} - {order.recipient_address}</div>
              </div>
            </td>
            <td className="signature-cell">
              <div className="signature-box-print"></div>
            </td>
            <td className="instructions-cell">
              {order.special_instructions || "-"}
            </td>
            <td className="amount-cell">
              {formatCurrency(order.cod_amount)}
            </td>
          </tr>
        ))}
        <tr className="total-row">
          <td colSpan={4}>الإجمالي:</td>
          <td>{formatCurrency(calculateTotalCOD())}</td>
        </tr>
      </tbody>
    </table>
  );
};

export default OrdersTable;
