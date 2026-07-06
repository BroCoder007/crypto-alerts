import streamlit as st
import sqlite3
import pandas as pd
import time

# Page Config
st.set_page_config(page_title="Crypto Command Center", layout="wide")
st.title("₿ Bitcoin Live Monitor")

# Function to load data from the database
def load_data():
    conn = sqlite3.connect('crypto_data.db')
    # Load data into a Pandas DataFrame
    df = pd.read_sql_query("SELECT * FROM prices ORDER BY timestamp DESC LIMIT 100", conn)
    conn.close()
    
    # Sort by time (oldest to newest) for proper charting
    df = df.sort_values(by='timestamp')
    return df

# Function to calculate RSI for the chart
def calculate_rsi(df, period=14):
    delta = df['price'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    
    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))
    return df

# --- THE MAIN LOOP ---
placeholder = st.empty()

while True:
    with placeholder.container():
        # 1. Get fresh data
        df = load_data()
        
        if not df.empty:
            # 2. Calculate Stats
            current_price = df.iloc[-1]['price']
            
            # Calculate RSI
            df = calculate_rsi(df)
            current_rsi = df.iloc[-1]['rsi']
            
            # 3. Display Metrics (Big Numbers at the top)
            col1, col2, col3 = st.columns(3)
            col1.metric("Current Price", f"${current_price:,.2f}")
            col2.metric("RSI (14)", f"{current_rsi:.1f}")
            
            # Logic Display
            status = "NEUTRAL"
            color = "gray"
            if current_rsi < 30:
                status = "OVERSOLD (BUY)"
                color = "green"
            elif current_rsi > 70:
                status = "OVERBOUGHT (SELL)"
                color = "red"
            
            col3.markdown(f"**Signal:** :{color}[{status}]")

            # 4. Draw Charts
            st.markdown("### Price History")
            st.line_chart(df.set_index('timestamp')['price'])
            
            st.markdown("### RSI Trend")
            # Draw a line chart for RSI with reference lines
            st.line_chart(df.set_index('timestamp')['rsi'])
            
        else:
            st.warning("Waiting for data... Make sure main_script.py is running!")

    # Refresh the dashboard every 2 seconds
    time.sleep(2)