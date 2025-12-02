from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.router import api_router
from app.config import settings
from app.database import Base, engine
import os
import logging

logger = logging.getLogger(__name__)

# Создаем таблицы в базе данных
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем статические файлы
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Подключаем роутеры
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "Welcome to LMS Platform API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Тестовый эндпоинт для проверки пароля
@app.post("/test-password")
async def test_password(password: str):
    from app.core.security import get_password_hash
    import sys
    
    result = {
        "password": password,
        "password_length": len(password),
        "password_bytes": len(password.encode('utf-8')),
        "sys_version": sys.version
    }
    
    try:
        hashed = get_password_hash(password)
        result["hashed_success"] = True
        result["hash_length"] = len(hashed)
    except Exception as e:
        result["hashed_success"] = False
        result["error"] = str(e)
        result["error_type"] = type(e).__name__
    
    return result