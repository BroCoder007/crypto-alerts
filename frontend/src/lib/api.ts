const API_URL = 'http://localhost:8000'; // FastAPI Backend

export interface CryptoStats {
    price: number;
    rsi: number;
    status: string;
    timestamp: string;
    symbol?: string;
}

export interface PricePoint {
    timestamp: string;
    price: number;
    symbol?: string; // Optional, present when fetching ALL
}

export async function getStats(symbol: string = 'BTC'): Promise<CryptoStats> {
    const res = await fetch(`${API_URL}/stats?symbol=${symbol}`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}

export async function getHistory(symbol: string = 'BTC'): Promise<PricePoint[]> {
    const res = await fetch(`${API_URL}/history?symbol=${symbol}`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
}
