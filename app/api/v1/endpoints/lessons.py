from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonResponse, LessonAttachmentCreate, LessonAttachmentResponse
from app.crud import lesson as crud_lesson
from app.crud import course as crud_course
from app.api.dependencies import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.services.file_service import FileService
from app.services.markdown_service import MarkdownService
import os

router = APIRouter()
file_service = FileService()
markdown_service = MarkdownService()

@router.get("/course/{course_id}", response_model=List[LessonResponse])
async def read_lessons(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Получить все уроки курса"""
    course = crud_course.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Проверяем доступ
    if not course.is_published and course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to view lessons")
    
    lessons = crud_lesson.get_lessons_by_course(db, course_id=course_id)
    return lessons

@router.get("/{lesson_id}", response_model=LessonResponse)
async def read_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Получить урок по ID"""
    lesson = crud_lesson.get_lesson_with_attachments(db, lesson_id=lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверяем доступ к курсу
    course = crud_course.get_course(db, course_id=lesson.course_id)
    if not course.is_published and course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to view this lesson")
    
    return lesson

@router.post("/", response_model=LessonResponse)
async def create_lesson(
    lesson: LessonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.AUTHOR))
):
    """Создать новый урок"""
    # Проверяем, что курс существует и пользователь автор
    course = crud_course.get_course(db, course_id=lesson.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to add lessons to this course")
    
    return crud_lesson.create_lesson(db=db, lesson=lesson)

@router.put("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: int,
    lesson_update: LessonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Обновить урок"""
    lesson = crud_lesson.get_lesson(db, lesson_id=lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверяем права
    course = crud_course.get_course(db, course_id=lesson.course_id)
    if course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to update this lesson")
    
    updated_lesson = crud_lesson.update_lesson(db, lesson_id=lesson_id, lesson_update=lesson_update)
    if not updated_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return updated_lesson

@router.delete("/{lesson_id}")
async def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Удалить урок"""
    lesson = crud_lesson.get_lesson(db, lesson_id=lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверяем права
    course = crud_course.get_course(db, course_id=lesson.course_id)
    if course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this lesson")
    
    crud_lesson.delete_lesson(db, lesson_id=lesson_id)
    return {"message": "Lesson deleted successfully"}

@router.post("/{lesson_id}/upload-attachment", response_model=LessonAttachmentResponse)
async def upload_attachment(
    lesson_id: int,
    file: UploadFile = File(...),
    is_video: bool = Form(False),
    video_url: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Загрузить вложение для урока"""
    lesson = crud_lesson.get_lesson(db, lesson_id=lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверяем права
    course = crud_course.get_course(db, course_id=lesson.course_id)
    if course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    attachment_data = {}
    
    if is_video and video_url:
        # Обработка видео из Rutube
        video_id = file_service.extract_rutube_id(video_url)
        if not video_id:
            raise HTTPException(status_code=400, detail="Invalid Rutube URL")
        
        attachment_data = {
            "file_name": f"rutube_video_{video_id}",
            "file_path": video_url,
            "is_video": True,
            "video_provider": "rutube",
            "video_id": video_id,
            "mime_type": "video/rutube"
        }
    else:
        # Загрузка обычного файла
        file_path = await file_service.save_upload_file(file, subdir=f"lessons/{lesson_id}")
        if not file_path:
            raise HTTPException(status_code=500, detail="Failed to save file")
        
        mime_type = file_service.get_file_mime_type(file_path)
        file_size = file_service.get_file_size(file_path)
        
        attachment_data = {
            "file_name": file.filename or str(file_path.name),
            "file_path": str(file_path),
            "file_size": file_size,
            "mime_type": mime_type,
            "is_video": mime_type.startswith('video/') if not is_video else is_video,
            "video_provider": "uploaded" if mime_type.startswith('video/') else None
        }
    
    # Создаем запись вложения
    attachment_create = LessonAttachmentCreate(
        lesson_id=lesson_id,
        **attachment_data
    )
    
    return crud_lesson.create_attachment(db, attachment_create)

@router.post("/{lesson_id}/markdown-preview")
async def preview_markdown(
    lesson_id: int,
    markdown_content: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Предпросмотр Markdown контента"""
    lesson = crud_lesson.get_lesson(db, lesson_id=lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверяем права
    course = crud_course.get_course(db, course_id=lesson.course_id)
    if course.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Конвертируем Markdown в HTML
    html_content = markdown_service.convert_to_html(markdown_content)
    
    return {"html_content": html_content}