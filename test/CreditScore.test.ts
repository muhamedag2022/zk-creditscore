import { expect } from "chai";
import hre from "hardhat";

// ─────────────────────────────────────────────────────────────────────────────
// ZK-CreditScore — Hardhat Tests
// Covers: CreditScoreRegistry · CreditSBT · CreditProofVerifier
// ─────────────────────────────────────────────────────────────────────────────

describe("CreditScoreRegistry", function () {
  async function deployRegistryFixture() {
    const [owner, analyzer, user1, user2] = await hre.ethers.getSigners();
    const Registry = await hre.ethers.getContractFactory("CreditScoreRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();

    const defaultFactors = {
      balanceScore: 100n,
      activityScore: 80n,
      consistencyScore: 60n,
      diversityScore: 40n,
      riskScore: 20n,
    };

    return { registry, owner, analyzer, user1, user2, defaultFactors };
  }

  it("Should deploy with owner as authorized analyzer", async function () {
    const { registry, owner } = await deployRegistryFixture();
    expect(await registry.authorizedAnalyzers(owner.address)).to.equal(true);
  });

  it("Should create a credit profile and emit ProfileCreated", async function () {
    const { registry, user1, defaultFactors } = await deployRegistryFixture();

    await expect(
      registry.updateCreditProfile(user1.address, 750n, hre.ethers.keccak256("0x01"), defaultFactors)
    )
      .to.emit(registry, "ProfileCreated")
      .withArgs(user1.address, 750n, 4); // tier 4 = Very Good (650–799)
  });

  it("Should update score and emit ScoreUpdated on second call", async function () {
    const { registry, user1, defaultFactors } = await deployRegistryFixture();

    await registry.updateCreditProfile(user1.address, 500n, hre.ethers.keccak256("0x01"), defaultFactors);

    await expect(
      registry.updateCreditProfile(user1.address, 820n, hre.ethers.keccak256("0x02"), defaultFactors)
    )
      .to.emit(registry, "ScoreUpdated")
      .withArgs(user1.address, 500n, 820n);
  });

  it("Should revert if score exceeds MAX_SCORE (1000)", async function () {
    const { registry, user1, defaultFactors } = await deployRegistryFixture();

    await expect(
      registry.updateCreditProfile(user1.address, 1001n, hre.ethers.keccak256("0x01"), defaultFactors)
    ).to.be.revertedWith("Score exceeds maximum");
  });

  it("verifyScoreAbove — returns true when score >= threshold", async function () {
    const { registry, user1, defaultFactors } = await deployRegistryFixture();
    await registry.updateCreditProfile(user1.address, 600n, hre.ethers.keccak256("0x01"), defaultFactors);

    expect(await registry.verifyScoreAbove(user1.address, 500n)).to.equal(true);
    expect(await registry.verifyScoreAbove(user1.address, 600n)).to.equal(true);
    expect(await registry.verifyScoreAbove(user1.address, 601n)).to.equal(false);
  });

  it("verifyScoreAbove — reverts for unknown profile", async function () {
    const { registry, user2 } = await deployRegistryFixture();
    await expect(registry.verifyScoreAbove(user2.address, 100n)).to.be.revertedWith("Profile not found");
  });

  it("getCreditTier — returns correct tier for each score band", async function () {
    const { registry, owner, defaultFactors } = await deployRegistryFixture();
    const [, , , , , u1, u2, u3, u4, u5] = await hre.ethers.getSigners();

    const cases: [bigint, number][] = [
      [900n, 5], // Excellent  ≥800
      [700n, 4], // Very Good  ≥650
      [550n, 3], // Good       ≥500
      [400n, 2], // Fair       ≥350
      [200n, 1], // Poor       <350
    ];
    const users = [u1, u2, u3, u4, u5];

    for (let i = 0; i < cases.length; i++) {
      const [score, expectedTier] = cases[i];
      await registry.updateCreditProfile(users[i].address, score, hre.ethers.keccak256("0x01"), defaultFactors);
      expect(await registry.getCreditTier(users[i].address)).to.equal(expectedTier);
    }
  });

  it("Should authorize a new analyzer and allow them to update profiles", async function () {
    const { registry, analyzer, user1, defaultFactors } = await deployRegistryFixture();

    await registry.authorizeAnalyzer(analyzer.address);
    expect(await registry.authorizedAnalyzers(analyzer.address)).to.equal(true);

    await expect(
      registry.connect(analyzer).updateCreditProfile(user1.address, 300n, hre.ethers.keccak256("0x01"), defaultFactors)
    ).to.emit(registry, "ProfileCreated");
  });

  it("Should revert if unauthorized caller tries to update profile", async function () {
    const { registry, user1, user2, defaultFactors } = await deployRegistryFixture();

    await expect(
      registry.connect(user2).updateCreditProfile(user1.address, 300n, hre.ethers.keccak256("0x01"), defaultFactors)
    ).to.be.revertedWith("Not authorized");
  });

  it("getStats — increments totalProfiles and totalAnalyses correctly", async function () {
    const { registry, user1, user2, defaultFactors } = await deployRegistryFixture();

    await registry.updateCreditProfile(user1.address, 400n, hre.ethers.keccak256("0x01"), defaultFactors);
    await registry.updateCreditProfile(user2.address, 600n, hre.ethers.keccak256("0x02"), defaultFactors);
    await registry.updateCreditProfile(user1.address, 700n, hre.ethers.keccak256("0x03"), defaultFactors); // update

    const [totalProfiles, totalAnalyses] = await registry.getStats();
    expect(totalProfiles).to.equal(2n);
    expect(totalAnalyses).to.equal(3n);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("CreditSBT", function () {
  async function deploySBTFixture() {
    const [owner, user1, user2, attacker] = await hre.ethers.getSigners();
    const SBT = await hre.ethers.getContractFactory("CreditSBT");
    const sbt = await SBT.deploy();
    await sbt.waitForDeployment();
    const commitment = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("score:750"));
    return { sbt, owner, user1, user2, attacker, commitment };
  }

  it("Should mint SBT and emit IdentityIssued", async function () {
    const { sbt, user1, commitment } = await deploySBTFixture();

    await expect(sbt.mint(user1.address, 4, commitment))
      .to.emit(sbt, "IdentityIssued")
      .withArgs(user1.address, 1n, 4);

    expect(await sbt.balanceOf(user1.address)).to.equal(1n);
  });

  it("Should revert minting a second SBT to the same address", async function () {
    const { sbt, user1, commitment } = await deploySBTFixture();

    await sbt.mint(user1.address, 3, commitment);
    await expect(sbt.mint(user1.address, 4, commitment)).to.be.revertedWith(
      "Identity already exists"
    );
  });

  it("Should revert invalid tier values (0 and 6)", async function () {
    const { sbt, user1, commitment } = await deploySBTFixture();

    await expect(sbt.mint(user1.address, 0, commitment)).to.be.revertedWith("Invalid tier");
    await expect(sbt.mint(user1.address, 6, commitment)).to.be.revertedWith("Invalid tier");
  });

  it("SBT transfer prevention — transferFrom reverts", async function () {
    const { sbt, owner, user1, user2, commitment } = await deploySBTFixture();
    await sbt.mint(user1.address, 3, commitment);

    await expect(
      sbt.connect(user1).transferFrom(user1.address, user2.address, 1n)
    ).to.be.revertedWith("Soulbound: Transfer not allowed");
  });

  it("SBT transfer prevention — approve reverts", async function () {
    const { sbt, user1, user2, commitment } = await deploySBTFixture();
    await sbt.mint(user1.address, 3, commitment);

    await expect(
      sbt.connect(user1).approve(user2.address, 1n)
    ).to.be.revertedWith("Soulbound: Approval not allowed");
  });

  it("SBT transfer prevention — setApprovalForAll reverts", async function () {
    const { sbt, user1, user2, commitment } = await deploySBTFixture();
    await sbt.mint(user1.address, 3, commitment);

    await expect(
      sbt.connect(user1).setApprovalForAll(user2.address, true)
    ).to.be.revertedWith("Soulbound: Approval not allowed");
  });

  it("isValidIdentity — returns true for fresh token", async function () {
    const { sbt, user1, commitment } = await deploySBTFixture();
    await sbt.mint(user1.address, 5, commitment);
    expect(await sbt.isValidIdentity(1n)).to.equal(true);
  });

  it("getUserTier — returns correct tier", async function () {
    const { sbt, user1, commitment } = await deploySBTFixture();
    await sbt.mint(user1.address, 5, commitment);
    expect(await sbt.getUserTier(user1.address)).to.equal(5);
  });

  it("getUserTier — reverts for user with no identity", async function () {
    const { sbt, user2 } = await deploySBTFixture();
    await expect(sbt.getUserTier(user2.address)).to.be.revertedWith("No identity found");
  });

  it("revoke — owner can revoke, isValidIdentity returns false", async function () {
    const { sbt, user1, commitment } = await deploySBTFixture();
    await sbt.mint(user1.address, 3, commitment);
    await sbt.revoke(1n);
    expect(await sbt.isValidIdentity(1n)).to.equal(false);
  });

  it("revoke — non-owner cannot revoke", async function () {
    const { sbt, user1, attacker, commitment } = await deploySBTFixture();
    await sbt.mint(user1.address, 3, commitment);
    await expect(sbt.connect(attacker).revoke(1n)).to.be.reverted;
  });

  it("tokenURI — returns on-chain JSON with tier name", async function () {
    const { sbt, user1, commitment } = await deploySBTFixture();
    await sbt.mint(user1.address, 5, commitment);
    const uri = await sbt.tokenURI(1n);
    expect(uri).to.include("data:application/json");
    expect(uri).to.include("Excellent");
    expect(uri).to.include("ZK Credit Identity #1");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("CreditProofVerifier", function () {
  async function deployFullFixture() {
    const [owner, user1, user2, defiProtocol] = await hre.ethers.getSigners();

    const Registry = await hre.ethers.getContractFactory("CreditScoreRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();

    const SBT = await hre.ethers.getContractFactory("CreditSBT");
    const sbt = await SBT.deploy();
    await sbt.waitForDeployment();

    const Verifier = await hre.ethers.getContractFactory("CreditProofVerifier");
    const verifier = await Verifier.deploy(
      await registry.getAddress(),
      await sbt.getAddress()
    );
    await verifier.waitForDeployment();

    // Give user1 a credit profile (score 700)
    const factors = {
      balanceScore: 200n,
      activityScore: 150n,
      consistencyScore: 150n,
      diversityScore: 100n,
      riskScore: 100n,
    };
    await registry.updateCreditProfile(user1.address, 700n, hre.ethers.keccak256("0x01"), factors);

    return { registry, sbt, verifier, owner, user1, user2, defiProtocol, factors };
  }

  it("requestProof — emits ProofRequested with correct args", async function () {
    const { verifier, defiProtocol, user1 } = await deployFullFixture();

    await expect(
      verifier.connect(defiProtocol).requestProof(user1.address, 500n)
    ).to.emit(verifier, "ProofRequested");
  });

  it("verifyProof — returns true when score meets threshold", async function () {
    const { verifier, defiProtocol, user1 } = await deployFullFixture();

    const tx = await verifier.connect(defiProtocol).requestProof(user1.address, 500n);
    const receipt = await tx.wait();
    const event = receipt?.logs.find((l: any) => l.fragment?.name === "ProofRequested");
    const proofId = (event as any).args[0];

    await expect(verifier.verifyProof(proofId))
      .to.emit(verifier, "ProofVerified")
      .withArgs(proofId, true);
  });

  it("verifyProof — returns false when score below threshold", async function () {
    const { verifier, defiProtocol, user1 } = await deployFullFixture();

    // user1 has score 700, request threshold 800
    const tx = await verifier.connect(defiProtocol).requestProof(user1.address, 800n);
    const receipt = await tx.wait();
    const event = receipt?.logs.find((l: any) => l.fragment?.name === "ProofRequested");
    const proofId = (event as any).args[0];

    await expect(verifier.verifyProof(proofId))
      .to.emit(verifier, "ProofVerified")
      .withArgs(proofId, false);
  });

  it("verifyProof — reverts on double verification", async function () {
    const { verifier, defiProtocol, user1 } = await deployFullFixture();

    const tx = await verifier.connect(defiProtocol).requestProof(user1.address, 500n);
    const receipt = await tx.wait();
    const event = receipt?.logs.find((l: any) => l.fragment?.name === "ProofRequested");
    const proofId = (event as any).args[0];

    await verifier.verifyProof(proofId);
    await expect(verifier.verifyProof(proofId)).to.be.revertedWith("Already verified");
  });

  it("requestProof — reverts for invalid threshold (>1000)", async function () {
    const { verifier, defiProtocol, user1 } = await deployFullFixture();
    await expect(
      verifier.connect(defiProtocol).requestProof(user1.address, 1001n)
    ).to.be.revertedWith("Invalid threshold");
  });

  it("verifyByTier — returns true when user has SBT with sufficient tier", async function () {
    const { verifier, sbt, user1 } = await deployFullFixture();
    const commitment = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("score:700"));
    await sbt.mint(user1.address, 4, commitment);

    expect(await verifier.verifyByTier(user1.address, 3)).to.equal(true);
    expect(await verifier.verifyByTier(user1.address, 4)).to.equal(true);
    expect(await verifier.verifyByTier(user1.address, 5)).to.equal(false);
  });

  it("verifyByTier — returns false for user with no SBT", async function () {
    const { verifier, user2 } = await deployFullFixture();
    expect(await verifier.verifyByTier(user2.address, 1)).to.equal(false);
  });

  it("verifyScoreInRange — correctly checks range", async function () {
    const { verifier, user1 } = await deployFullFixture();
    // user1 score = 700
    expect(await verifier.verifyScoreInRange(user1.address, 600n, 800n)).to.equal(true);
    expect(await verifier.verifyScoreInRange(user1.address, 700n, 700n)).to.equal(true);
    expect(await verifier.verifyScoreInRange(user1.address, 800n, 1000n)).to.equal(false);
  });

  it("getUserProofs — tracks all proofs for a user", async function () {
    const { verifier, defiProtocol, user1 } = await deployFullFixture();

    const tx1 = await verifier.connect(defiProtocol).requestProof(user1.address, 500n);
    const r1 = await tx1.wait();
    const e1 = r1?.logs.find((l: any) => l.fragment?.name === "ProofRequested");
    const proofId1 = (e1 as any).args[0];
    await verifier.verifyProof(proofId1);

    const tx2 = await verifier.connect(defiProtocol).requestProof(user1.address, 600n);
    const r2 = await tx2.wait();
    const e2 = r2?.logs.find((l: any) => l.fragment?.name === "ProofRequested");
    const proofId2 = (e2 as any).args[0];
    await verifier.verifyProof(proofId2);

    const proofs = await verifier.getUserProofs(user1.address);
    expect(proofs.length).to.equal(2);
    expect(await verifier.verificationCount(user1.address)).to.equal(2n);
  });
});
