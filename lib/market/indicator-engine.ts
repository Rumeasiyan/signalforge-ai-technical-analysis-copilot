import type { MarketSeries } from '@/lib/market/market-data';

type Bias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export type MarketContext = {
    provider: 'yahoo';
    providerSymbol: string;
    bars: number;
    lastClose: number;
    periodReturnPct: number;
    ema20: number;
    ema50: number;
    ema200: number;
    rsi14: number;
    macdLine: number;
    macdSignal: number;
    macdHistogram: number;
    atr14Pct: number;
    avgVolume20: number;
    latestVolume: number;
    volumeRatio: number;
    supportZones: string[];
    resistanceZones: string[];
    momentumCondition: string;
    directionalBias: Bias;
    setupQualityScore: number;
    confidenceScore: number;
    trendSummary: string;
    plainLanguageView: string;
    breakoutRisk: string;
    reversalRisk: string;
};

function ema(values: number[], period: number) {
    const smoothing = 2 / (period + 1);
    let current = values[0];

    for (let index = 1; index < values.length; index += 1) {
        current = values[index] * smoothing + current * (1 - smoothing);
    }

    return current;
}

function rsi(values: number[], period: number) {
    if (values.length <= period) {
        return 50;
    }

    let gains = 0;
    let losses = 0;

    for (let index = values.length - period; index < values.length; index += 1) {
        const change = values[index] - values[index - 1];
        if (change > 0) {
            gains += change;
        } else {
            losses += Math.abs(change);
        }
    }

    if (losses === 0) {
        return 100;
    }

    const rs = gains / losses;
    return 100 - 100 / (1 + rs);
}

function macd(values: number[]) {
    const ema12 = ema(values, 12);
    const ema26 = ema(values, 26);
    const macdLine = ema12 - ema26;
    const macdSeries: number[] = [];

    for (let index = 26; index < values.length; index += 1) {
        const slice = values.slice(0, index + 1);
        macdSeries.push(ema(slice, 12) - ema(slice, 26));
    }

    const signal = macdSeries.length >= 9 ? ema(macdSeries, 9) : macdLine;
    return {
        macdLine,
        signal,
        histogram: macdLine - signal,
    };
}

function atrPercent(series: MarketSeries, period = 14) {
    const candles = series.candles;
    if (candles.length < period + 2) {
        return 2;
    }

    const trueRanges: number[] = [];
    for (let index = candles.length - period; index < candles.length; index += 1) {
        const current = candles[index];
        const previous = candles[index - 1];
        const tr = Math.max(
            current.high - current.low,
            Math.abs(current.high - previous.close),
            Math.abs(current.low - previous.close)
        );
        trueRanges.push(tr);
    }

    const atr = trueRanges.reduce((sum, value) => sum + value, 0) / trueRanges.length;
    const lastClose = candles[candles.length - 1].close;
    return (atr / lastClose) * 100;
}

function average(values: number[]) {
    if (values.length === 0) {
        return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function levelBand(value: number, percent = 0.45) {
    const delta = value * (percent / 100);
    return `${(value - delta).toFixed(2)} - ${(value + delta).toFixed(2)}`;
}

function pickLevels(values: number[], side: 'support' | 'resistance') {
    const sorted = [...values].sort((a, b) => a - b);
    if (sorted.length === 0) {
        return [];
    }

    const a = side === 'support' ? sorted[Math.floor(sorted.length * 0.2)] : sorted[Math.floor(sorted.length * 0.8)];
    const b = side === 'support' ? sorted[Math.floor(sorted.length * 0.35)] : sorted[Math.floor(sorted.length * 0.92)];

    return [levelBand(a), levelBand(b)];
}

function boundedScore(value: number) {
    return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildMarketContext(series: MarketSeries): MarketContext {
    const closes = series.candles.map((candle) => candle.close);
    const highs = series.candles.map((candle) => candle.high);
    const lows = series.candles.map((candle) => candle.low);
    const volumes = series.candles.map((candle) => candle.volume);

    const lastClose = closes[closes.length - 1];
    const lookback = closes.slice(-90);
    const periodReturnPct = ((lastClose - lookback[0]) / lookback[0]) * 100;

    const ema20 = ema(closes.slice(-120), 20);
    const ema50 = ema(closes.slice(-180), 50);
    const ema200 = ema(closes, 200);
    const rsi14 = rsi(closes, 14);
    const macdStats = macd(closes);
    const atr14Pct = atrPercent(series, 14);

    const latestVolume = volumes[volumes.length - 1];
    const avgVolume20 = average(volumes.slice(-20));
    const volumeRatio = avgVolume20 > 0 ? latestVolume / avgVolume20 : 1;

    const trendBull = lastClose > ema50 && ema20 > ema50;
    const trendBear = lastClose < ema50 && ema20 < ema50;
    const momentumBull = rsi14 >= 53 && macdStats.histogram > 0;
    const momentumBear = rsi14 <= 47 && macdStats.histogram < 0;

    let directionalBias: Bias = 'NEUTRAL';
    if (trendBull && momentumBull) {
        directionalBias = 'BULLISH';
    } else if (trendBear && momentumBear) {
        directionalBias = 'BEARISH';
    }

    const trendScore =
        (lastClose > ema20 ? 20 : 0) +
        (lastClose > ema50 ? 20 : 0) +
        (lastClose > ema200 ? 15 : 0) +
        (ema20 > ema50 ? 15 : 0) +
        (ema50 > ema200 ? 10 : 0);

    const momentumScore =
        (rsi14 >= 55 && rsi14 <= 70 ? 18 : rsi14 > 70 ? 10 : 6) +
        (macdStats.histogram > 0 ? 16 : 8) +
        (Math.abs(macdStats.histogram) > Math.abs(macdStats.signal) * 0.12 ? 12 : 8);

    const participationScore =
        (volumeRatio >= 1.15 ? 18 : volumeRatio >= 0.9 ? 12 : 7) +
        (atr14Pct >= 1.1 && atr14Pct <= 3.8 ? 14 : 9);

    const setupQualityScore = boundedScore(trendScore + momentumScore + participationScore);
    const confidenceScore = boundedScore(
        setupQualityScore -
            (directionalBias === 'NEUTRAL' ? 12 : 0) -
            (atr14Pct > 4.8 ? 8 : 0) -
            (volumeRatio < 0.75 ? 6 : 0)
    );

    const momentumCondition =
        rsi14 >= 65
            ? 'Momentum is elevated and trend-following moves remain intact, though extension risk is rising.'
            : rsi14 <= 40
              ? 'Momentum is weak and rebound attempts are less reliable until buyers reclaim control.'
              : 'Momentum is balanced and should be validated by trend structure at key levels.';

    const supportZones = pickLevels(lows.slice(-60), 'support');
    const resistanceZones = pickLevels(highs.slice(-60), 'resistance');

    const trendSummary =
        directionalBias === 'BULLISH'
            ? `Price is holding above key moving averages with constructive swing structure, suggesting buyers still control the tape.`
            : directionalBias === 'BEARISH'
              ? `Price is trading below key moving averages, and rebound structure remains vulnerable to renewed selling pressure.`
              : `Price is oscillating around key moving averages, signaling a rotational environment without a clean directional edge.`;

    const plainLanguageView =
        directionalBias === 'BULLISH'
            ? 'The setup favors continuation while dips hold support. Keep focus on pullback quality and volume confirmation at resistance.'
            : directionalBias === 'BEARISH'
              ? 'The setup is defensive. Strength into resistance may fail unless momentum and participation improve materially.'
              : 'The setup is mixed. Prioritize risk control and wait for clearer alignment between trend, momentum, and participation.';

    const breakoutRisk =
        directionalBias === 'BULLISH'
            ? volumeRatio >= 1
                ? 'Bullish breakout attempts have moderate-to-good reliability while participation stays above average.'
                : 'Breakout attempts can fail quickly if participation remains below average.'
            : directionalBias === 'BEARISH'
              ? 'Breakdown risk is elevated when rebounds fail under resistance and momentum remains soft.'
              : 'Both breakout and breakdown attempts have higher false-signal risk in this mixed regime.';

    const reversalRisk =
        directionalBias === 'BULLISH'
            ? 'Reversal risk rises if price closes below first support and volume expands on downside candles.'
            : directionalBias === 'BEARISH'
              ? 'Reversal risk rises if price reclaims first resistance with strengthening momentum and broad participation.'
              : 'Reversal risk is persistent because trend ownership is unclear.';

    return {
        provider: 'yahoo',
        providerSymbol: series.providerSymbol,
        bars: series.candles.length,
        lastClose,
        periodReturnPct,
        ema20,
        ema50,
        ema200,
        rsi14,
        macdLine: macdStats.macdLine,
        macdSignal: macdStats.signal,
        macdHistogram: macdStats.histogram,
        atr14Pct,
        avgVolume20,
        latestVolume,
        volumeRatio,
        supportZones,
        resistanceZones,
        momentumCondition,
        directionalBias,
        setupQualityScore,
        confidenceScore,
        trendSummary,
        plainLanguageView,
        breakoutRisk,
        reversalRisk,
    };
}
