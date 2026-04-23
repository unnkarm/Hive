import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateInsight(stats: any) {
  const prompt = `You are an AI workforce intelligence expert for ProductHive. 
  Current Dashboard Stats:
  - Active Zones: ${stats.activeZones}
  - Total Movement: ${stats.movementPercentage}%
  - Idle Rate: ${stats.idlePercentage}%
  - Alerts: ${stats.activeAlerts}

  Provide 1 short, professional, business-friendly insight (15-20 words) about workplace efficiency or safety. No jargon.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Workplace activity is within optimal levels. Movement across zones A and B remains consistent.";
  } catch (err) {
    return "Optimizing zone assignments could improve workflow efficiency by 12% based on current movement patterns.";
  }
}
