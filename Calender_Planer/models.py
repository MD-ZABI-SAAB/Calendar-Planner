from datetime import date
from pydantic import BaseModel


class Task(BaseModel):
    description: str
    date: date