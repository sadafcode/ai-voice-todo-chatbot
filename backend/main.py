from dotenv import load_dotenv

load_dotenv()

import os
import threading
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # NEW IMPORT
from db import create_db_and_tables
from routes.tasks import router as tasks_router
from routes.auth import router as auth_router # NEW IMPORT
from routes.chat import router as chat_router  # NEW IMPORT

# Global variable to track MCP server thread
mcp_server_thread = None

def start_mcp_server_background():
    """Start the MCP server in a background thread"""
    try:
        import sys
        import importlib.util
        from pathlib import Path

        # Add the backend directory to Python path
        backend_dir = Path(__file__).parent
        if str(backend_dir) not in sys.path:
            sys.path.insert(0, str(backend_dir))

        # Import from mcp-server directory using importlib
        mcp_server_path = backend_dir / "mcp-server" / "http_server.py"
        spec = importlib.util.spec_from_file_location("http_server", mcp_server_path)
        http_server_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(http_server_module)

        print("Starting MCP server on port 8001...")
        http_server_module.start_mcp_server(port=8001)
    except Exception as e:
        print(f"Error starting MCP server: {e}")
        import traceback
        traceback.print_exc()

@asynccontextmanager
async def lifespan(app: FastAPI):
    global mcp_server_thread
    # Code to run on startup
    create_db_and_tables()  # Create database tables on startup

    # Start MCP server in background thread
    mcp_server_thread = threading.Thread(target=start_mcp_server_background, daemon=True)
    mcp_server_thread.start()

    # Give MCP server a moment to start
    time.sleep(2)
    print("MCP server should be running on http://127.0.0.1:8001")

    yield
    # Code to run on shutdown (if any)
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)

# CORS CONFIGURATION - Support both local and production
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3004",
    "http://localhost:3005",
    "http://localhost:3006",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3004",
    "http://127.0.0.1:3005",
    "http://127.0.0.1:3006",
]

# Add Vercel frontend URL from environment variable if present
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)
    # Also allow Vercel preview deployments
    if "vercel.app" in frontend_url:
        origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tasks_router)
app.include_router(auth_router) # NEW INCLUDE
app.include_router(chat_router, prefix="/api")  # NEW INCLUDE for chat endpoints

@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI Backend!"}