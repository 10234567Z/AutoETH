from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel
import os
from typing import Optional
from dotenv import load_dotenv
import httpx


# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Proof of Intelligence Backend")

# Agentverse API configuration
AGENTVERSE_API_KEY = os.getenv("AGENTVERSE_API_KEY")
AGENTVERSE_BASE_URL = "https://agentverse.ai/v1"
ASI_ONE_API_KEY  = os.getenv("ASIONE_API_KEY")

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

from openai import OpenAI
from uagents import Context, Protocol, Agent
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

subject_matter = "Ethereum (ETH) price prediction"

client = OpenAI(
    base_url='https://api.asi1.ai/v1',
    api_key={repr(ASI_ONE_API_KEY)},
)

agent = Agent()
protocol = Protocol(spec=chat_protocol_spec)


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
            model="asi1-mini",
            messages=[
                {{"role": "system", "content": f"You are a helpful assistant who only answers questions about {{subject_matter}}. If the user asks about any other topics, you should politely say that you do not know about them. You have access to the latest ETH/USD price data from the Pyth Network Hermes API. The latest price is {{eth_price_data['price']}} USD, with an EMA price of {{eth_price_data['ema_price']}} USD, published at UNIX timestamp {{eth_price_data['publish_time']}}. Use this data to inform your responses. Even if the user asks for any kind of prediction, give them only what you THINK will be the price based on current data in next 60 seconds. It does not have to be accurate and advice whatever, just give a number based on current data and give the predictions."}},
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
                "name": f"POI_Agent_{agent_details.name}",
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
        
        return {
            "status": "success",
            "message": "Agent created, code uploaded, and started successfully",
            "agent_address": agent_address,
            "agent_details": start_response.json(),
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