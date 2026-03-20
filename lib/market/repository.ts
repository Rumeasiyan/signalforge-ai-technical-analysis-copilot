import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { INSTRUMENT_UNIVERSE, findInstrumentBySymbol } from '@/lib/market/instruments';

export async function getCurrentDbUser() {
    const { userId } = await auth();

    if (!userId) {
        return null;
    }

    return prisma.user.findUnique({ where: { clerkId: userId } });
}

export async function ensureInstrumentsSeeded() {
    await prisma.instrument.createMany({
        data: INSTRUMENT_UNIVERSE,
        skipDuplicates: true,
    });
}

export async function resolveInstrument(symbol: string) {
    const fallback = findInstrumentBySymbol(symbol);

    if (!fallback) {
        return null;
    }

    await ensureInstrumentsSeeded();

    return prisma.instrument.findUnique({
        where: { symbol: fallback.symbol },
    });
}

export function defaultSymbols() {
    return INSTRUMENT_UNIVERSE.slice(0, 12);
}
