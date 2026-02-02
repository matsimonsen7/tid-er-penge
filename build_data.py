#!/usr/bin/env python3
"""
Fetch historical stock data and generate JSON files for FirstInvestor.
Run weekly via GitHub Actions to keep data fresh.
"""

import json
from datetime import datetime, timedelta
from pathlib import Path

import yfinance as yf

TICKERS = [
    # Market index
    '^GSPC',
    # Danish stocks (5yr positive)
    'NOVO-B.CO',
    'MAERSK-B.CO',
    'DSV.CO',
    'CARL-B.CO',
    'DANSKE.CO',
    # Big tech / online
    'AAPL',
    'AMZN',
    'GOOGL',
    'META',
    'NFLX',
    'MSFT',
    # Meme stocks (5yr positive)
    'GME',
    'TSLA',
    'NVDA',
]
NAMES = {
    # Market
    '^GSPC': 'S&P 500',
    # Danish
    'NOVO-B.CO': 'Novo Nordisk',
    'MAERSK-B.CO': 'Mærsk',
    'DSV.CO': 'DSV',
    'CARL-B.CO': 'Carlsberg',
    'DANSKE.CO': 'Danske Bank',
    # Big tech
    'AAPL': 'Apple',
    'AMZN': 'Amazon',
    'GOOGL': 'Google',
    'META': 'Meta',
    'NFLX': 'Netflix',
    'MSFT': 'Microsoft',
    # Meme
    'GME': 'GameStop',
    'TSLA': 'Tesla',
    'NVDA': 'NVIDIA',
}

OUTPUT_DIR = Path(__file__).parent / 'public' / 'data'


def sample_weekly(prices: list) -> list:
    """Sample to weekly data to reduce file size."""
    if len(prices) <= 1100:
        return prices
    sampled = []
    for i, p in enumerate(prices):
        if i % 5 == 0 or i == len(prices) - 1:
            sampled.append(p)
    return sampled


def fetch_stock_data(ticker: str, years: int = 25) -> dict:
    """Fetch historical data for a ticker."""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=years * 365)

    stock = yf.Ticker(ticker)
    hist = stock.history(start=start_date, end=end_date)

    if hist.empty:
        raise ValueError(f"No data found for {ticker}")

    prices = [
        {'date': date.strftime('%Y-%m-%d'), 'close': round(row['Close'], 2)}
        for date, row in hist.iterrows()
    ]

    prices = sample_weekly(prices)

    return {
        'ticker': ticker,
        'name': NAMES.get(ticker, ticker),
        'prices': prices,
        'updated': datetime.now().isoformat(),
    }


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    index = []

    for ticker in TICKERS:
        print(f"Fetching {ticker}...")
        try:
            data = fetch_stock_data(ticker)
            output_file = OUTPUT_DIR / f'{ticker}.json'
            output_file.write_text(json.dumps(data, separators=(',', ':')))

            index.append({
                'ticker': ticker,
                'name': NAMES.get(ticker, ticker),
                'dataPoints': len(data['prices']),
            })

            print(f"  -> {len(data['prices'])} data points saved")
        except Exception as e:
            print(f"  -> Error: {e}")

    index_file = OUTPUT_DIR / 'index.json'
    index_file.write_text(json.dumps(index, indent=2))
    print(f"\nIndex saved with {len(index)} stocks")


if __name__ == '__main__':
    main()
