const { GoogleGenAI, Type } = require('@google/genai');

const SYSTEM_PROMPT = `You are a personal finance assistant that helps a user evaluate whether a savings goal is achievable and produces concrete recommendations.

Rules:
- Return ONLY a JSON object matching the requested schema. No prose. No markdown.
- feasibility:
    "achievable" — the required monthly saving is comfortably below the user's current net surplus.
    "tight"      — the required monthly saving is close to or slightly above the current net surplus, but realistic with adjustments.
    "unrealistic" — the required monthly saving substantially exceeds what could be saved even with deep cuts.
- feasibilityReason: one sentence explaining the verdict, mentioning specific numbers.
- narrative: 2–4 calm, neutral sentences explaining where the user stands and what would get them to the goal. Mention specific categories.
- recommendations: at most 5 items. Order by largest monthlySavings first.
    - action="reduce": cut spending in this category to a lower monthly amount.
    - action="eliminate": stop spending in this category entirely.
    - action="review": flag overlap or potential waste (e.g. duplicate streaming services).
    - action="maintain": optional — only include if the user is already optimal somewhere worth noting.
    - reasoning: one sentence per recommendation, citing the actual monthly figure from the data.
    - fromMonthly and toMonthly are required for "reduce"; omit toMonthly for "eliminate" (it's 0).
- totalProjectedSavings: sum of monthlySavings across the recommendations.
- Never invent categories or amounts. Use only what is in the provided context.
- Tone: calm, observational, never scolding. The user is in control.
- Always use the currency from the provided context when writing prose.`;

const recommendationSchema = {
    type: Type.OBJECT,
    properties: {
        category: { type: Type.STRING },
        action: { type: Type.STRING, enum: ['reduce', 'eliminate', 'review', 'maintain'] },
        fromMonthly: { type: Type.NUMBER, nullable: true },
        toMonthly: { type: Type.NUMBER, nullable: true },
        monthlySavings: { type: Type.NUMBER },
        reasoning: { type: Type.STRING },
    },
    required: ['category', 'action', 'monthlySavings', 'reasoning'],
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        feasibility: { type: Type.STRING, enum: ['achievable', 'tight', 'unrealistic'] },
        feasibilityReason: { type: Type.STRING },
        narrative: { type: Type.STRING },
        recommendations: {
            type: Type.ARRAY,
            items: recommendationSchema,
        },
        totalProjectedSavings: { type: Type.NUMBER },
    },
    required: ['feasibility', 'feasibilityReason', 'narrative', 'recommendations', 'totalProjectedSavings'],
};

async function analyzeGoal({ goal, context }) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const userPayload = {
        goal: {
            name: goal.name,
            targetAmount: goal.targetAmount,
            currentSaved: goal.currentSaved || 0,
            currency: goal.currency,
            targetDate: goal.targetDate.toISOString().slice(0, 10),
            todayDate: new Date().toISOString().slice(0, 10),
            monthsLeft: goal.monthsLeft,
            requiredMonthly: goal.requiredMonthly,
        },
        context,
    };

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user',
            parts: [{ text: JSON.stringify(userPayload) }],
        }],
        config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
            temperature: 0.3,
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

    if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 5) {
        parsed.recommendations = parsed.recommendations.slice(0, 5);
    }

    return parsed;
}

module.exports = { analyzeGoal };
