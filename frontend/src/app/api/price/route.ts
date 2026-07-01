import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }
  
  ticker = ticker.trim();

  try {
    // Step 1: Search CoinGecko to resolve the ticker/name to a CoinGecko ID
    const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(ticker)}`, { next: { revalidate: 30 } });
    
    if (!searchRes.ok) {
      return NextResponse.json({ error: `CoinGecko search failed: ${searchRes.status}` }, { status: 500 });
    }
    
    const searchData = await searchRes.json();
    
    if (!searchData.coins || searchData.coins.length === 0) {
      return NextResponse.json({ error: 'Coin not found on CoinGecko' }, { status: 404 });
    }

    // Find exact symbol or name match first, then fall back to first result
    const upperTicker = ticker.toUpperCase();
    const exactMatch = searchData.coins.find((c: any) =>
      c.symbol.toUpperCase() === upperTicker ||
      c.name.toUpperCase() === upperTicker
    ) || searchData.coins[0];

    const coinId = exactMatch.id;

    // Step 2: Fetch full market data for that exact coin
    const marketRes = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}&sparkline=false`,
      { next: { revalidate: 30 } }
    );

    if (!marketRes.ok) {
      return NextResponse.json({ error: `CoinGecko market data failed: ${marketRes.status}` }, { status: 500 });
    }

    const marketData = await marketRes.json();

    if (!marketData || marketData.length === 0) {
      return NextResponse.json({ error: 'No market data returned' }, { status: 404 });
    }

    const coin = marketData[0];

    // Return comprehensive data covering ALL fields the UI needs
    return NextResponse.json({
      coinId: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      logo_url: coin.image,
      priceUsd: coin.current_price,
      marketCapUsd: coin.market_cap,
      volumeUsd: coin.total_volume,
      changePercent: coin.price_change_percentage_24h,
      athUsd: coin.ath,
      athDate: coin.ath_date ? coin.ath_date.split('T')[0] : null,
      atlUsd: coin.atl,
      atlDate: coin.atl_date ? coin.atl_date.split('T')[0] : null,
      circulatingSupply: coin.circulating_supply,
      maxSupply: coin.max_supply,
      fdvUsd: coin.fully_diluted_valuation,
      marketCapRank: coin.market_cap_rank,
    });

  } catch (error: any) {
    console.error("API route error:", error);
    return NextResponse.json({ error: `Failed to fetch data: ${error.message}` }, { status: 500 });
  }
}
