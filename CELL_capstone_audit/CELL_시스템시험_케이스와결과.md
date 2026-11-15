# CELL 시스템 시험 — 케이스와 확보된 결과

기준: `juhun@94aeb1a`, 조사일2026-10-19. **현 구현 기반 문서화 초안**. 본문 대상은 최종 시스템의 시스템 시험이다. 단위·MVC·repository·함수 시험/빌드는 참고 증거로 분리한다. 이 문서의 ST는 새로 실행하지 않았다.

## 1. 프로젝트 개요·범위

CELL 메인 React/Spring/AI/MySQL/파일과 직접 연계된 독립 컬러화·관리자 게임의 문서화 US41개·NFR12개를 대상으로 ST94개를 도출했다. 독립 컬러화/게임의 학교 공식 포함 여부는 Q-03 미확정이다. 모델학습은 미구현 경계 자체를 기록하고 시험차단으로 둔다. 외부사이트/메일/SMS/실결제 API는 호출 코드가 발견되지 않아 케이스를 임의로 만들지 않았다. 공개망/NAT·브라우저/장비는 공식환경이 미확정이다.

## 2. 테스트 개요·통과 기준

사용자 제공 양식 목표는 기능구현범위 A/B=1.0, 실패율Y/X=0.0이다. A는 합의된 명세 기능 중 구현확인 기능 수, B는 명세 기능 수, X는 실제 수행한 **시스템 케이스 수**, Y는 그중 실패한 케이스 수다. 여기서는 US_ID를 기능 집계단위로 제안하며 NFR은 별도 판정한다. 미수행·차단을 분모X에 넣어 통과율을 높이지 않는다. 변경된공식명세범위를승인한뒤B를확정해야한다.

|집계|수량·판정|
|---|---|
|US 후보 B|41(학교 승인 전 임시 범위)|
|정적 UI/서버/업무 연결 근거 충분|38|
|API 존재·주 UI 미확인|US-011,US-033의2|
|부분 구현/계획|US-034의1|
|NFR 후보|12|
|시스템 시험 후보|94(US별정상·예외82 + NFR12)|
|이번 ST 실제 수행 X|0|
|PASS/FAIL/Y|PASS0·FAIL0·Y0; **미수행을PASS로보지않음**|
|미수행/차단|미수행92·차단2(US-034)|
|Y/X|X=0이므로산출불가|
|최종 판정|전체시스템시험통과주장불가.수행/환경/원본로그필요|

정적구현분류로임시A=38/B=41을계산할수는있지만이는공식완료율/학교시험성과가아니다. 기존 단위/빌드 기록의 통과수19를 X에 합산하지 않는다. 모델 정확도와 기능시험 통과도 합치지 않는다.

## 3. 시스템 테스트 케이스 전체

입력값은 모두 **합성 예시/실행 준비안**이다. 실제 수행에 사용된 입력 데이터가 아니다. 저장·삭제·마감·계정상태변경·AI오류 주입은 반드시 별도복제DB/FS/mock AI에서수행한다.

|Test ID|요구사항|테스트 항목|선행조건|합성 입력/시나리오|예상 출력/판정 포인트|근거|
|---|---|---|---|---|---|---|
|ST-001-N|US-001|로그인 정상 흐름|학생·EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; 활성 계정은 로그인 성공|username,password; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 본인 계정으로 역할별 작업을 시작한다: 비밀번호 BCrypt 비교·계정 상태 검사 후 JWT 발급|정상 결과: 역할별 첫 화면과 accessToken; 활성 계정은 로그인 성공|frontend/src/pages/LoginPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AuthService.java:26; ALG-01|
|ST-001-X|US-001|미승인 계정·틀린 비밀번호|학생·EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|격리환경에 ACTIVE/PENDING/INACTIVE 합성계정 준비;오입력 및 각상태로 로그인 → 격리환경에 ACTIVE/PENDING/INACTIVE 합성계정 준비;오입력 및 각상태로 로그인|활성 올바른자격만 JWT;PENDING/INACTIVE·오입력은거부(현코드400).실제비밀값기록안함|frontend/src/pages/LoginPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AuthService.java:26; ALG-01|
|ST-002-N|US-002|학생 회원가입 정상 흐름|비로그인 학생의 시험 계정·격리된 합성 fixture; 명단 등록 학생은 즉시 활성화|username,name,password,role=STUDENT; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 계정을 신청하고 명단·승인에 따라 참여한다: 아이디 중복·학생 이름·허용 역할 검사, 명단이면 ACTIVE 아니면 PENDING|정상 결과: 가입 결과 상태·메시지; 명단 등록 학생은 즉시 활성화|frontend/src/pages/LoginPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AuthService.java:26; ALG-01|
|ST-002-X|US-002|가입 금지 역할·중복·명단 유무|비로그인 학생 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|합성 ID로 STUDENT/EXPERT/ADMIN 가입 및 이름누락·중복을 비교 → 합성 ID로 STUDENT/EXPERT/ADMIN 가입 및 이름누락·중복을 비교|학생만가입;명단이면ACTIVE/없으면PENDING;교수/관리자·중복·빈이름거부|frontend/src/pages/LoginPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AuthService.java:26; ALG-01|
|ST-003-N|US-003|로그아웃·다중 탭 계정 동기화 정상 흐름|학생·EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; 새 세션은 모든 탭에 동기화|로그인·로그아웃·storage/focus/visibility 이벤트; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 계정을 바꿔도 이전 화면이 다른 계정으로 요청하지 않게 한다: 단일 localStorage 레코드와 sessionId; 구세션 요청·지연 응답 취소|정상 결과: 로그인/역할 홈으로 재이동; 새 세션은 모든 탭에 동기화|frontend/src/utils/authSession.js:1 / backend/src/main/java/com/cell/platform/config/JwtAuthFilter.java:17; ALG-02|
|ST-003-X|US-003|다른 탭 계정변경과 지연401|학생·EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|두 탭 시험계정A/B;이전 계정의 늦은200/401 응답을 모의서버에서 지연시킴 → 두 탭 시험계정A/B;이전 계정의 늦은200/401 응답을 모의서버에서 지연시킴|새세션보존·구응답폐기·구화면에서새계정토큰으로요청하지않음|frontend/src/utils/authSession.js:1 / backend/src/main/java/com/cell/platform/config/JwtAuthFilter.java:17; ALG-02|
|ST-004-N|US-004|서버·화면 권한 제어 정상 흐름|학생·EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; 권한별 URL 규칙에 맞게 접근|JWT·role·URL; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 권한이 있는 기능만 접근한다: React route guard와 Spring URL matcher 검사|정상 결과: 허용 화면/API 또는 401/403; 권한별 URL 규칙에 맞게 접근|frontend/src/App.jsx:1 / backend/src/main/java/com/cell/platform/config/SecurityConfig.java:24; ALG-01|
|ST-004-X|US-004|JWT 없음·변조·만료·다른 역할|학생·EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|격리된서버에서보호API에누락/합성변조/만료JWT와STUDENT→ADMIN URL 요청 → 격리된서버에서보호API에누락/합성변조/만료JWT와STUDENT→ADMIN URL 요청|미인증401·권한불일치403;문제의DELETE등은별도권한사례로확인|frontend/src/App.jsx:1 / backend/src/main/java/com/cell/platform/config/SecurityConfig.java:24; ALG-01|
|ST-005-N|US-005|관리자 사용자 목록·생성 정상 흐름|ADMIN의 시험 계정·격리된 합성 fixture; EXPERT/STUDENT 생성 가능|username,name,password,role; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 교수·학생 계정을 관리한다: 사용자 전체 조회; 중복 검사·비밀번호 해시 후 생성; ADMIN 생성 제한|정상 결과: 사용자 목록·생성 결과; EXPERT/STUDENT 생성 가능|frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37; ALG-10|
|ST-005-X|US-005|학생/전문가의 관리자 계정생성 접근|ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|STUDENT/EXPERT 시험JWT로 POST /api/admin/users → STUDENT/EXPERT 시험JWT로 POST /api/admin/users|403·신규계정저장없음|frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37; ALG-10|
|ST-006-N|US-006|가입 승인·비활성화·삭제 정상 흐름|ADMIN의 시험 계정·격리된 합성 fixture; 상태 변경이 다음 로그인 검사에 반영|userId,status 또는 username; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 학생의 서비스 참여 상태를 관리한다: 상태 enum 검증·관리자 변경 보호·삭제|정상 결과: 갱신 사용자 또는 삭제204; 상태 변경이 다음 로그인 검사에 반영|frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37; ALG-10|
|ST-006-X|US-006|관리자 보호·기존JWT 상태|ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|ADMIN대상상태/삭제요청거부확인;별도학생토큰발급후비활성화하여기존토큰효과관측 → ADMIN대상상태/삭제요청거부확인;별도학생토큰발급후비활성화하여기존토큰효과관측|ADMIN보호거부;기존JWT는현재즉시폐기없을가능성.기대한운영정책과실제동작을분리기록|frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37; ALG-10|
|ST-007-N|US-007|학생 사전 명단 관리 정상 흐름|ADMIN의 시험 계정·격리된 합성 fixture; 새 명단 항목 저장|studentIds 배열; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 예정된 학생의 가입을 자동 승인한다: 공백 항목 trim·중복 건너뛰기·명단 저장; 이미 PENDING인 계정을 자동 활성화하는 코드는 없음|정상 결과: added,skipped와 명단; 새 명단 항목 저장|frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37; ALG-10|
|ST-007-X|US-007|빈·중복 명단·기존대기계정|ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|기존명단·공백·중복합성ID를재등록;이미PENDING인학생도포함 → 기존명단·공백·중복합성ID를재등록;이미PENDING인학생도포함|added/skipped정확;기존PENDING자동활성화는현재코드없음(별도승인필요)|frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37; ALG-10|
|ST-008-N|US-008|동물 종 조회·표시 정상 흐름|로그인 사용자의 시험 계정·격리된 합성 fixture; 과제·세포·통계에 종 표시|speciesId/code/name; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 도말·세포가 어느 종인지 확인한다: DOG/CAT 기본 종과 사용자 종을 조회; DTO에 종 메타데이터 전달|정상 결과: 화면 종 배지; 과제·세포·통계에 종 표시|frontend/src/components/SpeciesBadge.jsx:1 / backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24; ALG-10|
|ST-008-X|US-008|기존 종 누락 데이터 표시|로그인 사용자 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|격리fixture에종null Task와DOG/CAT Task구성 → 격리fixture에종null Task와DOG/CAT Task구성|fallback/backfill정책에따른표시;종표시로고양이모델지원판정금지|frontend/src/components/SpeciesBadge.jsx:1 / backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24; ALG-10|
|ST-009-N|US-009|종 생성·이름 수정 정상 흐름|EXPERT·ADMIN(API)의 시험 계정·격리된 합성 fixture; 유일한 이름 저장|name,speciesId; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 필요한 동물 종 이름을 관리한다: 이름 공백·60자·대소문자 중복 검사; custom code UUID 생성|정상 결과: 종 정보; 유일한 이름 저장|frontend/src/components/SpeciesDataSettings.jsx:1 / backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24; ALG-10|
|ST-009-X|US-009|종 이름 중복·빈값·길이초과|EXPERT·ADMIN(API) 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|같은이름대소문자변형·공백·61자이름요청 → 같은이름대소문자변형·공백·61자이름요청|검증오류400·추가저장없음|frontend/src/components/SpeciesDataSettings.jsx:1 / backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24; ALG-10|
|ST-010-N|US-010|기존 도말의 종 변경 정상 흐름|EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; 종 배지·DTO 변경|taskId,speciesId; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 잘못 입력한 종을 바로잡는다: 과제·종 존재 확인 후 tasks 연관 종 수정|정상 결과: 갱신 종 정보; 종 배지·DTO 변경|frontend/src/components/TaskSpeciesEditor.jsx:1 / backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24; ALG-10|
|ST-010-X|US-010|없는 task/species ID|EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|합성 미존재 ID로PUT종변경 → 합성 미존재 ID로PUT종변경|404 또는구현업무오류;다른Task종이변경되지않음|frontend/src/components/TaskSpeciesEditor.jsx:1 / backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24; ALG-10|
|ST-011-N|US-011|단일 도말 업로드·AI 과제 생성 정상 흐름|EXPERT·ADMIN(API)의 시험 계정·격리된 합성 fixture; 유효 영상에서 검출 crop 반환|multipart file,deadlineAt?,speciesId?; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 도말을 세포 단위 문제로 만든다: 원본·썸네일 저장→AI 분석→Task/Crop 저장|정상 결과: TaskUploadResponse; 유효 영상에서 검출 crop 반환|frontend/src/api/tasks.js:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; ALG-03|
|ST-011-X|US-011|잘못된 영상·AI 장애|EXPERT·ADMIN(API) 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|격리mock AI가오류/지연;텍스트파일을multipart로입력 → 격리mock AI가오류/지연;텍스트파일을multipart로입력|명확한실패응답(T002/500등)·잘못된Task저장여부·고아파일생성여부기록|frontend/src/api/tasks.js:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; ALG-03|
|ST-012-N|US-012|다중 도말 과제 생성 정상 흐름|EXPERT(화면)·ADMIN(API)의 시험 계정·격리된 합성 fixture; 한 개 이상 파일·영상별 종 지정|title,files[],speciesIds[],deadlineAt?; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 여러 도말을 한 과제로 묶는다: 파일 개수·종 배열·마감 검사; Assignment 저장 후 영상별 순차 AI 호출·Task 저장|정상 결과: assignmentId,tasks,totalCrops; 한 개 이상 파일·영상별 종 지정|frontend/src/pages/ExpertPage.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; ALG-03|
|ST-012-X|US-012|다중 파일의 중간 실패·종개수불일치|EXPERT(화면)·ADMIN(API) 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|파일2개/종1개;그후파일2개중두번째AI를실패시키는격리시험 → 파일2개/종1개;그후파일2개중두번째AI를실패시키는격리시험|개수불일치400;중간실패시DBrollback과남은파일을별도로확인(보상삭제보장없음)|frontend/src/pages/ExpertPage.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; ALG-03|
|ST-013-N|US-013|과제 조회·선택·진행률 정상 흐름|학생·EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; 기존 답안 복원|task/assignment 선택; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 일반 과제와 진단평가를 구분하고 이어 푼다: Task 목록·crop·기존 제출 조회; assignment별 묶음; 답변수/총crop 계산|정상 결과: 과제 카드·진행률·첫 미응답 셀; 기존 답안 복원|frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; ALG-04|
|ST-013-X|US-013|빈 과제·재접속 진행률|학생·EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|답안일부있는합성과제재접속·빈cropTask선택 → 답안일부있는합성과제재접속·빈cropTask선택|기존답안복원·첫미응답·분모0처리·다른과제잔상없음|frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; ALG-04|
|ST-014-N|US-014|마감일 설정·변경 정상 흐름|EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; 마감 전 미래 날짜 변경|deadlineAt(null 해제 가능),taskId/assignmentId; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 과제 수행 기간을 제어한다: 미래 시각·기존 마감 여부 검사; Assignment 단위 갱신|정상 결과: 갱신 결과; 마감 전 미래 날짜 변경|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; ALG-04|
|ST-014-X|US-014|마감 후 변경·진단 마감|EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|격리DB에서지난마감/진단Task/Assignment소속개별Task로마감변경시도 → 격리DB에서지난마감/진단Task/Assignment소속개별Task로마감변경시도|400·변경안됨;현재시각경계는시험시각함께기록|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; ALG-04|
|ST-015-N|US-015|과제·도말 삭제 정상 흐름|EXPERT·ADMIN 의도의 시험 계정·격리된 합성 fixture; 연결 DB기록 삭제|taskId/assignmentId,삭제 확인; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 불필요한 과제와 관련 기록을 제거한다: 제출→혼동행렬→신고→Task 삭제; Assignment면 구성 Task 순회|정상 결과: 204; 연결 DB기록 삭제|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; ALG-04|
|ST-015-X|US-015|학생 DELETE 권한·관계 정리|EXPERT·ADMIN 의도 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|폐기용fixture에STUDENTJWT로Task/AssignmentDELETE;정당한권한경로와비교 → 폐기용fixture에STUDENTJWT로Task/AssignmentDELETE;정당한권한경로와비교|수용목표는403.현재URL규칙은인증만이라허용될위험(결과미확인).허용되면결함기록;운영데이터로시험금지|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; ALG-04|
|ST-016-N|US-016|학생 세포 답안 저장·수정 정상 흐름|STUDENT(화면)·로그인(API)의 시험 계정·격리된 합성 fixture; 6개 label·잠기지 않은 과제|cropId,studentLabel; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 세포를 분류하고 진행 중 답안을 저장한다: principal을 학생ID로 사용; 답안 upsert; GT 있으면 혼동행렬 차감/가산; 다음 미응답 이동|정상 결과: 200 및 답안 복원; 6개 label·잠기지 않은 과제|frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/SubmissionService.java:46; ALG-05|
|ST-016-X|US-016|중복/수정·마감·완료잠금|STUDENT(화면)·로그인(API) 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|같은student/crop재제출·다른라벨로수정·마감후·전답변전GT완료후재제출 → 같은student/crop재제출·다른라벨로수정·마감후·전답변전GT완료후재제출|잠금전upsert·행렬변경,잠금후400;동시성중복은NFR06에서별도|frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/SubmissionService.java:46; ALG-05|
|ST-017-N|US-017|학생 결과·오답 복습 정상 흐름|STUDENT의 시험 계정·격리된 합성 fixture; 공개 조건 충족|taskId/assignmentId 또는 학습결과 탭; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 내 답과 실제 정답을 비교해 복습한다: 일반: 전답변+전GT 또는 마감; 진단: 전답변; finalLabel 우선; GT 없는 항목 채점대기|정상 결과: 정오답·정확도·혼동행렬·세포별 내 답/GT; 공개 조건 충족|frontend/src/components/StudentReviewPanel.jsx:1 / backend/src/main/java/com/cell/platform/service/SubmissionService.java:46; ALG-06|
|ST-017-X|US-017|미공개 결과·타학생 URL·GT없는문항|STUDENT 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|전답변미완료/GT미완료/마감경계fixture;학생A가학생B URL조회 → 전답변미완료/GT미완료/마감경계fixture;학생A가학생B URL조회|공개전거부·학생A로치환;마감후정답없는항목은채점대기이고AI정답으로바뀌지않음|frontend/src/components/StudentReviewPanel.jsx:1 / backend/src/main/java/com/cell/platform/service/SubmissionService.java:46; ALG-06|
|ST-018-N|US-018|전문가 정답 확정·재수정 정상 흐름|EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; 유효6클래스·수정 버튼·저장|cropId,finalLabel; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 검증된 정답을 제공하고 오류를 바로잡는다: finalLabel 갱신; 기존 GT 기준 혼동행렬 차감 후 새 GT 가산|정상 결과: 200·갱신 통계; 유효6클래스·수정 버튼·저장|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/CropService.java:23; ALG-07|
|ST-018-X|US-018|잘못된 GT·재수정 소급|EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|합성Band답안과SegmentGT확정후Band로수정;미지원Basophil도요청 → 합성Band답안과SegmentGT확정후Band로수정;미지원Basophil도요청|GT갱신·기존행렬차감/가산·화면갱신;미지원라벨400|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/CropService.java:23; ALG-07|
|ST-019-N|US-019|세포 이동·GT 완료 표시 정상 흐름|EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; 모든 finalLabel 존재 시 완료 배지|이전/다음·세포목록·도말 선택; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 검토할 세포와 미확정 도말을 찾는다: 선택 index 이동; finalLabel 개수 집계·Assignment 합산|정상 결과: GT n/N·COMPLETE; 모든 finalLabel 존재 시 완료 배지|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/StatsService.java:21; ALG-07|
|ST-019-X|US-019|빈 crop·일부 GT·끝셀 이동|EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|crop0개/일부final/전final도말과Assignment묶음;끝cell에서▶ → crop0개/일부final/전final도말과Assignment묶음;끝cell에서▶|빈crop은완료아님·집계정확·끝범위disable;Confirm후자동이동안하는현재정책확인|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/StatsService.java:21; ALG-07|
|ST-020-N|US-020|세포 통계·학생별 선택자 정상 흐름|EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; 응답 있을 때 클래스별 학생 펼치기|taskId,crop 선택; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 어떤 세포를 누가 어떤 클래스로 답했는지 분석한다: 정답 기준 오류율·투표분포·학생표시이름 집계|정상 결과: accuracyRate,errorRate,hardScore,voteDistribution,votersByLabel; 응답 있을 때 클래스별 학생 펼치기|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/StatsService.java:21; ALG-08|
|ST-020-X|US-020|응답0·미확정GT·학생이름누락|EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|0응답/GTnull/합성학생name null인통계fixture → 0응답/GTnull/합성학생name null인통계fixture|NaN/예외없이구분표시·학생ID fallback·voter수와분포일치|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/StatsService.java:21; ALG-08|
|ST-021-N|US-021|도말별 학생 응답 비교표 정상 흐름|EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; GT 완료 시 점수; 수정하면 재계산|task stats의 votersByLabel/finalLabel; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 도말 전체에 대해 학생별 답과 점수를 비교한다: 학생별 답 Map; 무응답 포함 총crop 분모; 모든 GT 확정 시 점수 공개|정상 결과: StudentResponsesPanel 비교표; GT 완료 시 점수; 수정하면 재계산|frontend/src/components/StudentResponsesPanel.jsx:1 / backend/src/main/java/com/cell/platform/service/StatsService.java:21; ALG-08|
|ST-021-X|US-021|GT 미완료·미응답·상세누락|EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|모든학생이일부crop만답한fixture와voters상세누락응답을주입 → 모든학생이일부crop만답한fixture와voters상세누락응답을주입|GT미완료점수보류·미응답표시·상세누락과실제0응답구분|frontend/src/components/StudentResponsesPanel.jsx:1 / backend/src/main/java/com/cell/platform/service/StatsService.java:21; ALG-08|
|ST-022-N|US-022|학생별 학습 이력·세포별 결과 정상 흐름|EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; 학생 선택→학습이력→세포별 응답|studentId,taskId; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 특정 학생의 과제 수행 현황을 조회한다: Task를 Assignment별 묶음; 응답·미응답·GT대기 구분; 모든GT 확정 시 전체문항 분모 점수|정상 결과: Activity/TaskDetail·누적 요약; 학생 선택→학습이력→세포별 응답|frontend/src/components/StudentManagement.jsx:1 / backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:24; ALG-09|
|ST-022-X|US-022|학생이력 권한·무응답·미존재Task|EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|STUDENTAPI접근·아무답없는합성학생·없는Task조회 → STUDENTAPI접근·아무답없는합성학생·없는Task조회|STUDENT403·무응답전체목록/분모처리·없는Task404|frontend/src/components/StudentManagement.jsx:1 / backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:24; ALG-09|
|ST-023-N|US-023|진단·누적 혼동행렬 정상 흐름|EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; 기존 제출과 GT 관계에 따른 집계|taskId 또는 누적 요청; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 학생의 클래스별 혼동을 확인한다: 진단·대상 과제에 저장된 혼동행렬 합산; 학생 목록 및 ALL 합계 구성|정상 결과: studentMatrices,totalSolved,accuracy; 기존 제출과 GT 관계에 따른 집계|frontend/src/components/StudentManagement.jsx:1 / backend/src/main/java/com/cell/platform/service/SubmissionService.java:46; ALG-06|
|ST-023-X|US-023|행렬 경계·GT 변경 일치성|EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|학생0/답변0/일부GT/재수정·VIAimport후행렬을현재답안과대조 → 학생0/답변0/일부GT/재수정·VIAimport후행렬을현재답안과대조|ALL와학생합일치;VIAimport후저장행렬불일치가능성은결함후보로기록|frontend/src/components/StudentManagement.jsx:1 / backend/src/main/java/com/cell/platform/service/SubmissionService.java:46; ALG-06|
|ST-024-N|US-024|진단평가 문제 생성 정상 흐름|EXPERT(화면)·ADMIN(API)의 시험 계정·격리된 합성 fixture; 양의 총수·분포합 일치·보유량 이내|totalQuestions,classDistribution; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 정답이 준비된 셀로 평가 과제를 만든다: manifest class별 섞기→요청수 비복원 선택→전체 섞기→gtLabel Task 저장; DOG 고정|정상 결과: 진단 Task 및 보유량; 양의 총수·분포합 일치·보유량 이내|frontend/src/pages/ExpertPage.jsx:1 / backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:25; ALG-11|
|ST-024-X|US-024|분포 합·보유 초과·없는 클래스|EXPERT(화면)·ADMIN(API) 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|합계다른분포·보유수초과·Basophil키·없거나잘못된manifest → 합계다른분포·보유수초과·Basophil키·없거나잘못된manifest|400/500등구현에맞는거부;진단Task부분저장없음|frontend/src/pages/ExpertPage.jsx:1 / backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:25; ALG-11|
|ST-025-N|US-025|문제 세포 신고 정상 흐름|STUDENT(화면)·로그인(API)의 시험 계정·격리된 합성 fixture; 필수 ID·사유가 있으면 신고 저장|taskId,cropId,studentId,reason; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 이미지·탐지 문제를 교수에게 전달한다: DTO 필수값만 검사한 뒤 요청의 studentId/taskId/cropId/reason 그대로 저장; 대상 ID 존재·소속 확인은 없음|정상 결과: 200·목록; 필수 ID·사유가 있으면 신고 저장|frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18; ALG-12|
|ST-025-X|US-025|신고 ID 위조·필수 누락|STUDENT(화면)·로그인(API) 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|필수누락,다른학생ID,없는Task/Crop·소속불일치합성신고 → 필수누락,다른학생ID,없는Task/Crop·소속불일치합성신고|필수누락400.나머지는현재검증없어저장될수있음;무결성수용목표와차이를결함기록(운영시험금지)|frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18; ALG-12|
|ST-026-N|US-026|신고 조회·분류 정상 흐름|EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; EXPERT/ADMIN 조회|신고 사유 필터; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 문제가 보고된 세포를 검토한다: 신고 목록에 crop·종 메타데이터 결합|정상 결과: 신고 목록·이미지; EXPERT/ADMIN 조회|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18; ALG-12|
|ST-026-X|US-026|학생 신고목록 접근·연결crop삭제|EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|STUDENT GET /api/reports;crop없는신고fixture → STUDENT GET /api/reports;crop없는신고fixture|STUDENT403;이미지없는신고도null/fallback으로처리|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18; ALG-12|
|ST-027-N|US-027|라벨링 ZIP/VIA 내보내기 정상 흐름|EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; 실제 업로드 도말·파일 존재|taskId; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 전문가 라벨과 이미지를 외부 도구로 전달한다: 원본+crop+VIA2.0.10 ZIP; bbox→rect; final우선 gt차선; 종 metadata|정상 결과: ZIP 파일; 실제 업로드 도말·파일 존재|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/LabelingService.java:34; ALG-13|
|ST-027-X|US-027|진단Task·원본/crop 누락 export|EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|진단평가Task 또는업로드파일없는fixture로export → 진단평가Task 또는업로드파일없는fixture로export|진단400·누락파일500등명확한오류;정답없는region처리확인|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/LabelingService.java:34; ALG-13|
|ST-028-N|US-028|VIA 라벨 가져오기 정상 흐름|EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; 기존 task 소속 crop|VIA JSON _via_img_metadata·cropId·checkbox option; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 외부에서 검토한 정답을 반영한다: task별 cropId 검증·6클래스 순서 매핑·gt와final 갱신|정상 결과: updated 개수; 기존 task 소속 crop|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/LabelingService.java:34; ALG-13|
|ST-028-X|US-028|다른 Task cropId·비정수 option·행렬갱신|EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|소속다른cropId·문자option·동일import반복·기존답안fixture → 소속다른cropId·문자option·동일import반복·기존답안fixture|다른Task거부;파싱오류형식실측;updated수정확;저장행렬backfill미호출차이기록|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/LabelingService.java:34; ALG-13|
|ST-029-N|US-029|원본·crop 데이터 목록 관리 정상 흐름|ADMIN의 시험 계정·격리된 합성 fixture; 권한있는 전체목록|검색·라벨유무·도말/crop 탭; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 전체 영상과 라벨 유무를 확인한다: DB집계+파일 표시·선택·라벨 입출력 진입|정상 결과: 도말/crop 목록; 권한있는 전체목록|frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37; ALG-10|
|ST-029-X|US-029|권한·검색·라벨 필터|ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|STUDENT/EXPERT가admin목록API접근;합성영상명검색·labeled/unlabeled전환 → STUDENT/EXPERT가admin목록API접근;합성영상명검색·labeled/unlabeled전환|권한403·필터/검색반영·다른탭상태잔상없음|frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37; ALG-10|
|ST-030-N|US-030|인증된 영상 조회·썸네일 정상 흐름|로그인 사용자의 시험 계정·격리된 합성 fixture; 인증이 있으면 리소스 제공|/data/{originals\|crops\|thumbnails}/filename; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 원본과 crop을 안전하게 표시한다: Bearer 포함 fetch→blob; Spring resource handler; 썸네일 max320|정상 결과: 영상·Canvas bbox; 인증이 있으면 리소스 제공|frontend/src/components/AuthImage.jsx:1 / backend/src/main/java/com/cell/platform/config/WebConfig.java:11; ALG-03|
|ST-030-X|US-030|미인증·없는 영상·구세션 blob|로그인 사용자 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|JWT없는/data요청·가명없는파일·세션교체중영상응답 → JWT없는/data요청·가명없는파일·세션교체중영상응답|401/404·구세션영상사용안함·필요blob정리;소유권별제한은현재없음|frontend/src/components/AuthImage.jsx:1 / backend/src/main/java/com/cell/platform/config/WebConfig.java:11; ALG-03|
|ST-031-N|US-031|영상 화면 조정 정상 흐름|학생·EXPERT·ADMIN의 시험 계정·격리된 합성 fixture; 기본100·밝기50~150·대비50~180·채도0~180|brightness,contrast,saturation; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 염색 차이를 보조적으로 조절하며 관찰한다: CSS/Canvas filter; 사용자·영상별 localStorage|정상 결과: 밝기·대비·채도 조절 화면; 기본100·밝기50~150·대비50~180·채도0~180|frontend/src/components/ImageDisplayControls.jsx:1 / 프런트엔드 전용; ALG-14|
|ST-031-X|US-031|조절 경계·초기화·계정 전환|학생·EXPERT·ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|밝기50/150·대비50/180·채도0/180·reset·다른계정/영상전환 → 밝기50/150·대비50/180·채도0/180·reset·다른계정/영상전환|정해진표시범위·채도0흑백·초기화100·원본해시불변|frontend/src/components/ImageDisplayControls.jsx:1 / 프런트엔드 전용; ALG-14|
|ST-032-N|US-032|AI 세포 탐지·crop·분류 정상 흐름|Spring 백엔드(시스템 액터)의 시험 계정·격리된 합성 fixture; 모델 로딩 완료·읽을 수 있는 영상|multipart file; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 도말을 자동 분석해 분류 후보를 얻는다: YOLO box→정수xyxy→OpenCV JPG crop→RGB256/정규화→DenseNet201 softmax argmax|정상 결과: total_detected,cells[crop_filename,bbox,prediction,confidence]; 모델 로딩 완료·읽을 수 있는 영상|ai-server/app/services/pipeline.py:1 / backend/src/main/java/com/cell/platform/service/AiClientService.java:20; ALG-15|
|ST-032-X|US-032|파일 없음·손상영상·미준비 모델|Spring 백엔드(시스템 액터) 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|독립격리AI에file누락/손상바이트·모델미ready모의 → 독립격리AI에file누락/손상바이트·모델미ready모의|누락422·미ready503·손상영상의실제예외형식기록;잘못된crop정답저장안함|ai-server/app/services/pipeline.py:1 / backend/src/main/java/com/cell/platform/service/AiClientService.java:20; ALG-15|
|ST-033-N|US-033|확정 학습 데이터 조회 정상 흐름|로그인(API;문서상EXPERT 의도)의 시험 계정·격리된 합성 fixture; 확정라벨 존재|인증 JWT; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 확정 라벨과 crop 목록을 추출한다: finalLabel 있는 crop 선택|정상 결과: TrainingDataResponse[]; 확정라벨 존재|frontend/src/api/crops.js:1 / backend/src/main/java/com/cell/platform/service/CropService.java:23; ALG-16|
|ST-033-X|US-033|학습목록 권한·미확정 라벨|로그인(API;문서상EXPERT 의도) 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|STUDENTJWT접근과finalnull/final확정fixture비교 → STUDENTJWT접근과finalnull/final확정fixture비교|현재는로그인만요구하므로STUDENT접근가능성.최종GT만추출;EXPERT제한목표와차이기록|frontend/src/api/crops.js:1 / backend/src/main/java/com/cell/platform/service/CropService.java:23; ALG-16|
|ST-034-N|US-034|AI 재학습·pseudo-label 확장 정상 흐름|trainer·평가·가중치승격 구현 필요(현재 미충족)|epochs,batch_size,learning_rate; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 검증 라벨을 다음 모델에 활용한다: 목록 조회·최소10·crop존재검사 골격; 실제trainer·평가·가중치교체 없음|실제 학습·평가·승격·서빙 갱신까지 이어져야 재학습 완료|ai-server/app/routers/retrain_router.py:1 / backend/src/main/java/com/cell/platform/service/PseudoLabelService.java:9; ALG-16|
|ST-034-X|US-034|모델 평가·교체·롤백 연결|미구현 경계 확인; 실행할 trainer 없음|학습결과저장→평가통과→승격→재서빙을요구하는시나리오 → 학습결과저장→평가통과→승격→재서빙을요구하는시나리오|trainer/평가/교체미구현으로수행차단;READY를COMPLETED로간주금지|ai-server/app/routers/retrain_router.py:1 / backend/src/main/java/com/cell/platform/service/PseudoLabelService.java:9; ALG-16|
|ST-035-N|US-035|관리자 부가 게임·기록 정상 흐름|ADMIN의 시험 계정·격리된 합성 fixture; ADMIN;유효점수|mode,players[name,score]; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 관리자용 게임과 순위표를 사용한다: iframe 게임→양수기록 저장·모드별 상위15·전체기록삭제|정상 결과: 게임·leaderboard; ADMIN;유효점수|frontend/src/pages/BombGamePage.jsx:1 / backend/src/main/java/com/cell/platform/service/GameRecordService.java:18; ALG-17|
|ST-035-X|US-035|다른 role·0점·빈 players/mode|ADMIN 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|STUDENTgameAPI와점수0/음수·누락mode/players합성요청 → STUDENTgameAPI와점수0/음수·누락mode/players합성요청|다른role403·비양수제외;null/빈값실제오류형식기록|frontend/src/pages/BombGamePage.jsx:1 / backend/src/main/java/com/cell/platform/service/GameRecordService.java:18; ALG-17|
|ST-036-N|US-036|독립 컬러화 계정·세션 정상 흐름|컬러화 사용자(별도 계정)의 시험 계정·격리된 합성 fixture; 컬러화 로그인 상태|username,password;로그인·로그아웃; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 자신의 DICOM 작업을 저장한다: Werkzeug hash·Flask signed cookie; CELL JWT와 별개|정상 결과: 계정·세션·me; 컬러화 로그인 상태|컬러화POC/templates/index.html:1 / ColorizerStore; ALG-18|
|ST-036-X|US-036|컬러화계정·Spring계정 혼용|컬러화 사용자(별도 계정) 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|별도컬러화계정오입력·짧은비밀번호·CELLJWT만으로컬러화보호API요청 → 별도컬러화계정오입력·짧은비밀번호·CELLJWT만으로컬러화보호API요청|오입력401·형식400·CELLJWT만으로통과하지않음|컬러화POC/templates/index.html:1 / ColorizerStore; ALG-18|
|ST-037-N|US-037|DICOM 작업·업로드·복원·삭제 정상 흐름|컬러화 사용자의 시험 계정·격리된 합성 fixture; 본인작업 조회·복원|batch label,source_type;files·relative_paths·중복정책; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 여러 DICOM 작업을 이어 처리한다: 원본저장·hash·pydicom읽기·계정소유권·512MB/10GB검사·영구메타|정상 결과: batch/items·작업목록; 본인작업 조회·복원|컬러화POC/static/app.js:1 / ColorizerStore; ALG-18|
|ST-037-X|US-037|다른 소유자·quota·깨진 DICOM|컬러화 사용자 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|컬러화A/Bfixture·파일초과/총quota·PixelData없는합성파일·경로탈출명 → 컬러화A/Bfixture·파일초과/총quota·PixelData없는합성파일·경로탈출명|소유권/크기/경로검사·파일별error반환·실패파일정리|컬러화POC/static/app.js:1 / ColorizerStore; ALG-18|
|ST-038-N|US-038|DICOM 파일명·촬영유형 필터 정상 흐름|컬러화 사용자의 시험 계정·격리된 합성 fixture; 지원촬영조건·본인파일|새파일명·원래이름복원·time60/counts200000 필터; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 작업목록을 촬영조건과 이름으로 찾는다: 이름검증·중복접미사; duration60000±500ms 또는 count200000 분류·기존메타 백필|정상 결과: 수정이름·촬영유형·필터목록; 지원촬영조건·본인파일|컬러화POC/static/app.js:1 / ColorizerStore; ALG-18|
|ST-038-X|US-038|불명 촬영조건·경계·이름충돌|컬러화 사용자 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|duration허용경계/밖·counts200000/다른값·둘다있음·이름중복/경로문자 → duration허용경계/밖·counts200000/다른값·둘다있음·이름중복/경로문자|time60우선·그외counts/other·중복이름정책·경로문자거부·원래이름복원|컬러화POC/static/app.js:1 / ColorizerStore; ALG-18|
|ST-039-N|US-039|DICOM 정규화·컬러맵·설정저장 정상 흐름|컬러화 사용자의 시험 계정·격리된 합성 fixture; 지원설정·유효프레임|normalization,colormap,gamma,threshold,window 등(현재 웹 렌더는 첫 프레임); 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 명암·컬러 결과를 비교한다: 5정규화·13컬러맵·모달리티LUT·다중프레임·렌더·설정hash저장|정상 결과: 흑백/컬러PNG·설정복원; 지원설정·유효프레임|컬러화POC/static/app.js:1 / dicom_processing; ALG-19|
|ST-039-X|US-039|설정 범위·상수픽셀·다중프레임|컬러화 사용자 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|gamma0/과대·window폭0·분위역전·상수/NAN픽셀·2frame합성DICOM → gamma0/과대·window폭0·분위역전·상수/NAN픽셀·2frame합성DICOM|잘못된설정400·유효픽셀없는오류·상수0정규화;현재render는첫frame임을확인|컬러화POC/static/app.js:1 / dicom_processing; ALG-19|
|ST-040-N|US-040|DICOM ROI 라벨·좌표 저장 정상 흐름|컬러화 사용자의 시험 계정·격리된 합성 fixture; 본인영상·지원도형|polygon/ellipse,좌표,라벨 이름; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 관심영역을 그려 라벨링한다: 좌표범위·최대500영역·다각형3~2000점·라벨32개/40자 검사; user+content hash저장|정상 결과: ROI·라벨목록·VIA JSON; 본인영상·지원도형|컬러화POC/static/roi_geometry.js:1 / ColorizerStore; ALG-20|
|ST-040-X|US-040|ROI 좌표·한도·다른 소유자|컬러화 사용자 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|범위밖/비정수좌표·2점polygon·501영역·33라벨·41자이름·다른계정 → 범위밖/비정수좌표·2점polygon·501영역·33라벨·41자이름·다른계정|400/401등거부·정상ROI유지·원본파일불변|컬러화POC/static/roi_geometry.js:1 / ColorizerStore; ALG-20|
|ST-041-N|US-041|DICOM 일괄 내보내기·취소 정상 흐름|컬러화 사용자의 시험 계정·격리된 합성 fixture; 본인job·렌더성공|scope saved/all,format,preset; 예시는 가명 계정 student_demo / expert_demo, 폐기 가능한 ID 101·201 등(실제 레코드 아님) → 영상 또는 ROI VIA 패키지를 묶어 받는다: 백그라운드 export job→진행률→ZIP·취소·TTL1h 정리|정상 결과: PNG/JPG ZIP 또는 VIA+기준PNG; 본인job·렌더성공|컬러화POC/static/app.js:1 / 컬러화 export 함수; ALG-21|
|ST-041-X|US-041|export 취소·만료·다른 계정|컬러화 사용자 및 대비 역할의 합성 시험 계정·격리 DB/FS/mock AI|합성소량job취소·만료시간fixture·완료전다운로드·다른계정조회 → 합성소량job취소·만료시간fixture·완료전다운로드·다른계정조회|취소상태·준비안된job400·소유권차단·파일정리;프로세스재시작job비영구|컬러화POC/static/app.js:1 / 컬러화 export 함수; ALG-21|
|ST-NFR-01|US-004|JWT·역할 권한|격리된 서버·테스트 계정·합성 데이터; 운영 데이터/실제 영상 사용 안 함|정상·오류·권한·경계 입력을 아래 실행 준비표에 따라 구성 → 인증 없는 보호 API는 401, 역할별 제한은403; 메서드 보안 누락 구간 미확정|코드 기준 현재 정책과 수용목표를 대조: 인증 없는 보호 API는 401, 역할별 제한은403; 메서드 보안 누락 구간 미확정|backend/src/main/java/com/cell/platform/config/SecurityConfig.java:29; 관련 US의 ALG|
|ST-NFR-02|US-001;US-002;US-006|계정·비밀번호 보호|격리된 서버·테스트 계정·합성 데이터; 운영 데이터/실제 영상 사용 안 함|정상·오류·권한·경계 입력을 아래 실행 준비표에 따라 구성 → BCrypt 저장; 공개가입은STUDENT; 기존 토큰 즉시폐기는 확인되지 않음|코드 기준 현재 정책과 수용목표를 대조: BCrypt 저장; 공개가입은STUDENT; 기존 토큰 즉시폐기는 확인되지 않음|backend/src/main/java/com/cell/platform/service/AuthService.java:31; 관련 US의 ALG|
|ST-NFR-03|US-004;US-030|TLS·응답 보안 헤더|격리된 서버·테스트 계정·합성 데이터; 운영 데이터/실제 영상 사용 안 함|정상·오류·권한·경계 입력을 아래 실행 준비표에 따라 구성 → HTTP301→HTTPS;TLS1.2/1.3;HSTS·SAMEORIGIN·nosniff·Referrer-Policy|코드 기준 현재 정책과 수용목표를 대조: HTTP301→HTTPS;TLS1.2/1.3;HSTS·SAMEORIGIN·nosniff·Referrer-Policy|frontend/nginx.conf:1; 관련 US의 ALG|
|ST-NFR-04|US-011;US-012;US-037|업로드 크기·입력 제약|격리된 서버·테스트 계정·합성 데이터; 운영 데이터/실제 영상 사용 안 함|정상·오류·권한·경계 입력을 아래 실행 준비표에 따라 구성 → CELL multipart 요청 전체50MB;컬러화 개별512MB·요청추가16MiB·기본사용자10GiB|코드 기준 현재 정책과 수용목표를 대조: CELL multipart 요청 전체50MB;컬러화 개별512MB·요청추가16MiB·기본사용자10GiB|backend/src/main/resources/application-dev.yml:24;컬러화POC/app.py:48; 관련 US의 ALG|
|ST-NFR-05|US-016;US-017;US-025|동일학생 데이터 경계|격리된 서버·테스트 계정·합성 데이터; 운영 데이터/실제 영상 사용 안 함|정상·오류·권한·경계 입력을 아래 실행 준비표에 따라 구성 → 학생 결과/제출조회 studentId를 principal로 치환;신고studentId는body신뢰(별도위험)|코드 기준 현재 정책과 수용목표를 대조: 학생 결과/제출조회 studentId를 principal로 치환;신고studentId는body신뢰(별도위험)|backend/src/main/java/com/cell/platform/controller/SubmissionController.java:30; 관련 US의 ALG|
|ST-NFR-06|US-016;US-018;US-028|데이터 무결성|격리된 서버·테스트 계정·합성 데이터; 운영 데이터/실제 영상 사용 안 함|정상·오류·권한·경계 입력을 아래 실행 준비표에 따라 구성 → JPA트랜잭션;FK3개;제출(student,crop)·행렬(student,task) DB unique미선언|코드 기준 현재 정책과 수용목표를 대조: JPA트랜잭션;FK3개;제출(student,crop)·행렬(student,task) DB unique미선언|backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:8; 관련 US의 ALG|
|ST-NFR-07|US-011;US-012;US-032|장애·시간초과 처리|격리된 서버·테스트 계정·합성 데이터; 운영 데이터/실제 영상 사용 안 함|정상·오류·권한·경계 입력을 아래 실행 준비표에 따라 구성 → AI예외T002/500;Nginx api read120s/colorizer300s;WebClient·Axios 명시timeout없음|코드 기준 현재 정책과 수용목표를 대조: AI예외T002/500;Nginx api read120s/colorizer300s;WebClient·Axios 명시timeout없음|backend/src/main/java/com/cell/platform/service/AiClientService.java:45;frontend/nginx.conf:34; 관련 US의 ALG|
|ST-NFR-08|US-030;US-037;US-041|파일·영구 저장|격리된 서버·테스트 계정·합성 데이터; 운영 데이터/실제 영상 사용 안 함|정상·오류·권한·경계 입력을 아래 실행 준비표에 따라 구성 → MySQL·컬러화named volume·공유data bind;자동백업·복구시험정책 근거없음|코드 기준 현재 정책과 수용목표를 대조: MySQL·컬러화named volume·공유data bind;자동백업·복구시험정책 근거없음|docker-compose.yml:1; 관련 US의 ALG|
|ST-NFR-09|US-030;US-032;US-039|표시·응답 효율|격리된 서버·테스트 계정·합성 데이터; 운영 데이터/실제 영상 사용 안 함|정상·오류·권한·경계 입력을 아래 실행 준비표에 따라 구성 → 원본썸네일최대320·AI시작시모델1회로딩·컬러화캐시12;성능실측없음|코드 기준 현재 정책과 수용목표를 대조: 원본썸네일최대320·AI시작시모델1회로딩·컬러화캐시12;성능실측없음|backend/src/main/java/com/cell/platform/service/FileStorageService.java:25;ai-server/app/services/model_loader.py:16; 관련 US의 ALG|
|ST-NFR-10|US-003|세션 일관성|격리된 서버·테스트 계정·합성 데이터; 운영 데이터/실제 영상 사용 안 함|정상·오류·권한·경계 입력을 아래 실행 준비표에 따라 구성 → 탭 간 계정변경 시 구세션요청/응답 취소;localStorage는XSS위험을없애지않음|코드 기준 현재 정책과 수용목표를 대조: 탭 간 계정변경 시 구세션요청/응답 취소;localStorage는XSS위험을없애지않음|frontend/src/utils/authSession.js:20;frontend/src/api/createApiClient.js:9; 관련 US의 ALG|
|ST-NFR-11|US-004;US-031|외부·브라우저 호환성|격리된 서버·테스트 계정·합성 데이터; 운영 데이터/실제 영상 사용 안 함|정상·오류·권한·경계 입력을 아래 실행 준비표에 따라 구성 → React SPA;CORSlocalhost5173/HTTPSdomain;정식브라우저·OS호환시험표없음|코드 기준 현재 정책과 수용목표를 대조: React SPA;CORSlocalhost5173/HTTPSdomain;정식브라우저·OS호환시험표없음|frontend/src/App.jsx:1;backend/src/main/java/com/cell/platform/config/SecurityConfig.java:81; 관련 US의 ALG|
|ST-NFR-12|US-036;US-037;US-040|컬러화 계정격리·ROI검증|격리된 서버·테스트 계정·합성 데이터; 운영 데이터/실제 영상 사용 안 함|정상·오류·권한·경계 입력을 아래 실행 준비표에 따라 구성 → 소유자검사·signedcookie·WAL·좌표/개수제약;CELLJWT/DB와분리|코드 기준 현재 정책과 수용목표를 대조: 소유자검사·signedcookie·WAL·좌표/개수제약;CELLJWT/DB와분리|컬러화POC/app.py:217;컬러화POC/app.py:381;컬러화POC/persistence.py:17; 관련 US의 ALG|

## 4. 테스트 예외사항·중단/재개 조건

기존 공식 중단/재개 정책은 저장소에서 찾지 못했다. 다음은 **제안**이다.

|조건|중단 기준 제안|재개 조건 제안|
|---|---|---|
|실사용 DB/계정 연결|테스트URL/DB이름/파일경로가운영대상으로판명|격리환경·폐기fixture·백업복원가능성확인|
|인증·권한 경계 실패|학생이관리자/교수전용변경을수행가능|권한정책보완·회귀시험·영향평가후해당케이스재수행|
|학습/표본·파일 전제 없음|weights/manifest/합성영상/시험계정부족|허가된모델·가명fixture·환경준비로그확보|
|결과 기록 불가|요청/응답·버전·시각/오류/DB전후차이를보관못함|민감정보제거한기록절차수립|
|현재 미구현 재학습|trainer/평가/승격이없음|기능범위결정및구현후새버전에서수행(이번ID유지)|
|부하/장애 시험 위험|운영서비스또는공용자원에영향|격리성능환경·부하범위·복구조건합의|

## 5. 테스트 환경(HW·SW)

|구분|확보 증거|판정/미확인|
|---|---|---|
|실제 학교 HW·수량·CPU/RAM/GPU·OS|공식시험환경표미발견|Q-08.현재Codex호스트사양을대신기입하지않음|
|권장 서버사양|load_test/README.md:66|권장자료일뿐실측장비아님|
|소스 런타임|React/Vite·Java17/Spring3.3.5·Python3.12·MySQL8·Nginx·Docker|설정은실행시험증거와별개|
|현재 Docker 관측|5개컨테이너Up·AI/MySQL/컬러화healthy;Docker29.5.2/Compose5.1.3|상태/metadata읽기.전체업무시스템P/F아님|
|현재 실행 SW metadata|상세기술목록G.1|공식시험시사용버전·기기와동일한지확인필요|
|브라우저·네트워크·시험계정|실제시험표없음|시험전Chrome/Edge등실제버전·경로·역할별합성계정기록필요|
|이전시험 환경|이전대화의격리Node20Docker·과거Python/Gradle기록|원본환경명세/로그미보관·현재전체시스템과구분|

## 6. 시스템 시험 결과표(이번 조사)

모든 ST의 수행일·버전·로그·입력 실제값·정정/재시험 여부를 남길 빈칸 역할을 한다. 아래 예상결과는3절과같다. 현재는 실제시스템시험P/F를채우지않았다.

|ID|테스트 설명|입력값/시나리오|예상결과|수행여부|수행결과|결과|정정여부·수행일·버전·로그·재시험|
|---|---|---|---|---|---|---|---|
|ST-001-N|로그인 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-001-X|미승인 계정·틀린 비밀번호|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-002-N|학생 회원가입 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-002-X|가입 금지 역할·중복·명단 유무|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-003-N|로그아웃·다중 탭 계정 동기화 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-003-X|다른 탭 계정변경과 지연401|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-004-N|서버·화면 권한 제어 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-004-X|JWT 없음·변조·만료·다른 역할|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-005-N|관리자 사용자 목록·생성 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-005-X|학생/전문가의 관리자 계정생성 접근|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-006-N|가입 승인·비활성화·삭제 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-006-X|관리자 보호·기존JWT 상태|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-007-N|학생 사전 명단 관리 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-007-X|빈·중복 명단·기존대기계정|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-008-N|동물 종 조회·표시 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-008-X|기존 종 누락 데이터 표시|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-009-N|종 생성·이름 수정 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-009-X|종 이름 중복·빈값·길이초과|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-010-N|기존 도말의 종 변경 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-010-X|없는 task/species ID|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-011-N|단일 도말 업로드·AI 과제 생성 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-011-X|잘못된 영상·AI 장애|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-012-N|다중 도말 과제 생성 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-012-X|다중 파일의 중간 실패·종개수불일치|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-013-N|과제 조회·선택·진행률 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-013-X|빈 과제·재접속 진행률|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-014-N|마감일 설정·변경 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-014-X|마감 후 변경·진단 마감|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-015-N|과제·도말 삭제 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-015-X|학생 DELETE 권한·관계 정리|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-016-N|학생 세포 답안 저장·수정 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-016-X|중복/수정·마감·완료잠금|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-017-N|학생 결과·오답 복습 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-017-X|미공개 결과·타학생 URL·GT없는문항|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-018-N|전문가 정답 확정·재수정 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-018-X|잘못된 GT·재수정 소급|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-019-N|세포 이동·GT 완료 표시 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-019-X|빈 crop·일부 GT·끝셀 이동|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-020-N|세포 통계·학생별 선택자 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-020-X|응답0·미확정GT·학생이름누락|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-021-N|도말별 학생 응답 비교표 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-021-X|GT 미완료·미응답·상세누락|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-022-N|학생별 학습 이력·세포별 결과 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-022-X|학생이력 권한·무응답·미존재Task|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-023-N|진단·누적 혼동행렬 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-023-X|행렬 경계·GT 변경 일치성|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-024-N|진단평가 문제 생성 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-024-X|분포 합·보유 초과·없는 클래스|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-025-N|문제 세포 신고 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-025-X|신고 ID 위조·필수 누락|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-026-N|신고 조회·분류 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-026-X|학생 신고목록 접근·연결crop삭제|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-027-N|라벨링 ZIP/VIA 내보내기 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-027-X|진단Task·원본/crop 누락 export|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-028-N|VIA 라벨 가져오기 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-028-X|다른 Task cropId·비정수 option·행렬갱신|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-029-N|원본·crop 데이터 목록 관리 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-029-X|권한·검색·라벨 필터|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-030-N|인증된 영상 조회·썸네일 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-030-X|미인증·없는 영상·구세션 blob|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-031-N|영상 화면 조정 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-031-X|조절 경계·초기화·계정 전환|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-032-N|AI 세포 탐지·crop·분류 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-032-X|파일 없음·손상영상·미준비 모델|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-033-N|확정 학습 데이터 조회 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-033-X|학습목록 권한·미확정 라벨|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-034-N|AI 재학습·pseudo-label 확장 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|차단(실제 학습 미구현)|실측 없음|BLOCKED|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-034-X|모델 평가·교체·롤백 연결|3절 동일ID합성시나리오|3절 동일ID예상결과|차단(실제 학습 미구현)|실측 없음|BLOCKED|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-035-N|관리자 부가 게임·기록 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-035-X|다른 role·0점·빈 players/mode|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-036-N|독립 컬러화 계정·세션 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-036-X|컬러화계정·Spring계정 혼용|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-037-N|DICOM 작업·업로드·복원·삭제 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-037-X|다른 소유자·quota·깨진 DICOM|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-038-N|DICOM 파일명·촬영유형 필터 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-038-X|불명 촬영조건·경계·이름충돌|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-039-N|DICOM 정규화·컬러맵·설정저장 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-039-X|설정 범위·상수픽셀·다중프레임|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-040-N|DICOM ROI 라벨·좌표 저장 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-040-X|ROI 좌표·한도·다른 소유자|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-041-N|DICOM 일괄 내보내기·취소 정상 흐름|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-041-X|export 취소·만료·다른 계정|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-NFR-01|JWT·역할 권한|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-NFR-02|계정·비밀번호 보호|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-NFR-03|TLS·응답 보안 헤더|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-NFR-04|업로드 크기·입력 제약|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-NFR-05|동일학생 데이터 경계|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-NFR-06|데이터 무결성|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-NFR-07|장애·시간초과 처리|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-NFR-08|파일·영구 저장|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-NFR-09|표시·응답 효율|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-NFR-10|세션 일관성|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-NFR-11|외부·브라우저 호환성|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|
|ST-NFR-12|컬러화 계정격리·ROI검증|3절 동일ID합성시나리오|3절 동일ID예상결과|미수행|실측 없음|NOT RUN|정정미정;수행일없음;명세94aeb1a;실행로그없음;재시험아님|

## 7. 기존 시험 코드·수행 흔적·부록

### 7.1 기존 수행기록(시스템 ST와 분리)

|Evidence ID|대상/종류|수행 근거·환경·명령|확보 결과|제약|
|---|---|---|---|---|
|EV-01|프런트엔드함수·세션회귀/빌드|이전작업대화2026-10-15,`94aeb1a`;격리node:20-alpine;`node --test src/utils/authSession.test.js src/utils/studentResponses.test.js src/utils/studentLearning.test.js`;그후`npm run build`|도구출력의종료코드0·tests19/pass19/fail0·Vite5.4.21build성공;bundle index-Bnv1iU4O.js|원본로그파일은저장소에없음.이문서는이전대화출력전사요약.브라우저E2E/서버결과아님|
|EV-02|과거백엔드테스트컴파일|`시스템정의서_작성근거자료.md:454` (2026-09-29조사),DockerGradle8.13/Java17의gradle test시도|compileTestJava에서29오류로실패,실제테스트실행못함|현재커밋에서재실행안함.과거결과이며현재오류개수확정아님|
|EV-03|과거컬러화Python unittest|`시스템정의서_작성근거자료.md:455`|`15개중14ok·1개Windows임시DB잠금cleanup PermissionError` 기록|기능assert실패와구분;공식시험표/원본로그없음·현재재실행안함|
|EV-04|과거ROI JS기하script|`시스템정의서_작성근거자료.md:456`,`컬러화POC/tests/roi_geometry.test.js`|과거통과기록|독립함수script이며전체DICOM업무통과아님|
|EV-05|현재운영metadata/스키마읽기|2026-10-19 `docker compose ps`,버전metadata,MySQLinformation_schema/SQLite mode=ro|5컨테이너실행·DB구조확인;읽기명령성공|시스템업무시험아님·실제계정/답안변경없음|
|EV-06|부하/AI benchmark|load_test/README.md·locustfile.py·ai_bench.py 존재|결과CSV/성능로그미발견·이번미실행|60명목표·GPU별기대시간은측정결과아님.도구는운영답안/파일을쓸수있음|

과거EV-01의패키지설치/실행은이전작업에서수행됐으며이번조사에서는새설치·배포·모델학습·대량추론을하지않았다. 기존로그가없다는것은시험이절대없었다는뜻이아니라증빙을현재저장소에서찾지못했다는뜻이다.

### 7.2 테스트 소스 전체 목록(선언 단위)

Java는@Test86개(소스marker),프런트엔드는test선언18개이나지연응답status루프로2개생성되어기존실행은19개다. 컬러화Python15개. ROI JS는plain assertscript이므로Node test등록개수와같이합산하지않는다. 매개변수/동적등록은실행수와선언수가다를수있다. 모든선언의현재실행상태는미실행/미확인이다.

|종류|테스트 이름·목적 단서|소스근거|현재실행결과|
|---|---|---|---|
|JUnit|contextLoads|backend/src/test/java/com/cell/platform/ApplicationTests.java:9|이번미실행;코드존재만확인|
|JUnit|JWT_토큰을_생성한다|backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:23|이번미실행;코드존재만확인|
|JUnit|토큰에서_username을_추출한다|backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:34|이번미실행;코드존재만확인|
|JUnit|토큰에서_role을_추출한다|backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:44|이번미실행;코드존재만확인|
|JUnit|유효한_토큰이면_true를_반환한다|backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:54|이번미실행;코드존재만확인|
|JUnit|잘못된_토큰이면_false를_반환한다|backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:60|이번미실행;코드존재만확인|
|JUnit|빈_문자열이면_false를_반환한다|backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:65|이번미실행;코드존재만확인|
|JUnit|다른_시크릿으로_만든_토큰이면_false를_반환한다|backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:70|이번미실행;코드존재만확인|
|JUnit|정상_요청이면_200을_반환한다|backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:44|이번미실행;코드존재만확인|
|JUnit|username이_빈값이면_400을_반환한다|backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:61|이번미실행;코드존재만확인|
|JUnit|정상_요청이면_토큰을_반환한다|backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:81|이번미실행;코드존재만확인|
|JUnit|인증된_사용자가_요청하면_200을_반환한다|backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:50|이번미실행;코드존재만확인|
|JUnit|EXPERT_권한이면_200을_반환한다|backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:69|이번미실행;코드존재만확인|
|JUnit|STUDENT_권한이면_403을_반환한다|backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:83|이번미실행;코드존재만확인|
|JUnit|확정된_데이터_목록을_반환한다|backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:100|이번미실행;코드존재만확인|
|JUnit|EXPERT_권한이면_200을_반환한다|backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:60|이번미실행;코드존재만확인|
|JUnit|EXPERT_권한이면_200을_반환한다|backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:78|이번미실행;코드존재만확인|
|JUnit|STUDENT_권한이면_403을_반환한다|backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:90|이번미실행;코드존재만확인|
|JUnit|인증되지_않은_사용자는_401을_반환한다|backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:97|이번미실행;코드존재만확인|
|JUnit|professorCanReadStudentHistoryAndTaskDetails|backend/src/test/java/com/cell/platform/controller/StudentAnalyticsControllerTest.java:27|이번미실행;코드존재만확인|
|JUnit|adminCanReadHistory|backend/src/test/java/com/cell/platform/controller/StudentAnalyticsControllerTest.java:36|이번미실행;코드존재만확인|
|JUnit|studentsCannotReadEvenTheirOwnUnreleasedAnalytics|backend/src/test/java/com/cell/platform/controller/StudentAnalyticsControllerTest.java:43|이번미실행;코드존재만확인|
|JUnit|anonymousRequestsAreRejected|backend/src/test/java/com/cell/platform/controller/StudentAnalyticsControllerTest.java:51|이번미실행;코드존재만확인|
|JUnit|정상_요청이면_200을_반환한다|backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:49|이번미실행;코드존재만확인|
|JUnit|인증되지_않은_사용자는_401을_반환한다|backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:68|이번미실행;코드존재만확인|
|JUnit|풀이한_크롭_ID_목록을_반환한다|backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:89|이번미실행;코드존재만확인|
|JUnit|정답률과_상세_결과를_반환한다|backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:107|이번미실행;코드존재만확인|
|JUnit|인증된_사용자가_요청하면_200을_반환한다|backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:51|이번미실행;코드존재만확인|
|JUnit|인증되지_않은_사용자는_401을_반환한다|backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:69|이번미실행;코드존재만확인|
|JUnit|EXPERT_권한이면_200을_반환한다|backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:79|이번미실행;코드존재만확인|
|JUnit|STUDENT_권한이면_403을_반환한다|backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:97|이번미실행;코드존재만확인|
|JUnit|정상적인_인자가_들어오면_객체가_생성된다|backend/src/test/java/com/cell/platform/domain/CropTest.java:15|이번미실행;코드존재만확인|
|JUnit|정상적인_인자가_들어오면_객체가_생성된다|backend/src/test/java/com/cell/platform/domain/SubmissionTest.java:15|이번미실행;코드존재만확인|
|JUnit|정상적인_인자가_들어오면_객체가_생성된다|backend/src/test/java/com/cell/platform/domain/TaskTest.java:15|이번미실행;코드존재만확인|
|JUnit|정상적인_인자가_들어오면_객체가_생성된다|backend/src/test/java/com/cell/platform/domain/UserTest.java:22|이번미실행;코드존재만확인|
|JUnit|잘못된_인자가_들어오면_예외가_발생한다|backend/src/test/java/com/cell/platform/domain/UserTest.java:39|이번미실행;코드존재만확인|
|JUnit|빌더로_정상적으로_생성된다|backend/src/test/java/com/cell/platform/entity/CropEntityTest.java:18|이번미실행;코드존재만확인|
|JUnit|최종_라벨을_정상적으로_변경한다|backend/src/test/java/com/cell/platform/entity/CropEntityTest.java:46|이번미실행;코드존재만확인|
|JUnit|Task가_null이면_null을_반환한다|backend/src/test/java/com/cell/platform/entity/CropEntityTest.java:64|이번미실행;코드존재만확인|
|JUnit|빌더로_정상적으로_생성된다|backend/src/test/java/com/cell/platform/entity/SubmissionEntityTest.java:19|이번미실행;코드존재만확인|
|JUnit|빌더로_정상적으로_생성된다|backend/src/test/java/com/cell/platform/entity/TaskEntityTest.java:18|이번미실행;코드존재만확인|
|JUnit|CropEntity를_추가하고_양방향_관계를_설정한다|backend/src/test/java/com/cell/platform/entity/TaskEntityTest.java:40|이번미실행;코드존재만확인|
|JUnit|빌더로_정상적으로_생성된다|backend/src/test/java/com/cell/platform/entity/UserEntityTest.java:16|이번미실행;코드존재만확인|
|JUnit|크롭을_저장하고_ID를_부여한다|backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:48|이번미실행;코드존재만확인|
|JUnit|존재하는_크롭을_조회한다|backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:77|이번미실행;코드존재만확인|
|JUnit|해당_과제의_크롭만_반환한다|backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:94|이번미실행;코드존재만확인|
|JUnit|확정된_크롭만_반환한다|backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:107|이번미실행;코드존재만확인|
|JUnit|확정된_크롭이_없으면_빈_리스트를_반환한다|backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:122|이번미실행;코드존재만확인|
|JUnit|전체_크롭을_반환한다|backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:131|이번미실행;코드존재만확인|
|JUnit|존재하는_크롭_엔티티를_반환한다|backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:140|이번미실행;코드존재만확인|
|JUnit|존재하지_않는_크롭이면_null을_반환한다|backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:155|이번미실행;코드존재만확인|
|JUnit|제출_답안을_저장하고_ID를_부여한다|backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:43|이번미실행;코드존재만확인|
|JUnit|크롭_ID_목록에_해당하는_제출을_반환한다|backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:66|이번미실행;코드존재만확인|
|JUnit|해당하는_제출이_없으면_빈_리스트를_반환한다|backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:81|이번미실행;코드존재만확인|
|JUnit|특정_학생의_제출만_반환한다|backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:90|이번미실행;코드존재만확인|
|JUnit|과제를_저장하고_ID를_부여한다|backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:26|이번미실행;코드존재만확인|
|JUnit|과제와_크롭을_함께_저장한다|backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:43|이번미실행;코드존재만확인|
|JUnit|존재하는_과제를_조회한다|backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:65|이번미실행;코드존재만확인|
|JUnit|존재하지_않는_과제는_빈값을_반환한다|backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:78|이번미실행;코드존재만확인|
|JUnit|ID_내림차순으로_정렬된_과제를_반환한다|backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:87|이번미실행;코드존재만확인|
|JUnit|사용자를_저장하고_ID를_부여한다|backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:24|이번미실행;코드존재만확인|
|JUnit|존재하는_사용자를_조회한다|backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:46|이번미실행;코드존재만확인|
|JUnit|존재하지_않는_사용자는_빈값을_반환한다|backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:60|이번미실행;코드존재만확인|
|JUnit|존재하는_아이디면_true를_반환한다|backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:73|이번미실행;코드존재만확인|
|JUnit|존재하지_않는_아이디면_false를_반환한다|backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:82|이번미실행;코드존재만확인|
|JUnit|정상적으로_회원가입한다|backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:42|이번미실행;코드존재만확인|
|JUnit|중복된_아이디면_예외가_발생한다|backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:53|이번미실행;코드존재만확인|
|JUnit|정상적으로_로그인한다|backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:65|이번미실행;코드존재만확인|
|JUnit|아이디가_없으면_예외가_발생한다|backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:79|이번미실행;코드존재만확인|
|JUnit|비밀번호가_틀리면_예외가_발생한다|backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:87|이번미실행;코드존재만확인|
|JUnit|해당_과제의_크롭_목록을_반환한다|backend/src/test/java/com/cell/platform/service/CropServiceTest.java:41|이번미실행;코드존재만확인|
|JUnit|확정된_크롭만_반환한다|backend/src/test/java/com/cell/platform/service/CropServiceTest.java:54|이번미실행;코드존재만확인|
|JUnit|정상적으로_라벨을_확정한다|backend/src/test/java/com/cell/platform/service/CropServiceTest.java:68|이번미실행;코드존재만확인|
|JUnit|크롭이_없으면_예외가_발생한다|backend/src/test/java/com/cell/platform/service/CropServiceTest.java:78|이번미실행;코드존재만확인|
|JUnit|유효하지_않은_셀타입이면_예외가_발생한다|backend/src/test/java/com/cell/platform/service/CropServiceTest.java:86|이번미실행;코드존재만확인|
|JUnit|hardScore_내림차순으로_정렬된다|backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:34|이번미실행;코드존재만확인|
|JUnit|errorRate_내림차순으로_정렬된다|backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:54|이번미실행;코드존재만확인|
|JUnit|voteDistribution에_모든_셀타입이_포함된다|backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:69|이번미실행;코드존재만확인|
|JUnit|groupsAssignmentsAndSeparatesPendingFromWrongAndUnanswered|backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:51|이번미실행;코드존재만확인|
|JUnit|taskDetailIncludesUnansweredCellsAndUsesAllCellsAsDenominator|backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:78|이번미실행;코드존재만확인|
|JUnit|diagnosticUsesGtAndManifestButOrdinaryTasksRequireFinalLabels|backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:91|이번미실행;코드존재만확인|
|JUnit|studentsWithoutAnswersAndTasksWithoutCellsHaveNoArtificialCompletion|backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:109|이번미실행;코드존재만확인|
|JUnit|missingTasksReturnNotFoundAndEmptyTaskListNeedsNoSubmissionQuery|backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:122|이번미실행;코드존재만확인|
|JUnit|전체_과제를_반환한다|backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:35|이번미실행;코드존재만확인|
|JUnit|과제가_없으면_빈_리스트를_반환한다|backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:45|이번미실행;코드존재만확인|
|JUnit|파일_업로드와_AI_분석_후_과제를_생성한다|backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:58|이번미실행;코드존재만확인|
|Node test|another tab logout redirects to login without a refresh and preserves preferences|frontend/src/utils/authSession.test.js:22|이번미실행;코드존재만확인|
|Node test|switching accounts blocks the old screen before a storage event arrives|frontend/src/utils/authSession.test.js:34|이번미실행;코드존재만확인|
|Node test|a different account with the same role and token still resets the page|frontend/src/utils/authSession.test.js:45|이번미실행;코드존재만확인|
|Node test|a late logout cannot erase the newer account|frontend/src/utils/authSession.test.js:53|이번미실행;코드존재만확인|
|Node test|login writes one complete session and redirects to its role home|frontend/src/utils/authSession.test.js:62|이번미실행;코드존재만확인|
|Node test|existing login keys migrate and malformed sessions fail closed|frontend/src/utils/authSession.test.js:73|이번미실행;코드존재만확인|
|Node test|storage events synchronize tabs; focus and visibility handle suspended tabs|frontend/src/utils/authSession.test.js:82|이번미실행;코드존재만확인|
|Node test|Axios never sends a request using the new account from an old page|frontend/src/utils/authSession.test.js:99|이번미실행;코드존재만확인|
|Node test|a delayed ${status} response from the old account is discarded without logging out the new account|frontend/src/utils/authSession.test.js:115|이번미실행;코드존재만확인|
|Node test|current-session 401 logs out, but a failed public login does not clear sessions|frontend/src/utils/authSession.test.js:136|이번미실행;코드존재만확인|
|Node test|completion is based on answers, independently of grading and deadline|frontend/src/utils/studentLearning.test.js:6|이번미실행;코드존재만확인|
|Node test|score distinguishes no response, pending grading and a real zero|frontend/src/utils/studentLearning.test.js:14|이번미실행;코드존재만확인|
|Node test|activity totals avoid counting assignment cells twice and show child task completion|frontend/src/utils/studentLearning.test.js:20|이번미실행;코드존재만확인|
|Node test|mock matches grouped grading contract and includes unanswered cells in task details|frontend/src/utils/studentLearning.test.js:30|이번미실행;코드존재만확인|
|Node test|scores each student against every cell, including unanswered cells|frontend/src/utils/studentResponses.test.js:12|이번미실행;코드존재만확인|
|Node test|withholds scores until every professor label is confirmed, ignoring AI and imported labels|frontend/src/utils/studentResponses.test.js:27|이번미실행;코드존재만확인|
|Node test|recalculates after a professor changes a label|frontend/src/utils/studentResponses.test.js:36|이번미실행;코드존재만확인|
|Node test|distinguishes no submissions from missing response details|frontend/src/utils/studentResponses.test.js:41|이번미실행;코드존재만확인|
|Python unittest|test_uploaded_item_and_grayscale_only_inversion|컬러화POC/tests/test_app.py:120|이번미실행;코드존재만확인|
|Python unittest|test_multiple_upload_keeps_duplicates_and_marks_invalid_item|컬러화POC/tests/test_app.py:145|이번미실행;코드존재만확인|
|Python unittest|test_acquisition_classification_priority_and_persistence|컬러화POC/tests/test_app.py:167|이번미실행;코드존재만확인|
|Python unittest|test_existing_item_acquisition_is_backfilled_from_stored_dicom|컬러화POC/tests/test_app.py:211|이번미실행;코드존재만확인|
|Python unittest|test_image_duplicates_ignore_unrelated_metadata_and_can_be_removed|컬러화POC/tests/test_app.py:238|이번미실행;코드존재만확인|
|Python unittest|test_large_file_list_ingestion|컬러화POC/tests/test_app.py:265|이번미실행;코드존재만확인|
|Python unittest|test_saved_settings_restore_for_same_content_hash|컬러화POC/tests/test_app.py:275|이번미실행;코드존재만확인|
|Python unittest|test_account_ownership_and_persistent_batch_restore|컬러화POC/tests/test_app.py:298|이번미실행;코드존재만확인|
|Python unittest|test_roi_annotations_persist_by_hash_and_reject_invalid_regions|컬러화POC/tests/test_app.py:355|이번미실행;코드존재만확인|
|Python unittest|test_individual_via_json_and_batch_roi_package|컬러화POC/tests/test_app.py:418|이번미실행;코드존재만확인|
|Python unittest|test_roi_labels_can_be_added_and_renamed_with_saved_regions_migrated|컬러화POC/tests/test_app.py:491|이번미실행;코드존재만확인|
|Python unittest|test_individual_and_background_batch_downloads|컬러화POC/tests/test_app.py:523|이번미실행;코드존재만확인|
|Python unittest|test_item_name_edit_is_persisted_used_for_downloads_and_can_be_reset|컬러화POC/tests/test_app.py:615|이번미실행;코드존재만확인|
|Python unittest|test_page_uses_action_level_png_and_jpg_exports|컬러화POC/tests/test_app.py:690|이번미실행;코드존재만확인|
|Python unittest|test_background_job_can_be_cancelled|컬러화POC/tests/test_app.py:730|이번미실행;코드존재만확인|
|ROI JS script|도형이동/resize·점/경계기하 assert|컬러화POC/tests/roi_geometry.test.js:1|이번미실행|

### 7.3 테스트 코드가 검증하려는 범위와 현재 제약

- backend domain/entity/repository/service/controller/JWT/context 테스트 파일 존재. 신규 StudentAnalyticsServiceTest/StudentAnalyticsControllerTest는 이력분모·무응답·교수/관리자허용·학생/미인증차단을 명시한다. 전체소스 컴파일 전 이 신규테스트가 정상수행된것으로 쓰지 않는다.
- CropFixture가현재없는 `aiPrediction/aiConfidence` builder를참조하고 CropServiceTest는구생성자를사용한다. 따라서과거compile실패와현재소스불일치의근거가있다. 이번에는고치거나재실행하지않았다.
- 프런트엔드 회귀는session/storage/오래된응답취소·도말별학생정답률·학습이력상태/분모·mock계약을확인하려는함수수준테스트다. 실제API·DB·브라우저동작전체의통과증거는아니다.
- AI 전용추론unit/integration test파일은조사범위에서미발견. /health Dockercheck는프로세스/모델ready수준이고추론정확도아님.
- Locust는기본계정목록과랜덤반복제출을사용하며이미지로드task는pass이다. 60개의독립학생계정을시험한것으로간주불가. ai_bench의timeout120과동시thread/반복측정코드는있으나실제결과없음.

### 7.4 추후 실행 준비·기록법

1. 별도 DB/FS/포트/모의AI를준비하고운영URL/볼륨/학생정보가아닌지확인한다. 합성역할별계정과폐기가능한Task/Assignment·6클래스crop·유효/손상영상·진단manifest를준비한다.
2. ST의입력은실제사용한가명/파일SHA/fixture버전으로치환하고브랜치/commit·서버/브라우저버전·날짜시각·수행자를기록한다.
3. 정상→권한→입력/마감/예외→GT/통계일관성순서로수행한다. 저장/삭제/AI장애는격리에서만실행한다.
4. 각ID별요청·응답HTTP/내용·UI캡처·DB전후차이를민감정보제거후로그파일에보관한다. 예상과다르면FAIL·결함ID·정정commit·재시험결과를연결한다.
5. B/A/X/Y와미수행/차단을ID단위로재집계한다. 빌드/단위테스트수는부록에별도집계한다.

시험소스 실행 명령 예시(환경 준비 후 별도 수행;이번에는실행안함):

```powershell
# frontend: deps가준비된격리환경
node --test src/utils/*.test.js
npm run build
# backend: fixture/생성자동기화·test프로필과H2확인후
.\gradlew.bat test
# 컬러화: 임시전용data와합성DICOM fixture
python -m unittest discover -s tests -v
node tests/roi_geometry.test.js
```

AI 예측 성능은현재weights와학습/검증분할·데이터사용허가·지표·실험로그가연결된경우에만별도표를작성한다. definition초안의9클래스/DenseNet121 결과를현재6클래스/201의정확도나시간으로쓰지않는다.

