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
CONTRACT_ADDRESS = "0x80b369c7799ef6babf231f44042d93d3196a4f60"
POI_TOKEN_ADDRESS = "0xbc63b982708e2c0dbfcc3cfa944f29b18ee977f2"
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
CONTRACT_ADDRESS_TEMPLATE = "0x80b369c7799ef6babf231f44042d93d3196a4f60"
POI_TOKEN_ADDRESS_TEMPLATE = "0xbc63b982708e2c0dbfcc3cfa944f29b18ee977f2"
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
    
    # Format recent predictions for context
    recent = []
    for h in history[-5:]:  # Last 5 predictions
        recent.append({{
            "round": h[0],
            "predicted": h[1] / 100,  # Convert back from int
            "actual": h[2] / 100,
            "diff": h[3] / 100
        }})
    
    return {{
        "has_history": True,
        "avg_bias": avg_bias / 100,  # Convert to dollars
        "avg_error": avg_error / 100,
        "total_predictions": len(history),
        "recent_predictions": recent
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
        system_prompt = f"You are an ETH price prediction AI. Current ETH price: ${{eth_price_data['price']}} USD (EMA: ${{eth_price_data['ema_price']}} USD).\\n\\n"
        
        if analysis['has_history']:
            # Add historical context for self-learning
            bias_direction = "too HIGH" if analysis['avg_bias'] > 0 else "too LOW"
            system_prompt += f"YOUR HISTORICAL PERFORMANCE:\\n"
            system_prompt += f"- Total predictions made: {{analysis['total_predictions']}}\\n"
            system_prompt += f"- Average bias: ${{analysis['avg_bias']:.2f}} (you tend to predict {{bias_direction}})\\n"
            system_prompt += f"- Average error: ${{analysis['avg_error']:.2f}}\\n"
            system_prompt += f"- Recent predictions (last 5):\\n"
            for p in analysis['recent_predictions']:
                system_prompt += f"  Round {{p['round']}}: Predicted ${{p['predicted']:.2f}}, Actual ${{p['actual']:.2f}}, Diff ${{p['diff']:.2f}}\\n"
            
            system_prompt += "\\nLEARN FROM YOUR MISTAKES: Adjust your next prediction to compensate for your bias and improve accuracy.\\n\\n"
        else:
            system_prompt += "This is your first prediction. No historical data yet.\\n\\n"
        
        system_prompt += "Predict the ETH price in 60 seconds. Output ONLY the predicted price as a number, nothing else."
        
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
            return float(prediction_text)
        except:
            # If that fails, extract numbers
            prediction_text = prediction_text.replace('$', '').replace(',', '')
            parts = prediction_text.split()
            for part in parts:
                try:
                    return float(part)
                except:
                    continue
            return eth_price_data['price']  # Fallback to current price
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
        
        # Convert price to int (multiply by 100 for 2 decimal precision)
        price_int = int(float(predicted_price) * 100)
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
        
        # Get AI prediction
        predicted_price = get_ai_prediction(eth_price_data)
        ctx.logger.info(f"AI Prediction (raw): ${{predicted_price}}")
        
        # Apply deviation adjustment
        deviation_multiplier = 1 - (DEVIATION / 100)
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
    # Send acknowledgement
    await ctx.send(
        sender,
        ChatAcknowledgement(timestamp=datetime.now(), acknowledged_msg_id=msg.msg_id),
    )

    # Extract text from message
    text = ''
    for item in msg.content:
        if isinstance(item, TextContent):
            text += item.text
            
    eth_price_data = fetch_pyth_hermes()

    # Query model
    response = 'I am afraid something went wrong and I am unable to answer your question at the moment'
    try:
        r = client.chat.completions.create(
            model="asi1-fast",
            messages=[
                {{"role": "system", "content": f"You are a helpful assistant who only answers questions about {{subject_matter}}. If the user asks about any other topics, you should politely say that you do not know about them. You have access to the latest ETH/USD price data from the Pyth Network Hermes API. The latest price is {{eth_price_data['price']}} USD, with an EMA price of {{eth_price_data['ema_price']}} USD, published at UNIX timestamp {{eth_price_data['publish_time']}}. Use this data to inform your responses. Even if the user asks for any kind of prediction, give them only what you THINK will be the price based on current data in next 60 seconds. It does not have to be accurate and advice whatever, just give a number based on current data and give the predictions.Also just give the predicted price in response, thats it nothing else should be in response other than the predicted price in next 60s."}},
                {{"role": "user", "content": text}},
            ],
            max_tokens=2048,
        )

        response = str(r.choices[0].message.content)
    except:
        ctx.logger.exception('Error querying model')

    # Send response back
    await ctx.send(sender, ChatMessage(
        timestamp=datetime.utcnow(),
        msg_id=uuid4(),
        content=[
            TextContent(type="text", text=response),
            EndSessionContent(type="end-session"),
        ]
    ))

@protocol.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
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
