from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.test_results import (
    LessonTestResultCreate, 
    LessonTestResultInDB, 
    LessonTestResultUpdate
)
from app.crud.test_results import (
    create_test_result,
    get_user_results,
    get_lesson_results,
    get_user_lesson_result,
    get_user_statistics
)
from app.models.user import User
from app.api.dependencies import get_current_user

router = APIRouter()

@router.post("/", response_model=LessonTestResultInDB)
def create_result(
    result_data: LessonTestResultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новый результат теста"""
    return create_test_result(db=db, result_data=result_data)

@router.get("/my-results", response_model=List[LessonTestResultInDB])
def read_my_results(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить мои результаты тестов"""
    results = get_user_results(
        db=db, 
        user_id=current_user.id, 
        skip=skip, 
        limit=limit
    )
    return results

@router.get("/lesson/{lesson_number}", response_model=List[LessonTestResultInDB])
def read_lesson_results(
    lesson_number: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Получить все результаты по уроку"""
    results = get_lesson_results(
        db=db, 
        lesson_number=lesson_number, 
        skip=skip, 
        limit=limit
    )
    return results

@router.get("/my-statistics")
def read_my_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить мою статистику"""
    return get_user_statistics(db=db, user_id=current_user.id)

@router.get("/user/{user_id}/lesson/{lesson_number}", response_model=LessonTestResultInDB)
def read_user_lesson_result(
    user_id: int,
    lesson_number: int,
    db: Session = Depends(get_db)
):
    """Получить результат пользователя по уроку"""
    result = get_user_lesson_result(
        db=db, 
        user_id=user_id, 
        lesson_number=lesson_number
    )
    if not result:
        raise HTTPException(status_code=404, detail="Результат не найден")
    return result