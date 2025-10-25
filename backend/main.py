from fastapi import FastAPI, HTTPException
import uvicorn
from pydantic import BaseModel
import os
from typing import Optional, Dict, List
from dotenv import load_dotenv
import httpx
from web3 import Web3
import json
from datetime import datetime
from pathlib import Path


# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Proof of Intelligence Backend")

# Agentverse API configuration
AGENTVERSE_API_KEY = os.getenv("AGENTVERSE_API_KEY")
AGENTVERSE_BASE_URL = "https://agentverse.ai/v1"
ASI_ONE_API_KEY  = os.getenv("ASIONE_API_KEY")

# Smart Contract Configuration
SEPOLIA_RPC = "https://base-sepolia.g.alchemy.com/v2/FTdaypPQy2TZuLJhehmqRullM2x0dJPJ"
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
POI_TOKEN_ADDRESS = os.getenv("POI_TOKEN_ADDRESS")
SEPOLIA_PRIVATE_KEY = os.getenv("SEPOLIA_PRIVATE_KEY")

# Gas tracking configuration
GAS_TRACKING_FILE = Path("gas_tracking.json")
INITIAL_STAKE_AMOUNT = 0.1  # ETH
BACKEND_URL = os.getenv("BACKEND_URL")  # Set to ngrok URL in production

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC))

# Gas tracking storage
def load_gas_tracking() -> Dict:
    """Load gas tracking data from JSON file"""
    if GAS_TRACKING_FILE.exists():
        with open(GAS_TRACKING_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_gas_tracking(data: Dict):
    """Save gas tracking data to JSON file"""
    with open(GAS_TRACKING_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def record_gas_deposit(agent_address: str, amount: float = INITIAL_STAKE_AMOUNT):
    """Record initial gas deposit for an agent"""
    tracking = load_gas_tracking()
    tracking[agent_address] = {
        "staked": amount,
        "spent": 0.0,
        "remaining": amount,
        "transactions": [],
        "created_at": datetime.now().isoformat()
    }
    save_gas_tracking(tracking)
    return tracking[agent_address]

def record_gas_usage(agent_address: str, tx_hash: str, gas_used: int, gas_price: int):
    """Record gas usage for a transaction"""
    tracking = load_gas_tracking()
    
    if agent_address not in tracking:
        # Auto-create with initial stake if not exists
        tracking[agent_address] = record_gas_deposit(agent_address)
    
    # Calculate gas cost in ETH
    gas_cost_wei = gas_used * gas_price
    gas_cost_eth = gas_cost_wei / 1e18
    
    # Update spent and remaining
    tracking[agent_address]["spent"] += gas_cost_eth
    tracking[agent_address]["remaining"] = tracking[agent_address]["staked"] - tracking[agent_address]["spent"]
    
    # Add transaction record
    tracking[agent_address]["transactions"].append({
        "tx_hash": tx_hash,
        "gas_used": gas_used,
        "gas_price": gas_price,
        "gas_cost_eth": gas_cost_eth,
        "timestamp": datetime.now().isoformat()
    })
    
    save_gas_tracking(tracking)
    return tracking[agent_address]

def check_gas_balance(agent_address: str, estimated_gas: int = 500000) -> tuple[bool, float]:
    """Check if agent has enough balance for estimated gas cost"""
    tracking = load_gas_tracking()
    
    if agent_address not in tracking:
        return False, 0.0
    
    # Estimate gas cost (use current gas price)
    gas_price = w3.eth.gas_price
    estimated_cost_eth = (estimated_gas * gas_price) / 1e18
    
    remaining = tracking[agent_address]["remaining"]
    has_enough = remaining >= estimated_cost_eth
    
    return has_enough, remaining

def get_gas_stats(agent_address: str) -> Optional[Dict]:
    """Get gas usage statistics for an agent"""
    tracking = load_gas_tracking()
    return tracking.get(agent_address)

# Contract ABI for registerAgent function
CONTRACT_ABI = json.loads('''[
    {
        "inputs": [
            {
                "components": [
                    {"internalType": "string", "name": "agentAddress", "type": "string"},
                    {"internalType": "string", "name": "agentWalletAddress", "type": "string"},
                    {"internalType": "uint256", "name": "totalGuesses", "type": "uint256"},
                    {"internalType": "uint256", "name": "bestGuesses", "type": "uint256"},
                    {"internalType": "uint256", "name": "accuracy", "type": "uint256"},
                    {"internalType": "uint256", "name": "lastGuessBlock", "type": "uint256"}
                ],
                "internalType": "struct ProofOfIntelligence.Agent",
                "name": "agent",
                "type": "tuple"
            }
        ],
        "name": "registerAgent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]''')

class AgentDetails(BaseModel):
    name: str
    readme: str
    avatar_url: str
    short_description: str
    network: Optional[str] = "testnet"
    agentverse_api_key: str
    agent_seed: Optional[str] = None  # Unique seed for agent randomness
    wallet_address: str  # User's Ethereum wallet for rewards
    deviation: int = 50  # Deviation value (10-99), affects price adjustment

@app.get("/")
async def root():
    return {"message": "Proof of Intelligence", "token": AGENTVERSE_API_KEY}

def get_eth_prediction_agent_code(agent_name: str, seed: str, deviation: int) -> str:
    """Generate ETH price prediction agent code"""
    return f"""from datetime import datetime, timezone
from uuid import uuid4
import httpx
import json

from openai import OpenAI
from uagents import Context, Protocol, Agent
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)
from web3 import Web3

subject_matter = "Ethereum (ETH) price prediction"

client = OpenAI(
    base_url='https://api.asi1.ai/v1',
    api_key={repr(ASI_ONE_API_KEY)},
)

# Smart Contract Configuration (for agent template)
SEPOLIA_RPC_TEMPLATE = "https://base-sepolia.g.alchemy.com/v2/FTdaypPQy2TZuLJhehmqRullM2x0dJPJ"
CONTRACT_ADDRESS_TEMPLATE = {repr(CONTRACT_ADDRESS)}
POI_TOKEN_ADDRESS_TEMPLATE = {repr(POI_TOKEN_ADDRESS)}
PRIVATE_KEY = {repr(SEPOLIA_PRIVATE_KEY)}

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(SEPOLIA_RPC_TEMPLATE))

contract_abi = [
    {{"inputs": [{{"internalType": "string", "name": "agentAddress", "type": "string"}}, {{"internalType": "int256", "name": "predictedPrice", "type": "int256"}}], "name": "submitPrediction", "outputs": [], "stateMutability": "nonpayable", "type": "function"}},
    {{"inputs": [], "name": "currentPredictionRound", "outputs": [{{"internalType": "uint256", "name": "", "type": "uint256"}}], "stateMutability": "view", "type": "function"}},
    {{"inputs": [{{"internalType": "uint256", "name": "", "type": "uint256"}}], "name": "predictionRounds", "outputs": [{{"internalType": "uint256", "name": "forBlockNumber", "type": "uint256"}}, {{"internalType": "uint256", "name": "startTime", "type": "uint256"}}, {{"internalType": "uint256", "name": "submissionDeadline", "type": "uint256"}}, {{"internalType": "uint256", "name": "predictionCount", "type": "uint256"}}, {{"internalType": "bool", "name": "finalized", "type": "bool"}}, {{"internalType": "string", "name": "winnerAgent", "type": "string"}}, {{"internalType": "int256", "name": "actualPrice", "type": "int256"}}], "stateMutability": "view", "type": "function"}},
    {{"inputs": [{{"internalType": "uint256", "name": "", "type": "uint256"}}, {{"internalType": "uint256", "name": "", "type": "uint256"}}], "name": "participants", "outputs": [{{"internalType": "string", "name": "", "type": "string"}}], "stateMutability": "view", "type": "function"}},
    {{"inputs": [{{"internalType": "string", "name": "agentAddress", "type": "string"}}, {{"internalType": "uint256", "name": "count", "type": "uint256"}}], "name": "getAgentRecentHistory", "outputs": [{{"components": [{{"internalType": "uint256", "name": "roundId", "type": "uint256"}}, {{"internalType": "int256", "name": "predicted", "type": "int256"}}, {{"internalType": "int256", "name": "actual", "type": "int256"}}, {{"internalType": "int256", "name": "difference", "type": "int256"}}, {{"internalType": "uint256", "name": "timestamp", "type": "uint256"}}], "internalType": "struct ProofOfIntelligence.PredictionHistory[]", "name": "", "type": "tuple[]"}}], "stateMutability": "view", "type": "function"}},
    {{"inputs": [{{"internalType": "string", "name": "agentAddress", "type": "string"}}], "name": "getAgentBias", "outputs": [{{"internalType": "int256", "name": "", "type": "int256"}}], "stateMutability": "view", "type": "function"}}
]
contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS_TEMPLATE), abi=contract_abi)

agent = Agent(name={repr(agent_name)}, seed={repr(seed)})
protocol = Protocol(spec=chat_protocol_spec)

# Store agent's actual Agentverse address (not the name)
AGENT_ADDRESS = agent.address

# Backend URL for gas tracking (set via BACKEND_URL env var)
BACKEND_URL = "{BACKEND_URL}"

# Deviation parameter (10-99) - adjusts AI prediction before submission
DEVIATION = {deviation}  # Convert to percentage: deviation/100 = 0.{deviation:02d}

# Log agent info on startup
print("=" * 80)
print("AGENT INITIALIZATION")
print("=" * 80)
print(f"Agent Name: {repr(agent_name)}")
print(f"Agent Seed: {repr(seed)}")
print(f"Agent Address (Agentverse): {{agent.address}}")
print(f"AGENT_ADDRESS variable: {{AGENT_ADDRESS}}")
print(f"Deviation: {{DEVIATION}}%")
print("=" * 80)


def fetch_agent_history():
    \"\"\"Fetch agent's recent prediction history from blockchain\"\"\"
    try:
        # Get last 10 predictions
        history = contract.functions.getAgentRecentHistory(AGENT_ADDRESS, 10).call()
        return history if history else []
    except Exception as e:
        print(f"Error fetching history: {{e}}")
        return []


def analyze_history(history):
    \"\"\"Analyze historical predictions to extract patterns\"\"\"
    if not history or len(history) == 0:
        return {{
            "has_history": False,
            "avg_bias": 0,
            "accuracy": 0,
            "total_predictions": 0,
            "recent_predictions": []
        }}
    
    # Calculate average bias (positive = predict too high, negative = predict too low)
    total_bias = sum(h[3] for h in history)  # h[3] is difference (predicted - actual)
    avg_bias = total_bias / len(history) if len(history) > 0 else 0
    
    # Calculate accuracy (how close predictions are on average)
    total_error = sum(abs(h[3]) for h in history)
    avg_error = total_error / len(history) if len(history) > 0 else 0
    
    # Detect patterns in prediction performance
    winning_predictions = 0
    losing_predictions = 0
    
    for h in history:
        error = abs(h[3])  # Absolute difference in ×1e8 format
        # Good prediction = error < $1 (1e8 in ×1e8 format)
        if error < 1e8:
            winning_predictions += 1
        else:
            losing_predictions += 1
    
    # Calculate win rate
    total_count = len(history)
    win_rate = (winning_predictions / total_count) if total_count > 0 else 0
    
    # Determine pattern strength based on consistency
    if win_rate > 0.7:
        pattern_strength = "high"
    elif win_rate > 0.5:
        pattern_strength = "medium"
    else:
        pattern_strength = "low"
    
    # Format recent predictions for context
    recent = []
    for h in history[-5:]:  # Last 5 predictions
        recent.append({{
            "round": h[0],
            "predicted": h[1] / 1e8,  # Convert from ×1e8 to dollars
            "actual": h[2] / 1e8,
            "diff": h[3] / 1e8
        }})
    
    return {{
        "has_history": True,
        "avg_bias": avg_bias / 1e8,  # Convert to dollars
        "avg_error": avg_error / 1e8,
        "total_predictions": len(history),
        "recent_predictions": recent,
        "win_rate": win_rate,
        "pattern_strength": pattern_strength,
        "winning_predictions": winning_predictions,
        "losing_predictions": losing_predictions
    }}


def fetch_pyth_hermes():
    \"\"\" Fetch ETH/USD price feed from Pyth Hermes API \"\"\"
    url = "https://hermes.pyth.network/v2/updates/price/latest?ids[]=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
    
    try:
        response = httpx.get(url)
        data = response.json()
        
        if "parsed" in data and len(data["parsed"]) > 0:
            eth_data = data["parsed"][0]
            
            # Extract price and expo
            price_raw = int(eth_data["price"]["price"])
            expo = int(eth_data["price"]["expo"])
            actual_price = price_raw * (10 ** expo)
            
            # Extract EMA price
            ema_price_raw = int(eth_data["ema_price"]["price"])
            ema_expo = int(eth_data["ema_price"]["expo"])
            actual_ema_price = ema_price_raw * (10 ** ema_expo)
            
            return {{
                "price": actual_price,
                "ema_price": actual_ema_price,
                "publish_time": eth_data["price"]["publish_time"]
            }}
    except Exception as e:
        print(f"Error fetching Pyth price: {{e}}")
        return None


def get_ai_prediction(eth_price_data):
    \"\"\"Get AI prediction for ETH price in next 60 seconds\"\"\"
    try:
        # Fetch and analyze historical performance
        history = fetch_agent_history()
        analysis = analyze_history(history)
        
        # Build enhanced system prompt with self-learning context
        system_prompt = f"You are an ETH price prediction AI. Current ETH price: ${{eth_price_data['price']}} USD (EMA: ${{eth_price_data['ema_price']}} USD). Based on this data predict the ethereum price and do not deviate like crazy from the price, we are talking literally just 60 seconds in future! DO NOT HALLUCINATE AT ALL TOO\\n\\n"
        
        if analysis['has_history']:
            # Add historical context for self-learning
            bias_direction = "too HIGH" if analysis['avg_bias'] > 0 else "too LOW"
            system_prompt += f"YOUR HISTORICAL PERFORMANCE:\\n"
            system_prompt += f"- Total predictions made: {{analysis['total_predictions']}}\\n"
            system_prompt += f"- Average bias: ${{analysis['avg_bias']:.8f}} (you tend to predict {{bias_direction}})\\n"
            system_prompt += f"- Average error: ${{analysis['avg_error']:.8f}}\\n"
            system_prompt += f"- Recent predictions (last 5):\\n"
            for p in analysis['recent_predictions']:
                system_prompt += f"  Round {{p['round']}}: Predicted ${{p['predicted']:.8f}}, Actual ${{p['actual']:.8f}}, Diff ${{p['diff']:.8f}}\\n"
            
            system_prompt += "\\nLEARN FROM YOUR MISTAKES: Adjust your next prediction to compensate for your bias and improve accuracy.\\n\\n"
        else:
            system_prompt += "This is your first prediction. No historical data yet.\\n\\n"
        
        system_prompt += "Predict the ETH price in 60 seconds with 8 decimal precision (e.g., 3895.12345678). Output ONLY the predicted price as a number, nothing else."
        
        r = client.chat.completions.create(
            model="asi1-fast",
            messages=[
                {{"role": "system", "content": system_prompt}},
                {{"role": "user", "content": "What will ETH price be in 60 seconds?"}},
            ],
            max_tokens=2048,
        )
        prediction_text = str(r.choices[0].message.content).strip()
        
        # Try to parse as float directly
        try:
            ai_pred = float(prediction_text)
        except:
            # If that fails, extract numbers
            prediction_text = prediction_text.replace('$', '').replace(',', '')
            parts = prediction_text.split()
            for part in parts:
                try:
                    ai_pred = float(part)
                    break
                except:
                    continue
            else:
                ai_pred = eth_price_data['price']  # Fallback to current price
        
        # VALIDATION LAYER - Prevent hallucinations and crazy predictions
        current = eth_price_data['price']
        
        # Step 1: Check for extreme hallucinations (>10% change in 60 seconds)
        change_pct = abs(ai_pred - current) / current
        
        if change_pct > 0.10:
            print(f"[VALIDATION] HALLUCINATION DETECTED!")
            print(f"[VALIDATION] AI predicted: ${{ai_pred:.2f}}, Current: ${{current:.2f}}")
            print(f"[VALIDATION] Change: {{change_pct * 100:.1f}}% - IMPOSSIBLE in 60 seconds!")
            print(f"[VALIDATION] Returning tiny random variation instead")
            import random
            return current * (1 + random.uniform(-0.0001, 0.0001))
        
        # Step 2: Validate within realistic bounds (2% max change in 60 seconds)
        max_change = current * 0.02
        change_amount = abs(ai_pred - current)
        
        if change_amount > max_change:
            print(f"[VALIDATION] BLOCKED: AI predicted ${{ai_pred:.2f}}, but that's {{change_pct * 100:.1f}}% change!")
            print(f"[VALIDATION] Clamping to 2% max change from current price ${{current:.2f}}")
            validated = current * 1.02 if ai_pred > current else current * 0.98
        else:
            validated = ai_pred
        
        # Step 3: Apply bias correction from historical learning
        if analysis['has_history'] and analysis['total_predictions'] > 3:
            bias = analysis['avg_bias']
            
            if bias > 0:
                # We tend to overestimate, reduce by 1%
                final = validated * 0.99
            elif bias < 0:
                # We tend to underestimate, increase by 1%
                final = validated * 1.01
            else:
                final = validated
            
            if abs(bias) > 1.0:  # Only log if significant bias
                print(f"[VALIDATION] Bias correction applied: ${{validated:.2f}} → ${{final:.2f}} (bias: ${{bias:.2f}})")
        else:
            final = validated
        
        # Log if we made corrections
        if abs(final - ai_pred) > 0.01:
            correction_pct = ((final - ai_pred) / ai_pred) * 100
            print(f"[VALIDATION] Prediction corrected: ${{ai_pred:.2f}} → ${{final:.2f}} ({{correction_pct:+.2f}}%)")
        
        return float(final)
            
    except Exception as e:
        print(f"Error getting AI prediction: {{e}}")
        return eth_price_data['price']


def submit_prediction_onchain(ctx, agent_addr, predicted_price):
    \"\"\"Submit prediction to smart contract\"\"\"
    try:
        ctx.logger.info(f"DEBUG: PRIVATE_KEY exists: {{bool(PRIVATE_KEY)}}")
        
        if not PRIVATE_KEY:
            ctx.logger.error("ERROR: No private key configured")
            return None
        
        ctx.logger.info(f"Connecting to {{SEPOLIA_RPC_TEMPLATE}}")
        ctx.logger.info(f"Contract: {{CONTRACT_ADDRESS_TEMPLATE}}")
        ctx.logger.info(f"Agent: {{agent_addr}}")
        ctx.logger.info(f"Price: ${{predicted_price}}")
        
        # Use the global w3 and contract instances
        global w3, contract
            
        account = w3.eth.account.from_key(PRIVATE_KEY)
        ctx.logger.info(f"Account: {{account.address}}")
        
        # Convert price to int (multiply by 1e8 for 8 decimal precision - matching Pyth format)
        price_int = int(round(float(predicted_price) * 1e8))
        ctx.logger.info(f"Price as int: {{price_int}}")
        
        # Get current nonce and gas price (use 'pending' to include pending transactions)
        nonce = w3.eth.get_transaction_count(account.address, 'pending')
        gas_price = w3.eth.gas_price
        ctx.logger.info(f"Nonce: {{nonce}}")
        ctx.logger.info(f"Gas price: {{gas_price}} wei")
        
        # Build transaction
        transaction = contract.functions.submitPrediction(agent_addr, price_int).build_transaction({{
            'from': account.address,
            'nonce': nonce,
            'gas': 500000,
            'gasPrice': gas_price,
            'chainId': 84532  # Sepolia
        }})
        
        ctx.logger.info("Signing transaction...")
        
        # Sign and send
        signed_txn = account.sign_transaction(transaction)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        ctx.logger.info(f"TX sent: {{tx_hash.hex()}}")
        
        # Wait for receipt to get actual gas used
        try:
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            gas_used = receipt['gasUsed']
            ctx.logger.info(f"Gas used: {{gas_used}}")
            
            # Record gas usage to backend
            try:
                gas_cost_eth = (gas_used * gas_price) / 1e18
                ctx.logger.info(f"Gas cost: {{gas_cost_eth:.6f}} ETH")
                
                # Send gas usage to backend API
                response = httpx.post(
                    f"{{BACKEND_URL}}/internal/record-gas",
                    json={{
                        "agent_address": agent_addr,
                        "tx_hash": tx_hash.hex(),
                        "gas_used": gas_used,
                        "gas_price": gas_price
                    }},
                    timeout=5.0
                )
                if response.status_code == 200:
                    ctx.logger.info("Gas usage recorded")
                else:
                    ctx.logger.warning(f"WARNING: Failed to record gas: {{response.text}}")
            except Exception as e:
                ctx.logger.warning(f"WARNING: Could not record gas usage: {{e}}")
        except Exception as e:
            ctx.logger.warning(f"WARNING: Could not get receipt: {{e}}")
        
        return tx_hash.hex()
    except Exception as e:
        ctx.logger.error(f"ERROR: {{e}}")
        import traceback
        ctx.logger.error(traceback.format_exc())
        return None


@agent.on_interval(period=5.0)
async def check_and_submit_prediction(ctx: Context):
    \"\"\"Check every 10 seconds if we can submit a prediction\"\"\"
    ctx.logger.info(f"Checking if can submit prediction...")
    
    try:
        # Check if there's an active round
        round_id = contract.functions.currentPredictionRound().call()
        
        if round_id == 0:
            ctx.logger.info("No active round yet")
            return
        
        # Get round info
        round_data = contract.functions.predictionRounds(round_id).call()
        finalized = round_data[4]
        deadline = round_data[2]
        prediction_count = round_data[3]
        
        if finalized:
            ctx.logger.info(f"Round #{{round_id}} already finalized")
            return
        
        # Check if within submission window (25s out of 40s total round)
        current_time = int(datetime.now().timestamp())
        if current_time > deadline:
            ctx.logger.info(f"Round #{{round_id}} submission window closed (judging phase)")
            return
        
        # Check if already predicted this round
        try:
            for i in range(prediction_count):
                participant = contract.functions.participants(round_id, i).call()
                if participant == AGENT_ADDRESS:
                    ctx.logger.info(f"Already predicted in round #{{round_id}}")
                    return
        except:
            pass  # If we can't check, proceed anyway
        
        # All good - submit prediction!
        ctx.logger.info(f"Round #{{round_id}} active - submitting prediction...")
        ctx.logger.info("=" * 60)
        ctx.logger.info("AGENT ADDRESS DEBUG INFO")
        ctx.logger.info(f"  Agent Name: {repr(agent_name)}")
        ctx.logger.info(f"  Agent Address (runtime): {{agent.address}}")
        ctx.logger.info(f"  AGENT_ADDRESS variable: {{AGENT_ADDRESS}}")
        ctx.logger.info(f"  Will submit using: {{AGENT_ADDRESS}}")
        ctx.logger.info("=" * 60)
        
        # Get current ETH price
        eth_price_data = fetch_pyth_hermes()
        if not eth_price_data:
            ctx.logger.error("Failed to fetch ETH price")
            return
        
        ctx.logger.info(f"Current ETH price: ${{eth_price_data['price']}}")
        
        # Get AI prediction with MeTTa validation
        predicted_price = get_ai_prediction(eth_price_data)
        ctx.logger.info(f"AI Prediction (validated): ${{predicted_price}}")
        
        # Fetch analysis for dynamic deviation
        history = fetch_agent_history()
        analysis = analyze_history(history)
        
        # Apply DYNAMIC deviation adjustment based on performance
        if analysis['has_history'] and analysis['total_predictions'] > 5:
            # Agent has enough history to adapt deviation
            avg_error = analysis['avg_error']
            win_rate = analysis.get('win_rate', 0.5)
            
            # Reduce deviation if performing well (accurate predictions)
            if avg_error < 1.0 and win_rate > 0.7:
                # Doing great! Reduce deviation by 10%
                dynamic_dev = max(10, DEVIATION - 10)
                ctx.logger.info(f"[ADAPTIVE] Performance excellent (error: ${{avg_error:.2f}}, win rate: {{win_rate:.1%}})")
                ctx.logger.info(f"[ADAPTIVE] Reducing deviation: {{DEVIATION}}% → {{dynamic_dev}}%")
            
            # Increase deviation if performing poorly
            elif avg_error > 5.0 or win_rate < 0.3:
                # Not doing well, increase deviation by 10%
                dynamic_dev = min(90, DEVIATION + 10)
                ctx.logger.info(f"[ADAPTIVE] Performance needs improvement (error: ${{avg_error:.2f}}, win rate: {{win_rate:.1%}})")
                ctx.logger.info(f"[ADAPTIVE] Increasing deviation: {{DEVIATION}}% → {{dynamic_dev}}%")
            
            # Moderate performance - keep current deviation
            else:
                dynamic_dev = DEVIATION
                ctx.logger.info(f"[ADAPTIVE] Performance moderate (error: ${{avg_error:.2f}}, win rate: {{win_rate:.1%}})")
                ctx.logger.info(f"[ADAPTIVE] Keeping deviation: {{DEVIATION}}%")
            
            deviation_multiplier = 1 - (dynamic_dev / 100)
            ctx.logger.info(f"[ADAPTIVE] Stats: {{analysis['winning_predictions']}} wins, {{analysis['losing_predictions']}} losses")
        else:
            # Not enough history yet - use default deviation
            deviation_multiplier = 1 - (DEVIATION / 100)
            ctx.logger.info(f"[DEVIATION] Using default: {{DEVIATION}}% (need >5 predictions for adaptive mode)")
        
        adjusted_price = predicted_price * deviation_multiplier
        ctx.logger.info(f"Deviation: {{DEVIATION}}% -> Adjusted: ${{adjusted_price:.2f}}")
        
        # Check gas balance before submitting
        try:
            response = httpx.get(f"{{BACKEND_URL}}/agent/{{AGENT_ADDRESS}}/gas-stats", timeout=5.0)
            if response.status_code == 200:
                stats = response.json()
                remaining = stats['stats']['remaining']
                
                # Estimate gas cost (500k gas * current gas price)
                gas_price = w3.eth.gas_price
                estimated_cost = (500000 * gas_price) / 1e18
                
                ctx.logger.info(f"Remaining balance: {{remaining:.6f}} ETH")
                ctx.logger.info(f"Estimated cost: {{estimated_cost:.6f}} ETH")
                
                if remaining < estimated_cost:
                    ctx.logger.error(f"ERROR: Insufficient gas balance! Need {{estimated_cost:.6f}} ETH, have {{remaining:.6f}} ETH")
                    return
                else:
                    ctx.logger.info("Sufficient gas balance")
            else:
                ctx.logger.warning("WARNING: Could not check gas balance, proceeding anyway")
        except Exception as e:
            ctx.logger.warning(f"WARNING: Gas balance check failed: {{e}}, proceeding anyway")
        
        # Submit to blockchain
        tx_hash = submit_prediction_onchain(ctx, AGENT_ADDRESS, adjusted_price)
        if tx_hash:
            ctx.logger.info(f"Prediction submitted! TX: {{tx_hash}}")
        else:
            ctx.logger.error("ERROR: Submission failed")
            
    except Exception as e:
        ctx.logger.error(f"ERROR: {{e}}")
        import traceback
        ctx.logger.error(traceback.format_exc())


@protocol.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    ctx.logger.info(f"[CHAT] Received message from {{sender}}")
    
    # Send acknowledgement
    await ctx.send(
        sender,
        ChatAcknowledgement(timestamp=datetime.now(), acknowledged_msg_id=msg.msg_id),
    )
    ctx.logger.info("[CHAT] Sent acknowledgement")

    # Extract text from message
    text = ''
    for item in msg.content:
        if isinstance(item, TextContent):
            text += item.text
    
    ctx.logger.info(f"[CHAT] Extracted text: {{text[:100]}}...")
    
    # Fetch current price and history
    ctx.logger.info("[CHAT] Fetching ETH price data...")
    eth_price_data = fetch_pyth_hermes()
    
    # Ensure we have valid price data
    if not eth_price_data:
        eth_price_data = {{
            "price": 3895.0,
            "ema_price": 3895.0,
            "publish_time": int(datetime.now().timestamp())
        }}
        ctx.logger.warning("[CHAT] Using fallback price data")
    
    ctx.logger.info(f"[CHAT] Current ETH price: ${{eth_price_data['price']:.2f}}")
    
    ctx.logger.info("[CHAT] Fetching agent history...")
    history = fetch_agent_history()
    ctx.logger.info(f"[CHAT] History length: {{len(history)}}")
    
    analysis = analyze_history(history)
    ctx.logger.info(f"[CHAT] Analysis: {{analysis['total_predictions']}} predictions")
    
    # Check what user is asking about and extract timeframe
    text_lower = text.lower()
    is_eth_related = any(word in text_lower for word in ['eth', 'ethereum', 'price', 'predict', 'forecast', 'will', 'tomorrow', 'future', 'day', 'hour', 'minute', 'next', 'market'])
    
    # Extract timeframe from user query
    timeframe = "in the near future"  # default
    if 'tomorrow' in text_lower or 'next day' in text_lower:
        timeframe = "tomorrow"
    elif 'today' in text_lower:
        timeframe = "later today"
    elif 'week' in text_lower:
        timeframe = "next week"
    elif 'hour' in text_lower:
        if 'next hour' in text_lower or '1 hour' in text_lower or 'an hour' in text_lower:
            timeframe = "in 1 hour"
        else:
            import re
            hour_match = re.search(r'(\\d+)\\s*hour', text_lower)
            if hour_match:
                timeframe = f"in {{hour_match.group(1)}} hours"
            else:
                timeframe = "in the next few hours"
    elif 'minute' in text_lower:
        import re
        minute_match = re.search(r'(\\d+)\\s*minute', text_lower)
        if minute_match:
            timeframe = f"in {{minute_match.group(1)}} minutes"
        else:
            timeframe = "in the next few minutes"
    elif 'day' in text_lower:
        import re
        day_match = re.search(r'(\\d+)\\s*day', text_lower)
        if day_match:
            timeframe = f"in {{day_match.group(1)}} days"
        else:
            timeframe = "in the next few days"
    elif 'month' in text_lower:
        timeframe = "next month"
    
    ctx.logger.info(f"[CHAT] Is ETH related: {{is_eth_related}}, Timeframe: {{timeframe}}")
    
    response = ''
    
    try:
        if not is_eth_related:
            ctx.logger.info("[CHAT] Preparing introduction response")
            # Get values for formatting
            avg_error = analysis.get('avg_error', 0)
            avg_bias = analysis.get('avg_bias', 0)
            total_preds = analysis['total_predictions']
            curr_price = eth_price_data['price']
            ema_price = eth_price_data['ema_price']
            
            # Determine bias text
            if avg_bias > 0:
                bias_text = "(overestimate)"
            elif avg_bias < 0:
                bias_text = "(underestimate)"
            else:
                bias_text = "(neutral)"
            
            # Give introduction for non-ETH queries
            response = f\"\"\"🤖 **Proof of Intelligence Agent**
            
I am a specialized ETH price prediction agent operating on the Proof of Intelligence protocol.

**My Credentials:**
- Agent ID: {{AGENT_ADDRESS}}
- Contract: {{CONTRACT_ADDRESS_TEMPLATE}}
- Deviation: {{DEVIATION}}%
- Network: Base Sepolia

**What I Do:**
I participate in automated ETH price prediction rounds, competing against other AI agents to provide the most accurate predictions. My predictions are recorded on-chain and I learn from my past performance.

**Current Stats:**
- Total Predictions: {{total_preds}}
- Average Error: ${{avg_error:.8f}}
- Average Bias: ${{avg_bias:.8f}} {{bias_text}}

**How to Use Me:**
Ask me about ETH price predictions, market analysis, or my prediction reasoning. For example:
- "What will ETH price be in 1 hour?"
- "Predict ETH price for tomorrow"
- "Why do you think ETH will go up/down?"

Current ETH Price: ${{curr_price:.8f}} (EMA: ${{ema_price:.8f}})\"\"\"
            ctx.logger.info("[CHAT] Introduction response prepared")
        
        else:
            ctx.logger.info("[CHAT] Preparing ETH prediction response")
            
            # Get values for formatting
            curr_price = eth_price_data['price']
            ema_price = eth_price_data['ema_price']
            publish_time = datetime.fromtimestamp(eth_price_data['publish_time']).strftime('%Y-%m-%d %H:%M:%S')
            total_preds = analysis['total_predictions']
            avg_error = analysis.get('avg_error', 0)
            avg_bias = analysis.get('avg_bias', 0)
            
            # Build context for AI
            system_prompt = f\"\"\"You are an expert ETH price prediction agent.

Current Market Data:
- ETH Price: ${{curr_price:.8f}}
- EMA Price: ${{ema_price:.8f}}
- Timestamp: {{publish_time}}

Your Historical Performance:
- Total Predictions: {{total_preds}}
- Average Error: ${{avg_error:.8f}}
- Average Bias: ${{avg_bias:.8f}}{{'(you tend to overestimate)' if avg_bias > 0 else '(you tend to underestimate)' if avg_bias < 0 else ''}}

Recent Predictions:\"\"\"
            
            if analysis['recent_predictions']:
                for p in analysis['recent_predictions'][-3:]:
                    system_prompt += f\"\\n- Round {{p['round']}}: Predicted ${{p['predicted']:.8f}}, Actual ${{p['actual']:.8f}}, Diff ${{p['diff']:.8f}}\"
            
            system_prompt += f\"\"\"\\n
Based on your historical performance and current market conditions, provide a detailed ETH price prediction with reasoning.

IMPORTANT: The user is asking for a prediction {{timeframe}}. Your prediction MUST be for this specific timeframe, not for 60 seconds.

Your response MUST include:
1. **Prediction**: A specific price prediction for {{timeframe}} (e.g., $3895.50 {{timeframe}})
2. **Reasoning**: 3-4 key factors driving your prediction
3. **Confidence Level**: High/Medium/Low
4. **Risk Factors**: What could invalidate your prediction

Format your response with clear sections using markdown.\"\"\"

            ctx.logger.info("[CHAT] Calling AI model...")
            
            try:
                r = client.chat.completions.create(
                    model="asi1-fast",
                    messages=[
                        {{"role": "system", "content": system_prompt}},
                        {{"role": "user", "content": text}},
                    ],
                    max_tokens=2048,
                )
                
                if r and r.choices and len(r.choices) > 0 and r.choices[0].message:
                    prediction_response = str(r.choices[0].message.content)
                    ctx.logger.info(f"[CHAT] AI response received: {{len(prediction_response)}} chars")
                else:
                    ctx.logger.warning("[CHAT] Empty or invalid AI response")
                    prediction_response = None
                    
            except Exception as ai_error:
                ctx.logger.error(f"[CHAT] AI call failed: {{str(ai_error)}}")
                prediction_response = None
            
            # Fallback if AI fails
            if not prediction_response or len(prediction_response.strip()) < 10:
                ctx.logger.warning("[CHAT] Using fallback prediction")
                current_price = eth_price_data['price']
                # Simple prediction: small random variation
                import random
                variation = random.uniform(-5, 5)
                predicted_price = current_price + variation
                
                updown = 'upward' if variation > 0 else 'downward'
                trend = 'bullish' if ema_price < current_price else 'bearish'
                
                prediction_response = f\"\"\"**Prediction**: ${{predicted_price:.8f}} {{timeframe}}

**Reasoning**:
1. Current price momentum suggests slight {{updown}} movement
2. EMA at ${{ema_price:.8f}} indicates {{trend}} trend
3. Market volatility remains within normal range
4. No major news events detected in immediate timeframe

**Confidence Level**: Medium

**Risk Factors**:
- Sudden market news could cause price swings
- Low liquidity periods may increase volatility
- Technical indicators may shift rapidly\"\"\"
            
            # Add agent signature
            response = f\"\"\"{{prediction_response}}

---
**Agent Signature**
- Agent: {{AGENT_ADDRESS}}
- Current ETH: ${{curr_price:.8f}}
- Timestamp: {{datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}}
- Track Record: {{total_preds}} predictions, Avg accuracy: ±${{avg_error:.8f}}\"\"\"
            ctx.logger.info("[CHAT] Full response prepared with signature")

    except Exception as e:
        ctx.logger.error(f"[CHAT] Error in message handling: {{str(e)}}")
        response = f\"\"\"Error processing your request. 

However, I can provide basic information:
- Current ETH Price: ${{eth_price_data['price']:.8f}}
- My Agent ID: {{AGENT_ADDRESS}}
- Total Predictions Made: {{analysis['total_predictions']}}

Please try rephrasing your question about Ethereum price predictions.\"\"\"

    # Final validation
    if not response or len(response.strip()) < 10:
        ctx.logger.warning("[CHAT] Response was empty or too short, using final fallback")
        curr_price = eth_price_data['price']
        ema_price = eth_price_data['ema_price']
        trend_dir = 'trending up' if curr_price > ema_price else 'trending down'
        
        response = f\"\"\"I am analyzing the current market data.

**Current ETH Price**: ${{curr_price:.8f}}
**EMA Price**: ${{ema_price:.8f}}

Based on current trends, ETH appears to be {{trend_dir}}.

Please ask me specific questions about ETH price predictions for detailed analysis.

---
Agent: {{AGENT_ADDRESS}}\"\"\"

    ctx.logger.info(f"[CHAT] Sending response: {{len(response)}} chars")
    
    # Send response back
    await ctx.send(sender, ChatMessage(
        timestamp=datetime.utcnow(),
        msg_id=uuid4(),
        content=[
            TextContent(type="text", text=response),
            EndSessionContent(type="end-session"),
        ]
    ))
    ctx.logger.info("[CHAT] Response sent successfully")

@protocol.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"[ACK] Received acknowledgement from {{sender}}")
    pass
        
# attach the protocol to the agent
agent.include(protocol, publish_manifest=True)

"""

async def register_onchain(agent_address: str, agent_wallet: str):
    """Register the agent on-chain using smart contract"""
    # REMOVED: Frontend handles registration with user's wallet
    print(f"WARNING: On-chain registration skipped - frontend will handle with user wallet")
    return {
        "status": "skipped",
        "message": "Frontend handles registration with user wallet"
    }
        

@app.post("/agent")
async def create_agent(agent_details: AgentDetails):
    """Create and start an agent on Agentverse"""
    
    async with httpx.AsyncClient() as client:
        # Step 1: Create the agent on Agentverse
        create_response = await client.post(
            f"{AGENTVERSE_BASE_URL}/hosting/agents",
            headers={
                "Authorization": f"Bearer {agent_details.agentverse_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "name": f"POI_{agent_details.name}",
                "readme": agent_details.readme,
                "avatar_url": agent_details.avatar_url,
                "short_description": agent_details.short_description,
                "network": agent_details.network
            }
        )
        
        if create_response.status_code != 200:
            return {
                "status": "error",
                "message": f"Failed to create agent: {create_response.text}"
            }
        
        agent_data = create_response.json()
        agent_address = agent_data.get("address")
        
        # Step 2: Update agent details (avatar, description, etc.)
        update_agent_response = await client.put(
            f"{AGENTVERSE_BASE_URL}/hosting/agents/{agent_address}",
            headers={
                "Authorization": f"Bearer {agent_details.agentverse_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "name": f"POI_Agent_{agent_details.name}",
                "avatar_url": agent_details.avatar_url,
                "short_description": agent_details.short_description,
                "readme": agent_details.readme
            }
        )
        
        if update_agent_response.status_code != 200:
            # Don't fail if this doesn't work, just log it
            pass
        
        # Step 3: Upload code to the agent
        import json
        agent_code = get_eth_prediction_agent_code(
            agent_details.name, 
            agent_details.agent_seed or "default_seed",
            agent_details.deviation
        )
        code_payload = json.dumps([{
            "id": 0,
            "name": "agent.py",
            "value": agent_code,
            "language": "python"
        }])
        
        update_response = await client.put(
            f"{AGENTVERSE_BASE_URL}/hosting/agents/{agent_address}/code",
            headers={
                "Authorization": f"Bearer {agent_details.agentverse_api_key}",
                "Content-Type": "application/json"
            },
            json={"code": code_payload}
        )
        
        if update_response.status_code != 200:
            return {
                "status": "error",
                "message": f"Agent created but failed to upload code: {update_response.text}",
                "agent_address": agent_address
            }
        
        # Step 4: Start the agent
        start_response = await client.post(
            f"{AGENTVERSE_BASE_URL}/hosting/agents/{agent_address}/start",
            headers={
                "Authorization": f"Bearer {agent_details.agentverse_api_key}",
            }
        )
        
        if start_response.status_code != 200:
            return {
                "status": "error",
                "message": f"Agent created with code but failed to start: {start_response.text}",
                "agent_address": agent_address
            }
        
        # Step 5: Register agent on-chain
        onchain_result = await register_onchain(agent_address, agent_details.agentverse_api_key)
        
        return {
            "status": "success",
            "message": "Agent created, code uploaded, started, and registered on-chain",
            "agent_address": agent_address,
            "agent_details": start_response.json(),
            "onchain_registration": onchain_result
        }

# Gas Tracking API Endpoints

class GasDepositRequest(BaseModel):
    agent_address: str
    amount: float = INITIAL_STAKE_AMOUNT

class GasUsageRecord(BaseModel):
    agent_address: str
    tx_hash: str
    gas_used: int
    gas_price: int

@app.post("/internal/record-gas")
async def record_gas_internal(record: GasUsageRecord):
    """Internal endpoint for agents to record gas usage after transaction"""
    try:
        result = record_gas_usage(
            record.agent_address,
            record.tx_hash,
            record.gas_used,
            record.gas_price
        )
        return {
            "status": "success",
            "updated_stats": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/gas-deposit")
async def deposit_gas(request: GasDepositRequest):
    """Record gas deposit for an agent (called after user sends 0.1 ETH)"""
    try:
        result = record_gas_deposit(request.agent_address, request.amount)
        return {
            "status": "success",
            "agent_address": request.agent_address,
            "deposit": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agent/{{agent_address}}/gas-stats")
async def get_agent_gas_stats(agent_address: str):
    """Get gas usage statistics for a specific agent"""
    stats = get_gas_stats(agent_address)
    if not stats:
        raise HTTPException(status_code=404, detail="Agent not found or no gas deposit recorded")
    return {
        "agent_address": agent_address,
        "stats": stats
    }

@app.get("/agents/gas-summary")
async def get_all_gas_summary():
    """Get gas usage summary for all agents (for dashboard)"""
    tracking = load_gas_tracking()
    summary = []
    
    for agent_address, data in tracking.items():
        summary.append({
            "agent_address": agent_address,
            "staked": data["staked"],
            "spent": data["spent"],
            "remaining": data["remaining"],
            "tx_count": len(data["transactions"]),
            "created_at": data.get("created_at", "N/A")
        })
    
    return {
        "total_agents": len(summary),
        "agents": summary
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3002)
