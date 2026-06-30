"use client";

import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Activity, Globe, FileText, Server,
  DollarSign, BarChart2, PieChart, ShieldAlert, BrainCircuit,
  MessageSquare, TerminalSquare, Newspaper, Calendar, Clock
} from "lucide-react";

export interface TokenData {
  logo_url: string;
  name: string;
  ticker: string;
  price_usd: number;
  market_cap_usd: number;
  volume_24h_usd: number;
  price_change_24h_percent: number;
  ath_usd: number;
  ath_date: string;
  atl_usd: number;
  atl_date: string;
  launch_date: string;
  circulating_supply: number;
  max_supply: number | null;
  fdv_usd: number;
  market_cap_rank: number;
  blockchain: string;
  official_website: string;
  whitepaper: string;
  liquidity_usd: number | null;
  risk_score: number;
  ai_summary: string;
  bullish_bearish: string;
  community_sentiment: string;
  developer_activity: string;
  latest_news: string;
}

const containerVariants: import("framer-motion").Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: import("framer-motion").Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

export default function TokenDashboard({ data }: { data: TokenData }) {
  const isPositive = data.price_change_24h_percent >= 0;

  const formatCurrency = (val: number | null) => {
    if (val === null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: val < 1 ? 4 : 2,
    }).format(val);
  };

  const formatNumber = (val: number | null) => {
    if (val === null) return "N/A";
    if (val >= 1e9) return (val / 1e9).toFixed(2) + "B";
    if (val >= 1e6) return (val / 1e6).toFixed(2) + "M";
    return val.toLocaleString();
  };

  return (
    <motion.div 
      className="w-full max-w-6xl mx-auto mt-8 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Card */}
      <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-center gap-6 z-10">
          <div className="w-20 h-20 rounded-full overflow-hidden border border-white/20 bg-white/5 backdrop-blur-md p-2">
            <img src={data.logo_url} alt={data.name} className="w-full h-full object-contain rounded-full" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              {data.name} 
              <span className="text-xl font-medium px-3 py-1 bg-white/10 rounded-full text-indigo-200">
                {data.ticker.toUpperCase()}
              </span>
              <span className="text-sm px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30">
                Rank #{data.market_cap_rank}
              </span>
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-3xl font-semibold text-white">
                {formatCurrency(data.price_usd)}
              </span>
              <span className={`text-lg font-medium flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                {Math.abs(data.price_change_24h_percent).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 z-10 w-full md:w-auto">
          <a href={data.official_website} target="_blank" rel="noreferrer" className="glass-btn flex items-center justify-center gap-2">
            <Globe size={16} /> Website
          </a>
          <a href={data.whitepaper} target="_blank" rel="noreferrer" className="glass-btn flex items-center justify-center gap-2">
            <FileText size={16} /> Whitepaper
          </a>
        </div>
      </motion.div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} className="glass-panel p-5 rounded-2xl flex flex-col gap-2 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium"><DollarSign size={16} /> Market Cap</div>
          <div className="text-xl font-semibold text-white">{formatCurrency(data.market_cap_usd)}</div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="glass-panel p-5 rounded-2xl flex flex-col gap-2 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium"><BarChart2 size={16} /> 24h Volume</div>
          <div className="text-xl font-semibold text-white">{formatCurrency(data.volume_24h_usd)}</div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-5 rounded-2xl flex flex-col gap-2 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium"><PieChart size={16} /> Circulating Supply</div>
          <div className="text-xl font-semibold text-white">{formatNumber(data.circulating_supply)} {data.ticker}</div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-5 rounded-2xl flex flex-col gap-2 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium"><Server size={16} /> Network</div>
          <div className="text-xl font-semibold text-white">{data.blockchain}</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Historical */}
        <div className="space-y-6">
          <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl h-full">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Calendar size={18} className="text-indigo-400" /> Historical Data</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-slate-400 text-sm">All-Time High</span>
                <div className="text-right">
                  <div className="text-white font-medium">{formatCurrency(data.ath_usd)}</div>
                  <div className="text-slate-500 text-xs">{data.ath_date}</div>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-slate-400 text-sm">All-Time Low</span>
                <div className="text-right">
                  <div className="text-white font-medium">{formatCurrency(data.atl_usd)}</div>
                  <div className="text-slate-500 text-xs">{data.atl_date}</div>
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-slate-400 text-sm">Fully Diluted Val</span>
                <span className="text-white font-medium">{formatCurrency(data.fdv_usd)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Launch Date</span>
                <span className="text-white font-medium">{data.launch_date}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Center/Right - AI Analysis */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors duration-700" />
          
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 relative z-10">
            <BrainCircuit size={20} className="text-indigo-400" /> 
            AI Intelligence Summary
          </h3>
          
          <p className="text-slate-300 leading-relaxed mb-8 relative z-10 text-lg">
            {data.ai_summary}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <ShieldAlert size={20} className="mx-auto mb-2 text-rose-400" />
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Risk Score</div>
              <div className="text-xl font-bold text-white">{data.risk_score}/10</div>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <Activity size={20} className="mx-auto mb-2 text-emerald-400" />
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Outlook</div>
              <div className={`text-xl font-bold ${data.bullish_bearish === 'Bullish' ? 'text-emerald-400' : data.bullish_bearish === 'Bearish' ? 'text-rose-400' : 'text-amber-400'}`}>
                {data.bullish_bearish}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <MessageSquare size={20} className="mx-auto mb-2 text-blue-400" />
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Sentiment</div>
              <div className="text-lg font-semibold text-white">{data.community_sentiment}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <TerminalSquare size={20} className="mx-auto mb-2 text-purple-400" />
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Dev Activity</div>
              <div className="text-lg font-semibold text-white">{data.developer_activity}</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Latest News */}
      <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Newspaper size={18} className="text-indigo-400" /> Latest News</h3>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-4">
          <Clock size={24} className="text-indigo-400 mt-1 shrink-0" />
          <p className="text-slate-200 text-lg">
            {data.latest_news}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
