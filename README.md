# C.E.L.L. Platform

**Hierarchical Human-in-the-Loop (HITL) Labeling Platform for WBC Dataset Construction and Education**

세포 이미지의 AI 탐지·분류, 학생 풀이, 교수/관리자의 정답 확정·분석을 제공하는 웹 시스템입니다. 별도 서비스로 DICOM 컬러화 기능을 함께 운영합니다.

이 문서는 **아무것도 설치되지 않은 새 컴퓨터로 기존 서비스를 이전하는 순서**를 설명합니다. 설정 확인 기준일은 **2026-11-03**입니다. 아래 설치·중지·백업·복원 명령은 작업자가 실행할 예시이며, 문서 작성 과정에서 운영 서버를 중지하거나 데이터를 복원한 것은 아닙니다.

- 기존 서비스를 이전하려면 **1~9절을 순서대로** 진행하세요.
- 화면만 확인하려면 아래의 **프런트엔드 목업 테스트**를 사용하세요.
- 기존 서버 백업, 저장 공간, 복구 계획 등의 보충 설명은 [새 서버 이전 가이드](CELL_새서버_이전가이드.md)를 참고하세요.

## 0. GitHub에 백업되는 것과 별도 백업해야 할 것

**GitHub 저장소는 전체 운영 서버 백업이 아닙니다.** DB와 실제 업로드 파일은 GitHub 코드만 받아서는 복구되지 않습니다.

| 대상 | 현재 Git 추적 여부 | 새 서버 준비 방법 |
| --- | --- | --- |
| 프런트·백엔드·AI·컬러화 소스, Compose/Dockerfile, 추적 중인 문서 | 추적 중 | 아래처럼 배포 소스가 있는 브랜치를 clone |
| AI 모델 2개 | 현재 추적 중 | clone 후 실파일 확인. 이전 시점 운영 모델과도 비교 |
| `data/diagnostic_gt` 진단용 데이터셋 | 현재 추적 중 | clone 후 내용 확인. 운영 서버에서 변경했다면 최종본 별도 복사 |
| CELL MySQL: 계정·과제·답안·채점 등 | Git 대상 아님 | `dev_mysql-data`의 `celldb`를 최신 SQL 덤프로 백업·복원 |
| 실제 업로드 원본·crop·썸네일 | 추적되지 않음 | `data/originals`, `data/crops`, `data/thumbnails`를 포함한 **운영 `data` 전체** 복사 |
| 컬러화 계정·작업·DICOM·색상·ROI 등 | Git 대상 아님 | **`dev_colorizer-data` Docker 볼륨 전체** 백업·복원 |
| 실제 `.env` | 추적되지 않음 | 비밀번호·서명키를 유지해 안전하게 별도 전달 |
| `ssl`, `letsencrypt` | 추적되지 않음 | 인증서·개인키·ACME 갱신 관련 자료를 안전하게 별도 전달 |
| 실행 중인 Docker 이미지 | Git 대상 아님 | 기존 이미지를 저장·로드하거나, 새 서버에서 별도 빌드 |
| 미추적 조사 자료·개인 작업 파일 | Git에 자동 반영되지 않음 | `git status --short`로 확인하고 필요 자료 별도 보관 |

`.gitignore`에 경로가 있어도 **이미 추적하던 파일은 계속 추적됩니다.** 현재 모델과 진단용 데이터가 이에 해당합니다. 반대로 ignore된 신규 운영 데이터가 자동으로 백업된다고 생각하면 안 됩니다.

현재 작업 소스는 **`juhun` 브랜치** 기준입니다. GitHub 기본 브랜치 `main`을 받는 것과 다를 수 있으므로 아래 clone 명령에 브랜치를 명시했습니다.

## 1. 새 컴퓨터의 OS·Docker 준비

### 1-1. 운영체제에 따른 차이

| 환경 | 설치 방향 |
| --- | --- |
| 지원되는 Windows 11 PC | BIOS/UEFI 가상화 활성화 → WSL 2 → Docker Desktop의 **Linux containers** |
| Windows Server | Docker Desktop은 Windows Server를 지원하지 않습니다. Linux VM 또는 Linux 서버 등 실행 환경을 먼저 정하세요. |
| Ubuntu 서버 | Docker Engine + Buildx/Compose 플러그인 설치. 아래의 Windows 경로·PowerShell 명령·예약 작업은 Linux용으로 조정해야 합니다. |
| OS가 없는 PC | OS·네트워크·드라이버를 먼저 설치한 뒤 진행하세요. |

설치 파일과 지원 조건은 [Docker Windows 설치 안내](https://docs.docker.com/desktop/setup/install/windows-install/), [Docker Ubuntu 설치 안내](https://docs.docker.com/engine/install/ubuntu/)에서 확인하세요.

현재 실행 이미지는 `linux/amd64`입니다. Intel/AMD x86-64 PC 기준이며 ARM 서버에서는 아키텍처 호환성을 별도 확인해야 합니다. BIOS/UEFI의 Intel VT-x/AMD-V 등 가상화 기능도 켜져 있어야 합니다.

Windows 기준 설치 목록:

1. 지원되는 Windows 및 네트워크/장치 드라이버
2. WSL 2
3. Docker Desktop — WSL 2 백엔드, **Linux 컨테이너** 사용
4. Git for Windows — clone 및 이후 업데이트용
5. 브라우저, 필요하면 VS Code

**Docker로 운영할 때 호스트에 Java, Python, Node.js, Gradle, MySQL, Nginx를 각각 설치할 필요는 없습니다.** 컨테이너 안에 해당 실행 환경이 구성됩니다. 목업 또는 컨테이너 밖의 직접 개발은 별개입니다.

저장 공간·메모리의 측정된 서비스 최소 사양을 정한 것은 아닙니다. 운영 여유를 고려해 SSD 여유 100GB 이상, RAM 16GB 이상/가능하면 32GB를 권장하며, 실제 부하에 따라 조정하세요. 이미지까지 옮길 전송 매체는 큰 단일 파일을 지원하는 NTFS/exFAT 등을 사용하고 충분한 공간을 확보하세요.

### 1-2. Windows 최초 설치 확인

관리자 PowerShell에서 WSL을 처음 설치한다면:

```powershell
wsl --install
```

안내에 따라 재부팅하고 최초 Linux 배포판 사용자 설정을 마칩니다. 이후:

```powershell
wsl --update
wsl --status
wsl --list --verbose
```

[Microsoft WSL 설치 안내](https://learn.microsoft.com/en-us/windows/wsl/install)를 참고하세요. Docker Desktop을 설치·실행한 뒤 일반 PowerShell에서 확인합니다.

```powershell
docker version
docker compose version
docker info --format '{{.OSType}}/{{.Architecture}}'
git --version
```

`docker version`에 **Server** 정보까지 나와야 합니다. 명령을 못 찾거나 엔진 연결 오류가 나면 프로젝트 실행 전에 Docker부터 해결하세요.

## 2. 기존 서버에서 최신 백업 준비

**기존 서버에서 하는 단계입니다.** 새 컴퓨터 설치를 먼저 마치고 백업·전환 시간을 정하세요. DB/업로드를 모두 보존하려면 마지막 백업 동안 사용자 쓰기를 중지해야 합니다. 아래 중지 명령은 점검 시간에만 실행하세요.

### 2-1. 백업 위치와 실행 버전 기록

프로젝트 밖의 새로운 백업 폴더를 사용합니다. 다음 경로가 이미 있다면 덮어쓰지 말고 다른 경로로 바꾸세요. 실제 비밀번호, 토큰, DB 내용은 GitHub·공개 문서·채팅에 올리지 마세요.

```powershell
Set-Location -LiteralPath 'C:\DEV'
New-Item -ItemType Directory -Path 'C:\CELL-MigrationBackup' -ErrorAction Stop
git status --short --branch
git rev-parse HEAD
docker compose -p dev ps
docker compose -p dev images
docker volume ls
```

브랜치/커밋과 **실행 중인 이미지**를 기록하세요. 소스 커밋과 실행 이미지가 항상 같은 빌드라고 가정하지 않습니다. 현재 구성의 볼륨 이름은 `dev_mysql-data`, `dev_colorizer-data`이며, 다른 프로젝트 이름을 사용했다면 실제 이름에 맞춰야 합니다.

### 2-2. 실행 이미지 저장 — 권장, 중지 전 준비 가능

현재 서비스 이미지를 그대로 옮기면 이전과 의존성 업그레이드를 분리할 수 있습니다. 다음 태그들이 기존 서버에 있고 실제 실행 버전과 일치하는지 먼저 확인하세요.

```powershell
docker image save --output C:\CELL-MigrationBackup\cell-images.tar dev-frontend:latest dev-backend:latest dev-ai-server:latest dev-colorizer:latest mysql:8.0 alpine:latest certbot/certbot:latest
if ($LASTEXITCODE -ne 0) { throw '이미지 저장 실패. 이미지 목록부터 확인하세요.' }
```

앞의 5개는 서비스 이미지이고 Alpine/Certbot은 백업·인증서 작업용입니다. 보조 이미지가 없으면 해당 항목을 제외하고 새 서버에서 준비할 수 있습니다. **이미지 저장에는 DB 볼륨, 호스트 파일, 비밀설정이 포함되지 않으므로 다음 백업도 반드시 필요합니다.** 이미지 저장 방식: [Docker image save](https://docs.docker.com/reference/cli/docker/image/save/).

### 2-3. 최종 백업 구간: 쓰기 중지

업로드·AI 처리·컬러화 내보내기 등 진행 중인 작업을 완료하세요. 별도로 띄운 개발 서버처럼 동일 데이터에 쓰는 다른 프로세스도 없어야 합니다.

```powershell
docker compose -p dev stop frontend backend ai-server colorizer
if ($LASTEXITCODE -ne 0) { throw '서비스 중지 상태부터 확인하세요.' }
docker compose -p dev ps --all
```

**MySQL은 덤프를 위해 켜 둡니다.** 다른 서비스들이 실제로 중지된 상태인지 확인하세요. 단순 중지는 영구 데이터를 삭제하지 않습니다.

### 2-4. CELL MySQL 구조+데이터 백업

컨테이너 안의 기존 환경변수로 인증합니다. 실제 암호를 명령에 적지 마세요. PowerShell의 `>`로 SQL 바이트를 내보내지 않고, 컨테이너 내부 파일로 생성한 뒤 복사합니다.

```powershell
docker compose -p dev exec -T mysql sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysqldump --user=root --single-transaction --quick --routines --events --triggers --hex-blob --no-tablespaces --set-gtid-purged=OFF --default-character-set=utf8mb4 --databases celldb --result-file=/tmp/celldb-migration.sql'
if ($LASTEXITCODE -ne 0) { throw 'DB 백업 실패. 다음 단계로 진행하지 마세요.' }

docker compose -p dev cp mysql:/tmp/celldb-migration.sql C:\CELL-MigrationBackup\celldb.sql
if ($LASTEXITCODE -ne 0) { throw 'DB 백업 파일 복사 실패.' }
Get-Item -LiteralPath 'C:\CELL-MigrationBackup\celldb.sql' | Select-Object Name,Length
```

이는 `celldb` 전체 구조·데이터를 옮기는 덤프이며 MySQL 시스템 사용자/권한 전체를 백업하는 명령은 아닙니다. 현재 Compose는 root로 연결하지만, 수동 추가한 별도 DB 계정이나 서버 설정이 있다면 추가로 확인하세요. 예전 `backup.sql` 파일을 이번 최신 덤프라고 간주하지 마세요.

옵션 및 Windows 출력 인코딩 주의: [MySQL mysqldump 공식 문서](https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html).

### 2-5. 컬러화 SQLite+파일 볼륨 전체 백업

컬러화 데이터는 CELL MySQL과 별개입니다. `/data/colorizer.db`, 업로드, 색상·ROI 등의 정보가 **`dev_colorizer-data` 볼륨**에 있습니다. 호스트의 `C:\DEV\data`와 혼동하지 마세요.

컬러화는 SQLite WAL 모드를 사용하므로 실행 중인 DB 한 파일만 복사하지 말고, **컬러화 중지 상태에서 볼륨 전체**를 백업하세요. 다음 명령은 소스 볼륨을 읽기 전용으로 연결합니다.

```powershell
docker run --rm --mount type=volume,source=dev_colorizer-data,target=/source,readonly --mount type=bind,source=C:\CELL-MigrationBackup,target=/backup alpine:latest tar -czf /backup/colorizer-data.tar.gz -C /source .
if ($LASTEXITCODE -ne 0) { throw '컬러화 볼륨 백업 실패.' }
```

Alpine 이미지가 없다면 미리 준비해야 합니다. tar 파일은 Windows에서 풀었다가 재압축하지 말고 그대로 옮겨 Linux 소유권·권한을 보존하세요. 컬러화 컨테이너 실행 UID/GID는 **10001:10001**입니다. 숨김 파일과 존재하는 WAL 부속 파일 등도 함께 보존합니다. [Docker 볼륨 백업 안내](https://docs.docker.com/engine/storage/volumes/)

### 2-6. 운영 파일 최종 복사

서비스를 중지한 같은 구간의 최종본을 안전한 매체/공유 경로에 보관하세요.

- **`C:\DEV\data` 전체**: originals, crops, thumbnails, diagnostic_gt 및 그 밖의 실제 운영 파일
- **`C:\DEV\.env`**
- **`C:\DEV\ssl`**: `cert.pem`, `key.pem`
- **`C:\DEV\letsencrypt` 전체**: accounts, archive, live, renewal 등 링크 구조와 대상까지 보존
- **`ai-server\weights`**: 이전 시점에 쓰던 모델 2개
- 미커밋 소스/문서 등 GitHub에 없는 필요한 자료
- **`C:\CELL-MigrationBackup`**: 새 SQL, 컬러화 tar, 저장한 이미지

단순하게 `C:\DEV` 최종본과 백업 폴더를 함께 복사해도 됩니다. node_modules, 빌드 캐시, Python 가상환경은 다시 만들 수 있지만 데이터·모델·비밀설정·인증서는 생략하면 안 됩니다.

최종 백업 후 기존 서버를 다시 열어 새 답안/업로드를 받았다면 전환 직전에 쓰기 중지와 최종 백업을 다시 해야 합니다. DB 덤프의 트랜잭션 옵션만으로 별도 이미지 파일까지 같은 시점이 되는 것은 아닙니다.

## 3. 새 컴퓨터에서 코드 받기

**여기부터 새 컴퓨터에서 진행합니다.** 이하 Windows 명령은 `C:\DEV` 기준입니다. 해당 폴더가 없는 새 환경이라면:

```powershell
git clone --branch juhun --single-branch https://github.com/C-E-L-L/DEV.git C:\DEV
if ($LASTEXITCODE -ne 0) { throw '코드 다운로드 실패.' }
Set-Location -LiteralPath 'C:\DEV'
git status --short --branch
```

이미 기존 `C:\DEV` 전체를 복사했다면 다시 clone하지 마세요. 기존 폴더를 삭제/초기화하는 대신 현재 브랜치와 커밋을 확인하세요. 저장소 접근 권한이 필요한 경우 새 PC에서 별도로 GitHub 인증을 설정합니다.

## 4. 비밀설정·운영 파일·인증서 배치

기존 서버에서 받은 최종본을 다음 위치에 놓으세요.

```text
C:\DEV\
  .env
  docker-compose.yml
  ssl\
    cert.pem
    key.pem
  letsencrypt\
  ai-server\weights\
    yolov8_best.pt
    densenet201_best.pth
  data\
    originals\
    crops\
    thumbnails\
    diagnostic_gt\       # raw/processed 등 전체 구조 보존

C:\CELL-MigrationBackup\
  celldb.sql
  colorizer-data.tar.gz
  cell-images.tar        # 실행 이미지를 저장한 경우
```

`letsencrypt/live`의 링크만 고립시키지 마세요. 현재 Nginx가 직접 읽는 `ssl`의 인증서·키 실파일도 반드시 있어야 합니다.

### 4-1. 환경변수

**기존 서비스 이전 시에는 전달받은 실제 `.env`를 사용하세요.** `.env.example`로 덮어쓰지 마세요.

| 변수 | 용도 |
| --- | --- |
| `MYSQL_ROOT_PASSWORD` | MySQL 초기화 및 백엔드 DB 접속 암호 |
| `JWT_SECRET` | CELL 로그인 토큰 서명키 |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | 해당 관리자가 없을 때 초기 관리자 생성에 사용하는 설정 |
| `COLORIZER_SECRET_KEY` | 컬러화 세션 서명키 |
| `COLORIZER_USER_STORAGE_LIMIT_GB` | 사용자별 저장 용량 제한. Compose 기본값 10 |
| `COLORIZER_MEMORY_LIMIT` | 컬러화 메모리 제한. Compose 기본값 2g |
| `COLORIZER_CPU_LIMIT` | 컬러화 CPU 제한. Compose 기본값 1.5 |

DB 암호/서명키 변경은 이전 완료 후 별도 계획으로 진행하세요. JWT/컬러화 서명키가 바뀌면 기존 로그인 상태가 무효화될 수 있습니다. 기존 계정·비밀번호의 복원 기준은 DB이며, 관리자가 이미 존재하면 초기 생성 설정으로 암호를 덮어쓰지 않습니다. 이 저장소가 제공하는 공통 운영 비밀번호는 없습니다.

`.env.example`은 완전히 별도의 새 환경을 구성할 때 변수 목록을 확인하는 템플릿입니다. 예시 문자열 그대로 운영하지 말고 충분히 긴 무작위 비밀값을 설정해야 합니다. **운영 이전은 템플릿 생성이 아니라 기존 설정 보존이 우선**입니다.

### 4-2. 파일·설정 확인

```powershell
Set-Location -LiteralPath 'C:\DEV'
Test-Path -LiteralPath '.env'
Test-Path -LiteralPath 'ssl\cert.pem'
Test-Path -LiteralPath 'ssl\key.pem'
Test-Path -LiteralPath 'ai-server\weights\yolov8_best.pt'
Test-Path -LiteralPath 'ai-server\weights\densenet201_best.pth'
docker compose -p dev config --quiet
```

경로 확인은 모두 `True`여야 합니다. 모델은 빈 파일/포인터가 아닌 실제 가중치 파일이어야 하며, 중요 파일과 백업은 원본/복사본의 `Get-FileHash -Algorithm SHA256`도 비교하는 것이 좋습니다. 문법 검사 성공은 서비스 기동 성공을 뜻하지 않습니다.

비밀값이 펼쳐지는 전체 `docker compose config` 출력이나 `.env` 내용은 공개하지 마세요.

## 5. 새 서버의 이미지 준비 — 두 방법 중 하나

현재 구성은 MySQL 스키마 자동 생성이 아닌 **`SPRING_JPA_HIBERNATE_DDL_AUTO=validate`**입니다. **아직 전체 `up`를 실행하지 마세요. DB 구조·데이터 복원 뒤에 백엔드를 시작해야 합니다.**

먼저 기존 데이터가 없는 새로운 대상 Docker 환경인지 확인하세요. 이미 서비스를 시작해 데이터를 만들었다면 아래 덮어쓰기 복원을 바로 적용하지 마세요.

```powershell
foreach ($migrationVolumeName in @('dev_mysql-data', 'dev_colorizer-data')) {
    docker volume inspect $migrationVolumeName *> $null
    if ($LASTEXITCODE -eq 0) {
        throw "이미 볼륨이 있습니다: $migrationVolumeName. 기존 데이터 여부를 확인하고 진행하세요."
    }
}
```

이후 Compose 명령은 모두 **`-p dev`**를 사용합니다. 폴더 이름에 따라 다른 빈 볼륨을 만들어 버리는 것을 방지하기 위해서입니다.

### 방법 A. 기존 실행 이미지 로드 — 이전 시 권장

```powershell
docker image load --input C:\CELL-MigrationBackup\cell-images.tar
if ($LASTEXITCODE -ne 0) { throw '이미지 로드 실패.' }
```

보조 도구 Alpine/Certbot을 이미지 백업에 포함하지 않았다면 필요 시 따로 준비하세요. 이 방식은 기존 실행 버전을 먼저 보존하는 경로이며 소스의 최신 미빌드 변경까지 자동 반영하는 것은 아닙니다.

### 방법 B. 실행 이미지 없이 소스에서 새로 빌드

인터넷 접속과 의존성 다운로드가 필요합니다. 재빌드는 기존 실행 이미지와 달라질 수 있으므로 전체 기능을 다시 검증해야 합니다.

조사 시점 운영 MySQL은 **8.0.46**입니다. 다음은 동일 버전을 준비하고 현재 Compose의 `mysql:8.0` 태그에 연결하는 **새 대상 서버용 예시**입니다. 실제 이전 시 원본 버전이 바뀌었다면 그 버전에 맞추세요.

```powershell
docker pull mysql:8.0.46
if ($LASTEXITCODE -ne 0) { throw '동일 MySQL 버전 준비 실패.' }
docker image tag mysql:8.0.46 mysql:8.0
if ($LASTEXITCODE -ne 0) { throw 'MySQL 이미지 태그 준비 실패.' }
docker pull alpine:latest
if ($LASTEXITCODE -ne 0) { throw '백업 복원용 이미지 준비 실패.' }
docker compose -p dev build ai-server backend colorizer frontend
if ($LASTEXITCODE -ne 0) { throw '애플리케이션 빌드 실패.' }
```

새 서버에서 DB 이전과 MySQL 버전 업그레이드를 동시에 하지 않는 편이 안전합니다. 아래 기동 명령의 `--pull never`는 방금 준비한 로컬 이미지를 사용하도록 합니다.

## 6. DB·컬러화 데이터 복원 후 서비스 실행

### 6-1. MySQL만 시작

```powershell
docker compose -p dev up -d --no-build --pull never mysql
if ($LASTEXITCODE -ne 0) { throw 'MySQL 시작 실패.' }
docker compose -p dev ps mysql
```

`healthy`가 될 때까지 기다린 뒤 상태를 다시 확인하세요. 이 단계에는 backend/frontend를 시작하지 않습니다.

### 6-2. 기존 CELL DB 복원

**다음 SQL 복원은 기존 테이블을 덮어쓸 수 있습니다. 새 컴퓨터의 빈 대상 DB에만 적용하세요.**

```powershell
docker compose -p dev cp C:\CELL-MigrationBackup\celldb.sql mysql:/tmp/celldb-migration.sql
if ($LASTEXITCODE -ne 0) { throw 'SQL 복사 실패.' }

docker compose -p dev exec -T mysql sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysql --user=root --default-character-set=utf8mb4 < /tmp/celldb-migration.sql'
if ($LASTEXITCODE -ne 0) { throw 'DB 복원 실패. 백엔드를 시작하지 마세요.' }
```

계정·과제·답안·라벨 등 데이터와 현재 운영 스키마를 함께 복원합니다. `backend/sql`의 파일들은 일부 변경용 SQL이며 전체 초기 스키마를 만드는 일괄 설치 스크립트가 아닙니다. 단순히 빈 `celldb`를 만들거나 임의로 운영 `ddl-auto`를 변경해서 이전을 대신하지 마세요.

기존 데이터를 가져오지 않는 완전히 독립된 새 운영 DB를 만들고 싶다면 전체 초기 스키마와 기준 데이터 준비를 별도로 검토해야 합니다. 이 문서의 기본 목적은 **기존 서비스 보존 이전**입니다.

### 6-3. 컬러화 전체 볼륨 복원

새 컬러화 앱을 아직 한 번도 사용하지 않았고, 최초 빈 설치 검사를 통과한 상태에서 진행하세요. Compose가 MySQL 기동 때 빈 볼륨까지 만들었을 수 있어 `volume create`는 기존 빈 볼륨을 사용하거나 새로 만듭니다.

```powershell
docker volume create dev_colorizer-data
if ($LASTEXITCODE -ne 0) { throw '컬러화 볼륨 준비 실패.' }

docker run --rm --mount type=volume,source=dev_colorizer-data,target=/restore --mount type=bind,source=C:\CELL-MigrationBackup,target=/backup,readonly alpine:latest tar -xzpf /backup/colorizer-data.tar.gz -C /restore
if ($LASTEXITCODE -ne 0) { throw '컬러화 데이터 복원 실패.' }
```

DB·업로드·숨김 파일과 소유권/권한을 보존하세요. 기존 서비스가 쓰고 있는 볼륨 위로 실행하면 안 됩니다.

### 6-4. AI·컬러화 → 백엔드 → 프런트 순서

```powershell
docker compose -p dev up -d --no-build --pull never ai-server colorizer
if ($LASTEXITCODE -ne 0) { throw 'AI/컬러화 시작 실패.' }
docker compose -p dev ps
```

AI·컬러화가 `healthy`가 된 뒤:

```powershell
docker compose -p dev up -d --no-build --pull never backend
if ($LASTEXITCODE -ne 0) { throw '백엔드 시작 실패.' }
docker compose -p dev logs --tail 100 backend
```

DB 접속 실패, 스키마 검증 실패, 기동 예외가 없는지 확인하세요. backend에는 현재 Compose healthcheck가 없어 `Up`만으로 준비 완료를 단정하지 않습니다. 백엔드가 정상 기동한 다음:

```powershell
docker compose -p dev up -d --no-build --pull never frontend
if ($LASTEXITCODE -ne 0) { throw '프런트 시작 실패.' }
docker compose -p dev ps
```

명령이 실패하면 다음 단계로 계속 진행하지 말고 오류부터 확인하세요. 로그 공유 시 개인정보·토큰 등은 가리세요.

## 7. 도메인·HTTPS·외부 접속 전환

현재 운영 설정은 **`https://cell.cbnu.ac.kr`** 기준입니다. 80포트 HTTP는 HTTPS로 이동하며, `ssl/cert.pem`과 `ssl/key.pem`이 없으면 Nginx가 시작하지 못할 수 있습니다. 단순히 `http://localhost` 또는 임의의 PC IP로 접속하면 인증서/도메인 설정과 맞지 않을 수 있습니다.

새 서버 자신에서 도메인과 TLS 검증을 유지한 로컬 확인:

```powershell
curl.exe --resolve cell.cbnu.ac.kr:443:127.0.0.1 -I https://cell.cbnu.ac.kr/
```

검증을 끄는 `-k`는 넣지 않습니다. 브라우저로 전환 전 점검할 때는 **점검 PC에만** 도메인을 새 서버 IP로 임시 hosts 매핑할 수 있으며 테스트 후 원복합니다. 이것은 외부 네트워크 점검을 대신하지 않습니다.

| 네트워크 상황 | 전환 작업 |
| --- | --- |
| 같은 공인 IP/같은 공유기에서 PC만 교체 | 새 PC 내부 IP 고정 또는 DHCP 예약, TCP 80/443 포트포워딩 대상을 새 PC로 변경 |
| 공인 IP 변경 | 도메인 DNS A 레코드 변경 검토. AAAA가 있다면 IPv6도 확인 |
| 학교에서 IP/포트를 관리 | IP 배정, 방화벽/접속 허용, DNS 담당자에게 요청 |

외부 공개 포트는 현재 구성상 **80/443**입니다. MySQL 3306, backend 8080, AI 8001, 컬러화 8501을 인터넷에 따로 열지 마세요. 방화벽 전체를 끄지 말고 필요한 규칙만 설정하세요.

도메인을 바꾸면 Nginx, 인증서, 백엔드 CORS 허용 주소 등을 함께 검토해야 합니다. 관련 파일은 `frontend/nginx.conf`, `backend/src/main/java/com/cell/platform/config/SecurityConfig.java`입니다.

### 인증서 갱신

- 같은 도메인을 계속 쓰면 유효한 기존 인증서·개인키를 옮겨 사용할 수 있습니다.
- 2026-11-03 확인한 로컬 인증서 만료일은 **2026-12-02**입니다. 이전 당일 다시 확인하고 외부에서 실제 제공되는 인증서도 점검하세요.
- `ssl-renew.ps1`은 `C:\DEV` 경로와 기존 도메인을 사용합니다. 새 경로/도메인이면 조정이 필요하고 ACME 연락처도 담당자를 확인해야 합니다.
- 스크립트는 프런트를 잠시 중지하고 Certbot standalone 방식으로 80포트를 사용합니다. 도메인의 요청이 해당 서버까지 도달해야 합니다.
- **스크립트 파일 복사만으로 자동 갱신되지는 않습니다.** 작업 스케줄러/실행 계정/권한/Docker 가용성/로그/실행 결과를 확인하세요. 이번 조사로 자동 갱신 예약이 설정돼 있다고 확정하지 않았습니다.
- 현재 HSTS 설정이 있으므로 인증서 경고 무시나 HTTP 사용을 정상 운영 해법으로 삼지 마세요.

## 8. 이전 완료 확인과 자동 실행

단순 `Up` 표시가 아니라 다음을 확인하세요.

- [ ] 기존/새 DB의 테이블별 레코드 수가 최종 백업 시점 기준으로 일치한다.
- [ ] `data` 파일 수·크기, 중요 파일과 백업의 SHA256이 원본/복사본에서 일치한다.
- [ ] 기존 계정으로 로그인하고 역할별 화면이 맞게 보인다.
- [ ] 과제·답안·정답·채점 결과·완료 상태가 남아 있다.
- [ ] 기존 원본/crop/썸네일과 진단용 이미지가 열린다.
- [ ] AI 모델이 로딩되고 점검용 입력 처리가 가능하다.
- [ ] 컬러화의 기존 계정·DICOM·저장 설정·ROI가 남아 있고 점검용 저장이 가능하다.
- [ ] 도메인 전환 전과 전환 후, 다른 네트워크에서도 인증서 경고 없이 접속된다.
- [ ] 실제 접속 대상이 기존 PC가 아닌 새 서버임을 확인했다.
- [ ] 인증서 갱신과 정기 백업 방법/담당자를 확인했다.
- [ ] 새 서버 재부팅 뒤에도 외부 접속이 복구된다.
- [ ] 기존 서버와 백업을 복구용으로 보존했다.

서비스의 `restart: unless-stopped`는 **Docker 엔진이 실행된 뒤의 컨테이너 재시작 정책**입니다. Windows 부팅만으로 Docker Desktop이 로그인 없이 준비된다고 가정하지 마세요. 실행 사용자 세션, Desktop 시작 설정, 전원/절전/업데이트 정책을 점검하세요. 무인 상시 운영이 필요하면 로그인에 의존하지 않는 Linux Docker 서비스 등의 구성을 검토하세요. 보안 검토 없는 Windows 자동 로그인은 기본 해법으로 삼지 않습니다.

GPU가 있어도 현재 Compose에는 AI용 GPU 전달 설정이 없습니다. AI는 CUDA 가용성에 따라 장치를 선택하므로 GPU 모델/드라이버/Docker 전달/PyTorch 호환성을 별도 확인해야 합니다. **먼저 기존 구성으로 이전을 완료하고 GPU 적용은 따로 검증**하세요. [Docker GPU 안내](https://docs.docker.com/desktop/features/gpu/)

### 데이터 손실 방지와 되돌리기

- **`docker compose down -v`, 볼륨 삭제/prune, Docker Desktop 초기화, DB 삭제를 이전 중 실행하지 마세요.**
- 기존 서버와 새 서버를 독립 DB 상태로 동시에 사용자에게 열면 데이터가 갈라집니다. 쓰기를 받는 운영 서버는 하나로 정하세요.
- 새 서버에 새 답안/업로드가 없을 때는 새 서버를 닫고 기존 서버를 재가동해 접속 경로를 되돌릴 수 있습니다.
- 새 서버에 신규 기록이 생긴 후에는 기존 DB가 과거 상태입니다. 단순히 경로만 되돌리지 말고 쓰기를 멈춘 뒤 역이전/동기화 방안을 먼저 정하세요.
- 기존 PC 초기화/폐기는 데이터·기능·백업 복원 검증이 끝난 뒤에 진행하세요.

## 9. 이전 후 코드 업데이트·일상 운영

### 코드 수정 반영

새 서버에서 현재 브랜치와 미커밋 변경부터 확인하세요. 충돌/변경이 있으면 강제 초기화하지 말고 먼저 보존합니다.

```powershell
Set-Location -LiteralPath 'C:\DEV'
git status --short --branch
git pull --ff-only origin juhun
if ($LASTEXITCODE -ne 0) { throw '업데이트 실패. 로컬 변경 또는 브랜치 상태를 확인하세요.' }
docker compose -p dev up -d --build
if ($LASTEXITCODE -ne 0) { throw '업데이트 빌드/기동 실패.' }
docker compose -p dev ps
```

DB 구조가 바뀐 업데이트는 해당 변경의 마이그레이션 안내를 먼저 확인하고 백업 후 적용해야 합니다. `validate` 상태에서는 새 코드가 요구하는 스키마가 없으면 기동 실패할 수 있습니다. 모든 `backend/sql` 파일을 무조건 반복 실행하거나 초기화하지 마세요.

**`restart`만으로는 수정된 코드를 새 이미지에 반영하지 못합니다.** 프런트만 바뀐 경우는 `docker compose -p dev up -d --build frontend`처럼 해당 서비스만 빌드할 수 있습니다. AI 모델 파일을 교체한 경우에는 시작 시 모델을 읽는 AI 서비스 재시작도 필요합니다.

### 중지·재개·로그

상태와 최근 로그만 확인:

```powershell
docker compose -p dev ps
docker compose -p dev logs --tail 100 frontend backend ai-server colorizer
```

전체 서비스 중지(사용자 접속도 중단됨):

```powershell
docker compose -p dev stop
```

기존 이미지로 다시 실행:

```powershell
docker compose -p dev up -d
```

`stop`과 일반 `up -d`는 운영 데이터 삭제 명령이 아닙니다. 코드가 바뀌었다면 위의 재빌드 업데이트 절차를 사용하세요.

### 자주 막히는 지점

| 증상 | 우선 확인할 것 |
| --- | --- |
| Docker 엔진 연결 실패 | Docker Desktop 실행 여부, WSL/가상화, Linux 컨테이너 모드 |
| 빈 사이트/기존 계정 없음 | 다른 브랜치/프로젝트명, 새 빈 볼륨 사용, SQL 복원 누락 |
| backend 시작 실패 | DB healthy 여부, `.env` 암호, `validate` 스키마 검증, 복원 오류 |
| frontend 반복 재시작 | SSL 파일/키 존재·일치, Nginx 설정, backend 준비 상태 |
| 502/504 | backend/AI/컬러화의 기동·로그·부하. 프런트 화면이 열린다고 API까지 정상인 것은 아님 |
| 기존 목록은 있으나 이미지 안 열림 | `data` 누락/경로/권한, 이미지 요청 인증 |
| AI 시작 실패 | 모델 실파일·이름·접근 권한, 의존성·메모리 |
| 컬러화 계정/작업이 사라짐 | `dev_colorizer-data` 복원 누락, 다른 빈 볼륨 사용 |
| 컬러화 DB/파일 쓰기 실패 | UID/GID 10001:10001 권한 보존 여부 |
| 내 PC만 접속 가능 | DNS/포트포워딩/학교·Windows 방화벽, 외부 네트워크 테스트 |
| 인증서 경고 | 실제 제공 인증서의 만료/도메인/체인, 갱신 경로. 브라우저 캐시 문제로 단정하지 않음 |

## Architecture

```text
외부 사용자
  └─ HTTPS :443 / HTTP :80 → HTTPS로 이동
      └─ frontend: Nginx + React
          ├─ /api/, /data/ → backend :8080
          │                    ├─ mysql :3306 / celldb
          │                    ├─ ai-server :8001
          │                    └─ /data (호스트 data와 공유)
          └─ /colorizer/ → colorizer :8501
                               └─ /data (별도 colorizer-data 볼륨, SQLite + DICOM)
```

| 구성 | 코드/설정의 실행 환경 | 저장소 |
| --- | --- | --- |
| frontend | React 18, Vite 5; Node 20 빌드 → Nginx | `frontend` |
| backend | Java 17, Spring Boot 3.3.5; Gradle 빌드 | `backend` |
| ai-server | Python 3.12 이미지, FastAPI, YOLO/DenseNet | `ai-server`, 모델 가중치 |
| mysql | Compose는 `mysql:8.0`, 조사 시 실행 버전 8.0.46 | `mysql-data` 볼륨 |
| colorizer | Python 3.12 이미지, Flask/Gunicorn, SQLite | `컬러화POC`, `colorizer-data` 볼륨 |

지정 버전은 Dockerfile/패키지/설정 기준이며, 실제 저장해 둔 이미지와 재빌드 결과는 구분해서 확인하세요.

## Directory Structure

```text
DEV/
├── backend/                # Spring Boot API / 일부 변경용 sql/
├── ai-server/              # FastAPI 추론 서버 / weights/
├── frontend/               # React / Nginx / 목업
├── 컬러화POC/              # 별도 DICOM 컬러화 서비스
├── data/                   # 원본·crop·썸네일·진단평가 데이터
├── ssl/                    # HTTPS 인증서/개인키 — 별도 전달
├── letsencrypt/            # ACME 자료 — 별도 전달
├── .env                    # 실제 비밀설정 — 별도 전달
├── .env.example            # 변수 목록용 템플릿
├── docker-compose.yml
├── ssl-renew.ps1
└── CELL_새서버_이전가이드.md

Docker 볼륨(위 폴더 복사만으로 포함되지 않음):
  dev_mysql-data
  dev_colorizer-data
```

## 가장 간단한 로컬 화면 테스트 — 운영 이전과 별개

Node.js/npm을 사용할 수 있는 개발 PC에서 백엔드·DB·Docker 없이 프런트엔드 화면만 확인합니다.

```powershell
Set-Location -LiteralPath 'C:\DEV\frontend'
npm ci
npm run dev:mock
```

브라우저에서 `http://localhost:5173`을 열고 교수·학생·관리자 중 테스트할 계정을 선택해 로그인합니다. 변경은 실행 중인 로컬 메모리에만 저장되고 실제 서버에 반영되지 않습니다. 이 테스트의 성공을 실제 운영 서버 정상 실행으로 보지 마세요.

로그인 상태는 같은 브라우저의 탭 사이에 공유됩니다. 한 탭에서 로그인·로그아웃하거나 계정을 변경하면 다른 탭도 해당 계정의 첫 화면 또는 로그인 화면을 자동으로 다시 엽니다. 이전 화면의 작업 내용은 초기화됩니다. 교수·학생 계정을 동시에 테스트하려면 일반 창과 시크릿 창, 또는 서로 다른 브라우저 프로필을 사용하세요.

탭 동기화 확인: 같은 주소를 두 탭에서 열고 로그인한 뒤 한 탭에서 로그아웃하면 두 탭 모두 로그인 화면으로 전환되는지 확인합니다. 이후 학생 계정으로 로그인하면 두 탭 모두 학생 화면으로 전환되어야 합니다.

교수·관리자 페이지는 **1. Analytics & Feedback**을 첫 번째 탭과 기본 화면으로 사용합니다. 교수 페이지의 **Task Management**는 두 번째 탭에 있습니다. 두 역할은 같은 분석 화면을 사용하므로 도말별 학생 응답, 라벨링 진행 상태, 세포 이동·이미지 화면 조정과 학생별 학습 이력을 동일하게 확인할 수 있습니다.

학생 관리 화면은 **Analytics & Feedback → Students → 학생 선택**에서 확인합니다. `학습 이력`은 과제·Task·진단평가별 풀이 현황과 채점 결과를 보여 주며, 과제를 펼친 뒤 `세포별 응답`을 누르면 오답·미응답·채점 대기 문항도 확인할 수 있습니다. 기존 누적 혼동행렬은 학생별 하위 메뉴와 `전체 누적 혼동행렬` 버튼에서 제공합니다. 목업의 `student` 계정에는 부분 풀이 과제와 완료한 Task·진단평가가 있고, `20260006`은 응답이 없는 학생입니다.

학생은 상단 **My Page**에서 본인 정보와 다음 메뉴를 확인할 수 있습니다.
- **Learning History**: 응답한 과제·Task·진단평가, 완료/진행/마감 상태, 세포별 본인 응답
- **Results**: 기존 공개 조건을 충족한 학습 결과 및 정답 비교
- **My Reports**: 본인이 보낸 신고·질문, 답변 대기/완료 상태, 교수·관리자 답변

문제 풀이 중 **잘 모르겠어요**에서 사유와 질문 내용을 입력해 보냅니다.
교수·관리자는 **Analytics & Feedback → Reports → Reply**에서 답변하며,
추가 답변도 남길 수 있습니다. 학생은 My Reports를 열거나 **Refresh**를 눌러 새 답변을 확인합니다.
목업에는 답변 대기·완료 예제가 있으며, 학생 창과 교수/관리자 창을 서로 다른 브라우저 프로필로 열어
질문 접수 → 답변 등록 → 학생 확인 흐름을 테스트할 수 있습니다. 목업 서버를 재시작하면 기록은 초기화됩니다.

학생용 이력·신고 API는 로그인한 사용자로 조회 범위를 결정합니다. 요청에 다른 학생 ID를 넣어도
해당 학생의 기록을 조회하거나 다른 학생 명의로 신고할 수 없습니다. 이력 API에는 정답·정오 판정·점수가
포함되지 않으며, 기존 Results API의 정답 공개 규칙을 유지합니다.

**기존 운영 DB 적용**: 운영 환경은 `ddl-auto=validate`이므로 새 버전 실행 전에
[`backend/sql/20261015_report_replies.sql`](backend/sql/20261015_report_replies.sql)을
MySQL DB에 한 번 적용해야 합니다. 이 SQL은 신고 본문을 TEXT로 확장하고 답변 테이블을 생성합니다.
과제 삭제로 신고가 삭제되면 연결된 답변도 함께 삭제됩니다. `ddl-auto=update`인 개발 환경에서는 자동 생성됩니다.

프런트엔드 회귀 테스트(`frontend` 폴더에서 실행):

```powershell
node --test src/utils/*.test.js
```

## 주요 API

### Backend — 내부 :8080, 운영에서는 HTTPS /api/로 중계

| Method | Path | 용도 | 접근 |
| --- | --- | --- | --- |
| POST | /api/auth/register | 회원가입 | 인증 불필요, 가입 규칙은 서비스 코드 기준 |
| POST | /api/auth/login | JWT 로그인 | 인증 불필요 |
| GET | /api/tasks | Task 목록 | 인증 |
| POST | /api/tasks/upload | 이미지 업로드·Task 생성 | EXPERT / ADMIN |
| POST | /api/tasks/diagnostic/create | 진단평가 생성 | EXPERT / ADMIN |
| GET | /api/tasks/{taskId}/crops | 세포 목록 | 인증 |
| POST | /api/submit | 학생 답안 제출 | 인증 |
| GET | /api/tasks/{taskId}/my-results/{studentId} | 채점 결과 | 학생 본인 범위 및 복습 허용 검사, 교수/관리자 조회 |
| GET | /api/tasks/{taskId}/diagnostic/student-matrices | 학생 혼동행렬 | EXPERT / ADMIN |
| GET | /api/tasks/{taskId}/stats | 통계 | EXPERT / ADMIN |
| PUT | /api/crops/{cropId}/confirm | 정답 확정·수정 | EXPERT / ADMIN |
| GET | /api/training-data | 확정 라벨 데이터 | 인증 |
| GET | /api/analytics/students/{studentId}/history | 학생 학습 이력 | EXPERT / ADMIN |

전체 계약/업무 규칙은 `backend/src/main/java/com/cell/platform/controller`, `service`, `config/SecurityConfig.java`를 확인하세요.

### AI Server — 내부 :8001

| Method | Path | 용도 |
| --- | --- | --- |
| POST | /api/analyze | 이미지 탐지·분류 |
| POST | /api/retrain | 데이터 준비·검증 단계. **실제 재학습은 TODO이며 완료 기능이 아님** |
| GET | /health | 상태 및 모델 준비 여부 반환 |

컬러화의 외부 접근 경로는 `/colorizer/`이며 CELL MySQL과 별도 계정·저장소를 사용합니다.

## 문서 검증 범위

이 README는 소스·설정, Git 추적/원격 상태, 현재 컨테이너·DB 버전·로컬 인증서 메타데이터를 근거로 작성했습니다. 새 컴퓨터 설치나 실제 DB 복원 리허설을 완료했다는 의미는 아닙니다. 이전 당일 백업·복원 종료 코드와 8절 점검을 반드시 확인하세요.
