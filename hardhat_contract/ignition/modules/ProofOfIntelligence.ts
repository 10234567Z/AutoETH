import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Ignition module for deploying ProofOfIntelligence contract
 * 
 * Deploy with:
 * npx hardhat ignition deploy ignition/modules/ProofOfIntelligence.ts --network hederaTestnet
 */

const ProofOfIntelligenceModule = buildModule("ProofOfIntelligence", (m) => {
  // Deploy the contract (constructor takes no parameters)
  const proofOfIntelligence = m.contract("ProofOfIntelligence");

  // Return the contract instance
  return { proofOfIntelligence };
});

export default ProofOfIntelligenceModule;
