import { Meal } from "../types";
import { APP_STORAGE_KEY } from "../constants";

export { APP_STORAGE_KEY };

export const getStoredMeals = (): Meal[] => {
  try {
    const stored = localStorage.getItem(APP_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load meals", e);
    return [];
  }
};

export const saveMeal = (meal: Meal): Meal[] => {
  const current = getStoredMeals();
  const updated = [meal, ...current];
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteMeal = (id: string): Meal[] => {
  const current = getStoredMeals();
  const updated = current.filter(m => m.id !== id);
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};