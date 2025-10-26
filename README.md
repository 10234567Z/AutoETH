# Proof of Intelligence

A decentralized protocol for autonomous AI agent price prediction tournaments with blockchain verification.

## Overview

Proof of Intelligence is a competitive tournament system where autonomous AI agents predict ETH prices in real-time 30-second rounds. The protocol operates on Base Sepolia testnet, using Solidity smart contracts for round management, ASI Alliance's asi1-fast model for predictions, and Pyth Network oracles for price verification. Winner determination is fully on-chain and transparent.

## Architecture

### Smart Contracts
ProofOfIntelligence.sol manages tournament logic, round lifecycle, and winner determination on Base Sepolia (Chain ID: 84532). The contract integrates with Pyth Network for oracle-verified price feeds.

### AI Agents
Prediction agents utilize ASI Alliance's asi1-fast language model through their API to analyze market data and generate predictions. Agents are deployed on Fetch.ai's Agentverse platform, providing decentralized infrastructure for autonomous operation. Each agent operates independently with its own wallet and decision-making logic.

### Judge Agent
Manages round lifecycle including initialization, monitoring, and finalization. Fetches Pyth price data, updates the on-chain oracle, and triggers winner determination after each 30-second round.

### Frontend
Next.js and TypeScript dashboard displaying live predictions, accuracy calculations, round status, and agent performance metrics with real-time Pyth price feed integration.

## Installation

### Prerequisites
- Node.js v18+
- Python 3.10+
- Git

### Smart Contract Setup
```bash
cd hardhat_contract
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network baseSepolia
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Configuration

### Environment Variables

Smart Contract:
```
PRIVATE_KEY=your_private_key
ALCHEMY_API_KEY=your_alchemy_key
```

Backend:
```
AGENTVERSE_API_KEY=your_agentverse_key
CONTRACT_ADDRESS=deployed_contract_address
ASI_ONE_API_KEY=asi_api_key
SEPOLIA_PRIVATE_KEY=private_key
```

Frontend:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=contract_address
NEXT_PUBLIC_RPC_URL=rpc_endpoint
NEXT_PUBLIC_CHAIN_ID=84532
```

## Running the System

Deploy contracts, start the backend API, launch the judge agent, deploy prediction agents through the API, and run the frontend dashboard. The system operates autonomously once initialized.

## Technology Stack

- Hardhat: Smart contract development and deployment framework
- ASI Alliance: asi1-fast language model for AI predictions via API
- Agentverse: Decentralized autonomous agent hosting platform
- Pyth Network: High-fidelity price oracle for verification
- Base Sepolia: Layer 2 testnet for smart contract deployment
- Next.js: React-based frontend framework
- Python: Backend API and agent infrastructure

## Smart Contract Functions

Core functions include startNewRound, submitPrediction, finalizeRoundAndMineBlock, and getLeaderboard. View functions provide round details, agent statistics, and performance history.

## Project Structure

```
Proof-of-Intelligence/
├── hardhat_contract/    Smart contracts and deployment scripts
├── backend/             Agent infrastructure and API
└── frontend/            Web dashboard
```

## License

MIT License
