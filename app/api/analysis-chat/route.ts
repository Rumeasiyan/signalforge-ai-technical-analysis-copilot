import { NextResponse } from 'next/server';

function fallbackAnswer(question: string, analysisSummary: Record<string, unknown>) {
    const lower = question.toLowerCase();
    const bias = String(analysisSummary.directionalBias ?? 'NEUTRAL');
    const setup = Number(analysisSummary.setupQualityScore ?? 0);
    const confidence = Number(analysisSummary.confidenceScore ?? 0);
    const momentum = String(analysisSummary.momentumCondition ?? 'Momentum context unavailable.');
    const breakoutRisk = String(analysisSummary.breakoutRisk ?? 'Breakout risk context unavailable.');
    const reversalRisk = String(analysisSummary.reversalRisk ?? 'Reversal risk context unavailable.');

    if (lower.includes('why') && lower.includes('bias')) {
        return `The current directional bias is ${bias}. It is supported by the setup quality score (${setup}/100), confidence score (${confidence}/100), and momentum profile: ${momentum} Follow-up: do you want a simpler explanation or a detailed indicator-by-indicator breakdown?`;
    }

    if (lower.includes('invalidation') || lower.includes('wrong')) {
        return `Focus on invalidation around key support/resistance zones and scenario triggers. Reversal warning: ${reversalRisk} Follow-up: should I map invalidation for conservative or aggressive risk management?`;
    }

    if (lower.includes('breakout') || lower.includes('breakdown')) {
        return `${breakoutRisk} Follow-up: is your goal to trade breakout continuation or wait for pullback confirmation?`;
    }

    return `Current read: bias ${bias}, setup quality ${setup}/100, confidence ${confidence}/100. Momentum context: ${momentum} Follow-up: what is your intended holding period and risk tolerance?`;
}

function prependWidgetContext(answer: string, selectedWidget: string | null, selectedWidgetContext: string | null) {
    if (!selectedWidget || !selectedWidgetContext) {
        return answer;
    }

    return `Widget focus (${selectedWidget}): ${selectedWidgetContext} ${answer}`;
}

export async function POST(request: Request) {
    const payload = (await request.json()) as {
        symbol?: string;
        timeframe?: string;
        question?: string;
        analysisSummary?: Record<string, unknown>;
        marketContext?: Record<string, unknown> | null;
        selectedWidget?: string | null;
        selectedWidgetContext?: string | null;
        priorMessages?: Array<{
            role?: string;
            content?: string;
        }>;
    };

    const question = String(payload.question ?? '').trim().slice(0, 500);
    const symbol = String(payload.symbol ?? '').toUpperCase();
    const timeframe = String(payload.timeframe ?? 'MEDIUM_TERM');
    const analysisSummary = payload.analysisSummary ?? {};
    const marketContext = payload.marketContext ?? null;
    const selectedWidget = payload.selectedWidget ?? null;
    const selectedWidgetContext = payload.selectedWidgetContext ?? null;
    const priorMessages = Array.isArray(payload.priorMessages)
        ? payload.priorMessages
              .filter(
                  (item) =>
                      (item.role === 'assistant' || item.role === 'user') &&
                      typeof item.content === 'string'
              )
              .map((item) => ({
                  role: item.role as 'assistant' | 'user',
                  content: String(item.content).slice(0, 1000),
              }))
              .slice(-8)
        : [];

    if (!question) {
        return NextResponse.json({ answer: 'Please ask a specific question about this setup.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({
            answer: prependWidgetContext(
                fallbackAnswer(question, analysisSummary),
                selectedWidget,
                selectedWidgetContext
            ),
        });
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const prompt = `You are SignalForge's technical analysis copilot assistant.
The user may not have full financial knowledge.
Use simple language first, then optional technical detail in plain terms.
Define jargon briefly when used.
Provide concise, explainable, non-promissory answers.
Do not provide financial advice guarantees.
If the user's request is ambiguous, end with one clear follow-up question.
If the request is clear, still end with one useful next-step question.

Context:
- Symbol: ${symbol}
- Timeframe: ${timeframe}
- Analysis summary: ${JSON.stringify(analysisSummary)}
- Market context: ${JSON.stringify(marketContext)}
- Selected widget id: ${selectedWidget}
- Selected widget meaning: ${selectedWidgetContext}
- Previous chat turns: ${JSON.stringify(priorMessages)}

User question:
${question}

Answer in 4-8 sentences, practical and specific to this context.`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    temperature: 0.4,
                    topP: 0.9,
                },
            }),
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json({
                answer: prependWidgetContext(
                    fallbackAnswer(question, analysisSummary),
                    selectedWidget,
                    selectedWidgetContext
                ),
            });
        }

        const geminiPayload = (await response.json()) as {
            candidates?: Array<{
                content?: {
                    parts?: Array<{
                        text?: string;
                    }>;
                };
            }>;
        };

        const answer =
            geminiPayload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
            prependWidgetContext(
                fallbackAnswer(question, analysisSummary),
                selectedWidget,
                selectedWidgetContext
            );

        return NextResponse.json({
            answer: prependWidgetContext(answer, selectedWidget, selectedWidgetContext),
        });
    } catch {
        return NextResponse.json({
            answer: prependWidgetContext(
                fallbackAnswer(question, analysisSummary),
                selectedWidget,
                selectedWidgetContext
            ),
        });
    }
}
