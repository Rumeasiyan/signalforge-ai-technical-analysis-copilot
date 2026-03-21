# SignalForge Demo Quick Script

Use this one-page script when presenting live.

## 1) Open with the problem

"Traders spend too much time manually combining trend, momentum, levels, and scenarios. SignalForge turns that into a consistent, explainable workflow."

## 2) Show Dashboard (`/dashboard`)

- Watchlist overview
- Strong bullish / bearish / neutral setups
- Instruments needing attention
- Quick analysis launcher

Message: "This is the daily triage screen."

## 3) Show Analysis Desk (`/analysis`)

1. Search symbol (for example: `AAPL` or `BTCUSD`)
2. Pick timeframe
3. Run analysis

Highlight outputs:

- directional bias
- setup quality and confidence
- key support/resistance
- indicator interpretation
- multi-timeframe alignment/conflict
- scenario plan with invalidation
- price chart showing bars used for analysis
- CSV exports for candles and analysis snapshot
- AI chatbot for deeper Q and A on setup logic

Message: "This is decision support, not blind signal-following."

## 4) Show Watchlist (`/watchlist`)

- Compare setup quality across names
- Refresh analysis quickly
- Remove weak setups from focus

Message: "This reduces review time and improves consistency."

## 5) Show History (`/history`)

- Reopen previous analysis
- Show bias changes over time
- Explain review/journaling value

Message: "This creates a repeatable decision trail."

## Data and AI note (important)

- Market context comes from Yahoo Finance chart data (public endpoint).
- Indicators are computed in-app (EMA, RSI, MACD, ATR, volume ratio).
- Gemini refines interpretation and commentary when `GEMINI_API_KEY` is set.
- If Gemini is unavailable, SignalForge falls back to rule-based technical output.

## Close with business value

"SignalForge helps teams review more instruments in less time, with clearer structure, explicit uncertainty, and more consistent technical commentary."
