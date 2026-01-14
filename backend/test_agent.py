#!/usr/bin/env python3
"""
Test script to verify that the OpenAI agent is working properly
"""

import asyncio
from routes.chat import OPENAI_AGENTS_AVAILABLE

async def test_agent_availability():
    print(f"OpenAI Agents Available: {OPENAI_AGENTS_AVAILABLE}")

    if OPENAI_AGENTS_AVAILABLE:
        try:
            from agents_mcp import Agent, RunnerContext
            from agents import Runner
            print("[SUCCESS] Agents imported successfully")

            # Create a simple test agent to verify functionality
            test_agent = Agent(
                name="Test Assistant",
                instructions="You are a test assistant.",
                mcp_servers=[]  # Empty for this test
            )
            print("[SUCCESS] Agent created successfully")

            runner = Runner()
            print("[SUCCESS] Runner created successfully")

            print("\nAgent is properly configured and ready to use!")
            return True

        except Exception as e:
            print(f"[ERROR] Error testing agent: {str(e)}")
            return False
    else:
        print("[ERROR] OpenAI Agents are not available")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_agent_availability())
    if success:
        print("\n[SUCCESS] The agent system is properly set up!")
    else:
        print("\n[ERROR] There are issues with the agent setup.")