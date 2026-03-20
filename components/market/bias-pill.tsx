import { directionalBiasDisplay, type DirectionalBiasValue } from '@/lib/market/analysis-engine';
import { cn } from '@/lib/utils';

type BiasPillProps = {
    bias: DirectionalBiasValue;
};

export function BiasPill({ bias }: BiasPillProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide',
                bias === 'BULLISH' && 'border-emerald-300/70 bg-emerald-100/70 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200',
                bias === 'BEARISH' && 'border-rose-300/70 bg-rose-100/80 text-rose-900 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-200',
                bias === 'NEUTRAL' && 'border-amber-300/80 bg-amber-100/80 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200'
            )}
        >
            {directionalBiasDisplay(bias)}
        </span>
    );
}
