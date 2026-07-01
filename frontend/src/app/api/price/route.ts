import { NextResponse } from 'next/server';

// Pre-built ticker → CoinGecko ID map for the top 200 coins.
// This skips the search step entirely for these coins, halving API usage and preventing rate limits.
const KNOWN_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', USDT: 'tether', BNB: 'binancecoin',
  SOL: 'solana', USDC: 'usd-coin', XRP: 'ripple', DOGE: 'dogecoin',
  TRX: 'tron', TON: 'the-open-network', ADA: 'cardano', AVAX: 'avalanche-2',
  SHIB: 'shiba-inu', WBTC: 'wrapped-bitcoin', DOT: 'polkadot', LINK: 'chainlink',
  BCH: 'bitcoin-cash', NEAR: 'near', UNI: 'uniswap', MATIC: 'matic-network',
  LTC: 'litecoin', DAI: 'dai', ICP: 'internet-computer', ETC: 'ethereum-classic',
  APT: 'aptos', HBAR: 'hedera-hashgraph', FIL: 'filecoin', CRO: 'crypto-com-chain',
  ARB: 'arbitrum', ATOM: 'cosmos', OP: 'optimism', ALGO: 'algorand',
  VET: 'vechain', MANA: 'decentraland', SAND: 'the-sandbox', AXS: 'axie-infinity',
  XLM: 'stellar', THETA: 'theta-token', FTM: 'fantom', EOS: 'eos',
  AAVE: 'aave', GRT: 'the-graph', EGLD: 'elrond-erd-2', XTZ: 'tezos',
  FLOW: 'flow', XMR: 'monero', RUNE: 'thorchain', FTT: 'ftx-token',
  KCS: 'kucoin-shares', MKR: 'maker', COMP: 'compound-governance-token',
  SNX: 'havven', ZEC: 'zcash', BAT: 'basic-attention-token', ENJ: 'enjincoin',
  CHZ: 'chiliz', HOT: 'holotoken', ZIL: 'zilliqa', WAVES: 'waves',
  DASH: 'dash', CELO: 'celo', NEO: 'neo', IOTA: 'iota',
  PEPE: 'pepe', WIF: 'dogwifcoin', FLOKI: 'floki', BONK: 'bonk',
  NOT: 'notcoin', BRETT: 'brett', POPCAT: 'popcat', WLD: 'worldcoin-wld',
  SEI: 'sei-network', SUI: 'sui', INJ: 'injective-protocol', TIA: 'celestia',
  JUP: 'jupiter-exchange-solana', PYTH: 'pyth-network', JTO: 'jito-governance-token',
  RENDER: 'render-token', LDO: 'lido-dao', RPL: 'rocket-pool',
  IMX: 'immutable-x', BLUR: 'blur', BEAM: 'beam-2', MEME: 'memecoin-2',
  CFX: 'conflux-token', KAVA: 'kava', GALA: 'gala', GMT: 'stepn',
  APE: 'apecoin', CRV: 'curve-dao-token', CVX: 'convex-finance',
  SUSHI: 'sushi', '1INCH': '1inch', CAKE: 'pancakeswap-token',
  QNT: 'quant-network', ROSE: 'oasis-network', AGIX: 'singularitynet',
  FET: 'fetch-ai', RNDR: 'render-token', STX: 'blockstack',
  MINA: 'mina-protocol', GNO: 'gnosis', ENS: 'ethereum-name-service',
  LRC: 'loopring', DYDX: 'dydx', OSMO: 'osmosis',
};

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (res.status === 429) {
      // Rate limited — wait then retry
      await new Promise(r => setTimeout(r, 1200 * (i + 1)));
      continue;
    }
    return res;
  }
  throw new Error(`CoinGecko rate limited after ${retries} retries`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker')?.trim();

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  const upperTicker = ticker.toUpperCase();

  try {
    // Step 1: Resolve to CoinGecko ID (use cache first to save API calls)
    let coinId: string | null = KNOWN_IDS[upperTicker] || null;

    if (!coinId) {
      // Not in cache — search CoinGecko
      const searchRes = await fetchWithRetry(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(ticker)}`
      );
      if (!searchRes.ok) {
        return NextResponse.json({ error: `CoinGecko search failed: ${searchRes.status}` }, { status: 502 });
      }
      const searchData = await searchRes.json();
      if (!searchData.coins || searchData.coins.length === 0) {
        return NextResponse.json({ error: `Coin "${ticker}" not found` }, { status: 404 });
      }
      // Prefer exact symbol/name match; fall back to first result
      const exact = searchData.coins.find((c: any) =>
        c.symbol.toUpperCase() === upperTicker || c.name.toUpperCase() === upperTicker
      ) || searchData.coins[0];
      coinId = exact.id;
    }

    // Step 2: Fetch full market data
    const marketRes = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}&sparkline=false`
    );
    if (!marketRes.ok) {
      return NextResponse.json({ error: `CoinGecko market data failed: ${marketRes.status}` }, { status: 502 });
    }
    const marketData = await marketRes.json();
    if (!marketData || marketData.length === 0) {
      return NextResponse.json({ error: 'No market data returned' }, { status: 404 });
    }

    const coin = marketData[0];

    return NextResponse.json({
      coinId:            coin.id,
      name:              coin.name,
      symbol:            coin.symbol.toUpperCase(),
      logo_url:          coin.image,
      priceUsd:          coin.current_price,
      marketCapUsd:      coin.market_cap,
      volumeUsd:         coin.total_volume,
      changePercent:     coin.price_change_percentage_24h,
      athUsd:            coin.ath,
      athDate:           coin.ath_date ? coin.ath_date.split('T')[0] : null,
      atlUsd:            coin.atl,
      atlDate:           coin.atl_date ? coin.atl_date.split('T')[0] : null,
      circulatingSupply: coin.circulating_supply,
      maxSupply:         coin.max_supply,
      fdvUsd:            coin.fully_diluted_valuation,
      marketCapRank:     coin.market_cap_rank,
    });

  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
