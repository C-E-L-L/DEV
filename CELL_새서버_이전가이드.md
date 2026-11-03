# CELL 새 서버 이전 준비·작업 가이드

작성 기준: 2026-10-29, 현재 `C:\DEV`의 설정과 실행 중인 Docker 컨테이너를 확인한 결과.

2026-11-03 보완: Git 추적 파일을 다시 확인해 모델·진단용 데이터의 백업 범위를 구분했다. GitHub에서 시작하는 설치·복원 순서는 [README](README.md)를 먼저 참고한다. 아래 실행 상태·용량 등은 별도 표시가 없으면 최초 조사 시점 기록이다.

이 문서는 **이전 준비 안내서**다. 작성 과정에서 서버를 중지하거나 DB를 변경하지 않았으며, 아래 백업·복원·설치 명령도 실행하지 않았다. 기존 소스와 설정은 수정하지 않았다.

## 1. 먼저 결론

새 컴퓨터에 Docker 실행 환경을 설치하고, 다음 세 묶음을 옮겨야 현재 서비스와 데이터를 이어서 사용할 수 있다.

1. **현재 `C:\DEV`의 코드·설정·파일**: 특히 `.env`, `data`, AI 모델, `ssl`을 빠뜨리지 않는다.
2. **CELL MySQL DB 백업**: 회원, 과제, 학생 답안, 채점 결과 등. `C:\DEV` 밖의 Docker 볼륨에 있다.
3. **컬러화/DICOM 데이터 전체 백업**: 별도의 SQLite DB와 업로드 파일. 이것도 Docker 볼륨에 있다.

추가로 **현재 실행 이미지도 저장해서 옮기는 방식**을 권장한다. 새 컴퓨터에서 의존성을 전부 다시 내려받는 일을 줄이고, 이전과 버전 업그레이드를 분리할 수 있다.

**GitHub에서 코드를 다운로드하거나 `C:\DEV`만 복사한 다음 `docker compose up` 하는 것으로는 이전이 완료되지 않는다.** 특히 백엔드는 DB 구조를 자동 생성하는 설정이 아니라 `validate` 설정이므로, DB 복원이 먼저다.

이번 안내의 구체적인 명령은 **새 컴퓨터도 Windows이고, 프로젝트를 `C:\DEV`에 둘 경우**를 기준으로 한다. OS가 아직 없거나 Windows Server/Ubuntu라면 3절의 OS 선택부터 확인한다.

## 2. 현재 무엇이 어디에서 실행되는가

| 구성 | 역할 | 중요한 저장 위치 | 현재 상태 |
| --- | --- | --- | --- |
| frontend | React 화면 제공, Nginx HTTPS 및 API 중계 | 소스 `frontend`, 인증서 `ssl` | 실행 중, 외부 80/443 포트 공개 |
| backend | CELL API, 계정·과제·답안·채점 처리 | MySQL과 `data` 사용 | 실행 중, 내부 8080 |
| ai-server | 세포 탐지·분류 AI | `ai-server/weights`, `data` | 실행 중, healthy, 내부 8001 |
| mysql | CELL의 관계형 DB `celldb` | Docker 볼륨 **`dev_mysql-data`** | 실행 중, healthy, MySQL **8.0.46** |
| colorizer | DICOM 컬러화 기능 | Docker 볼륨 **`dev_colorizer-data`** | 실행 중, healthy, 내부 8501 |

현재 도메인은 `cell.cbnu.ac.kr`이다. Nginx는 일반 화면, `/api/`, `/data/`, `/colorizer/`를 각 서비스로 연결한다. MySQL과 각 API 포트를 외부에 따로 열어 둘 필요는 없다.

위 상태는 컨테이너 상태와 설정 확인 결과이며, 모든 사용자 기능이나 외부 접속까지 정상임을 보증하는 실사용 테스트 결과는 아니다.

근거: `docker-compose.yml:1`, `docker-compose.yml:31`, `docker-compose.yml:53`, `docker-compose.yml:73`, `frontend/nginx.conf:1`. 상태·볼륨·DB 버전은 `docker compose ps`, `docker volume ls`, `docker compose exec -T mysql mysql --version`으로 확인했다.

## 3. 아무것도 없는 새 컴퓨터에 준비할 것

### 3-1. OS부터 구분

| 새 컴퓨터의 OS/운영 방식 | 준비 방향 |
| --- | --- |
| 지원되는 Windows 11 PC | 현재 운영 방식과 유사하게 **WSL 2 + Docker Desktop의 Linux 컨테이너** 사용 |
| Windows Server | 일반 Windows PC와 다르다. Docker Desktop은 Windows Server를 지원하지 않으므로 이 문서의 Desktop 설치 절차를 그대로 적용하지 않는다. Linux VM 또는 Linux 서버 등 실행 환경을 먼저 결정해야 한다. |
| Ubuntu 서버 | Docker Engine과 Compose 플러그인을 공식 설치 절차로 설치한다. 데이터 구성은 같지만 경로·권한·자동 실행·인증서 갱신 작업을 Linux 기준으로 바꿔야 한다. |
| OS도 없는 상태 | 먼저 OS 설치와 네트워크/드라이버 구성이 필요하다. 기존과 비슷한 조작을 원하면 Windows PC 방식, 로그인 없이 상시 운영하는 서버를 원하면 Linux 서버 방식을 검토한다. |

Windows 지원 조건과 Windows Server 미지원은 [Docker 공식 Windows 설치 안내](https://docs.docker.com/desktop/setup/install/windows-install/)에서 확인했다. Ubuntu 설치는 [Docker 공식 Ubuntu 설치 안내](https://docs.docker.com/engine/install/ubuntu/)를 사용한다. 설치 시점의 OS 지원 범위도 다시 확인한다.

### 3-2. Windows 기준 설치 목록

| 항목 | 필요 여부 | 설명 |
| --- | --- | --- |
| 지원되는 64비트 Windows, 업데이트, 장치 드라이버 | 필수 | 현재 실행 이미지는 `linux/amd64`이다. Intel/AMD x86-64 컴퓨터 기준이며 ARM 서버라면 별도 호환성 확인이 필요하다. |
| BIOS/UEFI 가상화 기능 | 필수 | Intel VT-x/AMD-V 등을 활성화한다. |
| WSL 2 | 필수 | Docker Desktop의 WSL 2 백엔드용 |
| Docker Desktop | 필수 | **Linux containers**로 사용. Docker Engine과 `docker compose`를 사용할 수 있어야 한다. |
| Git for Windows | 권장 | 이후 코드 업데이트에 필요. 폴더 복사만으로 실행하는 경우의 필수 런타임은 아니다. |
| 브라우저 | 필요 | 화면·로그인·파일 조회 점검 |
| VS Code 등 편집기 | 선택 | 설정/코드 확인과 유지보수용 |
| GPU 드라이버 | GPU를 쓸 때 | AI에 GPU를 연결하려면 드라이버와 Docker GPU 전달 설정을 별도로 확인한다. |

**Docker 방식으로 실행할 때 호스트에 Node.js, Java, Gradle, Python, MySQL, Nginx를 각각 설치할 필요는 없다.** 저장소의 Dockerfile이 컨테이너 안에 실행 환경을 구성한다. 개발 목적으로 컨테이너 밖에서 직접 실행하려는 경우는 별개다.

저장소에서 확인한 환경은 프런트 빌드 Node 20, 백엔드 빌드 Gradle 8.13/JDK 17 및 실행 JRE 17, AI·컬러화 이미지 Python 3.12다. 이것은 Dockerfile의 지정 버전이며, 재빌드 없이 옮길 때는 실제 저장한 이미지가 실행 환경의 기준이 된다.

근거: `frontend/Dockerfile:1`, `backend/Dockerfile:1`, `ai-server/Dockerfile:1`, `컬러화POC/Dockerfile:1`.

### 3-3. 하드웨어·저장 공간·주변 준비

- SSD 사용을 권장한다. 새 서버의 여유 공간은 **최소 요구량이라는 뜻이 아니라 운영 여유를 위한 제안으로 100GB 이상**을 권장한다. 이미지, 빌드 캐시, 백업, 이후 업로드 증가분까지 고려한 값이다.
- RAM은 이 서비스의 측정된 최소 사양을 확인한 것은 아니다. 새로 준비한다면 **16GB 이상, 여유 있게 32GB**를 운영상 권장한다. 실제 동시 접속·AI 처리량을 보고 조정해야 한다.
- 이전용 외장 SSD/USB 또는 접근 제한된 공유 폴더가 필요하다. 실행 이미지까지 보관한다면 **30GB 이상 여유 공간**을 준비하는 편이 좋다. 실제 백업 파일 크기는 생성 후 확인한다.
- 이미지 아카이브 한 개가 4GB를 넘을 수 있으므로 FAT32보다는 NTFS/exFAT 등 큰 파일을 저장할 수 있는 매체를 사용한다.
- 인터넷 연결, 가능하면 유선 LAN, 학교/공유기 네트워크 설정 권한 또는 담당자 연락 경로가 필요하다.
- 새 PC의 내부 IP 고정 또는 DHCP 예약을 준비한다. 절전·최대절전 때문에 서비스가 멈추지 않도록 전원 설정을 확인한다.
- `.env`, 인증서 개인키, DB에는 비밀정보·사용자 데이터가 들어간다. 전송 매체를 암호화하거나 접근을 제한하고 GitHub나 공개 공유 링크에 올리지 않는다.

### 3-4. Windows의 기본 설치 순서

관리자 PowerShell에서 WSL을 처음 설치하는 경우:

```powershell
wsl --install
```

설치 안내에 따라 재부팅하고 최초 배포판 설정을 마친다. 이후:

```powershell
wsl --update
wsl --status
wsl --list --verbose
```

Docker Desktop을 공식 설치 파일로 설치하고 WSL 2 백엔드 및 Linux 컨테이너 모드로 실행한다. 이 프로젝트의 명령은 Windows PowerShell에서 실행해도 된다. 별도 Ubuntu 안에 프로젝트 실행용 MySQL/Java 등을 중복 설치할 필요는 없다.

```powershell
docker version
docker compose version
docker info --format '{{.OSType}}/{{.Architecture}}'
git --version
```

`docker version`에서 클라이언트뿐 아니라 서버 정보도 나와야 한다. 현재 이미지와 같은 x86 서버라면 마지막 Docker 확인 결과는 `linux/x86_64` 계열이어야 한다. Git은 설치했을 때만 확인한다.

WSL 설치·재부팅 절차의 출처: [Microsoft WSL 설치 안내](https://learn.microsoft.com/en-us/windows/wsl/install).

## 4. 반드시 옮길 대상

| 대상 | 실제 위치 / 백업 방식 | 빠졌을 때의 문제 |
| --- | --- | --- |
| 프로젝트 코드·실행 설정 | `C:\DEV`의 소스, `docker-compose.yml`, Dockerfile, 패키지 잠금 파일 등 | 빌드·실행·유지보수 불가 |
| 실제 환경 설정 | **`C:\DEV\.env`** | DB 접속·토큰·관리자·컬러화 세션 설정 불일치 |
| CELL DB | **`dev_mysql-data`**의 `celldb`를 새 SQL 덤프로 백업·복원 | 기존 회원·과제·답안·채점 기록 소실. 빈 DB에서는 백엔드 검증 실패 가능 |
| 업로드 원본·crop·썸네일 | **`C:\DEV\data` 전체** | DB 목록은 남아도 이미지가 열리지 않는 등 연결 끊김 |
| 진단용 데이터셋 | `data\diagnostic_gt` 전체. raw·processed·manifest·crop 등 일부만 고르지 않는다. | 진단 과제/이미지 조회에 필요한 자료 누락 |
| AI 학습 완료 모델 | **`ai-server\weights\yolov8_best.pt`**, **`densenet201_best.pth`** | 모델 로딩·AI 처리 실패 |
| HTTPS 인증서 | **`ssl\cert.pem`**, **`ssl\key.pem`** | Nginx 기동 실패 또는 HTTPS 오류 |
| 인증서 갱신 관련 자료 | **`letsencrypt` 전체**, `ssl-renew.ps1`, 실제 예약 작업이 있다면 그 정의 | 당장 접속돼도 이후 인증서 갱신 누락 |
| 컬러화 DB·업로드 전체 | **`dev_colorizer-data` 전체를 tar 백업·복원** | 컬러화 계정, 작업·색상·ROI 등 저장 정보 및 원본 DICOM 누락 |
| 현재 실행 이미지 | `docker image save`로 파일 생성 | 필수 데이터 자체는 아니지만, 재다운로드·재빌드 및 버전 차이 위험을 줄이는 데 유용 |
| 문서·미커밋 자료·기존 백업 | 시스템 정의서 자료, `CELL_capstone_audit`, `backups` 등 | 서비스 실행과 별개로 작업 이력·산출물 누락 |

단순하게는 **`C:\DEV` 폴더 전체 복사 + 새 MySQL 덤프 + 컬러화 볼륨 백업 + 실행 이미지 백업**으로 준비하면 된다. 다만 복사된 예전 SQL 백업이 새 덤프를 대신하는 것은 아니다.

`node_modules`, `frontend/dist`, `backend/build`, `.gradle`, Python 가상환경·캐시 등은 다시 만들 수 있다. 공간을 줄이려면 생략 가능하지만, `.env`, 실제 데이터, 모델, 인증서는 생략하면 안 된다. `.git`을 함께 옮기면 현재 브랜치와 이력 보존에 도움이 되며, 새 PC의 GitHub 로그인/권한은 별도 설정한다.

### 4-1. GitHub 코드만 받아서는 부족한 이유

현재 `.gitignore`에는 `.env`, `ssl/`, `letsencrypt/`, `ai-server/weights/`, `data/`, 일반 SQL/압축 백업 등이 제외되어 있다. 다만 **이미 Git에서 추적 중인 파일에는 나중에 추가한 ignore 규칙이 소급 적용되지 않는다.** 2026-11-03 확인 결과 모델 2개와 `data/diagnostic_gt`의 11,960개 파일은 이미 추적 중이지만, `data/originals`, `data/crops`, `data/thumbnails`, `.env`, SSL/ACME 자료와 Docker 볼륨은 그렇지 않다. 따라서 GitHub 다운로드나 `git clone`만으로 운영 환경 전체를 복원할 수 없다. 미추적 조사 자료와 작성 중인 문서도 따로 확인한다.

또한 Docker 볼륨은 Docker가 별도로 관리하는 영구 저장소다. Explorer에서 보이는 `C:\DEV` 폴더와 같은 위치가 아니다. [Docker 볼륨 공식 설명](https://docs.docker.com/engine/storage/volumes/)

### 4-2. DB 두 종류를 혼동하지 말 것

- **CELL 본체**: MySQL `celldb`. 권장 이전물은 테이블 구조와 데이터를 포함한 최신 SQL 덤프다. Docker 내부 DB 디렉터리를 실행 중에 그대로 복사하지 않는다.
- **컬러화 기능**: `/data/colorizer.db`라는 SQLite DB와 `/data/uploads` 등의 파일을 사용한다. `/data`는 호스트 `C:\DEV\data`가 아니라 **`dev_colorizer-data` 볼륨**이다.
- 컬러화는 SQLite WAL 모드다. 실행 중인 `colorizer.db` 한 파일만 복사하면 최신 트랜잭션이나 업로드 파일과의 일관성을 놓칠 수 있다. **컬러화를 정상 중지한 다음 볼륨 전체를 백업**하는 방법을 권장한다. 숨김 파일과 Linux 소유권·권한도 보존한다.
- 컬러화 컨테이너의 사용자 ID는 **10001:10001**이다. 새 볼륨에서 쓰기 권한이 없으면 DB/업로드 오류가 생길 수 있다. 아래 tar 방식은 소유권 보존을 고려한 방식이다.
- 컬러화 데이터에는 환경변수 누락 시 생성되는 `.session-secret`이 있을 수도 있으므로 일부 확장자만 골라 복사하지 않는다. 진행 중인 내보내기 작업 등 메모리에만 있는 작업은 이전되지 않으므로 먼저 완료시킨다.
- 과거에 Docker 없이 컬러화를 직접 실행했다면 `컬러화POC\user_data`에 별도 자료가 있을 수 있다. 현재 Docker 서비스의 저장소와 혼동하지 말고, 그런 사용 이력이 있을 때 추가 확인한다.

근거: `docker-compose.yml:8`, `docker-compose.yml:62`, `컬러화POC/app.py:45`, `컬러화POC/app.py:124`, `컬러화POC/persistence.py:34`, `컬러화POC/Dockerfile:19`.

### 4-3. `.env`에서 보존해야 할 항목

실제 값은 이 문서에 기록하지 않는다. 기존 `.env` 파일을 안전하게 전달한다.

| 환경변수 | 용도 / 이전 시 주의 |
| --- | --- |
| `MYSQL_ROOT_PASSWORD` | MySQL 및 백엔드 DB 접속 비밀번호. 우선 동일하게 보존한다. |
| `JWT_SECRET` | CELL 로그인 토큰 서명. 변경하면 기존 토큰이 무효화될 수 있다. |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | 관리자 초기화 설정. 이전 중 임의로 바꾸지 않는다. 실제 기존 계정은 DB 복원이 기준이다. |
| `COLORIZER_SECRET_KEY` | 컬러화 세션 서명. 변경 시 기존 로그인 상태 등이 유지되지 않을 수 있다. |
| `COLORIZER_USER_STORAGE_LIMIT_GB` | 선택 설정. 사용자 저장 용량 제한. Compose 기본값 10 |
| `COLORIZER_MEMORY_LIMIT`, `COLORIZER_CPU_LIMIT` | 선택 설정. Compose 기본값 2g / 1.5. 서버 사양에 따른 조정은 이전 성공 후 검토 |

새 서버에서 `.env.example`로 덮어쓰지 않는다. 전체 `docker compose config` 출력에는 비밀값이 펼쳐질 수 있으므로 공유하지 않는다. 이전과 비밀번호/서명키 교체 작업을 동시에 하지 않는 편이 원인 분리에 유리하다.

### 4-4. 현재 파일 규모 참고

아래는 조사 시점의 파일 수·크기이며 이전 당일에는 다시 측정한다. GiB는 1024³바이트 기준이다.

| 위치 | 파일 수 | 대략적인 크기 |
| --- | ---: | ---: |
| `data\originals` | 30 | 0.077 GiB |
| `data\crops` | 447 | 0.006 GiB |
| `data\thumbnails` | 356 | 0.005 GiB |
| `data\diagnostic_gt` | 11,960 | 1.323 GiB |
| `ai-server\weights` | 2 | 0.075 GiB |
| 컬러화 `/data` | 별도 집계하지 않음 | `du -sh` 표시 202M |
| MySQL `/var/lib/mysql` | 별도 집계하지 않음 | `du -sh` 표시 200M. SQL 덤프 크기와는 다름 |

실행 이미지·캐시·코드·기존 백업은 위 표에 포함하지 않았다. `docker image ls`에서 현재 AI 이미지는 약 9.28GB로 표시된다. Docker 명령마다 압축된 내용 크기와 디스크 점유 표시가 다를 수 있으므로 **실제 전송할 tar 파일의 크기**를 최종 기준으로 한다.

## 5. 전체 작업 순서

1. **기존 서버는 계속 운영한 채** 새 컴퓨터의 OS·Docker·네트워크를 준비한다.
2. 코드/설정/모델과 실행 이미지 등 변하지 않는 자료를 미리 복사한다. 현재 브랜치와 커밋도 기록한다.
3. 점검 시간을 정하고 사용자에게 잠시 사용 중단을 알린다. 진행 중인 업로드·AI 처리·컬러화 내보내기를 마친다.
4. 기존 서버의 **데이터를 쓰는 서비스들을 중지**하고, MySQL 덤프·컬러화 볼륨·`data`를 같은 중단 구간의 자료로 백업한다. MySQL은 덤프를 위해 이 단계에서 켜 둔다.
5. 새 서버에서 **MySQL 먼저 시작 → DB 복원 → 컬러화 볼륨 복원 → AI·백엔드·컬러화·프런트 순서로 실행**한다.
6. 새 서버를 외부에 연결하기 전에 기존 계정/파일/과제/채점/컬러화/HTTPS를 점검한다.
7. 공유기 포트포워딩 또는 DNS/학교 네트워크 경로를 새 서버로 전환한다.
8. 외부 접속과 재부팅 후 자동 실행을 확인하고, 기존 서버와 백업은 보존한다.

`--single-transaction` 덤프는 DB 스냅샷을 위한 옵션이지, 별도 이미지 파일과 컬러화 저장소까지 자동으로 같은 시점으로 만들어 주는 기능은 아니다. 따라서 마지막 데이터 백업은 쓰기를 멈춘 구간에서 함께 진행한다. DB 덤프 옵션과 PowerShell 출력 인코딩 주의의 출처는 [MySQL 공식 mysqldump 안내](https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html)다.

## 6. 작업자용 명령 예시: 기존 서버에서 백업

**여기부터는 실제 작업 시 사용할 예시다. 지금 이미 실행했다는 뜻이 아니다.** 중지 명령부터는 기존 사용자 접속이 끊기므로 점검 시간에만 진행한다. 각 명령이 실패하면 다음 단계로 넘어가지 않는다.

### 6-1. 백업 폴더 생성과 사전 기록

기존 서버 PowerShell에서 실행한다. `C:\CELL-MigrationBackup`은 프로젝트 밖의 새로운 백업 폴더 예시다. 이미 존재하면 덮어쓰지 말고 다른 새 경로를 정하고 아래 경로도 함께 바꾼다.

```powershell
Set-Location -LiteralPath 'C:\DEV'
New-Item -ItemType Directory -Path 'C:\CELL-MigrationBackup' -ErrorAction Stop
git status --short --branch
git rev-parse HEAD
docker compose -p dev ps
docker compose -p dev images
docker volume ls
```

조사 시점 브랜치는 `juhun`, 소스 커밋은 `94aeb1a5dd6b88ba2e701de5d3f107d4958bcd3b`다. 실제 이전일에 다시 기록한다. 소스 커밋과 실행 중인 이미지가 항상 일치한다고 가정하지 않는다.

### 6-2. 실행 이미지 저장 — 중단 전 미리 가능

현재 확인한 이미지 태그 기준이다. `compose images`의 실행 이미지와 태그가 같은지 이전 당일에도 확인한다. 달라졌다면 실제 실행 중인 이미지 기준으로 조정한다.

```powershell
docker image save --output C:\CELL-MigrationBackup\cell-images.tar dev-frontend:latest dev-backend:latest dev-ai-server:latest dev-colorizer:latest mysql:8.0 alpine:latest certbot/certbot:latest
if ($LASTEXITCODE -ne 0) { throw '이미지 저장 실패. 다음 단계로 진행하지 마세요.' }
```

애플리케이션 4개, MySQL, 백업 보조 도구, 인증서 발급 도구를 저장하는 예시다. `docker image save`는 **볼륨이나 호스트 데이터까지 백업하지 않는다.** 별도 DB/파일 백업은 반드시 이어서 한다. 저장·로드 방식의 출처: [Docker image save 공식 문서](https://docs.docker.com/reference/cli/docker/image/save/).

### 6-3. 점검 시간 시작 — 데이터 쓰기 중단

진행 중인 작업을 완료하고 별도로 실행 중인 개발용 백엔드 등 다른 쓰기 주체도 없는지 확인한다.

```powershell
docker compose -p dev stop frontend backend ai-server colorizer
if ($LASTEXITCODE -ne 0) { throw '서비스 중지 상태부터 확인하세요.' }
docker compose -p dev ps --all
```

이 단계에서 MySQL만 계속 실행한다. 다른 서비스들이 실제로 중지됐는지 확인한다. 서비스 중지 자체는 저장된 데이터를 삭제하지 않는다.

### 6-4. MySQL의 구조+데이터 덤프

비밀번호를 직접 타이핑하거나 문서에 넣지 않고 컨테이너의 기존 환경변수를 사용한다. 데이터 바이트를 PowerShell의 `>`로 내보내지 않고, 컨테이너 내부 파일로 만든 후 복사한다.

```powershell
docker compose -p dev exec -T mysql sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysqldump --user=root --single-transaction --quick --routines --events --triggers --hex-blob --no-tablespaces --set-gtid-purged=OFF --default-character-set=utf8mb4 --databases celldb --result-file=/tmp/celldb-migration.sql'
if ($LASTEXITCODE -ne 0) { throw 'DB 덤프 실패. 이 파일을 복원에 사용하지 마세요.' }

docker compose -p dev cp mysql:/tmp/celldb-migration.sql C:\CELL-MigrationBackup\celldb.sql
if ($LASTEXITCODE -ne 0) { throw 'DB 덤프 복사 실패.' }
Get-Item -LiteralPath 'C:\CELL-MigrationBackup\celldb.sql' | Select-Object Name,Length
```

이 SQL은 **`celldb`의 구조와 데이터**를 복원하기 위한 것이다. MySQL 시스템 계정·서버 설정 전체 덤프는 아니다. 현재 Compose의 애플리케이션 접속 계정은 root다. 별도 DB 사용자/권한을 수동으로 추가한 운영 이력이 있다면 그것은 추가로 백업·재설정해야 한다.

기존 `backup.sql`, `celldb_backup.sql`, `backups` 안의 파일은 과거 자료일 수 있으므로 최신 덤프를 대신해서 사용하지 않는다. 파일이 있다는 사실만으로 백업 성공을 판단하지 말고, 종료 코드와 새 서버 복원 결과까지 확인한다.

### 6-5. 중지된 컬러화 볼륨 전체 백업

`colorizer`가 중지된 상태에서 실행한다. 아래에서 **소스 볼륨은 읽기 전용**으로 연결한다. 현재 확인한 볼륨 이름은 `dev_colorizer-data`다.

```powershell
docker run --rm --mount type=volume,source=dev_colorizer-data,target=/source,readonly --mount type=bind,source=C:\CELL-MigrationBackup,target=/backup alpine:latest tar -czf /backup/colorizer-data.tar.gz -C /source .
if ($LASTEXITCODE -ne 0) { throw '컬러화 데이터 백업 실패.' }
```

이 방식은 DB, WAL 등 존재하는 부속 파일, 업로드, 숨김 파일을 함께 담는다. Windows 폴더로 내용을 풀어 재압축하지 말고 tar 파일 그대로 옮긴다. Linux 파일 소유권·권한을 유지하기 위해서다.

MySQL 원본 볼륨도 추가로 보관하려면 **MySQL까지 정상 종료한 뒤** 별도 콜드 백업을 만들 수 있다. 이것은 추가 안전장치이며, 여기서는 기기 간 복원 절차가 명확한 논리 SQL 덤프를 기본 경로로 사용한다. 실행 중인 MySQL 데이터 디렉터리 복사나 Docker Desktop 디스크 파일 전체 이동을 기본 이전 방법으로 사용하지 않는다.

### 6-6. `C:\DEV` 최종 복사

앞서 서비스가 중지된 상태에서 최종본을 복사한다.

- `C:\DEV`를 외장 저장장치/새 PC에 복사한다. 특히 `.env`, `data` 전체, 모델 2개, `ssl`, `letsencrypt`, 문서를 확인한다.
- `letsencrypt`의 `live` 아래 파일은 링크일 수 있다. 링크만 고립시키지 말고 `archive`, `accounts`, `renewal` 등을 포함한 전체 구조와 링크 대상을 보존한다. 즉시 HTTPS 실행에 필요한 `ssl\cert.pem`, `ssl\key.pem` 실파일은 별도로 반드시 확인한다.
- 미리 복사한 폴더가 있다면 최종 변경분까지 반영됐는지 확인한다. 이후 기존 서비스에서 새 쓰기가 생기면 해당 백업은 최신이 아니게 된다.
- DB 덤프·컬러화 tar·이미지 tar가 있는 `C:\CELL-MigrationBackup`도 함께 옮긴다.
- `Get-FileHash -Algorithm SHA256`으로 큰 백업 파일의 원본/복사본 해시를 비교하면 전송 누락·손상을 확인할 수 있다. 해시 일치는 복원 테스트를 대체하지 않는다.

백업 파일을 공개 저장소에 넣지 않는다. 전환까지 기존 서버를 다시 사용자에게 열어 새 데이터를 받으려면 마지막 쓰기 중단·최종 백업을 다시 해야 한다.

## 7. 작업자용 명령 예시: 새 Windows 서버에서 복원

**이 절은 새 컴퓨터 전용이다. 기존 서버에 실행하지 않는다.** 새 컴퓨터에서 다른 데이터가 이미 생겼다면 아래 초기 복원 절차를 그대로 진행하지 말고 먼저 상태를 확인한다.

### 7-1. 폴더와 Docker 준비

- 3절에 따라 Docker가 실행 가능해야 한다.
- 프로젝트 최종본은 `C:\DEV`, 백업 묶음은 `C:\CELL-MigrationBackup`에 배치한다.
- `.env`, SSL 두 파일, 모델 두 파일, 전체 `data`가 실제로 있는지 확인한다.
- 모든 Compose 명령에 **`-p dev`**를 사용한다. 폴더 이름이 달라져도 엉뚱한 새 볼륨 이름을 쓰는 것을 방지한다.

```powershell
Set-Location -LiteralPath 'C:\DEV'
docker version
docker compose version
Test-Path -LiteralPath '.env'
Test-Path -LiteralPath 'ssl\cert.pem'
Test-Path -LiteralPath 'ssl\key.pem'
Test-Path -LiteralPath 'ai-server\weights\yolov8_best.pt'
Test-Path -LiteralPath 'ai-server\weights\densenet201_best.pth'
docker compose -p dev config --quiet
```

`Test-Path`는 모두 `True`여야 한다. `config --quiet`는 설정 문법 검사일 뿐, DB나 애플리케이션 동작 검증은 아니다.

### 7-2. 기존 데이터가 없는 새 설치인지 확인하고 이미지 로드

아직 프로젝트 서비스를 한 번도 시작하지 않은 새 Docker 환경을 기준으로 한다.

```powershell
foreach ($migrationVolumeName in @('dev_mysql-data', 'dev_colorizer-data')) {
    docker volume inspect $migrationVolumeName *> $null
    if ($LASTEXITCODE -eq 0) {
        throw "이미 볼륨이 있습니다: $migrationVolumeName. 기존 데이터 여부를 확인한 후 진행하세요."
    }
}

docker image load --input C:\CELL-MigrationBackup\cell-images.tar
if ($LASTEXITCODE -ne 0) { throw '이미지 로드 실패.' }
```

정확한 실행 이미지를 옮긴 경로에서는 우선 `--no-build --pull never`로 실행한다. 새로 빌드하면 현재 소스, 기반 이미지, 패키지 해석 결과가 섞여 **이전과 동시에 버전 변경**이 될 수 있기 때문이다. 현재 MySQL은 8.0.46이므로 이전 단계에서 무심코 다른 버전으로 바꾸지 않는다.

이미지 백업 없이 진행하려면 빌드와 다운로드를 별도로 준비해야 한다. 그 경우에도 **DB/파일 복원 순서는 같으며**, 첫 시작 전에 MySQL 버전과 패키지 호환성을 점검한다. 단순히 처음부터 전체 `up --build`를 실행하는 순서는 권장하지 않는다.

### 7-3. MySQL만 먼저 시작하고 복원

```powershell
docker compose -p dev up -d --no-build --pull never mysql
if ($LASTEXITCODE -ne 0) { throw 'MySQL 시작 실패.' }
docker compose -p dev ps mysql
```

MySQL이 `healthy`가 될 때까지 기다리고 상태를 다시 확인한다. 아직 backend나 frontend는 시작하지 않는다.

```powershell
docker compose -p dev cp C:\CELL-MigrationBackup\celldb.sql mysql:/tmp/celldb-migration.sql
if ($LASTEXITCODE -ne 0) { throw '복원 SQL 복사 실패.' }

docker compose -p dev exec -T mysql sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysql --user=root --default-character-set=utf8mb4 < /tmp/celldb-migration.sql'
if ($LASTEXITCODE -ne 0) { throw 'DB 복원 실패. 애플리케이션을 시작하지 마세요.' }
```

SQL 안의 기존 테이블 재생성 구문은 데이터를 덮어쓸 수 있다. 그래서 이 절차는 **기존 데이터가 없는 새 대상 서버**에만 적용한다. 별도 스키마 변경 SQL을 임의로 실행할 필요는 없고, 우선 실제 운영 DB 구조와 데이터를 그대로 복원한다.

### 7-4. 컬러화 볼륨 복원 — 앱을 켜기 전

처음의 빈 설치 확인을 통과했고, 아직 새 서버의 컬러화 앱을 시작하지 않은 경우에만 진행한다. Compose가 MySQL 기동 과정에서 빈 컬러화 볼륨도 만들었을 수 있어 `volume create`는 존재 여부에 따라 생성하거나 기존 빈 볼륨을 사용한다.

```powershell
docker volume create dev_colorizer-data
if ($LASTEXITCODE -ne 0) { throw '컬러화 볼륨 준비 실패.' }

docker run --rm --mount type=volume,source=dev_colorizer-data,target=/restore --mount type=bind,source=C:\CELL-MigrationBackup,target=/backup,readonly alpine:latest tar -xzpf /backup/colorizer-data.tar.gz -C /restore
if ($LASTEXITCODE -ne 0) { throw '컬러화 볼륨 복원 실패.' }
```

tar의 권한과 소유권을 보존한다. 이 단계에서 임의로 새 계정을 만들거나 원본 없는 빈 SQLite DB로 서비스를 먼저 사용하지 않는다.

### 7-5. 애플리케이션 실행

```powershell
docker compose -p dev up -d --no-build --pull never ai-server colorizer
if ($LASTEXITCODE -ne 0) { throw 'AI/컬러화 시작 실패.' }
docker compose -p dev ps
```

AI와 컬러화가 `healthy`인지 확인한 뒤:

```powershell
docker compose -p dev up -d --no-build --pull never backend
if ($LASTEXITCODE -ne 0) { throw '백엔드 시작 실패.' }
docker compose -p dev logs --tail 100 backend
```

백엔드 로그에서 DB 구조 검증 실패, DB 접속 실패, 기동 예외가 없는지 확인한다. backend에는 현재 Compose healthcheck가 없으므로 `Up` 표시만으로 기동 완료를 단정하지 않는다. 로그를 공유해야 한다면 개인정보·토큰 등을 가린다.

백엔드가 기동한 다음:

```powershell
docker compose -p dev up -d --no-build --pull never frontend
if ($LASTEXITCODE -ne 0) { throw '프런트 시작 실패.' }
docker compose -p dev ps
```

이후 수정 코드를 반영하려면 해당 서비스의 재빌드를 별도로 진행한다. 우선은 기존 실행 버전 그대로 이전을 검증한다.

## 8. 도메인·인터넷 접속·HTTPS

### 8-1. 외부 접속 경로

| 상황 | 해야 할 일 |
| --- | --- |
| 같은 공유기/같은 공인 IP, 내부 서버 PC만 교체 | 새 PC의 내부 IP를 고정/예약하고 공유기의 TCP 80/443 포트포워딩 대상을 새 PC로 바꾼다. 기존 포워딩 규칙과 학교 네트워크 구조를 먼저 확인한다. |
| 공인 IP가 바뀜 | `cell.cbnu.ac.kr` DNS A 레코드 변경이 필요할 수 있다. AAAA 레코드가 있다면 IPv6 경로도 확인한다. 학교 도메인 담당자 권한이 필요할 수 있다. |
| 학교에서 서버에 직접 IP를 배정 | 배정 IP, 허용 포트, 방화벽/등록 정책을 담당자에게 확인한다. 일반 가정용 공유기 절차가 적용된다고 가정하지 않는다. |

Windows 방화벽/학교 방화벽에서도 **외부에서 접근해야 하는 80/443**을 허용해야 한다. 현재 구성의 MySQL 3306, backend 8080, AI 8001, 컬러화 8501을 인터넷에 추가로 노출할 필요는 없다. 방화벽 전체를 꺼서 해결하지 않는다.

### 8-2. 인증서는 PC가 아니라 도메인 기준

- 동일한 `cell.cbnu.ac.kr`을 계속 사용한다면, 유효한 기존 인증서와 개인키를 안전하게 옮겨 사용할 수 있다. PC가 바뀌었다는 이유만으로 즉시 새 발급이 필요한 것은 아니다.
- 조사한 **로컬 `ssl\cert.pem`의 만료일은 2026-12-02 16:34:34**다. 이는 현재 Windows 로컬 시간 표시이며, 외부 서버가 실제로 이 파일을 제공하는지 또는 전체 신뢰 체인이 정상인지까지 검증한 것은 아니다. 이전 당일 유효기간을 다시 확인한다.
- `ssl-renew.ps1`은 `C:\DEV` 경로를 사용한다. 새 경로로 바꾸면 경로 수정이 필요하다. ACME 연락처 설정도 새 담당자 기준으로 확인하되 이 문서에는 실제 연락처를 기록하지 않는다.
- 스크립트는 frontend를 잠시 중지하고 certbot standalone 방식으로 **80포트**를 사용한다. 갱신 시 도메인의 실제 요청이 새 서버의 80포트까지 와야 한다.
- 조사 범위에서 `ssl-renew.ps1`을 호출하는 자동 갱신 예약 작업은 확인하지 못했다. **파일만 옮겼다고 자동 갱신이 되는 것으로 보지 말고**, 새 서버의 작업 스케줄러, 실행 계정·권한, Docker 사용 가능 상태, 로그와 실제 실행 결과를 점검한다.
- 현재 Nginx는 HTTP→HTTPS 리다이렉트와 HSTS를 사용한다. 인증서 문제를 HTTP 접속이나 브라우저 경고 무시로 해결하는 운영 방식은 피한다.

근거: `frontend/nginx.conf:1`, `frontend/nginx.conf:12`, `frontend/nginx.conf:17`, `ssl-renew.ps1:4`, `ssl-renew.ps1:27`, `ssl-renew.ps1:45`. 인증서 기간은 공개 인증서 파일의 메타데이터만 읽었으며 개인키 값은 출력하지 않았다.

### 8-3. 도메인 전환 전 새 서버의 HTTPS 확인

새 서버 자신에서 기존 도메인 이름과 인증서를 유지한 채 로컬 Nginx에 접속하는 예시:

```powershell
curl.exe --resolve cell.cbnu.ac.kr:443:127.0.0.1 -I https://cell.cbnu.ac.kr/
```

인증서 검증을 끄는 `-k` 옵션은 넣지 않는다. 이 명령의 성공은 화면 첫 응답과 해당 TLS 연결의 점검일 뿐, 외부 포트포워딩이나 전체 API 성공을 의미하지 않는다.

브라우저에서 전환 전 새 서버의 화면을 점검하려면 점검용 PC의 hosts에 도메인을 새 서버 IP로 임시 매핑하는 방법이 있다. 이것은 해당 PC에만 적용하고 테스트 후 원복한다. 최종적으로는 일반 DNS와 외부 네트워크에서 다시 확인해야 한다. 도메인을 바꾸면 인증서·Nginx·백엔드 접근 허용 설정 등도 추가 점검해야 한다.

## 9. 재부팅 후 자동 실행과 GPU

### 9-1. 자동 실행

현재 서비스에는 `restart: unless-stopped`가 지정되어 있다. 다만 이것은 **Docker 엔진이 실행된 뒤 컨테이너를 재시작하는 정책**이다. Windows가 켜졌다는 이유만으로 Docker Desktop까지 로그인 없이 준비된다는 뜻이 아니다. 이전 도중 수동으로 중지한 서비스는 이후 `up -d`로 다시 시작해야 한다.

- Windows에서는 Docker Desktop 시작 설정과 실행 사용자 세션을 확인한다. 로그인 시 자동 실행만 해 두면 로그인 전에는 사이트가 안 열릴 수 있다.
- 무인 상시 운영이 필요하면 해당 요구를 먼저 정하고, Linux Docker 서비스 등 로그인에 의존하지 않는 운영 구성을 검토한다. 보안 검토 없이 Windows 자동 로그인을 켜는 것을 기본 해법으로 삼지 않는다.
- Windows 업데이트/전원 복구/절전 정책과 인증서 예약 작업도 함께 확인한다.
- 정상 이전 후 계획된 시간에 **새 서버만** 재부팅해 외부 접속까지 다시 되는지 확인해야 자동 실행 검증이 완료된다.

### 9-2. 새 서버에 GPU가 있어도 자동으로 쓰는 것은 아님

AI 코드는 CUDA 사용 가능 여부에 따라 GPU/CPU를 선택하지만, 현재 Compose에는 AI 서비스용 GPU 전달 설정이 없다. GPU 장착만으로 Docker 내부에서 바로 활용된다고 볼 수 없다.

우선 기존과 동일한 실행 구성으로 데이터 이전을 확인한 뒤, 별도 작업으로 GPU 모델·VRAM, 드라이버, Docker GPU 전달, PyTorch/CUDA 호환성을 점검한다. Windows Docker의 NVIDIA GPU 전달에는 WSL 2 백엔드와 호환 드라이버 등이 필요하다. [Docker 공식 GPU 안내](https://docs.docker.com/desktop/features/gpu/)

근거: `ai-server/app/services/model_loader.py:28`, `docker-compose.yml:16`. 새 서버의 GPU 사용 가능 여부나 성능 향상 배율은 현재 자료만으로 확정할 수 없다.

## 10. 이전 성공 판정 체크리스트

컨테이너가 `Up`인 것만 보고 완료 처리하지 않는다.

- [ ] 최종 백업과 복원에 사용한 시점·소스 커밋·이미지 식별 정보가 기록돼 있다.
- [ ] MySQL 덤프와 컬러화 볼륨 tar 복원 명령이 오류 없이 끝났다.
- [ ] DB 테이블별 레코드 수가 최종 백업 시점의 기존 서버와 일치한다. 개인정보 값 대신 집계값으로 비교한다.
- [ ] `data`의 파일 수·크기와 모델/백업 파일 해시를 비교했다. 파일 수가 같다는 것만으로 내용 일치가 보장되는 것은 아니므로 중요한 파일은 해시도 비교한다.
- [ ] MySQL, AI, 컬러화가 healthy이고 backend 시작 로그에 DB/스키마 오류가 없다.
- [ ] 기존 CELL 계정으로 로그인되고 권한별 화면이 맞게 보인다.
- [ ] 기존 과제·학생 답안·교수 정답/채점 결과·완료 상태가 남아 있다.
- [ ] 기존 업로드 원본, crop, 썸네일이 실제로 열린다.
- [ ] 진단용 데이터와 관련 화면이 기존과 같이 조회된다.
- [ ] AI 모델이 로딩되고 점검용 입력 처리가 된다. 운영 데이터에 영향을 주지 않는 테스트 자료로 확인한다.
- [ ] 기존 컬러화 계정, 업로드 DICOM, 저장한 색상·ROI 정보 등이 유지된다.
- [ ] 컬러화 업로드/저장이 가능한 파일 권한 상태다. 쓰기 테스트는 식별 가능한 점검용 자료로 진행한다.
- [ ] 기존 도메인으로 인증서 경고 없이 접속된다. 별도 네트워크에서도 확인했다.
- [ ] DNS/포트포워딩/학교 방화벽 변경 후 기존 서버가 아닌 새 서버로 연결되는지 확인했다.
- [ ] 인증서 갱신 경로와 실행 방법, 담당자, 예약 작업을 확인했다.
- [ ] 새 서버 재부팅 후 Docker와 웹 서비스의 자동 복구를 확인했다.
- [ ] 기존 서버와 백업을 당장 지우지 않고 복구용으로 보존했다.

## 11. 하지 말아야 할 것과 되돌리는 방법

- 이전 도중 **`docker compose down -v`**, `docker volume rm`, 볼륨 prune, Docker Desktop 공장 초기화, DB 삭제 명령을 실행하지 않는다. 영구 데이터가 사라질 수 있다.
- Windows 재설치/기존 PC 초기화/폐기는 새 서버의 데이터·기능·백업 복원 검증이 끝난 뒤에 한다. 기존 디스크는 복구 수단으로 한동안 보존한다.
- 기존 서버와 새 서버를 각각 독립된 DB로 동시에 사용자에게 열어 두면 답안과 업로드가 양쪽으로 갈라질 수 있다. 전환 시 쓰기를 받는 운영 서버는 하나로 정한다.
- 새 서버에서 아직 신규 데이터를 받지 않았다면 기존 서버를 다시 시작하고 접속 경로를 돌려 복구할 수 있다. 이때 새 서버는 사용자에게 닫아 두고 기존 서버도 순서대로 기동한다.
- **새 서버에서 이미 답안/업로드/채점이 추가됐다면**, 기존 서버 DB는 과거 상태다. 그냥 경로만 되돌리면 새 기록이 사라진 것처럼 보인다. 새 쓰기를 중지하고 신규 데이터의 역이전/동기화 방안을 먼저 결정한다.
- 원본 서버·백업을 보존해도 복원 검증을 하지 않았다면 안전한 이전이라고 볼 수 없다.

## 12. 실제 이전 전에 알려 주면 좋은 정보

| 확인 질문 | 필요한 이유 |
| --- | --- |
| 새 컴퓨터의 정확한 OS/에디션은? OS가 설치돼 있는가? | Windows 11 / Windows Server / Ubuntu에 따라 설치 및 자동 실행 절차가 달라진다. |
| CPU, RAM, SSD 여유 공간, GPU 모델은? | 현재 이미지 아키텍처 호환, 저장 공간, 메모리와 GPU 설정 판단 |
| 기존 서버와 같은 장소·같은 LAN/공유기에 연결하는가? | 포트포워딩 변경인지 DNS/학교 네트워크 변경인지 구분 |
| `cell.cbnu.ac.kr`을 그대로 사용할 것인가? 도메인/방화벽 담당자는 누구인가? | 외부 접속 및 HTTPS 전환 권한 확보 |
| 잠시 접속을 중지해도 되는 시간은 언제인가? | 마지막 DB와 파일을 같은 시점으로 백업하고 전환하기 위해 필요 |

**한 줄 준비 목록: 새 서버의 OS·Docker·네트워크 준비 + `C:\DEV` 최종본 + 최신 MySQL 덤프 + 컬러화 볼륨 전체 백업 + 현재 실행 이미지 + HTTPS/자동 실행 점검.**
