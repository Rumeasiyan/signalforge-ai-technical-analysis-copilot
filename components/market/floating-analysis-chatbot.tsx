'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

type AnalysisSummary = {
    directionalBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    setupQualityScore: number;
    confidenceScore: number;
    trendSummary: string;
    momentumCondition: string;
    breakoutRisk: string;
    reversalRisk: string;
};

type FloatingAnalysisChatbotProps = {
    symbol: string;
    timeframe: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
    analysisSummary: AnalysisSummary;
    marketContext: Record<string, unknown> | null;
    widgetExplainers: Record<string, string>;
};

function renderMarkdownLite(content: string) {
    const lines = content.split('\n');

    return lines.map((line, lineIndex) => {
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

        return (
            <span key={`line-${lineIndex}`}>
                {parts.map((part, partIndex) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                            <strong key={`part-${lineIndex}-${partIndex}`} className="font-semibold text-foreground">
                                {part.slice(2, -2)}
                            </strong>
                        );
                    }

                    if (part.startsWith('`') && part.endsWith('`')) {
                        return (
                            <code
                                key={`part-${lineIndex}-${partIndex}`}
                                className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground"
                            >
                                {part.slice(1, -1)}
                            </code>
                        );
                    }

                    return <span key={`part-${lineIndex}-${partIndex}`}>{part}</span>;
                })}
                {lineIndex < lines.length - 1 ? <br /> : null}
            </span>
        );
    });
}

export function FloatingAnalysisChatbot({
    symbol,
    timeframe,
    analysisSummary,
    marketContext,
    widgetExplainers,
}: FloatingAnalysisChatbotProps) {
    const storageKey = useMemo(
        () => `signalforge:analysis-chat:${symbol}:${timeframe}`,
        [symbol, timeframe]
    );
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content:
                'I can explain this page. Click any widget card, then ask a question about that section.',
        },
    ]);
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(storageKey);
            if (!raw) {
                return;
            }

            const parsed = JSON.parse(raw) as ChatMessage[];
            if (!Array.isArray(parsed) || parsed.length === 0) {
                return;
            }

            const normalized = parsed
                .filter(
                    (item): item is ChatMessage =>
                        typeof item === 'object' &&
                        item !== null &&
                        (item.role === 'assistant' || item.role === 'user') &&
                        typeof item.content === 'string'
                )
                .slice(-20);

            if (normalized.length > 0) {
                setMessages(normalized);
            }
        } catch {
            // Ignore session history parse errors.
        }
    }, [storageKey]);

    useEffect(() => {
        try {
            sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-20)));
        } catch {
            // Ignore session history write errors.
        }
    }, [messages, storageKey]);

    useEffect(() => {
        function handlePageClick(event: MouseEvent) {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }

            const container = target.closest('[data-explain-id]');
            if (!container) {
                return;
            }

            const explainId = container.getAttribute('data-explain-id');
            if (explainId) {
                setSelectedWidget(explainId);
            }
        }

        document.addEventListener('click', handlePageClick);
        return () => document.removeEventListener('click', handlePageClick);
    }, []);

    const selectedWidgetContext = useMemo(() => {
        if (!selectedWidget) {
            return null;
        }

        return widgetExplainers[selectedWidget] ?? null;
    }, [selectedWidget, widgetExplainers]);

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
                    selectedWidget,
                    selectedWidgetContext,
                    priorMessages: messages.slice(-8),
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
        <>
            {!isOpen ? (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-95"
                    aria-label="Open AI chat assistant"
                >
                    <MessageSquare className="size-4" />
                    Ask AI
                </button>
            ) : null}

            {isOpen ? (
                <section className="fixed bottom-5 right-5 z-50 flex h-[560px] w-[360px] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl">
                    <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-foreground">SignalForge AI Assistant</p>
                            <p className="text-[11px] text-muted-foreground">Context-aware page Q and A</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                            aria-label="Close AI chat assistant"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    <div className="border-b border-border/60 bg-background/50 px-4 py-2 text-[11px] text-muted-foreground">
                        {selectedWidgetContext ? (
                            <span>
                                Focus: <span className="font-medium text-foreground">{selectedWidget}</span>
                            </span>
                        ) : (
                            <span>Tip: click any analysis card to set chat focus.</span>
                        )}
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto p-4">
                        {messages.map((message, index) => (
                            <div
                                key={`${message.role}-${index}`}
                                className={`rounded-lg px-3 py-2 text-xs leading-6 ${
                                    message.role === 'assistant'
                                        ? 'border border-border/50 bg-background text-muted-foreground'
                                        : 'ml-auto max-w-[85%] bg-primary/10 text-foreground'
                                }`}
                            >
                                {renderMarkdownLite(message.content)}
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-border/70 p-3">
                        <div className="mb-2 flex flex-wrap gap-1">
                            {Object.keys(widgetExplainers).slice(0, 8).map((widgetId) => (
                                <button
                                    key={widgetId}
                                    type="button"
                                    onClick={() => setSelectedWidget(widgetId)}
                                    className={`rounded-full border px-2 py-1 text-[10px] transition ${
                                        selectedWidget === widgetId
                                            ? 'border-primary/40 bg-primary/10 text-foreground'
                                            : 'border-border text-muted-foreground hover:bg-accent/50'
                                    }`}
                                >
                                    {widgetId}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    setMessages([
                                        {
                                            role: 'assistant',
                                            content:
                                                'New chat started. Ask me anything about this setup, and I will guide step by step.',
                                        },
                                    ]);
                                }}
                                className="rounded-full border border-border px-2 py-1 text-[10px] text-muted-foreground transition hover:bg-accent/50"
                            >
                                New chat
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={question}
                                onChange={(event) => setQuestion(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        void ask();
                                    }
                                }}
                                placeholder="Explain this widget in detail..."
                                className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/60"
                            />
                            <Button type="button" onClick={ask} disabled={loading}>
                                {loading ? '...' : 'Ask'}
                            </Button>
                        </div>
                    </div>
                </section>
            ) : null}
        </>
    );
}
