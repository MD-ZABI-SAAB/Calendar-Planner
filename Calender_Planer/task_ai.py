
from datetime import date

from pydantic_ai import Agent
from agent import add_task, get_tasks_by_date, get_all_tasks


current_date = date.today().strftime("%d-%b-%Y")


task_agent = Agent(
    "openai:gpt-4o-mini",
    instructions=f"""
You are a helpful Task Planner AI.
The current date is {current_date}.

You can help users create tasks and retrieve tasks.

Use the insert_task tool when a user wants to create a task.
Use the retrieve_tasks tool when a user wants tasks scheduled for a specific date.
Use the retrieve_all_tasks tool when a user asks to see all their tasks.

Understand short replies such as yes, no, and tomorrow using the previous conversation.

Always confirm the date before creating a task if it is unclear.
Never claim a task was saved unless the tool succeeds.
"""
)


@task_agent.tool_plain
def insert_task(description: str, task_date: date) -> str:
    """Create a new task and save it for the specified date."""

    task = add_task(description, task_date)

    return f"Task '{task.description}' added successfully for {task.date}."


@task_agent.tool_plain
def retrieve_tasks(task_date: date) -> str:
    """Retrieve tasks scheduled for a specific date."""

    tasks = get_tasks_by_date(task_date)

    if not tasks:
        return f"No tasks found for {task_date}."

    return ", ".join(task["description"] for task in tasks)


@task_agent.tool_plain
def retrieve_all_tasks() -> str:
    """Retrieve all tasks, including past, present, and future tasks."""

    tasks = get_all_tasks()

    if not tasks:
        return "You don't have any tasks yet."

    return "\n".join(
        f"- {task['description']} ({task['date']})"
        for task in tasks
    )
