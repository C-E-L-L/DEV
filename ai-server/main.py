from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analyze_router, retrain_router
from app.services.model_loader import ModelLoader

app = FastAPI(title="C.E.L.L. AI Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Spring Boot 백엔드 주소
    allow_methods=["*"],
    allow_headers=["*"],
)

# 서버 시작 시 AI 모델 로드
@app.on_event("startup")
def startup():
    ModelLoader.load_all()

# 라우터 등록
app.include_router(analyze_router.router, prefix="/api")
app.include_router(retrain_router.router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok", "models_loaded": ModelLoader.is_ready()}
