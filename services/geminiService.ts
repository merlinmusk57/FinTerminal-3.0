
import { GoogleGenAI } from "@google/genai";
import { FinancialDataPoint } from "../types";

export const queryGemini = async (apiKey: string, prompt: string, history: {role: 'user' | 'model', text: string}[], contextData: FinancialDataPoint[]) => {
  if (!apiKey) {
    throw new Error("API Key not found. Please configure it in Settings.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Prepare context from real data state
  // Optimize context: only send Group level data for brevity unless specific drill-down needed
  const relevantData = contextData.filter(d => d.standardizedSegment === 'Group (Total)');
  const dataContext = JSON.stringify(relevantData.slice(-100)); 
  
  const systemInstruction = `
    You are a senior financial analyst assistant on a platform called FinTerminal HK. 
    You have access to a database of financial information for banks in Hong Kong (Bank of East Asia HK, Standard Chartered HK, BOC HK, Hang Seng).
    
    Here is a snippet of the current available data (Group Level) in JSON format:
    ${dataContext}
    
    Your role is to:
    1. Answer questions about the financial performance of these banks based on the data provided.
    2. Compare them.
    3. If data is missing, state that it is not in the current view.
    4. Be professional, concise, and use financial terminology.
    5. Always cite the "sourceDoc" if possible from the data.
    
    User Query: ${prompt}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I am unable to process that request. Please check your API Key in Settings and ensure it is valid.";
  }
};
