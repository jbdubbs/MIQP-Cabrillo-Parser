# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

A web-based QSO multiplier calculator for amateur radio contests, primarily targeting the Michigan QSO Party (MQP) but designed to support other state QSO parties and contests (e.g., ARRL Sweepstakes). Calculates scores, tracks multipliers (states, counties, DX entities), and helps operators understand their contest standing in real time.

## Global Rules

- Always search for best practices from the latest online research. Don't invent or assume, and don't be a pleaser. Be honest and factual.
- Look at the whole plan from top to bottom. Leave no stone unturned.
- Ask clarifying questions if you aren't 100% sure how to do something. Do not make assumptions.

## Tech Stack

- **Language**: JavaScript (vanilla or Node.js — establish early and be consistent)
- **Interface**: Web app (browser-based)
- **No framework assumed yet** — update this section once a framework is chosen (e.g., React, Vue, plain HTML/JS)

## Commands

> Update this section as the project is set up.

```bash
# Install dependencies (once package.json exists)
npm install

# Run dev server
npm run dev

# Run tests
npm test

# Run a single test file
npx jest path/to/test.js   # or equivalent for chosen test runner

# Lint
npm run lint
```

## Contest Scoring Concepts

- **QSO**: A logged two-way radio contact; each valid QSO scores points (typically 1–2 pts depending on mode and station type)
- **Multiplier**: A unique scoring entity (Michigan county, US state, Canadian province, DX country) that multiplies the QSO point total
- **MQP specifics**: Michigan stations work toward county multipliers; out-of-state stations work toward Michigan counties as multipliers
- **Modes**: SSB (phone) and CW/digital may score differently
- **Station classes**: Fixed, mobile, and expedition stations may have different scoring rules

## Architecture Notes

> Expand this section as the codebase grows.

The core logic should be separated from the UI:

- **Scoring engine** (`src/scoring/`) — pure functions for QSO point calculation, multiplier tracking, and total score; no DOM dependencies so it can be unit tested independently
- **Contest rules** (`src/contests/`) — one module per contest type (MQP, ARRL SS, etc.) exporting a rules object; the scoring engine consumes rules objects so adding a new contest doesn't require touching core logic
- **Log parser** (`src/parser/`) — ingests Cabrillo or ADIF log files and normalizes them to a common QSO record format
- **UI layer** (`src/ui/`) — reads from scoring engine, renders results; no scoring logic here
