import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini
// Setting User-Agent is required
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API endpoint to process images of receipts/bills
app.post("/api/gemini/extract-transactions", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // using pro for complex reasoning / OCR extraction
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || "image/jpeg",
          },
        },
        {
          text: `You are a financial assistant. Extract the main purchase information from this receipt, invoice, or statement.
Return ONLY a valid JSON object. Do not include markdown formatting or json code blocks.
The object must have the following structure:
- description: string (Name of the establishment or main description of the expense/income)
- amount: number (Total value of the purchase/receipt as a positive number)
- date: string (ISO format YYYY-MM-DD. If year is missing, use current year)
- receiptNumber: string (The invoice, coupon or receipt number, if available. Otherwise use "")
- type: string (must be exactly "expense" or "income" - default to expense for store receipts)

Make sure to parse amounts correctly, ignoring currency symbols and converting comma to dot if necessary (e.g. 1.250,50 -> 1250.50).`,
        },
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    let rawText = response.text || "";
    if (rawText.startsWith('```json')) rawText = rawText.replace(/```json/g, '').replace(/```/g, '');
    
    let extractedData = null;
    try {
      extractedData = JSON.parse(rawText);
    } catch (e) {
      console.error("Failed to parse JSON", rawText);
      return res.status(500).json({ error: "Failed to parse AI response into JSON" });
    }

    res.json({ transaction: extractedData });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

async function startServer() {
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
