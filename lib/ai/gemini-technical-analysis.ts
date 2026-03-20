import {
    generateTechnicalAnalysis,
    type AnalysisTimeframeValue,
    type DirectionalBiasValue,
    type GeneratedAnalysis,
} from '@/lib/market/analysis-engine';

type IndicatorInsight = GeneratedAnalysis['indicatorInsights'][number];
type MultiTimeframeRow = GeneratedAnalysis['multiTimeframeView'][number];
type ScenarioItem = GeneratedAnalysis['scenarioPlan'][number];

type GeminiAnalysisResult = {
    directionalBias?: string;
    setupQualityScore?: number;
    confidenceScore?: number;
    momentumCondition?: string;
    trendSummary?: string;
    plainLanguageView?: string;
    keySupportZones?: string[];
    keyResistanceZones?: string[];
    indicatorInsights?: IndicatorInsight[];
    multiTimeframeView?: MultiTimeframeRow[];
    scenarioPlan?: ScenarioItem[];
    breakoutRisk?: string;
    reversalRisk?: string;
};

function normalizeScore(value: unknown, fallback: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return fallback;
    }

    return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeBias(value: unknown, fallback: DirectionalBiasValue): DirectionalBiasValue {
    if (value === 'BULLISH' || value === 'BEARISH' || value === 'NEUTRAL') {
        return value;
    }

    return fallback;
}

function nonEmptyString(value: unknown, fallback: string, maxLength = 700) {
    if (typeof value !== 'string') {
        return fallback;
    }

    const cleaned = value.trim();
    if (!cleaned) {
        return fallback;
    }

    return cleaned.slice(0, maxLength);
}

function stringArray(value: unknown, fallback: string[], maxItems = 4) {
    if (!Array.isArray(value)) {
        return fallback;
    }

    const items = value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, maxItems);

    return items.length > 0 ? items : fallback;
}

function normalizeIndicatorInsights(value: unknown, fallback: IndicatorInsight[]) {
    if (!Array.isArray(value)) {
        return fallback;
    }

    const rows = value
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item) => ({
            name: nonEmptyString(item.name, 'Indicator'),
            reading: nonEmptyString(item.reading, 'Mixed reading', 180),
            interpretation: nonEmptyString(item.interpretation, 'No interpretation provided.'),
        }))
        .slice(0, 6);

    return rows.length > 0 ? rows : fallback;
}

function normalizeTimeframeRows(value: unknown, fallback: MultiTimeframeRow[]) {
    if (!Array.isArray(value)) {
        return fallback;
    }

    const rows = value
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item) => ({
            timeframe: nonEmptyString(item.timeframe, 'Medium-term', 40) as MultiTimeframeRow['timeframe'],
            bias: normalizeBias(item.bias, 'NEUTRAL'),
            trend: nonEmptyString(item.trend, 'Trend is mixed', 160),
            momentum: nonEmptyString(item.momentum, 'Momentum is mixed', 160),
        }))
        .slice(0, 3);

    return rows.length > 0 ? rows : fallback;
}

function normalizeScenarioRows(value: unknown, fallback: ScenarioItem[]) {
    if (!Array.isArray(value)) {
        return fallback;
    }

    const rows = value
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item) => ({
            title: nonEmptyString(item.title, 'Scenario', 80),
            trigger: nonEmptyString(item.trigger, 'No trigger provided.'),
            plan: nonEmptyString(item.plan, 'No plan provided.'),
            invalidation: nonEmptyString(item.invalidation, 'No invalidation provided.'),
        }))
        .slice(0, 4);

    return rows.length > 0 ? rows : fallback;
}

function extractJson(text: string) {
    const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
        return fencedMatch[1].trim();
    }

    const firstCurly = text.indexOf('{');
    const lastCurly = text.lastIndexOf('}');

    if (firstCurly >= 0 && lastCurly > firstCurly) {
        return text.slice(firstCurly, lastCurly + 1);
    }

    return text;
}

function timeframeLabel(timeframe: AnalysisTimeframeValue) {
    if (timeframe === 'SHORT_TERM') {
        return 'Short-term';
    }
    if (timeframe === 'MEDIUM_TERM') {
        return 'Medium-term';
    }
    return 'Long-term';
}

export async function generateTechnicalAnalysisWithGemini(
    symbol: string,
    timeframe: AnalysisTimeframeValue
): Promise<GeneratedAnalysis> {
    const baseline = generateTechnicalAnalysis(symbol, timeframe);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return baseline;
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const prompt = `You are a senior technical analyst writing an explainable market note.\nReturn JSON only with the exact schema requested.\nDo not include markdown fences.\n\nContext:\n- Instrument: ${symbol}\n- Requested timeframe: ${timeframeLabel(timeframe)}\n- This is a demo environment without live market candles.\n- Improve clarity and trader usefulness while staying realistic and uncertainty-aware.\n\nBaseline synthetic analysis (treat as context and refine language):\n${JSON.stringify(baseline, null, 2)}\n\nReturn JSON object with these keys:\n{\n  "directionalBias": "BULLISH|BEARISH|NEUTRAL",\n  "setupQualityScore": number,\n  "confidenceScore": number,\n  "momentumCondition": string,\n  "trendSummary": string,\n  "plainLanguageView": string,\n  "keySupportZones": string[],\n  "keyResistanceZones": string[],\n  "indicatorInsights": [{"name": string, "reading": string, "interpretation": string}],\n  "multiTimeframeView": [{"timeframe": "Short-term|Medium-term|Long-term", "bias": "BULLISH|BEARISH|NEUTRAL", "trend": string, "momentum": string}],\n  "scenarioPlan": [{"title": string, "trigger": string, "plan": string, "invalidation": string}],\n  "breakoutRisk": string,\n  "reversalRisk": string\n}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    temperature: 0.5,
                    topP: 0.9,
                    responseMimeType: 'application/json',
                },
            }),
            cache: 'no-store',
        });

        if (!response.ok) {
            return baseline;
        }

        const payload = (await response.json()) as {
            candidates?: Array<{
                content?: {
                    parts?: Array<{
                        text?: string;
                    }>;
                };
            }>;
        };

        const candidateText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
            return baseline;
        }

        const parsed = JSON.parse(extractJson(candidateText)) as GeminiAnalysisResult;

        return {
            timeframe,
            directionalBias: normalizeBias(parsed.directionalBias, baseline.directionalBias),
            setupQualityScore: normalizeScore(parsed.setupQualityScore, baseline.setupQualityScore),
            confidenceScore: normalizeScore(parsed.confidenceScore, baseline.confidenceScore),
            momentumCondition: nonEmptyString(parsed.momentumCondition, baseline.momentumCondition),
            trendSummary: nonEmptyString(parsed.trendSummary, baseline.trendSummary),
            plainLanguageView: nonEmptyString(parsed.plainLanguageView, baseline.plainLanguageView),
            keySupportZones: stringArray(parsed.keySupportZones, baseline.keySupportZones),
            keyResistanceZones: stringArray(parsed.keyResistanceZones, baseline.keyResistanceZones),
            indicatorInsights: normalizeIndicatorInsights(parsed.indicatorInsights, baseline.indicatorInsights),
            multiTimeframeView: normalizeTimeframeRows(parsed.multiTimeframeView, baseline.multiTimeframeView),
            scenarioPlan: normalizeScenarioRows(parsed.scenarioPlan, baseline.scenarioPlan),
            breakoutRisk: nonEmptyString(parsed.breakoutRisk, baseline.breakoutRisk),
            reversalRisk: nonEmptyString(parsed.reversalRisk, baseline.reversalRisk),
        };
    } catch {
        return baseline;
    }
}
