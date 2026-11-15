# CELL 캡스톤 코드 조사 — D01~D08 작성 근거

조사 기준일: **2026-10-19 (Asia/Seoul)**. 저장소 `C:/DEV`, 브랜치 `juhun`, 커밋 `94aeb1a5dd6b88ba2e701de5d3f107d4958bcd3b`. 원격 URL은 인증정보 없는 `https://github.com/C-E-L-L/DEV.git`. 현재 체크아웃 파일과 해당 커밋을 기준으로 조사했으며 원격 fetch·merge·커밋·배포는 하지 않았다.

이 자료는 **현 구현 기반 문서화 초안**이다. 실제 사전 요구사항·실제 Sprint 수행기록·학교 제출본을 대신하지 않는다. UC/T/E/US/TK/C/UI/API/ALG/ST/NFR/Q 번호는 이번 조사에서 새로 부여했다. 기존 프로젝트에서 사용하던 공식 요구사항 ID는 발견하지 못했다. 다른 파일에서도 이 번호를 그대로 사용한다.

## 읽는 순서와 자료 상태

|파일|용도|
|---|---|
|`CELL_캡스톤_코드조사.md`|범위·D01~D08 작성 문안·요구사항·태스크·불일치·확인 질문|
|`CELL_상세기술목록.md`|자체 작성 타입·멤버 전체, 함수 모듈, 알고리즘, 실제 DB 스키마·API·GUI·라이선스|
|`CELL_요구사항_추적표.csv`|액터→UC→T→E→US→TK→UI/C/ALG/API/DB→시스템 시험의 다대다 연결|
|`CELL_시스템시험_케이스와결과.md`|ST 케이스와 미수행/차단, 기존 단위시험·빌드 기록의 한계|
|`diagrams/`|PlantUML/Mermaid 편집 원문. 사용사례·배포·패키지·클래스·ERD·시퀀스는 서로 다른 그림|
|`조사_검증기록.md`|실행한 읽기 전용 명령, 스키마 관측, 수량·누락·민감정보 검수|

판정은 **[정적 구현]**, **[실행 관측]**, **[기존 기록]**, **[문서/계획]**, **[부분 구현]**, **[근거 미발견]**, **[사용자 확인 필요]**로 구분한다. 구현 존재는 기능을 실제 사용자로 끝까지 시험했다는 뜻이 아니다.

## 0. 공통 기초 자료와 조사 범위

### 0.1 시작 상태와 포함 기준

- 적용되는 `AGENTS.md`를 `C:/` 상위 및 저장소(생성·의존성·데이터 제외)에서 검색했으나 발견하지 못했다. 별도 AGENTS 규칙 없음은 해당 검색 범위에 한한다.
- 시작 당시 추적 파일 변경은 없고 `letsencrypt/`, `ssl-renew.log`만 미추적이었다. 인증서·계정키·로그 내용은 결과물에 복사하지 않는다. 기존 근거자료는 이미 추적되고 있다.
- 프로젝트를 문자열만으로 판별하지 않고 `frontend/src/main.jsx→App.jsx→pages/components→src/api`, Spring Controller→Service→Repository→Entity, `AiClientService→/api/analyze`, Docker/Nginx upstream·공유 파일 경로로 추적했다.

|구분|경로|연결 근거·역할·범위|
|---|---|---|
|CELL 본체|`frontend/`|React 진입 `src/main.jsx:1`, 역할별 route `src/App.jsx:11`; mock 모드는 운영과 구분|
|CELL 본체|`backend/`|Spring `CellApplication` 및 `com.cell.platform`; 업무·JWT·JPA·영상 리소스|
|직접 연결 AI|`ai-server/`|FastAPI `main.py:6`, `AiClientService.java:45`의 HTTP 호출; `./data` 공유|
|직접 연결 설정|`docker-compose.yml`, `frontend/nginx.conf`, `ssl-renew.ps1`|동일 서비스 구동·HTTPS·프록시·인증서 갱신. 비밀값은 제외|
|저장소|`data/`, `ai-server/weights/`|원본/crop/썸네일/진단 manifest·가중치의 위치·메타데이터만 조사. 실제 영상·학생 답안·가중치 내용은 미복사|
|연계 독립 서비스|`컬러화POC/`|로그인 화면 링크 `frontend/src/pages/LoginPage.jsx:7`, `nginx.conf`의 `/colorizer/`, compose colorizer 서비스. Flask/SQLite·별도계정. CELL 정답/학습 파이프라인에는 연결 안 됨|
|본체의 부가 기능|`frontend/src/assets/bomb-game.html`·`BombGamePage.jsx`·GameRecord API|App의 ADMIN `/game`과 실제 API 연결. 교육/라벨링 핵심 기능과 분리|
|관련 오프라인 도구|`ai-server/tools/`|진단 GT crop/manifest 준비와 검토 contact sheet. 학습 trainer가 아님|
|관련 문서·검증|`README.md`, `PROJECT_STRUCTURE_AND_FLOW.md`, `load_test/`, `definition/`, 기존 D01 근거자료|실제 코드와 대조. 연구 초안·권장 스펙은 현재 시스템 측정값이 아님|
|구버전 후보|`bomb-gauge-push (2).html`|현재 BombGamePage는 src/assets HTML만 import. 루트 HTML을 운영 진입점으로 쓰는 근거 없음|
|애매한 흔적|`backend;C/`, `cDEVfrontendsrccomponents/`, `cDEVfrontendsrcutils/`|파일이 없는 디렉터리. 의존/실행 경로 확인되지 않음|
|범위 밖/보호|`backups/`, root SQL dump의 INSERT 데이터, 인증서·계정키·실제 업로드 영상|스키마·파일 존재만 참고. 개인정보/비밀·대규모 데이터는 내용 조사 제외|

루트에 다른 완전한 독립 앱을 CELL 본체로 합친 근거는 없다. 별도 컬러화와 게임을 졸업작품의 공식 범위에 포함할지는 Q-03에서 확인한다. 현재 작업 트리에 없는 타 브랜치의 노트북은 운영 진입점으로 확정하지 않는다.

```text
C:/DEV
├─ frontend/       React 화면·API 래퍼·공통 분석·브라우저 세션·mock
│  ├─ src/pages/   Login / Student / Expert / Admin / BombGame
│  ├─ src/components/ AnalyticsFeedback / StudentManagement / Review / 영상·종 UI
│  ├─ src/api/, src/utils/, src/context/, src/hooks/
│  └─ mock/        Vite mock 전용(운영 서버와 별도)
├─ backend/        Spring Boot Controller→Service→domain interface→infra JPA
│  ├─ src/main/java/com/cell/platform/{config,controller,domain,dto,entity,exception,infra,service,util}
│  ├─ src/test/    단위·MVC·JPA 테스트
│  └─ sql/         마감·동물종 수동 마이그레이션
├─ ai-server/      FastAPI→YOLO crop→DenseNet 분류, weights/, tools/
├─ 컬러화POC/      독립 Flask+SQLite DICOM 뷰어·ROI
├─ data/           originals / crops / thumbnails / diagnostic_gt
├─ definition/     클래스 매핑 PNG·9-class HWP·연구초안 ZIP
├─ load_test/      Locust·AI benchmark(운영 쓰기 가능, 이번 조사 미실행)
└─ docker-compose.yml / frontend/nginx.conf / ssl-renew.ps1
```

### 0.2 명칭·목적·시스템 경계

|항목|현재 확보한 사실|근거·판정|
|---|---|---|
|저장소/UI 명칭|`C.E.L.L. Platform`|`README.md:1`, `frontend/index.html:6`, `ai-server/main.py:6` [정적 구현]|
|국문명 단서|교육 & AI 재학습 루프 협력 플랫폼|사용자 제공 기존 D01의 명칭. 현재 소스에서 이 국문명이 공식명으로 선언된 근거 미발견|
|약어 풀네임 단서|`Collaborative Education & Learning Loop`|사용자 제공 단서. 저장소 README/UI에서 정확한 확장문구 발견 못함. 거짓이라고 단정하지 않고 학교 문서용 공식명은 확인 필요|
|README 영문 설명|`Hierarchical Human-in-the-Loop (HITL) Labeling Platform for WBC Dataset Construction and Education`|`README.md:3`. 약어의 각 글자 풀이가 아니라 목적 설명|
|도메인·목적|혈액도말에서 세포 후보를 찾고, 학생 분류 답안·전문가 정답을 축적하여 교육/라벨 데이터 구축을 돕는 웹 서비스|`backend/src/main/java/com/cell/platform/service/TaskService.java:102`, `backend/src/main/java/com/cell/platform/service/SubmissionService.java:57`, `backend/src/main/java/com/cell/platform/service/CropService.java:68`의 종합 요약|
|문제·개발동기|반복적 탐지·분류·학습 결과 확인을 보조하는 흐름은 구현으로 확인. 실제 기관의 불편·요청·교육 문제·개발 동기는 사용자 확인 필요|연구 초안은 관련 배경 자료이나 캡스톤 공식 요구 수집 기록은 아님|
|핵심 가치|AI 후보 생성, 사람의 최종 GT, 학습·복습·학생별 분석, 외부 라벨 입출력|[정적 구현]. 정량 시간절감·교육효과·모델정확도 향상은 실측 근거 없음|

### 0.3 실행·배포·기술 환경

상세 버전·환경변수·포트·OSS 표는 상세기술목록 ENV/OSS 절을 사용한다. 선언/lock/실행은 섞지 않는다.

- React 18 계열·React Router 6·Axios·Vite 5는 `frontend/package.json`에 범위로 선언. lock은 React18.3.1, Router6.30.3, Axios1.13.5, Vite5.4.21이다.
- Spring Boot3.3.5·Java17·JJWT0.12.6·Gradle8.13은 `backend/build.gradle:1`, `backend/Dockerfile:1`에서 확인한다. JPA/MySQL·BCrypt·WebClient 사용.
- AI/DICOM Docker는 Python3.12-slim. AI는 FastAPI·PyTorch·torchvision·Ultralytics·OpenCV·Pillow, 컬러화는 Flask·pydicom·NumPy·Matplotlib·Gunicorn.
- compose는 **5개 서비스**, 외부 publish는 Nginx80/443만. backend8080·AI8001·MySQL3306·colorizer8501은 Docker 내부. dev Vite5173은 개발 직접 실행 포트.
- MySQL named volume, colorizer named volume, backend/AI 공용 `./data` bind. TLS 인증서는 `./ssl` 읽기 전용 mount. 자동 백업·백업 복구 시험·모니터링 정책은 근거 미발견.
- 코드 설정은 `application.yml`의 **dev 프로필 기본**이고 compose가 DB·AI·파일경로·DDL validate를 환경변수로 덮어쓴다. compose가 prod 프로필을 활성화한다고 쓰면 안 된다.
- `docker compose ps`에서 5개 컨테이너 실행과 AI/MySQL/컬러화 healthy를 관측했다. backend/frontend 컨테이너는 며칠 전 재생성된 상태였다. 배포 commit label은 없어서 현재 Git 전체와 바이너리가 완전히 같다고 단정하지 않는다. 현재 정적 JS 파일명은 `index-Bnv1iU4O.js`.
- 하드웨어: `load_test/README.md:66`에 **권장 사양**만 있다. 지금 조사 도구가 실행되는 PC 사양을 공식 개발/운영/시험 장비로 대입하지 않았다.

### 0.4 자료와 개발 이력

[기존 기록] 현재 브랜치에 도달 가능한 commit은 50개, 최초 기록은 2026-05-08, 최신은 2026-10-15이다. 공식 개발기간·실제 완료일·공식 담당자·Sprint 차수로 환산하지 않는다. Git 작성자 이름/메일은 결과에 전사하지 않았다.

|기록 단서|의미|
|---|---|
|2026-05-08 `a5a5c10`|기본 scaffold 기록|
|2026-05-21 `6339ac5` / 05-25 `252b488`|ADMIN·GT/final/pseudo 구분 이력|
|2026-05-28 `99daa6c` / 06-05 `12e8f13`|Docker·과제/사용자관리·보안 관련 변경|
|2026-06-08 `a02995c`, `5f76fc3`|명단·승인·썸네일·인증 이미지·TLS 변경|
|2026-08-05 `17d9434`|확정 GT 재수정|
|2026-08-19 `7238289`, `e110773`|복습·영상 화면 조정|
|2026-08-24 `ccc02c2` / 08-25 `58e9be4`|동물종·독립 컬러화|
|2026-10-15 `b5e1a84`, `90a51dd`, `45faecd`, `94aeb1a`|학생 응답표·세션 동기화·학생 이력·공통 분석 화면|

설계/코드 설명: README·PROJECT_STRUCTURE_AND_FLOW·기존 D01 근거자료. 논문·정의: definition. 테스트 소스: backend/src/test·frontend/src/utils/*.test.js·컬러화POC/tests. 성능 도구: load_test. 공식 Sprint·회의록·정기 미팅 계획·Ground Rules·작업량·우선순위·D02~D08 학교 완성본은 검색 범위에서 근거 미발견. `backend/build`에는 빌드 흔적은 있으나 `TEST-*.xml` 결과 파일이 없다.

## 1. D01 — 시스템 정의서 작성 자료

### 1.1 양식 항목별 문안 초안

다음 기술 설명은 현재 구현의 요약이다. 국·영문 공식명과 인적사항은 사용자 제공 D01 단서를 확정한 뒤 기입한다.

|양식 항목|짧은 문안|상세 근거/주의|
|---|---|---|
|작품명(국문)|교육 & AI 재학습 루프 협력 플랫폼 **(사용자 제공 명칭, 확정 필요)**|실제 자동 재학습 완료를 뜻하는 설명은 금지|
|작품명(영문)|C.E.L.L. Platform; 확장명은 사용자 확인 후 괄호 기입|README의 HITL 설명과 acronym 구분|
|책임자·소속·학번·참여학생·교수·개발기간|사용자 직접 입력|Q-01/Q-02. Git author/date로 대신하지 않음|
|작품 설명|혈액도말의 AI 탐지·분류 결과를 과제로 제공하고, 학생 답안과 전문가 정답을 교육·라벨 데이터 구축에 활용하는 웹 플랫폼|US-011~US-028, ALG-03~13|
|사용자 유형|학생은 풀이·결과·복습·신고, 교수/전문가는 과제·GT·평가·분석·종 관리, 관리자는 계정·전체 영상·공통 분석을 관리|Role enum·SecurityConfig와 화면 구분. 관리자 API 허용과 교수 전용 화면 진입은 동일하지 않음|
|운영개념|브라우저→Nginx→React/Spring, Spring→MySQL·영상 저장소 및 FastAPI. AI는 YOLO crop 후 DenseNet 분류 결과를 돌려주고 전문가가 GT를 확정|구성/시퀀스 그림. 컬러화는 별도 Flask/SQLite로 선택적 포함|
|주요 기능|다중 도말 과제·마감, AI 세포 검출·6종 분류, 학생 답안·복습, GT 수정·완료표시, 투표·혼동행렬·학생 이력, 진단평가, 신고, VIA/ZIP, 계정/종 관리|D04의 US-001~US-033. US-034 재학습은 완성기능에서 제외|
|기타 개발 시 고려사항|계정·영상 접근 보호, 라벨 변경 시 통계 일관성, 파일/DB의 함께 백업, 모델·데이터 사용권 확인이 필요|HTTPS·JWT·해시는 구현. 자동 백업/복구 검증·라이선스 준수 전체·모델 품질 보장은 미확인|
|선행기술 조사·분석|현재 모델·오픈소스·VIA 형식의 역할과 definition의 기존 연구 자료를 제시하고 현 시스템과 차이를 분석|아래 1.2와 상세 OSS. 특허·상용제품 비교·공식 논문 출처 검증은 별도 필요|
|Key Words 5개|Human-in-the-Loop; 혈액도말 영상; AI 세포 분류; 전문가 정답 검증; 학습 이력 분석|구현에 맞는 후보. 공식 키워드는 사용자 확정|

상세 설명 후보: “C.E.L.L.은 혈액도말 영상에서 AI가 세포 영역을 검출하고 6개 클래스로 분류한 결과를 학습 과제로 제공한다. 학생의 세포별 답안을 저장하고, 전문가의 확정 정답을 기준으로 채점·복습·투표 분포·혼동행렬·학생별 학습 이력을 제공한다. 전문가가 정답을 재수정하거나 외부 VIA 라벨을 가져올 수 있어 검토한 라벨의 축적을 지원한다. 현재 서비스에는 검증 라벨에서 모델 학습·평가·가중치 교체까지 자동 실행하는 재학습 루프는 연결되어 있지 않다.” 근거: ALG-03/05/06/07/08/09/13/15/16.

### 1.2 기존 D01 설명 검증

|기존 설명·단서|현재 코드 대조|판정|
|---|---|---|
|국·영문명과 Collaborative Education & Learning Loop|사용자 제공 기존명이며 README/UI에는 정확한 확장문구 미발견|명칭 확인 필요|
|웹·Spring·MySQL·AI·파일 저장소|compose·Nginx·AiClient·JPA로 연결됨|일치|
|YOLOv8 탐지·DenseNet-201 분류|`model_loader.py:32-44`와 classifier. YOLO 세부 크기(n/s/m 등)는 파일명만으로 확정불가|현재 추론 구조 일치|
|6개 분류|frontend constants, CellType, CLASS_NAMES의 이름 집합이 같음. 순서는 일부 다르나 문자열 매핑 사용|일치|
|다중업로드·과제·마감·답안·GT수정·복습·진단·관리|해당 US와 API 존재|정적 구현 일치; 시스템 시험 미수행|
|VIA JSON·ZIP|`LabelingService`는 VIA2.0.10 ZIP export와 JSON import 구현|일치; import 시 저장 혼동행렬 backfill 누락 주의|
|AI 재학습 루프|라벨 목록 추출과 `/api/retrain` 골격·READY만 존재. trainer·평가·교체 없음. 오프라인 tools는 진단 데이터 준비|완성 서비스로 쓰면 불일치|
|고려사항의 백업·확장성·품질|모듈 분리·볼륨·일부 검증은 있음. 자동백업·수평확장·복구시험·교육효과 측정 없음|설계 고려와 구현 구분|

`definition/class_num_mapping.png`는 0~12의 13개 옵션(예: Basophil=11)을 가진 매핑 참고 이미지다. `definition/백혈구 9 class 정의.hwp`의 본문에는 class4~12의 9종 정의가 있다. HWP 전체 변환은 SummaryInformation 문제로 실패했지만 원본 BodyText/Section0 레코드의 문단 텍스트를 읽어 클래스 목록을 확인했다. 서식이나 본문의 임상적 타당성은 검증하지 않았다.

`definition/*.zip`에는 연구 초안 DOCX 2개, 동일 HWP, 참고 PDF3개가 있다(인명 포함 ZIP 이름은 여기서 생략). 초안 `draft_250707_revised*.docx`의 본문 문단41은 YOLOv8+DenseNet-121을 설명하고 문단33은 9개 클래스 연구를 설명한다. 현재 코드의 DenseNet-201/6클래스와 다르며 초안의 시험 데이터·추론시간·정확도를 현재 가중치의 성능으로 인용할 수 없다. 사진·본문 전체나 실제 표본은 결과 ZIP에 넣지 않았다. PDF 본문은 이번 조사에서 미해독했으며 논문별 출처·연구설계·재사용 허가는 추가 확인 대상이다.

## 2. D02 — 프로젝트 관리 계획서용 자료

### 2.1 프로젝트 개요(양식 1.1·1.2)

명칭은 0.2, 개요 문안은 D01 1.1을 재사용한다. 독립 컬러화와 게임의 공식 포함 여부는 미정이다.

### 2.2 개발 프로세스(양식 2.1·2.2)

채택된 Scrum/Agile/폭포수 모형을 확인할 공식 기록은 없다. Git에는 기능 추가→수정→UI 공통화→테스트 추가의 반복 변경 이력만 있다. **설명용 재구성안**은 “요구 확인→UI/API/데이터 설계→구현→단위·통합 검증→시스템 검증→문서·배포”이며, 실제 채택 사실로 쓰지 않는다. 각 단계 산출물 후보는 요구사항표(US), UI/API/DB 명세, 소스·수동 SQL, 테스트 코드/로그, 시스템 시험결과표, 배포 설정이다. 실제 Sprint 시간축은 Q-06 확인 전 비워 둔다.

### 2.3 팀 구성(양식 3)

|이름|공식 역할|책임|기타|
|---|---|---|---|
|사용자 확인 필요|사용자 확인 필요|사용자 확인 필요|Git author와 공식 팀원을 동일시하지 않음|

### 2.4 프로젝트 운영 관리(양식 4.1·4.2)

정기/비정기/발표 미팅 일정·회의록·의사결정·Ground Rules의 공식 기록은 미발견이다. 질문은 Q-05로 통합한다. 코드 리뷰/PR merge 이력은 일부 있지만 실제 회의·승인 체계를 증명하지 않는다.

### 2.5 개발 환경(양식 5.1~5.3)

|구분|확인된 내용|미확인|
|---|---|---|
|하드웨어 명칭·수량·사양|저장소에는 load_test의 권장 장비만 있음|공식 개발/운영/시험 장비와 수량, 구매/지원사항|
|소프트웨어|React/Vite, Java17/Spring/Gradle, Python/FastAPI/PyTorch, MySQL, Flask/SQLite, Nginx/Docker, Git|실제 팀원의 IDE·OS·도구별 사용기간|
|문서 작성도구|HWP·DOCX·Markdown 파일 존재|공식 사용 제품/버전(한글·Word·그림도구 등)|
|운영 관측|현재 workspace에서 Docker Desktop 서비스가 동작함|이 장비가 학교 문서의 정식 운영/시험 장비인지|

### 2.6 산출물 목록(양식 6)

|순서|문서코드/산출물|현재 존재|담당·완료예정일·기타|
|---|---|---|---|
|1|D01 시스템 정의서|기존 근거자료와 사용자 제공 설명|학교 최종 HWP 완성·담당·날짜는 확인 필요|
|2|D02 프로젝트 관리 계획서|공식 완성본 미발견|이번 자료는 작성 근거|
|3|D03 기능 아키텍처|공식 완성본 미발견|UC·PlantUML 초안 제공|
|4|D04 프로덕트 백로그|공식 사전 백로그 미발견|US41·NFR12 역정리 초안|
|5|D05 Sprint 백로그|실제 차수 기록 미발견|TK82 미배정 후보|
|6|D06 Sprint 개발 명세|학교 완성본 미발견|전체 기술목록·알고리즘·API·ERD 제공|
|7|D07 시스템 시험결과|공식 전체 시스템 시험 결과 미발견|ST94 후보·기존단위시험/빌드 별도|
|8|D08 결과보고서|공식 완성본 미발견|요약·부록 작성 재료 제공|
|9|실행 소스·빌드/배포 설정|frontend/backend/ai-server/컬러화POC·Docker/Nginx|정적/실행 근거 구분|
|10|모델 가중치·진단 데이터 준비 도구|weights2개·tools2개|학습 출처·평가·재사용허가 확인 필요|
|11|DB 스키마·마이그레이션|JPA10개·SQL2개·컬러화 SQLite7개|실제 관측 스키마와 비교|
|12|시험 소스·부하도구·설명서|backend/src/test·frontend tests·컬러화tests·load_test·README|공식 완료/성과 증빙과 구분|

### 2.7 기타·참고문헌(양식 7·8)

외부 의존성은 상세 OSS, 개발 제약·운영 이슈는 9절을 재사용한다. 저장소 내부 근거는 README, PROJECT_STRUCTURE_AND_FLOW, definition 연구/정의 자료, load_test README, 실제 빌드·요구사항·설정 파일이다. 외부 특허·상용제품 비교나 웹 논문 검색은 새로 수행하지 않았다. 라이선스는 확인 가능한 lock/설치 metadata만 기록하며 미확인을 관행으로 채우지 않았다.

## 3. D03 — 기능 아키텍처용 자료

### 3.1 액터(양식 2.1)

|액터|역할·참고|근거|
|---|---|---|
|STUDENT|가입·로그인·풀이·결과·복습·신고|Role.java·StudentPage·SubmissionController|
|EXPERT|교수/전문가: 과제·GT·진단·통계·학생 이력·라벨·종 관리|Role.java·ExpertPage·SecurityConfig|
|ADMIN|계정·명단·영상 목록·공통 분석·학생 이력·부가게임. 교수용 생성 API 일부도 허용되지만 /expert route는 ADMIN에 열리지 않음|App.jsx·AdminPage·SecurityConfig|
|비로그인 방문자|메인 학생 회원가입·로그인|AuthController|
|Spring 백엔드(시스템 액터)|FastAPI 분석 호출자|AiClientService|
|AI 추론 서비스(외부 프로세스)|검출·crop·분류 결과를 돌려줌|analyze_router·pipeline|
|컬러화 사용자|별도 계정으로 DICOM/ROI 작업. CELL role을 상속하지 않음|컬러화POC/app.py·persistence.py|

### 3.2 사용사례와 기본·예외 흐름(양식 2.2·2.3)

사용사례도 원문은 `diagrams/01_사용사례.puml`. 메뉴 자체가 아니라 사용자 목적 단위로 18개 UC를 구성했다. 각 UC의 기본/예외는 연결된 US의 수용기준과 ALG 상세를 참조하며 실행 결과는 미확인이다.

|UC_ID|사용사례명|주요 액터|시작 조건·목적|연결 US·기본 처리/결과|예외·구현 상태·근거|
|---|---|---|---|---|---|
|UC-01|인증·브라우저 세션|학생·EXPERT·ADMIN; 비로그인 학생|본인 계정으로 역할별 작업을 시작한다; 입력/전제는 해당 US 참조|US-001, US-002, US-003 / 로그인·학생 회원가입·로그아웃·다중 탭 계정 동기화|정적 구현; frontend/src/pages/LoginPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AuthService.java:26; 예외는 아래 US별 명세|
|UC-02|접근 권한|학생·EXPERT·ADMIN|권한이 있는 기능만 접근한다; 입력/전제는 해당 US 참조|US-004 / 서버·화면 권한 제어|정적 구현; frontend/src/App.jsx:1 / backend/src/main/java/com/cell/platform/config/SecurityConfig.java:24; 예외는 아래 US별 명세|
|UC-03|계정·학생 명단|ADMIN|교수·학생 계정을 관리한다; 입력/전제는 해당 US 참조|US-005, US-006, US-007 / 관리자 사용자 목록·생성·가입 승인·비활성화·삭제·학생 사전 명단 관리|정적 구현; frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37; 예외는 아래 US별 명세|
|UC-04|동물 종 메타데이터|로그인 사용자; EXPERT·ADMIN(API); EXPERT·ADMIN|도말·세포가 어느 종인지 확인한다; 입력/전제는 해당 US 참조|US-008, US-009, US-010 / 동물 종 조회·표시·종 생성·이름 수정·기존 도말의 종 변경|정적 구현; frontend/src/components/SpeciesBadge.jsx:1 / backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24; 예외는 아래 US별 명세|
|UC-05|도말 업로드·과제 생성|EXPERT·ADMIN(API); EXPERT(화면)·ADMIN(API)|도말을 세포 단위 문제로 만든다; 입력/전제는 해당 US 참조|US-011, US-012 / 단일 도말 업로드·AI 과제 생성·다중 도말 과제 생성|정적 구현; frontend/src/api/tasks.js:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; 예외는 아래 US별 명세|
|UC-06|과제 조회·마감·삭제|학생·EXPERT·ADMIN; EXPERT·ADMIN; EXPERT·ADMIN 의도|일반 과제와 진단평가를 구분하고 이어 푼다; 입력/전제는 해당 US 참조|US-013, US-014, US-015 / 과제 조회·선택·진행률·마감일 설정·변경·과제·도말 삭제|정적 구현; frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; 예외는 아래 US별 명세|
|UC-07|학생 학습·복습|STUDENT(화면)·로그인(API); STUDENT|세포를 분류하고 진행 중 답안을 저장한다; 입력/전제는 해당 US 참조|US-016, US-017 / 학생 세포 답안 저장·수정·학생 결과·오답 복습|정적 구현; frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/SubmissionService.java:46; 예외는 아래 US별 명세|
|UC-08|전문가 GT 검토|EXPERT·ADMIN|검증된 정답을 제공하고 오류를 바로잡는다; 입력/전제는 해당 US 참조|US-018, US-019 / 전문가 정답 확정·재수정·세포 이동·GT 완료 표시|정적 구현; frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/CropService.java:23; 예외는 아래 US별 명세|
|UC-09|통계·학생별 분석|EXPERT·ADMIN|어떤 세포를 누가 어떤 클래스로 답했는지 분석한다; 입력/전제는 해당 US 참조|US-020, US-021, US-022, US-023 / 세포 통계·학생별 선택자·도말별 학생 응답 비교표·학생별 학습 이력·세포별 결과·진단·누적 혼동행렬|정적 구현; frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/StatsService.java:21; 예외는 아래 US별 명세|
|UC-10|진단평가|EXPERT(화면)·ADMIN(API)|정답이 준비된 셀로 평가 과제를 만든다; 입력/전제는 해당 US 참조|US-024 / 진단평가 문제 생성|정적 구현; frontend/src/pages/ExpertPage.jsx:1 / backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:25; 예외는 아래 US별 명세|
|UC-11|문제 세포 신고|STUDENT(화면)·로그인(API); EXPERT·ADMIN|이미지·탐지 문제를 교수에게 전달한다; 입력/전제는 해당 US 참조|US-025, US-026 / 문제 세포 신고·신고 조회·분류|정적 구현; frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18; 예외는 아래 US별 명세|
|UC-12|라벨 파일 입출력|EXPERT·ADMIN|전문가 라벨과 이미지를 외부 도구로 전달한다; 입력/전제는 해당 US 참조|US-027, US-028 / 라벨링 ZIP/VIA 내보내기·VIA 라벨 가져오기|정적 구현; frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/LabelingService.java:34; 예외는 아래 US별 명세|
|UC-13|영상 관리·표시|ADMIN; 로그인 사용자; 학생·EXPERT·ADMIN|전체 영상과 라벨 유무를 확인한다; 입력/전제는 해당 US 참조|US-029, US-030, US-031 / 원본·crop 데이터 목록 관리·인증된 영상 조회·썸네일·영상 화면 조정|정적 구현; frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37; 예외는 아래 US별 명세|
|UC-14|AI 추론|Spring 백엔드(시스템 액터)|도말을 자동 분석해 분류 후보를 얻는다; 입력/전제는 해당 US 참조|US-032 / AI 세포 탐지·crop·분류|정적 구현; ai-server/app/services/pipeline.py:1 / backend/src/main/java/com/cell/platform/service/AiClientService.java:20; 예외는 아래 US별 명세|
|UC-15|학습 데이터·재학습 경계|로그인(API;문서상EXPERT 의도); 서비스 확장 계획|확정 라벨과 crop 목록을 추출한다; 입력/전제는 해당 US 참조|US-033, US-034 / 확정 학습 데이터 조회·AI 재학습·pseudo-label 확장|부분 구현 포함; frontend/src/api/crops.js:1 / backend/src/main/java/com/cell/platform/service/CropService.java:23; 예외는 아래 US별 명세|
|UC-16|관리자 부가 게임|ADMIN|관리자용 게임과 순위표를 사용한다; 입력/전제는 해당 US 참조|US-035 / 관리자 부가 게임·기록|정적 구현; frontend/src/pages/BombGamePage.jsx:1 / backend/src/main/java/com/cell/platform/service/GameRecordService.java:18; 예외는 아래 US별 명세|
|UC-17|독립 컬러화 계정·파일|컬러화 사용자(별도 계정); 컬러화 사용자|자신의 DICOM 작업을 저장한다; 입력/전제는 해당 US 참조|US-036, US-037, US-038 / 독립 컬러화 계정·세션·DICOM 작업·업로드·복원·삭제·DICOM 파일명·촬영유형 필터|정적 구현; 컬러화POC/templates/index.html:1 / ColorizerStore; 예외는 아래 US별 명세|
|UC-18|독립 컬러화 시각화·ROI·내보내기|컬러화 사용자|명암·컬러 결과를 비교한다; 입력/전제는 해당 US 참조|US-039, US-040, US-041 / DICOM 정규화·컬러맵·설정저장·DICOM ROI 라벨·좌표 저장·DICOM 일괄 내보내기·취소|정적 구현; 컬러화POC/static/app.js:1 / dicom_processing; 예외는 아래 US별 명세|

### 3.3 기타 요구사항(양식 3)

NFR-01~12는 아래 D04와 상세기술목록에 있다. 권한·업로드·마감·데이터 제약은 코드 기반이며 목표 동시접속자·응답시간·가용성·브라우저 지원범위는 공식 합의·실측이 필요하다.

## 4. D04 — 프로덕트 백로그(현 구현 기반 문서화 초안)

### 4.1 주제+에픽 목록(양식 2.1)

주제 T는 UC와 1:1 대응하고 에픽 E는 세부 기능 묶음이다. 실제 개발 당시 분류체계가 아니라 이번 문서화 ID이다.

|액터|주제ID|주제명|에픽ID|에픽명|에픽 설명|
|---|---|---|---|---|---|
|학생·EXPERT·ADMIN|T-01|인증·브라우저 세션|E-001|로그인|본인 계정으로 역할별 작업을 시작한다|
|비로그인 학생|T-01|인증·브라우저 세션|E-002|학생 회원가입|계정을 신청하고 명단·승인에 따라 참여한다|
|학생·EXPERT·ADMIN|T-01|인증·브라우저 세션|E-003|로그아웃·다중 탭 계정 동기화|계정을 바꿔도 이전 화면이 다른 계정으로 요청하지 않게 한다|
|학생·EXPERT·ADMIN|T-02|접근 권한|E-004|서버·화면 권한 제어|권한이 있는 기능만 접근한다|
|ADMIN|T-03|계정·학생 명단|E-005|관리자 사용자 목록·생성|교수·학생 계정을 관리한다|
|ADMIN|T-03|계정·학생 명단|E-006|가입 승인·비활성화·삭제|학생의 서비스 참여 상태를 관리한다|
|ADMIN|T-03|계정·학생 명단|E-007|학생 사전 명단 관리|예정된 학생의 가입을 자동 승인한다|
|로그인 사용자|T-04|동물 종 메타데이터|E-008|동물 종 조회·표시|도말·세포가 어느 종인지 확인한다|
|EXPERT·ADMIN(API)|T-04|동물 종 메타데이터|E-009|종 생성·이름 수정|필요한 동물 종 이름을 관리한다|
|EXPERT·ADMIN|T-04|동물 종 메타데이터|E-010|기존 도말의 종 변경|잘못 입력한 종을 바로잡는다|
|EXPERT·ADMIN(API)|T-05|도말 업로드·과제 생성|E-011|단일 도말 업로드·AI 과제 생성|도말을 세포 단위 문제로 만든다|
|EXPERT(화면)·ADMIN(API)|T-05|도말 업로드·과제 생성|E-012|다중 도말 과제 생성|여러 도말을 한 과제로 묶는다|
|학생·EXPERT·ADMIN|T-06|과제 조회·마감·삭제|E-013|과제 조회·선택·진행률|일반 과제와 진단평가를 구분하고 이어 푼다|
|EXPERT·ADMIN|T-06|과제 조회·마감·삭제|E-014|마감일 설정·변경|과제 수행 기간을 제어한다|
|EXPERT·ADMIN 의도|T-06|과제 조회·마감·삭제|E-015|과제·도말 삭제|불필요한 과제와 관련 기록을 제거한다|
|STUDENT(화면)·로그인(API)|T-07|학생 학습·복습|E-016|학생 세포 답안 저장·수정|세포를 분류하고 진행 중 답안을 저장한다|
|STUDENT|T-07|학생 학습·복습|E-017|학생 결과·오답 복습|내 답과 실제 정답을 비교해 복습한다|
|EXPERT·ADMIN|T-08|전문가 GT 검토|E-018|전문가 정답 확정·재수정|검증된 정답을 제공하고 오류를 바로잡는다|
|EXPERT·ADMIN|T-08|전문가 GT 검토|E-019|세포 이동·GT 완료 표시|검토할 세포와 미확정 도말을 찾는다|
|EXPERT·ADMIN|T-09|통계·학생별 분석|E-020|세포 통계·학생별 선택자|어떤 세포를 누가 어떤 클래스로 답했는지 분석한다|
|EXPERT·ADMIN|T-09|통계·학생별 분석|E-021|도말별 학생 응답 비교표|도말 전체에 대해 학생별 답과 점수를 비교한다|
|EXPERT·ADMIN|T-09|통계·학생별 분석|E-022|학생별 학습 이력·세포별 결과|특정 학생의 과제 수행 현황을 조회한다|
|EXPERT·ADMIN|T-09|통계·학생별 분석|E-023|진단·누적 혼동행렬|학생의 클래스별 혼동을 확인한다|
|EXPERT(화면)·ADMIN(API)|T-10|진단평가|E-024|진단평가 문제 생성|정답이 준비된 셀로 평가 과제를 만든다|
|STUDENT(화면)·로그인(API)|T-11|문제 세포 신고|E-025|문제 세포 신고|이미지·탐지 문제를 교수에게 전달한다|
|EXPERT·ADMIN|T-11|문제 세포 신고|E-026|신고 조회·분류|문제가 보고된 세포를 검토한다|
|EXPERT·ADMIN|T-12|라벨 파일 입출력|E-027|라벨링 ZIP/VIA 내보내기|전문가 라벨과 이미지를 외부 도구로 전달한다|
|EXPERT·ADMIN|T-12|라벨 파일 입출력|E-028|VIA 라벨 가져오기|외부에서 검토한 정답을 반영한다|
|ADMIN|T-13|영상 관리·표시|E-029|원본·crop 데이터 목록 관리|전체 영상과 라벨 유무를 확인한다|
|로그인 사용자|T-13|영상 관리·표시|E-030|인증된 영상 조회·썸네일|원본과 crop을 안전하게 표시한다|
|학생·EXPERT·ADMIN|T-13|영상 관리·표시|E-031|영상 화면 조정|염색 차이를 보조적으로 조절하며 관찰한다|
|Spring 백엔드(시스템 액터)|T-14|AI 추론|E-032|AI 세포 탐지·crop·분류|도말을 자동 분석해 분류 후보를 얻는다|
|로그인(API;문서상EXPERT 의도)|T-15|학습 데이터·재학습 경계|E-033|확정 학습 데이터 조회|확정 라벨과 crop 목록을 추출한다|
|서비스 확장 계획|T-15|학습 데이터·재학습 경계|E-034|AI 재학습·pseudo-label 확장|검증 라벨을 다음 모델에 활용한다|
|ADMIN|T-16|관리자 부가 게임|E-035|관리자 부가 게임·기록|관리자용 게임과 순위표를 사용한다|
|컬러화 사용자(별도 계정)|T-17|독립 컬러화 계정·파일|E-036|독립 컬러화 계정·세션|자신의 DICOM 작업을 저장한다|
|컬러화 사용자|T-17|독립 컬러화 계정·파일|E-037|DICOM 작업·업로드·복원·삭제|여러 DICOM 작업을 이어 처리한다|
|컬러화 사용자|T-17|독립 컬러화 계정·파일|E-038|DICOM 파일명·촬영유형 필터|작업목록을 촬영조건과 이름으로 찾는다|
|컬러화 사용자|T-18|독립 컬러화 시각화·ROI·내보내기|E-039|DICOM 정규화·컬러맵·설정저장|명암·컬러 결과를 비교한다|
|컬러화 사용자|T-18|독립 컬러화 시각화·ROI·내보내기|E-040|DICOM ROI 라벨·좌표 저장|관심영역을 그려 라벨링한다|
|컬러화 사용자|T-18|독립 컬러화 시각화·ROI·내보내기|E-041|DICOM 일괄 내보내기·취소|영상 또는 ROI VIA 패키지를 묶어 받는다|

### 4.2 사용자 스토리·수용 기준(양식 2.2)

모든 US의 추정작업량·우선순위는 **미정(공식 기록 없음)**이다. 우선순위를 현재 구현 순서나 Git 날짜에서 만들지 않았다. 입출력·예외·API의 장문은 상세기술목록에서 동일 US로 연결한다.

|에픽ID·에픽명|US_ID|사용자 스토리|추정작업량|우선순위|구현 상태|수용 기준(정상 / 예외)|화면/API·근거|
|---|---|---|---|---|---|---|---|
|E-001 로그인|US-001|학생·EXPERT·ADMIN 사용자는 로그인 기능을 사용하여 본인 계정으로 역할별 작업을 시작한다.|미정|미정|정적 구현 확인|활성 계정은 로그인 성공 / 오입력·PENDING/REJECTED/INACTIVE 로그인 거부|POST /api/auth/login; frontend/src/pages/LoginPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AuthService.java:26|
|E-002 학생 회원가입|US-002|비로그인 학생 사용자는 학생 회원가입 기능을 사용하여 계정을 신청하고 명단·승인에 따라 참여한다.|미정|미정|정적 구현 확인|명단 등록 학생은 즉시 활성화 / EXPERT/ADMIN 공개가입·중복 아이디·빈 이름 거부|POST /api/auth/register; frontend/src/pages/LoginPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AuthService.java:26|
|E-003 로그아웃·다중 탭 계정 동기화|US-003|학생·EXPERT·ADMIN 사용자는 로그아웃·다중 탭 계정 동기화 기능을 사용하여 계정을 바꿔도 이전 화면이 다른 계정으로 요청하지 않게 한다.|미정|미정|정적 구현 확인|새 세션은 모든 탭에 동기화 / 이전 세션의 늦은 401이 새 세션 삭제하지 않음|프런트엔드 로컬 동작;POST /api/auth/login; frontend/src/utils/authSession.js:1 / backend/src/main/java/com/cell/platform/config/JwtAuthFilter.java:17|
|E-004 서버·화면 권한 제어|US-004|학생·EXPERT·ADMIN 사용자는 서버·화면 권한 제어 기능을 사용하여 권한이 있는 기능만 접근한다.|미정|미정|정적 구현 확인|권한별 URL 규칙에 맞게 접근 / 미인증·다른 역할 거부; 메서드 보안 누락 의심 구간 별도 검증|GET /api/tasks;GET /api/admin/users;GET /api/analytics/students/{studentId}/history; frontend/src/App.jsx:1 / backend/src/main/java/com/cell/platform/config/SecurityConfig.java:24|
|E-005 관리자 사용자 목록·생성|US-005|ADMIN 사용자는 관리자 사용자 목록·생성 기능을 사용하여 교수·학생 계정을 관리한다.|미정|미정|정적 구현 확인|EXPERT/STUDENT 생성 가능 / 중복 ID·ADMIN 생성 거부|GET /api/admin/users;POST /api/admin/users; frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37|
|E-006 가입 승인·비활성화·삭제|US-006|ADMIN 사용자는 가입 승인·비활성화·삭제 기능을 사용하여 학생의 서비스 참여 상태를 관리한다.|미정|미정|정적 구현 확인|상태 변경이 다음 로그인 검사에 반영 / 미존재 사용자·보호 대상 ADMIN 변경/삭제 거부; 기존 JWT 즉시 폐기 아님|PUT /api/admin/users/{userId}/status;DELETE /api/admin/users/{username}; frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37|
|E-007 학생 사전 명단 관리|US-007|ADMIN 사용자는 학생 사전 명단 관리 기능을 사용하여 예정된 학생의 가입을 자동 승인한다.|미정|미정|정적 구현 확인|새 명단 항목 저장 / 빈 명단·중복 항목 처리|GET /api/admin/student-roster;POST /api/admin/student-roster; frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37|
|E-008 동물 종 조회·표시|US-008|로그인 사용자 사용자는 동물 종 조회·표시 기능을 사용하여 도말·세포가 어느 종인지 확인한다.|미정|미정|정적 구현 확인|과제·세포·통계에 종 표시 / 기존 누락 종은 DOG fallback; 종별 AI 모델은 아님|GET /api/species; frontend/src/components/SpeciesBadge.jsx:1 / backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24|
|E-009 종 생성·이름 수정|US-009|EXPERT·ADMIN(API) 사용자는 종 생성·이름 수정 기능을 사용하여 필요한 동물 종 이름을 관리한다.|미정|미정|정적 구현 확인|유일한 이름 저장 / 빈 이름·중복·미존재 종 거부|POST /api/species;PUT /api/species/{speciesId}; frontend/src/components/SpeciesDataSettings.jsx:1 / backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24|
|E-010 기존 도말의 종 변경|US-010|EXPERT·ADMIN 사용자는 기존 도말의 종 변경 기능을 사용하여 잘못 입력한 종을 바로잡는다.|미정|미정|정적 구현 확인|종 배지·DTO 변경 / 미존재 task/species 거부|PUT /api/tasks/{taskId}/species; frontend/src/components/TaskSpeciesEditor.jsx:1 / backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24|
|E-011 단일 도말 업로드·AI 과제 생성|US-011|EXPERT·ADMIN(API) 사용자는 단일 도말 업로드·AI 과제 생성 기능을 사용하여 도말을 세포 단위 문제로 만든다.|미정|미정|정적 구현 확인·주 UI 연결 미확인|유효 영상에서 검출 crop 반환 / AI 장애·파일 저장 실패·과거 마감 거부; 독립 단일 업로드 API의 주 UI 연결은 제한|POST /api/tasks/upload;POST AI:/api/analyze; frontend/src/api/tasks.js:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|E-012 다중 도말 과제 생성|US-012|EXPERT(화면)·ADMIN(API) 사용자는 다중 도말 과제 생성 기능을 사용하여 여러 도말을 한 과제로 묶는다.|미정|미정|정적 구현 확인|한 개 이상 파일·영상별 종 지정 / 파일 없음·종 개수 불일치·AI 중간 실패; FS 롤백은 보장 안 됨|POST /api/assignments;POST AI:/api/analyze; frontend/src/pages/ExpertPage.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|E-013 과제 조회·선택·진행률|US-013|학생·EXPERT·ADMIN 사용자는 과제 조회·선택·진행률 기능을 사용하여 일반 과제와 진단평가를 구분하고 이어 푼다.|미정|미정|정적 구현 확인|기존 답안 복원 / 빈 과제·조회 실패 표시; 개별 학생 배정 테이블 없음|GET /api/tasks;GET /api/assignments/{assignmentId}/tasks;GET /api/tasks/{taskId}/crops;GET /api/assignments/{assignmentId}/crops; frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|E-014 마감일 설정·변경|US-014|EXPERT·ADMIN 사용자는 마감일 설정·변경 기능을 사용하여 과제 수행 기간을 제어한다.|미정|미정|정적 구현 확인|마감 전 미래 날짜 변경 / 이미 마감된 과제 변경·진단평가 마감 설정·묶음 도말 개별 변경 거부|PUT /api/tasks/{taskId}/deadline;PUT /api/assignments/{assignmentId}/deadline; frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|E-015 과제·도말 삭제|US-015|EXPERT·ADMIN 의도 사용자는 과제·도말 삭제 기능을 사용하여 불필요한 과제와 관련 기록을 제거한다.|미정|미정|정적 구현 확인|연결 DB기록 삭제 / 미존재 ID 처리·서버 DELETE 권한 누락 의심; 원본/crop 파일 삭제는 확인 안 됨|DELETE /api/tasks/{taskId};DELETE /api/assignments/{assignmentId}; frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|E-016 학생 세포 답안 저장·수정|US-016|STUDENT(화면)·로그인(API) 사용자는 학생 세포 답안 저장·수정 기능을 사용하여 세포를 분류하고 진행 중 답안을 저장한다.|미정|미정|정적 구현 확인|6개 label·잠기지 않은 과제 / 유효하지 않은 label·미존재 crop·마감/완료 잠금 거부|POST /api/submit;GET /api/tasks/{taskId}/submissions/{studentId};GET /api/tasks/{taskId}/submissions/{studentId}/labels;GET /api/assignments/{assignmentId}/submissions/{studentId};GET /api/assignments/{assignmentId}/submissions/{studentId}/labels; frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/SubmissionService.java:46|
|E-017 학생 결과·오답 복습|US-017|STUDENT 사용자는 학생 결과·오답 복습 기능을 사용하여 내 답과 실제 정답을 비교해 복습한다.|미정|미정|정적 구현 확인|공개 조건 충족 / 공개 전 결과 접근 거부; 다른학생 ID는 principal로 교체; AI예측 비교 미제공|GET /api/tasks/{taskId}/my-results/{studentId};GET /api/assignments/{assignmentId}/my-results/{studentId};GET /api/student/reviews; frontend/src/components/StudentReviewPanel.jsx:1 / backend/src/main/java/com/cell/platform/service/SubmissionService.java:46|
|E-018 전문가 정답 확정·재수정|US-018|EXPERT·ADMIN 사용자는 전문가 정답 확정·재수정 기능을 사용하여 검증된 정답을 제공하고 오류를 바로잡는다.|미정|미정|정적 구현 확인|유효6클래스·수정 버튼·저장 / 미존재 crop·유효하지 않은 label 거부|PUT /api/crops/{cropId}/confirm; frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/CropService.java:23|
|E-019 세포 이동·GT 완료 표시|US-019|EXPERT·ADMIN 사용자는 세포 이동·GT 완료 표시 기능을 사용하여 검토할 세포와 미확정 도말을 찾는다.|미정|미정|정적 구현 확인|모든 finalLabel 존재 시 완료 배지 / 빈 crop은 완료 아님; Confirm 자동 다음 이동은 없음|GET /api/all-stats;GET /api/tasks/{taskId}/stats; frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/StatsService.java:21|
|E-020 세포 통계·학생별 선택자|US-020|EXPERT·ADMIN 사용자는 세포 통계·학생별 선택자 기능을 사용하여 어떤 세포를 누가 어떤 클래스로 답했는지 분석한다.|미정|미정|정적 구현 확인|응답 있을 때 클래스별 학생 펼치기 / 응답0·미확정 GT는 채점수치 구분; 전체통계는 선택자명 비움|GET /api/tasks/{taskId}/stats;GET /api/all-stats; frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/StatsService.java:21|
|E-021 도말별 학생 응답 비교표|US-021|EXPERT·ADMIN 사용자는 도말별 학생 응답 비교표 기능을 사용하여 도말 전체에 대해 학생별 답과 점수를 비교한다.|미정|미정|정적 구현 확인|GT 완료 시 점수; 수정하면 재계산 / 응답 상세 누락·무응답·GT미완료 구분|GET /api/tasks/{taskId}/stats; frontend/src/components/StudentResponsesPanel.jsx:1 / backend/src/main/java/com/cell/platform/service/StatsService.java:21|
|E-022 학생별 학습 이력·세포별 결과|US-022|EXPERT·ADMIN 사용자는 학생별 학습 이력·세포별 결과 기능을 사용하여 특정 학생의 과제 수행 현황을 조회한다.|미정|미정|정적 구현 확인|학생 선택→학습이력→세포별 응답 / 미존재 task404; STUDENT API접근403; 무응답 학생은 빈/미응답 내역|GET /api/analytics/students/{studentId}/history;GET /api/analytics/students/{studentId}/tasks/{taskId}; frontend/src/components/StudentManagement.jsx:1 / backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:24|
|E-023 진단·누적 혼동행렬|US-023|EXPERT·ADMIN 사용자는 진단·누적 혼동행렬 기능을 사용하여 학생의 클래스별 혼동을 확인한다.|미정|미정|정적 구현 확인|기존 제출과 GT 관계에 따른 집계 / 미존재/비진단 task·응답 없음 경계; task별 GET 권한 보강 필요|GET /api/tasks/diagnostic/student-matrices;GET /api/tasks/{taskId}/diagnostic/student-matrices; frontend/src/components/StudentManagement.jsx:1 / backend/src/main/java/com/cell/platform/service/SubmissionService.java:46|
|E-024 진단평가 문제 생성|US-024|EXPERT(화면)·ADMIN(API) 사용자는 진단평가 문제 생성 기능을 사용하여 정답이 준비된 셀로 평가 과제를 만든다.|미정|미정|정적 구현 확인|양의 총수·분포합 일치·보유량 이내 / 알수없는 클래스·보유초과·합계불일치·manifest오류 거부|GET /api/tasks/diagnostic/pool-stats;POST /api/tasks/diagnostic/create; frontend/src/pages/ExpertPage.jsx:1 / backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:25|
|E-025 문제 세포 신고|US-025|STUDENT(화면)·로그인(API) 사용자는 문제 세포 신고 기능을 사용하여 이미지·탐지 문제를 교수에게 전달한다.|미정|미정|정적 구현 확인|필수 ID·사유가 있으면 신고 저장 / 필수값 누락 거부; 미존재·다른 과제 ID 및 학생ID 위조는 서버 검증 없음|POST /api/reports; frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18|
|E-026 신고 조회·분류|US-026|EXPERT·ADMIN 사용자는 신고 조회·분류 기능을 사용하여 문제가 보고된 세포를 검토한다.|미정|미정|정적 구현 확인|EXPERT/ADMIN 조회 / STUDENT GET403; 해결상태 워크플로는 없음|GET /api/reports; frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18|
|E-027 라벨링 ZIP/VIA 내보내기|US-027|EXPERT·ADMIN 사용자는 라벨링 ZIP/VIA 내보내기 기능을 사용하여 전문가 라벨과 이미지를 외부 도구로 전달한다.|미정|미정|정적 구현 확인|실제 업로드 도말·파일 존재 / 진단평가/파일 누락 거부; AI pseudo만으로 정답 export 안 함|GET /api/labeling/tasks/{taskId}/export; frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/LabelingService.java:34|
|E-028 VIA 라벨 가져오기|US-028|EXPERT·ADMIN 사용자는 VIA 라벨 가져오기 기능을 사용하여 외부에서 검토한 정답을 반영한다.|미정|미정|정적 구현 확인|기존 task 소속 crop / 다른task cropId·형식오류 거부; import 경로 혼동행렬 backfill 미호출|POST /api/labeling/tasks/{taskId}/import; frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/LabelingService.java:34|
|E-029 원본·crop 데이터 목록 관리|US-029|ADMIN 사용자는 원본·crop 데이터 목록 관리 기능을 사용하여 전체 영상과 라벨 유무를 확인한다.|미정|미정|정적 구현 확인|권한있는 전체목록 / 미로그인401·다른역할403; 파일 자체 삭제는 별도 아님|GET /api/admin/smears;GET /api/admin/crops; frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37|
|E-030 인증된 영상 조회·썸네일|US-030|로그인 사용자 사용자는 인증된 영상 조회·썸네일 기능을 사용하여 원본과 crop을 안전하게 표시한다.|미정|미정|정적 구현 확인|인증이 있으면 리소스 제공 / 401·없는파일404; Task별 파일 소유권 분리는 없음|GET /data/** (리소스 핸들러); frontend/src/components/AuthImage.jsx:1 / backend/src/main/java/com/cell/platform/config/WebConfig.java:11|
|E-031 영상 화면 조정|US-031|학생·EXPERT·ADMIN 사용자는 영상 화면 조정 기능을 사용하여 염색 차이를 보조적으로 조절하며 관찰한다.|미정|미정|정적 구현 확인|기본100·밝기50~150·대비50~180·채도0~180 / 원본은 변경하지 않음; 초해상도·자동 염색보정 없음|추가 API 없음; frontend/src/components/ImageDisplayControls.jsx:1 / 프런트엔드 전용|
|E-032 AI 세포 탐지·crop·분류|US-032|Spring 백엔드(시스템 액터) 사용자는 AI 세포 탐지·crop·분류 기능을 사용하여 도말을 자동 분석해 분류 후보를 얻는다.|미정|미정|정적 구현 확인|모델 로딩 완료·읽을 수 있는 영상 / 미로딩503; 잘못된영상 일반예외 가능; 탐지confidence/NMS 자체설정 없음|POST AI:/api/analyze;GET AI:/health; ai-server/app/services/pipeline.py:1 / backend/src/main/java/com/cell/platform/service/AiClientService.java:20|
|E-033 확정 학습 데이터 조회|US-033|로그인(API;문서상EXPERT 의도) 사용자는 확정 학습 데이터 조회 기능을 사용하여 확정 라벨과 crop 목록을 추출한다.|미정|미정|정적 구현 확인·주 UI 연결 미확인|확정라벨 존재 / 역할 제한이 URL에 없어 학생접근 가능성; 화면 호출연결 미확인|GET /api/training-data; frontend/src/api/crops.js:1 / backend/src/main/java/com/cell/platform/service/CropService.java:23|
|E-034 AI 재학습·pseudo-label 확장|US-034|서비스 확장 계획 사용자는 AI 재학습·pseudo-label 확장 기능을 사용하여 검증 라벨을 다음 모델에 활용한다.|미정|미정|부분 구현/계획|완료 조건 미구현 / localhost 백엔드주소·JWT없음; posterior도 TODO|POST AI:/api/retrain; ai-server/app/routers/retrain_router.py:1 / backend/src/main/java/com/cell/platform/service/PseudoLabelService.java:9|
|E-035 관리자 부가 게임·기록|US-035|ADMIN 사용자는 관리자 부가 게임·기록 기능을 사용하여 관리자용 게임과 순위표를 사용한다.|미정|미정|정적 구현 확인|ADMIN;유효점수 / 다른 role403·비양수 점수 제외; 빈 이름·mode/players null의 서비스 검증은 미확인|POST /api/game/records;GET /api/game/leaderboard;DELETE /api/game/records; frontend/src/pages/BombGamePage.jsx:1 / backend/src/main/java/com/cell/platform/service/GameRecordService.java:18|
|E-036 독립 컬러화 계정·세션|US-036|컬러화 사용자(별도 계정) 사용자는 독립 컬러화 계정·세션 기능을 사용하여 자신의 DICOM 작업을 저장한다.|미정|미정|정적 구현 확인|컬러화 로그인 상태 / 중복·오입력·미로그인 API거부|POST COLOR:/api/auth/register;POST COLOR:/api/auth/login;POST COLOR:/api/auth/logout;GET COLOR:/api/auth/me; 컬러화POC/templates/index.html:1 / ColorizerStore|
|E-037 DICOM 작업·업로드·복원·삭제|US-037|컬러화 사용자 사용자는 DICOM 작업·업로드·복원·삭제 기능을 사용하여 여러 DICOM 작업을 이어 처리한다.|미정|미정|정적 구현 확인|본인작업 조회·복원 / 다른계정 접근·quota·손상영상 오류; batch삭제는본인만|POST COLOR:/api/batches;GET COLOR:/api/batches;POST COLOR:/api/batches/<batch_id>/files;POST COLOR:/api/batches/<batch_id>/remove-items;GET COLOR:/api/batches/<batch_id>;DELETE COLOR:/api/batches/<batch_id>;GET COLOR:/api/items/<item_id>; 컬러화POC/static/app.js:1 / ColorizerStore|
|E-038 DICOM 파일명·촬영유형 필터|US-038|컬러화 사용자 사용자는 DICOM 파일명·촬영유형 필터 기능을 사용하여 작업목록을 촬영조건과 이름으로 찾는다.|미정|미정|정적 구현 확인|지원촬영조건·본인파일 / 경로분리문자/허용안된이름 거부; 분류불가 미확인|PATCH COLOR:/api/items/<item_id>/name;POST COLOR:/api/batches/<batch_id>/reset-item-names; 컬러화POC/static/app.js:1 / ColorizerStore|
|E-039 DICOM 정규화·컬러맵·설정저장|US-039|컬러화 사용자 사용자는 DICOM 정규화·컬러맵·설정저장 기능을 사용하여 명암·컬러 결과를 비교한다.|미정|미정|정적 구현 확인|지원설정·유효프레임 / 미지원맵·값범위·압축코덱 오류|POST COLOR:/api/items/<item_id>/render;PUT COLOR:/api/items/<item_id>/settings;POST COLOR:/api/items/<item_id>/download; 컬러화POC/static/app.js:1 / dicom_processing|
|E-040 DICOM ROI 라벨·좌표 저장|US-040|컬러화 사용자 사용자는 DICOM ROI 라벨·좌표 저장 기능을 사용하여 관심영역을 그려 라벨링한다.|미정|미정|정적 구현 확인|본인영상·지원도형 / 잘못된좌표·영역초과·이름중복 거부|GET COLOR:/api/roi-labels;POST COLOR:/api/roi-labels;PUT COLOR:/api/roi-labels;GET COLOR:/api/items/<item_id>/annotations;PUT COLOR:/api/items/<item_id>/annotations;GET COLOR:/api/items/<item_id>/annotations/via; 컬러화POC/static/roi_geometry.js:1 / ColorizerStore|
|E-041 DICOM 일괄 내보내기·취소|US-041|컬러화 사용자 사용자는 DICOM 일괄 내보내기·취소 기능을 사용하여 영상 또는 ROI VIA 패키지를 묶어 받는다.|미정|미정|정적 구현 확인|본인job·렌더성공 / 다른계정job·취소·만료·파일오류|POST COLOR:/api/export-jobs;GET COLOR:/api/export-jobs/<job_id>;DELETE COLOR:/api/export-jobs/<job_id>;GET COLOR:/api/export-jobs/<job_id>/download; 컬러화POC/static/app.js:1 / 컬러화 export 함수|

### 4.3 기타 제약·비기능 요구사항(양식 3)

|ID|요구사항/현재 적용|근거|관련 US|
|---|---|---|---|
|NFR-01 JWT·역할 권한|인증 없는 보호 API는 401, 역할별 제한은403; 메서드 보안 누락 구간 미확정|backend/src/main/java/com/cell/platform/config/SecurityConfig.java:29|US-004|
|NFR-02 계정·비밀번호 보호|BCrypt 저장; 공개가입은STUDENT; 기존 토큰 즉시폐기는 확인되지 않음|backend/src/main/java/com/cell/platform/service/AuthService.java:31|US-001;US-002;US-006|
|NFR-03 TLS·응답 보안 헤더|HTTP301→HTTPS;TLS1.2/1.3;HSTS·SAMEORIGIN·nosniff·Referrer-Policy|frontend/nginx.conf:1|US-004;US-030|
|NFR-04 업로드 크기·입력 제약|CELL multipart 요청 전체50MB;컬러화 개별512MB·요청추가16MiB·기본사용자10GiB|backend/src/main/resources/application-dev.yml:24;컬러화POC/app.py:48|US-011;US-012;US-037|
|NFR-05 동일학생 데이터 경계|학생 결과/제출조회 studentId를 principal로 치환;신고studentId는body신뢰(별도위험)|backend/src/main/java/com/cell/platform/controller/SubmissionController.java:30|US-016;US-017;US-025|
|NFR-06 데이터 무결성|JPA트랜잭션;FK3개;제출(student,crop)·행렬(student,task) DB unique미선언|backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:8|US-016;US-018;US-028|
|NFR-07 장애·시간초과 처리|AI예외T002/500;Nginx api read120s/colorizer300s;WebClient·Axios 명시timeout없음|backend/src/main/java/com/cell/platform/service/AiClientService.java:45;frontend/nginx.conf:34|US-011;US-012;US-032|
|NFR-08 파일·영구 저장|MySQL·컬러화named volume·공유data bind;자동백업·복구시험정책 근거없음|docker-compose.yml:1|US-030;US-037;US-041|
|NFR-09 표시·응답 효율|원본썸네일최대320·AI시작시모델1회로딩·컬러화캐시12;성능실측없음|backend/src/main/java/com/cell/platform/service/FileStorageService.java:25;ai-server/app/services/model_loader.py:16|US-030;US-032;US-039|
|NFR-10 세션 일관성|탭 간 계정변경 시 구세션요청/응답 취소;localStorage는XSS위험을없애지않음|frontend/src/utils/authSession.js:20;frontend/src/api/createApiClient.js:9|US-003|
|NFR-11 외부·브라우저 호환성|React SPA;CORSlocalhost5173/HTTPSdomain;정식브라우저·OS호환시험표없음|frontend/src/App.jsx:1;backend/src/main/java/com/cell/platform/config/SecurityConfig.java:81|US-004;US-031|
|NFR-12 컬러화 계정격리·ROI검증|소유자검사·signedcookie·WAL·좌표/개수제약;CELLJWT/DB와분리|컬러화POC/app.py:217;컬러화POC/app.py:381;컬러화POC/persistence.py:17|US-036;US-037;US-040|

## 5. D05 — 스프린트 백로그용 전체 태스크 후보

### 5.1 해당 차수·개발기간·요구사항

**실제 Sprint 차수·기간·배정된 요구사항은 미확인이다. 전 항목 Sprint 미배정.** D04의 E/US/스토리/작업량/우선순위를 그대로 재사용한다. 공식 차수·기간 없이 N차 완료 태스크라고 표시하지 않는다. 설명용 묶음 제안은 “인증/계정”, “과제/AI”, “학습/GT”, “분석/진단/라벨”, “독립 컬러화”, “검증/운영”이며 실제 과거 Sprint가 아니다.

### 5.2 태스크(양식: US_ID·스토리 요약·TK_ID·태스크명·담당자·종료일·비고)

각 US를 검증·핵심 로직과 화면/연결 작업으로 나눴다. **현재 소스에서 역으로 도출한 후보**이며 완료율·실제 공수·담당·종료일을 뜻하지 않는다. 아래 정적 상태는 개발 완료%와 별개다.

|US_ID|스토리 요약|TK_ID|태스크명|담당자|종료일|모듈·파일·정적 상태/확인 방법|
|---|---|---|---|---|---|---|
|US-001|로그인|TK-001-01|계정 자격 검증|미정|미정|backend/src/main/java/com/cell/platform/service/AuthService.java:26; 정적 구현 확인; ALG-01·ST-001-N/X 검토|
|US-001|로그인|TK-001-02|인증 API와 역할별 로그인 UI|미정|미정|frontend/src/pages/LoginPage.jsx; 정적 구현 확인; ALG-01·ST-001-N/X 검토|
|US-002|학생 회원가입|TK-002-01|명단 기반 가입 판정|미정|미정|backend/src/main/java/com/cell/platform/service/AuthService.java:26; 정적 구현 확인; ALG-01·ST-002-N/X 검토|
|US-002|학생 회원가입|TK-002-02|가입 폼과 가입 검증·명단 연결|미정|미정|frontend/src/pages/LoginPage.jsx; 정적 구현 확인; ALG-01·ST-002-N/X 검토|
|US-003|로그아웃·다중 탭 계정 동기화|TK-003-01|브라우저 세션 전환|미정|미정|backend/src/main/java/com/cell/platform/config/JwtAuthFilter.java:17; 정적 구현 확인; ALG-02·ST-003-N/X 검토|
|US-003|로그아웃·다중 탭 계정 동기화|TK-003-02|세션 유틸과 Axios·이미지·게임 요청 연결|미정|미정|frontend/src/utils/authSession.js; 정적 구현 확인; ALG-02·ST-003-N/X 검토|
|US-004|서버·화면 권한 제어|TK-004-01|역할 접근 규칙|미정|미정|backend/src/main/java/com/cell/platform/config/SecurityConfig.java:24; 정적 구현 확인; ALG-01·ST-004-N/X 검토|
|US-004|서버·화면 권한 제어|TK-004-02|라우트 guard와 서버 URL matcher|미정|미정|frontend/src/App.jsx; 정적 구현 확인; ALG-01·ST-004-N/X 검토|
|US-005|관리자 사용자 목록·생성|TK-005-01|관리자 계정 생성|미정|미정|backend/src/main/java/com/cell/platform/service/AdminService.java:37; 정적 구현 확인; ALG-10·ST-005-N/X 검토|
|US-005|관리자 사용자 목록·생성|TK-005-02|사용자 관리 폼·API·해시 저장|미정|미정|frontend/src/pages/AdminPage.jsx; 정적 구현 확인; ALG-10·ST-005-N/X 검토|
|US-006|가입 승인·비활성화·삭제|TK-006-01|계정 상태 변경|미정|미정|backend/src/main/java/com/cell/platform/service/AdminService.java:37; 정적 구현 확인; ALG-10·ST-006-N/X 검토|
|US-006|가입 승인·비활성화·삭제|TK-006-02|계정 상태·삭제 UI와 보호 로직|미정|미정|frontend/src/pages/AdminPage.jsx; 정적 구현 확인; ALG-10·ST-006-N/X 검토|
|US-007|학생 사전 명단 관리|TK-007-01|학생 명단 등록|미정|미정|backend/src/main/java/com/cell/platform/service/AdminService.java:37; 정적 구현 확인; ALG-10·ST-007-N/X 검토|
|US-007|학생 사전 명단 관리|TK-007-02|명단 입력·중복 판정·가입 상태 연계|미정|미정|frontend/src/pages/AdminPage.jsx; 정적 구현 확인; ALG-10·ST-007-N/X 검토|
|US-008|동물 종 조회·표시|TK-008-01|종 메타데이터 제공|미정|미정|backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24; 정적 구현 확인; ALG-10·ST-008-N/X 검토|
|US-008|동물 종 조회·표시|TK-008-02|종 응답 DTO와 공통 배지 연결|미정|미정|frontend/src/components/SpeciesBadge.jsx; 정적 구현 확인; ALG-10·ST-008-N/X 검토|
|US-009|종 생성·이름 수정|TK-009-01|동물 종 관리|미정|미정|backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24; 정적 구현 확인; ALG-10·ST-009-N/X 검토|
|US-009|종 생성·이름 수정|TK-009-02|종 설정 폼과 종 검증·저장|미정|미정|frontend/src/components/SpeciesDataSettings.jsx; 정적 구현 확인; ALG-10·ST-009-N/X 검토|
|US-010|기존 도말의 종 변경|TK-010-01|도말 종 편집|미정|미정|backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24; 정적 구현 확인; ALG-10·ST-010-N/X 검토|
|US-010|기존 도말의 종 변경|TK-010-02|도말별 선택 UI와 Task 종 관계 갱신|미정|미정|frontend/src/components/TaskSpeciesEditor.jsx; 정적 구현 확인; ALG-10·ST-010-N/X 검토|
|US-011|단일 도말 업로드·AI 과제 생성|TK-011-01|단일 영상 처리|미정|미정|backend/src/main/java/com/cell/platform/service/TaskService.java:34; 정적 구현 확인·주 UI 연결 미확인; ALG-03·ST-011-N/X 검토|
|US-011|단일 도말 업로드·AI 과제 생성|TK-011-02|업로드 API·파일 저장·AI 클라이언트 연계|미정|미정|frontend/src/api/tasks.js; 정적 구현 확인·주 UI 연결 미확인; ALG-03·ST-011-N/X 검토|
|US-012|다중 도말 과제 생성|TK-012-01|묶음 과제 생성|미정|미정|backend/src/main/java/com/cell/platform/service/TaskService.java:34; 정적 구현 확인; ALG-03·ST-012-N/X 검토|
|US-012|다중 도말 과제 생성|TK-012-02|다중 선택 UI와 Assignment·Task 생성 트랜잭션|미정|미정|frontend/src/pages/ExpertPage.jsx; 정적 구현 확인; ALG-03·ST-012-N/X 검토|
|US-013|과제 조회·선택·진행률|TK-013-01|학습 목록·이어풀기|미정|미정|backend/src/main/java/com/cell/platform/service/TaskService.java:34; 정적 구현 확인; ALG-04·ST-013-N/X 검토|
|US-013|과제 조회·선택·진행률|TK-013-02|과제 그룹 UI와 crop·답안 조회|미정|미정|frontend/src/pages/StudentPage.jsx; 정적 구현 확인; ALG-04·ST-013-N/X 검토|
|US-014|마감일 설정·변경|TK-014-01|마감 변경|미정|미정|backend/src/main/java/com/cell/platform/service/TaskService.java:34; 정적 구현 확인; ALG-04·ST-014-N/X 검토|
|US-014|마감일 설정·변경|TK-014-02|마감 편집 UI와 시간 검증·일괄 갱신|미정|미정|frontend/src/components/AnalyticsFeedback.jsx; 정적 구현 확인; ALG-04·ST-014-N/X 검토|
|US-015|과제·도말 삭제|TK-015-01|과제 삭제|미정|미정|backend/src/main/java/com/cell/platform/service/TaskService.java:34; 정적 구현 확인; ALG-04·ST-015-N/X 검토|
|US-015|과제·도말 삭제|TK-015-02|삭제 확인 UI와 DB 관련 레코드 정리|미정|미정|frontend/src/components/AnalyticsFeedback.jsx; 정적 구현 확인; ALG-04·ST-015-N/X 검토|
|US-016|학생 세포 답안 저장·수정|TK-016-01|답안 upsert·잠금|미정|미정|backend/src/main/java/com/cell/platform/service/SubmissionService.java:46; 정적 구현 확인; ALG-05·ST-016-N/X 검토|
|US-016|학생 세포 답안 저장·수정|TK-016-02|분류 버튼·이어풀기 API와 제출 로직|미정|미정|frontend/src/pages/StudentPage.jsx; 정적 구현 확인; ALG-05·ST-016-N/X 검토|
|US-017|학생 결과·오답 복습|TK-017-01|결과 공개·복습|미정|미정|backend/src/main/java/com/cell/platform/service/SubmissionService.java:46; 정적 구현 확인; ALG-06·ST-017-N/X 검토|
|US-017|학생 결과·오답 복습|TK-017-02|학습결과 UI와 채점·결과 공개 조건|미정|미정|frontend/src/components/StudentReviewPanel.jsx; 정적 구현 확인; ALG-06·ST-017-N/X 검토|
|US-018|전문가 정답 확정·재수정|TK-018-01|GT 재확정|미정|미정|backend/src/main/java/com/cell/platform/service/CropService.java:23; 정적 구현 확인; ALG-07·ST-018-N/X 검토|
|US-018|전문가 정답 확정·재수정|TK-018-02|수정 UI·정답 저장·혼동행렬 소급 갱신|미정|미정|frontend/src/components/AnalyticsFeedback.jsx; 정적 구현 확인; ALG-07·ST-018-N/X 검토|
|US-019|세포 이동·GT 완료 표시|TK-019-01|GT 진행률·내비게이션|미정|미정|backend/src/main/java/com/cell/platform/service/StatsService.java:21; 정적 구현 확인; ALG-07·ST-019-N/X 검토|
|US-019|세포 이동·GT 완료 표시|TK-019-02|세포 목록·이동 버튼·도말/과제 배지|미정|미정|frontend/src/components/AnalyticsFeedback.jsx; 정적 구현 확인; ALG-07·ST-019-N/X 검토|
|US-020|세포 통계·학생별 선택자|TK-020-01|투표·정답률 집계|미정|미정|backend/src/main/java/com/cell/platform/service/StatsService.java:21; 정적 구현 확인; ALG-08·ST-020-N/X 검토|
|US-020|세포 통계·학생별 선택자|TK-020-02|공통 분석 UI와 통계 DTO 집계|미정|미정|frontend/src/components/AnalyticsFeedback.jsx; 정적 구현 확인; ALG-08·ST-020-N/X 검토|
|US-021|도말별 학생 응답 비교표|TK-021-01|학생 비교표 계산|미정|미정|backend/src/main/java/com/cell/platform/service/StatsService.java:21; 정적 구현 확인; ALG-08·ST-021-N/X 검토|
|US-021|도말별 학생 응답 비교표|TK-021-02|학생응답 유틸·비교표 컴포넌트|미정|미정|frontend/src/components/StudentResponsesPanel.jsx; 정적 구현 확인; ALG-08·ST-021-N/X 검토|
|US-022|학생별 학습 이력·세포별 결과|TK-022-01|학습 이력 요약|미정|미정|backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:24; 정적 구현 확인; ALG-09·ST-022-N/X 검토|
|US-022|학생별 학습 이력·세포별 결과|TK-022-02|학생 관리 UI와 학습 이력 집계 서비스|미정|미정|frontend/src/components/StudentManagement.jsx; 정적 구현 확인; ALG-09·ST-022-N/X 검토|
|US-023|진단·누적 혼동행렬|TK-023-01|혼동행렬 집계|미정|미정|backend/src/main/java/com/cell/platform/service/SubmissionService.java:46; 정적 구현 확인; ALG-06·ST-023-N/X 검토|
|US-023|진단·누적 혼동행렬|TK-023-02|학생별·전체 누적 행렬 UI와 집계|미정|미정|frontend/src/components/StudentManagement.jsx; 정적 구현 확인; ALG-06·ST-023-N/X 검토|
|US-024|진단평가 문제 생성|TK-024-01|진단 표본 추출|미정|미정|backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:25; 정적 구현 확인; ALG-11·ST-024-N/X 검토|
|US-024|진단평가 문제 생성|TK-024-02|분포 입력 UI·manifest 파싱·표본 저장|미정|미정|frontend/src/pages/ExpertPage.jsx; 정적 구현 확인; ALG-11·ST-024-N/X 검토|
|US-025|문제 세포 신고|TK-025-01|문제 신고 생성|미정|미정|backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18; 정적 구현 확인; ALG-12·ST-025-N/X 검토|
|US-025|문제 세포 신고|TK-025-02|신고 모달과 신고 저장 API|미정|미정|frontend/src/pages/StudentPage.jsx; 정적 구현 확인; ALG-12·ST-025-N/X 검토|
|US-026|신고 조회·분류|TK-026-01|신고 검토|미정|미정|backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18; 정적 구현 확인; ALG-12·ST-026-N/X 검토|
|US-026|신고 조회·분류|TK-026-02|신고 목록·필터와 응답 DTO|미정|미정|frontend/src/components/AnalyticsFeedback.jsx; 정적 구현 확인; ALG-12·ST-026-N/X 검토|
|US-027|라벨링 ZIP/VIA 내보내기|TK-027-01|VIA export|미정|미정|backend/src/main/java/com/cell/platform/service/LabelingService.java:34; 정적 구현 확인; ALG-13·ST-027-N/X 검토|
|US-027|라벨링 ZIP/VIA 내보내기|TK-027-02|ZIP 다운로드 UI·VIA 좌표/클래스 매핑|미정|미정|frontend/src/components/AnalyticsFeedback.jsx; 정적 구현 확인; ALG-13·ST-027-N/X 검토|
|US-028|VIA 라벨 가져오기|TK-028-01|VIA import|미정|미정|backend/src/main/java/com/cell/platform/service/LabelingService.java:34; 정적 구현 확인; ALG-13·ST-028-N/X 검토|
|US-028|VIA 라벨 가져오기|TK-028-02|JSON 선택 UI·cropId 매핑·정답 갱신|미정|미정|frontend/src/components/AnalyticsFeedback.jsx; 정적 구현 확인; ALG-13·ST-028-N/X 검토|
|US-029|원본·crop 데이터 목록 관리|TK-029-01|관리자 영상 목록|미정|미정|backend/src/main/java/com/cell/platform/service/AdminService.java:37; 정적 구현 확인; ALG-10·ST-029-N/X 검토|
|US-029|원본·crop 데이터 목록 관리|TK-029-02|영상 목록·검색 UI와 집계 DTO|미정|미정|frontend/src/pages/AdminPage.jsx; 정적 구현 확인; ALG-10·ST-029-N/X 검토|
|US-030|인증된 영상 조회·썸네일|TK-030-01|영상 접근·축소|미정|미정|backend/src/main/java/com/cell/platform/config/WebConfig.java:11; 정적 구현 확인; ALG-03·ST-030-N/X 검토|
|US-030|인증된 영상 조회·썸네일|TK-030-02|인증 이미지 컴포넌트와 리소스·썸네일 설정|미정|미정|frontend/src/components/AuthImage.jsx; 정적 구현 확인; ALG-03·ST-030-N/X 검토|
|US-031|영상 화면 조정|TK-031-01|영상 표시 필터|미정|미정|프런트엔드 전용; 정적 구현 확인; ALG-14·ST-031-N/X 검토|
|US-031|영상 화면 조정|TK-031-02|공통 화면조절 hook과 Canvas/CSS 적용|미정|미정|frontend/src/components/ImageDisplayControls.jsx; 정적 구현 확인; ALG-14·ST-031-N/X 검토|
|US-032|AI 세포 탐지·crop·분류|TK-032-01|AI 추론 파이프라인|미정|미정|backend/src/main/java/com/cell/platform/service/AiClientService.java:20; 정적 구현 확인; ALG-15·ST-032-N/X 검토|
|US-032|AI 세포 탐지·crop·분류|TK-032-02|탐지·crop·분류와 응답 계약|미정|미정|ai-server/app/services/pipeline.py; 정적 구현 확인; ALG-15·ST-032-N/X 검토|
|US-033|확정 학습 데이터 조회|TK-033-01|확정 라벨 추출|미정|미정|backend/src/main/java/com/cell/platform/service/CropService.java:23; 정적 구현 확인·주 UI 연결 미확인; ALG-16·ST-033-N/X 검토|
|US-033|확정 학습 데이터 조회|TK-033-02|학습 데이터 DTO·조회 API|미정|미정|frontend/src/api/crops.js; 정적 구현 확인·주 UI 연결 미확인; ALG-16·ST-033-N/X 검토|
|US-034|AI 재학습·pseudo-label 확장|TK-034-01|재학습 골격 검토|미정|미정|backend/src/main/java/com/cell/platform/service/PseudoLabelService.java:9; 부분 구현/계획; ALG-16·ST-034-N/X 검토|
|US-034|AI 재학습·pseudo-label 확장|TK-034-02|기존 TODO와 미연결 경계 기록|미정|미정|ai-server/app/routers/retrain_router.py; 부분 구현/계획; ALG-16·ST-034-N/X 검토|
|US-035|관리자 부가 게임·기록|TK-035-01|부가 게임 기록|미정|미정|backend/src/main/java/com/cell/platform/service/GameRecordService.java:18; 정적 구현 확인; ALG-17·ST-035-N/X 검토|
|US-035|관리자 부가 게임·기록|TK-035-02|게임iframe·인증연결·순위 API|미정|미정|frontend/src/pages/BombGamePage.jsx; 정적 구현 확인; ALG-17·ST-035-N/X 검토|
|US-036|독립 컬러화 계정·세션|TK-036-01|컬러화 계정|미정|미정|ColorizerStore; 정적 구현 확인; ALG-18·ST-036-N/X 검토|
|US-036|독립 컬러화 계정·세션|TK-036-02|별도 인증 UI·세션·SQLite 사용자|미정|미정|컬러화POC/templates/index.html; 정적 구현 확인; ALG-18·ST-036-N/X 검토|
|US-037|DICOM 작업·업로드·복원·삭제|TK-037-01|DICOM 영구 작업|미정|미정|ColorizerStore; 정적 구현 확인; ALG-18·ST-037-N/X 검토|
|US-037|DICOM 작업·업로드·복원·삭제|TK-037-02|배치 UI·파일검사·SQLite 영구 저장|미정|미정|컬러화POC/static/app.js; 정적 구현 확인; ALG-18·ST-037-N/X 검토|
|US-038|DICOM 파일명·촬영유형 필터|TK-038-01|파일명·촬영조건|미정|미정|ColorizerStore; 정적 구현 확인; ALG-18·ST-038-N/X 검토|
|US-038|DICOM 파일명·촬영유형 필터|TK-038-02|촬영메타 파싱·백필·필터·이름편집|미정|미정|컬러화POC/static/app.js; 정적 구현 확인; ALG-18·ST-038-N/X 검토|
|US-039|DICOM 정규화·컬러맵·설정저장|TK-039-01|DICOM 시각화|미정|미정|dicom_processing; 정적 구현 확인; ALG-19·ST-039-N/X 검토|
|US-039|DICOM 정규화·컬러맵·설정저장|TK-039-02|정규화·컬러맵 UI·픽셀처리·설정저장|미정|미정|컬러화POC/static/app.js; 정적 구현 확인; ALG-19·ST-039-N/X 검토|
|US-040|DICOM ROI 라벨·좌표 저장|TK-040-01|ROI 검증|미정|미정|ColorizerStore; 정적 구현 확인; ALG-20·ST-040-N/X 검토|
|US-040|DICOM ROI 라벨·좌표 저장|TK-040-02|ROI편집기·기하유틸·좌표/라벨 저장|미정|미정|컬러화POC/static/roi_geometry.js; 정적 구현 확인; ALG-20·ST-040-N/X 검토|
|US-041|DICOM 일괄 내보내기·취소|TK-041-01|내보내기 작업|미정|미정|컬러화 export 함수; 정적 구현 확인; ALG-21·ST-041-N/X 검토|
|US-041|DICOM 일괄 내보내기·취소|TK-041-02|export UI·작업큐·ZIP·취소 처리|미정|미정|컬러화POC/static/app.js; 정적 구현 확인; ALG-21·ST-041-N/X 검토|

### 5.3 소요 기술(양식 4)

|번호|도구/환경·필요 내용|담당자|완료일|비고|
|---|---|---|---|---|
|1|React/Vite·상태/세션·Canvas·Axios|미정|미정|소스 구현 존재. 팀원의 설치·학습 완료는 미확인|
|2|Java17·Spring Security/JPA/WebClient·Gradle|미정|미정|클래스 명세·API·ORM 참고|
|3|Python·FastAPI·YOLO·PyTorch·OpenCV|미정|미정|추론 연결; 학습 trainer 개발은 미완성|
|4|MySQL·수동 SQL·관계/unique·트랜잭션|미정|미정|DB 실제 스키마와 ORM 차이 확인 필요|
|5|Docker·Nginx·TLS·환경변수|미정|미정|배포 설정 존재; 이 조사에서는 설치/배포 안 함|
|6|Flask·SQLite·pydicom·ROI 기하|미정|미정|별도 연계서비스 범위 확정 필요|
|7|JUnit/Mockito·Node test·unittest·시스템 시험|미정|미정|시험 준비·수행·결과 기록 별도|

### 5.4 변경 태스크 이력(양식 5)

기존 내용 수정은 이번 ID를 바꾸지 않고 비고에 commit을 추가하는 방식으로 제안한다. 실제 Git 단서: GT수정 US-018(`17d9434`), 복습 US-017(`7238289`), 영상조정 US-031(`e110773`), 종 US-008~010(`ccc02c2`), 학생응답 US-021(`b5e1a84`), 세션 US-003(`90a51dd`), 이력 US-022(`45faecd`), 공통분석 US-019~023(`94aeb1a`). 이를 1·2차 Sprint 기록으로 바꾸지 않는다.

## 6. D06 — 개발 명세서 작성 자료

### 6.1 태스크·클래스·모듈

양식의 태스크 표는 D05의 동일 TK82개를 사용한다. 담당자·종료일·완료%는 모두 미정이며 정적 구현 상태만 별도 열로 기입한다. 상세기술목록의 **C-ID 전체 타입·멤버**, F-ID 프런트엔드 함수 모듈, PY-ID Python 클래스/함수는 생략 없이 원본 위치와 시그니처를 제공한다. Java의 데이터 타입/반환 타입과 public/private/package-private 접근 제어자를 분리했다. Lombok·record의 자동생성 멤버는 명시 소스 멤버와 구분한다.

클래스도는 `diagrams/04_클래스_전체.puml`, `05_클래스_업무.puml`, `06_클래스_저장소.puml`를 사용한다. 설정·예외·테스트 타입도 상세기술목록에 포함하며, 스프린트 경계는 미배정이다.

### 6.2 핵심 알고리즘

ALG-01~21에서 소속 함수·입출력·전제·단계·예외·임계값·API/DB·US/TK를 정리한다. 중요 흐름은 다이어그램 08~10에 있다. 다음 오해를 피한다.

- 영상1장은 내부 Task, 여러 도말을 묶은 사용자 과제는 Assignment다. 사용자별 배정 관계는 없음.
- 답변 선택 때 POST로 즉시 저장한다. 별도 임시저장 테이블이나 별도 최종제출 API는 없다. “제출하고 채점받기”는 결과 조회·공개 조건 검사다.
- 일반 과제의 정답은 finalLabel이며 AI pseudoLabel을 정답으로 채점하지 않는다. 진단평가는 final→gt→manifest 순서로 확인한다.
- GT 수정은 혼동행렬을 소급 갱신하지만 **VIA import 경로는 해당 backfill을 호출하지 않는다**.
- 학생 자기 결과 정확도는 채점 가능한 제출 답안 분모이고, 교수의 학생별 이력/도말비교표 점수는 모든 정답이 준비됐을 때 전체 문항(미응답 포함) 분모다. 같은 ‘정답률’로 무조건 비교하지 않는다.
- UI COMPLETE 배지는 finalLabel 존재 개수에서 계산한다. TaskStatus.COMPLETED로 실제 상태전환하는 흐름은 확인되지 않는다.
- 다중 업로드는 영상별 순차·동기 AI 호출이다. DB rollback과 별개로 이미 저장한 파일을 되돌리는 보상 처리는 확인되지 않는다.

### 6.3 DB 스키마

이번에는 ORM만 보지 않고 **MySQL information_schema를 읽기 전용 조회**하여 10개 테이블·61개 컬럼·3개 FK와 index/nullable/default를 확인했다. DICOM SQLite도 `mode=ro`로 sqlite_master만 읽었다. 사용자·영상·답안 레코드는 조회하지 않았다.

실제 FK는 `crops.task_id→tasks.id`, `submissions.crop_id→crops.id`, `tasks.animal_species_id→animal_species.id` 3개다. Assignment↔Task, User↔Submission/신고/행렬/명단은 스칼라 ID 기반 논리관계이며 DB FK로 표시하지 않는다. FK delete/update는 관측상 NO ACTION이다. Task→Crop ORM cascade/orphanRemoval과 서비스 삭제 순서는 별도다. 상세 컬럼·정밀 datatype·제약은 상세 DB 절과 `diagrams/07_ERD_MySQL.mmd`를 사용한다. 프로시저·트리거는 현재 celldb metadata 조회에서 0개였다(다른 schema는 대상 아님).

### 6.4 전체 API와 양식용 외부 인터페이스 구분

자체 선언 API는 Spring49·FastAPI3·독립 Flask28, 총80개이다. 정적 이미지 리소스 `/data/**`, SPA·정적 파일, 프레임워크 자동 문서/오류 경로는 별도 범주다. 상세기술목록에는 ID·메서드·전체경로·서버 권한·입력·응답타입/필드·오류·호출자·Controller/Service·US 근거를 전부 기록했다.

양식 3.4의 ‘외부 인터페이스 대상만’은 **독립 실행 컴포넌트 경계를 넘는 계약**을 뜻하는 기준으로 아래 표를 사용한다. 같은 Spring 내부 Service/Repository 호출은 외부 인터페이스가 아니다. 브라우저↔백엔드는 사용자 인터페이스용 HTTP 경계이고, backend↔AI가 서버 간 연동의 핵심이다.

|인터페이스명|클래스명/모듈|인터페이스 대상|설명|
|---|---|---|---|
|도말 AI 분석|AiClientService.analyze/requestAnalysis|FastAPI `POST /api/analyze`|multipart file→crop_filename/bbox/prediction/confidence. 내부망·별도 AI 인증 없음|
|확정 학습 데이터 조회(미완성 역방향)|retrain_router._fetch_training_data|Spring `GET /api/training-data`|현재 localhost주소·JWT누락·trainer미구현. 완성 연동으로 쓰지 않음|
|웹 업무 REST|src/api + createApiClient|Spring `/api/**`|JWT Bearer, JSON/multipart/blob. 상세 전체목록에서 사용 사례별 선택|
|영상 파일 HTTP|AuthImage/fetchAuthImage + WebConfig|Spring `/data/**`|인증 fetch→blob. FS 원본/crop/썸네일|
|VIA 파일 교환|LabelingService|외부 라벨링 도구와 파일|VIA2.0.10 JSON+영상ZIP; 외부 웹사이트 API 직접호출 아님|
|독립 DICOM 웹 API|컬러화POC/static/app.js|Flask `/colorizer/api/**`|자체세션·SQLite. CELL JWT/API와 데이터 동기화 없음|

### 6.5 GUI·참고사항

UI-01~19는 상세기술목록 GUI 표를 사용한다. 학생→전문가→관리자 순서의 캡처 계획과 경로를 제공했으며, 이번 조사에서 사용자 로그인 화면을 실제 열거나 새 스크린샷을 촬영하지 않았다. definition의 PNG는 클래스 매핑 참고자료이지 최신 CELL 화면 캡처가 아니다.

오픈소스 버전·라이선스는 OSS 절. 프로젝트 자체 소스/가중치/데이터의 배포 허가는 라이브러리 라이선스와 별개로 확인해야 한다. 양식 목차·본문 절 번호가 어긋난 부분은 항목명(클래스/핵심알고리즘/DB/API/GUI)을 기준으로 연결했으며, 학교 양식의 번호를 임의 삭제·개편하지 않았다.

## 7. D07 — 시스템 시험결과서용 자료

별도 `CELL_시스템시험_케이스와결과.md`에 **ST94개 후보**와 기존 시험/빌드 근거를 정리했다. 이번 조사는 시스템 테스트를 새로 수행하지 않았으므로 **X=0, Y=0, 실패율 Y/X는 산출 불가**다. 미수행·부분구현으로 차단된 케이스를 PASS로 표시하지 않았다.

문서화 초안 US41 중 정적 구현과 UI/연결 근거를 분류한 수량은 38개, API 구현·주 UI 미확인2개, 재학습부분1개다. 이를 임시 명세로 고정한다면 보수적 A=38/B=41이지만, **공식 요구사항 확정·시스템시험 전에는 공식 기능완료율로 쓰지 않는다**. 기능구현범위 A/B=1.0·실패율0.0은 사용자 제공 양식의 **목표 기준**이다. NFR12는 별도 판정한다.

[기존 기록] 2026-10-15 같은 커밋에서 Node 회귀테스트19개 및 Vite build 성공이 이전 작업 대화에 남아 있다. 원본 결과 파일/공식 시험환경표는 저장소에 보관되어 있지 않아 전사 요약으로 분리했다. 2026-09-29 기존 D01 근거자료는 백엔드 테스트 컴파일 오류29개, 컬러화 Python15개 중14개ok·1개Windows cleanup 오류, ROI JS통과를 적고 있다. 날짜·버전이 다른 기록으로 현재 전체 시스템 통과를 주장할 수 없다. 현재 테스트 소스에는 구필드 aiPrediction/aiConfidence와 구생성자를 참조하는 잔여 코드도 있다.

## 8. D08 — 프로젝트 결과보고서용 요약과 부록 재료

### 8.1 2쪽 요약 칸 후보

|요약 항목|넣을 수 있는 문안/자료|주의|
|---|---|---|
|프로젝트명 국문/영문|D01 1.1 명칭 후보 재사용|공식명 확정 Q-01|
|팀장·학과·학번·성명·역할·참여학생·교수·개발기간·작성/확인자|사용자 직접 입력|기술코드에서 도출 불가|
|GitHub 저장소|`https://github.com/C-E-L-L/DEV.git`|브랜치/commit도 함께 보관|
|시스템 설명|“AI 세포 후보 분석과 학생 분류 실습, 전문가 GT 검증·학생별 분석·복습을 지원하는 웹 플랫폼”|자동 재학습 완성으로 표현 금지|
|운영 환경|Docker 5서비스;Nginx HTTPS80/443;Spring8080;AI8001;MySQL3306;별도컬러화8501;볼륨/공유파일|논리/물리/실행관측 구분, 정식HW 별도확인|
|개발 적용 기술|React/Vite·Spring/JPA/Security·PyTorch/YOLO/DenseNet·MySQL·Docker/Nginx; 선택적 Flask/pydicom/SQLite|선언·lock·실행버전은 상세표|
|개발목표결과물|시스템구성/배포도·컴포넌트/패키지도·역할별GUI 캡처목록·소스/API/DB·시험후보|도면은 원문 제공, 실제GUI 캡처 추가 필요|
|프로젝트 산출물 목록|D02 2.6 표 재사용|공식 완료일·담당자 미정|
|시스템 활용 효과|AI 후보 준비와 답안/GT/복습 통합으로 교육·검토·라벨 축적을 지원할 것으로 기대|실제 사용자 평가·시간절감률·교육성취도 향상은 미측정|
|Key Words 5개|D01 키워드 후보 재사용|학교 최종선정 필요|

요약 양식의 ‘전체2쪽’과 상세 부록의 분량 적용 관계는 학교 확인 대상(Q-17)이다. 요약 칸에 기술목록 전체를 밀어 넣지 않고 아래 부록으로 분리한다.

### 8.2 상세 부록 1 — 최종 시스템 아키텍처(1.1 개요)

논리구성은 Browser→Nginx/React→Spring→MySQL/FS 및 Spring→FastAPI→FS다. 독립 컬러화는 Nginx→Flask→SQLite/자체파일이며 동일 도메인이나 동일계정은 아니다. compose가 정의한 기본 network에서 서비스명DNS로 통신한다. 이름을 명시한 추가 network는 없다. 물리 서버 수량·학교망/NAT·GPU 할당·백업대상 위치는 확인 필요다. 실제 배포관측은 Docker 실행/버전/스키마/JS파일명 범위이고, 공개망 E2E는 이번에 시험하지 않았다. 도면: `diagrams/02_시스템구성_배포.mmd`.

### 8.3 상세 부록 2 — 소프트웨어 아키텍처(2.1·2.2)

|번호|컴포넌트/패키지 이름|책임|비고|
|---|---|---|---|
|1|frontend pages/components|역할별 UI·공통 분석/학생 이력·Canvas·ROI 진입|독립 배포는 정적 Nginx 이미지|
|2|frontend api/context/utils|HTTP 계약·세션 동기화·표시 계산|공통코드·mock는 모드로 분기|
|3|backend controller/dto|HTTP입출력·파라미터·응답 모델|Spring 내부 패키지|
|4|backend service/domain|과제·정답·채점·통계·진단·라벨·계정 규칙|application layer와 domain 모델/port|
|5|backend infra/entity|JPA repository adapter·ORM·실제DB 저장|domain interface→CoreRepository→JpaRepository|
|6|backend config/exception/util|JWT·보안·리소스·seed/backfill·예외·Mapper|설정·공통기반|
|7|ai-server routers/services/models|모델 1회로드·탐지/crop/분류·응답 계약|독립 FastAPI 서비스|
|8|MySQL·공유 data|업무 메타데이터·영상·진단manifest|독립DB+파일 bind mount|
|9|컬러화POC|DICOM정규화·ROI·자체계정·export|별도Flask/SQLite|
|10|Docker/Nginx|build·서비스배치·프록시·TLS|관리형CI/CD 근거미발견|

도면: `diagrams/03_컴포넌트_패키지.mmd`. 패키지 표와 독립 배포 서비스 표를 혼동하지 않는다.

### 8.4 상세 부록 3 — 모듈 명세

상세기술목록의 C/F/PY 목록을 그대로 사용한다. 클래스명·역할·책임·메서드·비고가 동일 ID로 연결되어 있다. 새 보고서마다 같은 클래스를 다른 이름으로 다시 만들지 않는다. 대표 화면은 UI-01~19, 스크린샷은 추후 합성/시험계정으로 촬영한다.

## 9. 일관성·현재 한계와 개선 검토

아래 개선은 관측된 구현 경계에서 도출한 **제안**이며 현재 구현 사실이 아니다.

|ID|관측·근거|문서/운영 영향|개선 제안|
|---|---|---|---|
|ISS-01|약어 확장·국문명은 사용자단서, README설명과 별개|명칭을 코드검증 사실로 쓰지 않음|공식제목확정·README동기화|
|ISS-02|재학습router TODO·READY;localhost백엔드·JWT누락|교육/라벨 축적은 구현, 자동학습루프는 미완성|학습/검증/버전관리/승격/롤백 단계를 별도설계|
|ISS-03|definition9종·매핑13옵션·논문DenseNet121 vs 현재6종/201|옛연구의 모델·결과를현재모델로인용불가|데이터/가중치출처·학습기록·현재평가정리|
|ISS-04|README:221 제출URL /api/submissions vs 실제 /api/submit|설명 API 표 구버전|현재전체API목록으로문서갱신|
|ISS-05|README:204 EXPERT공개가입 vs AuthService거부|교수계정 생성절차 혼동|관리자생성절차로교정|
|ISS-06|PROJECT_STRUCTURE의 DDL create vs 현재dev update/compose validate|운영스키마자동생성으로오해|프로필별설정·수동SQL관리명시|
|ISS-07|@PreAuthorize존재하나 @EnableMethodSecurity미발견;DELETE task/assignment·task별diagnosticGET URL규칙누락|`AUTHENTICATED`만적용될위험(침투시험미수행)|서버역할규칙·권한회귀시험보완|
|ISS-08|training-data로그인만필요;학생응답결과는principal보호,report학생ID는body신뢰하며Task/Crop존재·소속도미검사|권한/위조신고·잘못된ID저장위험|역할/소유자·대상검사일관화|
|ISS-09|VIAimport가gt/final만수정·혼동행렬backfill미호출|실시간결과와저장행렬불일치가능|GT변경공통서비스·재집계검증|
|ISS-10|User상태는로그인시검사,JWT필터는claims만확인|비활성화/삭제후기존JWT즉시무효보장없음|토큰폐기정책·계정상태재검사검토|
|ISS-11|DB제출·행렬의논리유일키가unique아님|동시중복요청에서중복행위험(이번에재현하지않음)|유일성·락·재시도정책설계/부하시험|
|ISS-12|파일은원본두벌저장될수있고Task삭제에서FS삭제없음|고아파일·저장공간정리문제|보상처리·파일참조/삭제정책|
|ISS-13|답안마감·전GT/전답변일때잠금;GT수정은학생행렬갱신|임시저장/최종제출이라는별도상태는아님|UX문구와실제상태전이명세정리|
|ISS-14|정답확정후같은crop선택유지,이전/다음버튼존재|자동다음이동요청은미구현|선택적자동이동옵션검토|
|ISS-15|학생결과중일부제목은AI채점이나일반과제정답은finalLabel|AI예측비교로설명하면오류|GT기준표시·분모/미응답설명통일|
|ISS-16|AI파이프라인 async route 안의동기모델처리·영상별순차추론|동시처리/추론지연실측미확인|큐·worker·batch는측정후도입검토|
|ISS-17|전체통계·학습이력전체조회;GT확정시전체통계재조회|데이터증가시병목후보(확정원인은아님)|페이지네이션·집계API·증분갱신측정|
|ISS-18|원본표시필터만존재,artifact/basophil등확장미구현|영상복원/새클래스지원으로쓰면불일치|데이터기준·라벨정책·모델변경절차합의|
|ISS-19|과거테스트fixture구필드/생성자잔존|현재백엔드전체테스트통과근거없음|fixture동기화후단위/통합→시스템시험|
|ISS-20|TLS갱신스크립트·볼륨있으나예약실행/복구정책증거없음|운영자동화완료로단정불가|갱신·백업·복구·관측정책기록|
|ISS-21|컬러화/게임은실제연결되나교육핵심과분리|학교문서범위불확정|Q-03으로공식범위확정|

## 10. 사용자 확인 필요(중복 질문 통합)

|질문ID|관련 문서·절|확인할 항목|코드만으로 알 수 없는 이유|필요 답변/자료|현재 단서|
|---|---|---|---|---|---|
|Q-01|D01작품명·D02개요·D08제목|국문명·영문확장명·팀번호/팀명|사용자제공기존명과README공식표기범위다름|학교제출공식제목/팀정보|C.E.L.L.Platform·사용자D01단서|
|Q-02|D01인적·D02팀·D08작성확인|팀장·학부/과·학번·성명·공식역할·교수·서명·작성확인자|Git작성자는공식역할아님|공식팀원표·교수/서명절차|역할enum은사용자권한일뿐|
|Q-03|D01범위·D03/D04·D08|독립DICOM·부가게임공식포함여부|배포연결만으로졸업범위확정불가|포함/부록/제외결정|로그인링크·compose·/game|
|Q-04|D01배경·D02개요·D08효과|실제개발동기·기관/수업업무·기존문제|코드로의도/현장효과확정불가|요청서·인터뷰·기존업무설명|관련연구초안·교육/라벨흐름|
|Q-05|D02운영관리|정기/비정기/발표회의·GroundRules·의사결정|공식회의/규칙자료미발견|일정표·회의록·규칙|Gitmerge/수정이력|
|Q-06|D01기간·D02프로세스·D05/D06차수|공식개발기간·프로세스모형·실제Sprint차수/목표/기간|커밋날짜는공식일정아님|개발/스프린트계획·실적|2026-05~10Git이력|
|Q-07|D04작업량/우선순위·D05배정·D06완료|스토리공수·우선순위이유·담당·종료일·완료%|기록없음|기존백로그·팀합의·진척기록|US41·TK82후보|
|Q-08|D02/D07HW·D08운영|공식개발/운영/시험장비명·수량·CPU/RAM/GPU/OS·망|현재조사PC가공식장비인지는미확인|장비/운영표·지원내역|load_test권장사양만존재|
|Q-09|D02SW·문서도구·D07환경|팀IDE·한글/Word·브라우저/버전·네트워크·시험환경|코드의런타임선언과공식환경별개|환경표·라이선스/버전자료|Docker/Python/MySQL관측|
|Q-10|D01선행기술·D06참고·D08|definition초안의정식출처/논문상태·인용/재사용허가·특허/상용비교|초안·참고PDF만으로정식선행조사완료아님|공식서지·비교표·사용허가|DenseNet121/9종연구초안|
|Q-11|D01/D06AI·D07AI평가|가중치학습데이터출처/동의·분할·하이퍼파라미터·검증지표·선정근거|현재weights와학습기록연결미확인|dataset/model card·평가보고서·버전|2weights·추론코드6클래스|
|Q-12|D04향후범위·D06학습|자동재학습·새클래스·종별AI를최종범위에포함하는가|TODO와사용자희망은확정요구아님|완료범위/향후계획결정|US-034부분구현|
|Q-13|D07전체·D08검증성과|공식시험일·수행자·시나리오·입력·결과·정정/재시험|기존단위/빌드기록만으로시스템P/F못정함|학교시험표·원본로그·스크린샷|ST94후보·과거요약|
|Q-14|D07성능·D08활용효과|실제동시사용자/지연/모델성능·사용자평가·교육효과|문서기대수치는실측아님|성능로그·설문·실험설계/결과|load_test도구/기준|
|Q-15|D01고려·D06/08운영|백업·복구·TLS갱신예약·모니터링·보존/삭제·권한운영정책|설정/스크립트존재만으로정책실행확정불가|운영계획·실행/복구기록|볼륨·ssl-renew.ps1|
|Q-16|D06GUI·D08실행화면|학교제출용화면캡처·합성/시험계정준비|최신GUI를이번에직접열지않음|정식스크린샷·허용계정/시험데이터|UI19캡처목록|
|Q-17|D05/D06편집·D08분량|절번호불일치·D08요약2쪽과부록분량적용|학교규정판단불가|지도교수/학과안내|사용자제공양식항목설명|

## 11. 최종 검토·조사 한계

- 전체 자체 Java 타입(테스트 포함), Python 함수/클래스, 프런트엔드 모듈, 모든 명시 Controller/API/Entity를 상세기술목록에 기록했다. 자동추출은 소스 선언/시그니처 수준이며 Lombok/프레임워크 생성멤버와 컴파일 바이트코드는 별도다.
- Spring49개·AI3개·컬러화28개 명시경로의 Story 매핑을 검사했다. 컬러화 `GET /`, `GET /health`는 진입/운영용으로 별도 연결한다. API없는 프런트엔드 기능도 US-003/031로 기록했다.
- MySQL10·SQLite7테이블 전체, 실제 MySQLFK3개·SQLiteFK6개, 논리관계를 분리했다. baseline/class/member/API/DB/US/TK/ST 수량과 누락검사는 조사_검증기록에 있다.
- 자동 코드 조사로 호출/존재는 확인하되 보안 침투·운영부하·실제 계정 저장·마감변경·AI학습·대량추론·설치/배포는 하지 않았다. 메서드보안·입력/동시성 위험은 정적 우려이고 실제취약점재현이라고 쓰지 않는다.
- 기존 HWP원본·코드·설정·DB레코드는 변경하지 않았으며 이번 결과만 새 폴더에 작성했다. 원본코드·가중치·데이터셋·키·실제계정정보는 결과ZIP대상에서 제외한다.

**바로 사용할 수 있는 내용:** 기술구성, 역할/화면/업무흐름, US/TK초안, 실제 API·DB·클래스/함수, 현재구현·부분구현경계, 최신공통분석/학생이력설명, 편집가능도면.

**아직 확인해야 하는 내용:** 공식명/행정/실제Sprint·담당·일정·공수·장비·정식선행기술/데이터허가·시스템시험P/F·성과수치·실행화면·운영정책. Q-01~17을채우고공식문서를작성한다.

