import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client.
// On Vercel, you should add VITE_GEMINI_API_KEY to your Vercel project environment variables.
// In development, you can add it to a .env.local file.
let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    // Vite handles VITE_ prefixed environment variables automatically on the client side.
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? (process as any).env?.GEMINI_API_KEY : undefined);
    
    if (!apiKey) {
      console.warn('Gemini API key is not configured. AI features will be disabled. Please set VITE_GEMINI_API_KEY.');
      // return a dummy client or throw an error based on your app's needs.
      return new GoogleGenAI({ apiKey: 'dummy-key-to-prevent-crash' });
    }
    
    aiClient = new GoogleGenAI({ apiKey });
  }
  
  return aiClient;
}

export async function generateText(prompt: string): Promise<string> {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || '';
  } catch (error) {
    console.error('Gemini API Error:', error);
    return 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.';
  }
}
