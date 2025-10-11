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
    avatar_url: Optional[str] = None
    short_description: Optional[str] = None
    network: Optional[str] = "testnet"

@app.get("/")
async def root():
    return {"message": "Proof of Intelligence", "token": AGENTVERSE_API_KEY}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3002)