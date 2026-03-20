'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { parseTimeframe } from '@/lib/market/analysis-engine';
import { generateTechnicalAnalysisWithGemini } from '@/lib/ai/gemini-technical-analysis';
import { getCurrentDbUser, resolveInstrument } from '@/lib/market/repository';

export async function runAnalysisAction(formData: FormData) {
    const symbol = String(formData.get('symbol') ?? '')
        .trim()
        .toUpperCase();
    const timeframe = parseTimeframe(String(formData.get('timeframe') ?? 'MEDIUM_TERM'));

    if (!symbol) {
        return;
    }

    const user = await getCurrentDbUser();

    if (!user) {
        return;
    }

    const instrument = await resolveInstrument(symbol);

    if (!instrument) {
        return;
    }

    const analysis = await generateTechnicalAnalysisWithGemini(symbol, timeframe);

    await prisma.analysis.create({
        data: {
            userId: user.id,
            instrumentId: instrument.id,
            timeframe: analysis.timeframe,
            directionalBias: analysis.directionalBias,
            setupQualityScore: analysis.setupQualityScore,
            confidenceScore: analysis.confidenceScore,
            momentumCondition: analysis.momentumCondition,
            trendSummary: analysis.trendSummary,
            plainLanguageView: analysis.plainLanguageView,
            keySupportZones: analysis.keySupportZones,
            keyResistanceZones: analysis.keyResistanceZones,
            indicatorInsights: analysis.indicatorInsights,
            multiTimeframeView: analysis.multiTimeframeView,
            scenarioPlan: analysis.scenarioPlan,
            breakoutRisk: analysis.breakoutRisk,
            reversalRisk: analysis.reversalRisk,
        },
    });

    revalidatePath('/dashboard');
    revalidatePath('/analysis');
    revalidatePath('/watchlist');
    revalidatePath('/history');
}

export async function toggleWatchlistAction(formData: FormData) {
    const symbol = String(formData.get('symbol') ?? '')
        .trim()
        .toUpperCase();

    if (!symbol) {
        return;
    }

    const user = await getCurrentDbUser();

    if (!user) {
        return;
    }

    const instrument = await resolveInstrument(symbol);

    if (!instrument) {
        return;
    }

    const existing = await prisma.watchlistItem.findUnique({
        where: {
            userId_instrumentId: {
                userId: user.id,
                instrumentId: instrument.id,
            },
        },
    });

    if (existing) {
        await prisma.watchlistItem.delete({ where: { id: existing.id } });
    } else {
        await prisma.watchlistItem.create({
            data: {
                userId: user.id,
                instrumentId: instrument.id,
            },
        });
    }

    revalidatePath('/dashboard');
    revalidatePath('/analysis');
    revalidatePath('/watchlist');
}
