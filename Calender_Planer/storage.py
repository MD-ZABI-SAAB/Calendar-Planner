import json
from pathlib import Path

TASKS_FILE = Path(__file__).parent / "tasks.json"

def load_tasks():
    if not TASKS_FILE.exists():
        return[]
    with    open(TASKS_FILE , "r") as file:
        return json.load(file)

def save_tasks(tasks):
    with open(TASKS_FILE , "w") as file:
        json.dump(tasks , file , indent = 2)