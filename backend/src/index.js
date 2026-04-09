import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers"; 
import { calculateCreditScore } from "./scoring.js";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/api/score/:address", async (req, res) => {
    const { address } = req.params;
    
    // تصحيح فحص العنوان باستخدام ethers v6
    if (!ethers.isAddress(address)) {
        return res.status(400).json({ error: "Invalid Wallet Address" });
    }

    try {
        // استدعاء الخوارزمية المطورة
        const result = await calculateCreditScore(address);
        res.json(result);
    } catch (error) {
        console.error("Scoring Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 DeFi Compass API running on http://localhost:${PORT}`);
});