export type DirectionalBiasValue = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type AnalysisTimeframeValue = 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';

type TimeframeInput = AnalysisTimeframeValue;

type IndicatorInsight = {
    name: string;
    reading: string;
    interpretation: string;
};

type ScenarioItem = {
    title: string;
    trigger: string;
    plan: string;
    invalidation: string;
};

type MultiTimeframeRow = {
    timeframe: 'Short-term' | 'Medium-term' | 'Long-term';
    bias: DirectionalBiasValue;
    trend: string;
    momentum: string;
};

export type GeneratedAnalysis = {
    timeframe: AnalysisTimeframeValue;
    directionalBias: DirectionalBiasValue;
    setupQualityScore: number;
    confidenceScore: number;
    momentumCondition: string;
    trendSummary: string;
    plainLanguageView: string;
    keySupportZones: string[];
    keyResistanceZones: string[];
    indicatorInsights: IndicatorInsight[];
    multiTimeframeView: MultiTimeframeRow[];
    scenarioPlan: ScenarioItem[];
    breakoutRisk: string;
    reversalRisk: string;
};

function hashSymbol(symbol: string) {
    let hash = 0;

    for (let index = 0; index < symbol.length; index += 1) {
        hash = (hash << 5) - hash + symbol.charCodeAt(index);
        hash |= 0;
    }

    return Math.abs(hash);
}

function scoreWindow(value: number, min = 35, max = 88) {
    return min + (value % (max - min + 1));
}

function biasFromComposite(composite: number): DirectionalBiasValue {
    if (composite >= 62) {
        return 'BULLISH';
    }

    if (composite <= 43) {
        return 'BEARISH';
    }

    return 'NEUTRAL';
}

function asTimeframeLabel(timeframe: TimeframeInput) {
    if (timeframe === 'SHORT_TERM') {
        return 'Short-term';
    }
    if (timeframe === 'MEDIUM_TERM') {
        return 'Medium-term';
    }
    return 'Long-term';
}

export function generateTechnicalAnalysis(symbol: string, timeframe: TimeframeInput): GeneratedAnalysis {
    const ticker = symbol.toUpperCase();
    const baseHash = hashSymbol(ticker);
    const timeframeShift = timeframe === 'SHORT_TERM' ? 11 : timeframe === 'MEDIUM_TERM' ? 23 : 37;
    const seed = baseHash + timeframeShift;

    const trendScore = scoreWindow(seed % 97);
    const momentumScore = scoreWindow((seed * 3) % 97);
    const volumeScore = scoreWindow((seed * 7) % 97);
    const structureScore = scoreWindow((seed * 11) % 97);
    const composite = Math.round((trendScore * 0.35 + momentumScore * 0.25 + volumeScore * 0.2 + structureScore * 0.2));
    const directionalBias = biasFromComposite(composite);

    const setupQualityScore = Math.min(95, Math.max(28, Math.round((composite + structureScore) / 2)));
    const confidenceScore = Math.min(92, Math.max(30, Math.round((trendScore + momentumScore) / 2)));

    const momentumCondition =
        momentumScore >= 67
            ? 'Momentum expansion with strong follow-through'
            : momentumScore <= 42
              ? 'Momentum is fading and participation is uneven'
              : 'Momentum is balanced and waiting for a directional catalyst';

    const trendSummary =
        directionalBias === 'BULLISH'
            ? `${ticker} is printing higher lows with constructive pullbacks, and buyers remain in control unless support fractures.`
            : directionalBias === 'BEARISH'
              ? `${ticker} is failing to sustain rebounds, with lower highs signaling distribution pressure and fragile demand.`
              : `${ticker} is rotating in a two-sided range with no durable trend edge until either boundary breaks cleanly.`;

    const plainLanguageView =
        directionalBias === 'BULLISH'
            ? `The chart is acting like a controlled uptrend. Dip buyers are still active, but the setup is strongest only if price holds the nearest demand zone.`
            : directionalBias === 'BEARISH'
              ? `The tape is heavy. Rallies are being sold into, and the structure favors defensive positioning unless price reclaims overhead resistance.`
              : `This is a mixed tape. Price can move both ways quickly, so conviction should stay lower until trend and momentum align.`;

    const supportBase = 90 + (seed % 40);
    const keySupportZones = [
        `${supportBase - 3.8} - ${supportBase - 2.1}`,
        `${supportBase - 8.4} - ${supportBase - 6.2}`,
    ];

    const keyResistanceZones = [
        `${supportBase + 4.2} - ${supportBase + 6.0}`,
        `${supportBase + 10.1} - ${supportBase + 12.3}`,
    ];

    const indicatorInsights: IndicatorInsight[] = [
        {
            name: 'Trend Structure',
            reading: trendScore >= 60 ? 'Trend supportive' : trendScore <= 44 ? 'Trend weakening' : 'Trend indecisive',
            interpretation:
                trendScore >= 60
                    ? 'Swing structure favors directional continuation and orderly pullbacks.'
                    : trendScore <= 44
                      ? 'Trend legs are shortening, raising the probability of failed continuation attempts.'
                      : 'Price structure is transitional and lacks clean directional sequencing.',
        },
        {
            name: 'RSI / Momentum',
            reading: `${Math.min(78, Math.max(24, Math.round(momentumScore * 0.9)))} RSI proxy`,
            interpretation:
                momentumScore >= 68
                    ? 'Momentum confirms directional pressure and supports trend persistence.'
                    : momentumScore <= 40
                      ? 'Momentum divergence risk is rising, which weakens breakout reliability.'
                      : 'Momentum is neutral and likely needs a catalyst to break out.',
        },
        {
            name: 'Volume Participation',
            reading: volumeScore >= 61 ? 'Healthy participation' : volumeScore <= 45 ? 'Participation thin' : 'Average participation',
            interpretation:
                volumeScore >= 61
                    ? 'Volume behavior supports the prevailing move and lowers immediate failure risk.'
                    : volumeScore <= 45
                      ? 'Low participation makes moves more vulnerable to reversals and false breaks.'
                      : 'Volume is not yet confirming conviction either way.',
        },
        {
            name: 'Volatility State',
            reading: structureScore >= 63 ? 'Controlled expansion' : structureScore <= 41 ? 'Unstable chop' : 'Compression regime',
            interpretation:
                structureScore >= 63
                    ? 'Range expansion favors decisive directional moves after pullbacks.'
                    : structureScore <= 41
                      ? 'Choppy tape increases whipsaw risk and reduces signal quality.'
                      : 'Compression suggests a coiled setup; wait for confirmation at key levels.',
        },
    ];

    const multiTimeframeView: MultiTimeframeRow[] = [
        {
            timeframe: 'Short-term',
            bias: biasFromComposite(Math.round((composite + (seed % 12) - 4))),
            trend: trendScore >= 55 ? 'Impulsive swings' : 'Rotational swings',
            momentum: momentumScore >= 58 ? 'Supportive' : 'Mixed',
        },
        {
            timeframe: 'Medium-term',
            bias: biasFromComposite(composite),
            trend: trendScore >= 58 ? 'Directional trend' : 'Broad consolidation',
            momentum: momentumScore >= 54 ? 'Constructive' : 'Fragile',
        },
        {
            timeframe: 'Long-term',
            bias: biasFromComposite(Math.round((composite + structureScore) / 2)),
            trend: structureScore >= 56 ? 'Primary trend intact' : 'Structure under review',
            momentum: volumeScore >= 52 ? 'Participation aligned' : 'Participation lagging',
        },
    ];

    const breakoutRisk =
        directionalBias === 'BULLISH'
            ? volumeScore >= 60
                ? 'Breakout risk is constructive: expansion is more likely to hold above resistance if participation remains stable.'
                : 'Breakout risk is moderate: price can clear resistance but follow-through may fail without volume confirmation.'
            : directionalBias === 'BEARISH'
              ? 'Breakdown risk is elevated: weak bounces into supply can accelerate to lower support if momentum stays soft.'
              : 'Both breakout and breakdown attempts are vulnerable to failure while the market remains range-bound.';

    const reversalRisk =
        directionalBias === 'BULLISH'
            ? 'Reversal risk rises if price loses first support and rebounds become shallow; watch for lower highs after failed breakouts.'
            : directionalBias === 'BEARISH'
              ? 'Reversal risk rises if price reclaims resistance with broad participation and pushes above the prior swing high.'
              : 'Reversal risk is constant in this regime because the tape has no dominant side; keep position sizing controlled.';

    const scenarioPlan: ScenarioItem[] = [
        {
            title: 'Bullish scenario',
            trigger: `Price holds ${keySupportZones[0]} and reclaims ${keyResistanceZones[0]} with expanding participation.`,
            plan: 'Favor continuation setups on pullbacks into reclaimed resistance acting as support.',
            invalidation: `Close back below ${keySupportZones[0]} with weak rebound quality.`,
        },
        {
            title: 'Bearish scenario',
            trigger: `Price rejects near ${keyResistanceZones[0]} and loses ${keySupportZones[0]} on rising sell pressure.`,
            plan: 'Favor downside continuation only after confirmation through support failure and weak retests.',
            invalidation: `Sustained reclaim above ${keyResistanceZones[0]} with improving momentum breadth.`,
        },
        {
            title: 'Neutral / wait scenario',
            trigger: 'Price remains trapped between first support and first resistance with mixed momentum.',
            plan: 'Reduce conviction and wait for a decisive break with confirmation from trend and participation.',
            invalidation: 'Two consecutive directional closes outside the range with clear follow-through.',
        },
    ];

    return {
        timeframe,
        directionalBias,
        setupQualityScore,
        confidenceScore,
        momentumCondition,
        trendSummary,
        plainLanguageView,
        keySupportZones,
        keyResistanceZones,
        indicatorInsights,
        multiTimeframeView,
        scenarioPlan,
        breakoutRisk,
        reversalRisk,
    };
}

export function parseTimeframe(input: string | null | undefined): AnalysisTimeframeValue {
    if (input === 'SHORT_TERM' || input === 'MEDIUM_TERM' || input === 'LONG_TERM') {
        return input;
    }

    return 'MEDIUM_TERM';
}

export function timeframeDisplay(timeframe: AnalysisTimeframeValue) {
    return asTimeframeLabel(timeframe);
}

export function directionalBiasDisplay(bias: DirectionalBiasValue) {
    if (bias === 'BULLISH') {
        return 'Bullish';
    }
    if (bias === 'BEARISH') {
        return 'Bearish';
    }
    return 'Neutral';
}
