const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HealthChain Smart Contract Unit Tests", function () {
  let healthChain;
  let owner;
  let insurer;
  let patientAccount;

  const demoPatientId = "P001";
  const demoDate = "2026-09-22";
  const sampleDataHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const sampleSource = "consensus-v1";

  beforeEach(async function () {
    [owner, insurer, patientAccount] = await ethers.getSigners();
    const HealthChain = await ethers.getContractFactory("HealthChain");
    healthChain = await HealthChain.deploy();
  });

  describe("1. Deployment & Metadata", function () {
    it("should deploy and set owner and operational version", async function () {
      expect(await healthChain.owner()).to.equal(owner.address);
      expect(await healthChain.VERSION()).to.equal("1.0.0");
      expect(await healthChain.BASE_PREMIUM()).to.equal(10000n);
    });
  });

  describe("2. Health Record Hashes (Off-Chain Proofs)", function () {
    it("should record a valid health record hash and emit HealthRecordAdded event", async function () {
      await expect(
        healthChain.addHealthRecord(demoPatientId, demoDate, sampleDataHash, sampleSource)
      )
        .to.emit(healthChain, "HealthRecordAdded")
        .withArgs(demoPatientId, demoDate, sampleDataHash, sampleSource, (ts) => ts > 0);

      const record = await healthChain.getHealthRecord(demoPatientId, demoDate);
      expect(record.dataHash).to.equal(sampleDataHash);
      expect(record.source).to.equal(sampleSource);
      expect(record.exists).to.equal(true);
      expect(record.timestamp).to.be.gt(0);
    });

    it("should return exists=false for non-existent health records", async function () {
      const record = await healthChain.getHealthRecord("P999", "2026-01-01");
      expect(record.exists).to.equal(false);
      expect(record.dataHash).to.equal("");
    });

    it("should reject adding health records with empty parameters", async function () {
      await expect(
        healthChain.addHealthRecord("", demoDate, sampleDataHash, sampleSource)
      ).to.be.revertedWith("Patient ID cannot be empty");

      await expect(
        healthChain.addHealthRecord(demoPatientId, "", sampleDataHash, sampleSource)
      ).to.be.revertedWith("Date cannot be empty");

      await expect(
        healthChain.addHealthRecord(demoPatientId, demoDate, "", sampleSource)
      ).to.be.revertedWith("Data hash cannot be empty");
    });
  });

  describe("3. Patient Consent Management", function () {
    it("should allow granting and checking consent", async function () {
      expect(await healthChain.hasConsent(demoPatientId, insurer.address)).to.equal(false);

      await expect(healthChain.grantConsent(demoPatientId, insurer.address))
        .to.emit(healthChain, "ConsentGranted")
        .withArgs(demoPatientId, insurer.address, (ts) => ts > 0);

      expect(await healthChain.hasConsent(demoPatientId, insurer.address)).to.equal(true);
    });

    it("should allow revoking consent", async function () {
      await healthChain.grantConsent(demoPatientId, insurer.address);
      expect(await healthChain.hasConsent(demoPatientId, insurer.address)).to.equal(true);

      await expect(healthChain.revokeConsent(demoPatientId, insurer.address))
        .to.emit(healthChain, "ConsentRevoked")
        .withArgs(demoPatientId, insurer.address, (ts) => ts > 0);

      expect(await healthChain.hasConsent(demoPatientId, insurer.address)).to.equal(false);
    });

    it("should reject invalid addresses or empty patient IDs for consent", async function () {
      await expect(
        healthChain.grantConsent("", insurer.address)
      ).to.be.revertedWith("Patient ID cannot be empty");

      await expect(
        healthChain.grantConsent(demoPatientId, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid authorized address");
    });
  });

  describe("4. Premium Rules & Policy Management", function () {
    it("should calculate standard base premium of 10,000 when no thresholds are met", async function () {
      const premium = await healthChain.calculatePremium(5000, 6);
      expect(premium).to.equal(10000n);
    });

    it("should apply 10% discount when steps >= 10,000 (premium: 9,000)", async function () {
      const premium = await healthChain.calculatePremium(10500, 6);
      expect(premium).to.equal(9000n);
    });

    it("should apply 5% discount when sleep >= 7 hours (premium: 9,500)", async function () {
      const premium = await healthChain.calculatePremium(8000, 8);
      expect(premium).to.equal(9500n);
    });

    it("should apply combined 15% discount when both conditions are met (premium: 8,500)", async function () {
      const premium = await healthChain.calculatePremium(12000, 7);
      expect(premium).to.equal(8500n);
    });

    it("should create and retrieve a policy", async function () {
      const policyId = "POL-1001";
      const calculatedPremium = await healthChain.calculatePremium(10500, 7);

      await expect(healthChain.createPolicy(policyId, demoPatientId, calculatedPremium))
        .to.emit(healthChain, "PolicyCreated")
        .withArgs(policyId, demoPatientId, calculatedPremium, (ts) => ts > 0);

      const policy = await healthChain.getPolicy(policyId);
      expect(policy.patientId).to.equal(demoPatientId);
      expect(policy.premium).to.equal(calculatedPremium);
      expect(policy.active).to.equal(true);
    });
  });

  describe("5. Insurance Claims Lifecycle", function () {
    const policyId = "POL-1001";

    it("should submit a claim with Pending status and emit ClaimSubmitted event", async function () {
      const tx = await healthChain.submitClaim(policyId, demoPatientId, 2500, "Physiotherapy claim");
      const receipt = await tx.wait();

      const claimIds = await healthChain.getPatientClaimIds(demoPatientId);
      expect(claimIds.length).to.equal(1);
      const claimId = claimIds[0];

      const claim = await healthChain.getClaim(claimId);
      expect(claim.id).to.equal(claimId);
      expect(claim.policyId).to.equal(policyId);
      expect(claim.patientId).to.equal(demoPatientId);
      expect(claim.amount).to.equal(2500n);
      expect(claim.status).to.equal(0); // 0 = Pending
      expect(claim.description).to.equal("Physiotherapy claim");
    });

    it("should allow approving a pending claim", async function () {
      await healthChain.submitClaim(policyId, demoPatientId, 1500, "Routine checkup");
      const claimId = (await healthChain.getPatientClaimIds(demoPatientId))[0];

      await expect(healthChain.approveClaim(claimId, "Verified against active policy"))
        .to.emit(healthChain, "ClaimStatusUpdated")
        .withArgs(claimId, 1, "Verified against active policy", (ts) => ts > 0); // 1 = Approved

      const claim = await healthChain.getClaim(claimId);
      expect(claim.status).to.equal(1);
      expect(claim.decisionReason).to.equal("Verified against active policy");
    });

    it("should allow rejecting a pending claim", async function () {
      await healthChain.submitClaim(policyId, demoPatientId, 5000, "Dental procedure");
      const claimId = (await healthChain.getPatientClaimIds(demoPatientId))[0];

      await expect(healthChain.rejectClaim(claimId, "Treatment not covered under standard policy"))
        .to.emit(healthChain, "ClaimStatusUpdated")
        .withArgs(claimId, 2, "Treatment not covered under standard policy", (ts) => ts > 0); // 2 = Rejected

      const claim = await healthChain.getClaim(claimId);
      expect(claim.status).to.equal(2);
      expect(claim.decisionReason).to.equal("Treatment not covered under standard policy");
    });

    it("should prevent updating already resolved claims", async function () {
      await healthChain.submitClaim(policyId, demoPatientId, 1000, "Consultation");
      const claimId = (await healthChain.getPatientClaimIds(demoPatientId))[0];

      await healthChain.approveClaim(claimId, "Approved");
      await expect(healthChain.approveClaim(claimId, "Try again")).to.be.revertedWith("Claim is not pending");
      await expect(healthChain.rejectClaim(claimId, "Try reject")).to.be.revertedWith("Claim is not pending");
    });
  });

  describe("6. Wellness Rewards & Idempotency", function () {
    it("should award wellness reward points and accumulate total", async function () {
      expect(await healthChain.getRewardPoints(demoPatientId)).to.equal(0n);

      await expect(healthChain.addRewardPoints(demoPatientId, "2026-09-22", 150))
        .to.emit(healthChain, "RewardPointsAwarded")
        .withArgs(demoPatientId, "2026-09-22", 150, 150, (ts) => ts > 0);

      expect(await healthChain.getRewardPoints(demoPatientId)).to.equal(150n);

      // Award points for another date
      await healthChain.addRewardPoints(demoPatientId, "2026-09-21", 100);
      expect(await healthChain.getRewardPoints(demoPatientId)).to.equal(250n);
    });

    it("should prevent double-awarding for the exact same patient and date", async function () {
      await healthChain.addRewardPoints(demoPatientId, demoDate, 150);

      await expect(
        healthChain.addRewardPoints(demoPatientId, demoDate, 150)
      ).to.be.revertedWith("Reward already awarded for this record");

      expect(await healthChain.getRewardPoints(demoPatientId)).to.equal(150n);
    });
  });
});
