from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.models.test_results import LessonTestResult
from app.schemas.test_results import LessonTestResultCreate, LessonTestResultUpdate
from typing import List, Optional
from app.schemas.test import TestSubmission

def submit_test_result(
    db: Session,
    submission: TestSubmission,
    user_id: int
) -> LessonTestResult:
    """Отправить результат теста"""
    
    # Проверяем ответы
    from crud.test import check_test_answers  # Импортируем здесь, чтобы избежать циклического импорта
    test_result = check_test_answers(db, submission.test_id, submission.answers)
    
    # Проверяем количество попыток
    previous_attempts = db.query(LessonTestResult)\
        .filter(
            LessonTestResult.user_id == user_id,
            LessonTestResult.test_id == submission.test_id
        )\
        .count()
    
    # Получаем тест для проверки лимита попыток
    from crud.test import get_test
    test = get_test(db, submission.test_id)
    if test and previous_attempts >= test.attempts_allowed:
        raise ValueError(f"Превышено максимальное количество попыток ({test.attempts_allowed})")
    
    # Создаем запись результата
    db_result = LessonTestResult(
        user_id=user_id,
        test_id=submission.test_id,
        correct_answers=test_result['correct_answers'],
        incorrect_answers=test_result['incorrect_answers'],
        earned_score=test_result['earned_points'],
        max_score=test_result['total_points'],
        time_spent_seconds=submission.time_spent_seconds,
        is_passed=test_result['is_passed'],
        user_answers=submission.answers  # Здесь submission.answers уже список словарей
    )
    
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def create_test_result(
    db: Session, 
    result_data: LessonTestResultCreate
) -> LessonTestResult:
    """Создать новый результат теста"""
    
    # Рассчитываем набранный балл
    total_questions = result_data.correct_answers + result_data.incorrect_answers
    if total_questions > 0:
        success_rate = (result_data.correct_answers / total_questions) * 100
        earned_score = int((success_rate / 100) * result_data.max_score)
        is_passed = success_rate >= 80  # Порог 80% для прохождения
    else:
        earned_score = 0
        is_passed = False
    
    # Создаем объект
    db_result = LessonTestResult(
        **result_data.dict(exclude={'earned_score', 'success_rate'}),
        earned_score=earned_score,
        is_passed=is_passed
    )
    
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

def get_user_results(
    db: Session, 
    user_id: int, 
    skip: int = 0, 
    limit: int = 100
) -> List[LessonTestResult]:
    """Получить все результаты тестов пользователя"""
    return db.query(LessonTestResult)\
        .filter(LessonTestResult.user_id == user_id)\
        .order_by(desc(LessonTestResult.completed_at))\
        .offset(skip)\
        .limit(limit)\
        .all()

def get_lesson_results(
    db: Session, 
    lesson_number: int, 
    skip: int = 0, 
    limit: int = 100
) -> List[LessonTestResult]:
    """Получить все результаты по конкретному уроку"""
    return db.query(LessonTestResult)\
        .filter(LessonTestResult.lesson_number == lesson_number)\
        .order_by(desc(LessonTestResult.success_rate))\
        .offset(skip)\
        .limit(limit)\
        .all()

def get_user_lesson_result(
    db: Session, 
    user_id: int, 
    lesson_number: int
) -> Optional[LessonTestResult]:
    """Получить результат конкретного пользователя по конкретному уроку"""
    return db.query(LessonTestResult)\
        .filter(
            LessonTestResult.user_id == user_id,
            LessonTestResult.lesson_number == lesson_number
        )\
        .first()

def get_user_statistics(db: Session, user_id: int) -> dict:
    """Получить статистику пользователя"""
    results = db.query(LessonTestResult)\
        .filter(LessonTestResult.user_id == user_id)\
        .all()
    
    if not results:
        return {
            "total_tests": 0,
            "average_score": 0,
            "passed_tests": 0,
            "total_correct": 0,
            "total_incorrect": 0
        }
    
    total_tests = len(results)
    passed_tests = sum(1 for r in results if r.is_passed)
    total_correct = sum(r.correct_answers for r in results)
    total_incorrect = sum(r.incorrect_answers for r in results)
    
    return {
        "total_tests": total_tests,
        "average_score": round(sum(r.success_rate for r in results) / total_tests, 2),
        "passed_tests": passed_tests,
        "pass_rate": round((passed_tests / total_tests) * 100, 2) if total_tests > 0 else 0,
        "total_correct": total_correct,
        "total_incorrect": total_incorrect,
        "total_questions": total_correct + total_incorrect
    }