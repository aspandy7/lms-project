# api/endpoints/tests.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas.test import TestCreate, TestUpdate, TestInDB, TestSubmission
from app.schemas.test_results import LessonTestResultInDB
from app.crud.test import (
    create_test,
    get_test,
    get_tests_by_lesson,
    get_user_tests,
    update_test,
    delete_test
)
from app.crud.test_results import submit_test_result, get_user_lesson_result
from app.models.user import User
from app.api.dependencies import get_current_user, get_current_active_user

router = APIRouter()

@router.post("/", response_model=TestInDB)
def create_new_test(
    test_data: TestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Создать новый тест (только для преподавателей/админов)"""
    # Проверяем права (например, только преподаватели могут создавать тесты)
    if not current_user.is_teacher and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для создания тестов"
        )
    
    return create_test(db=db, test_data=test_data, user_id=current_user.id)

@router.get("/", response_model=List[TestInDB])
def read_tests(
    lesson_number: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Получить список тестов"""
    if lesson_number:
        return get_tests_by_lesson(db, lesson_number=lesson_number, skip=skip, limit=limit)
    return db.query(Test).offset(skip).limit(limit).all()

@router.get("/my-tests", response_model=List[TestInDB])
def read_my_tests(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить тесты, созданные мной"""
    return get_user_tests(db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/{test_id}", response_model=TestInDB)
def read_test(
    test_id: int,
    db: Session = Depends(get_db)
):
    """Получить тест по ID"""
    test = get_test(db, test_id=test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    
    # Для неактивных тестов проверяем права
    if not test.is_active:
        # Можно добавить проверку на преподавателя/админа
        pass
    
    return test

@router.put("/{test_id}", response_model=TestInDB)
def update_existing_test(
    test_id: int,
    test_update: TestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Обновить тест"""
    test = get_test(db, test_id=test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    
    # Проверяем права: только создатель или админ
    if test.created_by != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Недостаточно прав для редактирования этого теста"
        )
    
    updated_test = update_test(db, test_id=test_id, test_update=test_update)
    if not updated_test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    
    return updated_test

@router.delete("/{test_id}")
def delete_existing_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Удалить тест"""
    test = get_test(db, test_id=test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    
    # Проверяем права
    if test.created_by != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Недостаточно прав для удаления этого теста"
        )
    
    success = delete_test(db, test_id=test_id)
    if not success:
        raise HTTPException(status_code=404, detail="Тест не найден")
    
    return {"message": "Тест успешно удален"}

@router.post("/{test_id}/submit", response_model=LessonTestResultInDB)
def submit_test(
    test_id: int,
    submission: TestSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отправить ответы на тест"""
    # Проверяем, что test_id в submission совпадает с test_id в пути
    if submission.test_id != test_id:
        raise HTTPException(
            status_code=400,
            detail="ID теста в запросе не совпадает с ID в пути"
        )
    
    try:
        result = submit_test_result(db, submission, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка при обработке теста")

@router.get("/{test_id}/my-result", response_model=LessonTestResultInDB)
def get_my_test_result(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить мой результат по тесту"""
    result = get_user_lesson_result(db, user_id=current_user.id, test_id=test_id)
    if not result:
        raise HTTPException(status_code=404, detail="Результат не найден")
    return result