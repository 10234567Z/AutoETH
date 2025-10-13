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

    # Query model
    response = 'I am afraid something went wrong and I am unable to answer your question at the moment'
    try:
        r = client.chat.completions.create(
            model="asi1-mini",
            messages=[
                {{"role": "system", "content": f"You are a helpful assistant who only answers questions about {{subject_matter}}. If the user asks about any other topics, you should politely say that you do not know about them."}},
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


def fetch_pyth_hermes():
    """ Fetch ETH/USD price feed from Pyth Hermes API """
    
    # ETH/USD price feed ID
    eth_usd_feed_id = os.getenv("ETHUSD_PRICEFEED_ADDR")
    
    url = f"https://hermes.pyth.network/v2/updates/price/latest?ids[]={eth_usd_feed_id}"
    
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
    print(fetch_pyth_hermes())