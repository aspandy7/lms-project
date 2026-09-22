from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Test(Base):
    __tablename__ = 'tests'
    
    id = Column(Integer, primary_key=True, index=True)
    lesson_number = Column(Integer, nullable=False, index=True)  # К какому уроку привязан тест
    title = Column(String(200), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)  # Можно отключать тесты
    time_limit_minutes = Column(Integer, default=30)  # Ограничение по времени
    passing_score = Column(Integer, default=80)  # Проходной балл (в процентах)
    attempts_allowed = Column(Integer, default=3)  # Сколько раз можно проходить
    created_by = Column(Integer, ForeignKey('users.id'))  # Кто создал тест
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    questions = relationship("Question", back_populates="test", cascade="all, delete-orphan")
    test_results = relationship("LessonTestResult", back_populates="test")
    created_by_user = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<Test {self.title} (Урок {self.lesson_number})>"