"use client";

import { useState } from 'react';
import { createWalletClient, custom, publicActions, getContract } from 'viem';
import { Search, Wallet, Link, Loader2 } from 'lucide-react';
import TokenDashboard, { TokenData } from '@/components/TokenDashboard';

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

export default function Home() {
  const [wallet, setWallet] = useState<any>(null);
  const [address, setAddress] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string>('');
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

  const analyzeToken = async () => {
    if (!wallet || !address) {
      setError("Please connect your wallet first.");
      return;
    }
    if (!contractAddress) {
      setError("Please enter the deployed contract address.");
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
      // 1. Submit the transaction to analyze the token (consensus generation)
      const { request } = await wallet.simulateContract({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: 'analyze_token',
        args: [ticker],
        account: address
      });

      const hash = await wallet.writeContract(request);
      
      // Wait for transaction receipt
      await wallet.waitForTransactionReceipt({ hash });

      // 2. Fetch the analyzed data (JSON string)
      const dataString = await wallet.readContract({
        address: contractAddress as `0x${string}`,
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
    <main className="min-h-screen p-8 flex flex-col items-center">
      {/* Navbar */}
      <nav className="w-full max-w-6xl flex justify-between items-center mb-16 glass-panel px-6 py-4 rounded-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/30">
            T
          </div>
          <span className="text-xl font-bold tracking-wide">TokenIntel</span>
        </div>
        <button 
          onClick={connectWallet}
          className="glass-btn px-6 py-2 rounded-full font-medium flex items-center gap-2"
        >
          <Wallet size={18} />
          {address ? `${address.substring(0, 6)}...${address.substring(38)}` : "Connect Wallet"}
        </button>
      </nav>

      {/* Hero Section */}
      <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-8 mt-10">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Decentralized <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
            Token Intelligence
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-xl">
          Powered by Genlayer. Input any token ticker, and our AI validators will fetch, analyze, and reach consensus on its real-time market data, sentiment, and risks.
        </p>

        {/* Input Controls */}
        <div className="w-full space-y-4 pt-4">
          <div className="relative">
            <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Deployed Genlayer Contract Address (0x...)" 
              className="w-full glass-input py-4 pl-12 pr-4 rounded-2xl text-lg"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
            />
          </div>
          
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Enter Token Ticker (e.g. BTC, ETH, SOL)" 
              className="w-full glass-input py-4 pl-12 pr-32 rounded-2xl text-lg uppercase"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && analyzeToken()}
            />
            <button 
              onClick={analyzeToken}
              disabled={loading || !ticker || !contractAddress}
              className="absolute right-2 top-2 bottom-2 glass-btn px-6 rounded-xl font-semibold flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Analyze"}
            </button>
          </div>
        </div>

        {error && (
          <div className="w-full p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Dashboard Result */}
      {tokenData && <TokenDashboard data={tokenData} />}

    </main>
  );
}
