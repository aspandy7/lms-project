# models/lesson_test_result.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Float, CheckConstraint, JSON
from sqlalchemy.orm import relationship, validates
from sqlalchemy.ext.hybrid import hybrid_property
from app.database import Base  # Импортируйте ваш Base из database.py

class LessonTestResult(Base):
    __tablename__ = 'lesson_test_results'
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Связь с пользователем и тестом
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    test_id = Column(Integer, ForeignKey('tests.id'), nullable=False)  # Теперь обязательно
    
    user = relationship("User", back_populates="test_results")
    test = relationship("Test", back_populates="test_results")
    
    # Результаты
    correct_answers = Column(Integer, nullable=False, default=0)
    incorrect_answers = Column(Integer, nullable=False, default=0)
    
    # Статус и время
    is_passed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Дополнительные полезные поля
    time_spent_seconds = Column(Integer, default=0)  # Время на прохождение в секундах
    max_score = Column(Integer, default=100)  # Максимальный возможный балл
    earned_score = Column(Integer, default=0)  # Набранный балл
    
    # Поле для хранения ответов пользователя
    user_answers = Column(JSON, nullable=True)  # Храним структурированные ответы
    
    # Валидация
    @validates('correct_answers', 'incorrect_answers')
    def validate_answers(self, key, value):
        if value < 0:
            raise ValueError(f"{key} не может быть отрицательным")
        return value
    
    # Вычисляемые свойства
    @hybrid_property
    def total_questions(self):
        return self.correct_answers + self.incorrect_answers
    
    @hybrid_property
    def success_rate(self):
        if self.total_questions > 0:
            return round((self.correct_answers / self.total_questions) * 100, 2)
        return 0.0
    
    def __repr__(self):
        return f"<TestResult test={self.test_id} user={self.user_id} score={self.success_rate}%>"