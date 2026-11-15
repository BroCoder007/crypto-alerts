import requests
import os
import time
import sys
import db_manager  # This imports your database file

# Force UTF-8 encoding for Windows console
sys.stdout.reconfigure(encoding='utf-8')

# --- CONFIGURATION ---
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")
COINS = {
    "BTC": "BTC",
    "ETH": "ETH",
    "SOL": "SOL",
    "DOGE": "DOGE"
}
CHECK_INTERVAL = 60

# --- FUNCTIONS ---

def get_crypto_price(symbol):
    # Using CryptoCompare
    url = f"https://min-api.cryptocompare.com/data/price?fsym={symbol}&tsyms=USD"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('USD')
        else:
            print(f"Error fetching price for {symbol}: Status {response.status_code}")
            return None
    except Exception as e:
        print(f"Connection error: {e}")
        return None

def send_telegram_alert(message):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("Telegram is not configured; alert delivery is disabled.")
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message
    }
    try:
        requests.post(url, json=payload)
    except Exception as e:
        print(f"Failed to send alert: {e}")

# --- MAIN LOOP ---

def main():
    print(f"Starting Crypto Tracker for {', '.join(COINS.keys())}...")
    
    # STEP 1: Initialize the Database (Runs once at startup)
    db_manager.init_db()
    print("Database connected. Monitoring started.")

    while True:
        for symbol, mapped_id in COINS.items():
            # STEP 2: Fetch current price
            price = get_crypto_price(symbol)
            
            if price:
                print(f"[{time.strftime('%H:%M:%S')}] {symbol}: ${price}")

                # STEP 3: Save to Database
                db_manager.log_price(symbol, price)

                # STEP 4: Check Logic (RSI)
                should_alert, msg = db_manager.check_rsi_alert(symbol)
                
                # If function returns None (collecting data), we just print the status
                if should_alert is None:
                    print(f"   {symbol} Status: {msg}")
                    
                # If we get a True/False signal
                elif should_alert:
                    print(f"!!! {symbol} TRIGGER: {msg}")
                    send_telegram_alert(f"{symbol}: {msg}")
                else:
                    print(f"   {symbol} Status: {msg}")

        # Sleep to respect API rate limits
        print("-" * 30)
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()
