import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }
  
  ticker = ticker.trim();
  const upperTicker = ticker.toUpperCase();

  let priceUsd = null;
  let volumeUsd = null;
  let changePercent = null;

  // 1. Try Mexc Global (Extremely fast, lists 99% of all tokens including meme coins, no rate limits)
  // Mexc requires the exact ticker (e.g. BTCUSDT, NOTUSDT, PEPEUSDT)
  if (upperTicker.length <= 8) {
    try {
      const mexcRes = await fetch(`https://api.mexc.com/api/v3/ticker/24hr?symbol=${upperTicker}USDT`, { next: { revalidate: 10 } });
      if (mexcRes.ok) {
        const mexcData = await mexcRes.json();
        if (mexcData && mexcData.lastPrice) {
          priceUsd = Number(mexcData.lastPrice);
          volumeUsd = Number(mexcData.quoteVolume || 0);
          changePercent = Number(mexcData.priceChangePercent || 0) * 100;
        }
      }
    } catch (e) {
      console.warn("Mexc fetch failed:", e);
    }
  }

  // 2. Try CoinCap (Great for when the user searches full names like 'Dogecoin', 'Bitcoin', 'Solana')
  if (priceUsd === null) {
    try {
      const coinCapResponse = await fetch(`https://api.coincap.io/v2/assets?search=${ticker}&limit=5`, { next: { revalidate: 10 } });
      if (coinCapResponse.ok) {
        const text = await coinCapResponse.text();
        try {
          const coinCapData = JSON.parse(text);
          const exactMatch = coinCapData.data?.find((a: any) => 
            a.symbol.toUpperCase() === upperTicker || 
            a.name.toUpperCase() === upperTicker ||
            a.id.toUpperCase() === upperTicker
          );
          if (exactMatch) {
            priceUsd = Number(exactMatch.priceUsd);
            volumeUsd = Number(exactMatch.volumeUsd24Hr);
            changePercent = Number(exactMatch.changePercent24Hr);
          }
        } catch (parseError) {
          console.warn("CoinCap returned non-JSON. Probably Cloudflare block.");
        }
      }
    } catch (e) {
      console.warn("CoinCap fetch failed:", e);
    }
  }

  // 3. Try DexScreener (Absolute final fallback for brand-new decentralized meme coins)
  if (priceUsd === null) {
    try {
      const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${ticker}`, { next: { revalidate: 10 } });
      if (dexResponse.ok) {
        const text = await dexResponse.text();
        try {
          const dexData = JSON.parse(text);
          if (dexData.pairs && dexData.pairs.length > 0) {
            // Filter out pairs with virtually zero liquidity to prevent scam tokens from overriding
            const validPairs = dexData.pairs.filter((p: any) => (p.liquidity?.usd || 0) > 1000);
            if (validPairs.length > 0) {
              const pair = validPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
              priceUsd = Number(pair.priceUsd);
              volumeUsd = Number(pair.volume?.h24 || 0);
              changePercent = Number(pair.priceChange?.h24 || 0);
            }
          }
        } catch (parseError) {
          console.warn("DexScreener returned non-JSON.");
        }
      }
    } catch (e) {
      console.warn("DexScreener fetch failed:", e);
    }
  }

  if (priceUsd !== null) {
    return NextResponse.json({ priceUsd, volumeUsd, changePercent });
  } else {
    return NextResponse.json({ error: 'Coin not found or APIs failed' }, { status: 404 });
  }
}
