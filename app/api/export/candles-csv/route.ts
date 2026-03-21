import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchMarketSeries } from '@/lib/market/market-data';

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

    const { searchParams } = new URL(request.url);
    const symbol = String(searchParams.get('symbol') ?? '')
        .trim()
        .toUpperCase();

    if (!symbol) {
        return new NextResponse('Missing symbol', { status: 400 });
    }

    const series = await fetchMarketSeries(symbol);
    if (!series) {
        return new NextResponse('No market data available', { status: 404 });
    }

    const header = ['date', 'open', 'high', 'low', 'close', 'volume'];
    const rows = series.candles.map((candle) => [
        new Date(candle.timestamp * 1000).toISOString().slice(0, 10),
        candle.open,
        candle.high,
        candle.low,
        candle.close,
        candle.volume,
    ]);

    const csv = [header, ...rows]
        .map((row) => row.map((cell) => csvEscape(cell)).join(','))
        .join('\n');

    return new NextResponse(csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${symbol.toLowerCase()}-candles.csv"`,
        },
    });
}
