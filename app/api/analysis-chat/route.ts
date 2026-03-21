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
        return `The current directional bias is ${bias}. It is supported by the setup quality score (${setup}/100), confidence score (${confidence}/100), and momentum profile: ${momentum}`;
    }

    if (lower.includes('invalidation') || lower.includes('wrong')) {
        return `Focus on invalidation around key support/resistance zones and scenario triggers. Reversal warning: ${reversalRisk}`;
    }

    if (lower.includes('breakout') || lower.includes('breakdown')) {
        return breakoutRisk;
    }

    return `Current read: bias ${bias}, setup quality ${setup}/100, confidence ${confidence}/100. Momentum context: ${momentum}`;
}

export async function POST(request: Request) {
    const payload = (await request.json()) as {
        symbol?: string;
        timeframe?: string;
        question?: string;
        analysisSummary?: Record<string, unknown>;
        marketContext?: Record<string, unknown> | null;
    };

    const question = String(payload.question ?? '').trim().slice(0, 500);
    const symbol = String(payload.symbol ?? '').toUpperCase();
    const timeframe = String(payload.timeframe ?? 'MEDIUM_TERM');
    const analysisSummary = payload.analysisSummary ?? {};
    const marketContext = payload.marketContext ?? null;

    if (!question) {
        return NextResponse.json({ answer: 'Please ask a specific question about this setup.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({
            answer: fallbackAnswer(question, analysisSummary),
        });
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const prompt = `You are SignalForge's technical analysis copilot assistant.
Provide concise, explainable, non-promissory answers.
Do not provide financial advice guarantees.

Context:
- Symbol: ${symbol}
- Timeframe: ${timeframe}
- Analysis summary: ${JSON.stringify(analysisSummary)}
- Market context: ${JSON.stringify(marketContext)}

User question:
${question}

Answer in 4-7 sentences, practical and specific to this context.`;

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
            return NextResponse.json({ answer: fallbackAnswer(question, analysisSummary) });
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
            fallbackAnswer(question, analysisSummary);

        return NextResponse.json({ answer });
    } catch {
        return NextResponse.json({ answer: fallbackAnswer(question, analysisSummary) });
    }
}
