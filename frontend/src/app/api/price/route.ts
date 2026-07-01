import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  let priceUsd = null;
  let volumeUsd = null;
  let changePercent = null;

  try {
    const coinCapResponse = await fetch(`https://api.coincap.io/v2/assets?search=${ticker}&limit=5`, { next: { revalidate: 10 } });
    const coinCapData = await coinCapResponse.json();
    
    const exactMatch = coinCapData.data?.find((a: any) => 
      a.symbol.toUpperCase() === ticker.toUpperCase() || 
      a.name.toUpperCase() === ticker.toUpperCase() ||
      a.id.toUpperCase() === ticker.toUpperCase()
    );
    
    if (exactMatch) {
      priceUsd = Number(exactMatch.priceUsd);
      volumeUsd = Number(exactMatch.volumeUsd24Hr);
      changePercent = Number(exactMatch.changePercent24Hr);
    } else {
      const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${ticker}`, { next: { revalidate: 10 } });
      const dexData = await dexResponse.json();
      if (dexData.pairs && dexData.pairs.length > 0) {
        const pair = dexData.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
        priceUsd = Number(pair.priceUsd);
        volumeUsd = Number(pair.volume?.h24 || 0);
        changePercent = Number(pair.priceChange?.h24 || 0);
      }
    }

    if (priceUsd !== null) {
      return NextResponse.json({ priceUsd, volumeUsd, changePercent });
    } else {
      return NextResponse.json({ error: 'Coin not found' }, { status: 404 });
    }
  } catch (error) {
    console.error("API route fetch error:", error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
