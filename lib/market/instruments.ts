export type InstrumentTypeValue =
    | 'STOCK'
    | 'INDEX'
    | 'ETF'
    | 'FOREX'
    | 'CRYPTO'
    | 'COMMODITY';

export type InstrumentSeed = {
    symbol: string;
    name: string;
    type: InstrumentTypeValue;
    exchange: string;
};

export const INSTRUMENT_UNIVERSE: InstrumentSeed[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'STOCK', exchange: 'NASDAQ' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'STOCK', exchange: 'NASDAQ' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'STOCK', exchange: 'NASDAQ' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'STOCK', exchange: 'NASDAQ' },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'STOCK', exchange: 'NASDAQ' },
    { symbol: 'META', name: 'Meta Platforms Inc.', type: 'STOCK', exchange: 'NASDAQ' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'STOCK', exchange: 'NASDAQ' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'ETF', exchange: 'NYSEARCA' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'ETF', exchange: 'NASDAQ' },
    { symbol: 'IWM', name: 'iShares Russell 2000 ETF', type: 'ETF', exchange: 'NYSEARCA' },
    { symbol: 'DXY', name: 'US Dollar Index', type: 'INDEX', exchange: 'ICE' },
    { symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'FOREX', exchange: 'FX' },
    { symbol: 'GBPUSD', name: 'British Pound / US Dollar', type: 'FOREX', exchange: 'FX' },
    { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', type: 'FOREX', exchange: 'FX' },
    { symbol: 'XAUUSD', name: 'Gold Spot / US Dollar', type: 'COMMODITY', exchange: 'COMEX' },
    { symbol: 'CL1!', name: 'WTI Crude Oil Front Month', type: 'COMMODITY', exchange: 'NYMEX' },
    { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', type: 'CRYPTO', exchange: 'CRYPTO' },
    { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', type: 'CRYPTO', exchange: 'CRYPTO' },
    { symbol: 'NQ1!', name: 'Nasdaq 100 Futures', type: 'INDEX', exchange: 'CME' },
    { symbol: 'ES1!', name: 'S&P 500 Futures', type: 'INDEX', exchange: 'CME' },
];

export function findInstrumentBySymbol(symbol: string | null | undefined) {
    if (!symbol) {
        return null;
    }

    const normalized = symbol.trim().toUpperCase();
    return INSTRUMENT_UNIVERSE.find((instrument) => instrument.symbol === normalized) ?? null;
}
