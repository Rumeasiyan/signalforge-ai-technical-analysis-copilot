'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { InstrumentSeed } from '@/lib/market/instruments';

type InstrumentSearchProps = {
    instruments: InstrumentSeed[];
    selectedSymbol?: string;
};

export function InstrumentSearch({ instruments, selectedSymbol }: InstrumentSearchProps) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const normalized = query.trim().toUpperCase();
        if (!normalized) {
            return instruments.slice(0, 10);
        }

        return instruments
            .filter((instrument) => {
                const haystack = `${instrument.symbol} ${instrument.name} ${instrument.exchange}`.toUpperCase();
                return haystack.includes(normalized);
            })
            .slice(0, 10);
    }, [instruments, query]);

    return (
        <section className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Search className="size-4" />
                Instrument search
            </div>
            <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search ticker, name, or exchange"
                className="mb-3 h-10 w-full rounded-lg border border-border bg-background/90 px-3 text-sm outline-none ring-0 transition focus:border-primary/60"
            />
            <div className="grid gap-2">
                {filtered.map((instrument) => {
                    const isSelected = selectedSymbol?.toUpperCase() === instrument.symbol;
                    return (
                        <Link
                            key={instrument.symbol}
                            href={`/analysis?symbol=${encodeURIComponent(instrument.symbol)}`}
                            className={`rounded-lg border px-3 py-2 transition ${
                                isSelected
                                    ? 'border-primary/40 bg-primary/10'
                                    : 'border-border/60 bg-background/60 hover:border-primary/30 hover:bg-muted/40'
                            }`}
                        >
                            <p className="text-sm font-semibold text-foreground">{instrument.symbol}</p>
                            <p className="text-xs text-muted-foreground">{instrument.name}</p>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
