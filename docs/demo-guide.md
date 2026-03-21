# SignalForge MVP Demo Guide

This guide helps you run a polished, business-focused demo of SignalForge: AI Technical Analysis Copilot.

## Demo objective

Show how SignalForge helps traders and analysts:

- reduce manual chart-reading fatigue
- get consistent multi-timeframe technical interpretation
- identify actionable setups faster
- monitor watchlists with clear setup-quality context
- revisit prior analysis for review and learning

## Audience and positioning

Use this opening line:

"SignalForge is an AI-assisted technical analysis workspace that converts raw market structure and indicators into explainable, decision-ready market intelligence."

Best-fit audiences:

- retail and swing traders
- prop and advisory desks
- market research and portfolio teams

## Demo environment checklist

Complete before presenting:

1. App deployed and reachable (Vercel URL).
2. Production database connected and migrated.
3. At least one user account available for sign-in.
4. A few sample analyses already generated (optional but recommended).
5. Watchlist has 3 to 8 instruments for a non-empty first impression.
6. `GEMINI_API_KEY` is set for AI narrative refinement (optional but recommended).

## Pre-demo prep (10 minutes)

1. Sign in to your demo account.
2. Open `/dashboard` and verify key sections render.
3. Open `/analysis` and test at least one symbol (for example: NVDA, SPY, BTCUSD).
4. Open `/watchlist` and confirm setup quality and confidence values show.
5. Open `/history` and confirm at least a few snapshots exist.
6. Verify the analysis page chart renders and both CSV export buttons download correctly.

### Data realism note for demo

SignalForge now uses Yahoo Finance chart data (public endpoint) for candle-based indicator context:

- moving averages (EMA20 / EMA50 / EMA200)
- RSI(14)
- MACD
- ATR-based volatility proxy
- volume participation ratio

Gemini then refines this structured context into explainable analyst commentary. If Gemini is unavailable, the app still returns a rule-based technical read.

If first-time environment is empty, quickly run 3 to 5 analyses in different timeframes.

## Suggested 12-minute live demo flow

### 1) Problem and promise (1 minute)

Say:

- Traders waste time manually combining trend, momentum, levels, and scenarios.
- SignalForge standardizes that workflow into a repeatable analysis system.

### 2) Dashboard walkthrough (2 minutes)

Go to `/dashboard`.

Highlight:

- watchlist overview
- strongest bullish, bearish, and neutral setups
- instruments needing attention
- quick analysis launcher

Business message:

"This is the morning command center for fast market triage."

### 3) Instrument analysis workflow (4 minutes)

Go to `/analysis`.

Steps:

1. Search an instrument.
2. Select timeframe (short, medium, or long term).
3. Run AI analysis.
4. Review:
   - directional bias
   - setup quality and confidence
   - market commentary in plain language
   - key support and resistance zones
   - indicator interpretation
   - multi-timeframe alignment/conflict
   - bullish/bearish/neutral scenario plan
   - breakout and reversal risk
   - chart data behind the analysis
   - CSV exports for market bars and analysis snapshot
   - chatbot answers for deeper setup explanation

Business message:

"We are not replacing trader judgment. We are making judgment faster, more consistent, and explainable."

### 4) Watchlist monitoring workflow (2 minutes)

Go to `/watchlist`.

Show:

- adding/removing symbols
- setup quality drift at a glance
- confidence comparison across names
- quick refresh analysis button

Business message:

"This helps teams prioritize clean structures and avoid low-clarity setups."

### 5) History and review (2 minutes)

Go to `/history`.

Show:

- previous snapshots
- bias changes over time
- reopen old analyses

Business message:

"This creates a decision trail for journaling, team discussion, and process improvement."

### 6) Close with ROI (1 minute)

Say:

- faster watchlist review cycles
- more structured market commentary
- improved consistency in technical decision-making
- better visibility into uncertainty and mixed-signal regimes

## Talk track snippets you can reuse

- "SignalForge turns indicator noise into decision context."
- "Every analysis includes both opportunity and invalidation logic."
- "Multi-timeframe conflict is explicit, so users avoid one-chart bias."
- "Setup quality and confidence help allocate attention where structure is cleanest."

## Demo scenarios that usually land well

Use one of these during Q and A:

1. Strong trend, weaker momentum
   - explain fragility despite directional bias
2. Choppy range / neutral regime
   - explain why uncertainty should reduce conviction
3. Bias change in history
   - show how prior assumptions can be reviewed and adjusted

## Handling common stakeholder questions

### Is this auto-trading?

No. SignalForge is a decision-support copilot for technical interpretation and scenario planning.

### How is risk communicated?

Each read includes breakout/breakdown and reversal risk with plain-language invalidation logic.

### Can this support teams?

Yes. The output is structured enough for desk briefings, trader journals, and client-facing commentary.

### What if signals are mixed?

The system explicitly marks neutral or unclear conditions to prevent forced directional conclusions.

## Demo fallback plan

If live generation is slow or unavailable:

1. Use already generated snapshots in `/analysis`.
2. Pivot to `/dashboard`, `/watchlist`, and `/history` to show end-to-end workflow value.
3. Explain that analysis output is persisted and revisit-ready for daily process continuity.

If external data is temporarily unavailable:

4. Mention that SignalForge degrades gracefully to deterministic local analysis logic, so workflows remain usable.

## Post-demo next steps

Offer one or more of these:

1. Pilot with a focused instrument universe.
2. Add team-level collaboration and shared watchlists.
3. Integrate execution or alerting workflows.
4. Add custom indicator packs per strategy style.
