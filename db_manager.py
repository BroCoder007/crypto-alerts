import sqlite3

# --- PART 1: Database Setup ---
oversold_threshold = 30
overbought_threshold = 70
def get_db_connection():
    # WAL is persistent and set once during initialization. Reissuing the mode
    # change on every parallel API read can contend for the database lock.
    return sqlite3.connect('crypto_data.db', timeout=8)

def init_db():
    conn = get_db_connection()
    conn.execute('PRAGMA journal_mode=WAL;')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            price REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    print("Database initialized and table ready.")

def log_price(symbol, price):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO prices (symbol, price) VALUES (?, ?)', (symbol, price))
    conn.commit()
    conn.close()

# --- PART 2: Alert Logic (This was missing!) ---

def check_dump_alert(symbol, current_price):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Fetch the last 10 recorded prices for this coin
    cursor.execute('''
        SELECT price FROM prices 
        WHERE symbol = ? 
        ORDER BY timestamp DESC 
        LIMIT 10
    ''', (symbol,))
    
    rows = cursor.fetchall()
    conn.close()

    # We need at least 10 data points to calculate a valid average
    if len(rows) < 10:
        return False, "Collecting data..."

    # Calculate the average of the last 10 prices
    prices = [row[0] for row in rows]
    average_price = sum(prices) / len(prices)

    # LOGIC: Alert if current price is 1% lower than the recent average
    # You can adjust the 0.99 multiplier (1% drop) or 0.95 (5% drop)
    threshold = average_price * 0.99 

    if current_price < threshold:
        return True, f"⚠️ DUMP DETECTED: ${current_price} is significantly below avg (${average_price:.2f})"
    
    return False, "Price stable"

    # ... existing code ...

def check_rsi_alert(symbol):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # We need at least 15 points to calculate a 14-period RSI
    cursor.execute('''
        SELECT price FROM prices 
        WHERE symbol = ? 
        ORDER BY timestamp DESC 
        LIMIT 15
    ''', (symbol,))
    
    rows = cursor.fetchall()
    conn.close()
    
    # Not enough data yet?
    if len(rows) < 15:
        return None, f"Gathering data ({len(rows)}/15)"

    # Reverse rows so we have oldest -> newest
    prices = [row[0] for row in rows][::-1]
    
    # 1. Calculate price changes (deltas)
    gains = []
    losses = []
    
    for i in range(1, len(prices)):
        delta = prices[i] - prices[i-1]
        if delta > 0:
            gains.append(delta)
            losses.append(0)
        else:
            gains.append(0)
            losses.append(abs(delta))

    # 2. Calculate Average Gain and Average Loss
    avg_gain = sum(gains) / len(gains)
    avg_loss = sum(losses) / len(losses)
    
    # 3. Handle division by zero (if price never went down)
    if avg_loss == 0:
        return 100, "RSI: 100 (Max Bullish)"

    # 4. Calculate RS and RSI
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    # 5. Determine Alert
    formatted_rsi = f"{rsi:.1f}"
    
    if rsi < oversold_threshold:
        return True, f"🟢 BUY SIGNAL! RSI is {formatted_rsi} (Oversold)"
    elif rsi > overbought_threshold:
        return True, f"🔴 SELL SIGNAL! RSI is {formatted_rsi} (Overbought)"
    
    return False, f"RSI is {formatted_rsi} (Neutral)"
