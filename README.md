# Crypto Alerts

A focused workspace for BTC, ETH, SOL and DOGE: recorded USD prices, comparison charts, RSI observations and optional Telegram alerts. The interface pairs a procedural dot-cloud Bitcoin scene with floating market cards, scroll-driven storytelling and a working market terminal.

## What works

- Four-asset watchlist with prices and sparklines from your Python API.
- Individual price charts and a relative comparison view, rebased to each asset's first loaded sample. Dates stay distinct across midnight; missing samples are not filled.
- RSI warm-up, sample timestamps, delayed-data and offline states. Previously loaded observations stay available during outages.
- CSV download and an inspectable sample table.
- Expandable navigation, keyboard controls, responsive layouts, FAQ, and a persistent motion toggle that respects the operating system's reduced-motion setting.
- Optional Google/GitHub sign-in. Market viewing is public; sign-in does not protect the Python API.
- Existing Python collector, SQLite storage, Telegram threshold notifications and optional Streamlit dashboard.

The visual direction was studied from [Autopilot](https://launch.joinautopilot.com/). The artwork, branding and implementation are original to this project. See [interface notes](docs/interface.md) for the animation and interaction details.

## Requirements

- Node.js 24 or newer, with npm.
- Python 3.10 or newer.
- Internet access for collecting prices. Viewing already stored samples works without starting the collector.

## Install

Run these commands from the repository root in PowerShell:

```powershell
git clone https://github.com/BroCoder007/crypto-alerts.git
cd crypto-alerts
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -c "import db_manager; db_manager.init_db()"
cd frontend
npm ci
Copy-Item .env.example .env.local
cd ..
```

On macOS/Linux, use `.venv/bin/python` instead of `.\.venv\Scripts\python.exe` and `cp frontend/.env.example frontend/.env.local`. Keep Python processes in the repository root: the SQLite path is relative to the current directory.

## Run locally

**Terminal 1 — price API, from the repository root:**

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.api:app --host 127.0.0.1 --port 8000
```

API documentation: [localhost:8000/docs](http://127.0.0.1:8000/docs).

**Terminal 2 — web interface:**

```powershell
cd frontend
npm run dev
```

Open [localhost:3000](http://localhost:3000). The Node server forwards `/api/market/*` requests to the Python API. `CRYPTO_API_URL` in `frontend/.env.local` defaults to `http://127.0.0.1:8000`; change it if your API runs elsewhere, then restart Next.js. This value stays on the server.

**Terminal 3 — optional live collection, from the repository root:**

```powershell
.\.venv\Scripts\python.exe main_script.py
```

This fetches a price for each asset approximately every 60 seconds and writes it to SQLite. A newly initialized database starts empty; allow at least 15 observations per asset for the UI's RSI warm-up. The browser checks the API every five seconds while the tab is visible. Faster browser refreshes do not create new market samples.

Use Ctrl+C in each terminal to stop the corresponding service. `run_web.ps1` remains a convenience launcher for all three processes; it also starts the collector, so the separate commands above give you more control.

## Telegram configuration

Set these environment variables in the **collector's terminal** before launching it:

```powershell
$env:TELEGRAM_BOT_TOKEN = "your-new-bot-token"
$env:TELEGRAM_CHAT_ID = "your-chat-id"
.\.venv\Scripts\python.exe main_script.py
```

Create a bot with [BotFather](https://t.me/BotFather) and start a conversation with it before sending alerts. Use a new token if an earlier one was committed to Git. Never place real credentials in source files or commit them.

The root `.env.example` lists the collector variables for reference. Python does **not** load that file automatically. With either variable missing, collection still works and Telegram delivery is skipped. When configured, the existing collector may send a notification on every check while RSI remains below 30 or above 70; it does not deduplicate alerts. The web interface cannot verify bot configuration or successful delivery.

## Optional accounts

`frontend/.env.example` includes the optional NextAuth variables. Configure at least one provider, a strong `NEXTAUTH_SECRET` and your actual `NEXTAUTH_URL` before using sign-in. Register the matching callback URL with your provider:

```text
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/callback/github
```

With no configured provider, `/login` explains that accounts are unavailable and links back to the public terminal. Accounts do not configure alerts or restrict market access.

## Build and check

From `frontend/`:

```powershell
npm test
npm run build
npm start
```

The production script uses the webpack build pipeline. The tests cover UTC parsing, cross-date comparisons, invalid samples, ordering and CSV output. `npm audit --omit=dev` checks runtime dependencies separately from development tooling.

For the alternative Python interface, run this from the repository root:

```powershell
.\.venv\Scripts\python.exe -m streamlit run dashboard.py
```

## Data and hosting

- The API returns up to 500 recent records across assets. The web interface keeps up to 100 per asset for individual charts; actual coverage depends on collection history.
- Percent changes describe the **loaded window**, not a 24-hour market return. Comparison starting times can differ.
- SQLite timestamps are interpreted as UTC and displayed in the viewer's local time. Samples older than three minutes show a delay indicator.
- RSI is an observation from the existing backend implementation. The collector computes its own alert reading; this interface does not replace either calculation or predict future prices.
- Run a Node server for Next.js and a Python API/collector with persistent SQLite storage. GitHub Pages alone cannot run this stack. When hosting the two services separately, point `CRYPTO_API_URL` at your deployed API and keep collector credentials in the host's secret settings.
- The dashboard is a monitoring tool. It does not place trades or guarantee price accuracy or notification delivery.

## Structure

```text
backend/api.py                       FastAPI stats and history
db_manager.py                        SQLite storage and collector RSI
main_script.py                       Price collection and optional Telegram alerts
dashboard.py                         Alternative Streamlit dashboard
frontend/src/app/page.tsx            Landing page and market terminal
frontend/src/app/api/market/         Server-side API proxy
frontend/src/components/market/      Scene, charts and polling
frontend/src/lib/market.ts           Validated data transformations and export
frontend/tests/                      Market-data regression tests
docs/interface.md                    Design, motion and verification notes
```
