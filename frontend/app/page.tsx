"use client";
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ShieldCheck, Zap, Activity, Globe, CheckCircle, Award } from 'lucide-react';
import { useZKProof } from "@/hooks/useZKProof";
import { ethers } from 'ethers';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [scoreData, setScoreData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasBadge, setHasBadge] = useState(false); // حالة ملكية البادج
  
  const { address: connectedAddress, isConnected } = useAccount();
  const { generateAndVerify } = useZKProof();

  const SBT_CONTRACT_ADDRESS = "0x37061d5e51b6b9c79b8f89058f9e9924503b4711".toLowerCase();

  useEffect(() => {
    setMounted(true);
    if (isConnected && connectedAddress) {
      checkIfHasBadge();
    }
  }, [isConnected, connectedAddress]);

  // دالة لفحص الرصيد في العقد الذكي
  const checkIfHasBadge = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const abi = ["function balanceOf(address owner) view returns (uint256)"];
      const contract = new ethers.Contract(SBT_CONTRACT_ADDRESS, abi, provider);
      const balance = await contract.balanceOf(connectedAddress);
      if (Number(balance) > 0) setHasBadge(true);
    } catch (err) {
      console.error("Balance check failed:", err);
    }
  };

  const fetchScore = async () => {
  if (!isConnected || !connectedAddress) {
    alert("Please connect your wallet first!");
    return;
  }

  setLoading(true);
  try {
    // الرابط أصبح نسبياً الآن
    const res = await fetch(`/api/score/${connectedAddress}`);
    if (!res.ok) throw new Error('Server error');
    const data = await res.json();
    setScoreData(data);
  } catch (err) {
    console.error("Analysis failed:", err);
    alert("API Error: Check if the route is correctly deployed.");
  } finally {
    setLoading(false);
  }
};

  const handleMintSBT = async () => {
    if (!scoreData || !connectedAddress) return;
    setLoading(true);
    try {
      const success = await generateAndVerify(
        scoreData.score, 
        connectedAddress, 
        SBT_CONTRACT_ADDRESS
      );
      if (success) {
        setHasBadge(true);
        alert("✅ SUCCESS: ZK-Proof verified! Your Soulbound Badge is now on-chain.");
      }
    } catch (err) {
      console.error("Operation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <nav className="flex justify-between items-center mb-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-2xl font-black">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">ZK</div>
          <span>CREDIT<span className="text-blue-500">SCORE</span></span>
        </div>
        <ConnectButton />
      </nav>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* القسم الأيسر */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            HashKey Chain Horizon Hackathon
          </div>
          <h2 className="text-6xl font-black mb-6 leading-tight">
            Prove Your <br />
            <span className="text-blue-500">Reputation</span> Silently.
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-lg">
            A zero-knowledge credit layer that proves your wallet worthiness without exposing your transaction history.
          </p>

          {!hasBadge ? (
            <button 
              onClick={fetchScore}
              disabled={loading}
              className="flex items-center gap-3 bg-blue-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              <Zap size={22} className={loading ? "animate-spin" : ""} />
              {loading ? "Analyzing..." : "Analyze Wallet Reputation"}
            </button>
          ) : (
            <div className="p-4 border border-green-500/30 bg-green-500/10 rounded-2xl inline-flex items-center gap-3 text-green-400 font-bold">
              <CheckCircle size={24} /> Verified Identity Secured
            </div>
          )}
        </div>

        {/* القسم الأيمن: عرض النتيجة أو البادج */}
        <div className="relative">
          <div className={`relative bg-[#121212] border ${hasBadge ? 'border-yellow-500/50' : 'border-white/10'} p-10 rounded-[2.5rem] shadow-2xl transition-all duration-700`}>
            
            {hasBadge ? (
              // عرض البادج في حال الملكية
              <div className="text-center py-6 animate-in zoom-in duration-500">
                <div className="relative inline-block">
                    <img src="/badge.png" alt="ZK Badge" className="w-48 h-48 mx-auto drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]" />
                    <Award className="absolute -bottom-2 -right-2 text-yellow-500" size={48} />
                </div>
                <h3 className="mt-8 text-3xl font-black text-yellow-500 uppercase tracking-tighter">Elite Member</h3>
                <p className="text-gray-500 font-mono text-xs mt-2">SOULBOUND TOKEN ID: #00{connectedAddress?.slice(-3)}</p>
              </div>
            ) : (
              // عرض السكور العادي
              <>
                <div className="flex justify-between mb-12">
                  <ShieldCheck size={40} className="text-blue-500" />
                  <div className="text-right font-mono text-[10px] text-gray-500">HASHKEY_TESTNET</div>
                </div>
                
                <div className="mb-8">
                  <p className="text-gray-500 text-xs font-mono mb-2 tracking-widest uppercase">Reputation Index</p>
                  <h3 className="text-8xl font-black tracking-tighter">
                    {scoreData ? scoreData.score : "00"}
                  </h3>
                </div>

                {scoreData && (
                  <div className="space-y-3 mb-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                      <span className="text-gray-500">Account Age Score</span>
                      <span className="text-blue-400 font-bold">+{Math.round(scoreData.score * 0.3)}</span>
                    </div>
                    <div className="flex justify-between text-xs border-b border-white/5 pb-2">
                      <span className="text-gray-500">DeFi Activity</span>
                      <span className="text-blue-400 font-bold">+{Math.round(scoreData.score * 0.5)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Asset Diversity</span>
                      <span className="text-blue-400 font-bold">+{Math.round(scoreData.score * 0.2)}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
                <div className="text-[10px] font-mono text-gray-600">ID: {connectedAddress?.slice(0,10)}...</div>
                <Activity size={18} className="text-gray-700" />
            </div>
          </div>

          {/* زر الماينت */}
          {scoreData && scoreData.score >= 25 && !hasBadge && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[80%]">
              <button 
                onClick={handleMintSBT}
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-black text-white shadow-xl hover:scale-105 transition-transform"
              >
                {loading ? "Verifying ZK..." : "MINT IDENTITY BADGE"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}