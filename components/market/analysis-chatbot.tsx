'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

type AnalysisChatbotProps = {
    symbol: string;
    timeframe: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
    analysisSummary: {
        directionalBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        setupQualityScore: number;
        confidenceScore: number;
        trendSummary: string;
        momentumCondition: string;
        breakoutRisk: string;
        reversalRisk: string;
    };
    marketContext: Record<string, unknown> | null;
};

export function AnalysisChatbot({
    symbol,
    timeframe,
    analysisSummary,
    marketContext,
}: AnalysisChatbotProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content:
                'Ask me about this setup: bias reasoning, invalidation, momentum quality, or what to monitor next.',
        },
    ]);
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);

    async function ask() {
        const trimmed = question.trim();
        if (!trimmed || loading) {
            return;
        }

        setQuestion('');
        setMessages((current) => [...current, { role: 'user', content: trimmed }]);
        setLoading(true);

        try {
            const response = await fetch('/api/analysis-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    symbol,
                    timeframe,
                    question: trimmed,
                    analysisSummary,
                    marketContext,
                }),
            });

            const payload = (await response.json()) as {
                answer?: string;
            };

            setMessages((current) => [
                ...current,
                {
                    role: 'assistant',
                    content:
                        payload.answer ??
                        'I could not generate a detailed response right now. Try rephrasing your question.',
                },
            ]);
        } catch {
            setMessages((current) => [
                ...current,
                {
                    role: 'assistant',
                    content:
                        'The assistant is temporarily unavailable. You can still use the indicator and scenario panels for guidance.',
                },
            ]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <article className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Ask AI about this setup</h2>
            <p className="mt-1 text-xs text-muted-foreground">
                Chat with the analysis context for deeper explanation. Not financial advice.
            </p>

            <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-border/60 bg-background/50 p-3">
                {messages.map((message, index) => (
                    <div
                        key={`${message.role}-${index}`}
                        className={`rounded-lg px-3 py-2 text-xs leading-6 ${
                            message.role === 'assistant'
                                ? 'border border-border/50 bg-background text-muted-foreground'
                                : 'ml-auto max-w-[85%] bg-primary/10 text-foreground'
                        }`}
                    >
                        {message.content}
                    </div>
                ))}
            </div>

            <div className="mt-3 flex gap-2">
                <input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            void ask();
                        }
                    }}
                    placeholder="Why is this bearish if RSI is already low?"
                    className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/60"
                />
                <Button type="button" onClick={ask} disabled={loading}>
                    {loading ? 'Thinking...' : 'Ask'}
                </Button>
            </div>
        </article>
    );
}
