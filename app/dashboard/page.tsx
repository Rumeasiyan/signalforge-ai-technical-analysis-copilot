import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, TrendingUp, AlertTriangle } from 'lucide-react';
import type { InstrumentSeed } from '@/lib/market/instruments';
import { Button } from '@/components/ui/button';
import { BiasPill } from '@/components/market/bias-pill';
import { runAnalysisAction, toggleWatchlistAction } from '@/app/actions/market-actions';
import { directionalBiasDisplay } from '@/lib/market/analysis-engine';
import { scoreBgClass, scoreToneClass } from '@/lib/market/presentation';
import {
    defaultSymbols,
    ensureInstrumentsSeeded,
    getCurrentDbUser,
} from '@/lib/market/repository';
import prisma from '@/lib/prisma';

type AnalysisWithInstrument = {
    id: number;
    setupQualityScore: number;
    confidenceScore: number;
    directionalBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    timeframe: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
    trendSummary: string;
    plainLanguageView: string;
    createdAt: Date;
    instrument: {
        symbol: string;
        name: string;
        exchange: string;
    };
};

type WatchlistRow = {
    id: number;
    instrument: {
        symbol: string;
        name: string;
    };
};

function latestPerSymbol(rows: AnalysisWithInstrument[]) {
    const map = new Map<string, AnalysisWithInstrument>();

    for (const row of rows) {
        if (!map.has(row.instrument.symbol)) {
            map.set(row.instrument.symbol, row);
        }
    }

    return Array.from(map.values());
}

function setupQualityLabel(score: number) {
    if (score >= 75) {
        return 'Strong setup';
    }
    if (score >= 55) {
        return 'Tradable but mixed';
    }
    return 'Low clarity';
}

export default async function DashboardPage() {
    const user = await getCurrentDbUser();

    if (!user) {
        redirect('/sign-in');
    }

    await ensureInstrumentsSeeded();

    const [watchlistRaw, recentAnalysesRaw] = await Promise.all([
        prisma.watchlistItem.findMany({
            where: { userId: user.id },
            include: {
                instrument: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 12,
        }),
        prisma.analysis.findMany({
            where: { userId: user.id },
            include: {
                instrument: {
                    select: { symbol: true, name: true, exchange: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 80,
        }),
    ]);

    const watchlist = watchlistRaw as WatchlistRow[];
    const recentAnalyses = recentAnalysesRaw as AnalysisWithInstrument[];
    const latestAnalyses = latestPerSymbol(recentAnalyses);
    const bullishSetups = latestAnalyses
        .filter((analysis) => analysis.directionalBias === 'BULLISH')
        .sort((left, right) => right.setupQualityScore - left.setupQualityScore)
        .slice(0, 5);
    const bearishSetups = latestAnalyses
        .filter((analysis) => analysis.directionalBias === 'BEARISH')
        .sort((left, right) => right.setupQualityScore - left.setupQualityScore)
        .slice(0, 5);
    const neutralSetups = latestAnalyses
        .filter((analysis) => analysis.directionalBias === 'NEUTRAL')
        .sort((left, right) => right.confidenceScore - left.confidenceScore)
        .slice(0, 5);
    const needsAttention = latestAnalyses
        .filter((analysis) => analysis.setupQualityScore <= 55 || analysis.confidenceScore <= 52)
        .sort((left, right) => left.setupQualityScore - right.setupQualityScore)
        .slice(0, 6);

    return (
        <main className="flex flex-1 bg-[linear-gradient(180deg,rgba(14,116,144,0.07),transparent_28%),radial-gradient(circle_at_100%_0%,rgba(34,197,94,0.09),transparent_32%)] px-4 py-6 sm:px-6 lg:py-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <section className="grid gap-4 rounded-2xl border border-border/60 bg-card/85 p-5 shadow-sm backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Watchlist</p>
                        <p className="mt-2 text-3xl font-semibold text-foreground">{watchlist.length}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Tracked instruments</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Recent analyses</p>
                        <p className="mt-2 text-3xl font-semibold text-foreground">{recentAnalyses.length}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Recorded technical snapshots</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Strong bullish</p>
                        <p className="mt-2 text-3xl font-semibold text-emerald-700 dark:text-emerald-300">{bullishSetups.length}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Aligned trend and momentum</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Needs attention</p>
                        <p className="mt-2 text-3xl font-semibold text-amber-700 dark:text-amber-300">{needsAttention.length}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Mixed signals or weak quality</p>
                    </div>
                </section>

                <section className="grid gap-4 rounded-2xl border border-border/60 bg-card/85 p-5 shadow-sm backdrop-blur lg:grid-cols-[1.1fr_1fr]">
                    <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Quick analysis</p>
                        <h2 className="text-2xl font-semibold text-foreground">Run a structured technical read</h2>
                        <p className="max-w-xl text-sm text-muted-foreground">
                            Analyze any instrument with multi-timeframe context, key levels, setup quality, and scenario
                            planning in one pass.
                        </p>
                    </div>
                    <form action={runAnalysisAction} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                        <input
                            name="symbol"
                            required
                            placeholder="e.g. NVDA"
                            className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm outline-none transition focus:border-primary/70"
                        />
                        <select
                            name="timeframe"
                            className="h-10 rounded-lg border border-border bg-background/80 px-3 text-sm outline-none transition focus:border-primary/70"
                            defaultValue="MEDIUM_TERM"
                        >
                            <option value="SHORT_TERM">Short-term</option>
                            <option value="MEDIUM_TERM">Medium-term</option>
                            <option value="LONG_TERM">Long-term</option>
                        </select>
                        <Button type="submit" className="h-10">
                            Analyze
                        </Button>
                    </form>
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-border/60 bg-card/85 p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">Strongest bullish setups</h3>
                            <TrendingUp className="size-4 text-emerald-500" />
                        </div>
                        <div className="grid gap-2">
                            {bullishSetups.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No strong bullish setups yet.</p>
                            ) : (
                                bullishSetups.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/analysis?symbol=${item.instrument.symbol}`}
                                        className="rounded-lg border border-border/50 bg-background/60 p-3 transition hover:border-primary/30"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-foreground">{item.instrument.symbol}</p>
                                            <p className={`text-sm font-semibold ${scoreToneClass(item.setupQualityScore)}`}>
                                                {item.setupQualityScore}
                                            </p>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">{item.instrument.name}</p>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-card/85 p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">Strongest bearish setups</h3>
                            <TrendingUp className="size-4 text-rose-500" />
                        </div>
                        <div className="grid gap-2">
                            {bearishSetups.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No strong bearish setups yet.</p>
                            ) : (
                                bearishSetups.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/analysis?symbol=${item.instrument.symbol}`}
                                        className="rounded-lg border border-border/50 bg-background/60 p-3 transition hover:border-primary/30"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-foreground">{item.instrument.symbol}</p>
                                            <p className={`text-sm font-semibold ${scoreToneClass(item.setupQualityScore)}`}>
                                                {item.setupQualityScore}
                                            </p>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">{item.instrument.name}</p>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-card/85 p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">Neutral / unclear setups</h3>
                            <AlertTriangle className="size-4 text-amber-500" />
                        </div>
                        <div className="grid gap-2">
                            {neutralSetups.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No neutral setups in recent snapshots.</p>
                            ) : (
                                neutralSetups.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/analysis?symbol=${item.instrument.symbol}`}
                                        className="rounded-lg border border-border/50 bg-background/60 p-3 transition hover:border-primary/30"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-foreground">{item.instrument.symbol}</p>
                                            <p className={`text-sm font-semibold ${scoreToneClass(item.setupQualityScore)}`}>
                                                {item.setupQualityScore}
                                            </p>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">{item.instrument.name}</p>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                    <div className="rounded-2xl border border-border/60 bg-card/85 p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">Instruments needing attention</h3>
                            <Link href="/history" className="text-xs text-primary hover:underline">
                                View history
                            </Link>
                        </div>
                        <div className="grid gap-3">
                            {needsAttention.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No major attention flags right now.</p>
                            ) : (
                                needsAttention.map((item) => (
                                    <article
                                        key={item.id}
                                        className="rounded-lg border border-border/50 bg-background/60 p-3"
                                    >
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-foreground">{item.instrument.symbol}</p>
                                            <BiasPill bias={item.directionalBias} />
                                        </div>
                                        <p className="text-xs text-muted-foreground">{item.plainLanguageView}</p>
                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <p className="text-muted-foreground">Setup quality</p>
                                                <p className={scoreToneClass(item.setupQualityScore)}>{setupQualityLabel(item.setupQualityScore)}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Confidence</p>
                                                <p className={scoreToneClass(item.confidenceScore)}>{item.confidenceScore}/100</p>
                                            </div>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-card/85 p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">Watchlist overview</h3>
                            <Link href="/watchlist" className="text-xs text-primary hover:underline">
                                Open workspace
                            </Link>
                        </div>
                        <div className="grid gap-2">
                            {watchlist.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                                    Your watchlist is empty. Add symbols from the defaults below to begin daily monitoring.
                                </div>
                            ) : (
                                watchlist.map((item: WatchlistRow) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between rounded-lg border border-border/50 bg-background/60 px-3 py-2"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{item.instrument.symbol}</p>
                                            <p className="text-xs text-muted-foreground">{item.instrument.name}</p>
                                        </div>
                                        <form action={toggleWatchlistAction}>
                                            <input type="hidden" name="symbol" value={item.instrument.symbol} />
                                            <Button type="submit" variant="ghost" size="sm">
                                                Remove
                                            </Button>
                                        </form>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="mt-4">
                            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Quick add</p>
                            <div className="flex flex-wrap gap-2">
                                {defaultSymbols().map((instrument: InstrumentSeed) => (
                                    <form key={instrument.symbol} action={toggleWatchlistAction}>
                                        <input type="hidden" name="symbol" value={instrument.symbol} />
                                        <Button type="submit" variant="outline" size="sm">
                                            <Plus className="size-3.5" />
                                            {instrument.symbol}
                                        </Button>
                                    </form>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-border/60 bg-card/85 p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Recently analyzed instruments</h3>
                        <Link href="/analysis" className="text-xs text-primary hover:underline">
                            Open analysis desk
                        </Link>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {latestAnalyses.slice(0, 9).map((item) => (
                            <Link
                                key={item.id}
                                href={`/analysis?symbol=${item.instrument.symbol}`}
                                className="rounded-lg border border-border/50 bg-background/60 p-3 transition hover:border-primary/40"
                            >
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{item.instrument.symbol}</p>
                                        <p className="text-xs text-muted-foreground">{item.instrument.exchange}</p>
                                    </div>
                                    <BiasPill bias={item.directionalBias} />
                                </div>
                                <p className="line-clamp-2 text-xs text-muted-foreground">{item.trendSummary}</p>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/80">
                                    <div
                                        className={`h-full ${scoreBgClass(item.setupQualityScore)}`}
                                        style={{ width: `${item.setupQualityScore}%` }}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {directionalBiasDisplay(item.directionalBias)} · {item.timeframe.replace('_', ' ').toLowerCase()}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
