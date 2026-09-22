# schemas/lesson_test_result.py
from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional, List, Dict, Any

class LessonTestResultBase(BaseModel):
    test_id: int
    correct_answers: int = 0
    incorrect_answers: int = 0
    time_spent_seconds: Optional[int] = 0
    max_score: Optional[int] = 100
    user_answers: Optional[List[Dict[str, Any]]] = None

class LessonTestResultCreate(LessonTestResultBase):
    user_id: int
    
    @validator('correct_answers', 'incorrect_answers')
    def validate_answers(cls, v):
        if v < 0:
            raise ValueError('Количество ответов не может быть отрицательным')
        return v

class LessonTestResultUpdate(BaseModel):
    correct_answers: Optional[int] = None
    incorrect_answers: Optional[int] = None
    is_passed: Optional[bool] = None

class LessonTestResultInDB(LessonTestResultBase):
    id: int
    user_id: int
    is_passed: bool
    success_rate: float
    total_questions: int
    earned_score: int
    lesson_number: Optional[int] = None  # Будем заполнять из теста
    completed_at: datetime
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        orm_mode = True