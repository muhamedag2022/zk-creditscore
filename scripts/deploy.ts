import hre from "hardhat";

async function main() {
  console.log("--- Initializing Deployment ---");
  
  const hskViem = (hre as any).viem;

  if (!hskViem) {
    console.error("Error: Viem plugin not detected in Hardhat Runtime.");
    return;
  }

  try {
    const [deployer] = await hskViem.getWalletClients();
    console.log(`Using wallet: ${deployer.account.address}`);

    console.log("Deploying Registry...");
    const registry = await hskViem.deployContract("CreditScoreRegistry");
    console.log(`Registry: ${registry.address}`);

    console.log("Deploying SBT...");
    const sbt = await hskViem.deployContract("CreditSBT");
    console.log(`SBT: ${sbt.address}`);

    console.log("Deploying Verifier...");
    const verifier = await hskViem.deployContract("CreditProofVerifier", [
      registry.address,
      sbt.address
    ]);
    console.log(`Verifier: ${verifier.address}`);

    console.log("\n🚀 All contracts deployed successfully to HashKey Testnet!");
  } catch (error) {
    console.error("Deployment failed:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});