# 로컬 서버로 배포 전 확인하기

`local-server` 브랜치는 `juhun`의 `6db5a6f`에서 분리했습니다. 작업 폴더는 `DEV/local-server`입니다. 이 폴더의 프론트엔드 코드를 수정하면 실제 Spring 백엔드, 로컬 DB, AI 서버로 기능을 확인할 수 있습니다.

## 지금 접속하기

- 서비스: http://127.0.0.1:15173
- 로그인: http://127.0.0.1:15173/login
- 컬러화: http://127.0.0.1:15173/colorizer/
- 관리자: `local-admin`
- 검증용 교수: `local-professor`, 학생: `local-student` (`--seed`로 생성)
- 세 계정의 최초 비밀번호: `.local/settings.json`의 `adminPassword`. 이 파일은 Git에서 제외됩니다.

운영 계정과 데이터는 복사하지 않았습니다. 검증용 과제 `local-smoke.jpg`는 저장소의 실제 세포 이미지를 업로드하고 실제 AI로 분석해서 만든 준비 상태 과제입니다. 교수/관리자에서 내용을 검토하고 게시하면 학생 흐름을 확인할 수 있습니다. 목업 전용 계정 선택이나 가짜 API 응답은 사용하지 않습니다.

## 실행과 종료

`DEV/local-server`에서 PowerShell로 실행합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local.ps1 Start -WithColorizer
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local.ps1 Status
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local.ps1 Stop
```

Start는 백엔드를 빌드하고 서버를 숨겨진 프로세스로 실행합니다. 최초 기동은 시간이 걸릴 수 있습니다. `.local/backend.log`에 `Started CellApplication`, `.local/ai.err.log`에 `Application startup complete`가 나오면 준비된 상태입니다. 오류는 `.local/*.err.log`에서 확인합니다. Status는 프로세스 생존 여부이며 API 기능 검사는 아래 명령으로 합니다.

```powershell
.\.venv\Scripts\python.exe scripts/check-local.py
# 최초 테스트 계정과 실제 이미지 과제 생성이 필요할 때만:
.\.venv\Scripts\python.exe scripts/check-local.py --seed
```

체크 스크립트는 로그인, 브라우저 Origin/CORS, AI 모델 상태, 컬러화 연결, 학생의 관리자 API 접근 차단, 저장된 과제의 이미지 조회를 확인합니다. `--seed`는 로컬 DB에 계정 2개와 샘플 과제 1개를 생성하며, 같은 항목이 있으면 다시 만들지 않습니다.

프론트 수정은 자동 반영됩니다. Java 변경은 Stop 후 Start로 다시 빌드합니다. AI/Python 변경도 재시작합니다. `-SkipAI`로 AI를 생략할 수 있지만 이미지 분석 기능은 사용할 수 없습니다. `-WithColorizer` 없이 실행하면 컬러화 서버가 시작되지 않습니다.

## 데이터와 운영 환경의 차이

| 항목 | 현재 로컬 구성 |
| --- | --- |
| 프론트/API/권한/AI | 실제 서비스 코드 |
| DB | 파일 기반 H2, `.local/db`에 유지 |
| 업로드·crop·thumbnail | 이 작업 폴더의 `data`에 유지 |
| 컬러화 DB·파일 | `.local/colorizer`에 유지 |
| 운영 계정·과제·답안 | 가져오지 않음 |
| 접속 범위 | 이 PC의 127.0.0.1 전용 |
| 포트 | 화면 15173 / 백엔드 18080 / AI 18001 / 컬러화 18501 |

H2는 저장 가능한 실제 로컬 DB지만 운영의 MySQL과 SQL/마이그레이션 동작이 완전히 같지는 않습니다. 화면·API·기능 검토에 사용하고, DB 변경을 배포하기 전에는 MySQL 모드에서도 확인하세요. HTTP 로컬 접속에서는 운영 HTTPS·인증서·Nginx 동작까지 검증하지 않습니다. 컬러화의 기존 'CELL로 돌아가기' 링크는 운영 도메인을 가리키므로 로컬로 돌아갈 때 위 로컬 주소를 사용하세요.

Stop은 DB와 업로드 파일을 지우지 않습니다. `.local/settings.json`을 지우면 DB 암호/서명키가 달라지므로 기존 DB가 있는 동안 보존하세요. 설정 파일에서 관리자 비밀번호 값을 바꾸는 것만으로 기존 계정 비밀번호가 변경되지는 않습니다.

## 운영과 같은 MySQL 엔진으로 확인

Docker Desktop을 준비한 뒤:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local.ps1 Stop
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local.ps1 Start -Database MySQL -WithColorizer
```

`compose.local.yml`은 별도 `cell-local` 프로젝트, `cell_local` DB, `127.0.0.1:13306`, 별도 Docker 볼륨을 사용합니다. 기존 운영용 `docker-compose.yml`과 로컬 MySQL80 서비스는 변경하지 않습니다. H2와 MySQL은 서로 다른 데이터 저장소이므로 자동으로 데이터가 옮겨지지 않습니다. 로컬 프로필의 스키마 설정은 `update`이고 운영은 `validate`이므로 운영 마이그레이션 검증을 대신하지 않습니다. 이 PC에는 Docker가 없어 MySQL 모드는 실행 검증하지 못했습니다.

Stop은 애플리케이션만 중지합니다. 로컬 MySQL 컨테이너도 중지하려면:

```powershell
. ./scripts/local-settings.ps1
docker compose -f compose.local.yml stop
```

운영과 동일한 데이터를 보려면 **MySQL 백업과 일치하는 업로드 원본/crop/thumbnail 사본**이 필요합니다. 운영 DB에 직접 연결하지 말고 별도 로컬 MySQL에 복원하고 이 폴더의 `data`에 파일을 복사하세요. 컬러화는 별도 SQLite/파일 사본이 필요합니다. 백업은 이번 작업에서 복원하지 않았습니다.

## 다른 PC에서 준비

Java 17, Node/npm, Python이 필요합니다. 모델 파일 2개와 `data/diagnostic_gt`도 준비합니다.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r ai-server/requirements.txt
.\.venv\Scripts\python.exe -m pip install "Flask>=3.1,<4" "pydicom>=3.0,<4" "matplotlib>=3.9,<4"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local.ps1 Start -WithColorizer
```

최초 실행은 `.venv/Scripts/python.exe`를 자동 선택합니다. 다른 환경을 쓰려면 `.local/settings.json`의 `python`을 바꿉니다. 이 PC의 `.venv`는 기존 전역 PyTorch/GPU 패키지를 재사용하도록 만들었으며 다른 PC로 복사할 수 있는 환경은 아닙니다.

## 앞으로의 작업 흐름

1. 이 폴더에서 프론트/기능을 수정하고 로컬 서버에서 확인합니다.
2. 변경 파일을 검토하고 `local-server`에 커밋합니다.
3. 배포할 변경을 `main`에 병합합니다. 운영 서버는 `main`을 받아 배포합니다(README의 코드 수정 반영 절차).

다른 브랜치에서 완료한 변경을 시험하려면 작업 내용을 커밋한 뒤 `local-server`에서 해당 브랜치를 merge하거나 필요한 커밋을 cherry-pick합니다. 이 폴더는 별도 worktree이므로 `juhun` 폴더를 수정했다고 자동 반영되지는 않습니다. 원격 push와 운영 배포는 이번 작업에 포함하지 않았습니다.
