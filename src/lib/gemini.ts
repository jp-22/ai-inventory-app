import { GoogleGenerativeAI } from "@google/generative-ai";

// Your API key should be in an environment variable
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function countObjectsInImage(
  base64Image: string,
  objectType: string,
) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const prompt = `Task: Count objects in inventory image.
Context: Looking for ${objectType}(s).
Rules:
1. If image shows different item: respond 'WRONG_ITEM: [item name]'
2. If image shows correct item: respond with number only
Example responses:
- For wrong item: 'WRONG_ITEM: keyboard'
- For correct item: '3'`;

    console.log("Sending request to Gemini with object type:", objectType);

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    console.log("Raw Gemini response:", text);

    // Check if response indicates wrong item
    if (text.includes("WRONG_ITEM:")) {
      const wrongItem = text.split("WRONG_ITEM:")[1].trim();
      return {
        error: `Wrong item detected: Found ${wrongItem} instead of ${objectType}`,
      };
    }

    // Extract the number from the response
    const number = parseInt(text.match(/\d+/)?.[0] || "0");
    console.log("Extracted number:", number);

    return { count: number };
  } catch (error) {
    console.error("Detailed Gemini API Error:", error);
    return { error: error.toString() };
  }
}
