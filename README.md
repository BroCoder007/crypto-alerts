# Crypto Command Center & Alerts

A full-stack cryptocurrency tracker and alert system that monitors live prices (BTC, ETH, SOL, DOGE), calculates RSI (Relative Strength Index), and sends real-time Telegram alerts for Overbought/Oversold conditions. It features a Next.js web dashboard, a Streamlit alternative dashboard, and a FastAPI backend.

## 🚀 Features

- **Real-Time Data Collection:** Fetches live crypto prices via CryptoCompare API.
- **RSI Calculation:** Automatically calculates RSI over a 14-period window to identify Overbought (>70) and Oversold (<30) zones.
- **Telegram Alerts:** Sends instant Telegram messages when a cryptocurrency enters a trading signal zone.
- **FastAPI Backend:** Provides robust REST API endpoints (`/stats` and `/history`) for price tracking.
- **Next.js Web Dashboard:** A beautiful, responsive web interface for visualizing crypto prices and signals.
- **Streamlit Dashboard:** An alternative lightweight Python-native dashboard (`dashboard.py`).
- **SQLite Database:** Stores historical price data locally (`crypto_data.db`).

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- **Python 3.8+**
- **Node.js** (v16+ recommended) and **npm**

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BroCoder007/crypto-alerts.git
   cd crypto-alerts
   ```

2. **Install Python Dependencies:**
   ```bash
   pip install fastapi uvicorn requests pandas streamlit pydantic
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

## ⚙️ Configuration

To enable Telegram alerts, you need to configure your Bot Token and Chat ID.

1. Open `main_script.py`.
2. Locate the `# --- CONFIGURATION ---` section.
3. Replace the placeholder values with your actual Telegram credentials:
   ```python
   TELEGRAM_BOT_TOKEN = "your_bot_token_here"
   TELEGRAM_CHAT_ID = "your_chat_id_here"
   ```
*(Note: You can get a Telegram Bot Token by talking to [BotFather](https://t.me/botfather) on Telegram. You can find your Chat ID using bots like [userinfobot](https://t.me/userinfobot).)*

## 🚦 Running the Application

### The Easy Way (Windows PowerShell)
You can launch the entire stack (FastAPI Backend, Data Collector, and Next.js Frontend) using the provided script:
```powershell
./run_web.ps1
```
*(Ensure you have execution policies enabled in PowerShell if you encounter errors running scripts).*

### Manual Startup
If you prefer to run services individually or are on a different OS:

1. **Start the FastAPI Backend:**
   ```bash
   python -m uvicorn backend.api:app --reload --port 8000
   ```
   *(API will be available at http://localhost:8000/docs)*

2. **Start the Data Collector (in a new terminal):**
   ```bash
   python main_script.py
   ```
   *(This starts fetching data and sending alerts)*

3. **Start the Next.js Frontend (in a new terminal):**
   ```bash
   cd frontend
   npm run dev
   ```
   *(Dashboard will be available at http://localhost:3000)*

4. **(Optional) Start the Streamlit Dashboard:**
   ```bash
   streamlit run dashboard.py
   ```

## 📂 Project Structure

- `main_script.py` - Core data fetcher, RSI calculator, and Telegram alert dispatcher.
- `db_manager.py` - Manages SQLite connections and data insertion logic.
- `backend/api.py` - FastAPI application serving data to the frontend.
- `dashboard.py` - Standalone Streamlit dashboard.
- `frontend/` - Next.js React application (Web Interface).
- `run_web.ps1` - PowerShell automation script to start the stack.
