import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface BetHistoryItem {
  id: string;
  ticker: string;
  wagerAmount: number;
  sentiment: string;
  result: string;
  timestamp: number;
}

interface BetHistoryProps {
  history: BetHistoryItem[];
}

export default function BetHistory({ history }: BetHistoryProps) {
  if (!history || history.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 mb-8 px-4">
      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
        <Clock size={16} />
        Your Bet History
      </h3>
      
      <div className="glass-panel overflow-hidden rounded-2xl border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/20 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Token</th>
                <th className="px-6 py-4 font-semibold">Prediction</th>
                <th className="px-6 py-4 font-semibold">Wager (GEN)</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((bet) => (
                <tr key={bet.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{bet.ticker}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      bet.sentiment === 'BULLISH' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                      bet.sentiment === 'BEARISH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                      'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {bet.sentiment === 'BULLISH' && <TrendingUp size={12} />}
                      {bet.sentiment === 'BEARISH' && <TrendingDown size={12} />}
                      {bet.sentiment === 'NEUTRAL' && <Minus size={12} />}
                      {bet.sentiment}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-indigo-300">{bet.wagerAmount} GEN</td>
                  <td className="px-6 py-4">
                    {bet.result === 'WON' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                        <CheckCircle2 size={16} /> WON (+{bet.wagerAmount * 2} GEN)
                      </span>
                    ) : bet.result === 'LOST' ? (
                      <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold">
                        <XCircle size={16} /> BURNED
                      </span>
                    ) : bet.result === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold">
                        <Clock size={16} className="animate-pulse" /> PENDING
                      </span>
                    ) : (
                      <span className="text-slate-500">{bet.result}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(bet.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
