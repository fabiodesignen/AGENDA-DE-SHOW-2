import { GoogleGenAI } from "@google/genai";

// Initialize the GoogleGenAI client with the API key from environment variables.
// The API_KEY must be configured externally in the execution environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates text content using the Gemini API.
 * @param prompt The text prompt for the model.
 * @param model The Gemini model to use (defaults to 'gemini-2.5-flash').
 * @returns The generated text response or null if an error occurs.
 */
export async function generateTextWithGemini(prompt: string, model: string = 'gemini-2.5-flash'): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // You might want to implement more sophisticated error handling or UI feedback here.
    return null;
  }
}
