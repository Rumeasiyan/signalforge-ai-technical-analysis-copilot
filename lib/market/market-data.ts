type Candle = {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

export type MarketSeries = {
    source: 'yahoo';
    symbol: string;
    providerSymbol: string;
    currency: string;
    exchangeName: string;
    interval: '1d';
    candles: Candle[];
};

const YAHOO_SYMBOL_MAP: Record<string, string> = {
    AAPL: 'AAPL',
    MSFT: 'MSFT',
    NVDA: 'NVDA',
    AMZN: 'AMZN',
    TSLA: 'TSLA',
    META: 'META',
    GOOGL: 'GOOGL',
    SPY: 'SPY',
    QQQ: 'QQQ',
    IWM: 'IWM',
    DXY: 'DX-Y.NYB',
    EURUSD: 'EURUSD=X',
    GBPUSD: 'GBPUSD=X',
    USDJPY: 'USDJPY=X',
    XAUUSD: 'GC=F',
    'CL1!': 'CL=F',
    BTCUSD: 'BTC-USD',
    ETHUSD: 'ETH-USD',
    'NQ1!': 'NQ=F',
    'ES1!': 'ES=F',
};

function toNumber(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function mapToProviderSymbol(symbol: string) {
    return YAHOO_SYMBOL_MAP[symbol.toUpperCase()] ?? symbol.toUpperCase();
}

export async function fetchMarketSeries(symbol: string): Promise<MarketSeries | null> {
    const providerSymbol = mapToProviderSymbol(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(providerSymbol)}?interval=1d&range=1y`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'signalforge-ai-technical-analysis-copilot/1.0',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            return null;
        }

        const payload = (await response.json()) as {
            chart?: {
                result?: Array<{
                    meta?: {
                        currency?: string;
                        exchangeName?: string;
                    };
                    timestamp?: number[];
                    indicators?: {
                        quote?: Array<{
                            open?: Array<number | null>;
                            high?: Array<number | null>;
                            low?: Array<number | null>;
                            close?: Array<number | null>;
                            volume?: Array<number | null>;
                        }>;
                    };
                }>;
            };
        };

        const result = payload.chart?.result?.[0];
        const quote = result?.indicators?.quote?.[0];
        const timestamps = result?.timestamp;

        if (!result || !quote || !timestamps || timestamps.length === 0) {
            return null;
        }

        const candles: Candle[] = [];

        for (let index = 0; index < timestamps.length; index += 1) {
            const timestamp = toNumber(timestamps[index]);
            const open = toNumber(quote.open?.[index]);
            const high = toNumber(quote.high?.[index]);
            const low = toNumber(quote.low?.[index]);
            const close = toNumber(quote.close?.[index]);
            const volume = toNumber(quote.volume?.[index]) ?? 0;

            if (!timestamp || open === null || high === null || low === null || close === null) {
                continue;
            }

            candles.push({
                timestamp,
                open,
                high,
                low,
                close,
                volume,
            });
        }

        if (candles.length < 60) {
            return null;
        }

        return {
            source: 'yahoo',
            symbol: symbol.toUpperCase(),
            providerSymbol,
            currency: result.meta?.currency ?? 'USD',
            exchangeName: result.meta?.exchangeName ?? 'Unknown',
            interval: '1d',
            candles,
        };
    } catch {
        return null;
    }
}
