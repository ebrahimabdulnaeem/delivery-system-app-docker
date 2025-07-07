import { City } from "@/types";
import { generateId } from "./utils";

// Mock cities data
const cities: City[] = [];

// Add sample cities for development
export function addSampleCities(): void {
  if (cities.length === 0) {
    const cityNames = [
      "القاهرة", "الإسكندرية", "الجيزة", "المنصورة", "طنطا", "الإسماعيلية",
      "أسيوط", "المنيا", "الزقازيق", "بنها", "سوهاج", "بني سويف", "أسوان", "الأقصر"
    ];
    
    for (const name of cityNames) {
      cities.push({
        id: generateId("city_"),
        name,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }
}

// Get all cities
export function getCities(): City[] {
  return [...cities];
}

// Get city by ID
export function getCityById(id: string): City | null {
  return cities.find(city => city.id === id) || null;
}

// Get city by name
export function getCityByName(name: string): City | null {
  return cities.find(city => city.name === name) || null;
}

// Create a new city
export function createCity(name: string): City {
  // Check if city already exists
  const existing = getCityByName(name);
  if (existing) return existing;
  
  const newCity: City = {
    id: generateId("city_"),
    name,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  cities.push(newCity);
  return newCity;
}

// Update a city
export function updateCity(id: string, name: string): City | null {
  const index = cities.findIndex(city => city.id === id);
  
  if (index === -1) return null;
  
  const updatedCity = {
    ...cities[index],
    name,
    updated_at: new Date()
  };
  
  cities[index] = updatedCity;
  return updatedCity;
}

// Delete a city
export function deleteCity(id: string): boolean {
  const index = cities.findIndex(city => city.id === id);
  
  if (index === -1) return false;
  
  cities.splice(index, 1);
  return true;
} 