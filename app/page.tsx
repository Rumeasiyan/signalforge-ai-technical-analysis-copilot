import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Button } from '@/components/ui/button';

export default async function Home() {
    const { userId } = await auth();

    if (userId) {
        redirect('/dashboard');
    }

    return (
        <main className="relative flex flex-1 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(22,163,74,0.16),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(14,116,144,0.14),transparent_42%),linear-gradient(180deg,rgba(11,18,32,0.06),transparent_40%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.22),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(14,116,144,0.25),transparent_42%),linear-gradient(180deg,rgba(2,6,23,0.7),transparent_55%)]" />
            <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:py-20">
                <div className="max-w-4xl space-y-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300">
                        Institutional-grade market workflow
                    </p>
                    <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                        Cut chart-reading fatigue with an AI technical analysis copilot.
                    </h1>
                    <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                        SignalForge turns raw market structure, indicator context, and multi-timeframe conflict into
                        clear trading scenarios. Built for discretionary traders, research teams, and advisory desks that
                        need consistent technical reads at speed.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Button asChild size="lg">
                            <Link href="/sign-up">Start with your workspace</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link href="/sign-in">Sign in</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    );
}
