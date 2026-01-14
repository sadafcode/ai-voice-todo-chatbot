"""
Test script to verify MCP server can start properly
"""
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    print("Testing MCP server imports...")

    try:
        # Test importing http_server
        import importlib.util
        mcp_server_path = backend_dir / "mcp-server" / "http_server.py"
        spec = importlib.util.spec_from_file_location("http_server", mcp_server_path)
        http_server_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(http_server_module)
        print("✓ Successfully imported http_server.py")

        # Test that tools are loaded
        print("✓ Tools loaded successfully")
        print(f"  - add_task: {http_server_module.add_task}")
        print(f"  - list_tasks: {http_server_module.list_tasks}")
        print(f"  - complete_task: {http_server_module.complete_task}")
        print(f"  - delete_task: {http_server_module.delete_task}")
        print(f"  - update_task: {http_server_module.update_task}")

        print("\nAll imports successful! Starting MCP server on port 8001...")
        http_server_module.start_mcp_server(port=8001)

    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
