"use client";

import { SheetContentProps } from "./types";

const DriverInfo = ({ driver }: Pick<SheetContentProps, 'driver'>) => {
  return (
    <div className="driver-info">
      <div className="driver-name">المندوب: {driver.driver_name}</div>
      <div className="driver-details">رقم الهاتف: {driver.driver_phone}</div>
      {driver.driver_id_number && <div className="driver-details">رقم الهوية: {driver.driver_id_number}</div>}
    </div>
  );
};

export default DriverInfo;
