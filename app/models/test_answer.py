from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class AnswerOption(Base):
    __tablename__ = 'answer_options'
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey('questions.id', ondelete='CASCADE'), nullable=False)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    order = Column(Integer, default=0)  # Порядок отображения
    
    # Связи
    question = relationship("Question", back_populates="options")
    
    def __repr__(self):
        return f"<Option {self.id}: {self.option_text[:30]}... (correct: {self.is_correct})>"