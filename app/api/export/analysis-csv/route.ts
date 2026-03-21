import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { parseTimeframe } from '@/lib/market/analysis-engine';
import { getCurrentDbUser } from '@/lib/market/repository';

function csvEscape(value: string | number) {
    const text = String(value);
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
}

export async function GET(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const dbUser = await getCurrentDbUser();
    if (!dbUser) {
        return new NextResponse('User not synced', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = String(searchParams.get('symbol') ?? '')
        .trim()
        .toUpperCase();
    const timeframe = parseTimeframe(searchParams.get('timeframe'));

    if (!symbol) {
        return new NextResponse('Missing symbol', { status: 400 });
    }

    const latest = await prisma.analysis.findFirst({
        where: {
            userId: dbUser.id,
            timeframe,
            instrument: {
                symbol,
            },
        },
        include: {
            instrument: {
                select: {
                    symbol: true,
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    if (!latest) {
        return new NextResponse('No analysis found', { status: 404 });
    }

    const line = {
        symbol: latest.instrument.symbol,
        instrumentName: latest.instrument.name,
        timeframe: latest.timeframe,
        directionalBias: latest.directionalBias,
        setupQualityScore: latest.setupQualityScore,
        confidenceScore: latest.confidenceScore,
        momentumCondition: latest.momentumCondition,
        trendSummary: latest.trendSummary,
        plainLanguageView: latest.plainLanguageView,
        breakoutRisk: latest.breakoutRisk,
        reversalRisk: latest.reversalRisk,
        createdAt: latest.createdAt.toISOString(),
    };

    const header = Object.keys(line);
    const values = Object.values(line);
    const csv = [header, values]
        .map((row) => row.map((cell) => csvEscape(cell)).join(','))
        .join('\n');

    return new NextResponse(csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${symbol.toLowerCase()}-${timeframe.toLowerCase()}-analysis.csv"`,
        },
    });
}
