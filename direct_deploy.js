import { createWalletClient, createPublicClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// تعريف شبكة HashKey Testnet يدوياً
const hashKeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  network: 'hashkey-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HSK',
    symbol: 'HSK',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.hsk.xyz'],
    },
    public: {
      http: ['https://testnet.hsk.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'HashKey Explorer', url: 'https://explorer.testnet.hsk.xyz' },
  },
});

// بقية الكود كما هو...
const getArtifact = (name) => {
    const path = `./artifacts/contracts/${name}.sol/${name}.json`;
    if (!fs.existsSync(path)) throw new Error(`Artifact ${name} not found. Run: npx hardhat compile`);
    return JSON.parse(fs.readFileSync(path, 'utf8'));
};

async function deploy() {
    // تأكد أن PRIVATE_KEY يبدأ بـ 0x في ملف .env
    const pKey = process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`;
    const account = privateKeyToAccount(pKey);
    const transport = http("https://testnet.hsk.xyz");

    const walletClient = createWalletClient({ account, chain: hashKeyTestnet, transport });
    const publicClient = createPublicClient({ chain: hashKeyTestnet, transport });

    console.log(`🚀 Starting Direct Deployment with: ${account.address}`);

    try {
        // 1. Deploy Registry
        const registryArt = getArtifact("CreditScoreRegistry");
        console.log("Deploying Registry...");
        const hash1 = await walletClient.deployContract({ 
            abi: registryArt.abi, 
            bytecode: registryArt.bytecode 
        });
        const receipt1 = await publicClient.waitForTransactionReceipt({ hash: hash1 });
        console.log(`✅ Registry deployed to: ${receipt1.contractAddress}`);

        // 2. Deploy SBT
        const sbtArt = getArtifact("CreditSBT");
        console.log("Deploying SBT...");
        const hash2 = await walletClient.deployContract({ 
            abi: sbtArt.abi, 
            bytecode: sbtArt.bytecode 
        });
        const receipt2 = await publicClient.waitForTransactionReceipt({ hash: hash2 });
        console.log(`✅ SBT deployed to: ${receipt2.contractAddress}`);

        // 3. Deploy Verifier
        const verifierArt = getArtifact("CreditProofVerifier");
        console.log("Deploying Verifier...");
        const hash3 = await walletClient.deployContract({ 
            abi: verifierArt.abi, 
            bytecode: verifierArt.bytecode,
            args: [receipt1.contractAddress, receipt2.contractAddress] 
        });
        const receipt3 = await publicClient.waitForTransactionReceipt({ hash: hash3 });
        console.log(`✅ Verifier deployed to: ${receipt3.contractAddress}`);

        console.log("\n--- DEPLOYMENT COMPLETE ---");
        console.log(`Final Addresses for your Frontend:`);
        console.log(`Registry: ${receipt1.contractAddress}`);
        console.log(`SBT: ${receipt2.contractAddress}`);
        console.log(`Verifier: ${receipt3.contractAddress}`);
    } catch (error) {
        console.error("❌ Failed:", error);
    }
}

deploy();