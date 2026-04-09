import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ZKCreditScoreModule = buildModule("ZKCreditScoreModule", (m) => {
  // 1. نشر عقد السجل (Registry)
  const registry = m.contract("CreditScoreRegistry");

  // 2. نشر عقد الهوية (SBT)
  const sbt = m.contract("CreditSBT");

  // 3. نشر عقد التحقق (Verifier) مع تمرير عناوين العقود السابقة
  const verifier = m.contract("CreditProofVerifier", [registry, sbt]);

  return { registry, sbt, verifier };
});

export default ZKCreditScoreModule;