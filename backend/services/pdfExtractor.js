const fs = require('fs');
const { GoogleGenAI, Type } = require('@google/genai');

const OBLIGATION_PROMPT = `You are an extraction engine that reads a rental or utility document and outputs a single JSON object describing the next payment owed.

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

const CONTRACT_PROMPT = `You are an extraction engine that reads a service contract (internet, mobile, gym, insurance, streaming, etc.) and outputs a JSON object describing the long-running relationship.

Rules:
- Return ONLY a JSON object matching the requested schema. No prose. No markdown.
- Dates must be ISO format YYYY-MM-DD. If a date is partial or unclear, return null.
- monthlyAmount is the recurring monthly cost as a number (no currency symbol, dot decimal). If pricing is annual, divide by 12. If pricing is variable, return null.
- currency is a 3-letter ISO code (EUR, RON, USD).
- noticePeriodDays is an integer number of days. Convert "1 month" to 30, "2 months" to 60, "8 weeks" to 56.
- cancellationTerms must be a synthesized one-paragraph (max 3 sentences) plain-English summary of HOW the user can cancel — when notice can be given, what form it must take (written, email, online), any penalties or refunds, and what happens at the end of the term. Translate to English. If no cancellation info is present, return null.
- autoRenew is true if the contract automatically renews after the initial term, false if it ends, null if unclear.
- description is one short sentence in English summarizing the contract (e.g. "Vodafone fiber internet, 24-month term").
- If a field is not present in the document, return null. NEVER invent values.
- The document language may be Romanian, English, or German. Translate field values to English where applicable; keep proper names (provider, addresses) in the original language.
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

const contractSchema = {
    type: Type.OBJECT,
    properties: {
        provider: { type: Type.STRING, nullable: true },
        startDate: { type: Type.STRING, nullable: true, description: 'ISO YYYY-MM-DD' },
        endDate: { type: Type.STRING, nullable: true, description: 'ISO YYYY-MM-DD' },
        noticePeriodDays: { type: Type.INTEGER, nullable: true },
        monthlyAmount: { type: Type.NUMBER, nullable: true },
        currency: { type: Type.STRING, nullable: true, description: '3-letter ISO code' },
        cancellationTerms: { type: Type.STRING, nullable: true },
        autoRenew: { type: Type.BOOLEAN, nullable: true },
        description: { type: Type.STRING, nullable: true },
        confidence: { type: Type.NUMBER },
    },
    required: ['confidence'],
};

async function callGemini(filePath, systemPrompt, userPrompt, responseSchema) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const fileBytes = await fs.promises.readFile(filePath);
    const base64 = fileBytes.toString('base64');

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user',
            parts: [
                { inlineData: { mimeType: 'application/pdf', data: base64 } },
                { text: userPrompt },
            ],
        }],
        config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema,
            temperature: 0.1,
        },
    });

    const text = result.text;
    if (!text) throw new Error('Empty response from Gemini');

    try {
        return JSON.parse(text);
    } catch (err) {
        throw new Error(`Gemini returned non-JSON: ${text.slice(0, 200)}`);
    }
}

async function extractObligationFromPdf(filePath, docType) {
    const userInstruction = docType === 'lease'
        ? 'Extract the next rent payment from this rental/lease contract.'
        : 'Extract the payment information from this utility document.';

    const parsed = await callGemini(filePath, OBLIGATION_PROMPT, userInstruction, obligationSchema);

    return {
        provider: parsed.provider ?? null,
        amount: parsed.amount ?? null,
        currency: parsed.currency ?? null,
        dueDate: parsed.dueDate ?? null,
        description: parsed.description ?? null,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    };
}

async function extractContractFromPdf(filePath) {
    const parsed = await callGemini(
        filePath,
        CONTRACT_PROMPT,
        'Extract the contract overview from this service contract document.',
        contractSchema
    );

    return {
        provider: parsed.provider ?? null,
        startDate: parsed.startDate ?? null,
        endDate: parsed.endDate ?? null,
        noticePeriodDays: parsed.noticePeriodDays ?? null,
        monthlyAmount: parsed.monthlyAmount ?? null,
        currency: parsed.currency ?? null,
        cancellationTerms: parsed.cancellationTerms ?? null,
        autoRenew: parsed.autoRenew ?? null,
        description: parsed.description ?? null,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    };
}

module.exports = { extractObligationFromPdf, extractContractFromPdf };
