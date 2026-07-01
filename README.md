# TokenIntel 🔍
### AI-Powered Crypto Intelligence on GenLayer

> A decentralized application that combines live market data with on-chain AI analysis — powered by GenLayer Intelligent Contracts.

🌐 **Live Demo:** [token-intel-omega.vercel.app](https://token-intel-omega.vercel.app)

---

## ✨ Features

- 🤖 **On-Chain AI Analysis** — GenLayer validators run AI consensus to produce sentiment, risk scores, news summaries, and developer activity reports
- 💰 **Live Prices** — Real-time price, market cap, volume, ATH, ATL, and rank for 10,000+ coins via CoinGecko
- 🔐 **Wallet-Gated** — Users must connect MetaMask and sign a transaction before viewing any analysis
- ⚡ **Universal Coverage** — Works for BTC, ETH, DOGE, SOL, TON, NOT, PEPE, WIF and any coin on CoinGecko
- 🛡️ **Oracle Architecture** — Frontend fetches live data and passes it to the contract, bypassing validator IP restrictions
- 🎨 **Premium UI** — Dark glassmorphism design with Framer Motion animations

---

## 🏗️ Architecture


---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Animations | Framer Motion |
| Blockchain Client | genlayer-js, viem |
| Smart Contract | Python (GenLayer SDK) |
| Market Data | CoinGecko API |
| Deployment | Vercel |
| Network | GenLayer Testnet (Studionet) |

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- GenLayer Testnet configured in MetaMask

### MetaMask Network Config
| Field | Value |
|---|---|
| Network Name | Genlayer Studio |
| RPC URL | https://studio.genlayer.com/api |
| Chain ID | 61999 |
| Currency Symbol | GEN |

### Installation

```bash
# Clone the repository
git clone https://github.com/Chimdi-hash/TokenIntel.git
cd TokenIntel

# Install frontend dependencies
cd frontend
npm install

# Run locally
npm run dev
