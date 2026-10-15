# C.E.L.L. Platform

**Hierarchical Human-in-the-Loop (HITL) Labeling Platform for WBC Dataset Construction and Education**

## 가장 간단한 로컬 화면 테스트

백엔드, DB, Docker 없이 프런트엔드 화면만 안전하게 확인할 수 있습니다.

```powershell
cd frontend
npm ci
npm run dev:mock
```

브라우저에서 `http://localhost:5173`을 열고 교수·학생·관리자 중 테스트할 계정을 선택해 로그인합니다.
모든 변경 내용은 실행 중인 로컬 메모리에만 저장되며 실제 서버에는 반영되지 않습니다.

로그인 상태는 같은 브라우저의 탭 사이에 공유됩니다. 한 탭에서 로그인·로그아웃하거나 계정을 변경하면
다른 탭도 해당 계정의 첫 화면 또는 로그인 화면을 자동으로 다시 엽니다. 이전 화면의 작업 내용은 초기화됩니다.
교수·학생 계정을 동시에 테스트하려면 일반 창과 시크릿 창, 또는 서로 다른 브라우저 프로필을 사용하세요.

탭 동기화 확인: 같은 주소를 두 탭에서 열고 로그인한 뒤, 한 탭에서 로그아웃하면 두 탭 모두 로그인 화면으로
전환되는지 확인합니다. 이후 학생 계정으로 로그인하면 두 탭 모두 학생 화면으로 전환되어야 합니다.

학생 관리 화면은 교수 로그인 후 **분석 → 학생 관리 → 학생 선택**에서 확인합니다.
`학습 이력`은 과제·Task·진단평가별 풀이 현황과 채점 결과를 보여주며, 과제를 펼친 뒤
`세포별 응답`을 누르면 오답·미응답·채점 대기 문항도 확인할 수 있습니다.
기존 누적 혼동행렬은 학생별 하위 메뉴와 `전체 누적 혼동행렬` 버튼에서 제공합니다.
목업의 `student` 계정에는 부분 풀이 과제와 완료한 Task·진단평가가 있고,
`20260006`은 응답이 없는 학생입니다.

프런트엔드 회귀 테스트 (`frontend` 폴더에서 실행):

```powershell
node --test src/utils/*.test.js
```

## Architecture

```
[React Frontend]  →  [Spring Boot Backend]  →  [FastAPI AI Server]
   :5173                  :8080                     :8001
                            │                         │
                          MySQL              파일 시스템
                       (메타데이터)          (이미지 원본)
```

## Directory Structure

```
DEV/
├── backend/       # Java 17 + Spring Boot 3.3 + MySQL
├── ai-server/     # Python + FastAPI (YOLO + DenseNet)
├── frontend/      # React + Vite
└── data/          # 원본 이미지, 크롭 이미지, 진단평가 GT
```

---

## Docker로 배포 (권장)

### 사전 준비 (최초 1회)

1. [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치 후 실행
2. weights 파일이 `ai-server/weights/` 에 있는지 확인

### 최초 실행

```powershell
cd C:\CELL2\DEV
docker-compose up --build
```

빌드 완료 후 `http://localhost` 접속 (포트 80).  
같은 와이파이의 다른 컴퓨터는 `http://<이 PC의 IP>` 로 접속 가능.

### 이후 업데이트

```powershell
cd C:\CELL2\DEV
git pull
docker-compose up --build -d
```

### 종료 / 재시작

```powershell
docker-compose down        # 종료 (DB 데이터 보존)
docker-compose down -v     # 종료 + DB 초기화
docker-compose up -d       # 백그라운드 재시작 (빌드 없음)
```

### DB 초기화가 필요할 때

```powershell
docker-compose down -v
docker-compose up --build -d
```

> Linux 서버로 이전 시: docker-compose.yml, Dockerfile 수정 없이 그대로 사용 가능.

---

## 로컬 직접 실행 (개발용)

### 사전 준비 (최초 1회)

### 1. Java 17 확인

Gradle이 `C:\Users\{사용자}\.jdks\ms-17.0.18`을 자동으로 사용합니다.  
없을 경우 IntelliJ에서 자동 다운로드되거나, 아래 환경변수를 설정합니다:

```powershell
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Users\kjh05\.jdks\ms-17.0.18", "User")
```

### 2. MySQL DB 생성

MySQL 비밀번호: `0000`

```powershell
$env:MYSQL_PWD = "0000"; & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS celldb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

> DB가 이미 있고 테이블 스키마가 맞지 않아 오류가 날 경우 테이블 초기화:
> ```powershell
> $env:MYSQL_PWD = "0000"; & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root celldb -e "DROP TABLE IF EXISTS crop_issue_reports, student_confusion_matrices, submissions, crops, tasks, users;"
> ```

### 3. AI 모델 weights 파일 배치

아래 두 파일이 있어야 합니다:
```
ai-server/weights/yolov8_best.pt
ai-server/weights/densenet201_best.pth
```

### 4. Python venv 생성 및 패키지 설치 (최초 1회)

```powershell
cd C:\CELL2\DEV\ai-server
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

> torch + ultralytics 설치로 시간이 걸릴 수 있습니다.

### 5. Frontend 패키지 설치 (최초 1회)

```powershell
cd C:\CELL2\DEV\frontend
npm install
```

---

## 실행 순서 (터미널 3개)

### 터미널 1 — AI 서버

```powershell
cd C:\CELL2\DEV\ai-server
.\venv\Scripts\Activate.ps1
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

정상 확인: `http://localhost:8001/health` → `{"status":"ok","models_loaded":true}`

---

### 터미널 2 — Backend

```powershell
cd C:\CELL2\DEV\backend
.\gradlew.bat bootRun
```

정상 확인: 로그에 `Admin account seeded: admin` 출력 후 80% EXECUTING 유지

---

### 터미널 3 — Frontend

```powershell
cd C:\CELL2\DEV\frontend
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## 기본 계정

| 역할 | ID | 비밀번호 | 비고 |
|------|----|---------|------|
| 관리자 | `admin` | `admin1234!` | 앱 시작 시 자동 생성 |
| 전문가 | - | - | `/api/auth/register` 로 직접 가입 |
| 학생 | - | - | `/api/auth/register` 로 직접 가입 |

---

## API Endpoints

### Backend (Spring Boot :8080)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/auth/register | 회원가입 | - |
| POST | /api/auth/login | 로그인 (JWT 발급) | - |
| GET | /api/tasks | 과제 목록 조회 | 인증 필요 |
| POST | /api/tasks/upload | 이미지 업로드 + 과제 생성 | EXPERT |
| POST | /api/tasks/diagnostic/create | 진단평가 과제 생성 | EXPERT |
| GET | /api/tasks/{id}/crops | 과제별 세포 조회 | 인증 필요 |
| POST | /api/submissions | 학생 답안 제출 | 인증 필요 |
| GET | /api/tasks/{id}/my-results/{studentId} | 개인 채점 결과 | 인증 필요 |
| GET | /api/tasks/{id}/diagnostic/student-matrices | 전체 학생 혼동행렬 | EXPERT |
| GET | /api/tasks/{id}/stats | 통계 | EXPERT |
| PUT | /api/crops/{id}/confirm | 최종 정답 확정 | EXPERT |
| GET | /api/training-data | 재학습용 확정 데이터 추출 | EXPERT |

### AI Server (FastAPI :8001)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/analyze | 이미지 → YOLO 탐지 + DenseNet 분류 |
| POST | /api/retrain | 확정 데이터로 모델 재학습 (TODO) |
| GET | /health | 서버 상태 확인 |
