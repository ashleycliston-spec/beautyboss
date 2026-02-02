import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const getAIClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

export const getBusinessInsights = async (transactions: Transaction[], role: string) => {
    const ai = getAIClient();
    if (!ai) return "API Key not configured. Unable to fetch insights.";

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avgTicket = totalRevenue / (transactions.length || 1);

    const prompt = `
      You are a business analyst for a hair salon.
      I am a ${role}.
      Here is a summary of recent performance:
      - Total Revenue: $${totalRevenue.toFixed(2)}
      - Number of Transactions: ${transactions.length}
      - Average Ticket: $${avgTicket.toFixed(2)}

      Please provide 2-3 short, actionable bullet points on how to improve business or optimize revenue based on these metrics. 
      Keep the tone professional and encouraging. 
      Do not use markdown formatting like bold or headers, just plain text with bullet points.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Unable to generate insights at this time.";
    }
};
