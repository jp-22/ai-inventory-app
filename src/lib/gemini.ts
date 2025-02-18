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

    const prompt = `
    Task: Count objects in inventory image.
    Context: Looking for ${objectType}.
    Rules:
    1. If image shows a different item, respond 'WRONG_ITEM: [item name]'.
    2. If image shows the correct item, respond with the number of objects found.
    3. For each object, provide normalized coordinates (0-1 range) for bounding boxes.
    Format:
    - The response should contain:
      1. Number of items found.
      2. A list of objects, each with normalized coordinates (0-1 range):
         - x1: Left position (0-1)
         - y1: Top position (0-1)
         - x2: Right position (0-1)
         - y2: Bottom position (0-1)
    Example response:
      - For wrong item: 'WRONG_ITEM: keyboard'
      - For correct item: '1, [[x1: 0.2, y1: 0.3, x2: 0.8, y2: 0.7]]'
    Note: All coordinates should be normalized to 0-1 range regardless of image dimensions.
    `;

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

    console.log("Raw AI Response:", text);

    // Check if response indicates wrong item
    if (text.includes("WRONG_ITEM:")) {
      const wrongItem = text.split("WRONG_ITEM:")[1].trim();
      return {
        error: `Wrong item detected: Found ${wrongItem} instead of ${objectType}`,
      };
    }

    // Extract count and coordinates
    const match = text.match(/(\d+),\s*\[\[(.*?)\]\]/s);
    if (!match) {
      console.error("Could not parse count and coordinates");
      return { error: "Invalid response format" };
    }

    const count = parseInt(match[1]);

    // Now extract the bounding boxes part
    const boxesMatch = text.match(/\[\[(.*?)\]\]/s);
    if (!boxesMatch) {
      console.error("Could not parse bounding boxes");
      return { imageWidth, imageHeight, count, boundingBoxes: [] };
    }

    const boxesStr = boxesMatch[1];
    console.log("Boxes string:", boxesStr);

    // Split and parse the boxes
    const boundingBoxes = boxesStr
      .split(/\],\s*\[/)
      .map((box) => {
        // Extract coordinates using named capture groups for floating point numbers
        const coords = box.match(
          /x1:\s*(\d*\.?\d+),\s*y1:\s*(\d*\.?\d+),\s*x2:\s*(\d*\.?\d+),\s*y2:\s*(\d*\.?\d+)/,
        );
        if (!coords) {
          console.error("Invalid box format:", box);
          return null;
        }
        const [_, x1, y1, x2, y2] = coords.map((n) => (n ? parseFloat(n) : 0));
        return { x1, y1, x2, y2 };
      })
      .filter((box) => box !== null);

    console.log("Parsed bounding boxes:", boundingBoxes);
    return { count, boundingBoxes };
  } catch (error) {
    console.error("Detailed Gemini API Error:", error);
    return { error: error.toString() };
  }
}
