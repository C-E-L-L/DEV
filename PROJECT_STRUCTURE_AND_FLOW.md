# C.E.L.L. 프로젝트 구조 및 코드 작동 방식 정리

이 문서는 현재 `C:\CELL2\CELL` 기준 프로젝트 구조, 서비스 간 데이터 흐름, 주요 코드 레이어, 기능 추가 시 지켜야 할 규칙을 빠르게 다시 파악하기 위한 목적의 내부 정리 문서다.

---

## 1. 전체 아키텍처

```
Frontend (React + Vite :5173)
        ↓  /api, /data 프록시
Backend (Spring Boot :8080, JWT, MySQL)
        ↓  /api/analyze 호출
AI Server (FastAPI :8001 또는 .env 기준 포트)
```

- 프론트는 브라우저에서 `/api/*`, `/data/*`를 호출하고 Vite가 백엔드로 프록시한다.
- 백엔드는 인증/권한, 과제/크롭/제출/통계를 담당하고, 이미지 분석은 AI 서버에 위임한다.
- AI 서버는 YOLO 탐지 + DenseNet 분류를 수행해 결과를 백엔드에 반환한다.

---

## 2. 디렉토리 구조

```text
C:\CELL2\CELL
├─ frontend\      # React + Vite UI
├─ backend\       # Spring Boot API, DB, 보안, 파일 서빙
├─ ai-server\     # FastAPI 추론 서버
├─ data\          # originals/crops (실행 환경에 따라 사용)
├─ README.md
└─ .env
```

---

## 3. Frontend 구조 및 동작

### 핵심 파일
- `frontend/src/App.jsx`
  - 라우팅: `/`(로그인), `/student`, `/expert`
- `frontend/src/context/AuthContext.jsx`
  - 로그인/로그아웃 상태 관리
  - JWT 토큰을 `localStorage`에 저장
- `frontend/src/api/client.js`
  - axios 공통 인스턴스
  - 요청 시 `Authorization: Bearer <token>` 자동 주입
  - 401 응답 시 로컬 스토리지 초기화 후 `/` 이동
- `frontend/src/pages/StudentPage.jsx`
  - 학생 과제 목록, 크롭 풀이 제출, 결과 조회
- `frontend/src/pages/ExpertPage.jsx`
  - 전문가 이미지 업로드(과제 생성), 통계 확인, 라벨 확정
- `frontend/src/constants.js`
  - 셀 타입 목록, 이미지 URL(`/data/originals`, `/data/crops`) 정의

### API 호출 레이어
- `frontend/src/api/auth.js`
- `frontend/src/api/tasks.js`
- `frontend/src/api/crops.js`
- `frontend/src/api/submissions.js`
- `frontend/src/api/stats.js`

> 프론트에서 새 기능 추가 시:  
> **(1) `src/api`에 엔드포인트 추가 → (2) 페이지/훅에서 사용** 패턴 유지.

---

## 4. Backend 구조 및 동작

### 패키지 레이어
- `controller`
  - HTTP 엔드포인트 진입점
- `service`
  - 비즈니스 로직
- `domain`
  - 도메인 모델 + Repository 인터페이스
- `infra`
  - JPA 기반 Repository 구현 (`*CoreRepository`)
- `entity`
  - JPA 엔티티
- `dto/request`, `dto/response`
  - API 요청/응답 모델
- `config`
  - Security/JWT/CORS/정적 파일 매핑
- `exception`
  - 커스텀 예외 + 공통 핸들러

### 대표 흐름: 과제 업로드
1. `TaskController.uploadAndCreateTask`
2. `TaskService.createTask`
   - 원본 파일 저장 (`FileStorageService`)
   - AI 분석 요청 (`AiClientService`)
   - AI 응답(`AiAnalysisResponse`)을 `Crop` 목록으로 변환
   - `TaskRepository.save`로 Task + Crop 저장
3. 결과를 `TaskUploadResponse`로 반환

### 보안/인증
- `SecurityConfig`
  - `/api/auth/**`, `/data/**` 등은 허용
  - 나머지는 JWT 인증 필요, 일부는 `EXPERT` 권한 필요
- `JwtAuthFilter`, `JwtTokenProvider`
  - 토큰 파싱/검증 후 SecurityContext 설정

### 예외 처리
- `GlobalExceptionHandler`에서 예외를 일괄 JSON 응답으로 변환
- `ErrorCode` enum으로 에러 코드를 통일 관리

---

## 5. AI Server 구조 및 동작

### 핵심 파일
- `ai-server/main.py`
  - FastAPI 앱 생성
  - startup 시 `ModelLoader.load_all()` 호출
  - `/api/analyze`, `/api/retrain`, `/health` 라우팅
- `ai-server/app/routers/analyze_router.py`
  - 업로드 파일 저장 후 파이프라인 실행
- `ai-server/app/services/pipeline.py`
  - 탐지(`DetectorService`) → 분류(`ClassifierService`) 오케스트레이션
- `ai-server/app/services/model_loader.py`
  - YOLO/DenseNet 로딩 및 준비상태 관리
- `ai-server/app/config.py`
  - 가중치/데이터 경로, 클래스명, 전처리 상수 정의

### 현재 상태 메모
- `/api/retrain`은 골격만 있고 실제 학습 로직은 TODO 상태.

---

## 6. DB 및 스키마 생성 동작

- 활성 프로필: `dev` (`backend/src/main/resources/application.yml`)
- `application-dev.yml` 기준:
  - MySQL datasource
  - `spring.jpa.hibernate.ddl-auto: create`

앱 시작 시 Hibernate가 기존 테이블을 정리 후 다시 생성한다.  
초기 빈 DB에서 `drop ... doesn't exist` 경고가 찍힐 수 있으나, 이어서 `create table ...` 및 `Started CellApplication`이 뜨면 정상 기동이다.

---

## 7. 실행 순서(로컬 개발)

## 7.1 AI 서버
```powershell
cd C:\CELL2\CELL\ai-server
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## 7.2 백엔드
```powershell
cd C:\CELL2\CELL\backend
.\gradlew.bat bootRun
```

## 7.3 프론트
```powershell
cd C:\CELL2\CELL\frontend
npm install
npm run dev
```

---

## 8. 기능 추가 시 구조 보존 규칙

1. **백엔드 레이어 분리 유지**
   - Controller는 입출력만
   - Service에 비즈니스 로직
   - Repository 인터페이스는 `domain`, 구현은 `infra`
2. **DTO와 도메인 분리 유지**
   - API 계약은 `dto`에서 명확히 관리
3. **예외 처리 통일**
   - 임의 응답 대신 `ErrorCode + CustomException + GlobalExceptionHandler` 패턴 사용
4. **프론트 API 모듈화 유지**
   - 페이지에서 직접 axios 호출하지 말고 `src/api/*` 확장 후 사용
5. **AI 확장은 services 중심**
   - router는 얇게 유지하고 실제 처리 로직은 `app/services`에 추가

---

## 9. 현재 확인된 주의 포인트

1. **AI 포트 설정 통일 필요**
   - 문서: 8001
   - `.env`의 `AI_SERVER_URL`: 8081
   - 실제 실행 포트와 `.env`를 반드시 일치시켜야 함.
2. **환경 파일 중복**
   - 루트 `.env`와 `backend\.env`가 함께 존재.
   - 실제 IntelliJ 실행 시 어떤 `.env`를 읽는지 통일 필요.
3. **파일 저장 경로**
   - 백엔드 `FILE_UPLOAD_DIR`, `FILE_CROP_DIR`와 AI `config.py`의 data 경로 기준이 다를 수 있어 환경별 확인 필요.

---

## 10. 주요 엔드포인트 요약

### Backend (`:8080`)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/tasks`
- `POST /api/tasks/upload`
- `GET /api/tasks/{taskId}/crops`
- `POST /api/submit`
- `GET /api/tasks/{taskId}/submissions/{studentId}`
- `GET /api/tasks/{taskId}/my-results/{studentId}`
- `GET /api/tasks/{taskId}/stats`
- `GET /api/all-stats`
- `PUT /api/crops/{cropId}/confirm`
- `GET /api/training-data`

### AI Server
- `POST /api/analyze`
- `POST /api/retrain` (현재 TODO 포함)
- `GET /health`

