import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const PORT = 3000;

// Lazy-initialize Gemini client to avoid crashes on startup if GEMINI_API_KEY is not configured yet
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      runtime: "Node.js Express",
      framework: "@google/genai-sdk"
    });
  });

  // Process voice/text order endpoint
  app.post("/api/process-order", async (req, res) => {
    try {
      const { transcript, inventory } = req.body || {};

      if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
        return res.status(400).json({
          success: false,
          error: "आवाज साफ नहीं थी, कृपया दुबारा बोलें। (No voice transcript was received. Please try speaking again.)"
        });
      }

      let ai: GoogleGenAI;
      try {
        ai = getGeminiClient();
      } catch (keyErr: any) {
        return res.status(401).json({
          success: false,
          error: keyErr.message || "Gemini API key is missing or invalid."
        });
      }

      // Format custom inventory context for the prompt
      let inventoryContext = "";
      if (inventory && Array.isArray(inventory)) {
        inventoryContext = `\nThe store owner has customized their products and price list. You MUST prioritize matching the user's words to items in this catalog first! Use their exact prices (pricePerUnit) and names:\n${JSON.stringify(inventory, null, 2)}\n`;
      }

      const prompt = `You are an expert, friendly AI Kirana Shop Billing Orchestrator. 
Your customer or the shop owner (Kirana Dada) has spoken an order transcript. Transcripts can be in Hindi (Devanagari), Hinglish (Romanized Hindi), or English.
Analyze the transcript, extract all ordered items, their quantities, guess their typical Indian retail price in Rupees (INR) if not spoken, calculate sub-items totals, calculate the grand total, and generate helpful multilingual responses.
${inventoryContext}

Transcript: "${transcript}"

Typical daily product pricing indicators for estimation reference (Only use if item is NOT specified in the custom catalog above):
- Milk/दूध: ~30-60 Rs per Litre
- Sugar/चीनी: ~40-45 Rs per kg
- Wheat Flour/आटा: ~35-45 Rs per kg
- Potato/आलू: ~20-30 Rs per kg
- Onions/प्याज: ~30-50 Rs per kg
- Rice/चावल: ~50-120 Rs per kg
- Refined Oil/तेल: ~120-150 Rs per Litre
- Soap/साबुन: ~30-60 Rs per piece
- Maggi Noodles: ~14 Rs per pack

If the user specifies a price or quantity in their transcript, strictly prioritize that. Only sell items if marked inStock or if they are basic necessities.

Return the details strictly modeled per the requested JSON structure. Ensure spokenResponseHindi starts with a friendly affirmation like "हाँ जी" (Yes, sir!) or "ठीक है, आपका आर्डर लिख लिया है।" (Alright, written down your order), spoken naturally in Devnagari Hindi so it can be played back via browser TTS. The whatsappTemplate should be highly legible and formatted with elegant separator lines, emojis, item lists, and grand totals. Ensure the WhatsApp invoice template lists the brand name as ShopPilot.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          success: { type: Type.BOOLEAN },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                itemNameEnglish: { type: Type.STRING, description: "Proper English capitalization name" },
                itemNameHindi: { type: Type.STRING, description: "Proper Devanagari Hindi name" },
                quantity: { type: Type.STRING, description: "e.g. '5 Kg', '2 Litre', '4 Packets'" },
                pricePerUnit: { type: Type.NUMBER },
                totalPrice: { type: Type.NUMBER }
              },
              required: ["itemNameEnglish", "itemNameHindi", "quantity", "pricePerUnit", "totalPrice"]
            }
          },
          calculatedTotal: { type: Type.NUMBER },
          spokenResponseHindi: { type: Type.STRING },
          writtenResponseEnglish: { type: Type.STRING },
          whatsappTemplate: { type: Type.STRING }
        },
        required: ["success", "items", "calculatedTotal", "spokenResponseHindi", "writtenResponseEnglish", "whatsappTemplate"]
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response received from Gemini model.");
      }

      const resultData = JSON.parse(responseText.trim());
      return res.json(resultData);

    } catch (err: any) {
      console.error("Exception raised in Gemini node API processing:", err);
      return res.status(500).json({
        success: false,
        error: "सर्वर व्यस्त है, कृपया कुछ क्षण बाद पुन: प्रयास करें। (Something went wrong. Please try again.)",
        details: err.message || String(err)
      });
    }
  });

  // Vite development middleware vs Static production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[*] Started Smart Kirana ShopPilot node server on http://0.0.0.0:${PORT}`);
  });
}

startServer();
