# schemas/test.py
from pydantic import BaseModel, validator, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class QuestionType(str, Enum):
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    TEXT_INPUT = "text_input"

class AnswerOptionCreate(BaseModel):
    option_text: str
    is_correct: bool = False
    order: int = 0

class QuestionCreate(BaseModel):
    question_text: str
    question_type: QuestionType = QuestionType.SINGLE_CHOICE
    points: int = Field(1, ge=1)
    order: int = 0
    explanation: Optional[str] = None
    options: List[AnswerOptionCreate] = []
    
    @validator('options')
    def validate_options(cls, v, values):
        if values.get('question_type') == QuestionType.TEXT_INPUT:
            return []  # Текстовые вопросы не имеют вариантов
        if not v:
            raise ValueError('Для вопросов с выбором должен быть хотя бы один вариант')
        
        # Проверяем, что есть правильные варианты для вопросов с выбором
        if values.get('question_type') in [QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE]:
            correct_options = [opt for opt in v if opt.is_correct]
            if not correct_options:
                raise ValueError('Должен быть хотя бы один правильный вариант')
            
            # Для вопросов с одним выбором должен быть только один правильный вариант
            if values.get('question_type') == QuestionType.SINGLE_CHOICE and len(correct_options) > 1:
                raise ValueError('Для вопросов с одним выбором должен быть только один правильный вариант')
        
        return v

class TestCreate(BaseModel):
    lesson_number: int = Field(..., ge=1)
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    is_active: bool = True
    time_limit_minutes: int = Field(30, ge=1)
    passing_score: int = Field(80, ge=1, le=100)
    attempts_allowed: int = Field(3, ge=1)
    questions: List[QuestionCreate] = []
    
    @validator('questions')
    def validate_questions(cls, v):
        if not v:
            raise ValueError('Тест должен содержать хотя бы один вопрос')
        return v

class TestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    time_limit_minutes: Optional[int] = None
    passing_score: Optional[int] = None
    attempts_allowed: Optional[int] = None

class AnswerOptionInDB(AnswerOptionCreate):
    id: int
    
    class Config:
        orm_mode = True

class QuestionInDB(QuestionCreate):
    id: int
    test_id: int
    options: List[AnswerOptionInDB] = []
    
    class Config:
        orm_mode = True

class TestInDB(BaseModel):
    id: int
    lesson_number: int
    title: str
    description: Optional[str]
    is_active: bool
    time_limit_minutes: int
    passing_score: int
    attempts_allowed: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]
    questions: List[QuestionInDB] = []
    
    class Config:
        orm_mode = True

class UserAnswer(BaseModel):
    question_id: int
    selected_option_ids: List[int] = []  # Для множественного выбора
    text_answer: Optional[str] = None  # Для текстовых ответов

class TestSubmission(BaseModel):
    test_id: int
    answers: List[UserAnswer]
    time_spent_seconds: int