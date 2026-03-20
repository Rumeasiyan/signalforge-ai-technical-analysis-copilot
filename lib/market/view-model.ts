import type { Prisma } from '@/app/generated/prisma/client';

type IndicatorInsight = {
    name: string;
    reading: string;
    interpretation: string;
};

type MultiTimeframeRow = {
    timeframe: string;
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    trend: string;
    momentum: string;
};

type ScenarioItem = {
    title: string;
    trigger: string;
    plan: string;
    invalidation: string;
};

function parseArray<T>(value: Prisma.JsonValue, fallback: T[]): T[] {
    return Array.isArray(value) ? (value as T[]) : fallback;
}

export function parseSupportZones(value: Prisma.JsonValue) {
    return parseArray<string>(value, []);
}

export function parseResistanceZones(value: Prisma.JsonValue) {
    return parseArray<string>(value, []);
}

export function parseIndicatorInsights(value: Prisma.JsonValue) {
    return parseArray<IndicatorInsight>(value, []);
}

export function parseTimeframeTable(value: Prisma.JsonValue) {
    return parseArray<MultiTimeframeRow>(value, []);
}

export function parseScenarioPlan(value: Prisma.JsonValue) {
    return parseArray<ScenarioItem>(value, []);
}
