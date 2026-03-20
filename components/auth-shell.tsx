import Link from 'next/link';
import { Button } from '@/components/ui/button';

type AuthShellProps = {
    children: React.ReactNode;
    mode: 'sign-in' | 'sign-up';
};

const points = [
    'Secure account flows with Clerk',
    'Dark and light theme support',
    'Simple layout that is easy to replace later',
];

export function AuthShell({ children, mode }: AuthShellProps) {
    const isSignIn = mode === 'sign-in';

    return (
        <main className="auth-shell flex flex-1">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-16">
                <section className="max-w-xl space-y-6">
                    <div className="space-y-4">
                        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                            StarterKit auth
                        </p>
                        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                            {isSignIn ? 'Welcome back' : 'Create your account'}
                        </h1>
                        <p className="max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                            {isSignIn
                                ? 'Sign in to continue to your workspace.'
                                : 'Set up your account and start using the app.'}
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        {points.map((point) => (
                            <div
                                key={point}
                                className="rounded-2xl border bg-card px-4 py-4 text-sm text-muted-foreground shadow-sm"
                            >
                                {point}
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button asChild variant="outline" size="sm">
                            <Link href="/">Back home</Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                            <Link href={isSignIn ? '/sign-up' : '/sign-in'}>
                                {isSignIn
                                    ? 'Need an account? Sign up'
                                    : 'Already have an account? Sign in'}
                            </Link>
                        </Button>
                    </div>
                </section>

                <section className="flex w-full justify-center lg:justify-end">
                    <div className="flex w-full max-w-[420px] justify-center">
                        <div className="clerk-direct w-full">
                            {children}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
