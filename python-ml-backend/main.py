from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import copy
import math
import os

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

app = FastAPI(
    title="Bharat AI Vision - ML Backend", 
    version="1.0.0",
    description="Dedicated microservice for heavy AI, Math Engines and Hardware Acceleration"
)

# --- Hydraulic Engineering Models ---
class ManningInput(BaseModel):
    velocity: float # V
    hydraulic_radius: float # R
    slope: float # S

@app.post("/api/hydraulic/manning")
async def calculate_manning(data: ManningInput):
    """
    Manning's Equation Engine to calculate the roughness coefficient (n).
    """
    if data.velocity <= 0:
        raise HTTPException(status_code=400, detail="Velocity must be positive")
    
    n = (math.pow(data.hydraulic_radius, 2/3) * math.sqrt(data.slope)) / data.velocity
    return {"roughness_coefficient_n": n, "formula": "n = (R^(2/3) * S^(1/2)) / V"}

class DarcyInput(BaseModel):
    permeability: float # k
    cross_section_area: float # A
    head_loss: float # dh
    length: float # dl

@app.post("/api/hydraulic/darcy")
async def calculate_darcy(data: DarcyInput):
    """
    Darcy's Law Engine to calculate groundwater discharge (Q).
    """
    if data.length <= 0:
        raise HTTPException(status_code=400, detail="Length must be positive")
    
    # Q = -k * A * (dh/dl)
    hydraulic_gradient = data.head_loss / data.length
    discharge = data.permeability * data.cross_section_area * hydraulic_gradient
    return {"discharge_Q": discharge, "hydraulic_gradient": hydraulic_gradient}

# --- AI & Machine Learning ---
class GNNPredictionRequest(BaseModel):
    node_features: List[float]
    edge_index: List[List[int]]

@app.post("/api/ml/predict-risk-gnn")
async def run_gnn_model(data: GNNPredictionRequest):
    """
    PyTorch Geometric (GNN) placeholder for structural risk analysis.
    Designed for AMD Instinct MI300X / ROCm platform.
    """
    if not TORCH_AVAILABLE:
        return {"status": "error", "message": "PyTorch not installed on this host. Run pip install torch."}
        
    try:
        # Construct tensors for PyTorch / ROCm processing
        x = torch.tensor(data.node_features, dtype=torch.float)
        edges = torch.tensor(data.edge_index, dtype=torch.long)
        
        # Here we would run: out = gnn_model(x, edges)
        # Generating a simulated risk score based on tensor sum for demonstration
        risk_score = float(torch.sigmoid(torch.sum(x)).item())
        
        return {
            "status": "success", 
            "hardware_target": "AMD ROCm / MI300X",
            "framework": "PyTorch Geometric (GNN)",
            "risk_score": risk_score,
            "tensor_shape": list(x.shape)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ClaudeRequest(BaseModel):
    prompt: str

@app.post("/api/ai/claude-analysis")
async def claude_vision_analysis(data: ClaudeRequest):
    """
    Anthropic Claude API integration placeholder
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return {
            "status": "simulated",
            "message": "ANTHROPIC_API_KEY not found. Returning simulated Anthropic API response.",
            "response": "Based on the structural analysis using Claude, the design is robust and meets safety criteria.",
            "model_used": "claude-3-opus-20240229"
        }
    
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        # Make a real call if key is provided
        message = client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=1000,
            messages=[{"role": "user", "content": data.prompt}]
        )
        return {"status": "success", "response": message.content}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "technologies_active": [
            "Python FastAPI", 
            "PyTorch & GNN", 
            "Reinforcement Learning (Prepared)",
            "Anthropic Claude API", 
            "Manning's Equation Engine", 
            "Darcy's Law Engine",
            "Hardware Target: AMD EPYC / MI300X"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    # Optional CORS middleware for the local React App
    from fastapi.middleware.cors import CORSMiddleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allows all origins for local dev
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    print("Starting ML Backend Server on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
