import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BiasPill } from '@/components/market/bias-pill';
import { InstrumentSearch } from '@/components/market/instrument-search';
import { runAnalysisAction, toggleWatchlistAction } from '@/app/actions/market-actions';
import { timeframeDisplay, parseTimeframe } from '@/lib/market/analysis-engine';
import { INSTRUMENT_UNIVERSE } from '@/lib/market/instruments';
import { scoreBgClass, scoreToneClass } from '@/lib/market/presentation';
import {
    ensureInstrumentsSeeded,
    getCurrentDbUser,
    resolveInstrument,
} from '@/lib/market/repository';
import {
    parseIndicatorInsights,
    parseResistanceZones,
    parseScenarioPlan,
    parseSupportZones,
    parseTimeframeTable,
} from '@/lib/market/view-model';
import prisma from '@/lib/prisma';

type AnalysisPageProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type LatestAnalysis = {
    id: number;
    directionalBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    setupQualityScore: number;
    confidenceScore: number;
    timeframe: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
    trendSummary: string;
    plainLanguageView: string;
    momentumCondition: string;
    breakoutRisk: string;
    reversalRisk: string;
    keySupportZones: unknown;
    keyResistanceZones: unknown;
    indicatorInsights: unknown;
    multiTimeframeView: unknown;
    scenarioPlan: unknown;
    createdAt: Date;
};

type WatchlistEntry = {
    instrument: {
        symbol: string;
    };
};

export default async function AnalysisPage(props: AnalysisPageProps) {
    const user = await getCurrentDbUser();

    if (!user) {
        redirect('/sign-in');
    }

    await ensureInstrumentsSeeded();

    const searchParams = await props.searchParams;
    const symbolParam = searchParams.symbol;
    const timeframeParam = searchParams.timeframe;
    const symbol = Array.isArray(symbolParam) ? symbolParam[0] : symbolParam;
    const selectedTimeframe = parseTimeframe(
        Array.isArray(timeframeParam) ? timeframeParam[0] : timeframeParam
    );

    const selectedInstrument = symbol
        ? await resolveInstrument(symbol)
        : null;

    const watchlistRaw = await prisma.watchlistItem.findMany({
        where: { userId: user.id },
        include: { instrument: true },
        orderBy: { createdAt: 'desc' },
    });

    const watchlist = watchlistRaw as WatchlistEntry[];

    const watchlistSymbols = new Set(watchlist.map((item: WatchlistEntry) => item.instrument.symbol));

    const latestAnalysisRaw = selectedInstrument
        ? await prisma.analysis.findFirst({
              where: {
                  userId: user.id,
                  instrumentId: selectedInstrument.id,
                  timeframe: selectedTimeframe,
              },
              orderBy: { createdAt: 'desc' },
          })
        : null;

    const latestAnalysis = latestAnalysisRaw as LatestAnalysis | null;

    const supportZones = latestAnalysis ? parseSupportZones(latestAnalysis.keySupportZones as never) : [];
    const resistanceZones = latestAnalysis ? parseResistanceZones(latestAnalysis.keyResistanceZones as never) : [];
    const indicatorInsights = latestAnalysis
        ? parseIndicatorInsights(latestAnalysis.indicatorInsights as never)
        : [];
    const timeframeTable = latestAnalysis
        ? parseTimeframeTable(latestAnalysis.multiTimeframeView as never)
        : [];
    const scenarioPlan = latestAnalysis ? parseScenarioPlan(latestAnalysis.scenarioPlan as never) : [];

    return (
        <main className="flex flex-1 bg-[linear-gradient(180deg,rgba(14,116,144,0.06),transparent_30%),radial-gradient(circle_at_100%_0%,rgba(34,197,94,0.08),transparent_35%)] px-4 py-6 sm:px-6 lg:py-8">
            <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[320px_1fr]">
                <InstrumentSearch instruments={INSTRUMENT_UNIVERSE} selectedSymbol={selectedInstrument?.symbol} />

                <section className="space-y-4">
                    <div className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Analysis desk</p>
                                <h1 className="mt-2 text-2xl font-semibold text-foreground">
                                    {selectedInstrument
                                        ? `${selectedInstrument.symbol} · ${selectedInstrument.name}`
                                        : 'Select an instrument to begin'}
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {selectedInstrument
                                        ? `${selectedInstrument.exchange} · ${selectedInstrument.type.toLowerCase()}`
                                        : 'Search a ticker from the panel and generate a structured technical read.'}
                                </p>
                            </div>

                            {selectedInstrument ? (
                                <form action={toggleWatchlistAction}>
                                    <input type="hidden" name="symbol" value={selectedInstrument.symbol} />
                                    <Button type="submit" variant="outline">
                                        {watchlistSymbols.has(selectedInstrument.symbol)
                                            ? 'Remove from watchlist'
                                            : 'Add to watchlist'}
                                    </Button>
                                </form>
                            ) : null}
                        </div>

                        {selectedInstrument ? (
                            <form action={runAnalysisAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                                <input type="hidden" name="symbol" value={selectedInstrument.symbol} />
                                <div className="h-10 rounded-lg border border-border bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                                    {selectedInstrument.symbol}
                                </div>
                                <select
                                    name="timeframe"
                                    defaultValue={selectedTimeframe}
                                    className="h-10 rounded-lg border border-border bg-background/70 px-3 text-sm outline-none transition focus:border-primary/60"
                                >
                                    <option value="SHORT_TERM">Short-term</option>
                                    <option value="MEDIUM_TERM">Medium-term</option>
                                    <option value="LONG_TERM">Long-term</option>
                                </select>
                                <Button type="submit">Run AI analysis</Button>
                            </form>
                        ) : null}
                    </div>

                    {!selectedInstrument ? (
                        <section className="rounded-2xl border border-dashed border-border/70 bg-card/70 p-8 text-center text-sm text-muted-foreground">
                            Select a symbol from the search panel to generate trend, momentum, key level, and scenario intelligence.
                        </section>
                    ) : latestAnalysis ? (
                        <>
                            <section className="grid gap-4 rounded-2xl border border-border/60 bg-card/85 p-5 shadow-sm md:grid-cols-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Directional bias</p>
                                    <div className="mt-2">
                                        <BiasPill bias={latestAnalysis.directionalBias} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Setup quality</p>
                                    <p className={`mt-2 text-3xl font-semibold ${scoreToneClass(latestAnalysis.setupQualityScore)}`}>
                                        {latestAnalysis.setupQualityScore}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Confidence</p>
                                    <p className={`mt-2 text-3xl font-semibold ${scoreToneClass(latestAnalysis.confidenceScore)}`}>
                                        {latestAnalysis.confidenceScore}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Snapshot</p>
                                    <p className="mt-2 text-sm font-medium text-foreground">
                                        {timeframeDisplay(latestAnalysis.timeframe)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {latestAnalysis.createdAt.toLocaleString()}
                                    </p>
                                </div>
                            </section>

                            <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
                                <article className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-sm">
                                    <h2 className="text-base font-semibold text-foreground">Market commentary</h2>
                                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{latestAnalysis.trendSummary}</p>
                                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{latestAnalysis.plainLanguageView}</p>
                                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={`h-full ${scoreBgClass(latestAnalysis.setupQualityScore)}`}
                                            style={{ width: `${latestAnalysis.setupQualityScore}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">{latestAnalysis.momentumCondition}</p>
                                </article>

                                <article className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-sm">
                                    <h2 className="text-base font-semibold text-foreground">Key levels</h2>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Support zones</p>
                                            <div className="mt-2 grid gap-2">
                                                {supportZones.map((zone) => (
                                                    <p key={zone} className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                                                        {zone}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resistance zones</p>
                                            <div className="mt-2 grid gap-2">
                                                {resistanceZones.map((zone) => (
                                                    <p key={zone} className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
                                                        {zone}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            </section>

                            <section className="grid gap-4 lg:grid-cols-2">
                                <article className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-sm">
                                    <h2 className="text-base font-semibold text-foreground">Indicator interpretation</h2>
                                    <div className="mt-3 grid gap-2">
                                        {indicatorInsights.map((insight) => (
                                            <div key={insight.name} className="rounded-lg border border-border/50 bg-background/50 p-3">
                                                <p className="text-sm font-semibold text-foreground">{insight.name}</p>
                                                <p className="mt-1 text-xs text-sky-700 dark:text-sky-300">{insight.reading}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{insight.interpretation}</p>
                                            </div>
                                        ))}
                                    </div>
                                </article>

                                <article className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-sm">
                                    <h2 className="text-base font-semibold text-foreground">Multi-timeframe view</h2>
                                    <div className="mt-3 overflow-hidden rounded-lg border border-border/50">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-muted/60 text-muted-foreground">
                                                <tr>
                                                    <th className="px-3 py-2 font-medium">Timeframe</th>
                                                    <th className="px-3 py-2 font-medium">Bias</th>
                                                    <th className="px-3 py-2 font-medium">Trend</th>
                                                    <th className="px-3 py-2 font-medium">Momentum</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {timeframeTable.map((row) => (
                                                    <tr key={row.timeframe} className="border-t border-border/50 bg-background/40">
                                                        <td className="px-3 py-2 text-foreground">{row.timeframe}</td>
                                                        <td className="px-3 py-2">
                                                            <BiasPill bias={row.bias} />
                                                        </td>
                                                        <td className="px-3 py-2 text-muted-foreground">{row.trend}</td>
                                                        <td className="px-3 py-2 text-muted-foreground">{row.momentum}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </article>
                            </section>

                            <section className="grid gap-4 rounded-2xl border border-border/60 bg-card/85 p-5 shadow-sm lg:grid-cols-2">
                                <article>
                                    <h2 className="text-base font-semibold text-foreground">Scenario planning</h2>
                                    <div className="mt-3 grid gap-3">
                                        {scenarioPlan.map((scenario) => (
                                            <div key={scenario.title} className="rounded-lg border border-border/50 bg-background/50 p-3">
                                                <p className="text-sm font-semibold text-foreground">{scenario.title}</p>
                                                <p className="mt-1 text-xs text-muted-foreground"><strong className="text-foreground">Trigger:</strong> {scenario.trigger}</p>
                                                <p className="mt-1 text-xs text-muted-foreground"><strong className="text-foreground">Plan:</strong> {scenario.plan}</p>
                                                <p className="mt-1 text-xs text-muted-foreground"><strong className="text-foreground">Invalidation:</strong> {scenario.invalidation}</p>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                                <article>
                                    <h2 className="text-base font-semibold text-foreground">Risk read</h2>
                                    <div className="mt-3 grid gap-3">
                                        <div className="rounded-lg border border-border/50 bg-background/50 p-3">
                                            <p className="text-sm font-semibold text-foreground">Breakout / breakdown risk</p>
                                            <p className="mt-2 text-xs text-muted-foreground">{latestAnalysis.breakoutRisk}</p>
                                        </div>
                                        <div className="rounded-lg border border-border/50 bg-background/50 p-3">
                                            <p className="text-sm font-semibold text-foreground">Reversal risk</p>
                                            <p className="mt-2 text-xs text-muted-foreground">{latestAnalysis.reversalRisk}</p>
                                        </div>
                                    </div>
                                </article>
                            </section>
                        </>
                    ) : (
                        <section className="rounded-2xl border border-dashed border-border/70 bg-card/70 p-8">
                            <p className="text-sm text-muted-foreground">
                                No analysis snapshot yet for {selectedInstrument.symbol} on {timeframeDisplay(selectedTimeframe)}.
                                Run AI analysis to generate the first technical interpretation.
                            </p>
                        </section>
                    )}

                    <section className="rounded-2xl border border-border/60 bg-card/85 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">Need continuity?</h3>
                            <Link href="/history" className="text-xs text-primary hover:underline">
                                Open analysis history
                            </Link>
                        </div>
                    </section>
                </section>
            </div>
        </main>
    );
}
