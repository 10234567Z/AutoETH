import hre from "hardhat";
import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";

const hederaTestnet = defineChain({
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.hashio.io/api"] },
  },
  blockExplorers: {
    default: { name: "Hashscan", url: "https://hashscan.io/testnet" },
  },
});

async function main() {
  console.log("🚀 Deploying to Hedera Testnet...\n");

  // Get artifact
  const artifact = await hre.artifacts.readArtifact("ProofOfIntelligence");
  
  // Setup wallet
  const privateKey = process.env.HEDERA_TESTNET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Set HEDERA_TESTNET_PRIVATE_KEY environment variable");
  }
  
  const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}`);
  const client = createWalletClient({
    account,
    chain: hederaTestnet,
    transport: http(),
  });
  
  const publicClient = createPublicClient({
    chain: hederaTestnet,
    transport: http(),
  });

  console.log("📋 Deployer:", account.address);
  
  // Deploy
  const hash = await client.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  });
  
  console.log("📤 Deploy tx:", hash);
  console.log("⏳ Waiting for confirmation...");
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  console.log("✅ Contract deployed!");
  console.log("📍 Address:", receipt.contractAddress);
  console.log("🔗 Explorer: https://hashscan.io/testnet/contract/" + receipt.contractAddress);
}

main().catch(console.error);
