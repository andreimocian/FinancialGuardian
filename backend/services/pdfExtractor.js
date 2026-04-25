const fs = require('fs');
const { GoogleGenAI, Type } = require('@google/genai');

const SYSTEM_PROMPT = `You are an extraction engine that reads a rental or utility document and outputs a single JSON object describing the next payment owed.

Rules:
- Return ONLY a JSON object matching the requested schema. No prose. No markdown.
- For a utility invoice/bill: extract the document's payment due date.
- For a rental/lease contract: dueDate is the next rent payment date that falls on or after today. If the contract specifies a payment day (e.g. "due on the 1st of each month"), compute the next such date. If unclear, return the contract start date.
- amount is a number with no currency symbol; use a dot as decimal separator. For a lease, this is the monthly rent. For a utility, this is the amount due on the invoice.
- currency is a 3-letter ISO code (EUR, RON, USD).
- description is one short sentence in English (e.g. "April rent", "March electricity invoice").
- If a field is unclear, return null. NEVER invent values.
- The document language may be Romanian, English, or German. Translate description to English; keep provider name in original language.
- confidence is your self-reported 0..1 score for the overall extraction quality.`;

const obligationSchema = {
    type: Type.OBJECT,
    properties: {
        provider: { type: Type.STRING, nullable: true },
        amount: { type: Type.NUMBER, nullable: true },
        currency: { type: Type.STRING, nullable: true, description: '3-letter ISO code' },
        dueDate: { type: Type.STRING, nullable: true, description: 'ISO YYYY-MM-DD' },
        description: { type: Type.STRING, nullable: true },
        confidence: { type: Type.NUMBER },
    },
    required: ['confidence'],
};

async function extractObligationFromPdf(filePath, docType) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const fileBytes = await fs.promises.readFile(filePath);
    const base64 = fileBytes.toString('base64');

    const userInstruction = docType === 'lease'
        ? 'Extract the next rent payment from this rental/lease contract.'
        : 'Extract the payment information from this utility document.';

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user',
            parts: [
                { inlineData: { mimeType: 'application/pdf', data: base64 } },
                { text: userInstruction },
            ],
        }],
        config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            responseSchema: obligationSchema,
            temperature: 0.1,
        },
    });

    const text = result.text;
    if (!text) throw new Error('Empty response from Gemini');

    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (err) {
        throw new Error(`Gemini returned non-JSON: ${text.slice(0, 200)}`);
    }

    return {
        provider: parsed.provider ?? null,
        amount: parsed.amount ?? null,
        currency: parsed.currency ?? null,
        dueDate: parsed.dueDate ?? null,
        description: parsed.description ?? null,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    };
}

module.exports = { extractObligationFromPdf };
