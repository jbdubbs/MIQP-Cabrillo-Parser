# MQP Score Calculator

A browser-based score calculator for the **Michigan QSO Party (MQP)**. Upload a Cabrillo 3.0 log file, select your station type, and instantly see your claimed score broken down by band, mode, and multiplier.

---

## Features

- **Cabrillo 3.0 parsing** — drag-and-drop or browse to load your log file; handles both CR LF and LF line endings gracefully
- **Michigan and non-Michigan scoring** — separate multiplier sets and contact validity rules per the official MQP rules
- **Per-mode multiplier tracking** — CW and SSB multipliers counted independently, per MQP rules
- **Dupe detection** — same callsign + band + mode + QTH = zero points; mobile/rover stations logging the same callsign from a new county are counted as new valid contacts
- **Full warnings panel** — flags unknown QTH codes, invalid bands (non-contest frequencies), unsupported modes (e.g. FT8), SentQth mismatches, non-Michigan-to-non-Michigan contacts, and file encoding issues
- **Band/mode breakdown table** — QSO count and points by band and mode, with totals
- **Multiplier checklist** — visual grid of every possible multiplier showing worked/not-worked status, color-coded by CW, SSB, or both
- **Printable report** — letter-size print layout including the full QSO log, triggered by the printer icon in the results toolbar

---

## Scoring Rules (MQP)

| | Michigan Station | Non-Michigan Station |
|---|---|---|
| **Valid contacts** | Any station | Michigan stations only |
| **Multipliers** | 83 MI counties + 49 US states + DC + 13 CA provinces + DX | 83 MI counties only |
| **Mult counting** | Per mode (CW and SSB tracked separately) | Per mode |
| **SSB QSO points** | 1 pt | 1 pt |
| **CW QSO points** | 2 pts | 2 pts |
| **Valid bands** | 80, 40, 20, 15, 10m | 80, 40, 20, 15, 10m |
| **Valid modes** | CW, PH | CW, PH |

**Final score** = Total QSO points × (CW multipliers + SSB multipliers)

---

## Getting Started

### Prerequisites

- Python 3 (for the local dev server — no other dependencies)
- A modern browser (Chrome, Firefox, Edge, Safari)

### Running locally

```bash
git clone <repo-url>
cd stateQSOMultCalc
./server.sh start
```

Then open **http://localhost:8080** in your browser.

```bash
./server.sh stop      # stop the server
./server.sh restart   # restart
```

Server logs are written to `.server.log`. The process ID is tracked in `.server.pid`.

> The app uses ES modules (`<script type="module">`), so it must be served over HTTP — opening `index.html` directly from the filesystem will not work in most browsers.

---

## Usage

1. **Select your station type** — Michigan Station or Non-Michigan Station
2. **Load your log file** — drag and drop a `.log` / `.cbr` / `.txt` file onto the drop zone, or click to browse
3. **Click Calculate Score**
4. Review the results:
   - **Score Summary** — QSO points, CW mults, SSB mults, total mults, and final claimed score
   - **Warnings** — expandable panel listing every skipped or flagged QSO with the reason
   - **Band/Mode Breakdown** — QSO and point totals per band and mode combination
   - **Multipliers** — full checklist of every possible multiplier; color-coded chips show CW-only (blue), SSB-only (orange), both (green), or not worked (dim)
   - **QSO Log Detail** — expandable table of every QSO line with its scoring status
5. Click the **printer icon** to print the full report

---

## Cabrillo Format

The app expects [Cabrillo 3.0](https://miqp.org/index.php/cabrillo-information/) format. Each QSO line must have exactly 10 fields:

```
QSO: <freq> <mode> <date> <time> <sentCall> <sentRST> <sentQth> <rcvCall> <rcvRST> <rcvQth>
```

Example:
```
QSO: 14000 CW 2024-04-27 1400 W8TEST 599 KENT K8ABC 599 OH
```

- Michigan stations: `SentQth` must be a Michigan county abbreviation (e.g. `KENT`, `WAYN`)
- Non-Michigan stations: `SentQth` must be a state, Canadian province, or `DX`
- Files with LF-only line endings (Linux/Mac exports) are accepted with an informational warning

Sample log files are in [`examples/`](examples/).

---

## Project Structure

```
stateQSOMultCalc/
├── index.html                  # Single-page app shell
├── styles/
│   └── main.css                # Screen styles + @media print layout
├── src/
│   ├── contests/
│   │   └── mqp.js              # MQP rules: county/state/province lists, band mapping, point values
│   ├── parser/
│   │   └── cabrillo.js         # Cabrillo file parser → normalized QSO records
│   ├── scoring/
│   │   └── engine.js           # Pure scoring functions: dupe detection, mult tracking, final score
│   └── ui/
│       └── app.js              # DOM event handling and rendering; no scoring logic
├── examples/
│   ├── sample-michigan.log     # Sample Cabrillo log for a Michigan station
│   └── sample-non-michigan.log # Sample Cabrillo log for a non-Michigan station
└── server.sh                   # Start/stop/restart the local HTTP server
```

The scoring engine (`src/scoring/engine.js`) and contest rules (`src/contests/mqp.js`) have no DOM dependencies and can be unit tested independently of the UI.

---

## Reference

- [MQP Official Rules](https://miqp.org/index.php/rules/)
- [MQP Cabrillo Format](https://miqp.org/index.php/cabrillo-information/)
- [MQP Official Multiplier List](https://miqp.org/index.php/official-list-of-mults/)
