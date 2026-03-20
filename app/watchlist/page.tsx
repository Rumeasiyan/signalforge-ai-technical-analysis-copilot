import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BiasPill } from '@/components/market/bias-pill';
import { runAnalysisAction, toggleWatchlistAction } from '@/app/actions/market-actions';
import { scoreBgClass, scoreToneClass } from '@/lib/market/presentation';
import {
    ensureInstrumentsSeeded,
    getCurrentDbUser,
    defaultSymbols,
} from '@/lib/market/repository';
import prisma from '@/lib/prisma';

type WatchlistRow = {
    id: number;
    instrumentId: number;
    createdAt: Date;
    instrument: {
        symbol: string;
        name: string;
        exchange: string;
    };
};

type LatestAnalysisRow = {
    instrumentId: number;
    directionalBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    setupQualityScore: number;
    confidenceScore: number;
    plainLanguageView: string;
    updatedAt: Date;
};

export default async function WatchlistPage() {
    const user = await getCurrentDbUser();

    if (!user) {
        redirect('/sign-in');
    }

    await ensureInstrumentsSeeded();

    const watchlistRaw = await prisma.watchlistItem.findMany({
        where: { userId: user.id },
        include: {
            instrument: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    const watchlist = watchlistRaw as WatchlistRow[];
    const latestByInstrument = new Map<number, LatestAnalysisRow>();

    if (watchlist.length > 0) {
        const analysisRowsRaw = await prisma.analysis.findMany({
            where: {
                userId: user.id,
                instrumentId: {
                    in: watchlist.map((item: WatchlistRow) => item.instrumentId),
                },
            },
            orderBy: { createdAt: 'desc' },
            select: {
                instrumentId: true,
                directionalBias: true,
                setupQualityScore: true,
                confidenceScore: true,
                plainLanguageView: true,
                updatedAt: true,
            },
        });

        for (const row of analysisRowsRaw as LatestAnalysisRow[]) {
            if (!latestByInstrument.has(row.instrumentId)) {
                latestByInstrument.set(row.instrumentId, row);
            }
        }
    }

    return (
        <main className="flex flex-1 bg-[linear-gradient(180deg,rgba(14,116,144,0.05),transparent_28%),radial-gradient(circle_at_0%_0%,rgba(34,197,94,0.08),transparent_30%)] px-4 py-6 sm:px-6 lg:py-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
                <section className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-sm">
                    <h1 className="text-2xl font-semibold text-foreground">Watchlist and monitoring workspace</h1>
                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                        Track setup quality drift, compare directional bias, and monitor which symbols are improving or weakening.
                    </p>
                </section>

                {watchlist.length === 0 ? (
                    <section className="rounded-2xl border border-dashed border-border/70 bg-card/70 p-8">
                        <p className="text-sm text-muted-foreground">
                            Your watchlist is empty. Add symbols to start a repeatable daily review process.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {defaultSymbols().map((instrument) => (
                                <form key={instrument.symbol} action={toggleWatchlistAction}>
                                    <input type="hidden" name="symbol" value={instrument.symbol} />
                                    <Button type="submit" variant="outline" size="sm">
                                        Add {instrument.symbol}
                                    </Button>
                                </form>
                            ))}
                        </div>
                    </section>
                ) : (
                    <section className="grid gap-3">
                        {watchlist.map((item: WatchlistRow) => {
                            const latest = latestByInstrument.get(item.instrumentId);
                            return (
                                <article
                                    key={item.id}
                                    className="rounded-2xl border border-border/60 bg-card/85 p-4 shadow-sm"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-base font-semibold text-foreground">{item.instrument.symbol}</p>
                                            <p className="text-sm text-muted-foreground">{item.instrument.name}</p>
                                            <p className="text-xs text-muted-foreground">{item.instrument.exchange}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {latest ? <BiasPill bias={latest.directionalBias} /> : null}
                                            <form action={toggleWatchlistAction}>
                                                <input type="hidden" name="symbol" value={item.instrument.symbol} />
                                                <Button type="submit" variant="ghost" size="sm">
                                                    Remove
                                                </Button>
                                            </form>
                                        </div>
                                    </div>

                                    {latest ? (
                                        <>
                                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Setup quality</p>
                                                    <p className={`text-xl font-semibold ${scoreToneClass(latest.setupQualityScore)}`}>
                                                        {latest.setupQualityScore}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Confidence</p>
                                                    <p className={`text-xl font-semibold ${scoreToneClass(latest.confidenceScore)}`}>
                                                        {latest.confidenceScore}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Last update</p>
                                                    <p className="text-sm text-foreground">{latest.updatedAt.toLocaleString()}</p>
                                                </div>
                                            </div>

                                            <p className="mt-3 text-sm text-muted-foreground">{latest.plainLanguageView}</p>
                                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/90">
                                                <div
                                                    className={`h-full ${scoreBgClass(latest.setupQualityScore)}`}
                                                    style={{ width: `${latest.setupQualityScore}%` }}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <p className="mt-3 text-sm text-muted-foreground">
                                            No analysis snapshot yet. Run one now to monitor this symbol over time.
                                        </p>
                                    )}

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <form action={runAnalysisAction}>
                                            <input type="hidden" name="symbol" value={item.instrument.symbol} />
                                            <input type="hidden" name="timeframe" value="MEDIUM_TERM" />
                                            <Button type="submit" size="sm">
                                                Refresh analysis
                                            </Button>
                                        </form>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/analysis?symbol=${item.instrument.symbol}`}>Open full analysis</Link>
                                        </Button>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}
            </div>
        </main>
    );
}
