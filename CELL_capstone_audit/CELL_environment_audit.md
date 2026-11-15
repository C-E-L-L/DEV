# CELL 개발·운영 환경 조사 보고서

## 1. 조사 범위와 기준

- 조사일: **2026-11-12, 21:47~22:03 KST**. 이 범위는 조사와 문서 작성 시간이며, 서비스 가동 시간과 구분한다.
- 작업 경로: C:\Users\<사용자>\OneDrive\Desktop\DEV\juhun. 이하 이 경로를 **REPO**로 표시한다.
- Git: juhun 브랜치, HEAD ff8bb6d75ebe41e304c21a9301f1fbdd8e4471eb. 시작부터 여러 소스·문서의 수정 사항과 미추적 CELL_capstone_audit 폴더가 있었다. HEAD를 현재 실행 이미지의 소스 버전으로 간주하지 않았다.
- 지침 확인: 작업 경로와 상위 경로의 AGENTS.md, 저장소 내 AGENTS.md를 확인했으며 발견되지 않았다. README.md와 PROJECT_STRUCTURE_AND_FLOW.md의 구조·실행 지침도 읽었다. 오래된 문서 내용보다 실제 코드·실행 메타데이터를 우선했다.
- 포함: frontend, backend, ai-server, 공용 data 경로와 모델, Compose/Dockerfile, 인증서 갱신 스크립트. **컬러화POC는 별도 앱이지만 실제 같은 Compose와 Nginx가 제공하므로 연결되는 운영 환경으로 포함**했다. ai-server/tools의 진단 데이터 준비·검토 도구도 포함했다.
- 외부 경로: 실행 컨테이너의 Compose 라벨이 가리킨 **REPO\..\_migration\compose.restore.yml**만 따라가 읽었다. 문서/스크립트가 참조하는 C:\DEV는 존재 여부만 확인했다. 전체 디스크 탐색은 하지 않았다.
- 제외: 연결 근거가 없는 단독 HTML·기타 실험 자료, 실제 영상·사용자 데이터의 내용, 백업 DB 내용. load_test는 부하 시험 도구의 존재만 확인했고 실행하지 않았다.
- **수행한 쓰기는 이 보고서 작성뿐이다.** 설치·업데이트·의존성 수정·환경변수 변경·DB 조회/변경·컨테이너 생성/재빌드·서비스 재시작·모델 로딩·추론·학습·빌드를 수행하지 않았다.
- 기존 컨테이너에 짧은 버전/메타데이터 조회 프로세스만 실행했다. Python 조회는 -B로 바이트코드 생성을 억제하고, 프로젝트 모듈·torch·cv2를 새로 import하지 않았다. main.py와 config.py는 import 시 모델 로딩/디렉터리 생성 효과가 있어 import하지 않았다.
- 비밀번호·토큰·인증서 내용·DB 접속 문자열·업무 데이터는 보고하지 않는다. 환경설정은 변수명과 값 존재 여부만 수록한다. 사용자 경로는 익명화했다.

### 1.1 확인 상태의 의미

| 표시 | 의미 |
|---|---|
| **실측** | 프로세스, 컨테이너, 설치 메타데이터, 파일/체크섬에서 직접 확인 |
| **선언** | 소스·Dockerfile·의존성 파일·문서에 적힌 값. 실행/빌드 사실까지 입증하지 않음 |
| **분석/위험** | 확인한 코드와 구성에서 도출한 영향. 장애 재현과 구분 |
| **확인 필요** | 정보 부족 또는 이번 원칙상 실행하지 않은 검증 |

### 1.2 주요 결론

1. 이미 **Windows 11 → Docker Desktop/WSL 2 → Linux amd64 컨테이너 5개**로 운영된다. Docker 신규 도입이 필요한 상태가 아니다.
2. **Java 17·Spring Boot 3.3.5는 선언과 실행 산출물이 일치**한다. AI requirements의 최소 버전 조건도 설치 메타데이터상 충족하며, 두 Python 서비스의 pip check는 모두 성공했다.
3. AI의 **opencv-python과 opencv-python-headless 중복 설치**가 확인됐다. 동일 버전이지만 cv2 경로 51개를 공유한다. 공식 배포 지침상 정리 대상이며, 실제 추론 오류가 발생했다는 증거는 이번 조사에서 확인하지 않았다.
4. YOLO 체크포인트 내부 version은 **8.3.161**, 현재 설치 Ultralytics는 **8.4.202**다. 버전 차이는 사실이지만 로딩 실패로 이어진다고 단정할 근거는 없다.
5. 재현성의 가장 큰 공백은 **미고정 AI 의존성·가변 이미지 태그**, **모델/클래스/전처리와 코드의 결합 이력 부족**, **저장소 밖 배포 덮어쓰기와 파일/볼륨·기동 절차 의존**이다.
6. 이번 관찰에서 **P0 운영 오류를 확정하지 못했다**. 모델 공동 로딩과 health 응답은 확인했지만 실제 탐지·분류 결과의 정확성 및 재설치 호환성은 시험하지 않았다.

## 2. 실제 구성과 실행 방법

### 2.1 현재 연결 구조

~~~mermaid
flowchart LR
    Browser[브라우저] --> Edge[frontend 컨테이너: Nginx + React 정적 파일]
    Edge -->|/api 및 /data| Backend[Spring Boot :8080]
    Edge -->|/colorizer| Colorizer[Flask/Gunicorn :8501]
    Backend --> MySQL[MySQL :3306]
    Backend -->|multipart /api/analyze| AI[FastAPI :8001]
    AI --> YOLO[YOLO 탐지]
    YOLO --> DenseNet[DenseNet-201 분류]
    Backend --- Shared[공유 /data]
    AI --- Shared
    AI --- Weights[/app/weights]
    Colorizer --- ColorData[별도 영속 볼륨]
~~~

근거: docker-compose.yml:1–87, frontend/nginx.conf:24–59, backend/src/main/java/com/cell/platform/service/AiClientService.java:24–53, ai-server/app/services/pipeline.py:10–25 및 실행 컨테이너의 Compose 라벨·마운트·포트 조회 [R1].

### 2.2 구성 요소·진입점·독립성

| 구성 요소 | 코드/진입점·실행 설정 | 실제 실행 상태 | 연결 방식·독립 실행/배포 조건 |
|---|---|---|---|
| React 프런트 | frontend/src/main.jsx:1–10 → App.jsx. package.json:6–10의 vite/dev/build/preview. Dockerfile:1–11 | dev-frontend-1 running. 운영 컨테이너는 Node 개발 서버가 아니라 Nginx | /api 상대 경로로 호출. 독립 빌드 가능하나 API 프록시 또는 별도 주소 설정 필요. 현재 Nginx와 한 배포 이미지 |
| Nginx | frontend/nginx.conf:1–61 | 같은 frontend 컨테이너의 /usr/sbin/nginx. 호스트 80/443 게시 | React 정적 서빙, 백엔드 API/파일 및 컬러화 프록시. 인증서 파일 필요. 별도 서비스 분리는 가능하지만 현재 필요 근거 없음 |
| Spring Boot | backend/.../CellApplication.java:6–10. Dockerfile:1–10 | dev-backend-1 running. java -jar app.jar; /opt/java/openjdk/bin/java | MySQL·AI HTTP·공유 파일 경로 필요. 별도 이미지로 배포 가능. 현재 호스트에 8080을 게시하지 않음 |
| MySQL | docker-compose.yml:2–14 + 외부 compose.restore.yml:2–3 | dev-mysql-1 running/healthy. PID 1 실행 파일 /usr/sbin/mysqld | 백엔드와 내부 네트워크 연결. 독립 서비스/영속 볼륨. 호스트에 DB 포트 게시하지 않음 |
| FastAPI AI | ai-server/main.py:6,16–26. Dockerfile:12–13 | dev-ai-server-1 running/healthy. uvicorn main:app, 내부 8001 | YOLO→DenseNet을 한 Python 프로세스에서 실행. DB 직접 연결 없음. weights와 /data 공유 규약을 맞추면 독립 배포 가능 |
| YOLO | model_loader.py:31–34, detector.py:20–55 | 기존 startup 로그에 두 모델 CPU 로딩 완료, /health의 models_loaded=true | 독립 서버가 아니라 AI 내부 단계. crop을 파일로 만들고 DenseNet에 전달 |
| DenseNet | model_loader.py:36–48, classifier.py:20–49 | 위와 동일. 새 추론은 미수행 | 독립 서버가 아닌 같은 AI 프로세스. 탐지·분류를 분리해야 할 충돌 증거 없음 |
| DS–MAP 관련 처리 | backend/.../CalibrationService.java:22–77, controller/CalibrationController.java:7–13, PseudoLabelService.java:11–35 | backend JAR에 관련 클래스 존재. 해당 API를 호출하거나 계산을 실행하지 않음 | Java에서 확정 정답/최종 답안으로 종·클래스 구성별 혼동행렬을 제공. DS–MAP 완성 알고리즘은 확인되지 않으며 정규화 스캐폴드만 존재 |
| 재학습 | ai-server/app/routers/retrain_router.py:26–44 | 라우터는 main.py:22에 등록. 학습 프로세스/별도 worker 서비스는 조사 범위에서 발견되지 않음 | 실제 학습은 TODO. 데이터 수집·검증 후 READY 반환 설계. 현재 학습 환경/산출물 계약을 검증할 수 없음 |
| 진단 데이터 도구 | ai-server/tools/prepare_diagnostic_gt_dataset.py, build_diagnostic_gt_review.py | 실행하지 않음 | 이미지/YOLO 라벨을 crop·manifest·검토 이미지로 가공. 학습 worker가 아님. CELL이 소비하는 데이터의 준비 도구 |
| DICOM 컬러화 | 컬러화POC/app.py:32–46,109,1808–1810; Dockerfile:23 | dev-colorizer-1 running/healthy. Gunicorn app:app, 1 worker/4 threads | Nginx /colorizer로 연결. Flask·SQLite·자체 파일 볼륨을 사용하는 별도 앱. CELL MySQL/AI 환경과 분리되어 있음 |

### 2.3 실제 배포 설정과 문서상 실행법의 차이

- 실행 라벨상 프로젝트 이름은 **dev**이고, 설정 파일은 **docker-compose.yml + ../_migration/compose.restore.yml** 두 개다 [R1]. 후자는 저장소 밖에 있으며 MySQL 이미지를 8.0.46으로 덮어쓴다.
- 서버 실행 가이드.txt:7–10은 C:\DEV에서 기본 Compose를 실행하는 예시다. 현재 C:\DEV는 없고 실제 작업 경로·프로젝트 이름·설정 파일 조합과 다르다. 해당 문서를 그대로 따르는 것이 현재 배포 재현을 보장하지 않는다.
- 백엔드 컨테이너 실행 인수는 java/-jar/app.jar이고 추가 프로필 인수는 없다. JAR 내부 application.yml도 dev를 선언한다 [R5]. 실행 환경에는 SPRING_PROFILES_ACTIVE가 없으며 Compose가 일부 설정을 덮어쓴다. **현재 운영을 prod 프로필이라고 단정할 수 없다.**
- 소스 application-dev.yml:15는 ddl-auto update를 선언하지만 Compose:37이 validate로 덮어쓰도록 되어 있다. 과거 PROJECT_STRUCTURE_AND_FLOW.md:136–139의 create 설명을 현 운영 사실로 적용하면 안 된다. 실효 설정 전체를 Spring 관리 API로 조회하지는 않았다.
- AI 개발 문서 ai-server/README.md:10–20에는 venv와 uvicorn --reload가 있지만, **현 운영은 컨테이너의 /usr/local/bin/python3.12와 reload 없는 Uvicorn**이다. 문서에 있는 venv가 실제 사용된다고 볼 수 없다.
- 직접 개발 시 선언된 방식은 프런트 npm run dev(:5173), 백엔드 Gradle Wrapper bootRun, AI Uvicorn이다. 이번에는 이 명령들을 실행하지 않았다. 호스트 PATH에는 Python의 WindowsApps 실행 별칭만 발견됐고 Java/Node/npm/yarn/pnpm은 발견되지 않았다. 별칭을 실행하거나 전역 도구 설치 여부를 디스크 전체에서 추적하지 않았다.

### 2.4 소스와 실행 산출물의 동일성 범위

- AI의 main.py, requirements.txt, app/config.py, services의 model_loader/detector/classifier/pipeline, routers/retrain_router.py **8개 파일은 저장소와 실행 컨테이너의 SHA-256이 모두 일치**했다 [R8].
- frontend/nginx.conf와 실행 이미지의 /etc/nginx/conf.d/default.conf도 SHA-256 0016268b94108dc4c3af31cb48cb29cbc3071fbfed3408c60844b60d68a600f4로 일치했다 [R8].
- 백엔드 JAR의 Boot/JDK 메타데이터와 내장 라이브러리 버전은 확인했지만 현재 수정 중인 Java 소스 전체와 JAR의 빌드 일치는 입증하지 못했다.
- 현재 React 소스·lock 파일과 정적 번들의 전체 빌드 일치도 입증하지 못했다. 아래 프런트 버전은 lock 파일과 번들에서 확인한 범위를 구분한다.
- 네 앱 이미지에는 OCI revision 라벨이 발견되지 않았다 [R9]. 이미지가 어느 커밋/dirty 작업 트리에서 빌드되었는지는 확인 필요다.

## 3. 구성 요소별 버전 비교

### 3.1 OS·운영 도구·백엔드

| 구성 요소 | 코드에 선언된 버전 | 실제 실행·설치 버전 | 확인 근거 | 확인 상태 |
|---|---|---|---|---|
| Windows 호스트 | 프로젝트가 고정하지 않음 | Windows 11 Home, 10.0.26300, x64 | Get-CimInstance Win32_OperatingSystem [R2] | 실측 |
| CPU/아키텍처 | 이미지 태그에는 platform 고정 없음 | i5-13500, 14 cores/20 logical; 현 이미지 linux/amd64 | Win32_Processor 및 docker image inspect [R2,R9] | 실측 |
| 컨테이너 커널 | 미고정 | Linux 6.18.58.1-microsoft-standard-WSL2 | Docker Server 정보, wsl --list --verbose [R2] | 실측 |
| 컨테이너 OS | Python slim / Java·Nginx alpine 태그 | AI Debian 13.7(trixie); backend/frontend Alpine 3.24.4 | 각 컨테이너 /etc/os-release [R3] | 실측. 컬러화/MySQL 배포판 세부 버전은 미조회 |
| Docker Desktop | 문서에 설치 요구, 정확 버전 고정 없음 | 4.98.0.245422 | 실행 경로의 Docker Desktop.exe VersionInfo [R2] | 실측 |
| Docker Engine/CLI | 미고정 | Server/Client 모두 29.9.2 | docker version의 선별 필드 [R2] | 실측 |
| Docker Compose | Compose 구성 존재, 도구 버전 미고정 | v5.6.1 | docker compose version [R2] | 실측 |
| Java/JDK | toolchain 17; 빌드 gradle:8.13-jdk17, 실행 eclipse-temurin:17-jre-alpine | 실행 JRE Temurin 17.0.21+9; JAR Build-Jdk-Spec 17 | backend/build.gradle:10–13, Dockerfile:1–10; java -version, JAR manifest [R5] | major 일치. 실제 빌더 JDK patch는 확인 필요 |
| Spring Boot | 3.3.5 | JAR manifest와 spring-boot JAR 모두 3.3.5 | build.gradle:3; JAR manifest/목록 [R5] | 일치 |
| Gradle | Wrapper와 빌드 이미지 모두 8.13 | 실행 JRE 이미지에는 gradle/javac 명령 미발견. 과거 빌드 도구 실측 불가 | gradle/wrapper/gradle-wrapper.properties:3, Dockerfile:1,4; command -v [R5] | 선언 확인, 과거 빌더 버전은 확인 필요 |
| Gradle Wrapper | gradlew·gradlew.bat·gradle-wrapper.jar 존재, distribution 8.13 | 파일 존재 확인. 실행하지 않음 | backend/gradle/wrapper 및 properties:1–7 | 선언/파일 확인 |
| Spring dependency-management 플러그인 | 1.1.6 | 빌드 플러그인이므로 실행 JAR에 설치 버전 개념 없음 | backend/build.gradle:4 | 선언 |
| Spring Framework | 직접 버전 없이 Boot 관리 | spring-core 6.1.14 | build.gradle:21–25, JAR 라이브러리 [R5] | 실행 산출물 실측 |
| Spring Security | 직접 버전 없이 Boot 관리 | spring-security-core 6.3.4 | build.gradle:24, JAR 라이브러리 [R5] | 실행 산출물 실측 |
| MySQL JDBC | 직접 버전 없이 Boot 관리 | mysql-connector-j 8.3.0 | build.gradle:33, JAR 라이브러리 [R5] | 실행 산출물 실측 |
| H2 | 직접 버전 없이 Boot 관리 | 2.2.224 | build.gradle:32, JAR 라이브러리 [R5] | 설치 산출물. 현 운영 DB가 H2라는 뜻 아님 |
| JJWT | api/impl/jackson 모두 0.12.6 | 세 JAR 모두 0.12.6 | build.gradle:28–30, JAR 목록 [R5] | 일치 |
| spring-dotenv | 4.0.0 | 4.0.0 | build.gradle:26, JAR 목록 [R5] | 일치 |
| Nginx | nginx:alpine, patch/digest 미고정 | 1.31.8 | frontend/Dockerfile:8, nginx -v [R3] | 실측. 가변 태그 |
| MySQL 서버 바이너리 | 루트 mysql:8.0; 외부 override mysql:8.0.46 | mysqld 8.0.46; PID 1도 /usr/sbin/mysqld | Compose:3, 외부 override:3; mysqld --version/readlink [R3] | 바이너리 실측. SQL SELECT VERSION()은 미수행 |

백엔드 의존성 해석:

- Java/Gradle 프로젝트이며 Maven pom.xml/mvnw는 조사 범위에서 발견되지 않았다.
- 버전 없는 Spring starter, JDBC, H2, Lombok 등은 **Boot 플러그인 + dependency-management 관리 아래의 선언**이다. 단순 버전 누락 오류로 분류하지 않는다. 실제 해결된 주요 JAR 버전은 위 표와 같다.
- build.gradle:8의 0.0.1-SNAPSHOT은 **이 애플리케이션 자체 버전**이다. 외부 SNAPSHOT 의존성이 발견됐다는 뜻이 아니다.
- 해당 build.gradle과 Gradle 설정 검색에서 외부 dependency의 +/latest/SNAPSHOT, dependencyLocking, resolutionStrategy/force/strictly/failOnVersionConflict 및 dependency verification 설정은 발견되지 않았다. gradle.lockfile, verification-metadata.xml도 미발견이다.
- Wrapper properties에는 distributionSha256Sum이 없고 Dockerfile:4는 Wrapper 대신 이미지의 gradle 명령을 실행한다. 버전 숫자는 둘 다 8.13이지만 공급·검증 경로가 두 개다. 빌드 없이 전이 의존성 전체의 잠금 상태/충돌 해결 결과를 추가 검증하지 않았다.

### 3.2 프런트엔드

| 구성 요소 | 코드에 선언된 버전 | 실제 실행·설치 버전 | 확인 근거 | 확인 상태 |
|---|---|---|---|---|
| Node.js | node:20-alpine 빌드 단계 | 운영 Nginx 이미지와 현재 호스트 PATH에서 node 명령 미발견 | frontend/Dockerfile:1–8, command -v/Get-Command [R3] | 빌더 실제 patch 확인 필요 |
| 패키지 매니저 | Dockerfile은 npm ci / npm run build | 빌더 npm 버전 확인 불가. host/npm, runtime/npm 미발견 | Dockerfile:4,6 [R3] | npm 사용 선언, 정확 버전 확인 필요 |
| React | ^18.3.0 | lock 18.3.1; 현재 정적 JS에서 18.3.1 문자열 확인 | package.json:15; package-lock.json:1768 이하; 번들 버전 문자열 조회 [R6] | lock 실측 및 번들 정황. 전체 빌드 재현 검증 아님 |
| react-dom | ^18.3.0 | lock 18.3.1 | package.json:16; lock:1781 이하 [R6] | lock 확인. runtime package 메타데이터 없음 |
| react-router-dom | ^6.26.0 | lock 6.30.3 | package.json:17; lock:1820 이하 [R6] | lock 확인, 실제 번들 버전 별도 확인 필요 |
| Axios | ^1.7.0 | lock 1.13.5 | package.json:13; lock:1191 이하 [R6] | lock 확인 |
| Vite | ^5.4.0 | lock 5.4.21 | package.json:21; lock:1942 이하 [R6] | lock 확인, 빌더 설치 버전 미실측 |
| @vitejs/plugin-react | ^4.3.0 | lock 4.7.0 | package.json:20; lock:1164 이하 [R6] | lock 확인 |
| Pretendard | 1.3.9 | lock 1.3.9 | package.json:14; lock:1756 이하 [R6] | lock 일치 |
| 의존성 잠금 | package-lock.json 존재 | lockfileVersion 3 | lock:4 및 JSON 표적 파싱 [R6] | 실측 |

- package.json에는 engines, packageManager, Volta 설정이 없다. .nvmrc/.node-version은 조사 범위에서 미발견이다.
- yarn.lock/pnpm-lock 및 혼용 실행 설정은 미발견이다. **혼용 증거는 없으며 npm 단일 경로로 보인다.**
- frontend/node_modules와 dist를 로컬 실행 환경의 증거로 사용할 수 없었다. node_modules는 해당 작업 경로에 없다. Nginx 최종 이미지에는 Node/npm 빌드 도구가 포함되어 있지 않다.
- ^ 범위와 lock의 높은 patch/minor는 조건 위반이 아니다. npm ci를 사용하는 현 Dockerfile은 lock을 활용한다. lock 변경이나 npm install 문서 경로를 사용할 때의 변화는 별도 관리해야 한다.

### 3.3 AI 추론 환경

실행 프로세스의 /proc/1/exe는 /usr/local/bin/python3.12이고 Uvicorn 스크립트 shebang도 같은 인터프리터다. 조회한 sys.executable은 /usr/local/bin/python이다. sys.prefix와 sys.base_prefix가 모두 /usr/local이어서 **venv가 아닌 컨테이너 전용 Python 설치**다. Conda 사용 증거는 없다 [R4].

| 구성 요소 | 코드에 선언된 버전 | 실제 실행·설치 버전 | 확인 근거 | 확인 상태 |
|---|---|---|---|---|
| Python | python:3.12-slim | 3.12.16 | ai-server/Dockerfile:1; sys.version/프로세스 경로 [R4] | minor 일치, patch 미고정 |
| FastAPI | >=0.115.0 | 0.162.0 | requirements.txt:1; importlib.metadata [R4] | 최소 조건 충족 |
| Uvicorn | >=0.30.0 | 0.54.0 | requirements:2; metadata/shebang [R4] | 최소 조건 충족 |
| python-multipart | >=0.0.9 | 0.0.33 | requirements:3; metadata [R4] | 최소 조건 충족 |
| Ultralytics | >=8.2.0 | 8.4.202 | requirements:4; metadata [R4] | 최소 조건 충족. checkpoint metadata와는 버전 다름 |
| PyTorch | >=2.6.0 | 배포 metadata 2.15.0; torch/version.py는 2.15.0+cu132, CUDA build 13.2 | requirements:5; metadata와 version.py 정적 읽기 [R4] | 최소 조건 충족. 두 버전 표기는 배포/빌드 식별 차이 |
| torchvision | >=0.21.0 | 0.29.2 | requirements:6; metadata [R4] | 최소 조건 충족 |
| OpenCV headless | >=4.10.0 | opencv-python-headless 5.0.0.93 | requirements:7; metadata [R4] | 조건 충족, 중복 provider 문제 별도 |
| OpenCV 일반판 | CELL requirements에 직접 선언 없음 | opencv-python 5.0.0.93 | Ultralytics requires metadata 및 설치 metadata [R4,R10] | 추가 전이 의존성 실측 |
| NumPy | CELL requirements에 직접 선언 없음 | 2.5.4 | 설치 metadata [R4] | 전이 의존성, 고정 없음 |
| Pillow | >=10.4.0 | 13.0.0 | requirements:8; metadata [R4] | 최소 조건 충족 |
| HTTPX | >=0.27.0 | 0.28.1 | requirements:9; metadata [R4] | 최소 조건 충족 |
| Pydantic | 직접 선언 없음 | 2.14.2 | metadata [R4] | 전이 의존성 |
| ultralytics-thop | 직접 선언 없음 | 2.2.5 | metadata [R4] | 전이 의존성 |
| pip | 빌드 시 --upgrade pip, 정확 버전 없음 | 26.3 | Dockerfile:6; metadata [R4] | 실측, 빌드 재현성 위험 |

- requirements.txt만 있고 pyproject.toml, uv/Poetry/Pipenv/Conda lock, constraints 및 별도 학습 환경 정의는 조사 범위에서 발견되지 않았다.
- **현재 Python에 선언 요구 위반이 발견된 것은 아니다.** 위의 >= 조건은 설치된 높은 버전을 허용한다. 문제는 재빌드 시 같은 조합을 보장하지 못한다는 점이다.
- 설치 metadata에서 torchvision은 torch >=2.14.0을 요구하며 설치 torch는 이를 만족한다. 양 서비스에서 python -B -m pip check가 “No broken requirements found.”를 반환했다 [R7].
- pip check는 metadata상 요구만 검사한다. C/C++ 연산자 ABI, cv2 파일 덮어쓰기, 모델의 수치 결과, GPU 호환성까지 검증한 결과가 아니다.
- OpenCV 두 배포판의 RECORD에 **공통 cv2 경로 51개**가 있다 [R10]. PyPI 배포자 안내도 같은 namespace를 쓰므로 한 종류만 설치하도록 명시한다. [OpenCV 배포 지침](https://pypi.org/project/opencv-python-headless/)
- 탐지·분류는 같은 AI 환경이다. 현재 공동 모델 로딩을 확인했고, 두 모델 사이의 패키지 요구 충돌은 확정하지 못했다. 이 사실만으로 서비스를 나눌 이유는 없다.
- 컨테이너 전용 Python이므로 현 운영 AI가 호스트 전역 Python 또는 컬러화 Python과 site-packages를 공유한다는 증거는 없다. 다른 PC/별도 학습 저장소의 공유 환경은 확인하지 못했다.

### 3.4 연결된 컬러화 환경

| 구성 요소 | 코드에 선언된 버전 | 실제 실행·설치 버전 | 확인 근거 | 확인 상태 |
|---|---|---|---|---|
| Python | python:3.12-slim | 3.12.16, /usr/local/bin/python3.12 | 컬러화POC/Dockerfile:1,23; 프로세스·메타데이터 [R4] | 실측 |
| Flask | >=3.1,<4 | 3.1.3 | requirements:1; 메타데이터 [R4] | 조건 충족 |
| pydicom | >=3.0,<4 | 3.0.2 | requirements:2; 메타데이터 [R4] | 조건 충족 |
| NumPy | >=2.0,<3 | 2.5.4 | requirements:3; 메타데이터 [R4] | 조건 충족 |
| Matplotlib | >=3.9,<4 | 3.11.2 | requirements:4; 메타데이터 [R4] | 조건 충족 |
| Pillow | >=10.4,<13 | 12.3.0 | requirements:5; 메타데이터 [R4] | 조건 충족 |
| Gunicorn | >=23,<24 | 23.0.0 | requirements:6; 메타데이터/shebang [R4] | 조건 충족 |
| SQLite | Python 표준 sqlite3 사용 | 엔진 버전 미조회 | app.py:45–46, persistence.py:6,19 | 사용 코드 확인. DB 파일 미열람 |

컬러화의 Pillow 12.3.0과 AI의 13.0.0은 다르지만 **현재 별도 컨테이너이므로 충돌 증거가 아니다**. 향후 두 환경을 합치면 컬러화의 <13 조건과 현재 AI의 13.0.0을 조정해야 한다. 현 구성에서는 통합을 제안하지 않는다.

### 3.5 GPU·CUDA·CPU 실행

- 호스트에서 확인한 GPU는 **Intel UHD Graphics 770**, 드라이버 **32.0.101.7088**이다. nvidia-smi는 현재 PATH에서 발견되지 않았다 [R2]. NVIDIA 드라이버/CUDA Toolkit이 전체 디스크 어디에도 없다고 단정하지는 않는다.
- 현재 AI 컨테이너는 GPU DeviceRequests가 없고 /dev/nvidia0·/dev/nvidiactl·/dev/dxg도 없다. 기존 시작 로그에서 **All models loaded on cpu**를 확인했다 [R1,R4,R7].
- torch/version.py의 cu132/CUDA 13.2는 **설치된 빌드 정보**다. GPU 실행 중이거나 호스트에 CUDA Toolkit 13.2가 설치되어 있다는 뜻이 아니다.
- DenseNet은 torch.cuda.is_available()에 따라 cpu/cuda를 선택한다. YOLO에는 CELL이 device를 넘기지 않아 Ultralytics의 선택에 맡긴다. GPU 컴퓨터에서는 두 모델의 실제 장치 선택이 일치하는지 확인해야 한다. CELL 코드에 cuda:0 고정 지정은 발견되지 않았다.
- 다른 GPU 컴퓨터에서는 GPU·호스트 드라이버·PyTorch/CUDA 빌드 조합을 검증해야 한다. 공식 자료도 CUDA 세대별 드라이버 조건을 구분한다. **이번에 GPU 호환성을 실측하거나 보장하지 않았다.** [NVIDIA CUDA 호환성](https://docs.nvidia.com/deploy/cuda-compatibility/minor-version-compatibility.html)

## 4. 모델 실행 조건

### 4.1 YOLO 탐지 모델

| 항목 | 확인 결과와 근거 |
|---|---|
| 구조/로딩 코드 | model_loader.py:31–34가 Ultralytics YOLO(path)를 호출. 체크포인트의 pickle을 실행하지 않는 정적 검사에서 DetectionModel, C2f, SPPF, Detect 등의 타입 참조 확인 [R10]. 코드/파일명은 YOLOv8. 정확한 scale과 전체 구조 설정은 확인 필요 |
| 가중치 | REPO/ai-server/weights/yolov8_best.pt → 컨테이너 /app/weights/yolov8_best.pt. 6,268,899 bytes. PyTorch ZIP 직렬화 형식 |
| 출처/버전 | 내부 version 문자열 **8.3.161**, date/train_args/names 등의 키 존재를 정적으로 확인. 현 Ultralytics **8.4.202**와 다름. 원 학습 저장소·데이터셋 버전·이용 조건·재현 가능한 실험 기록과의 연결은 확인 필요. 내부 개인 경로 등은 출력하지 않음 |
| 클래스/인덱스 | 체크포인트 names 사전은 **0 → object**. 탐지는 1클래스이고 최종 6클래스 분류는 DenseNet 담당. detector.py:23–29는 boxes를 사용하며 탐지 class id를 최종 분류 라벨로 사용하지 않음 |
| 입력/전처리 | detector.py:22–23은 cv2로 원본을 읽고 YOLO에는 이미지 경로를 전달. CELL에 imgsz/conf/iou/letterbox 명시값이 없음. 실제 입력 크기·임계값·정규화는 라이브러리/체크포인트 설정에 의존하며 이번에 실제 적용값은 확인하지 않음 |
| crop 생성 | xyxy를 int화하고 원본 영역을 잘라 OpenCV로 JPEG 저장. detector.py:43–55. 라이브러리/전처리 변경 시 탐지→crop→분류 결과가 달라질 수 있음 |
| 장치 | YOLO 호출에 device 지정 없음. 현재 CPU 동작은 기존 로그 등으로 확인. GPU 실행의 명시적 정책은 없음 |
| 필요한 코드/환경 | Ultralytics의 모델 구현·PyTorch·OpenCV 등이 필요. 체크포인트에 구현 타입 참조가 있어 **가중치만 임의의 Python 환경으로 복사하면 실행된다고 볼 수 없음** |

### 4.2 DenseNet 분류 모델

| 항목 | 확인 결과와 근거 |
|---|---|
| 구조/로딩 코드 | torchvision.models.densenet201()을 만들고 classifier를 len(CLASS_NAMES) 출력 Linear로 교체. model_loader.py:39–45. 가중치 키 정적 검사에서도 denseblock별 층 수 6/12/48/32 확인 [R10] |
| 가중치 | REPO/ai-server/weights/densenet201_best.pth → /app/weights/densenet201_best.pth. 73,782,995 bytes. ZIP의 data.pkl에서 OrderedDict 및 classifier.weight/bias 키 확인. 로더는 state_dict를 기대 |
| 로딩 방식 | torch.load(..., map_location=device) → load_state_dict → to(device) → eval. model_loader.py:43–47. 구조 생성 코드가 필요하므로 **가중치 파일만으로 추론 처리가 완성되지 않음** |
| 입력/전처리 | OpenCV BGR→RGB→PIL, Resize(256,256), ToTensor, ImageNet mean [0.485,0.456,0.406]/std [0.229,0.224,0.225], batch 차원 추가. config.py:19–24, classifier.py:20–41 |
| 클래스/인덱스 | **0 Band / 1 Segment / 2 Lymphocyte / 3 Monocyte / 4 Eosinophil / 5 NucleatedRBC**. config.py:16–17. 반드시 가중치 학습 때의 순서와 일치해야 함 |
| 출력 | softmax→argmax→CLASS_NAMES의 문자열 및 confidence. classifier.py:31–49 |
| 출처/클래스 검증 | 가중치에서 class_to_idx 키는 정적 검사로 발견되지 않음. 학습 저장소·데이터셋·전처리·원 torch/torchvision 버전과 연결하는 manifest 미발견. 현재 공동 로딩 성공과 학습 당시 클래스 의미의 정확성은 별도 문제 |
| 장치 | CUDA 사용 가능 시 cuda, 아니면 cpu. map_location이 있어 CUDA 전용 로딩은 아님 |

### 4.3 체크섬·코드·클래스 정의

기존 파일의 읽기만 수행해 얻은 SHA-256:

| 파일 | SHA-256 |
|---|---|
| yolov8_best.pt | 5e20e2a36231b1b51748f5bba883c2ea851ee54b16440063f1d24003b520ed42 |
| densenet201_best.pth | 71f702e6bb0ef578db6ff2d5f86baead65f2bf5fda8046cc02f696ca30859da1 |

두 가중치는 .gitignore에 대상 경로가 있어도 git ls-files상 **추적 중**이었다. 파일별 마지막 Git 커밋은 모두 471ca66db4e28f6bdeb87054913375a2a18f4f23(2026-05-26 KST) [R10]. Git 보관 기록은 학습 실험 기록을 대신하지 않는다. 현재 파일과 해당 커밋 blob의 전 이력 대조는 수행하지 않았다.

- backend/.../domain/crop/CellType.java:11–22는 AI와 같은 6개 코드를 갖는다. frontend/src/constants.js:1–8은 표시 순서가 다르지만 문자열 key를 사용하므로 **표시 순서 차이만으로 오분류라고 판단하지 않는다**.
- ai-server/tools/prepare_diagnostic_gt_dataset.py:11–20은 원 라벨 ID 5/6/8/9/10/12를 6개 이름으로 매핑한다. DenseNet의 0..5나 YOLO 탐지의 0→object와 **서로 다른 스키마**다.
- 백엔드는 종·클래스 카탈로그를 동적으로 다루지만 AI는 고정 6클래스/단일 모델이며 종별 모델 선택 코드가 없다. 실제 운영 카탈로그와 모델 대상이 일치하는지는 업무 데이터를 조회하지 않아 확인 필요다.
- 진단 manifest/stats 파일은 존재를 확인했으나 본문은 읽지 않았고, 원 데이터/라벨의 정확성은 검증하지 않았다.

### 4.4 학습 결과를 추론에 연결하는 계약

- 조사 범위에서 독립 학습 코드, trainer.py, 학습 worker 서비스, optimizer/torch.save 기반 학습 구현은 발견되지 않았다. 재학습 라우터의 TODO가 근거이며 **학습이 작동한다고 보고할 수 없다**.
- 추론은 고정 파일명을 시작 시 한 번 읽는다. 모델 버전 선택, hot reload, 검증 후 승격, rollback 구현은 확인되지 않았다. 새 가중치 파일을 놓는 것만으로 실행 중 모델이 바뀌는 설계가 아니다.
- DenseNet은 같은 구조·클래스 순서의 state_dict를 받도록 계약할 수 있으나, 현재 학습 산출물의 추론 로딩을 보장하는 왕복 시험은 확인하지 못했다.
- 재학습 라우터는 BACKEND_URL을 localhost:8080으로 고정하고(:10), 데이터 조회에 인증 헤더를 보내지 않는다(:48–53). 별도 backend 컨테이너를 가리키는 설정이 아니며 SecurityConfig.java:46의 권한 요구와도 계약이 미완성이다. **소스상 구성 결함이며 이번에 POST나 인증 오류를 재현하지는 않았다.**
- 학습 데이터 조회는 제외된 crop을 필터링한다(CropCoreRepository.java:49–53). 다만 재학습 라우터에는 종/클래스 스키마 선택 계약이 없어 향후 일괄 학습 전에 정리해야 한다.
- DS–MAP은 Java 혼동행렬·정규화 단계다. Python 학습 패키지 충돌의 원인으로 볼 근거는 없다. 추론 시점별 불변 스냅샷 미구현은 COURSEWORK_WORKFLOW.md:29–39에도 명시되어 있다.

## 5. 저장 경로·설정·운영 특성

### 5.1 영속화와 경로

| 대상 | 코드/선언 경로 | 실제 구성에서 확인한 내용 | 이전할 때 주의점 |
|---|---|---|---|
| 원본/crop/썸네일 | backend file 설정, AI config.py:12–14 | REPO/data를 양 컨테이너 /data에 bind. originals/crops/thumbnails 존재 | Git clone만으로 실제 운영 파일까지 갖춰진다고 볼 수 없음. DB와 같은 복구 시점/파일명 계약 필요 |
| AI 가중치 | config.py:7–9 | REPO/ai-server/weights→/app/weights bind, 현재 RW | 이미지에만 의존하면 빠질 수 있음. ai-server/.dockerignore:4가 weights 제외. 추론 전용이면 RO화 검토 |
| 진단 데이터 | DiagnosticDatasetService.java:25,88–106의 processed-dir/manifest/crops | data/diagnostic_gt/raw/{images,labels}, processed/{crops,manifest.json,stats.json} 존재 | WORKDIR /app에서 ../data는 /data. 직접 실행은 cwd까지 확인 필요 |
| 확정 라벨·업무 데이터 | JPA/MySQL, 라벨 import/export | 영속 볼륨 **dev_mysql-data**→/var/lib/mysql | 다른 project 이름이면 다른 볼륨을 참조할 수 있음. DB 내용 미조회 |
| 라벨 export/import | LabelingService.java:100–104,181–185,191 이후 | 코드만 확인 | VIA/annotations의 코드·순서 변환을 명시. 학습용 manifest와 일치하는지 미검증 |
| DICOM 컬러화 | app.py:45–47, 자체 SQLite/uploads | **dev_colorizer-data**→/data | CELL MySQL과 별도 백업 대상. DB·영상 내용 미열람 |
| TLS | frontend/nginx.conf:12–13 | REPO/ssl→/etc/nginx/ssl RO. cert.pem/key.pem 존재 | 인증서 본문 미열람. 존재만으로 도메인 적합성·기간·갱신을 보장하지 않음 |

### 5.2 환경변수 설정 여부

값 자체는 기록하지 않는다. ‘있음’은 비어 있지 않은 값의 존재이며 정상 인증이나 적절한 설정을 보장하지 않는다.

| 대상 | 변수명 | 확인 상태 |
|---|---|---|
| REPO/.env | MYSQL_ROOT_PASSWORD, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD, COLORIZER_SECRET_KEY | 모두 비어 있지 않은 값 있음 |
| 실행 backend | SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME, SPRING_DATASOURCE_PASSWORD, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD | 모두 설정 있음. 값 비공개 |
| 실행 backend | AI_SERVER_URL, FILE_UPLOAD_DIR, FILE_CROP_DIR, FILE_THUMBNAIL_DIR, SPRING_JPA_HIBERNATE_DDL_AUTO, SPRING_JPA_SHOW_SQL | 설정 있음 |
| 실행 backend | SPRING_PROFILES_ACTIVE, DB_URL, DB_USERNAME, DB_PASSWORD, JWT_EXPIRATION_HOURS | 컨테이너 환경변수 목록에 없음. 현재 dev/다른 설정 경로가 있어 이것만으로 실행 불가라고 판단하지 않음 |
| 실행 colorizer | COLORIZER_DATA_DIR, COLORIZER_SECRET_KEY, COLORIZER_SECURE_COOKIE, COLORIZER_USER_STORAGE_LIMIT_GB | 설정 있음 |
| 실행 AI | CELL 고유 모델 경로/device/분류 클래스용 변수 | 발견되지 않음. 파일 내 상수 사용 |
| .env.example | 비밀설정 이름 및 COLORIZER_MEMORY_LIMIT/COLORIZER_CPU_LIMIT/COLORIZER_USER_STORAGE_LIMIT_GB | 템플릿에 존재. 실제 인증정보로 평가하지 않음 |

### 5.3 시작 순서·상태 점검·로그·재시작

- **5개 모두 running, AI/MySQL/colorizer healthy**. frontend/backend에는 Docker healthcheck가 없다. 관측 시 RestartCount=0, OOMKilled=false [R1]. 과거 모든 장애가 없다는 의미는 아니다.
- 모든 서비스는 unless-stopped. backend는 MySQL service_healthy를 기다리지만 AI 준비는 기다리지 않고, frontend는 backend 시작만 기다린다. colorizer 준비 대기도 없다(Compose:48–50,81–83).
- AI health는 models_loaded를 반환하지만 Compose:24는 HTTP 성공만 검사하고 body의 true 여부는 검사하지 않는다. 이번에는 body를 직접 읽어 **status=ok/models_loaded=true**를 확인했다 [R7].
- 짧은 depends_on은 상태 점검 성공을 기다리지 않는다. restart policy는 프로세스 종료/엔진 재시작에 관한 것이며 health 실패 자동 복구 보장과 구분해야 한다. [Compose 시작 순서](https://docs.docker.com/compose/how-tos/startup-order/), [Docker 재시작 정책](https://docs.docker.com/engine/containers/start-containers-automatically/)
- 실제 로그 드라이버는 모두 **local**, 서비스별 추가 옵션은 없다. Compose가 드라이버/보관 용량을 명시하지 않아 엔진 기본값에 의존하지만 ‘로그 무제한’이라고 단정하지 않는다.
- AI/backend에는 컨테이너별 CPU/메모리 상한이 없고, colorizer만 2GiB/1.5CPU 제한이 확인됐다. 필요한 실제 성능·자원량은 측정하지 않았다.
- Docker Desktop AutoStart=false와 Windows 로그인 시작 프로그램 등록이 함께 확인됐다. 실제 자동 시작은 시험하지 않아 **무인 복구 가능 여부는 확인 필요**다. 일반 사용자에게 보이는 CELL/ssl-renew 관련 예약 작업은 0개였다. 모든 권한의 작업이 없다는 뜻은 아니다.
- ssl-renew.ps1:4,9는 존재하지 않는 C:\DEV를 전제하며 :22–24는 frontend를 중지하는 standalone certbot 방식이다. 이식성과 갱신 중 가용성에 영향이 있다. 스크립트를 실행하거나 현재 갱신 실패/정기 실행을 확인한 것은 아니다.

### 5.4 실행 이미지 식별값

아래는 관측한 **image ID**다. 배포 레지스트리의 manifest digest와 같다고 취급하지 않는다. 현재 태그/소스에서 다시 빌드하면 이 값이 재생성된다는 보장도 없다.

| 서비스 | 실행 image ID |
|---|---|
| frontend | sha256:63fe160f78297ff218c74dfa23fdd2d04238305d5ed51c84576bce905bd6d20f |
| backend | sha256:b86ea6d1733f9b0c48fd37f6a4e7bc2525115d2f6f04d7b74606102ee44aaa19 |
| ai-server | sha256:4cc874edd9df9523d8c6e225d7238fff44892181aeee5e80494e626fed38a765 |
| colorizer | sha256:70b0ef1732328e061b94f1ce6ddc87eff7a4d3b927e2d5de0c9b093274179799 |
| mysql | sha256:7dcddc01f13bab2f15cde676d44d01f61fc9f99fe7785e86196dfc07d358ae2b |

## 6. 확인된 문제와 잠재 위험

### 6.1 현재 확인된 문제/구성상 부족

| ID | 확인 사실 | 영향과 판단의 한계 | 근거 |
|---|---|---|---|
| F1 | AI에 OpenCV 일반/headless 모두 설치, cv2 경로 51개 공유 | 파일 제공자 중복은 확인. 실제 추론 오류/ABI 장애는 미확인 | requirements:7, Ultralytics 메타데이터, [R10], OpenCV 공식 배포 지침 |
| F2 | AI 직접 의존성은 하한 지정뿐이며 NumPy 등의 lock도 없음. pip/OS 패키지/기반 이미지도 가변 | 현재는 버전 조건 충족. 미래 재빌드 재현성 부족 | requirements:1–9, AI Dockerfile:1,4,6–9 |
| F3 | MySQL의 실제 patch 지정이 저장소 밖 override에 존재 | 루트 Compose만 전달하면 8.0.46 고정 의도를 전달할 수 없음 | Compose:3, 외부 override:3, [R1] |
| F4 | 재학습 TODO, backend 주소/인증 계약 미완성 | 실제 학습/모델 승격 기능이 구현된 상태가 아님. 현재 추론 장애와 구분 | retrain_router.py:10,26–53, SecurityConfig.java:46 |
| F5 | 진단 도구는 C:\CELL2\CELL, 갱신 스크립트/시작 가이드는 C:\DEV 고정 | 현 작업 경로와 다르고 자동 보정 경로 미발견 | prepare...py:69, build...review.py:11, ssl-renew.ps1:4, 시작 가이드:7 |
| F6 | 모델·코드·클래스·전처리·환경을 묶는 release manifest 미발견 | 학습 당시 클래스 의미와 실행판/Git 관계의 완전 추적 불가 | config.py:16–24, loader:39–45, 가중치 폴더, [R8–R10] |
| F7 | 오래된 구조 설명과 현 코드/구성이 다름 | DB create 설명·과거 경로/포트를 현 운영 절차로 오인할 위험 | PROJECT_STRUCTURE_AND_FLOW.md:136–139,187–195와 현 코드/실측 |

### 6.2 다른 환경에서 발생할 수 있는 위험

| 위험 | 조건과 예상 영향 | 현재 판단 |
|---|---|---|
| torch/torchvision/NumPy/OpenCV 재해결 | 다른 시점 설치 또는 Python/OS/아키텍처 변경으로 wheel/ABI가 달라짐 | 위험. 현 CPU 환경 pip check는 통과. 특정 조합의 비호환을 단정하지 않음 |
| 모델 클래스 순서/전처리 불일치 | 같은 6출력 구조라도 의미 순서·색변환·리사이즈·정규화 변경 | 위험. DenseNet 학습 class_to_idx/transform 근거 부족 |
| 탐지/분류/데이터셋 ID 혼동 | 탐지 0→object, 분류 0..5, 원 진단 라벨 5 등을 같은 ID로 취급 | 스키마 변환 관리 필요. 현재 문자열 UI의 표시 순서 차이 자체는 오류로 단정하지 않음 |
| 추가 종/클래스와 고정 AI | 동적 카탈로그에 단일 6클래스 모델을 적용 | 적용 대상 확인 필요. 실제 데이터의 잘못된 결과를 확인한 것은 아님 |
| GPU 이전 | GPU/드라이버·CUDA 빌드·WSL 노출·GPU request·장치 선택 변경 | 현재 CPU. GPU 추론/학습 미검증 |
| Windows/Linux/ARM 차이 | PowerShell/C 드라이브 고정, 네이티브 Gunicorn, 경로 대소문자, 다른 아키텍처 wheel | 검증 필요. 현재 Gunicorn은 Linux 컨테이너 안에서 실행되므로 Windows 호스트라는 이유로 실행 불가가 아님 |
| 작업 디렉터리 의존 | backend 상대 data와 AI __file__ 기준이 직접 실행 때 다르게 해석 | 현 Compose에서는 같은 /data. 네이티브 실행 시 별도 확인 |
| 프로젝트명/볼륨/외부 파일 누락 | dev와 다른 프로젝트명, data/weights/ssl/비밀설정 미이전 | 빈 DB/다른 데이터 참조 또는 파일 미발견 위험. 복구 미시험 |
| 준비 상태/자동 시작 | AI 준비 전 요청, Windows 재부팅 후 Docker 미시작 | 현 서비스는 실행 중. 콜드 스타트/무인 복구 미시험 |
| 가변 이미지·소스판 차이 | nginx:alpine/python:3.12-slim 등 재해결, 작업 트리/override 미보존 | 비교 검증 전 동일 환경이라고 할 수 없음 |

### 6.3 추가 확인이 필요한 사항

- 실제 프런트 빌드의 Node/npm patch와 package-lock hash, 백엔드 빌더 JDK patch/Gradle 실행 기록.
- 실행 이미지에 대응하는 소스 커밋과 미커밋 변경. backend/React 전체의 빌드 일치는 확인하지 못했다.
- DenseNet 학습 class_to_idx/transform, YOLO 전체 구조·실험 ID·추론 설정, 모델 출처/이용 조건.
- 다른 저장소나 GPU 컴퓨터의 학습 구현 유무. 담당자에게 정규 참조 경로를 받은 뒤 연결 근거에 따라 추가 조사할 수 있다.
- 실제 종/클래스 카탈로그와 모델 대상, DS–MAP 외부 구현 유무. 업무 데이터는 조회하지 않았다.
- 대상 GPU 컴퓨터의 OS/GPU/드라이버/Python/PyTorch 빌드, 학습과 추론 동시 운영 요구.
- Windows/Docker 자동 시작, TLS 갱신, 상태 점검 및 백업 복구의 실제 성공 여부.
- 이번에는 기존 인증된 DB 연결을 사용할 수 있는 상황을 확인하지 못해 SQL을 실행하지 않았다. DB 서버 버전은 실행 바이너리 기준이다.

## 7. 우선순위별 개선 방향 — 미구현

### P0: 현재 운영 오류 또는 결과에 영향을 주는 문제

**이번 조사에서 확정한 P0는 없다.** 상태 점검 성공은 정확도 보장이 아니다. 알려진 오분류·모델 교체 오류·재학습 호출 장애가 있다면 개인정보 없는 재현 예와 발생 시각을 받아 해당 항목을 P0로 높여야 한다.

모델을 바꿔야 한다면 클래스 순서·전처리·대상 종 검증을 배포 조건으로 삼아야 한다. 이를 확인하지 않고 가중치만 교체하면 결과 영향을 판단할 수 없다.

### P1: 다른 컴퓨터에서 실행하기 전에 먼저 해결

| 순서 | 필요한 변경 | 현재 버전을 기준으로 하는 방향 | 예상 영향과 검증 |
|---|---|---|---|
| 1 | **현 운영 기준판 기록 및 의존성 잠금** | Python 3.12.16, torch 2.15.0/cu132·torchvision 0.29.2·Ultralytics 8.4.202·NumPy 2.5.4 등 현재값과 wheel 출처/hash부터 기록. 이미지/OS/pip 식별. Java 17/Boot 3.3.5/Gradle 8.13 유지. npm lock 및 실제 빌더판 확인 | 일괄 최신화하지 않음. 현재 상태 보존 후 별도 검증 환경에서 재구성. pip freeze만으로 OS/wheel/모델까지 고정되지는 않음 |
| 2 | **OpenCV 제공자를 하나로 정리** | 별도 검증 이미지에서 Ultralytics의 검증된 headless 배포 경로 등을 검토해 cv2 제공자를 하나로 설정 | Ultralytics가 일반판을 요구하므로 requirements 한 줄 삭제로 끝난다고 가정하지 않음. 현 운영에서 삭제하지 않고 동일 샘플로 탐지/crop/분류 비교 |
| 3 | **모델 release manifest** | 가중치 SHA, 구조, class_to_idx, 종, 전처리, YOLO 크기/임계값, 학습 데이터셋 ID, 코드 커밋, lock/image digest를 함께 관리 | 담당자로부터 기존 대응 정보 회수. 모르는 값은 추정하지 않음. 향후 시작 시 불일치를 검출하는 설계 |
| 4 | **배포 Compose/설정 집약** | 외부 MySQL 8.0.46 override 의도를 추적 가능한 운영 설정으로 포함. 프로젝트명·볼륨·bind root·TLS·비밀설정 전달 절차 명시. 배포 이미지 digest 식별 | 기존 dev 볼륨을 잃어버리지 않도록 이름을 무단 변경하지 않음. 기존 이미지 이동과 잠금 기반 재빌드를 별도 검증 |
| 5 | **절대 경로/cwd/주소 설정화** | 진단 도구/갱신 스크립트 root, AI DATA_DIR/가중치/device, BACKEND_URL, 공개 origin/도메인/포트를 입력 설정으로 분리 | 기존 저장소·DB·파일 참조 유지 및 비교. prod 프로필을 선택하려면 필수 변수와 시작 검증부터 준비 |
| 6 | **학습 계약·구현 범위 명시** | TODO/READY를 실제 학습 완료로 오인하지 않는 명세. 외부 학습 코드가 있다면 대상 종/클래스·인증·체크포인트 형식 정의 | 구현된 worker가 있다고 전제하지 않음. 학습 출력→현 추론 로딩 시험을 인수 조건으로 설정 |

### P2: 유지보수와 확장

- **현재 서비스 단위 유지:** Nginx+React, backend, MySQL, AI 추론, colorizer. 탐지와 분류는 같은 AI 환경에 둔다. 별도 확장/배포 요구나 재현된 의존성 충돌이 생길 때 분리한다.
- **운영 Compose와 GPU 학습 설정 분리:** 운영은 현재 CPU 동작을 기준으로 보존한다. 학습은 별도 프로세스/이미지 또는 전용 venv, GPU 요청·드라이버/CUDA 조건·읽기 전용 데이터셋·별도 결과 경로를 정의한다. 실행 중 가중치에 직접 덮어쓰지 않는다.
- 학습 환경은 추론 잠금을 출발점으로 추가 의존성만 분리한다. 학습용 CUDA/torch 변경이 추론에 전파되지 않게 한다. 현 CUDA 빌드를 CPU 전용 wheel로 바꾸는 최적화도 비교 검증 후 별도로 수행한다.
- Gradle Wrapper 사용 경로를 통일하고 distribution checksum/의존성 locking·verification을 검토한다. Boot BOM을 유지하며 모든 starter에 독립적인 최신 버전을 붙이지 않는다.
- OCI revision·lock hash·모델 manifest hash와 build-info로 실행판을 추적한다.
- backend/frontend 준비 상태, AI health body 검증, 첫 요청 재시도/시간 제한, 로그 보관·장애 알림을 정한다. 시작 순서 설정만으로 실행 중 장애가 해결된다고 보지 않는다.
- DS–MAP의 혼동행렬·클래스 스키마·교수 확정 정답 snapshot을 버전 관리한다.
- Windows 무인 복구와 Docker 시작, 업데이트/TLS 갱신은 중단 가능한 시험 환경에서 점검한다. 현재 certbot의 frontend 중지 방식 개선은 별도 계획 작업이다.

### 7.1 환경변수로 분리할 설정

아래 새 변수명은 **제안일 뿐 이번에 만들거나 변경하지 않았다**.

| 영역 | 정리할 기존 설정 | 추가 후보/원칙 |
|---|---|---|
| DB/인증 | SPRING_DATASOURCE_* 또는 prod의 DB_* 입력 경로, JWT_SECRET, ADMIN_*, COLORIZER_SECRET_KEY | 값은 문서에 넣지 않고 안전한 전달 경로 정의 |
| 네트워크 | AI_SERVER_URL, proxy | BACKEND_URL, 공개 origin/호스트, 공개 포트 |
| 파일 | FILE_UPLOAD_DIR/FILE_CROP_DIR/FILE_THUMBNAIL_DIR, COLORIZER_DATA_DIR | AI_DATA_DIR, WEIGHTS_DIR, 진단 데이터 root, 갱신 스크립트 root |
| 모델 실행 | 현재 config.py 상수 | MODEL_RELEASE_ID, DEVICE, YOLO_IMGSZ/CONF/IOU. 클래스/전처리 본체는 임의 변수보다 manifest로 함께 관리 |
| 실행 형태 | SPRING_PROFILES_ACTIVE 명시 검토 | CPU 운영/GPU 학습 설정 구분. 변경 전 필수값·호환성 확인 |

## 8. 다른 컴퓨터에서 재현하기 위한 검증 계획

**아래는 앞으로 수행할 계획이다. 이번에 설치·빌드·새 모델 로딩·추론·학습·데이터 복원은 하지 않았다.**

| 단계 | 최소 점검 | 합격 기준 | 이번 상태 |
|---|---|---|---|
| 1. 기준판 확정 | 배포 digest, 소스/미커밋 변경, lock, 모델 hash/manifest, 별도 데이터 보관 | 같은 release 조합을 열거 가능. 비밀값/업무 데이터는 공개 자료에서 제외 | image ID·모델 hash·주요판만 확인. 완전한 대응은 미확정 |
| 2. 대상 컴퓨터 | OS/아키텍처, Docker/Compose, CPU/RAM/용량. GPU면 GPU/드라이버/CUDA 경로 | 지정 아키텍처/실행 형태에 적합 | 대상 정보 미제공 |
| 3. 깨끗한 환경 재구성 | 잠긴 의존성·기반 이미지·Node/npm·Wrapper/JDK 사용 | 기록한 버전/배포 출처/hash 일치. 의존성 검사 성공 | 미실시 |
| 4. 데이터/설정 경로 | 볼륨/bind, 모델 2개, 진단 manifest, TLS, 비밀변수 존재 | 의도한 프로젝트/볼륨과 파일 경로·권한 일치 | 현 컴퓨터의 마운트/존재만 확인 |
| 5. 시작/상태/복구 | MySQL→backend→AI 준비→Nginx/컬러화. 재시작/재부팅 복구 | 로그인 전후 요구에 맞게 복구, AI body도 true | 현재 상태만 확인. 재시작 미실시 |
| 6. 소량 추론 비교 | 허용된 비개인정보 기준 영상으로 bbox/crop→6클래스/신뢰도 비교 | 클래스·색·리사이즈·정규화 일치. 수치/bbox 허용차는 기준 측정 후 사전 합의 | 추론 미실시. 기준 영상/기대값 필요 |
| 7. 앱 연결 | 분리된 시험 DB의 합성 데이터로 인증/upload/저장/표시 계약 확인 | 내부 서비스명·공개 포트·공유 data 일치. 운영 DB에 쓰지 않음 | 업무 API/DB 미조회 |
| 8. 학습→추론 | 학습 코드 입수 후 전용 GPU 환경의 작은 smoke, state_dict/manifest 출력과 읽기 | 구조/클래스/환경 추적과 현 추론 계약 성공 | 학습 코드/환경 미확정, 미실시 |
| 9. 복구/되돌리기 | 별도 시험 환경에서 이전 모델/이미지와 DB·파일의 정합 복구 | 버전/볼륨/모델을 혼동하지 않고 복구 | 미실시 |

## 9. 확인 명령과 근거 색인

수행한 확인의 **안전한 요약**이다. 원문 docker inspect, 환경변수 값, 프로세스 전체 명령줄, 업무 로그/접속 문자열은 첨부하지 않는다.

| ID | 실행한 확인 | 추출한 정보와 한계 |
|---|---|---|
| R1 | docker ps의 대상 ID→docker inspect 메모리 JSON 분석 | CELL 작업 경로 라벨의 5개 상태, Compose/프로젝트, mount/port, restart/health/resource. env는 이름과 비어 있지 않은지 여부만. 시작/마무리 상태 대조 |
| R2 | Get-Location/Get-Date, OS/CPU/VideoController/Process의 Get-CimInstance, Get-Command, docker version/compose version, wsl --list --verbose, Docker Desktop.exe VersionInfo | 실행 경로·OS·아키텍처·드라이버. 프로세스 원문 명령줄 출력 안 함. 현재 셸 별칭을 서비스 인터프리터로 간주하지 않음 |
| R3 | 기존 컨테이너의 nginx -v, mysqld --version, readlink /proc/1/exe, /etc/os-release, command -v | 짧은 버전/실행 파일 조회. DB 접속·Nginx 전체 설정/인증서 dump 없음 |
| R4 | 기존 AI/컬러화 Python에 -B와 stdin으로 표준 라이브러리 조회 코드 전달 | sys.version/executable/prefix, importlib.metadata.version/requires, torch/version.py의 version/cuda. 프로젝트/모델 import 없이 GPU device node 존재도 확인 |
| R5 | backend java -version, unzip -p app.jar META-INF/MANIFEST.MF, unzip -l의 주요 JAR 이름, 내장 application.yml 비민감 행 | JRE/Boot/JDK major/내장 의존성. 파일로 압축 해제하지 않고 Gradle/Maven도 실행하지 않음 |
| R6 | package.json/lock 표적 JSON 파싱, 정적 JS에서 18.3.x 패턴만 추출 | lock의 주요 버전. PowerShell JSON 변환이 lock의 빈 문자열 key를 처리하지 못해 기존 AI의 표준 json에 stdin으로 전달해 재확인. lock 변경 없음 |
| R7 | 두 Python의 python -B -m pip check, AI /health GET, 시작 시각 구간의 기존 로그를 메모리에서 목표 행만 필터 | 양쪽 의존성 검사 성공, models_loaded=true와 CPU 시작 확인. 컬러화 pip의 cache 권한 경고는 있었으나 의존성 오류는 없음. 추론/학습 API 호출 없음 |
| R8 | Get-FileHash, AI hashlib로 작은 소스 8개, frontend sha256sum으로 Nginx 설정 대조 | AI 8개와 Nginx 일치. backend/React 전체 일치를 뜻하지 않음 |
| R9 | 실행 5개 image inspect의 ID/OS/아키텍처, 앱 4개의 OCI revision 유무 | 이미지 식별 정보. 관련 없는 이미지 조사 없음 |
| R10 | 가중치 Get-FileHash, git ls-files/log(작성자 정보 제외), zipfile/pickletools 정적 검사, OpenCV RECORD 비교 | 역직렬화 없이 타입 참조·version/클래스·DenseNet 키 구조 확인. 개인 경로/임의 메타데이터 값 미출력. cv2 공유 51개 |
| R11 | rg --files/rg -n, 줄 번호 소스 조회, Test-Path, .env의 이름/값 존재 판정 | 코드/설정/학습 구현의 위치 확인. 민감한 설정 원문·데이터 내용 미출력 |
| R12 | 예약 작업의 관련 action 존재, Docker AutoStart/Windows 시작 등록 조회 | 일반 사용자 가시 범위. 작업 실행/설정 변경 없음 |

### 9.1 공식 문서의 사용 범위

- [OpenCV Python 배포자 안내](https://pypi.org/project/opencv-python-headless/): cv2 제공자 중복 문제의 근거. 설치/공유 경로는 이번에 직접 확인했다.
- [Ultralytics 설치 안내](https://docs.ultralytics.com/quickstart/): OS/CUDA별 PyTorch 의존과 headless 경로 검토 자료. 최신 버전 도입을 권하는 근거로 사용하지 않았다.
- [NVIDIA CUDA 호환성](https://docs.nvidia.com/deploy/cuda-compatibility/minor-version-compatibility.html): GPU 컴퓨터에서 드라이버 검증이 필요한 이유. 현재 GPU 호환 통과를 의미하지 않는다.
- [Compose 시작 순서](https://docs.docker.com/compose/how-tos/startup-order/), [Docker 재시작 정책](https://docs.docker.com/engine/containers/start-containers-automatically/): 준비 상태와 재시작 정책의 의미 구분.
- Spring Boot 3.3 계열 요구사항과 torchvision 공식 자료도 확인했지만 열람 페이지에는 현행/계열 후속 버전이 포함된다. 이를 **정확히 3.3.5 또는 현 torch/torchvision 조합의 호환성 시험으로 대체하지 않았다**.

## 10. 추가로 필요한 정보

1. **원 학습 산출물 대응표:** DenseNet class_to_idx/transform, YOLO 구조/설정, 학습 코드 경로, 데이터셋/release ID와 현 가중치의 관계.
2. **빌드 기록:** 프런트 Node/npm·lock hash, 백엔드 소스/미커밋 변경과 빌더판, 이미지 생성 절차. 비밀값이 든 로그는 불필요하다.
3. **이전 대상과 운영 요구:** OS/아키텍처/GPU/드라이버, 허용 점검 시간, 로그인 전 자동 복구 필요 여부, CPU 추론/GPU 학습을 맡길 컴퓨터.
4. **기준 추론 자료:** 개인정보 없는 사용 허가 영상과 기대 bbox/분류/전처리, 알려진 문제가 있다면 민감정보를 제외한 재현 절차.
5. **DS–MAP/재학습 외부 구현:** 별도 구현이 있으면 정규 참조 경로. 조사 범위에서 발견되지 않았다는 사실을 모든 컴퓨터에 없다는 뜻으로 취급하지 않는다.

이 보고서는 조사와 개선 방향이며, 환경 변경·Docker 도입·재구축·호환성 시험 완료 보고가 아니다.

