'use client';

import { useMemo, useState } from 'react';

type CandlePoint = {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

type PriceChartProps = {
    symbol: string;
    candles: CandlePoint[];
    supportZones: string[];
    resistanceZones: string[];
};

function parseZoneMidpoint(zone: string) {
    const parts = zone.split('-').map((item) => Number(item.trim()));
    if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
        return null;
    }

    return (parts[0] + parts[1]) / 2;
}

function formatDate(timestamp: number) {
    return new Date(timestamp * 1000).toLocaleDateString();
}

export function PriceChart({ symbol, candles, supportZones, resistanceZones }: PriceChartProps) {
    const [windowSize, setWindowSize] = useState(90);

    const visibleCandles = useMemo(() => {
        return candles.slice(-windowSize);
    }, [candles, windowSize]);

    const yMin = useMemo(() => Math.min(...visibleCandles.map((candle) => candle.low)), [visibleCandles]);
    const yMax = useMemo(() => Math.max(...visibleCandles.map((candle) => candle.high)), [visibleCandles]);
    const yRange = Math.max(0.0001, yMax - yMin);

    const chartPath = useMemo(() => {
        if (visibleCandles.length < 2) {
            return '';
        }

        return visibleCandles
            .map((candle, index) => {
                const x = (index / (visibleCandles.length - 1)) * 100;
                const y = 100 - ((candle.close - yMin) / yRange) * 100;
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ');
    }, [visibleCandles, yMin, yRange]);

    const supportLines = supportZones
        .map(parseZoneMidpoint)
        .filter((value): value is number => value !== null)
        .map((value) => ({
            value,
            y: 100 - ((value - yMin) / yRange) * 100,
        }))
        .filter((line) => line.y >= 0 && line.y <= 100);

    const resistanceLines = resistanceZones
        .map(parseZoneMidpoint)
        .filter((value): value is number => value !== null)
        .map((value) => ({
            value,
            y: 100 - ((value - yMin) / yRange) * 100,
        }))
        .filter((line) => line.y >= 0 && line.y <= 100);

    const latest = visibleCandles[visibleCandles.length - 1];

    return (
        <article className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold text-foreground">Price data used in analysis</h2>
                    <p className="text-xs text-muted-foreground">
                        {symbol} · {visibleCandles.length} daily bars · last close {latest?.close.toFixed(2)}
                    </p>
                </div>
                <select
                    value={windowSize}
                    onChange={(event) => setWindowSize(Number(event.target.value))}
                    className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                >
                    <option value={30}>30D</option>
                    <option value={90}>90D</option>
                    <option value={180}>180D</option>
                </select>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                <svg viewBox="0 0 100 100" className="h-56 w-full" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgb(14 116 144 / 0.35)" />
                            <stop offset="100%" stopColor="rgb(14 116 144 / 0.05)" />
                        </linearGradient>
                    </defs>

                    {supportLines.map((line) => (
                        <line
                            key={`support-${line.value}`}
                            x1="0"
                            y1={line.y}
                            x2="100"
                            y2={line.y}
                            stroke="rgb(16 185 129 / 0.45)"
                            strokeDasharray="2 2"
                        />
                    ))}

                    {resistanceLines.map((line) => (
                        <line
                            key={`resistance-${line.value}`}
                            x1="0"
                            y1={line.y}
                            x2="100"
                            y2={line.y}
                            stroke="rgb(244 63 94 / 0.45)"
                            strokeDasharray="2 2"
                        />
                    ))}

                    {chartPath ? (
                        <>
                            <path d={`${chartPath} L 100 100 L 0 100 Z`} fill="url(#price-fill)" />
                            <path d={chartPath} fill="none" stroke="rgb(14 116 144)" strokeWidth="1.6" />
                        </>
                    ) : null}
                </svg>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(visibleCandles[0]?.timestamp ?? 0)}</span>
                <span>{formatDate(visibleCandles[visibleCandles.length - 1]?.timestamp ?? 0)}</span>
            </div>
        </article>
    );
}
