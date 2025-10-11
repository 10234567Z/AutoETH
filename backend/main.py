from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel
import httpx
import os
from typing import Optional
from dotenv import load_dotenv

from uagents import Agent, Context

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Proof of Intelligence Backend")

# Agentverse API configuration
AGENTVERSE_API_KEY = os.getenv("AGENTVERSE_API_KEY")
AGENTVERSE_BASE_URL = "https://agentverse.ai/v1"

class AgentDetails(BaseModel):
    name: str
    readme: str
    avatar_url: str = None
    short_description: str = None
    network: str = "testnet"
    agentverse_api_key: str

@app.get("/")
async def root():
    return {"message": "Proof of Intelligence", "token": AGENTVERSE_API_KEY}


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
                "name": agent_details.name,
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
        
        # Step 2: Start the agent
        start_response = await client.post(
            f"{AGENTVERSE_BASE_URL}/hosting/agents/{agent_address}/start",
            headers={
                "Authorization": f"Bearer {agent_details.agentverse_api_key}",
            }
        )
        
        if start_response.status_code != 200:
            return {
                "status": "error",
                "message": f"Agent created but failed to start: {start_response.text}",
                "agent_address": agent_address
            }
        
        return {
            "status": "success",
            "message": "Agent created and started successfully",
            "agent_details": start_response.json(),
        }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3002)