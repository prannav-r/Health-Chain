import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default Hardhat local test account #0 (public test account, strictly for local dev/testing)
const DEFAULT_LOCAL_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const DEFAULT_RPC_URL = 'http://127.0.0.1:8545';

let contractConfig = null;
try {
  const configPath = path.resolve(__dirname, 'config/contractConfig.json');
  if (fs.existsSync(configPath)) {
    contractConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (err) {
  console.warn('Warning: Could not load contractConfig.json:', err.message);
}

class BlockchainService {
  constructor(customConfig = {}) {
    this.rpcUrl = customConfig.rpcUrl || process.env.RPC_URL || DEFAULT_RPC_URL;
    this.contractAddress =
      customConfig.contractAddress ||
      process.env.CONTRACT_ADDRESS ||
      contractConfig?.address ||
      '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    this.abi = customConfig.abi || contractConfig?.abi || [];
    this.privateKey =
      customConfig.privateKey || process.env.PRIVATE_KEY || DEFAULT_LOCAL_PRIVATE_KEY;

    this.provider = customConfig.provider || null;
    this.wallet = customConfig.wallet || null;
    this.contract = customConfig.contract || null;
    this.isInitialized = false;
  }

  /**
   * Initialize provider, wallet signer, and contract instance.
   */
  async init() {
    if (this.contract) {
      this.isInitialized = true;
      return;
    }

    try {
      if (!this.provider) {
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      }
      if (!this.wallet && this.privateKey) {
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
      }
      if (this.wallet && this.contractAddress && this.abi.length > 0) {
        this.contract = new ethers.Contract(this.contractAddress, this.abi, this.wallet);
      }
      this.isInitialized = true;
    } catch (err) {
      console.warn('BlockchainService initialization warning:', err.message);
      this.isInitialized = false;
    }
  }

  /**
   * Return basic contract metadata and connectivity status.
   */
  async getContractInfo() {
    await this.init();
    let isConnected = false;
    let version = null;
    let error = null;

    try {
      if (this.contract) {
        // Quick call to verify connectivity
        version = await this.contract.VERSION();
        isConnected = true;
      }
    } catch (err) {
      error = err.message;
    }

    return {
      connected: isConnected,
      contractAddress: this.contractAddress,
      rpcUrl: this.rpcUrl,
      version: version || '1.0.0',
      network: contractConfig?.network || 'hardhat',
      error: error
    };
  }

  // -------------------------------------------------------------
  // Health Records (Off-chain Hashes)
  // -------------------------------------------------------------

  async addHealthRecord(patientId, date, dataHash, source = 'consensus-v1') {
    await this.init();
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.addHealthRecord(patientId, date, dataHash, source);
    const receipt = await tx.wait();
    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      patientId,
      date,
      dataHash
    };
  }

  async getHealthRecord(patientId, date) {
    await this.init();
    if (!this.contract) throw new Error('Contract not initialized');
    const [dataHash, timestamp, source, exists] = await this.contract.getHealthRecord(
      patientId,
      date
    );
    return {
      patientId,
      date,
      dataHash,
      timestamp: Number(timestamp),
      source,
      exists
    };
  }

  // -------------------------------------------------------------
  // Consent
  // -------------------------------------------------------------

  async grantConsent(patientId, authorizedEntity) {
    await this.init();
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.grantConsent(patientId, authorizedEntity);
    const receipt = await tx.wait();
    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      patientId,
      authorizedEntity,
      consent: true
    };
  }

  async revokeConsent(patientId, authorizedEntity) {
    await this.init();
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.revokeConsent(patientId, authorizedEntity);
    const receipt = await tx.wait();
    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      patientId,
      authorizedEntity,
      consent: false
    };
  }

  async hasConsent(patientId, entity) {
    await this.init();
    if (!this.contract) throw new Error('Contract not initialized');
    const consent = await this.contract.hasConsent(patientId, entity);
    return { patientId, entity, hasConsent: consent };
  }

  // -------------------------------------------------------------
  // Policy & Premium
  // -------------------------------------------------------------

  async calculatePremium(steps, sleepHours) {
    await this.init();
    if (!this.contract) throw new Error('Contract not initialized');
    const premium = await this.contract.calculatePremium(steps, Math.floor(sleepHours));
    return Number(premium);
  }

  async createPolicy(policyId, patientId, premium) {
    await this.init();
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.createPolicy(policyId, patientId, premium);
    const receipt = await tx.wait();
    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      policyId,
      patientId,
      premium
    };
  }

  async getPolicy(policyId) {
    await this.init();
    if (!this.contract) throw new Error('Contract not initialized');
    const [patientId, premium, active, createdAt] = await this.contract.getPolicy(policyId);
    return {
      policyId,
      patientId,
      premium: Number(premium),
      active,
      createdAt: Number(createdAt)
    };
  }

  // -------------------------------------------------------------
  // Claims
  // -------------------------------------------------------------

  async submitClaim(policyId, patientId, amount, description) {
    await this.init();
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.submitClaim(policyId, patientId, amount, description);
    const receipt = await tx.wait();
    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  }

  async approveClaim(claimId, reason = 'Approved by insurer') {
    await this.init();
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.approveClaim(claimId, reason);
    const receipt = await tx.wait();
    return { success: true, txHash: tx.hash, claimId, status: 'Approved', reason };
  }

  async rejectClaim(claimId, reason = 'Rejected by insurer') {
    await this.init();
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.rejectClaim(claimId, reason);
    const receipt = await tx.wait();
    return { success: true, txHash: tx.hash, claimId, status: 'Rejected', reason };
  }

  async getClaim(claimId) {
    await this.init();
    if (!this.contract) throw new Error('Contract not initialized');
    const res = await this.contract.getClaim(claimId);
    const statusMap = ['Pending', 'Approved', 'Rejected'];
    return {
      id: Number(res.id),
      policyId: res.policyId,
      patientId: res.patientId,
      amount: Number(res.amount),
      description: res.description,
      status: statusMap[Number(res.status)],
      timestamp: Number(res.timestamp),
      decisionReason: res.decisionReason
    };
  }

  // -------------------------------------------------------------
  // Wellness Rewards
  // -------------------------------------------------------------

  async addRewardPoints(patientId, date, points) {
    await this.init();
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.addRewardPoints(patientId, date, points);
    const receipt = await tx.wait();
    const currentPoints = await this.getRewardPoints(patientId);
    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      patientId,
      date,
      pointsAwarded: points,
      totalPoints: currentPoints
    };
  }

  async getRewardPoints(patientId) {
    await this.init();
    if (!this.contract) throw new Error('Contract not initialized');
    const pts = await this.contract.getRewardPoints(patientId);
    return Number(pts);
  }

  async isRewardProcessed(patientId, date) {
    await this.init();
    if (!this.contract) return false;
    try {
      return await this.contract.isRewardProcessed(patientId, date);
    } catch {
      return false;
    }
  }
}

// Export singleton instance for default application use
const defaultBlockchainService = new BlockchainService();
export { BlockchainService };
export default defaultBlockchainService;
