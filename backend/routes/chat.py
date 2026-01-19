"""
Chat API Endpoint for AI Chatbot
Implements the stateless chat endpoint that persists conversation state to database
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List, Dict, Any
from sqlmodel import Session, select
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
import asyncio
import re

from db import get_session
from models import User, Conversation, Message
from auth import get_current_user

# Simple in-memory storage for conversation state (in production, this should be in DB)
# Keys are conversation_id + user_id, values are dictionaries storing task creation state
conversation_state = {}

# Import OpenAI Agents SDK and MCP integration
try:
    from agents_mcp import Agent, RunnerContext
    from agents import Runner, function_tool
    import httpx
    OPENAI_AGENTS_AVAILABLE = True
except ImportError as e:
    OPENAI_AGENTS_AVAILABLE = False
    # Fallback implementation will be used
    print(f"Warning: OpenAI Agents SDK not available: {e}")
    print("Falling back to NLU processing")

# Import MCP client wrapper for tool calls
from mcp_client_wrapper import MCP_TOOL_FUNCTIONS

router = APIRouter()


class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str


class ChatResponse(BaseModel):
    conversation_id: int
    response: str
    tool_calls: Optional[List[Dict[str, Any]]] = None


class AIChatbotAgent:
    """
    AI Agent for handling chatbot interactions
    Follows the pattern from reusable skill for consistency
    """

    def __init__(self, session: Session):
        self.session = session

    def _get_conversation_history(self, conversation_id: int) -> List[Dict[str, str]]:
        """
        Retrieve conversation history for context
        """
        history_messages = self.session.exec(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        ).all()

        return [
            {"role": msg.role, "content": msg.content}
            for msg in history_messages
        ]

    async def process_message(self, message: str, user_id: str, conversation_id: int) -> tuple[str, List[Dict[str, Any]]]:
        """
        Process a user message and return AI response with tool calls
        """
        # Get conversation history for context
        history = self._get_conversation_history(conversation_id)

        # Process with OpenAI Agents SDK if available, otherwise use fallback
        if OPENAI_AGENTS_AVAILABLE:
            response_text, tool_calls = await self._process_with_openai_agents(
                message, user_id, history
            )
        else:
            # Fallback implementation
            response_text, tool_calls = await self._process_natural_language_command(
                message, user_id, history
            )

        return response_text, tool_calls

    async def _process_with_openai_agents(
        self,
        message: str,
        user_id: str,
        history_messages: List[Dict[str, str]]
    ) -> tuple[str, List[Dict[str, Any]]]:
        """
        Process message using OpenAI Agents SDK with MCP integration
        """
        if not OPENAI_AGENTS_AVAILABLE:
            # Fallback if agents are not available
            return await self._process_natural_language_command(message, user_id, history_messages)

        print(f"DEBUG: Creating agent for user {user_id} with message: {message}")  # Debug line

        # Create an agent with improved, dynamic instructions using configuration-based MCP connection
        # First, ensure the MCP server is available by attempting to list tasks
        from db import get_session
        from models import Task
        from sqlmodel import select

        # Check if user has tasks to determine intent more intelligently
        has_tasks = False
        try:
            with get_session() as session:
                task_count = session.exec(select(Task).where(Task.user_id == user_id)).count()
                has_tasks = task_count > 0
        except:
            pass  # Ignore errors when checking for existing tasks

        # Define the tools availability based on whether we can access them
        tools_description = ""
        if has_tasks:
            tools_description = """
            AVAILABLE TOOLS:
            - list_tasks: Get user's tasks (call this first when user refers to existing tasks)
            - add_task: Create a new task
            - update_task: Modify an existing task (can update title, description, priority, recurrence, completion status)
            - complete_task: Mark a task as completed
            - delete_task: Remove a task
            """
        else:
            tools_description = """
            AVAILABLE TOOLS:
            - list_tasks: Get user's tasks (returns empty if none exist)
            - add_task: Create a new task
            - update_task: Modify an existing task (will fail if task doesn't exist)
            - complete_task: Mark a task as completed (will fail if task doesn't exist)
            - delete_task: Remove a task (will fail if task doesn't exist)
            """

        # Create the agent with MCP tools via HTTP wrapper
        try:
            import os

            # Verify OpenAI API key is set
            openai_key = os.getenv("OPENAI_API_KEY")
            if not openai_key:
                print("ERROR: OPENAI_API_KEY not found in environment")
                print("Falling back to NLU processing")
                return await self._process_natural_language_command(message, user_id, history_messages)

            print(f"DEBUG: OpenAI API key is set (length: {len(openai_key)})")

            # MCP endpoints are now integrated into main app - no separate health check needed
            # Check if running locally (8001) or production (integrated)
            mcp_base_url = os.getenv("MCP_SERVER_URL", "http://127.0.0.1:8001")
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    # Try integrated endpoint first (same server)
                    try:
                        health_response = await client.get(f"{mcp_base_url}/health")
                        if health_response.status_code == 200:
                            print(f"DEBUG: MCP server is healthy at {mcp_base_url}")
                    except:
                        # Try local development port
                        health_response = await client.get("http://127.0.0.1:8001/health")
                        if health_response.status_code == 200:
                            print("DEBUG: MCP server is healthy (port 8001)")
                            mcp_base_url = "http://127.0.0.1:8001"
            except Exception as e:
                print(f"WARNING: MCP health check failed: {e}")
                print("Continuing with agent - MCP tools may still work via integrated endpoints")

            # Convert MCP wrapper functions to agent tools
            # These functions make HTTP calls to the MCP server
            mcp_tools = []
            for tool_name, tool_func in MCP_TOOL_FUNCTIONS.items():
                mcp_tools.append(function_tool(tool_func))

            print(f"DEBUG: Created {len(mcp_tools)} MCP tools for agent")

            # Create the agent with MCP tools
            agent = Agent(
                name="Todo Assistant",
                instructions=f"""
                You are an intelligent multilingual task management assistant that helps users manage their tasks via MCP tools.

                🌐 CRITICAL MULTI-LANGUAGE RULE (MUST FOLLOW):
                - You support BOTH English AND Urdu (اردو)
                - **MANDATORY**: DETECT the language of the user's message FIRST
                - **MANDATORY**: If user writes in Urdu (اردو), you MUST respond ONLY in Urdu (اردو)
                - **MANDATORY**: If user writes in English, respond in English
                - NEVER respond in English when user writes in Urdu
                - اگر صارف اردو میں لکھے تو آپ کو لازمی اردو میں جواب دینا ہے
                - If user mixes languages, respond in the dominant language used

                USER ID: {user_id} (CRITICAL: Always pass this exact user_id when calling ANY tool)

                MANDATORY RULE: For ANY request involving existing tasks (update, complete, delete, show), you MUST IMMEDIATELY call list_tasks_tool FIRST. NEVER ask the user for clarification before calling list_tasks_tool.

                YOUR CORE BEHAVIOR:
                1. DETECT the language (English or Urdu)
                2. IMMEDIATELY call list_tasks_tool to see current tasks (for any request except "add new task")
                3. ANALYZE the user's message to understand their intent
                4. CALL appropriate MCP tools to modify task information
                5. INTERPRET the results and formulate helpful response IN THE USER'S LANGUAGE

                {tools_description}

                TASK IDENTIFICATION (CRITICAL):
                When user mentions a task by name (e.g., "dentist task", "ڈینٹسٹ کا کام"):
                1. IMMEDIATELY call list_tasks_tool(user_id="{user_id}") - DO NOT ASK FOR CLARIFICATION FIRST
                2. Search the returned tasks for partial matches (case-insensitive):
                   - "dentist task" matches any task with "dentist" in title
                   - "meeting" matches any task with "meeting" in title
                   - Works with Urdu words too!
                3. If exactly ONE match found → proceed with the action
                4. If MULTIPLE matches found → ask which specific one (in user's language)
                5. If NO matches found → inform user no matching task exists (in user's language)

                INTENT RECOGNITION - ENGLISH:
                - "show my tasks" / "list tasks" → list_tasks_tool → display all tasks
                - "add task X" → add_task_tool(title=X)
                - "update X task to Y" → list_tasks_tool → find X → update_task_tool(task_id, title with Y info)
                - "make X urgent" → list_tasks_tool → find X → update_task_tool with "URGENT:" prefix
                - "X for tomorrow" → list_tasks_tool → find X → update_task_tool with tomorrow mention
                - "mark X done" / "complete X" → list_tasks_tool → find X → complete_task_tool(task_id)
                - "delete X" → list_tasks_tool → find X → delete_task_tool(task_id)

                INTENT RECOGNITION - URDU (اردو):
                - "میرے کام دکھائیں" / "تمام کام" → list_tasks_tool → تمام کام دکھائیں
                - "نیا کام X" / "کام شامل کریں X" → add_task_tool(title=X)
                - "X کام کو اپڈیٹ کریں" → list_tasks_tool → find X → update_task_tool
                - "X کو ضروری بنائیں" / "X فوری" → list_tasks_tool → find X → update with "فوری:" prefix
                - "X کل کے لیے" → list_tasks_tool → find X → update with کل (tomorrow)
                - "X مکمل کریں" / "X ہو گیا" → list_tasks_tool → find X → complete_task_tool
                - "X حذف کریں" / "X ڈیلیٹ کریں" → list_tasks_tool → find X → delete_task_tool

                CONCRETE EXAMPLES:

                English Example:
                User: "update dentist task to tomorrow urgent"
                Step 1: Call list_tasks_tool(user_id="{user_id}")
                Step 2: Find task containing "dentist"
                Step 3: Call update_task_tool(task_id=5, title="URGENT: Dentist appointment - TOMORROW")
                Step 4: Respond: "I've updated your dentist task to tomorrow and marked it as urgent!"

                Urdu Example (اردو مثال):
                User: "ڈینٹسٹ کے کام کو کل کے لیے فوری بنائیں"
                Step 1: Call list_tasks_tool(user_id="{user_id}")
                Step 2: Find task containing "ڈینٹسٹ" or "dentist"
                Step 3: Call update_task_tool(task_id=5, title="فوری: ڈینٹسٹ اپائنٹمنٹ - کل")
                Step 4: Respond: "میں نے آپ کا ڈینٹسٹ کا کام کل کے لیے اپڈیٹ کر دیا ہے اور اسے فوری قرار دے دیا ہے!"

                DO NOT ask "Could you please specify which task?" - ALWAYS call list_tasks_tool first!

                RESPONSE STYLE:
                - ENGLISH: Be action-oriented: "I've updated..." not "I understand you want..."
                - URDU: فعال انداز میں جواب دیں: "میں نے اپڈیٹ کر دیا ہے..." نہ کہ "میں سمجھتا ہوں کہ آپ چاہتے ہیں..."
                - Confirm specific changes made (in user's language)
                - Only ask for clarification if truly multiple exact matches exist (in user's language)
                - Be natural and conversational in the language you're using

                ⚠️ URDU RESPONSE EXAMPLES (USE THESE PATTERNS):
                - "میں نے آپ کا کام شامل کر دیا ہے!" (Task added)
                - "یہ رہے آپ کے تمام کام:" (Here are your tasks)
                - "کام مکمل ہو گیا!" (Task completed)
                - "کام حذف کر دیا گیا!" (Task deleted)
                - "کام اپڈیٹ ہو گیا!" (Task updated)
                """,
                tools=mcp_tools
            )
            print("DEBUG: Agent created successfully with MCP tools via HTTP wrapper")  # Debug line
        except Exception as e:
            print(f"DEBUG: Error creating agent: {str(e)}")  # Debug line
            import traceback
            traceback.print_exc()
            # If there's an error creating the agent, fall back to the simple implementation
            return await self._process_natural_language_command(message, user_id, history_messages)

        # Run the agent with the user's message
        try:
            runner_instance = Runner()
            print(f"DEBUG: Running agent with message: {message}")

            result = await runner_instance.run(
                starting_agent=agent,
                input=message,
                context=RunnerContext()
            )

            print(f"DEBUG: Agent run completed. Result type: {type(result)}")

            # Extract the response from RunResult.final_output
            response_text = None

            # RunResult has a final_output attribute
            if hasattr(result, 'final_output'):
                final_output = result.final_output
                print(f"DEBUG: final_output type: {type(final_output)}")
                print(f"DEBUG: final_output value: {final_output}")

                # final_output might be a string or might be a response object
                if isinstance(final_output, str):
                    response_text = final_output
                elif hasattr(final_output, 'value'):
                    response_text = final_output.value
                elif hasattr(final_output, 'content'):
                    response_text = final_output.content
                elif hasattr(final_output, '__str__'):
                    response_text = str(final_output)

            if not response_text:
                response_text = "I processed your request but couldn't extract the response."
                print(f"DEBUG: Could not extract response, using fallback")

            # Extract tool calls that were made during processing
            tool_calls = []
            if hasattr(result, 'tool_calls'):
                tool_calls = result.tool_calls or []

            print(f"DEBUG: Extracted {len(tool_calls)} tool calls")
            print(f"DEBUG: Final response: {response_text}")

            return response_text, tool_calls

        except Exception as e:
            print(f"ERROR: Exception running OpenAI Agent: {str(e)}")
            import traceback
            traceback.print_exc()
            # If there's an error with the agents, fall back to the simple implementation
            return await self._process_natural_language_command(message, user_id, history_messages)

    async def _process_natural_language_command(
        self,
        message: str,
        user_id: str,
        history_messages: List[Dict[str, str]]
    ) -> tuple[str, List[Dict[str, Any]]]:
        """
        Process natural language command and execute appropriate MCP tools
        This is a fallback implementation when OpenAI Agents SDK is not available
        """
        from sqlmodel import select
        from models import Task  # Import the Task model

        try:
            # Simple natural language processing to identify commands
            message_lower = message.lower().strip()

            # Create a unique key for conversation state
            conversation_key = f"{user_id}_{history_messages[-1]['content'] if history_messages else 'default'}" if history_messages else f"{user_id}_default"

            # Check if we're in the middle of a task creation process
            if conversation_key in conversation_state and conversation_state[conversation_key].get('creating_task'):
                # Continue the task creation process
                task_data = conversation_state[conversation_key]['task_data']

                # Determine what we're asking for based on current step
                current_step = conversation_state[conversation_key].get('step', 'title')

                if current_step == 'title':
                    # User provided title, save it and ask for description
                    task_data['title'] = message.strip()
                    conversation_state[conversation_key]['step'] = 'description'

                    # Update state and ask for description
                    response = "Got it! Would you like to add a description for this task? (Reply with the description or 'no' to skip)"
                    return response, []

                elif current_step == 'description':
                    # User provided description, save it and ask for priority
                    if message_lower not in ['no', 'skip', 'none', 'no description']:
                        task_data['description'] = message.strip()
                    else:
                        task_data['description'] = ""
                    conversation_state[conversation_key]['step'] = 'priority'

                    response = "What priority should this task have? Choose from: low, medium, high (or reply 'medium' to skip)"
                    return response, []

                elif current_step == 'priority':
                    # User provided priority, save it and ask for recurrence
                    priority = message_lower
                    if priority in ['low', 'medium', 'high']:
                        task_data['priority'] = priority
                    else:
                        # Default to medium if invalid priority
                        task_data['priority'] = 'medium'

                    conversation_state[conversation_key]['step'] = 'recurrence'

                    response = "Should this task repeat? Choose from: daily, weekly, monthly, none (or reply 'none' to skip)"
                    return response, []

                elif current_step == 'recurrence':
                    # User provided recurrence, save it and create the task
                    recurrence = message_lower
                    if recurrence in ['daily', 'weekly', 'monthly']:
                        task_data['recurrence_pattern'] = recurrence
                    else:
                        task_data['recurrence_pattern'] = None

                    # Now create the task with all collected information
                    try:
                        new_task = Task(
                            user_id=user_id,
                            title=task_data['title'],
                            description=task_data.get('description', ''),
                            priority=task_data.get('priority', 'medium'),
                            recurrence_pattern=task_data.get('recurrence_pattern', None),
                            completed=False
                        )
                        self.session.add(new_task)
                        self.session.commit()
                        self.session.refresh(new_task)

                        # Clear the conversation state
                        del conversation_state[conversation_key]

                        # Create a comprehensive response
                        response_parts = [f"Task '{new_task.title}' has been created for you with ID {new_task.id}."]
                        if new_task.description:
                            response_parts.append(f"Description: {new_task.description}")
                        if new_task.priority != "medium":
                            response_parts.append(f"Priority: {new_task.priority}")
                        if new_task.recurrence_pattern:
                            response_parts.append(f"Repeats: {new_task.recurrence_pattern}")

                        response_text = " ".join(response_parts)

                        return response_text, [
                            {"tool_name": "add_task", "parameters": {
                                "user_id": user_id,
                                "title": new_task.title,
                                "description": new_task.description,
                                "priority": new_task.priority,
                                "recurrence_pattern": new_task.recurrence_pattern
                            }}
                        ]
                    except Exception as e:
                        # Clear the conversation state on error
                        if conversation_key in conversation_state:
                            del conversation_state[conversation_key]
                        return f"Error creating task: {str(e)}", []

            # Regular command processing (not in task creation flow)

            # Detect if message is in Urdu
            is_urdu = any(ord(char) >= 0x0600 and ord(char) <= 0x06FF for char in message)

            # Fallback implementation - simple and clean approach
            # Add task command - English and Urdu keywords
            add_keywords_en = ["add", "create", "new", "remember", "make", "setup"]
            add_keywords_ur = ["شامل", "بنائیں", "نیا", "کام", "ٹاسک"]
            show_keywords_en = ["show", "list", "see", "what", "all"]
            show_keywords_ur = ["دکھائیں", "دکھاؤ", "بتائیں", "تمام", "میرے"]

            if any(word in message_lower for word in add_keywords_en) or any(word in message for word in add_keywords_ur) and not any(word in message_lower for word in show_keywords_en) and not any(word in message for word in show_keywords_ur):
                # Extract potential title after removing command words
                potential_title = re.sub(r'^(add|create|new|remember|make|set|setup)', '', message_lower, 1, re.IGNORECASE).strip()

                # If we have a potential title that's substantial, create the task directly
                if len(potential_title) > 3:  # At least a few characters for a meaningful title
                    # Extract priority if mentioned
                    priority = "medium"  # default
                    if "priority" in message_lower or "high" in message_lower or "low" in message_lower:
                        if "high priority" in message_lower or ("high" in message_lower and "priority" in message_lower):
                            priority = "high"
                        elif "low priority" in message_lower or ("low" in message_lower and "priority" in message_lower):
                            priority = "low"
                        # Otherwise leave as medium

                    # Extract recurrence pattern if mentioned
                    recurrence_pattern = None
                    if "daily" in message_lower:
                        recurrence_pattern = "daily"
                    elif "weekly" in message_lower:
                        recurrence_pattern = "weekly"
                    elif "monthly" in message_lower:
                        recurrence_pattern = "monthly"
                    elif "yearly" in message_lower or "annually" in message_lower:
                        recurrence_pattern = "yearly"

                    # Extract description if mentioned
                    description = ""
                    # Look for common indicators of description after the title
                    if "description" in message_lower or "desc" in message_lower:
                        desc_match = re.search(r'(?:description|desc)[\s:]*(.*)', message_lower, re.IGNORECASE)
                        if desc_match:
                            description = desc_match.group(1).strip()

                    # Clean up title to remove priority/recurrence words
                    title_clean = re.sub(r'\b(high|medium|low)\b\s*priority\b', '', potential_title, flags=re.IGNORECASE).strip()
                    title_clean = re.sub(r'\b(daily|weekly|monthly|yearly|annually)\b', '', title_clean, flags=re.IGNORECASE).strip()
                    title_clean = re.sub(r'(?:description|desc)[\s:]*(.*)', '', title_clean, flags=re.IGNORECASE).strip()  # Remove description part
                    title_clean = re.sub(r'\s+', ' ', title_clean).strip()  # Clean up extra whitespace

                    # Create the task directly since we have substantial information
                    try:
                        new_task = Task(
                            user_id=user_id,
                            title=title_clean,
                            description=description,
                            priority=priority,
                            recurrence_pattern=recurrence_pattern,
                            completed=False
                        )
                        self.session.add(new_task)
                        self.session.commit()
                        self.session.refresh(new_task)

                        # Create a more informative response
                        response_parts = [f"Task '{new_task.title}' has been created for you with ID {new_task.id}."]
                        if priority != "medium":
                            response_parts.append(f"Priority: {priority}.")
                        if recurrence_pattern:
                            response_parts.append(f"Repeats: {recurrence_pattern}.")
                        if description:
                            response_parts.append(f"Description: {description}")

                        response_text = " ".join(response_parts)

                        return response_text, [
                            {"tool_name": "add_task", "parameters": {
                                "user_id": user_id,
                                "title": title_clean,
                                "priority": priority,
                                "recurrence_pattern": recurrence_pattern,
                                "description": description
                            }}
                        ]
                    except Exception as e:
                        return f"Error creating task: {str(e)}", []
                else:
                    # Start the interactive task creation process
                    conversation_state[conversation_key] = {
                        'creating_task': True,
                        'step': 'title',
                        'task_data': {}
                    }

                    return "I understand you want to create a task! What would you like to name this task?", []

            # List tasks command - English and Urdu
            list_keywords_en = ["show", "list", "see", "what", "my", "all", "tasks"]
            list_keywords_ur = ["دکھائیں", "دکھاؤ", "بتائیں", "تمام", "میرے", "کام"]
            modify_keywords = ["update", "change", "modify", "edit", "complete", "done", "finish", "mark", "delete", "remove", "cancel", "اپڈیٹ", "مکمل", "حذف", "ڈیلیٹ"]

            if (any(word in message_lower for word in list_keywords_en) or any(word in message for word in list_keywords_ur)) and not any(word in message_lower for word in modify_keywords) and not any(word in message for word in modify_keywords):
                status = None
                if "pending" in message_lower or "incomplete" in message_lower:
                    status = "pending"
                elif "completed" in message_lower or "done" in message_lower:
                    status = "completed"

                try:
                    # Build query based on status filter
                    query = select(Task).where(Task.user_id == user_id)

                    if status and status != "all":
                        if status == "pending":
                            query = query.where(Task.completed == False)
                        elif status == "completed":
                            query = query.where(Task.completed == True)

                    tasks = self.session.exec(query).all()

                    if tasks:
                        task_list = []
                        for task in tasks:
                            if is_urdu:
                                task_info = f"'{task.title}' (آئی ڈی: {task.id})"
                                if task.completed:
                                    task_info += " [مکمل]"
                            else:
                                task_info = f"'{task.title}' (ID: {task.id})"
                                if task.completed:
                                    task_info += " [COMPLETED]"
                            task_list.append(task_info)

                        # Format tasks with each on a new line for better readability
                        formatted_tasks = "\n".join([f"{i+1}. {task}" for i, task in enumerate(task_list)])

                        if is_urdu:
                            return f"یہ رہے آپ کے کام:\n\n{formatted_tasks}", [
                                {"tool_name": "list_tasks", "parameters": {"user_id": user_id, "status": status}}
                            ]
                        else:
                            status_text = f" {status}" if status else " all"
                            return f"Here are your{status_text} tasks:\n\n{formatted_tasks}", [
                                {"tool_name": "list_tasks", "parameters": {"user_id": user_id, "status": status}}
                            ]
                    else:
                        if is_urdu:
                            return "آپ کے پاس ابھی کوئی کام نہیں ہے۔", [
                                {"tool_name": "list_tasks", "parameters": {"user_id": user_id, "status": status}}
                            ]
                        else:
                            status_text = f" {status}" if status else " all"
                            return f"You don't have any{status_text} tasks.", [
                                {"tool_name": "list_tasks", "parameters": {"user_id": user_id, "status": status}}
                            ]
                except Exception as e:
                    return f"Error listing tasks: {str(e)}", []

            # For other commands (update, complete, delete), use simple acknowledgment and ask for clarification
            # This allows the OpenAI Agent to handle complex intent recognition
            elif any(word in message_lower for word in ["update", "change", "modify", "edit"]):
                return f"I understand you want to update a task. Could you please specify which task you'd like to update and what changes you'd like to make?", []

            elif any(word in message_lower for word in ["complete", "done", "finish", "mark"]):
                return f"I understand you want to mark a task as complete. Could you please specify which task you'd like to mark as complete?", []

            elif any(word in message_lower for word in ["delete", "remove", "cancel"]):
                return f"I understand you want to delete a task. Could you please specify which task you'd like to delete?", []

            else:
                # Default response - bilingual
                if is_urdu:
                    return "میں سمجھتا ہوں آپ اپنے کاموں کے بارے میں بات کر رہے ہیں۔ آپ مجھ سے کام شامل کرنے، دکھانے، مکمل کرنے، حذف کرنے، یا اپڈیٹ کرنے کے لیے کہہ سکتے ہیں۔", []
                else:
                    return "I understand you're trying to interact with your tasks. You can ask me to add, list, complete, delete, or update tasks.", []

        except Exception as e:
            return f"Error processing your request: {str(e)}", []


@router.post("/{user_id}/chat")
async def chat_endpoint(
    user_id: str,  # Get user_id from path
    request: ChatRequest,
    current_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Chat endpoint that processes user messages and returns AI responses
    """
    # Verify that the user_id in the path matches the authenticated user
    if current_user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")

    agent = AIChatbotAgent(session)

    # If no conversation_id provided, create a new one
    conversation_id = request.conversation_id
    if not conversation_id:
        # Create a new conversation
        new_conversation = Conversation(
            user_id=current_user_id,  # Use current_user_id instead of path parameter
            title=f"Chat {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}"
        )
        session.add(new_conversation)
        session.commit()
        session.refresh(new_conversation)
        conversation_id = new_conversation.id

    # Process the message
    response_text, tool_calls = await agent.process_message(
        request.message,
        current_user_id,  # Use current_user_id instead of path parameter
        conversation_id
    )

    # Save the user message
    user_message = Message(
        conversation_id=conversation_id,
        role="user",
        content=request.message,
        user_id=current_user_id  # Use current_user_id instead of path parameter
    )
    session.add(user_message)

    # Save the AI response
    ai_message = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=response_text,
        user_id=current_user_id  # Use current_user_id instead of path parameter
    )
    session.add(ai_message)

    session.commit()

    return ChatResponse(
        conversation_id=conversation_id,
        response=response_text,
        tool_calls=tool_calls
    )

