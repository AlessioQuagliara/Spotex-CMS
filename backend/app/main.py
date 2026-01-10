from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import api_router
from app.database.database import Base, engine
from app.utils.cache import get_redis, close_redis, get_cache_stats, cache_response

# Creazione tabelle database (in produzione usa migrazioni)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Application starting up...")
    # Le tabelle devono essere create con async
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Initialize Redis connection
    try:
        await get_redis()
        print("✅ Redis connected successfully")
    except Exception as e:
        print(f"⚠️  Redis connection failed: {e}")
    
    yield
    
    # Shutdown
    await close_redis()
    await engine.dispose()
    print("Shutting down...")

app = FastAPI(
    title="CMS API",
    description="Content Management System API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Admin frontend
        "http://localhost:3001",  # Render frontend
        "http://localhost",       # Nginx local
        "http://localhost:80",    # Nginx explicit
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Includi router API
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "CMS API è avviatooo!!"}

@app.get("/health")
async def health_check():
    cache_stats = await get_cache_stats()
    return {
        "status": "healthy",
        "cache": cache_stats
    }