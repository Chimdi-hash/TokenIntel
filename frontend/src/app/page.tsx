"use client";

import { useState } from 'react';
import { createWalletClient, custom, publicActions } from 'viem';
import { Search, Wallet, Loader2, LogOut, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import TokenDashboard, { TokenData } from '@/components/TokenDashboard';
import ChartBackground from '@/components/ChartBackground';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

const abi = [
  {
    "inputs": [{"name": "ticker", "type": "string"}],
    "name": "analyze_token",
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "ticker", "type": "string"}],
    "name": "get_token_analysis",
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
];

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
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [error, setError] = useState<string>('');

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const walletClient = createWalletClient({
          transport: custom((window as any).ethereum)
        }).extend(publicActions);
        
        const [account] = await walletClient.requestAddresses();
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
    setError('');
    setTokenData(null);

    try {
      const { request } = await wallet.simulateContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'analyze_token',
        args: [ticker],
        account: address
      });

      const hash = await wallet.writeContract(request);
      await wallet.waitForTransactionReceipt({ hash });

      const dataString = await wallet.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi,
        functionName: 'get_token_analysis',
        args: [ticker]
      });

      if (!dataString || dataString === "{}") {
        throw new Error("No data returned from validators.");
      }

      const parsedData: TokenData = JSON.parse(dataString as string);
      setTokenData(parsedData);

    } catch (err: any) {
      console.error(err);
      setError(err.shortMessage || err.message || "An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen px-4 pb-4 md:px-8 md:pb-8 flex flex-col items-center overflow-x-hidden">
      <ChartBackground />
      
      {/* Navbar */}
      <nav className="w-full flex justify-between items-center mb-10 glass-panel px-6 md:px-10 py-2 z-20 sticky top-0 border-t-0 border-x-0 rounded-none bg-black/20 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-white/20">
            T
          </div>
          <span className="text-lg font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 hidden sm:block">
            TokenIntel
          </span>
        </div>
        
        {address ? (
          <div className="flex items-center gap-2 md:gap-3">
            <div className="glass-panel px-3 py-1.5 rounded-full font-medium flex items-center gap-2 border-emerald-500/30 text-emerald-100 text-xs md:text-sm">
              <Wallet size={14} className="text-emerald-400 hidden sm:block" />
              {`${address.substring(0, 4)}...${address.substring(38)}`}
            </div>
            <button 
              onClick={disconnectWallet}
              className="glass-btn px-3 py-1.5 rounded-full font-medium flex items-center gap-2 hover:bg-rose-500/20 text-rose-200 text-xs md:text-sm"
              title="Disconnect Wallet"
            >
              <LogOut size={14} />
              <span className="hidden sm:block">Disconnect</span>
            </button>
          </div>
        ) : (
          <button 
            onClick={connectWallet}
            className="glass-btn px-4 md:px-5 py-1.5 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] text-sm"
          >
            <Wallet size={16} />
            Connect Wallet
          </button>
        )}
      </nav>

      {/* Hero Section */}
      <motion.div 
        className="w-full max-w-4xl flex flex-col items-center text-center space-y-8 mt-2 md:mt-8 z-10"
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
          className="font-orbitron text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-tight"
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
            <Search className="absolute left-5 text-indigo-300 z-10" size={20} />
            <input 
              type="text" 
              placeholder="ENTER TOKEN TICKER (e.g. BTC)" 
              className="w-full relative z-10 bg-black/40 backdrop-blur-xl border-2 border-white/10 py-3 pl-12 pr-36 rounded-full text-lg uppercase text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-black/60 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] font-bold tracking-wider"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && analyzeToken()}
            />
            <button 
              onClick={analyzeToken}
              disabled={loading || !ticker}
              className="absolute z-20 right-1.5 top-1.5 bottom-1.5 glass-btn px-6 rounded-full font-bold flex items-center gap-2 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>SYNCING</span>
                </>
              ) : (
                <>
                  <span>ANALYZE</span>
                  <ChevronRight size={18} />
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
        <div className="w-full z-20 mt-12 mb-20 relative">
          <TokenDashboard data={tokenData} />
        </div>
      )}

    </main>
  );
}
