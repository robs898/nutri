import { GoogleGenAI, Type } from "@google/genai";
import { MealAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMealDescription = async (text: string, imageBase64?: string): Promise<MealAnalysis> => {
  // Allow user to switch models in settings, default to 2.5 Flash
  const modelId = localStorage.getItem('pixel-nutrition-model') || "gemini-2.5-flash";

  const parts: any[] = [];
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64
      }
    });
  }

  // Always add text, even if empty, as a prompt guide
  parts.push({
    text: text || "Analyze this image and estimate the nutritional content."
  });

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts },
    config: {
      systemInstruction: `
        You are an expert nutritionist AI. Your goal is to estimate nutritional values from natural language descriptions of food and/or images of food.
        
        Rules:
        1. If an image is provided, identify the food items and estimate portion sizes visually to calculate macros.
        2. If text specifies calories (e.g., "800kc"), respect that total strictly.
        3. If text conflicts with image (e.g. text says "burger" but image is "salad"), prioritize the text for the *type* of food but use the image for *portion size* context if ambiguous. Generally trust the user's explicit text overrides.
        4. Recognize short units: "kc" = kcal, "cals" = kcal.
        5. Be conservative but realistic.
        6. "summary" should be a very short 3-5 word title (e.g., "Turkey Dinner", "Snack: Apples").
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