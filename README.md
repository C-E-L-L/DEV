# C.E.L.L. Platform

**Hierarchical Human-in-the-Loop (HITL) Labeling Platform for WBC Dataset Construction and Education**

## Architecture

```
[React Frontend]  →  [Spring Boot Backend]  →  [FastAPI AI Server]
   :5173                  :8080                     :8001
                            │                         │
                          MySQL              파일 시스템 / S3
                       (메타데이터)            (이미지 원본)
```

## Directory Structure

```
cell-platform/
├── backend/       # Java 17 + Spring Boot 3.3 + MySQL
├── ai-server/     # Python + FastAPI (YOLO + DenseNet)
├── frontend/      # React + Vite
└── docs/          # DB 설정 가이드, API 명세
```

## Backend 실행

```bash
cd backend
./gradlew bootRun
```

- API: http://localhost:8080
- H2 Console: http://localhost:8080/h2-console (dev 프로필)

## API Endpoints

### Backend (Spring Boot :8080)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/auth/register | 회원가입 | - |
| POST | /api/auth/login | 로그인 (JWT 발급) | - |
| GET | /api/tasks | 과제 목록 조회 | 인증 필요 |
| POST | /api/tasks/upload | 이미지 업로드 + 과제 생성 | EXPERT |
| GET | /api/tasks/{id}/crops | 과제별 문제 조회 | 인증 필요 |
| POST | /api/submit | 학생 답안 제출 | 인증 필요 |
| GET | /api/tasks/{id}/submissions/{studentId} | 풀이 이력 조회 | 인증 필요 |
| GET | /api/tasks/{id}/stats | 통계 (Hard-Case 랭킹) | EXPERT |
| PUT | /api/crops/{id}/confirm | 최종 정답 확정 | EXPERT |
| GET | /api/training-data | 재학습용 확정 데이터 추출 | EXPERT |

### AI Server (FastAPI :8001)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/analyze | 이미지 → YOLO 탐지 + DenseNet 분류 |
| POST | /api/retrain | 확정 데이터로 모델 재학습 |
| GET | /health | 서버 상태 확인 |
