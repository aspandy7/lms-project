from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class QuestionType(enum.Enum):
    SINGLE_CHOICE = "single_choice"  # Один правильный ответ
    MULTIPLE_CHOICE = "multiple_choice"  # Несколько правильных ответов
    TRUE_FALSE = "true_false"  # Верно/неверно
    TEXT_INPUT = "text_input"  # Текстовый ответ

class Question(Base):
    __tablename__ = 'questions'
    
    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey('tests.id', ondelete='CASCADE'), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionType), default=QuestionType.SINGLE_CHOICE)
    order = Column(Integer, default=0)  # Порядок в тесте
    points = Column(Integer, default=1)  # Баллы за правильный ответ
    explanation = Column(Text)  # Объяснение после ответа
    
    # Связи
    test = relationship("Test", back_populates="questions")
    options = relationship("AnswerOption", back_populates="question", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Question {self.id}: {self.question_text[:50]}...>"