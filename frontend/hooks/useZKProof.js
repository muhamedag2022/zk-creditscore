import * as snarkjs from "snarkjs";
import { ethers } from "ethers";

export const useZKProof = () => {
    const generateAndVerify = async (userScore, userAddress, sbtContractAddress) => {
        try {
            console.log("1. Starting ZK process...");
            
            // تحويل السكور لرقم صحيح وضمان عدم وجود قيم غريبة
            const cleanScore = parseInt(userScore);
            const addressBigInt = ethers.toBigInt(userAddress.toLowerCase()).toString();

            // فحص منطقي قبل البدء (لتوفير الوقت والغاز)
            if (isNaN(cleanScore) || cleanScore < 25) {
                throw new Error(`Score ${cleanScore} is not eligible (min 25)`);
            }

            console.log("🔍 Running Proof with Score:", cleanScore);

            // توليد الإثبات - تأكد من مسارات الملفات في مجلد public
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                { 
                    score: cleanScore, 
                    userAddress: addressBigInt 
                },
                "/score_check.wasm", 
                "/score_check_final.zkey"
            );

            console.log("✅ Proof Generated. Public Signals:", publicSignals);

            // تصدير البيانات لتناسب Solidity
            const rawCallData = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
            const json = JSON.parse("[" + rawCallData + "]");
            const [a, b, c, inputs] = json;

            if (!window.ethereum) throw new Error("MetaMask not found!");

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            
            // تأكد أنك تستخدم ABI العقد الصحيح (ReputationSBT)
            const sbtAbi = [
                "function mintSBT(uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[2] input) public"
            ];

            const contract = new ethers.Contract(sbtContractAddress, sbtAbi, signer);

            console.log("2. Sending Transaction to HashKey Chain...");
            
            const tx = await contract.mintSBT(a, b, c, inputs); 
            console.log("⏳ Transaction Sent. Hash:", tx.hash);
            
            await tx.wait(); 
            return true;

        } catch (error) {
    console.error("ZK_TECHNICAL_ERROR:", error);
    
    // إظهار الرسالة الحقيقية القادمة من العقد الذكي
    const reason = error.reason || error.message || "Unknown Error";
    alert("❌ Blockchain Error: " + reason);
    
    return false;
        }
    };

    return { generateAndVerify };
};