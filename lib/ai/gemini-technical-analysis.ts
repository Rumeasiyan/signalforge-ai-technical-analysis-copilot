import {
    generateTechnicalAnalysis,
    type AnalysisTimeframeValue,
    type DirectionalBiasValue,
    type GeneratedAnalysis,
} from '@/lib/market/analysis-engine';
import { fetchMarketSeries } from '@/lib/market/market-data';
import { buildMarketContext, type MarketContext } from '@/lib/market/indicator-engine';

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

function buildRuleBasedFromMarketContext(
    symbol: string,
    timeframe: AnalysisTimeframeValue,
    context: MarketContext,
    fallback: GeneratedAnalysis
): GeneratedAnalysis {
    const indicatorInsights: IndicatorInsight[] = [
        {
            name: 'Trend Structure',
            reading: `Close ${context.lastClose.toFixed(2)} vs EMA20 ${context.ema20.toFixed(2)} / EMA50 ${context.ema50.toFixed(2)} / EMA200 ${context.ema200.toFixed(2)}`,
            interpretation: context.trendSummary,
        },
        {
            name: 'Momentum (RSI + MACD)',
            reading: `RSI14 ${context.rsi14.toFixed(1)}, MACD histogram ${context.macdHistogram.toFixed(3)}`,
            interpretation: context.momentumCondition,
        },
        {
            name: 'Participation (Volume)',
            reading: `Volume ratio ${context.volumeRatio.toFixed(2)}x vs 20-day average`,
            interpretation:
                context.volumeRatio >= 1.1
                    ? 'Participation supports move quality and improves follow-through probability.'
                    : context.volumeRatio <= 0.85
                      ? 'Participation is thin; breakouts and breakdowns are more vulnerable to failure.'
                      : 'Participation is near baseline and should be monitored for expansion at key levels.',
        },
        {
            name: 'Volatility / Risk State',
            reading: `ATR14 ${context.atr14Pct.toFixed(2)}% of price`,
            interpretation:
                context.atr14Pct > 4.5
                    ? 'High volatility regime; wider risk buffers and smaller size are prudent.'
                    : context.atr14Pct < 1
                      ? 'Low volatility compression; expansion signals should be confirmed before commitment.'
                      : 'Volatility is within normal range for scenario planning.',
        },
    ];

    const multiTimeframeView: MultiTimeframeRow[] = [
        {
            timeframe: 'Short-term',
            bias:
                context.rsi14 >= 57 && context.macdHistogram > 0
                    ? 'BULLISH'
                    : context.rsi14 <= 45 && context.macdHistogram < 0
                      ? 'BEARISH'
                      : 'NEUTRAL',
            trend: context.lastClose > context.ema20 ? 'Above tactical trend' : 'Below tactical trend',
            momentum: context.rsi14 >= 52 ? 'Momentum constructive' : 'Momentum soft',
        },
        {
            timeframe: 'Medium-term',
            bias: context.directionalBias,
            trend: context.lastClose > context.ema50 ? 'Structure constructive' : 'Structure vulnerable',
            momentum: context.macdHistogram >= 0 ? 'Momentum supportive' : 'Momentum fading',
        },
        {
            timeframe: 'Long-term',
            bias:
                context.lastClose > context.ema200
                    ? 'BULLISH'
                    : context.lastClose < context.ema200
                      ? 'BEARISH'
                      : 'NEUTRAL',
            trend: context.lastClose > context.ema200 ? 'Primary trend intact' : 'Primary trend pressured',
            momentum: context.periodReturnPct >= 0 ? 'Long-run drift positive' : 'Long-run drift negative',
        },
    ];

    const scenarioPlan: ScenarioItem[] = [
        {
            title: 'Bullish scenario',
            trigger: `Price holds ${context.supportZones[0] ?? fallback.keySupportZones[0]} and closes above ${context.resistanceZones[0] ?? fallback.keyResistanceZones[0]} with improving participation.`,
            plan: 'Favor continuation entries on controlled retests of reclaimed resistance as support.',
            invalidation: `Sustained close below ${context.supportZones[0] ?? fallback.keySupportZones[0]} with weakening momentum profile.`,
        },
        {
            title: 'Bearish scenario',
            trigger: `Price rejects ${context.resistanceZones[0] ?? fallback.keyResistanceZones[0]} and loses ${context.supportZones[0] ?? fallback.keySupportZones[0]} on negative momentum.`,
            plan: 'Favor downside continuation only after support failure confirms and rebounds stay shallow.',
            invalidation: `Reclaim above ${context.resistanceZones[0] ?? fallback.keyResistanceZones[0]} with broad participation.`,
        },
        {
            title: 'Neutral / wait scenario',
            trigger: 'Price remains trapped between first support and first resistance with no momentum confirmation.',
            plan: 'Reduce conviction and wait for clean directional acceptance outside the range.',
            invalidation: 'Two directional closes with follow-through and rising participation.',
        },
    ];

    return {
        timeframe,
        directionalBias: context.directionalBias,
        setupQualityScore: context.setupQualityScore,
        confidenceScore: context.confidenceScore,
        momentumCondition: context.momentumCondition,
        trendSummary: context.trendSummary,
        plainLanguageView: context.plainLanguageView,
        keySupportZones: context.supportZones.length > 0 ? context.supportZones : fallback.keySupportZones,
        keyResistanceZones: context.resistanceZones.length > 0 ? context.resistanceZones : fallback.keyResistanceZones,
        indicatorInsights,
        multiTimeframeView,
        scenarioPlan,
        breakoutRisk: context.breakoutRisk,
        reversalRisk: context.reversalRisk,
    };
}

export async function generateTechnicalAnalysisWithGemini(
    symbol: string,
    timeframe: AnalysisTimeframeValue
): Promise<GeneratedAnalysis> {
    const baseline = generateTechnicalAnalysis(symbol, timeframe);
    const series = await fetchMarketSeries(symbol);
    const marketContext = series ? buildMarketContext(series) : null;
    const contextBaseline = marketContext
        ? buildRuleBasedFromMarketContext(symbol, timeframe, marketContext, baseline)
        : baseline;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return contextBaseline;
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const prompt = `You are a senior technical analyst writing an explainable market note.\nReturn JSON only with the exact schema requested.\nDo not include markdown fences.\n\nContext:\n- Instrument: ${symbol}\n- Requested timeframe: ${timeframeLabel(timeframe)}\n- Use provided market context as source of truth when available.\n- If signals conflict, show uncertainty clearly.\n\nMarket context (may be null if unavailable):\n${JSON.stringify(marketContext, null, 2)}\n\nRule-based baseline analysis to refine:\n${JSON.stringify(contextBaseline, null, 2)}\n\nReturn JSON object with these keys:\n{\n  "directionalBias": "BULLISH|BEARISH|NEUTRAL",\n  "setupQualityScore": number,\n  "confidenceScore": number,\n  "momentumCondition": string,\n  "trendSummary": string,\n  "plainLanguageView": string,\n  "keySupportZones": string[],\n  "keyResistanceZones": string[],\n  "indicatorInsights": [{"name": string, "reading": string, "interpretation": string}],\n  "multiTimeframeView": [{"timeframe": "Short-term|Medium-term|Long-term", "bias": "BULLISH|BEARISH|NEUTRAL", "trend": string, "momentum": string}],\n  "scenarioPlan": [{"title": string, "trigger": string, "plan": string, "invalidation": string}],\n  "breakoutRisk": string,\n  "reversalRisk": string\n}`;

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
            return contextBaseline;
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
            return contextBaseline;
        }

        const parsed = JSON.parse(extractJson(candidateText)) as GeminiAnalysisResult;

        return {
            timeframe,
            directionalBias: normalizeBias(parsed.directionalBias, contextBaseline.directionalBias),
            setupQualityScore: normalizeScore(parsed.setupQualityScore, contextBaseline.setupQualityScore),
            confidenceScore: normalizeScore(parsed.confidenceScore, contextBaseline.confidenceScore),
            momentumCondition: nonEmptyString(parsed.momentumCondition, contextBaseline.momentumCondition),
            trendSummary: nonEmptyString(parsed.trendSummary, contextBaseline.trendSummary),
            plainLanguageView: nonEmptyString(parsed.plainLanguageView, contextBaseline.plainLanguageView),
            keySupportZones: stringArray(parsed.keySupportZones, contextBaseline.keySupportZones),
            keyResistanceZones: stringArray(parsed.keyResistanceZones, contextBaseline.keyResistanceZones),
            indicatorInsights: normalizeIndicatorInsights(parsed.indicatorInsights, contextBaseline.indicatorInsights),
            multiTimeframeView: normalizeTimeframeRows(parsed.multiTimeframeView, contextBaseline.multiTimeframeView),
            scenarioPlan: normalizeScenarioRows(parsed.scenarioPlan, contextBaseline.scenarioPlan),
            breakoutRisk: nonEmptyString(parsed.breakoutRisk, contextBaseline.breakoutRisk),
            reversalRisk: nonEmptyString(parsed.reversalRisk, contextBaseline.reversalRisk),
        };
    } catch {
        return contextBaseline;
    }
}
