export interface MacroProfile {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MealAnalysis extends MacroProfile {
  summary: string;
  foodItems: string[];
}

export interface Meal {
  id: string;
  timestamp: number;
  originalText: string;
  analysis: MealAnalysis;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export enum TimeRange {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH'
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  ADD = 'ADD',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS'
}