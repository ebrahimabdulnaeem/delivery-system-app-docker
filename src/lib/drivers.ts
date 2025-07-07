import { Driver } from "@/types";
import { generateId } from "./utils";

// Mock drivers data
const drivers: Driver[] = [];

// Generate a mock driver
function generateMockDriver(): Driver {
  const areas = ["القاهرة", "الإسكندرية", "الجيزة", "المنصورة", "طنطا", "الإسماعيلية"];
  const randomAreas: string[] = [];
  
  // Assign 1-3 random areas to each driver
  const numAreas = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < numAreas; i++) {
    const area = areas[Math.floor(Math.random() * areas.length)];
    if (!randomAreas.includes(area)) {
      randomAreas.push(area);
    }
  }
  
  return {
    id: generateId("drv_"),
    driver_name: `سائق ${Math.floor(Math.random() * 100)}`,
    driver_id_number: `${Math.floor(Math.random() * 10000000000000)}`,
    driver_phone: `01${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 100000000)}`,
    assigned_areas: randomAreas,
    created_at: new Date(),
    updated_at: new Date()
  };
}

// Add sample drivers for development
export function addSampleDrivers(): void {
  if (drivers.length === 0) {
    for (let i = 0; i < 10; i++) {
      drivers.push(generateMockDriver());
    }
  }
}

// Get all drivers
export function getDrivers(): Driver[] {
  return [...drivers];
}

// Get driver by ID
export function getDriverById(id: string): Driver | null {
  return drivers.find(driver => driver.id === id) || null;
}

// Create a new driver
export function createDriver(driverData: Omit<Driver, "id" | "created_at" | "updated_at">): Driver {
  const newDriver: Driver = {
    ...driverData,
    id: generateId("drv_"),
    created_at: new Date(),
    updated_at: new Date()
  };
  
  drivers.push(newDriver);
  return newDriver;
}

// Update an existing driver
export function updateDriver(id: string, driverData: Partial<Driver>): Driver | null {
  const index = drivers.findIndex(driver => driver.id === id);
  
  if (index === -1) return null;
  
  const updatedDriver = {
    ...drivers[index],
    ...driverData,
    updated_at: new Date()
  };
  
  drivers[index] = updatedDriver;
  return updatedDriver;
}

// Delete a driver
export function deleteDriver(id: string): boolean {
  const index = drivers.findIndex(driver => driver.id === id);
  
  if (index === -1) return false;
  
  drivers.splice(index, 1);
  return true;
}

// Get drivers by area
export function getDriversByArea(area: string): Driver[] {
  return drivers.filter(driver => 
    driver.assigned_areas && driver.assigned_areas.includes(area)
  );
} 