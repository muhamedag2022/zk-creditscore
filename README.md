# 🔐 ZK-CreditScore

> Privacy-First Decentralized Reputation Layer on HashKey Chain | 基于HashKey Chain의隐私优先去中心化声誉层

[![Live Demo](https://img.shields.io/badge/Live-Demo-7c3aed?style=for-the-badge)](https://zk-creditscore.vercel.app/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repo-181717?style=for-the-badge&logo=github)](https://github.com/muhamedag2022/zk-creditscore)
[![HashKey Chain](https://img.shields.io/badge/HashKey-Testnet-a855f7?style=for-the-badge)](https://testnet-explorer.hsk.xyz)
[![ZK Proofs](https://img.shields.io/badge/ZK-Groth16-blue?style=for-the-badge)](https://docs.circom.io)
[![SBT](https://img.shields.io/badge/Token-Soulbound-green?style=for-the-badge)](#)

---

## 🚨 The Problem

In Web3 today, to access credit-based DeFi privileges:
- Users must expose their **entire wallet history**.
- Privacy is sacrificed for financial access.
- No portable, verifiable reputation exists on HashKey Chain.
- Institutions cannot verify user credibility without KYC leaks.

## 💡 The Solution

ZK-CreditScore builds the **first privacy-preserving reputation layer** on HashKey Chain.
Users prove their creditworthiness using **Zero-Knowledge Proofs (zk-SNARKs)** — without revealing their actual score, transaction history, or wallet balance.

> "Prove you're trustworthy. Reveal nothing."

---

## ✨ How It Works

1. **User connects wallet** via RainbowKit.
2. **Backend analyzes on-chain activity:**
   - Wallet age & activity consistency.
   - Transaction volume & asset diversity.
   - DeFi protocol interactions on HashKey Chain.
3. **ZK-Trust Index calculated (0-100)**.
4. **Circom circuit generates Groth16 proof** *(entirely in browser — no data leaves device)*.
5. **Groth16Verifier contract verifies proof** on HashKey Chain.
6. **ReputationSBT minted** — a non-transferable Soulbound identity badge.
7. **Elite Member status confirmed** on-chain.

---

## 🏗 Architecture

```text
┌─────────────────────────────────────────┐
│           Frontend (Next.js 15)          │
│  RainbowKit + Wagmi + Tailwind CSS       │
│  Hosted on Vercel                        │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│        ZK Engine (Browser-side)          │
│  Circom Circuit + SnarkJS Groth16        │
│  .wasm + .zkey (static assets)           │
│  Proof generated locally — zero leaks    │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│     HashKey Chain Testnet (Chain ID 133) │
│                                          │
│  Groth16Verifier.sol                     │
│  ReputationSBT.sol                       │
│  CreditScoreRegistry.sol                 │
└─────────────────────────────────────────┘
```

---

## 🔐 ZK Privacy Model

The core innovation: **your score never leaves your browser.**

| Process | Location | Privacy Status |
| :--- | :--- | :--- |
| Wallet Data Fetching | Backend API | Private |
| Score Calculation | Server-side | Encrypted |
| **ZK Proof Generation** | **Browser (Client)** | **Zero Leakage** |
| Proof Verification | Smart Contract | Mathematical Verification |
| SBT Minting | HashKey Chain | Public Identity / Private Score |

---

## 🏆 Credit Tiers & Badges

| Score Range | Tier | SBT Badge |
| :--- | :--- | :--- |
| 80-100 | 🥇 Platinum | Elite Member |
| 60-79 | 🥈 Gold | Trusted Member |
| 40-59 | 🥉 Silver | Verified Member |
| 20-39 | 🟤 Bronze | Basic Member |
| 0-19 | ⚪ Unranked | Ineligible |

---

## 📦 Smart Contracts (HashKey Testnet)

| Contract | Address | Status |
| :--- | :--- | :--- |
| **SBT Contract** | `0x37061d5e51b6b9c79b8f89058f9e9924503b4711` | ✅ Verified |
| **CreditProofVerifier** | `0xf36280a13e156954ecea75b5816f897ed62015db` | ✅ Live |
| **Registry** | `0x94fb752029c0f56e9bed978a369904cc9557a57a` | ✅ Live |

---

## 🛠 Tech Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS.
- **Wallet Connection:** RainbowKit + Wagmi + Viem.
- **ZK Cryptography:** Circom + SnarkJS (Groth16).
- **Smart Contracts:** Solidity 0.8.24 + OpenZeppelin.
- **DevOps:** GitHub Actions + Vercel Deployment.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MetaMask with HashKey Testnet (Chain ID: 133).
- HSK Testnet tokens from [faucet.hsk.xyz](https://faucet.hsk.xyz).

### Installation
```bash
git clone [https://github.com/muhamedag2022/zk-creditscore.git](https://github.com/muhamedag2022/zk-creditscore.git)
cd zk-creditscore/frontend
npm install
```

### Run
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🎯 Hackathon Tracks
- **Primary:** **ZKID** — Privacy-preserving identity infrastructure using real ZK-SNARKs.
- **Secondary:** **DeFi** — On-chain reputation for credit-based lending.
- **Bonus:** **AI** — Behavior-based wallet scoring algorithm.

---

## 🌐 Project Links
- **GitHub:** [muhamedag2022/zk-creditscore](https://github.com/muhamedag2022/zk-creditscore)
- **Live dApp:** [zk-creditscore.vercel.app](https://zk-creditscore.vercel.app/)

<br/>

<div align="center">
  <strong>Built for HashKey Chain Horizon Hackathon 2026</strong>
  <br/>
  <em>"Securing Web3 Reputation with Mathematical Certainty"</em>
</div>
```