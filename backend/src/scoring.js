import { ethers } from "ethers";

// إعداد المزود لشبكة HashKey Testnet
const provider = new ethers.JsonRpcProvider("https://testnet.hsk.xyz");

export const calculateCreditScore = async (address) => {
    try {
        // 1. جلب رصيد المحفظة (Assets)
        const balanceWei = await provider.getBalance(address);
        const balanceHSK = parseFloat(ethers.formatEther(balanceWei));
        
        // 2. جلب عدد المعاملات (Activity)
        const txCount = await provider.getTransactionCount(address);

        // 3. حساب النقاط بناءً على الأوزان (Weights)
        let assetsPoints = Math.min(balanceHSK * 10, 40); // بحد أقصى 40 نقطة
        let activityPoints = Math.min(txCount * 2, 40);   // بحد أقصى 40 نقطة
        let agePoints = 20; // قيمة افتراضية حالياً (يمكن تطويرها بجلب أول معاملة)

        const totalScore = Math.floor(assetsPoints + activityPoints + agePoints);

        // تحديد الفئة (Tier)
        let level = "Bronze";
        if (totalScore > 80) level = "Gold";
        else if (totalScore > 50) level = "Silver";
        else if (totalScore >= 25) level = "Starter"; // فئة جديدة للمؤهلين الجدد

        return {
            address,
            score: totalScore,
            level: level,
            details: {
                assets: Math.floor(assetsPoints),
                activity: Math.floor(activityPoints),
                age: agePoints
            },
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        throw new Error("Failed to fetch on-chain data: " + error.message);
    }
};