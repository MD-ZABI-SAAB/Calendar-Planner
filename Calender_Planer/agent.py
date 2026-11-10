
from models import Task
from storage import load_tasks, save_tasks


def add_task(description, date_value):
    task = Task(description=description, date=date_value)

    tasks = load_tasks()
    tasks.append({
        "description": task.description,
        "date": task.date.isoformat()
    })

    save_tasks(tasks)
    return task


def get_tasks_by_date(date_value):
    tasks = load_tasks()

    return [
        task for task in tasks
        if task["date"] == str(date_value)
    ]


def get_all_tasks():
    return load_tasks()
