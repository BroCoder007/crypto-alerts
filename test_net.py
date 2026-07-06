import requests

targets = [
    ("Bing", "https://www.bing.com"),
    ("CoinDesk", "https://api.coindesk.com/v1/bpi/currentprice.json"),
    ("CryptoCompare", "https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD"),
    ("Binance", "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")
]

for name, url in targets:
    try:
        print(f"Testing {name}...")
        r = requests.get(url, timeout=5)
        print(f"{name}: {r.status_code}")
    except Exception as e:
        print(f"{name} Failed: {e}")
