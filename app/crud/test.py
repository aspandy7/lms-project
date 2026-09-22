# crud/test.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func
from typing import List, Optional, Dict, Any
from app.models.test import Test
from app.models.test_question import Question, QuestionType
from app.models.test_answer import AnswerOption
from app.schemas.test import TestCreate, TestUpdate, QuestionCreate
from app.api.dependencies import get_current_user
import json

def create_test(db: Session, test_data: TestCreate, user_id: int) -> Test:
    """Создать новый тест с вопросами и вариантами ответов"""
    
    # Создаем тест
    db_test = Test(
        lesson_number=test_data.lesson_number,
        title=test_data.title,
        description=test_data.description,
        is_active=test_data.is_active,
        time_limit_minutes=test_data.time_limit_minutes,
        passing_score=test_data.passing_score,
        attempts_allowed=test_data.attempts_allowed,
        created_by=user_id
    )
    
    db.add(db_test)
    db.commit()
    db.refresh(db_test)
    
    # Создаем вопросы
    for question_data in test_data.questions:
        db_question = Question(
            test_id=db_test.id,
            question_text=question_data.question_text,
            question_type=question_data.question_type,
            points=question_data.points,
            order=question_data.order,
            explanation=question_data.explanation
        )
        db.add(db_question)
        db.commit()
        db.refresh(db_question)
        
        # Создаем варианты ответов
        for option_data in question_data.options:
            db_option = AnswerOption(
                question_id=db_question.id,
                option_text=option_data.option_text,
                is_correct=option_data.is_correct,
                order=option_data.order
            )
            db.add(db_option)
    
    db.commit()
    db.refresh(db_test)
    return db_test

def get_test(db: Session, test_id: int) -> Optional[Test]:
    """Получить тест по ID со всеми вопросами и вариантами"""
    return db.query(Test)\
        .options(
            joinedload(Test.questions).joinedload(Question.options)
        )\
        .filter(Test.id == test_id)\
        .first()

def get_tests_by_lesson(db: Session, lesson_number: int, skip: int = 0, limit: int = 100) -> List[Test]:
    """Получить все тесты для урока"""
    return db.query(Test)\
        .filter(Test.lesson_number == lesson_number)\
        .order_by(desc(Test.created_at))\
        .offset(skip)\
        .limit(limit)\
        .all()

def get_user_tests(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Test]:
    """Получить тесты, созданные пользователем"""
    return db.query(Test)\
        .filter(Test.created_by == user_id)\
        .order_by(desc(Test.created_at))\
        .offset(skip)\
        .limit(limit)\
        .all()

def update_test(db: Session, test_id: int, test_update: TestUpdate) -> Optional[Test]:
    """Обновить тест"""
    db_test = get_test(db, test_id)
    if not db_test:
        return None
    
    update_data = test_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_test, field, value)
    
    db.commit()
    db.refresh(db_test)
    return db_test

def delete_test(db: Session, test_id: int) -> bool:
    """Удалить тест"""
    db_test = get_test(db, test_id)
    if not db_test:
        return False
    
    db.delete(db_test)
    db.commit()
    return True

def check_test_answers(db: Session, test_id: int, user_answers: List[Dict]) -> Dict[str, Any]:
    """Проверить ответы пользователя и вернуть результат"""
    test = get_test(db, test_id)
    if not test:
        raise ValueError("Тест не найден")
    
    questions = test.questions
    total_points = 0
    earned_points = 0
    correct_answers = 0
    incorrect_answers = 0
    detailed_results = []
    
    for question in questions:
        total_points += question.points
        
        # Находим ответ пользователя на этот вопрос
        user_answer = next((a for a in user_answers if a.get('question_id') == question.id), None)
        
        if not user_answer:
            # Пользователь не ответил на вопрос
            detailed_results.append({
                'question_id': question.id,
                'correct': False,
                'points_earned': 0
            })
            incorrect_answers += 1
            continue
        
        # Проверяем ответ в зависимости от типа вопроса
        is_correct = False
        
        if question.question_type == QuestionType.SINGLE_CHOICE:
            # Один правильный вариант
            selected_option_id = user_answer.get('selected_option_ids', [None])[0]
            correct_option = next((opt for opt in question.options if opt.is_correct), None)
            is_correct = correct_option and selected_option_id == correct_option.id
            
        elif question.question_type == QuestionType.MULTIPLE_CHOICE:
            # Несколько правильных вариантов
            selected_ids = set(user_answer.get('selected_option_ids', []))
            correct_ids = {opt.id for opt in question.options if opt.is_correct}
            # Все правильные должны быть выбраны и никаких лишних
            is_correct = selected_ids == correct_ids
            
        elif question.question_type == QuestionType.TEXT_INPUT:
            # Текстовый ответ (пока простой вариант)
            text_answer = user_answer.get('text_answer', '').strip().lower()
            # Можно добавить более сложную логику проверки
            # Сейчас просто проверяем непустой ответ
            is_correct = bool(text_answer)
            
        elif question.question_type == QuestionType.TRUE_FALSE:
            # Верно/неверно
            selected_option_id = user_answer.get('selected_option_ids', [None])[0]
            correct_option = next((opt for opt in question.options if opt.is_correct), None)
            is_correct = correct_option and selected_option_id == correct_option.id
        
        # Записываем результат
        if is_correct:
            earned_points += question.points
            correct_answers += 1
        else:
            incorrect_answers += 1
        
        detailed_results.append({
            'question_id': question.id,
            'correct': is_correct,
            'points_earned': question.points if is_correct else 0
        })
    
    # Рассчитываем процент
    success_rate = (earned_points / total_points * 100) if total_points > 0 else 0
    
    return {
        'total_questions': len(questions),
        'correct_answers': correct_answers,
        'incorrect_answers': incorrect_answers,
        'total_points': total_points,
        'earned_points': earned_points,
        'success_rate': round(success_rate, 2),
        'is_passed': success_rate >= test.passing_score,
        'detailed_results': detailed_results
    }