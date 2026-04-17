# 🔐 ZK-CreditScore

> Privacy-First Decentralized Reputation Layer on HashKey Chain | 基于HashKey Chain的隐私优先去中心化声誉层

[![Live Demo](https://img.shields.io/badge/Live-Demo-7c3aed?style=for-the-badge)](https://zk-creditscore.vercel.app/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repo-181717?style=for-the-badge&logo=github)](https://github.com/muhamedag2022/zk-creditscore)
[![HashKey Chain](https://img.shields.io/badge/HashKey-Testnet-a855f7?style=for-the-badge)](https://testnet-explorer.hsk.xyz)
[![ZK Proofs](https://img.shields.io/badge/ZK-Groth16-blue?style=for-the-badge)](https://docs.circom.io)
[![SBT](https://img.shields.io/badge/Token-Soulbound-green?style=for-the-badge)](#)
[![Tests](https://img.shields.io/badge/Tests-31%20passing-brightgreen?style=for-the-badge)](#-test-results)

---

## 🔑 Key Stats

| Property | Value |
| :--- | :--- |
| **ZK System** | Groth16 (Circom + SnarkJS) |
| **Circuit Constraints** | 38 *(measured — `snarkjs r1cs info`)* |
| **Circuit Wires** | 39 |
| **Private Inputs** | `score`, `threshold` |
| **Public Inputs** | `address` (1 signal) |
| **Output Signal** | `valid` (1 = qualified, 0 = not) |
| **Curve** | BN-128 |
| **Test Suite** | **31 / 31 passing** |
| **Network** | HashKey Chain Testnet (Chain ID: 133) |
| **SBT Standard** | ERC-721 Non-transferable (Soulbound) |
| **Status** | ✅ Live — SBT Minting Confirmed On-chain |

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
3. **ZK-Trust Index calculated (0–1000)**.
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
│  CreditSBT.sol                           │
│  CreditProofVerifier.sol                 │
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

## ⚡ ZK Circuit — score_check.circom

```circom
pragma circom 2.0.0;
include "comparators.circom";

template ScoreCheck() {
  signal input score;      // PRIVATE — never revealed
  signal input threshold;  // PRIVATE — minimum required
  signal input address;    // PRIVATE — wallet binding

  signal output valid;     // PUBLIC — 1 (pass) or 0 (fail)

  component gte = GreaterEqThan(32);
  gte.in[0] <== score;
  gte.in[1] <== threshold;
  valid <== gte.out;
}

component main {public [address]} = ScoreCheck();
```

**Compiled R1CS — measured output of `snarkjs r1cs info zk/score_check.r1cs`:**

| Metric | Value |
| :--- | :--- |
| Curve | BN-128 |
| Constraints | **38** |
| Wires | **39** |
| Private Inputs | 2 (`score`, `threshold`) |
| Public Inputs | 1 (`address`) |
| Labels | 44 |
| Outputs | 1 (`valid`) |

---

## ✅ Test Results

**31 / 31 passing** — `npx hardhat test test/ZKCreditScore.test.ts`

### CreditScoreRegistry — 10 tests
| Test | Result |
| :--- | :--- |
| Deploy with owner as authorized analyzer | ✅ |
| Create credit profile → emits `ProfileCreated` | ✅ |
| Update score → emits `ScoreUpdated` | ✅ |
| Revert if score exceeds MAX\_SCORE (1000) | ✅ |
| `verifyScoreAbove` — true when score ≥ threshold | ✅ |
| `verifyScoreAbove` — reverts for unknown profile | ✅ |
| `getCreditTier` — correct tier for all 5 score bands | ✅ |
| Authorize new analyzer → can update profiles | ✅ |
| Revert if unauthorized caller updates profile | ✅ |
| `getStats` — totalProfiles & totalAnalyses correct | ✅ |

### CreditSBT — 12 tests
| Test | Result |
| :--- | :--- |
| Mint SBT → emits `IdentityIssued` | ✅ |
| Revert minting second SBT to same address | ✅ |
| Revert invalid tier values (0 and 6) | ✅ |
| **`transferFrom` reverts — Soulbound enforced** | ✅ |
| **`approve` reverts — Soulbound enforced** | ✅ |
| **`setApprovalForAll` reverts — Soulbound enforced** | ✅ |
| `isValidIdentity` — true for fresh token | ✅ |
| `getUserTier` — returns correct tier | ✅ |
| `getUserTier` — reverts for user with no identity | ✅ |
| `revoke` — owner can revoke → `isValidIdentity` false | ✅ |
| `revoke` — non-owner cannot revoke | ✅ |
| `tokenURI` — returns on-chain JSON with tier name | ✅ |

### CreditProofVerifier — 9 tests
| Test | Result |
| :--- | :--- |
| `requestProof` → emits `ProofRequested` | ✅ |
| `verifyProof` — true when score meets threshold | ✅ |
| `verifyProof` — false when score below threshold | ✅ |
| `verifyProof` — reverts on double verification | ✅ |
| `requestProof` — reverts for invalid threshold (>1000) | ✅ |
| `verifyByTier` — true when SBT tier is sufficient | ✅ |
| `verifyByTier` — false for user with no SBT | ✅ |
| `verifyScoreInRange` — correctly checks range | ✅ |
| `getUserProofs` — tracks all proofs per user | ✅ |

---

## 🏆 Credit Tiers & Badges

| Score Range | Tier | SBT Badge | Eligible |
| :--- | :--- | :--- | :--- |
| 80–100 | 🥇 Platinum | Elite Member | ✅ |
| 60–79 | 🥈 Gold | Trusted Member | ✅ |
| 40–59 | 🥉 Silver | Verified Member | ✅ |
| 20–39 | 🟤 Bronze | Basic Member | ✅ |
| 0–19 | ⚪️ Unranked | — | ❌ |

---

## ⛽ Gas Measurements (HashKey Testnet — On-chain Verified)

> All values measured from live deployment transactions on HashKey Chain Testnet (Chain ID: 133).  
> Verified via RPC — `eth_getTransactionReceipt`.

### Contract Deployments

| Contract | Gas Used | Transaction Hash | Block |
| :--- | ---: | :--- | :--- |
| **CreditScoreRegistry** | 957,050 | [`0x2f143d...d27b`](https://testnet-explorer.hsk.xyz/tx/0x2f143d2dd7ec8540261d00875e22a7454e37f85252aa0fef4fe653992122d27b) | 26,179,599 |
| **CreditSBT** | 1,597,777 | [`0x85b487...f57`](https://testnet-explorer.hsk.xyz/tx/0x85b48795a91b79edb58932a091cb766a1a561f5eab1a056eaa31171c0f549d57) | 26,179,602 |
| **CreditProofVerifier** | 784,102 | [`0x5c5f51...a77`](https://testnet-explorer.hsk.xyz/tx/0x5c5f517a2d3dae18db18565ffa51e176570842285d76fc15d18897deb7e47a77) | 26,179,605 |

### Contract Bytecode Sizes (On-chain)

| Contract | Deployed Bytecode |
| :--- | ---: |
| CreditScoreRegistry | 3,851 bytes |
| CreditSBT | 6,780 bytes |
| CreditProofVerifier | 3,159 bytes |

---

## 📦 Smart Contracts (HashKey Testnet)

| Contract | Address | Status |
| :--- | :--- | :--- |
| **Groth16Verifier** | `0xb4d4...B7fb0` | ✅ Live |
| **ReputationSBT** | `0x37061d5e51b6b9c79b8f89058f9e9924503b4711` | ✅ Verified |
| **CreditScoreRegistry** | `0x94fb752029c0f56e9bed978a369904cc9557a57a` | ✅ Live |
| **CreditSBT** | `0xc9732315888feefa2c72b1249f8c1a5f4a8d0370` | ✅ Live |
| **CreditProofVerifier** | `0xf36280a13e156954ecea75b5816f897ed62015db` | ✅ Live |

---

## 🛠 Tech Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS
- **Wallet Connection:** RainbowKit + Wagmi + Viem
- **ZK Cryptography:** Circom + SnarkJS (Groth16)
- **Smart Contracts:** Solidity 0.8.24 + OpenZeppelin
- **Testing:** Hardhat + Chai (31 tests)
- **DevOps:** Vercel Deployment

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MetaMask with HashKey Testnet (Chain ID: 133)
- HSK Testnet tokens from [faucet.hsk.xyz](https://faucet.hsk.xyz)

### Installation
```bash
git clone https://github.com/muhamedag2022/zk-creditscore.git
cd zk-creditscore/frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Run Tests
```bash
cd zk-creditscore
npx hardhat test
# 31 passing
```

### Verify ZK Circuit
```bash
snarkjs r1cs info zk/score_check.r1cs
# Constraints: 38 | Wires: 39 | Public Inputs: 1
```

---

## 🎯 Hackathon Tracks
- **Primary:** **ZKID** — Privacy-preserving identity infrastructure using real ZK-SNARKs
- **Secondary:** **DeFi** — On-chain reputation for credit-based lending

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