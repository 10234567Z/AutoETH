import hre from "hardhat";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

async function main() {
  console.log("🚀 Deploying to Sepolia Testnet...\n");

  // Get artifacts
  const poiTokenArtifact = await hre.artifacts.readArtifact("POIToken");
  const proofOfIntelligenceArtifact = await hre.artifacts.readArtifact("ProofOfIntelligence");
  
  // Setup wallet
  const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Set SEPOLIA_PRIVATE_KEY environment variable");
  }
  
  const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}`);
  
  // Use Alchemy for reliable Sepolia RPC
  const ALCHEMY_RPC = "https://eth-sepolia.g.alchemy.com/v2/FTdaypPQy2TZuLJhehmqRullM2x0dJPJ";
  
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(ALCHEMY_RPC),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(ALCHEMY_RPC),
  });

  console.log("📍 Deploying from:", account.address);
  
  // Get balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("💰 Balance:", (Number(balance) / 1e18).toFixed(4), "ETH\n");

  // Step 1: Deploy POIToken
  console.log("📤 Deploying POIToken...");
  
  const poiTokenHash = await walletClient.deployContract({
    abi: poiTokenArtifact.abi,
    bytecode: poiTokenArtifact.bytecode,
  });

  console.log("📤 Transaction sent:", poiTokenHash);
  console.log("⏳ Waiting for confirmation...\n");

  const poiTokenReceipt = await publicClient.waitForTransactionReceipt({ hash: poiTokenHash });

  console.log("✅ POIToken deployed!");
  console.log("📍 POIToken Address:", poiTokenReceipt.contractAddress);
  console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${poiTokenReceipt.contractAddress}`);
  console.log("🔗 Transaction:", `https://sepolia.etherscan.io/tx/${poiTokenHash}\n`);

  // Step 2: Deploy ProofOfIntelligence with POIToken address
  console.log("📤 Deploying ProofOfIntelligence...");
  
  const proofOfIntelligenceHash = await walletClient.deployContract({
    abi: proofOfIntelligenceArtifact.abi,
    bytecode: proofOfIntelligenceArtifact.bytecode,
    args: [poiTokenReceipt.contractAddress],
  });

  console.log("📤 Transaction sent:", proofOfIntelligenceHash);
  console.log("⏳ Waiting for confirmation...\n");

  const receipt = await publicClient.waitForTransactionReceipt({ hash: proofOfIntelligenceHash });

  console.log("✅ ProofOfIntelligence deployed!");
  console.log("📍 Contract Address:", receipt.contractAddress);
  console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${receipt.contractAddress}`);
  console.log("🔗 Transaction:", `https://sepolia.etherscan.io/tx/${proofOfIntelligenceHash}\n`);
  
  // Step 3: Set ProofOfIntelligence contract in POIToken
  console.log("🔗 Linking contracts...");
  
  const linkHash = await walletClient.writeContract({
    address: poiTokenReceipt.contractAddress,
    abi: poiTokenArtifact.abi,
    functionName: 'setProofOfIntelligenceContract',
    args: [receipt.contractAddress],
  });
  
  console.log("📤 Transaction sent:", linkHash);
  console.log("⏳ Waiting for confirmation...\n");
  
  await publicClient.waitForTransactionReceipt({ hash: linkHash });
  
  console.log("✅ Contracts linked!\n");
  
  console.log("📋 Update these addresses in your code:");
  console.log(`   - POI_TOKEN_ADDRESS = "${poiTokenReceipt.contractAddress}"`);
  console.log(`   - CONTRACT_ADDRESS = "${receipt.contractAddress}"`);
  console.log(`   - backend/judging_agent.py: CONTRACT_ADDRESS = "${receipt.contractAddress}"`);
  console.log(`   - backend/main.py: CONTRACT_ADDRESS = "${receipt.contractAddress}"`);
  console.log(`   - hardhat_contract/scripts/test-contract.mjs: CONTRACT_ADDRESS = "${receipt.contractAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
