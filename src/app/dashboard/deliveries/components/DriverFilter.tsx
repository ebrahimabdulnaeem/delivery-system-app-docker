"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";

type DriverFilterProps = {
  drivers: { id: string; driver_name: string }[];
};

export function DriverFilter({ drivers }: DriverFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // إنشاء معلمات URL جديدة
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.set("page", "1"); // إعادة تعيين الصفحة عند تغيير المعلمات
      return params.toString();
    },
    [searchParams]
  );

  // معالجة تغيير السائق
  const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`?${createQueryString("driver_id", e.target.value)}`);
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <label htmlFor="driver_id" className="text-sm font-medium">
        المندوب
      </label>
      <select
        id="driver_id"
        className="p-2 border rounded-md"
        value={searchParams.get("driver_id") || ""}
        onChange={handleDriverChange}
      >
        <option value="">جميع المندوبين</option>
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driver.driver_name}
          </option>
        ))}
      </select>
    </div>
  );
} 