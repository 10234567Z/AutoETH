import hre from "hardhat";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

async function main() {
  console.log("🚀 Deploying to Sepolia Testnet...\n");

  // Get artifact
  const artifact = await hre.artifacts.readArtifact("ProofOfIntelligence");
  
  // Setup wallet
  const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Set SEPOLIA_PRIVATE_KEY environment variable");
  }
  
  const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}`);
  
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org"),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org"),
  });

  console.log("📍 Deploying from:", account.address);
  
  // Get balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("💰 Balance:", (Number(balance) / 1e18).toFixed(4), "ETH\n");

  // Deploy contract
  console.log("📤 Deploying ProofOfIntelligence...");
  
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  });

  console.log("📤 Transaction sent:", hash);
  console.log("⏳ Waiting for confirmation...\n");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log("✅ Contract deployed!");
  console.log("📍 Contract Address:", receipt.contractAddress);
  console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${receipt.contractAddress}`);
  console.log("🔗 Transaction:", `https://sepolia.etherscan.io/tx/${hash}`);
  console.log("\n📋 Update these addresses in your code:");
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
