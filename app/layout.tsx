import type { Metadata } from 'next';
import {
    ClerkProvider,
    Show,
    SignInButton,
    SignUpButton,
    UserButton,
} from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { syncClerkUser } from '@/lib/sync-clerk-user';
import { ThemeToggle } from '@/components/theme-toggle';
import './globals.css';

const themeMode = process.env.NEXT_PUBLIC_THEME_MODE ?? 'light';
const enableThemeToggle = process.env.NEXT_PUBLIC_ENABLE_THEME_TOGGLE !== 'false';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'StarterKit Auth',
    description: 'Minimal Next.js and Clerk starter',
};

const userButtonAppearance = {
    elements: {
        userButtonTrigger:
            'size-10 rounded-lg border border-border bg-card shadow-xs transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50',
        avatarBox: 'size-8',
    },
} as const;

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await syncClerkUser();

    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body
                suppressHydrationWarning
                className="min-h-full flex flex-col"
            >
                <Script
                    id="theme-init"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `(() => {
  const mode = ${JSON.stringify(themeMode)};
  const allowToggle = ${JSON.stringify(enableThemeToggle)};
  const storedTheme = allowToggle ? localStorage.getItem('theme') : null;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme =
    mode === 'dark'
      ? 'dark'
      : mode === 'system'
        ? (storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : systemTheme)
        : (storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'light');
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
})();`,
                    }}
                />
                <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
                    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
                            <Link
                                href="/"
                                className="inline-flex min-w-0 items-center gap-3"
                            >
                                <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                                    S
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                                        StarterKit
                                    </span>
                                    <span className="block truncate text-sm font-medium text-foreground">
                                        Authentication
                                    </span>
                                </span>
                            </Link>

                            <div className="flex items-center gap-3">
                                <ThemeToggle />
                                <Show when="signed-out">
                                    <SignInButton>
                                        <Button variant="outline" size="lg">
                                            Sign in
                                        </Button>
                                    </SignInButton>
                                    <SignUpButton>
                                        <Button size="lg">
                                            Create account
                                        </Button>
                                    </SignUpButton>
                                </Show>
                                <Show when="signed-in">
                                    <UserButton appearance={userButtonAppearance} />
                                </Show>
                            </div>
                        </div>
                    </header>
                    {children}
                </ClerkProvider>
            </body>
        </html>
    );
}
