import sys
import os
import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

# Add the parent directory to sys.path to import db_manager
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import db_manager

app = FastAPI(title="Crypto Command Center API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev, allow all. Lock down in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class AlertConfig(BaseModel):
    check_interval: int
    coin_id: str

@app.get("/")
def read_root():
    return {"status": "online", "system": "Crypto Command Center"}

@app.get("/stats")
def get_stats(symbol: str = "BTC"):
    """
    Get the latest price, calculated RSI, and simple status.
    """
    conn = db_manager.get_db_connection()
    try:
        # Fetch last 30 prices for the specific symbol
        df = pd.read_sql_query("SELECT * FROM prices WHERE symbol = ? ORDER BY timestamp DESC LIMIT 30", conn, params=(symbol,))
        
        if df.empty:
            return {"status": "waiting_for_data", "price": 0, "rsi": 0, "symbol": symbol}

        # Sort by timestamp ascending for calculation
        df = df.sort_values(by='timestamp')
        
        # Calculate RSI (using same logic as dashboard.py)
        period = 14
        delta = df['price'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))
        
        latest = df.iloc[-1]
        latest_rsi = latest['rsi'] if not pd.isna(latest['rsi']) else 50.0  # Default neutral
        
        # Determine Status
        status_label = "NEUTRAL"
        if latest_rsi < 30:
            status_label = "OVERSOLD"
        elif latest_rsi > 70:
            status_label = "OVERBOUGHT"

        return {
            "symbol": symbol,
            "price": latest['price'],
            "rsi": round(latest_rsi, 1),
            "status": status_label,
            "timestamp": latest['timestamp']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/history")
def get_history(symbol: str = "BTC"):
    """
    Get historical price data.
    If symbol='ALL', return data pivoting for multiple lines.
    """
    conn = db_manager.get_db_connection()
    try:
        if symbol == "ALL":
            # Fetch last 500 records to cover multiple coins
            df = pd.read_sql_query("SELECT timestamp, symbol, price FROM prices ORDER BY timestamp DESC LIMIT 500", conn)
            
            # Pivot table: timestamps as rows, symbols as columns
            # We round timestamps to nearest minute to align them if needed, but for now raw might work if valid
            # Simpler approach: return raw list and let frontend handle grouping, or just separate arrays.
            # Let's return a unified list where each item has {timestamp, BTC, ETH, ...}
            
            # Pivot requires matching timestamps. Since scripts run sequentially, timestamps might differ slightly.
            # Best approach for simple graph: Return separate datasets per coin? 
            # Or just return raw data and let Recharts group by XAxis (timestamp). 
            # Recharts is picky. Let's return raw list sorted by time.
            data = df.sort_values(by='timestamp').to_dict(orient='records')
            return data
            
        else:
            # Fetch last 100 points for specific coin
            df = pd.read_sql_query("SELECT timestamp, price FROM prices WHERE symbol = ? ORDER BY timestamp DESC LIMIT 100", conn, params=(symbol,))
            data = df.sort_values(by='timestamp').to_dict(orient='records')
            return data
    finally:
        conn.close()
