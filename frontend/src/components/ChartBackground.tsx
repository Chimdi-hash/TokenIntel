"use client";

import React, { useMemo } from 'react';

const ChartBackground = () => {
  // Generate random candlestick data
  const candlesticks = useMemo(() => {
    let currentPrice = 100;
    const candles = [];
    for (let i = 0; i < 150; i++) {
      // 55% chance of bullish to create a nice upward trend over time
      const isBullish = Math.random() > 0.45; 
      const change = (Math.random() * 20) + 5;
      const open = currentPrice;
      const close = isBullish ? open + change : open - change;
      const high = Math.max(open, close) + Math.random() * 15;
      const low = Math.min(open, close) - Math.random() * 15;
      currentPrice = close;
      
      candles.push({ x: i * 30, open, close, high, low, isBullish });
    }
    
    // Normalize prices to fit within SVG height (0 to 300)
    const min = Math.min(...candles.map(c => c.low));
    const max = Math.max(...candles.map(c => c.high));
    const range = max - min || 1;
    
    return candles.map(c => ({
      ...c,
      // Invert Y axis because SVG y=0 is at top
      open: 300 - ((c.open - min) / range * 240 + 30),
      close: 300 - ((c.close - min) / range * 240 + 30),
      high: 300 - ((c.high - min) / range * 240 + 30),
      low: 300 - ((c.low - min) / range * 240 + 30),
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
      {/* Radial Gradient overlay to make edges fade out */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#020617_80%)] z-10"></div>
      
      {/* Moving Chart */}
      <div className="flex h-full w-[200%] animate-chart-scroll opacity-40">
        {[0, 1].map((key) => (
          <svg key={key} className="h-full w-1/2" viewBox="0 0 4500 300" preserveAspectRatio="none">
            {candlesticks.map((c, i) => (
              <g key={i}>
                {/* Wick */}
                <line 
                  x1={c.x + 10} y1={c.high} 
                  x2={c.x + 10} y2={c.low} 
                  stroke={c.isBullish ? "#10b981" : "#f43f5e"} 
                  strokeWidth="2" 
                  className={c.isBullish ? "drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"}
                />
                {/* Body */}
                <rect 
                  x={c.x + 4} 
                  y={Math.min(c.open, c.close)} 
                  width="12" 
                  height={Math.max(Math.abs(c.open - c.close), 2)} 
                  fill={c.isBullish ? "#10b981" : "#f43f5e"} 
                  rx="1"
                  className={c.isBullish ? "drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]" : "drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]"}
                />
              </g>
            ))}
          </svg>
        ))}
      </div>
    </div>
  );
};

export default ChartBackground;
