"use client";

import { useState } from 'react';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { createWalletClient, custom, publicActions } from 'viem';
import { Search, Wallet, Loader2, LogOut, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import TokenDashboard, { TokenData } from '@/components/TokenDashboard';
import ChartBackground from '@/components/ChartBackground';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x57C1B200f33f6992250eeC6bC49950d900097Cd5";

// Note: ABI is no longer required because genlayer-js handles GenLayer Simulator interactions dynamically!

// Framer Motion Variants for Futuristic Text
const containerVariants: import("framer-motion").Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const itemVariants: import("framer-motion").Variants = {
  hidden: { y: 30, opacity: 0, filter: "blur(10px)" },
  visible: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export default function Home() {
  const [wallet, setWallet] = useState<any>(null);
  const [address, setAddress] = useState<string>('');
  const [ticker, setTicker] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [error, setError] = useState<string>('');

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const walletClient = createWalletClient({
          transport: custom((window as any).ethereum)
        }).extend(publicActions);
        
        const [account] = await walletClient.requestAddresses();
        
        // Auto-switch to Genlayer Studionet
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xf22f' }], // 61999 in hex
          });
        } catch (switchError: any) {
          if (switchError.code === 4902 || switchError.code === -32603) {
            try {
              await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xf22f',
                  chainName: 'Genlayer Studio',
                  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
                  rpcUrls: ['https://studio.genlayer.com/api'],
                }]
              });
            } catch (addError) {
              console.error('Failed to add Genlayer Studio:', addError);
            }
          }
        }

        setWallet(walletClient);
        setAddress(account);
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      setError("Please install MetaMask or another EVM wallet.");
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    setAddress('');
  };

  const analyzeToken = async () => {
    if (!wallet || !address) {
      setError("Please connect your wallet first.");
      return;
    }
    if (!ticker) {
      setError("Please enter a cryptocurrency ticker.");
      return;
    }

    setLoading(true);
    setAiLoading(false);
    setError('');
    setTokenData(null);

    try {
      // ─── STEP 1: Fetch live market data from CoinGecko immediately ───────────
      // This is instant and always accurate for ALL 10,000+ coins on CoinGecko.
      const res = await fetch(`/api/price?ticker=${ticker}`);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Could not find "${ticker}" on CoinGecko. Please check the ticker and try again. (${errText})`);
      }
      const cgData = await res.json();

      // Build a complete TokenData object from CoinGecko right now.
      // AI fields get placeholder values that will be filled in shortly.
      const immediateData: TokenData = {
        logo_url:                  cgData.logo_url || '',
        name:                      cgData.name || ticker,
        ticker:                    cgData.symbol || ticker.toUpperCase(),
        price_usd:                 Number(cgData.priceUsd),
        market_cap_usd:            Number(cgData.marketCapUsd),
        volume_24h_usd:            Number(cgData.volumeUsd),
        price_change_24h_percent:  Number(cgData.changePercent),
        ath_usd:                   Number(cgData.athUsd),
        ath_date:                  cgData.athDate || '',
        atl_usd:                   Number(cgData.atlUsd),
        atl_date:                  cgData.atlDate || '',
        launch_date:               '',
        circulating_supply:        Number(cgData.circulatingSupply),
        max_supply:                cgData.maxSupply != null ? Number(cgData.maxSupply) : null,
        fdv_usd:                   Number(cgData.fdvUsd),
        market_cap_rank:           Number(cgData.marketCapRank),
        blockchain:                '',
        official_website:          '',
        whitepaper:                '',
        liquidity_usd:             null,
        risk_score:                0,
        ai_summary:                'Fetching AI analysis from GenLayer validators...',
        bullish_bearish:           'Neutral',
        community_sentiment:       'Loading...',
        developer_activity:        'Loading...',
        latest_news:               'Fetching latest news...',
      };

      // ─── STEP 2: Show prices IMMEDIATELY — no waiting for AI ─────────────────
      setTokenData(immediateData);
      setLoading(false);   // Stop the initial spinner — user sees prices now!
      setAiLoading(true);  // Show a subtle AI-loading badge on the dashboard

      // ─── STEP 3: Run GenLayer AI analysis in the background ──────────────────
      // This enriches the AI fields (summary, sentiment, news, risk score, website)
      // without blocking the user from seeing correct prices.
      try {
        const liveMarketData = `Live Price: $${Number(cgData.priceUsd).toFixed(6)}, Market Cap: $${Number(cgData.marketCapUsd).toFixed(0)}, 24h Volume: $${Number(cgData.volumeUsd).toFixed(0)}, 24h Change: ${Number(cgData.changePercent).toFixed(2)}%, Rank: #${cgData.marketCapRank}`;

        const client = createClient({
          chain: studionet,
          account: address as `0x${string}`,
          provider: (window as any).ethereum,
        });

        // Snapshot the old cached value so we can detect when a fresh result arrives
        let previousDataString = "{}";
        try {
          previousDataString = await client.readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            functionName: 'get_token_analysis',
            args: [ticker]
          }) as string || "{}";
        } catch (_) {}

        const hash = await client.writeContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          functionName: 'analyze_token',
          args: [ticker, liveMarketData],
          value: BigInt(0),
        });

        try {
          const receipt = await client.waitForTransactionReceipt({ hash });
          if (String(receipt.status) === 'reverted' || receipt.status === 0) throw new Error('reverted');
        } catch (err: any) {
          if (err.message?.toLowerCase().includes('revert')) throw err;
        }

        // Poll until we get a genuinely new result from the validators
        let dataString: any = "{}";
        let attempts = 0;
        while (attempts < 150) {
          try {
            dataString = await client.readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              functionName: 'get_token_analysis',
              args: [ticker]
            });
            const hasData = dataString && dataString !== "{}" && dataString.length > 10;
            const isNew   = dataString !== previousDataString;
            if (hasData && isNew) break;
          } catch (_) {}
          attempts++;
          await new Promise(r => setTimeout(r, 2000));
        }

        if (dataString && dataString !== "{}" && dataString.length > 10) {
          const aiData = JSON.parse(dataString as string);
          // Merge: keep CoinGecko numbers, take only AI text fields
          setTokenData(prev => prev ? {
            ...prev,
            blockchain:          aiData.blockchain          || prev.blockchain,
            official_website:    aiData.official_website    || prev.official_website,
            whitepaper:          aiData.whitepaper          || prev.whitepaper,
            launch_date:         aiData.launch_date         || prev.launch_date,
            risk_score:          aiData.risk_score          || prev.risk_score,
            ai_summary:          aiData.ai_summary          || prev.ai_summary,
            bullish_bearish:     aiData.bullish_bearish     || prev.bullish_bearish,
            community_sentiment: aiData.community_sentiment || prev.community_sentiment,
            developer_activity:  aiData.developer_activity  || prev.developer_activity,
            latest_news:         aiData.latest_news         || prev.latest_news,
          } : prev);
        }
      } catch (aiErr: any) {
        // AI enrichment failed — that's OK, user already sees correct prices!
        console.warn("GenLayer AI enrichment failed:", aiErr);
        setTokenData(prev => prev ? {
          ...prev,
          ai_summary: 'AI analysis unavailable at this time. Price data above is accurate.',
          community_sentiment: 'N/A',
          developer_activity: 'N/A',
          latest_news: 'N/A',
        } : prev);
      } finally {
        setAiLoading(false);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.shortMessage || err.message || "An error occurred during analysis.");
      setLoading(false);
    }
  };

  return (
    <main className="w-full relative min-h-screen pb-4 md:pb-8 flex flex-col items-center overflow-x-hidden">
      <ChartBackground />
      
      {/* Navbar */}
      <nav className="w-full flex justify-between items-center mb-10 glass-panel px-4 md:px-10 py-3 md:py-2 z-20 sticky top-0 border-t-0 border-x-0 rounded-none bg-black/40 backdrop-blur-3xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: 'var(--font-syncopate)' }} className="text-sm sm:text-base md:text-xl font-black tracking-wider md:tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-slate-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            TokenIntel
          </span>
        </div>
        
        {address ? (
          <div className="flex items-center gap-2 md:gap-3">
            <div className="glass-panel px-3 py-1.5 md:py-2 rounded-full font-medium flex items-center gap-2 border-emerald-500/30 text-emerald-100 text-[10px] sm:text-xs md:text-sm">
              <Wallet size={14} className="text-emerald-400 hidden sm:block" />
              {`${address.substring(0, 4)}...${address.substring(38)}`}
            </div>
            <button 
              onClick={disconnectWallet}
              className="glass-btn px-2 md:px-3 py-1.5 md:py-2 rounded-full font-medium flex items-center gap-2 hover:bg-rose-500/20 text-rose-200 text-xs md:text-sm"
              title="Disconnect Wallet"
            >
              <LogOut size={14} />
              <span className="hidden sm:block">Disconnect</span>
            </button>
          </div>
        ) : (
          <button 
            onClick={connectWallet}
            className="glass-btn px-3 md:px-5 py-2 md:py-2.5 rounded-full font-bold flex items-center gap-1.5 md:gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] text-xs md:text-sm"
          >
            <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Connect Wallet</span>
            <span className="sm:hidden">Connect</span>
          </button>
        )}
      </nav>

      {/* Hero Section */}
      <motion.div 
        className="w-full max-w-4xl px-4 flex flex-col items-center text-center space-y-8 mt-2 md:mt-8 z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-indigo-500/30 text-indigo-300 text-sm font-semibold tracking-wide uppercase mb-6 -mt-8">
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Genlayer Studio Network Live
        </motion.div>

        <motion.h1 
          variants={itemVariants} 
          style={{ fontFamily: 'var(--font-orbitron)' }}
          className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-tight"
        >
          Decentralized <br/>
          <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-indigo-400 to-purple-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.4)]">
            Token Intelligence
          </span>
        </motion.h1>

        <motion.p 
          variants={itemVariants} 
          className="text-lg md:text-xl text-slate-300 max-w-2xl font-light leading-relaxed"
        >
          Powered by <strong className="text-white font-semibold">Genlayer</strong>. Input any token ticker, and our AI validators will fetch, analyze, and reach consensus on its real-time market data, sentiment, and risks.
        </motion.p>

        {/* Input Controls */}
        <motion.div variants={itemVariants} className="w-full max-w-2xl space-y-4 pt-6">
          <div className="relative flex items-center group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <Search className="absolute left-3 md:left-5 text-indigo-300 z-10 w-4 h-4 md:w-5 md:h-5" />
            <input 
              type="text" 
              placeholder="ENTER TOKEN (E.G. BTC)" 
              className="w-full relative z-10 bg-black/40 backdrop-blur-xl border-2 border-white/10 py-2.5 md:py-3 pl-9 md:pl-12 pr-28 md:pr-36 rounded-full text-sm md:text-lg uppercase text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-black/60 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] font-bold tracking-wider"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && analyzeToken()}
            />
            <button 
              onClick={analyzeToken}
              disabled={loading || !ticker}
              className="absolute z-20 right-1.5 top-1.5 bottom-1.5 glass-btn px-4 md:px-6 rounded-full font-bold flex items-center gap-1.5 md:gap-2 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all text-xs md:text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span className="hidden sm:inline">SYNCING</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">ANALYZE</span>
                  <span className="sm:hidden">GO</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm backdrop-blur-md font-mono"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </motion.div>

      {/* Dashboard Result */}
      {tokenData && (
        <div className="w-full z-20 mt-12 mb-20 relative px-4">
          <TokenDashboard data={tokenData} />
        </div>
      )}

    </main>
  );
}
