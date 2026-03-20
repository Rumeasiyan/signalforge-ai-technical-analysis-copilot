export function scoreToneClass(score: number) {
    if (score >= 70) {
        return 'text-emerald-700 dark:text-emerald-300';
    }
    if (score <= 45) {
        return 'text-rose-700 dark:text-rose-300';
    }
    return 'text-amber-700 dark:text-amber-300';
}

export function scoreBgClass(score: number) {
    if (score >= 70) {
        return 'bg-emerald-500';
    }
    if (score <= 45) {
        return 'bg-rose-500';
    }
    return 'bg-amber-500';
}
