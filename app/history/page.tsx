import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BiasPill } from '@/components/market/bias-pill';
import { timeframeDisplay } from '@/lib/market/analysis-engine';
import { scoreToneClass } from '@/lib/market/presentation';
import { ensureInstrumentsSeeded, getCurrentDbUser } from '@/lib/market/repository';
import prisma from '@/lib/prisma';

type HistoryRow = {
    id: number;
    directionalBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    setupQualityScore: number;
    confidenceScore: number;
    timeframe: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
    trendSummary: string;
    plainLanguageView: string;
    createdAt: Date;
    instrument: {
        symbol: string;
        name: string;
    };
};

export default async function HistoryPage() {
    const user = await getCurrentDbUser();

    if (!user) {
        redirect('/sign-in');
    }

    await ensureInstrumentsSeeded();

    const historyRaw = await prisma.analysis.findMany({
        where: { userId: user.id },
        include: {
            instrument: {
                select: { symbol: true, name: true },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 120,
    });

    const history = historyRaw as HistoryRow[];
    const previousByKey = new Map<string, HistoryRow>();

    return (
        <main className="flex flex-1 bg-[linear-gradient(180deg,rgba(14,116,144,0.05),transparent_25%),radial-gradient(circle_at_100%_0%,rgba(34,197,94,0.07),transparent_34%)] px-4 py-6 sm:px-6 lg:py-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
                <section className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-sm">
                    <h1 className="text-2xl font-semibold text-foreground">Analysis history and revisitability</h1>
                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                        Reopen prior reads, compare directional changes over time, and keep a repeatable review trail for decision quality.
                    </p>
                </section>

                {history.length === 0 ? (
                    <section className="rounded-2xl border border-dashed border-border/70 bg-card/70 p-8 text-sm text-muted-foreground">
                        No history yet. Run your first analysis from the analysis desk to start building a timeline.
                    </section>
                ) : (
                    <section className="grid gap-3">
                        {history.map((row) => {
                            const key = `${row.instrument.symbol}:${row.timeframe}`;
                            const previous = previousByKey.get(key);
                            previousByKey.set(key, row);
                            const changedBias = previous && previous.directionalBias !== row.directionalBias;

                            return (
                                <article
                                    key={row.id}
                                    className="rounded-2xl border border-border/60 bg-card/85 p-4 shadow-sm"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-base font-semibold text-foreground">
                                                {row.instrument.symbol} · {row.instrument.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {timeframeDisplay(row.timeframe)} · {row.createdAt.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BiasPill bias={row.directionalBias} />
                                            {changedBias ? (
                                                <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                                                    Bias changed
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <p className="mt-3 text-sm text-muted-foreground">{row.trendSummary}</p>
                                    <p className="mt-2 text-sm text-muted-foreground">{row.plainLanguageView}</p>

                                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Setup quality</p>
                                            <p className={`text-lg font-semibold ${scoreToneClass(row.setupQualityScore)}`}>
                                                {row.setupQualityScore}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Confidence</p>
                                            <p className={`text-lg font-semibold ${scoreToneClass(row.confidenceScore)}`}>
                                                {row.confidenceScore}
                                            </p>
                                        </div>
                                        <div className="flex items-end">
                                            <Link
                                                href={`/analysis?symbol=${row.instrument.symbol}&timeframe=${row.timeframe}`}
                                                className="text-sm font-medium text-primary hover:underline"
                                            >
                                                Reopen analysis
                                            </Link>
                                        </div>
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
