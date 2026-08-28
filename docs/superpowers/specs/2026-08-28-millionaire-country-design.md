# Millionaire Country — Design

## Goal
Build a lightweight, mobile-first GitHub Pages joke app where a user enters an amount (USD by default) and discovers countries where that amount converts to at least 1,000,000 units of local currency.

## Experience
1. Landing view asks “How much money do you have?” with amount input and currency selector; USD is default.
2. On submit, fetch current FX rates from Frankfurter v2 and calculate local-currency values.
3. Choose the qualifying country whose converted amount is closest to 1,000,000 as the hero result: the most exclusive millionaire threshold the user clears.
4. Hero fills most of the viewport with flag, “Congratulations”, country name, and converted amount.
5. Other qualifying countries appear below in a compact list.
6. Result URL stores amount/currency in query parameters so it can be shared and reopened.
7. “Share on X” opens an X intent with concise result text and the current URL; “Copy result” copies share text + URL.

## Data
- FX source: Frankfurter v2 (`https://api.frankfurter.dev/v2/rates?base=...`). Frankfurter aggregates institutional/central-bank sources and requires no API key.
- Country/currency mapping is a small checked-in static table for current national currencies useful to this joke. Multiple countries may share a currency.
- The source date returned by Frankfurter is displayed in the UI.
- If live FX loading fails, show an explicit retryable error rather than stale invented values.

## Technical shape
Static HTML/CSS/ES modules only; no backend, framework, analytics, cookies, or build step. Pure calculation/share helpers live in `millionaire/core.mjs` and are covered by Node’s built-in test runner. `millionaire/index.html` and `millionaire/styles.css` provide the UI.

## Visual direction
Bold editorial travel-poster feel rather than finance-dashboard UI: oversized typography, warm paper-like background, strong borders/shadows, large flag, responsive full-screen hero. Result view is intentionally screenshot-friendly on phones. Respect reduced-motion preference.

## Edge cases
- Reject empty, zero, negative, NaN, and absurdly large inputs.
- Input currency itself may qualify.
- If no mapped country reaches one million, say so and show the amount needed for the nearest threshold when data permits.
- Currencies without mapped sovereign countries are ignored for country results.
