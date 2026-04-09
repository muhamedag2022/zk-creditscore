require("@nomicfoundation/hardhat-toolbox-viem");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.24", // نعتمد هذا الإصدار كإصدار أساسي لدعم MCOPY
        settings: {
          optimizer: { enabled: true, runs: 200 },
          // أزلنا سطر evmVersion: "paris" مؤقتاً للسماح بـ Cancun 
          // أو قم بتغييره إلى "cancun" إذا كان المترجم يطلبه
          evmVersion: "cancun" 
        }
      }
    ]
  },
  networks: {
    hashkeyTestnet: {
      type: "http", // أضف هذا السطر يدوياً هنا
      url: "https://testnet.hsk.xyz",
      chainId: 133,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};