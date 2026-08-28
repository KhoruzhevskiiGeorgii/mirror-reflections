# Millionaire Country Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a screenshot-friendly GitHub Pages currency-millionaire joke app.

**Architecture:** Static app under `millionaire/`. Pure functions own validation, ranking, formatting, and share text; the browser module owns Frankfurter fetching and DOM rendering.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, Node built-in test runner, Frankfurter v2.

**Spec:** `docs/superpowers/specs/2026-08-28-millionaire-country-design.md`

## Global Constraints
- Default input currency is USD.
- No backend, framework, analytics, cookies, API key, or build step.
- Live rates come from Frankfurter v2; failures are visible and retryable.
- Result must be easy to screenshot and share on X.

---

### Task 1: Calculation core
- [ ] Write tests for validation, qualifying-country ranking, and share text.
- [ ] Run tests and confirm they fail because implementation is absent.
- [ ] Implement `millionaire/core.mjs` minimally.
- [ ] Run tests and confirm green.
- [ ] Commit and push checkpoint.

### Task 2: Browser experience
- [ ] Add country/currency mapping and browser orchestration.
- [ ] Add landing/result/error states in `millionaire/index.html`.
- [ ] Add responsive screenshot-friendly styling.
- [ ] Add query-param restoration, X intent, clipboard share, retry handling, and FX source date.
- [ ] Run core tests plus static syntax/link checks.
- [ ] Commit and push checkpoint.

### Task 3: Publish
- [ ] Verify files from pushed branch and inspect diff.
- [ ] Merge feature branch into `main` so existing GitHub Pages publishes `/millionaire/`.
- [ ] Verify `main` commit and public page response if available.
