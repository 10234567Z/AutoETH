from datetime import datetime
import httpx
import json
from web3 import Web3
from uagents import Context, Agent, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)
from uuid import uuid4

# Smart Contract Configuration
RPC_URL = "https://base-sepolia.g.alchemy.com/v2/FTdaypPQy2TZuLJhehmqRullM2x0dJPJ"  # Sepolia testnet
POI_TOKEN_ADDRESS = "0x5ef3c7bdddbe1dcef0bc697e04614fe3d1f46736"
CONTRACT_ADDRESS = "0x254697169376c0a51b48afc117010493316fc28a"
PYTH_CONTRACT_ADDRESS = "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729"  # Pyth contract on Sepolia
PRIVATE_KEY = ''
PYTH_PRICE_FEED_ID = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
CHAIN_ID = 84532  # Sepolia testnet

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# ProofOfIntelligence contract ABI
contract_abi = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "priceFeedId", "type": "bytes32"}
        ],
        "name": "finalizeRoundAndMineBlock",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "startNewRound",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCurrentMempoolCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "currentPredictionRound",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "predictionRounds",
        "outputs": [
            {"internalType": "uint256", "name": "forBlockNumber", "type": "uint256"},
            {"internalType": "uint256", "name": "startTime", "type": "uint256"},
            {"internalType": "uint256", "name": "submissionDeadline", "type": "uint256"},
            {"internalType": "uint256", "name": "predictionCount", "type": "uint256"},
            {"internalType": "bool", "name": "finalized", "type": "bool"},
            {"internalType": "string", "name": "winnerAgent", "type": "string"},
            {"internalType": "int256", "name": "actualPrice", "type": "int256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "current_mempool",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

# Pyth contract ABI (minimal - for updating price feeds)
pyth_abi = [
    {
        "inputs": [{"internalType": "bytes[]", "name": "updateData", "type": "bytes[]"}],
        "name": "updatePriceFeeds",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes[]", "name": "updateData", "type": "bytes[]"}],
        "name": "getUpdateFee",
        "outputs": [{"internalType": "uint256", "name": "feeAmount", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=contract_abi)
pyth_contract = w3.eth.contract(address=Web3.to_checksum_address(PYTH_CONTRACT_ADDRESS), abi=pyth_abi)

agent = Agent(name='JudgingAgent', seed='poi_judge_v1')
protocol = Protocol(spec=chat_protocol_spec)

# Store agent's actual Agentverse address
AGENT_ADDRESS = agent.address

# State tracking for smart round management
last_empty_round_time = None
consecutive_empty_rounds = 0
EMPTY_ROUND_DELAY = 30  # seconds to wait after empty round
MAX_EMPTY_ROUND_DELAY = 120  # max 2 minutes delay


def fetch_pyth_price_update():
    """Fetch Pyth price update from Hermes API"""
    try:
        url = f"https://hermes.pyth.network/v2/updates/price/latest?ids[]={PYTH_PRICE_FEED_ID}"
        response = httpx.get(url, timeout=10.0)
        data = response.json()
        
        if "binary" in data and "data" in data["binary"] and len(data["binary"]["data"]) > 0:
            price_update = data["binary"]["data"][0]
            return bytes.fromhex(price_update)
        
        return None
    except Exception as e:
        print(f"Error fetching Pyth price update: {e}")
        return None


def has_valid_mempool_transactions(ctx):
    """Check if there are actual mempool transactions available"""
    try:
        mempool_count = contract.functions.getCurrentMempoolCount().call()
        
        # mempool_count is a count (0 = none, 1 = one tx at index 0, etc.)
        if mempool_count == 0:
            ctx.logger.info(f"Mempool count: {mempool_count} - no transactions yet")
            return False
        
        ctx.logger.info(f"Mempool count: {mempool_count} - {mempool_count} tx(s) available")
        return True
        
    except Exception as e:
        ctx.logger.error(f"Error checking mempool: {e}")
        return False


def should_start_new_round(ctx):
    """Smart round management with mempool check and progressive delays"""
    global last_empty_round_time, consecutive_empty_rounds
    
    # CRITICAL: Must have mempool transactions (contract enforces this too)
    if not has_valid_mempool_transactions(ctx):
        ctx.logger.warning("WARNING: No mempool transactions - cannot start round")
        ctx.logger.info("HINT: Submit: node scripts/test-contract.mjs mempool 1000000")
        return False
    
    # Check if previous round had predictions
    try:
        current_round_id = contract.functions.currentPredictionRound().call()
        if current_round_id > 0:
            prev_round = contract.functions.predictionRounds(current_round_id).call()
            prev_prediction_count = prev_round[3]
            
            if prev_prediction_count == 0:
                consecutive_empty_rounds += 1
                current_time = datetime.now()
                
                # Progressive delay: 30s, 60s, 120s (capped)
                delay = min(EMPTY_ROUND_DELAY * consecutive_empty_rounds, MAX_EMPTY_ROUND_DELAY)
                
                ctx.logger.info(f"WARNING: Round #{current_round_id} had 0 predictions")
                ctx.logger.info(f"Empty streak: {consecutive_empty_rounds}, delay: {delay}s")
                
                # Check if delay elapsed
                if last_empty_round_time:
                    elapsed = (current_time - last_empty_round_time).total_seconds()
                    if elapsed < delay:
                        remaining = delay - elapsed
                        ctx.logger.info(f"Waiting {remaining:.0f}s (mempool txs carry over)")
                        return False
                
                last_empty_round_time = current_time
                ctx.logger.info(f"Delay elapsed - starting new round (reusing mempool)")
                return True
            else:
                # Reset on successful round
                consecutive_empty_rounds = 0
                last_empty_round_time = None
                ctx.logger.info(f"Round had {prev_prediction_count} predictions - ready!")
                return True
    except Exception as e:
        ctx.logger.error(f"Error checking conditions: {e}")
        return False
    
    # First round - go ahead
    return True


def get_current_round_info(ctx):
    """Get current round information from contract"""
    try:
        round_id = contract.functions.currentPredictionRound().call()
        
        if round_id == 0:
            return None
            
        round_data = contract.functions.predictionRounds(round_id).call()
        
        return {
            "round_id": round_id,
            "for_block": round_data[0],
            "start_time": round_data[1],
            "deadline": round_data[2],
            "prediction_count": round_data[3],
            "finalized": round_data[4],
            "winner": round_data[5],
            "actual_price": round_data[6]
        }
    except Exception as e:
        ctx.logger.error(f"Error fetching round info: {e}")
        return None


def start_new_round(ctx):
    """Start a new prediction round (mempool txs are reusable!)"""
    try:
        if not PRIVATE_KEY:
            ctx.logger.error("ERROR: No private key configured")
            return None
        
        mempool_count = contract.functions.getCurrentMempoolCount().call()
        ctx.logger.info(f"Starting round with mempool (counter: {mempool_count})")
        ctx.logger.info(f"Mempool transactions carry over - efficient reuse!")
        
        # Prepare account
        account = w3.eth.account.from_key(PRIVATE_KEY)
        
        # Build transaction
        ctx.logger.info("Building startNewRound transaction...")
        transaction = contract.functions.startNewRound().build_transaction({
            'from': account.address,
            'nonce': w3.eth.get_transaction_count(account.address, 'pending'),  # Use 'pending' to include pending txs
            'gas': 500000,
            'gasPrice': w3.eth.gas_price,
            'chainId': CHAIN_ID
        })
        
        # Sign and send
        ctx.logger.info("Signing transaction...")
        signed_txn = account.sign_transaction(transaction)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        ctx.logger.info(f"New round started! TX: {tx_hash.hex()}")
        
        # Wait for confirmation to avoid nonce issues
        ctx.logger.info("Waiting for confirmation...")
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        
        if receipt['status'] == 1:
            ctx.logger.info(f"Round start confirmed! Block: {receipt['blockNumber']}")
        else:
            ctx.logger.error("ERROR: Round start transaction failed")
            return None
        
        return tx_hash.hex()
        
    except ValueError as e:
        # Handle "already known" or other RPC errors gracefully
        if 'already known' in str(e):
            ctx.logger.warning("WARNING: Transaction already pending - skipping")
            return None
        else:
            ctx.logger.error(f"ERROR: Error starting round: {e}")
            return None
    except Exception as e:
        ctx.logger.error(f"ERROR: Error starting round: {e}")
        import traceback
        ctx.logger.error(traceback.format_exc())
        return None


def finalize_round(ctx):
    """Finalize the current prediction round and mine block (2-step process like test-contract.mjs)"""
    try:
        if not PRIVATE_KEY:
            ctx.logger.error("ERROR: No private key configured")
            return None
        
        # Prepare account
        account = w3.eth.account.from_key(PRIVATE_KEY)
        ctx.logger.info(f"Judge Account: {account.address}")
        
        # STEP 1: Fetch Pyth price update from Hermes
        ctx.logger.info("Step 1: Fetching fresh Pyth price data from Hermes...")
        price_update = fetch_pyth_price_update()
        
        if not price_update:
            ctx.logger.error("ERROR: Failed to fetch Pyth price update")
            return None
        
        ctx.logger.info(f"Got price update: {len(price_update)} bytes")
        
        # STEP 2: Update Pyth contract on-chain
        ctx.logger.info("Step 2: Updating Pyth contract on-chain...")
        
        update_data = [price_update]
        
        # Get Pyth update fee
        pyth_fee = pyth_contract.functions.getUpdateFee(update_data).call()
        ctx.logger.info(f"Pyth fee: {pyth_fee} wei ({w3.from_wei(pyth_fee, 'ether')} ETH)")
        
        # Build Pyth update transaction
        pyth_transaction = pyth_contract.functions.updatePriceFeeds(update_data).build_transaction({
            'from': account.address,
            'nonce': w3.eth.get_transaction_count(account.address, 'pending'),  # Use 'pending' to include pending txs
            'gas': 500000,
            'gasPrice': w3.eth.gas_price,
            'chainId': CHAIN_ID,
            'value': pyth_fee
        })
        
        # Sign and send Pyth update
        ctx.logger.info("Signing Pyth update transaction...")
        signed_pyth_txn = account.sign_transaction(pyth_transaction)
        pyth_tx_hash = w3.eth.send_raw_transaction(signed_pyth_txn.rawTransaction)
        
        ctx.logger.info(f"Pyth update sent: {pyth_tx_hash.hex()}")
        ctx.logger.info("Waiting for Pyth update confirmation...")
        
        # Wait for Pyth update to be mined
        pyth_receipt = w3.eth.wait_for_transaction_receipt(pyth_tx_hash, timeout=120)
        
        if pyth_receipt['status'] != 1:
            ctx.logger.error("ERROR: Pyth update transaction failed!")
            return None
        
        ctx.logger.info("Pyth price updated on-chain!")
        
        # STEP 3: Finalize round (contract will read on-chain price)
        ctx.logger.info("Step 3: Finalizing round (contract reads on-chain price)...")
        
        # Get current round to check participant count
        round_info = get_current_round_info(ctx)
        participant_count = round_info['prediction_count'] if round_info else 0
        
        # Dynamic gas calculation based on participants
        # IMPORTANT: Pyth contract needs ~2M gas internally for getPrice()
        # Base: 2.5M (includes Pyth overhead) + 300k per participant
        calculated_gas = 2500000 + (participant_count * 300000)
        gas_limit = max(3000000, min(calculated_gas, 8000000))  # Min 3M, Max 8M
        
        ctx.logger.info(f"Using gas limit: {gas_limit} for {participant_count} participants (includes Pyth overhead)")
        
        # Convert price feed ID to bytes32
        price_feed_bytes32 = bytes.fromhex(PYTH_PRICE_FEED_ID[2:] if PYTH_PRICE_FEED_ID.startswith('0x') else PYTH_PRICE_FEED_ID)
        
        # Build finalization transaction with dynamic gas
        # Use 'pending' nonce since we just sent Pyth update
        transaction = contract.functions.finalizeRoundAndMineBlock(
            price_feed_bytes32
        ).build_transaction({
            'from': account.address,
            'nonce': w3.eth.get_transaction_count(account.address, 'pending'),  # Use 'pending' to get correct nonce after Pyth update
            'gas': gas_limit,  # Dynamic gas based on participants
            'gasPrice': w3.eth.gas_price,
            'chainId': CHAIN_ID
        })
        
        # Sign and send
        ctx.logger.info("Signing finalization transaction...")
        signed_txn = account.sign_transaction(transaction)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        ctx.logger.info(f"Round finalized! TX: {tx_hash.hex()}")
        ctx.logger.info(f"View: https://sepolia-explorer.base.org/tx/{tx_hash.hex()}")
        
        return tx_hash.hex()
        
    except Exception as e:
        ctx.logger.error(f"ERROR: Error finalizing round: {e}")
        import traceback
        ctx.logger.error(traceback.format_exc())
        return None


@agent.on_interval(period=5.0)
async def manage_rounds(ctx: Context):
    """Every 5 seconds: intelligently manage rounds"""
    ctx.logger.info("Checking rounds...")
    
    # Get current round info
    round_info = get_current_round_info(ctx)
    
    if not round_info:
        # No active round - use smart logic to decide if we should start
        if should_start_new_round(ctx):
            ctx.logger.info("Starting new round")
            tx_hash = start_new_round(ctx)
            if tx_hash:
                ctx.logger.info(f"Round started! TX: {tx_hash}")
            else:
                ctx.logger.info("Skipped (pending tx or error)")
        else:
            ctx.logger.info("Conditions not met - waiting...")
        return
    
    ctx.logger.info(f"Round #{round_info['round_id']} - Predictions: {round_info['prediction_count']}, Finalized: {round_info['finalized']}")
    
    # Check if already finalized
    if round_info['finalized']:
        ctx.logger.info("Round finalized - attempting to start new round")
        tx_hash = start_new_round(ctx)
        if tx_hash:
            ctx.logger.info(f"Started new round! TX: {tx_hash}")
        else:
            ctx.logger.info("Skipping (likely pending transaction)")
        return
    
    # Check if past deadline
    current_time = int(datetime.now().timestamp())
    time_until_deadline = round_info['deadline'] - current_time
    
    if time_until_deadline > 0:
        ctx.logger.info(f"Deadline in {time_until_deadline}s - waiting...")
        return
    
    # Time to finalize!
    ctx.logger.info(f"Round #{round_info['round_id']} ready for finalization!")
    
    if round_info['prediction_count'] == 0:
        ctx.logger.warning("WARNING: No predictions submitted this round")
    
    # Finalize the round
    tx_hash = finalize_round(ctx)
    
    if tx_hash:
        ctx.logger.info(f"Successfully finalized round #{round_info['round_id']}")
        ctx.logger.info(f"TX: {tx_hash}")


@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Judging Agent Started!")
    ctx.logger.info(f"Agent Address: {AGENT_ADDRESS}")
    ctx.logger.info(f"Contract: {CONTRACT_ADDRESS}")
    ctx.logger.info(f"Managing rounds every 5 seconds")


# ===== CHAT PROTOCOL FOR STATUS UPDATES =====

@protocol.on_message(ChatMessage)
async def handle_chat_message(ctx: Context, sender: str, msg: ChatMessage):
    """Handle incoming chat messages and respond with on-chain stats"""
    ctx.logger.info(f"[CHAT] Received message from {sender}")
    
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
    
    ctx.logger.info(f"[CHAT] User asked: {text[:100]}...")
    
    # Build comprehensive on-chain status report
    try:
        # Get current round info
        current_round_id = contract.functions.currentPredictionRound().call()
        current_block = contract.functions.getCurrentMempoolCount().call()
        
        response = f"""🤖 **Proof of Intelligence - Judging Agent Status**

**Contract Information:**
- Contract: `{CONTRACT_ADDRESS}`
- Pyth Oracle: `{PYTH_CONTRACT_ADDRESS}`
- Network: Base Sepolia (Chain ID: {CHAIN_ID})

"""
        
        # Add round information
        if current_round_id > 0:
            round_data = contract.functions.predictionRounds(current_round_id).call()
            
            for_block = round_data[0]
            start_time = round_data[1]
            deadline = round_data[2]
            prediction_count = round_data[3]
            finalized = round_data[4]
            winner = round_data[5]
            actual_price = round_data[6]
            
            current_time = int(datetime.now().timestamp())
            elapsed = current_time - start_time
            remaining = max(0, deadline - current_time)
            
            status = "✅ FINALIZED" if finalized else ("⏱️ ACTIVE" if remaining > 0 else "⏳ JUDGING")
            
            response += f"""**Current Round: #{current_round_id}**
- Status: {status}
- For Block: #{for_block}
- Start Time: {datetime.fromtimestamp(start_time).strftime('%Y-%m-%d %H:%M:%S UTC')}
- Deadline: {datetime.fromtimestamp(deadline).strftime('%Y-%m-%d %H:%M:%S UTC')}
- Predictions Submitted: {prediction_count}
- Elapsed: {elapsed}s
- Remaining: {remaining}s

"""
            
            if finalized:
                actual_price_display = actual_price / 1e8  # Convert from ×1e8 format
                response += f"""**Round Results:**
- Winner: {winner if winner else 'No winner (no predictions)'}
- Actual ETH Price: ${actual_price_display:.2f}

"""
            else:
                if remaining > 0:
                    response += f"**Status:** Accepting predictions for {remaining} more seconds\n\n"
                else:
                    response += f"**Status:** Submission window closed, waiting for finalization\n\n"
        else:
            response += f"""**Current Round: None**
- Status: ⏸️ No active round
- Next Action: Waiting for mempool transactions to start first round

"""
        
        # Add mempool info
        response += f"""**Mempool Status:**
- Transaction Count: {current_block}
- Status: {'✅ Ready' if current_block > 0 else '⚠️ Empty (need mempool tx to start rounds)'}

"""
        
        # Add smart round management stats
        global consecutive_empty_rounds, last_empty_round_time
        if consecutive_empty_rounds > 0:
            response += f"""**Round Management:**
- Empty Round Streak: {consecutive_empty_rounds}
- Adaptive Delay: {min(EMPTY_ROUND_DELAY * consecutive_empty_rounds, MAX_EMPTY_ROUND_DELAY)}s
- Status: Waiting for agent participation

"""
        response += f"""
**Judging Agent:** {AGENT_ADDRESS}
**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}
"""
        
    except Exception as e:
        ctx.logger.error(f"[CHAT] Error fetching stats: {e}")
        response = f"""⚠️ **Error Fetching On-Chain Data**

I encountered an error while fetching on-chain statistics:
`{str(e)}`

**Contract Details:**
- Contract: {CONTRACT_ADDRESS}
- Network: Base Sepolia
- Judge Agent: {AGENT_ADDRESS}

**Troubleshooting:**
- Check if contract is deployed correctly
- Verify RPC connection: {RPC_URL}
- Check if you have access to Base Sepolia testnet

Try asking again in a moment, or check the contract directly on the explorer:
https://sepolia-explorer.base.org/address/{CONTRACT_ADDRESS}
"""
    
    # Send response
    ctx.logger.info(f"[CHAT] Sending response ({len(response)} chars)")
    await ctx.send(sender, ChatMessage(
        timestamp=datetime.now(),
        msg_id=uuid4(),
        content=[
            TextContent(type="text", text=response),
            EndSessionContent(type="end-session"),
        ]
    ))
    ctx.logger.info("[CHAT] Response sent successfully")


@protocol.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    """Handle acknowledgements"""
    ctx.logger.info(f"[ACK] Received acknowledgement from {sender}")


# Attach chat protocol to agent
agent.include(protocol, publish_manifest=True)


if __name__ == "__main__":
    agent.run()
