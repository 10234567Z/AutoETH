from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel
import os
from typing import Optional
from dotenv import load_dotenv
import httpx
from web3 import Web3
import json


# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Proof of Intelligence Backend")

# Agentverse API configuration
AGENTVERSE_API_KEY = os.getenv("AGENTVERSE_API_KEY")
AGENTVERSE_BASE_URL = "https://agentverse.ai/v1"
ASI_ONE_API_KEY  = os.getenv("ASIONE_API_KEY")

# Smart Contract Configuration
RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/FTdaypPQy2TZuLJhehmqRullM2x0dJPJ"
CONTRACT_ADDRESS = "0x2b2d4989ed6f94a406dc23bc65254bae2e983447"
POI_TOKEN_ADDRESS = "0x4e73f35b0826e74bb69e404d0c2e2c6be18f0f2d"
SEPOLIA_PRIVATE_KEY = os.getenv("SEPOLIA_PRIVATE_KEY", "0x5c86c08228cbd7f2e7890e8bfe1288ff7f90f64404fa9801f5f80320e44a0e6c")

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))

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

@app.get("/")
async def root():
    return {"message": "Proof of Intelligence", "token": AGENTVERSE_API_KEY}

def get_eth_prediction_agent_code(agent_name: str, seed: str) -> str:
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
SEPOLIA_RPC_TEMPLATE = "https://eth-sepolia.g.alchemy.com/v2/FTdaypPQy2TZuLJhehmqRullM2x0dJPJ"
CONTRACT_ADDRESS_TEMPLATE = "0xa75ea9159f1c4f0eadbe024b9204294e48f89392"
POI_TOKEN_ADDRESS_TEMPLATE = "0x0da45357e1e822094de6f2a2103bc88b72e4ae97"
PRIVATE_KEY = {repr(SEPOLIA_PRIVATE_KEY)}

# Initialize Web3 (for template)
w3_template = Web3(Web3.HTTPProvider(SEPOLIA_RPC_TEMPLATE))
contract_abi = [
    {{"inputs": [{{"internalType": "string", "name": "agentAddress", "type": "string"}}, {{"internalType": "int256", "name": "predictedPrice", "type": "int256"}}], "name": "submitPrediction", "outputs": [], "stateMutability": "nonpayable", "type": "function"}},
    {{"inputs": [], "name": "currentPredictionRound", "outputs": [{{"internalType": "uint256", "name": "", "type": "uint256"}}], "stateMutability": "view", "type": "function"}},
    {{"inputs": [{{"internalType": "uint256", "name": "", "type": "uint256"}}], "name": "predictionRounds", "outputs": [{{"internalType": "uint256", "name": "forBlockNumber", "type": "uint256"}}, {{"internalType": "uint256", "name": "startTime", "type": "uint256"}}, {{"internalType": "uint256", "name": "submissionDeadline", "type": "uint256"}}, {{"internalType": "uint256", "name": "predictionCount", "type": "uint256"}}, {{"internalType": "bool", "name": "finalized", "type": "bool"}}, {{"internalType": "string", "name": "winnerAgent", "type": "string"}}, {{"internalType": "int256", "name": "actualPrice", "type": "int256"}}], "stateMutability": "view", "type": "function"}},
    {{"inputs": [{{"internalType": "uint256", "name": "", "type": "uint256"}}, {{"internalType": "uint256", "name": "", "type": "uint256"}}], "name": "participants", "outputs": [{{"internalType": "string", "name": "", "type": "string"}}], "stateMutability": "view", "type": "function"}}
]
contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=contract_abi)

agent = Agent(name={repr(agent_name)}, seed={repr(seed)})
protocol = Protocol(spec=chat_protocol_spec)

# Store agent's actual Agentverse address (not the name)
AGENT_ADDRESS = agent.address


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
        r = client.chat.completions.create(
            model="asi1-fast",
            messages=[
                {{"role": "system", "content": f"You are a helpful assistant who only answers questions about {{subject_matter}}. If the user asks about any other topics, you should politely say that you do not know about them. You have access to the latest ETH/USD price data from the Pyth Network Hermes API. The latest price is {{eth_price_data['price']}} USD, with an EMA price of {{eth_price_data['ema_price']}} USD, published at UNIX timestamp {{eth_price_data['publish_time']}}. Use this data to inform your responses. Even if the user asks for any kind of prediction, give them only what you THINK will be the price based on current data in next 60 seconds. It does not have to be accurate and advice whatever, just give a number based on current data and give the predictions.Also just give the predicted price in response, thats it nothing else should be in response other than the predicted price in next 60s."}},
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
        ctx.logger.info(f"🔍 DEBUG: PRIVATE_KEY exists: {{bool(PRIVATE_KEY)}}")
        
        if not PRIVATE_KEY:
            ctx.logger.error("⚠️ No private key configured")
            return None
        
        ctx.logger.info(f"🔗 Connecting to {{HEDERA_RPC}}")
        ctx.logger.info(f"📝 Contract: {{CONTRACT_ADDRESS}}")
        ctx.logger.info(f"🤖 Agent: {{agent_addr}}")
        ctx.logger.info(f"💰 Price: ${{predicted_price}}")
            
        account = w3.eth.account.from_key(PRIVATE_KEY)
        ctx.logger.info(f"👛 Account: {{account.address}}")
        
        # Convert price to int (multiply by 100 for 2 decimal precision)
        price_int = int(float(predicted_price) * 100)
        ctx.logger.info(f"🔢 Price as int: {{price_int}}")
        
        # Get current nonce
        nonce = w3.eth.get_transaction_count(account.address)
        ctx.logger.info(f"🔢 Nonce: {{nonce}}")
        
        # Build transaction
        transaction = contract.functions.submitPrediction(agent_addr, price_int).build_transaction({{
            'from': account.address,
            'nonce': nonce,
            'gas': 500000,
            'gasPrice': w3.eth.gas_price,
            'chainId': 296
        }})
        
        ctx.logger.info("📦 Signing transaction...")
        
        # Sign and send
        signed_txn = account.sign_transaction(transaction)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        ctx.logger.info(f"✅ TX: {{tx_hash.hex()}}")
        
        return tx_hash.hex()
    except Exception as e:
        ctx.logger.error(f"❌ Error: {{e}}")
        import traceback
        ctx.logger.error(traceback.format_exc())
        return None


@agent.on_interval(period=10.0)
async def check_and_submit_prediction(ctx: Context):
    \"\"\"Check every 10 seconds if we can submit a prediction\"\"\"
    ctx.logger.info(f"⏰ Checking if can submit prediction...")
    
    try:
        # Check if there's an active round
        round_id = contract.functions.currentPredictionRound().call()
        
        if round_id == 0:
            ctx.logger.info("📭 No active round yet")
            return
        
        # Get round info
        round_data = contract.functions.predictionRounds(round_id).call()
        finalized = round_data[4]
        deadline = round_data[2]
        prediction_count = round_data[3]
        
        if finalized:
            ctx.logger.info(f"✅ Round #{{round_id}} already finalized")
            return
        
        # Check if within submission window (25s out of 40s total round)
        current_time = int(datetime.now().timestamp())
        if current_time > deadline:
            ctx.logger.info(f"⏰ Round #{{round_id}} submission window closed (judging phase)")
            return
        
        # Check if already predicted this round
        try:
            for i in range(prediction_count):
                participant = contract.functions.participants(round_id, i).call()
                if participant == AGENT_ADDRESS:
                    ctx.logger.info(f"✅ Already predicted in round #{{round_id}}")
                    return
        except:
            pass  # If we can't check, proceed anyway
        
        # All good - submit prediction!
        ctx.logger.info(f"🎯 Round #{{round_id}} active - submitting prediction...")
        
        # Get current ETH price
        eth_price_data = fetch_pyth_hermes()
        if not eth_price_data:
            ctx.logger.error("Failed to fetch ETH price")
            return
        
        ctx.logger.info(f"📊 Current ETH price: ${{{{eth_price_data['price']}}}}")
        
        # Get AI prediction
        predicted_price = get_ai_prediction(eth_price_data)
        ctx.logger.info(f"🎯 AI Prediction: ${{{{predicted_price}}}}")
        
        # Submit to blockchain
        tx_hash = submit_prediction_onchain(ctx, AGENT_ADDRESS, predicted_price)
        if tx_hash:
            ctx.logger.info(f"✅ Prediction submitted! TX: {{{{tx_hash}}}}")
        else:
            ctx.logger.error("❌ Submission failed")
            
    except Exception as e:
        ctx.logger.error(f"❌ Error: {{{{e}}}}")
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
    try:
        if not SEPOLIA_PRIVATE_KEY:
            print(f"⚠️  No private key configured, skipping on-chain registration for {agent_address}")
            return {
                "status": "skipped",
                "message": "No private key configured"
            }
        
        # Create contract instance
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
        
        # Get account from private key
        account = w3.eth.account.from_key(SEPOLIA_PRIVATE_KEY)
        
        # Prepare agent struct for on-chain registration
        agent_struct = (
            agent_address,      # agentAddress (Agentverse address)
            agent_wallet,       # agentWalletAddress
            0,                  # totalGuesses
            0,                  # bestGuesses
            0,                  # accuracy
            0                   # lastGuessBlock
        )
        
        # Build transaction
        transaction = contract.functions.registerAgent(agent_struct).build_transaction({
            'from': account.address,
            'nonce': w3.eth.get_transaction_count(account.address),
            'gas': 2000000,
            'gasPrice': w3.eth.gas_price,
            'chainId': 296  # Hedera Testnet
        })
        
        # Sign transaction
        signed_txn = account.sign_transaction(transaction)
        
        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
        
        print(f"✅ On-chain registration transaction sent: {tx_hash.hex()}")
        
        # Wait for receipt (with timeout)
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
        
        if tx_receipt['status'] == 1:
            print(f"✅ Agent {agent_address} registered on-chain successfully!")
            return {
                "status": "success",
                "tx_hash": tx_hash.hex(),
                "block_number": tx_receipt['blockNumber'],
                "explorer_url": f"https://hashscan.io/testnet/transaction/{tx_hash.hex()}"
            }
        else:
            return {
                "status": "failed",
                "message": "Transaction reverted",
                "tx_hash": tx_hash.hex()
            }
            
    except Exception as e:
        print(f"❌ Error registering agent on-chain: {e}")
        return {
            "status": "error",
            "message": str(e)
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
        agent_code = get_eth_prediction_agent_code(agent_details.name, agent_details.agent_seed or "default_seed")
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


def fetch_pyth_hermes():
    """ Fetch ETH/USD price feed from Pyth Hermes API """
    url = f"https://hermes.pyth.network/v2/updates/price/latest?ids[]=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
    
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
            
            return {
                "price": actual_price,
                "ema_price": actual_ema_price,
                "publish_time": eth_data["price"]["publish_time"]
            }
    except Exception as e:
        print(f"Error fetching Pyth price: {e}")
        return None

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3002)