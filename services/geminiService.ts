import { GoogleGenAI, Type } from "@google/genai";
import { MealAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMealDescription = async (text: string): Promise<MealAnalysis> => {
  const modelId = "gemini-2.5-flash"; // Efficient for extraction tasks

  const response = await ai.models.generateContent({
    model: modelId,
    contents: text,
    config: {
      systemInstruction: `
        You are an expert nutritionist AI. Your goal is to estimate nutritional values from natural language descriptions of food.
        
        Rules:
        1. If the user specifies calories (e.g., "800kcal turkey dinner" or "800kc" or "800 cals"), respect that total calorie count strictly, but estimate the macros (protein, carbs, fat, fiber) based on the food type typically found in that meal.
        2. Recognize short units: "kc" = kcal, "cals" = kcal, "cal" = kcal.
        3. If the user specifies quantities (e.g., "2 apples"), use standard nutritional data.
        4. If vague (e.g., "handful of raisins"), use reasonable average serving sizes.
        5. Be conservative but realistic.
        6. "summary" should be a very short 3-5 word title for the meal (e.g., "Turkey Dinner", "Snack: Apples & Raisins").
        7. "foodItems" should be a list of identified ingredients.
        8. Estimate dietary fiber content carefully.
      `,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER, description: "Total energy in kcal" },
          protein: { type: Type.NUMBER, description: "Total protein in grams" },
          carbs: { type: Type.NUMBER, description: "Total carbohydrates in grams" },
          fat: { type: Type.NUMBER, description: "Total fat in grams" },
          fiber: { type: Type.NUMBER, description: "Total dietary fiber in grams" },
          summary: { type: Type.STRING, description: "A short display title for this entry" },
          foodItems: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of identified food components"
          }
        },
        required: ["calories", "protein", "carbs", "fat", "fiber", "summary", "foodItems"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  try {
    const data = JSON.parse(response.text) as MealAnalysis;
    return data;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    // Fallback in case of strict parsing failure, though schema constraint prevents this mostly
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      summary: "Unknown Meal",
      foodItems: []
    };
  }
};