
from datetime import date
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_ai.messages import (
    ModelRequest,
    ModelResponse,
    TextPart,
    UserPromptPart,
)

load_dotenv(Path(__file__).resolve().parent / ".env")

from agent import add_task, get_tasks_by_date
from task_ai import task_agent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TaskRequest(BaseModel):
    description: str
    date: date


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AIRequest(BaseModel):
    message: str
    history: list[ChatMessage] = Field(default_factory=list)


@app.post("/tasks")
def create_task(request: TaskRequest):
    return add_task(request.description, request.date)


@app.get("/tasks/{date}")
def get_tasks(date: date):
    return get_tasks_by_date(date)


@app.post("/task-ai")
async def run_task_ai(request: AIRequest):
    message_history = []

    for item in request.history:
        if item.role == "user":
            message_history.append(
                ModelRequest(
                    parts=[UserPromptPart(content=item.content)]
                )
            )

        elif message_history:
            message_history.append(
                ModelResponse(
                    parts=[TextPart(content=item.content)]
                )
            )

    result = await task_agent.run(
        request.message,
        message_history=message_history
    )

    return {"response": result.output}
