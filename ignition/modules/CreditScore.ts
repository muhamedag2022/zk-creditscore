import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CreditScoreModule", (m) => {
  // Deploy CreditScoreRegistry
  const creditScoreRegistry = m.contract("CreditScoreRegistry");

  // Deploy CreditSBT
  const creditSBT = m.contract("CreditSBT");

  // Deploy CreditProofVerifier with constructor arguments
  const creditProofVerifier = m.contract("CreditProofVerifier", [
    creditScoreRegistry,
    creditSBT,
  ]);

  return { creditScoreRegistry, creditSBT, creditProofVerifier };
});
