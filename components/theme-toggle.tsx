'use client';

import { useState, useSyncExternalStore } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Theme = 'dark' | 'light';

const enableThemeToggle = process.env.NEXT_PUBLIC_ENABLE_THEME_TOGGLE !== 'false';

function applyTheme(theme: Theme) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
}

function subscribe() {
    return () => {};
}

export function ThemeToggle() {
    const mounted = useSyncExternalStore(subscribe, () => true, () => false);
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof document === 'undefined') {
            return 'light';
        }

        return document.documentElement.dataset.theme === 'light'
            ? 'light'
            : 'dark';
    });

    function toggleTheme() {
        setTheme((currentTheme) => {
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);
            return nextTheme;
        });
    }

    if (!enableThemeToggle) {
        return null;
    }

    if (!mounted) {
        return null;
    }

    return (
        <Button
            type="button"
            onClick={toggleTheme}
            variant="outline"
            size="icon-lg"
            className="size-10"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
            {theme === 'light' ? (
                <MoonStar className="size-4" />
            ) : (
                <SunMedium className="size-4" />
            )}
        </Button>
    );
}
