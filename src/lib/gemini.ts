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
    Context: Looking for person(s).
    Rules:
    1. If image shows a different item, respond 'WRONG_ITEM: [item name]'.
    2. If image shows the correct item, respond with the number of objects found, 
       followed by their positions (top-left corner) and dimensions (width, height) in pixels, 
       based on the provided image dimensions.
    3. The AI should also return the dimensions of the image (width, height) in pixels.
    Format:
    - The response should contain:
      1. Image dimensions: width and height (in px).
      2. Number of items found.
      3. A list of objects, each with the following attributes:
         - top: Top position (in px)
         - left: Left position (in px)
         - width: Width of the object (in px)
         - height: Height of the object (in px)
    Example response:
      - For wrong item: 'WRONG_ITEM: keyboard'
      - For correct item: 'Image dimensions: width: 1920px, height: 1080px. 3, [[top: 10, left: 20, width: 30, height: 40], [top: 50, left: 60, width: 20, height: 30], ...]'
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

    console.log(text, "pppppppppppppppppppppp");
    // Check if response indicates wrong item
    if (text.includes("WRONG_ITEM:")) {
      const wrongItem = text.split("WRONG_ITEM:")[1].trim();
      return {
        error: `Wrong item detected: Found ${wrongItem} instead of ${objectType}`,
      };
    }

    // Extract image dimensions, number of objects, and object details
    const regex =
      /Image dimensions: width: (\d+)px, height: (\d+)px\. (\d+),\s?\[\[(.*?)\]\]/;
    const match = text.match(regex);
    if (match) {
      const imageWidth = parseInt(match[1]); // Correctly parsing the width from the response
      const imageHeight = parseInt(match[2]); // Correctly parsing the height
      const count = parseInt(match[3]);

      // Now parsing the object details properly
      const objectDetailsString = match[4];
      const objectDetails = objectDetailsString
        .split("], [")
        .map((detail: string) => {
          const params = detail
            .replace(/[\[\]top: ]/g, "") // Removing non-numeric characters like `[` `]` and `top:`
            .split(", "); // Splitting by comma
          // Parse the parameters into numbers
          if (params.length === 4) {
            const [top, left, width, height] = params.map((param: string) =>
              parseInt(param),
            );
            return { top, left, width, height };
          }
          return null; // If the object data is not valid
        })
        .filter((obj: any) => obj !== null); // Filter out invalid objects

      return { imageWidth, imageHeight, count, objectDetails };
    }

    return { error: "No valid response received from the AI model." };
  } catch (error) {
    console.error("Detailed Gemini API Error:", error);
    return { error: error.toString() };
  }
}
