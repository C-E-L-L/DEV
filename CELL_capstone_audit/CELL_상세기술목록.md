# CELL 상세 기술목록

기준: `juhun@94aeb1a`, 2026-10-19. 식별자와 판정 범위는 본문과 같다. **실제 소스를 읽어 추출한 선언/호출 목록**이며 컴파일러/라이브러리 생성 멤버와 익명 콜백을 자체 클래스처럼 만들어 넣지 않았다. Java 소스 153파일의 명시 타입 220개(운영139·시험81), 멤버 1061개를 기록한다. 파서는 주석·문자열을 마스킹한 brace/선언 분석이며 오버로드·중첩 record·compact constructor를 포함한다. 메서드 본문의 로컬 변수는 클래스 멤버가 아니다. 동작 검증 결과와는 별개다.

## A. 자체 Java 타입·클래스/멤버 전체

### A.1 타입 목록과 역할·관계

상속·구현은 소스 header의 `extends/implements`에 한한다. 주입 필드의 원본 타입을 의존성으로 기록한다. 어떤 US와 직접 관계가 확정되지 않으면 공통기반/시험지원·Sprint 미배정으로 남긴다.

|C_ID|종류·클래스명|패키지·파일/줄|역할|상속·구현 선언|주입/보유 타입|US/TK 연결|
|---|---|---|---|---|---|---|
|C-001|class CellApplication|com.cell.platform; backend/src/main/java/com/cell/platform/CellApplication.java:7|Spring Boot 진입점|class CellApplication|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-002|class AdminSeedRunner|com.cell.platform.config; backend/src/main/java/com/cell/platform/config/AdminSeedRunner.java:16|시작 시 환경설정 관리자 계정 존재 보장|class AdminSeedRunner implements CommandLineRunner|UserRepository, PasswordEncoder, String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-003|class JwtAuthFilter|com.cell.platform.config; backend/src/main/java/com/cell/platform/config/JwtAuthFilter.java:17|Bearer 검증·ROLE claim으로 SecurityContext 인증 설정|class JwtAuthFilter extends OncePerRequestFilter|JwtTokenProvider|US-003; 각 US의 TK-xxx-01/02|
|C-004|class JwtTokenProvider|com.cell.platform.config; backend/src/main/java/com/cell/platform/config/JwtTokenProvider.java:14|서명·만료·subject/role JWT 생성/파싱|class JwtTokenProvider|SecretKey, long|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-005|class SecurityConfig|com.cell.platform.config; backend/src/main/java/com/cell/platform/config/SecurityConfig.java:24|stateless URL 인가·CORS·BCrypt·JWT filter 설치|class SecurityConfig|JwtTokenProvider|US-004; 각 US의 TK-xxx-01/02|
|C-006|class ThumbnailBackfillRunner|com.cell.platform.config; backend/src/main/java/com/cell/platform/config/ThumbnailBackfillRunner.java:24|시작 시 기존 원본의 썸네일 보정|class ThumbnailBackfillRunner implements CommandLineRunner|FileStorageService, String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-007|class WebConfig|com.cell.platform.config; backend/src/main/java/com/cell/platform/config/WebConfig.java:11|인증된 원본/crop/썸네일·진단 파일 리소스 경로|class WebConfig implements WebMvcConfigurer|String|US-030; 각 US의 TK-xxx-01/02|
|C-008|class AdminController|com.cell.platform.controller; backend/src/main/java/com/cell/platform/controller/AdminController.java:23|Admin 관련 HTTP 요청과 서비스/DTO 연결|class AdminController|AdminService|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-009|class AnimalSpeciesController|com.cell.platform.controller; backend/src/main/java/com/cell/platform/controller/AnimalSpeciesController.java:23|AnimalSpecies 관련 HTTP 요청과 서비스/DTO 연결|class AnimalSpeciesController|AnimalSpeciesService|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-010|class AssignmentController|com.cell.platform.controller; backend/src/main/java/com/cell/platform/controller/AssignmentController.java:24|Assignment 관련 HTTP 요청과 서비스/DTO 연결|class AssignmentController|TaskService, TaskRepository|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-011|class AuthController|com.cell.platform.controller; backend/src/main/java/com/cell/platform/controller/AuthController.java:16|Auth 관련 HTTP 요청과 서비스/DTO 연결|class AuthController|AuthService|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-012|class CropController|com.cell.platform.controller; backend/src/main/java/com/cell/platform/controller/CropController.java:17|Crop 관련 HTTP 요청과 서비스/DTO 연결|class CropController|CropService|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-013|class CropIssueReportController|com.cell.platform.controller; backend/src/main/java/com/cell/platform/controller/CropIssueReportController.java:16|CropIssueReport 관련 HTTP 요청과 서비스/DTO 연결|class CropIssueReportController|CropIssueReportService|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-014|class GameRecordController|com.cell.platform.controller; backend/src/main/java/com/cell/platform/controller/GameRecordController.java:15|GameRecord 관련 HTTP 요청과 서비스/DTO 연결|class GameRecordController|GameRecordService|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-015|class LabelingController|com.cell.platform.controller; backend/src/main/java/com/cell/platform/controller/LabelingController.java:21|Labeling 관련 HTTP 요청과 서비스/DTO 연결|class LabelingController|LabelingService|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-016|class StatsController|com.cell.platform.controller; backend/src/main/java/com/cell/platform/controller/StatsController.java:14|Stats 관련 HTTP 요청과 서비스/DTO 연결|class StatsController|StatsService|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-017|class StudentAnalyticsController|com.cell.platform.controller; backend/src/main/java/com/cell/platform/controller/StudentAnalyticsController.java:13|StudentAnalytics 관련 HTTP 요청과 서비스/DTO 연결|class StudentAnalyticsController|StudentAnalyticsService|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-018|class StudentReviewController|com.cell.platform.controller; backend/src/main/java/com/cell/platform/controller/StudentReviewController.java:16|StudentReview 관련 HTTP 요청과 서비스/DTO 연결|class StudentReviewController|SubmissionService|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-019|class SubmissionController|com.cell.platform.controller; backend/src/main/java/com/cell/platform/controller/SubmissionController.java:18|Submission 관련 HTTP 요청과 서비스/DTO 연결|class SubmissionController|SubmissionService|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-020|class TaskController|com.cell.platform.controller; backend/src/main/java/com/cell/platform/controller/TaskController.java:33|Task 관련 HTTP 요청과 서비스/DTO 연결|class TaskController|TaskService, DiagnosticTaskService, // [추가된 부분] SubmissionService 주입 private final SubmissionService, AnimalSpeciesService|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-021|enum CellType|com.cell.platform.domain.crop; backend/src/main/java/com/cell/platform/domain/crop/CellType.java:3|업무 값/상태 상수 집합|enum CellType|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-022|class Crop|com.cell.platform.domain.crop; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:7|업무 모델·생성 규칙|class Crop|Long, String, CellType, Double|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-023|interface CropRepository|com.cell.platform.domain.crop; backend/src/main/java/com/cell/platform/domain/crop/CropRepository.java:6|업무 저장소 추상 계약|interface CropRepository|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-024|interface ConfusionMatrixRepository|com.cell.platform.domain.matrix; backend/src/main/java/com/cell/platform/domain/matrix/ConfusionMatrixRepository.java:7|업무 저장소 추상 계약|interface ConfusionMatrixRepository|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-025|class Submission|com.cell.platform.domain.submission; backend/src/main/java/com/cell/platform/domain/submission/Submission.java:9|업무 모델·생성 규칙|class Submission|Long, String, CellType, LocalDateTime|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-026|interface SubmissionRepository|com.cell.platform.domain.submission; backend/src/main/java/com/cell/platform/domain/submission/SubmissionRepository.java:7|업무 저장소 추상 계약|interface SubmissionRepository|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-027|class Task|com.cell.platform.domain.task; backend/src/main/java/com/cell/platform/domain/task/Task.java:11|업무 모델·생성 규칙|class Task|Long, TaskStatus, String, LocalDateTime, List<Crop>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-028|interface TaskRepository|com.cell.platform.domain.task; backend/src/main/java/com/cell/platform/domain/task/TaskRepository.java:7|업무 저장소 추상 계약|interface TaskRepository|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-029|enum TaskStatus|com.cell.platform.domain.task; backend/src/main/java/com/cell/platform/domain/task/TaskStatus.java:3|업무 값/상태 상수 집합|enum TaskStatus|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-030|enum Role|com.cell.platform.domain.user; backend/src/main/java/com/cell/platform/domain/user/Role.java:7|업무 값/상태 상수 집합|enum Role|STUDENT, EXPERT,|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-031|class User|com.cell.platform.domain.user; backend/src/main/java/com/cell/platform/domain/user/User.java:10|업무 모델·생성 규칙|class User|Long, String, Role, UserStatus, LocalDateTime|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-032|interface UserRepository|com.cell.platform.domain.user; backend/src/main/java/com/cell/platform/domain/user/UserRepository.java:6|업무 저장소 추상 계약|interface UserRepository|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-033|enum UserStatus|com.cell.platform.domain.user; backend/src/main/java/com/cell/platform/domain/user/UserStatus.java:3|업무 값/상태 상수 집합|enum UserStatus|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-034|record AdminStatusRequest|com.cell.platform.dto.request; backend/src/main/java/com/cell/platform/dto/request/AdminStatusRequest.java:5|HTTP 요청 입력·필드/일부 validation 계약|record AdminStatusRequest( @NotBlank String status )|String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-035|record AnimalSpeciesNameRequest|com.cell.platform.dto.request; backend/src/main/java/com/cell/platform/dto/request/AnimalSpeciesNameRequest.java:6|HTTP 요청 입력·필드/일부 validation 계약|record AnimalSpeciesNameRequest( @NotBlank(message = "동물 종 이름은 필수입니다.") @Size(max = 60, message = "동물 종 이름은 60자 이하여야 합니다.") String name )|String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-036|record ConfirmRequest|com.cell.platform.dto.request; backend/src/main/java/com/cell/platform/dto/request/ConfirmRequest.java:7|HTTP 요청 입력·필드/일부 validation 계약|record ConfirmRequest( String finalLabel )|String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-037|record CropIssueReportRequest|com.cell.platform.dto.request; backend/src/main/java/com/cell/platform/dto/request/CropIssueReportRequest.java:8|HTTP 요청 입력·필드/일부 validation 계약|record CropIssueReportRequest( Long taskId, Long cropId, String studentId, String reason )|Long, String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-038|record DeadlineUpdateRequest|com.cell.platform.dto.request; backend/src/main/java/com/cell/platform/dto/request/DeadlineUpdateRequest.java:5|HTTP 요청 입력·필드/일부 validation 계약|record DeadlineUpdateRequest( LocalDateTime deadlineAt )|LocalDateTime|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-039|record DiagnosticTaskCreateRequest|com.cell.platform.dto.request; backend/src/main/java/com/cell/platform/dto/request/DiagnosticTaskCreateRequest.java:8|HTTP 요청 입력·필드/일부 validation 계약|record DiagnosticTaskCreateRequest( @NotNull(message = "전체 문제 수는 필수입니다.") @Min(value = 1, message = "전체 문제 수는 1 이상이어야 합니다.") Integer totalQuestions, @NotNull(message = "클래스 분포는 필수입니다.") Map&lt;String, Integer&gt; classDistribution )|Integer, Map<String, Integer>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-040|record GameRecordRequest|com.cell.platform.dto.request; backend/src/main/java/com/cell/platform/dto/request/GameRecordRequest.java:5|HTTP 요청 입력·필드/일부 validation 계약|record GameRecordRequest(String mode, List&lt;Entry&gt; players)|String, List<Entry>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-041|record Entry|com.cell.platform.dto.request; backend/src/main/java/com/cell/platform/dto/request/GameRecordRequest.java:6|HTTP 요청 입력·필드/일부 validation 계약|record Entry(String name, int score)|String, int|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-042|record LabelingImportRequest|com.cell.platform.dto.request; backend/src/main/java/com/cell/platform/dto/request/LabelingImportRequest.java:5|HTTP 요청 입력·필드/일부 validation 계약|record LabelingImportRequest( Long taskId, List&lt;CellLabel&gt; cells )|Long, List<CellLabel>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-043|record CellLabel|com.cell.platform.dto.request; backend/src/main/java/com/cell/platform/dto/request/LabelingImportRequest.java:9|HTTP 요청 입력·필드/일부 validation 계약|record CellLabel( Long cropId, String gtLabel, String finalLabel )|Long, String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-044|record LoginRequest|com.cell.platform.dto.request; backend/src/main/java/com/cell/platform/dto/request/LoginRequest.java:7|HTTP 요청 입력·필드/일부 validation 계약|record LoginRequest( String username, String password )|String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-045|record RegisterRequest|com.cell.platform.dto.request; backend/src/main/java/com/cell/platform/dto/request/RegisterRequest.java:9|HTTP 요청 입력·필드/일부 validation 계약|record RegisterRequest( @NotBlank(message = "아이디는 비어있을 수 없습니다.") String username, String name, @NotBlank(message = "비밀번호는 비어있을 수 없습니다.") String password, String role )|String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-046|record SpeciesUpdateRequest|com.cell.platform.dto.request; backend/src/main/java/com/cell/platform/dto/request/SpeciesUpdateRequest.java:5|HTTP 요청 입력·필드/일부 validation 계약|record SpeciesUpdateRequest( @NotNull(message = "동물 종은 필수입니다.") Long speciesId )|Long|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-047|record StudentRosterRequest|com.cell.platform.dto.request; backend/src/main/java/com/cell/platform/dto/request/StudentRosterRequest.java:5|HTTP 요청 입력·필드/일부 validation 계약|record StudentRosterRequest( List&lt;String&gt; studentIds )|List<String>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-048|record SubmissionRequest|com.cell.platform.dto.request; backend/src/main/java/com/cell/platform/dto/request/SubmissionRequest.java:7|HTTP 요청 입력·필드/일부 validation 계약|record SubmissionRequest( Long cropId, String studentLabel )|Long, String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-049|record AdminCropResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/AdminCropResponse.java:3|HTTP 응답/중첩 자료 구조|record AdminCropResponse( Long cropId, Long taskId, String cropFilename, String originalSmearFilename, Long speciesId, String speciesCode, String speciesName, String gtLabel, String pseudoLabel, String finalLabel, boolean hasLabel )|Long, String, boolean|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-050|record AdminSmearResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/AdminSmearResponse.java:5|HTTP 응답/중첩 자료 구조|record AdminSmearResponse( Long taskId, String originalFilename, String uploadedFilename, Long speciesId, String speciesCode, String speciesName, LocalDateTime createdAt, long totalCrops, long labeledCrops, boolean hasLabel )|Long, String, LocalDateTime, long, boolean|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-051|class AiAnalysisResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/AiAnalysisResponse.java:10|HTTP 응답/중첩 자료 구조|class AiAnalysisResponse|int, List<DetectedCell>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-052|class DetectedCell|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/AiAnalysisResponse.java:19|HTTP 응답/중첩 자료 구조|class DetectedCell|String, Double|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-053|record AnimalSpeciesResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/AnimalSpeciesResponse.java:5|HTTP 응답/중첩 자료 구조|record AnimalSpeciesResponse( Long id, String code, String name, boolean builtIn )|Long, String, boolean|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-054|record AssignmentResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/AssignmentResponse.java:6|HTTP 응답/중첩 자료 구조|record AssignmentResponse( Long assignmentId, String title, String expertUsername, LocalDateTime createdAt, List&lt;TaskUploadResponse&gt; tasks, int totalCrops )|Long, String, LocalDateTime, List<TaskUploadResponse>, int|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-055|record CropIssueReportResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/CropIssueReportResponse.java:7|HTTP 응답/중첩 자료 구조|record CropIssueReportResponse( Long id, String studentId, Long taskId, Long cropId, String cropFilename, String speciesCode, String speciesName, String reason, LocalDateTime createdAt )|Long, String, LocalDateTime|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-056|record CropResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:5|HTTP 응답/중첩 자료 구조|record CropResponse( Long id, Long taskId, String cropFilename, String bbox, String gtLabel, String pseudoLabel, String finalLabel, Double aiBboxConfidence, Double aiClassificationConfidence, String originalSmearFilename, Long speciesId, String speciesCode, String speciesName )|Long, String, Double|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-057|record CropStatsResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|HTTP 응답/중첩 자료 구조|record CropStatsResponse( Long taskId, Long cropId, String filename, String originalSmearFilename, Long speciesId, String speciesCode, String speciesName, String bbox, String gtLabel, String pseudoLabel, Double aiBboxConfidence, Double aiClassificationConfidence, String finalLabel, int totalAnswers, double errorRate, double accuracyRate, double hardScore, List&lt;String&gt; wrongDetails, Map&lt;String, Integer&gt; voteDistribution, Map&lt;String, List&lt;VoterDetail&gt;&gt; votersByLabel )|Long, String, Double, int, double, List<String>, Map<String, Integer>, Map<String, List<VoterDetail>>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-058|record VoterDetail|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:30|HTTP 응답/중첩 자료 구조|record VoterDetail( String studentId, String studentName, String studentDisplayName )|String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-059|record DiagnosticPoolStatsResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/DiagnosticPoolStatsResponse.java:5|HTTP 응답/중첩 자료 구조|record DiagnosticPoolStatsResponse( int totalAvailable, Map&lt;String, Integer&gt; availableByClass, Long speciesId, String speciesCode, String speciesName )|int, Map<String, Integer>, Long, String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-060|class DiagnosticStudentMatrixResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/DiagnosticStudentMatrixResponse.java:11|HTTP 응답/중첩 자료 구조|class DiagnosticStudentMatrixResponse|List<StudentMatrixDetail>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-061|class StudentMatrixDetail|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/DiagnosticStudentMatrixResponse.java:16|HTTP 응답/중첩 자료 구조|class StudentMatrixDetail|String, Map<String, Map<String, Integer>>, int|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-062|record GameRecordResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/GameRecordResponse.java:3|HTTP 응답/중첩 자료 구조|record GameRecordResponse(String name, int score, String date)|String, int|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-063|record LabelingManifestResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:5|HTTP 응답/중첩 자료 구조|record LabelingManifestResponse( Long taskId, String smearFilename, String storedSmearFilename, String exportSmearFilename, Long speciesId, String speciesCode, String speciesName, List&lt;CellAnnotation&gt; cells )|Long, String, List<CellAnnotation>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-064|record CellAnnotation|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:15|HTTP 응답/중첩 자료 구조|record CellAnnotation( Long cropId, String exportFilename, String storedFilename, String bbox, String gtLabel, String finalLabel )|Long, String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-065|record LoginResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/LoginResponse.java:3|HTTP 응답/중첩 자료 구조|record LoginResponse( String accessToken, String tokenType, String role, String username, String name )|String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-066|record MyResultsResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:8|HTTP 응답/중첩 자료 구조|record MyResultsResponse( int total, int correct, int wrong, int accuracy, List&lt;Detail&gt; details, List&lt;String&gt; labels, Map&lt;String, Map&lt;String, Integer&gt;&gt; confusionMatrix )|int, List<Detail>, List<String>, Map<String, Map<String, Integer>>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-067|record Detail|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:18|HTTP 응답/중첩 자료 구조|record Detail( Long cropId, String cropFilename, String speciesCode, String speciesName, String studentLabel, String correctLabel, Boolean isCorrect )|Long, String, Boolean|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-068|record RegisterResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/RegisterResponse.java:3|HTTP 응답/중첩 자료 구조|record RegisterResponse( String status, String message )|String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-069|record RosterImportResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/RosterImportResponse.java:3|HTTP 응답/중첩 자료 구조|record RosterImportResponse( int added, int skipped )|int|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-070|record StudentLearningResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:6|HTTP 응답/중첩 자료 구조|record StudentLearningResponse(String studentId, List&lt;Activity&gt; activities)|String, List<Activity>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-071|record Summary|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:7|HTTP 응답/중첩 자료 구조|record Summary(int totalCells, int answeredCells, int correct, int wrong, int pendingAnswers, boolean labelingComplete, Double accuracy)|int, boolean, Double|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-072|record Activity|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:10|HTTP 응답/중첩 자료 구조|record Activity(String scopeType, Long scopeId, String title, LocalDateTime createdAt, LocalDateTime deadlineAt, Summary summary, List&lt;TaskResult&gt; tasks)|String, Long, LocalDateTime, Summary, List<TaskResult>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-073|record TaskResult|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:14|HTTP 응답/중첩 자료 구조|record TaskResult(Long taskId, String title, String filename, String speciesCode, String speciesName, Summary summary)|Long, String, Summary|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-074|record TaskDetail|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:17|HTTP 응답/중첩 자료 구조|record TaskDetail(String studentId, TaskResult task, List&lt;CellResult&gt; cells)|String, TaskResult, List<CellResult>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-075|record CellResult|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:19|HTTP 응답/중첩 자료 구조|record CellResult(Long cropId, String cropFilename, String studentLabel, String correctLabel, Boolean isCorrect, LocalDateTime submittedAt)|Long, String, Boolean, LocalDateTime|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-076|record StudentReviewResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:6|HTTP 응답/중첩 자료 구조|record StudentReviewResponse( List&lt;ReviewGroup&gt; reviews )|List<ReviewGroup>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-077|record ReviewGroup|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|HTTP 응답/중첩 자료 구조|record ReviewGroup( String scopeType, Long scopeId, String title, String thumbnailFilename, LocalDateTime deadlineAt, String availabilityReason, int totalCells, int answeredCells, int unsubmittedCells, int gradedAnswers, int pendingAnswers, int correct, int wrong, Integer accuracy, List&lt;ReviewCell&gt; cells )|String, Long, LocalDateTime, int, Integer, List<ReviewCell>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-078|record ReviewCell|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:28|HTTP 응답/중첩 자료 구조|record ReviewCell( Long taskId, Long cropId, String cropFilename, String originalSmearFilename, String speciesCode, String speciesName, String bbox, String studentLabel, String correctLabel, Boolean isCorrect )|Long, String, Boolean|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-079|record StudentRosterResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/StudentRosterResponse.java:7|HTTP 응답/중첩 자료 구조|record StudentRosterResponse( Long id, String studentId, String registeredBy, Long claimedUserId, LocalDateTime createdAt )|Long, String, LocalDateTime|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-080|record TaskResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:6|HTTP 응답/중첩 자료 구조|record TaskResponse( Long id, String status, String originalFilename, String uploadedFilename, Long assignmentId, String title, Long speciesId, String speciesCode, String speciesName, LocalDateTime createdAt, LocalDateTime deadlineAt, int cropCount )|Long, String, LocalDateTime, int|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-081|record TaskUploadResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/TaskUploadResponse.java:5|HTTP 응답/중첩 자료 구조|record TaskUploadResponse( Long taskId, String originalImage, Long speciesId, String speciesCode, String speciesName, int totalDetected, List&lt;CropResponse&gt; crops )|Long, String, int, List<CropResponse>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-082|record TrainingDataResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/TrainingDataResponse.java:5|HTTP 응답/중첩 자료 구조|record TrainingDataResponse( Long cropId, String cropFilename, String label, Long speciesId, String speciesCode, String speciesName )|Long, String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-083|record UserResponse|com.cell.platform.dto.response; backend/src/main/java/com/cell/platform/dto/response/UserResponse.java:5|HTTP 응답/중첩 자료 구조|record UserResponse( Long id, String username, String name, String role, String status, LocalDateTime createdAt )|Long, String, LocalDateTime|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-084|class AnimalSpeciesEntity|com.cell.platform.entity; backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:22|JPA 테이블·관계·저장 필드와 일부 변경 메서드|class AnimalSpeciesEntity|Long, String, boolean, LocalDateTime|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-085|class AssignmentEntity|com.cell.platform.entity; backend/src/main/java/com/cell/platform/entity/AssignmentEntity.java:11|JPA 테이블·관계·저장 필드와 일부 변경 메서드|class AssignmentEntity|Long, String, LocalDateTime|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-086|class CropEntity|com.cell.platform.entity; backend/src/main/java/com/cell/platform/entity/CropEntity.java:11|JPA 테이블·관계·저장 필드와 일부 변경 메서드|class CropEntity|Long, TaskEntity, String, CellType, Double|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-087|class CropIssueReportEntity|com.cell.platform.entity; backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:19|JPA 테이블·관계·저장 필드와 일부 변경 메서드|class CropIssueReportEntity|Long, String, LocalDateTime|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-088|class GameRecordEntity|com.cell.platform.entity; backend/src/main/java/com/cell/platform/entity/GameRecordEntity.java:13|JPA 테이블·관계·저장 필드와 일부 변경 메서드|class GameRecordEntity|Long, String, int, LocalDateTime|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-089|class StudentConfusionMatrixEntity|com.cell.platform.entity; backend/src/main/java/com/cell/platform/entity/StudentConfusionMatrixEntity.java:22|JPA 테이블·관계·저장 필드와 일부 변경 메서드|class StudentConfusionMatrixEntity|Long, String, Map<String, Map<String, Integer>>, LocalDateTime|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-090|class StudentRosterEntity|com.cell.platform.entity; backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:14|JPA 테이블·관계·저장 필드와 일부 변경 메서드|class StudentRosterEntity|Long, String, LocalDateTime|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-091|class SubmissionEntity|com.cell.platform.entity; backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:12|JPA 테이블·관계·저장 필드와 일부 변경 메서드|class SubmissionEntity|Long, CropEntity, String, CellType, LocalDateTime|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-092|class TaskEntity|com.cell.platform.entity; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:14|JPA 테이블·관계·저장 필드와 일부 변경 메서드|class TaskEntity|Long, TaskStatus, String, AnimalSpeciesEntity, LocalDateTime, List<CropEntity>|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-093|class UserEntity|com.cell.platform.entity; backend/src/main/java/com/cell/platform/entity/UserEntity.java:13|JPA 테이블·관계·저장 필드와 일부 변경 메서드|class UserEntity|Long, String, Role, UserStatus, LocalDateTime|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-094|class AuthenticationException|com.cell.platform.exception; backend/src/main/java/com/cell/platform/exception/AuthenticationException.java:3|업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약|class AuthenticationException extends CustomException|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-095|class AuthorizationException|com.cell.platform.exception; backend/src/main/java/com/cell/platform/exception/AuthorizationException.java:3|업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약|class AuthorizationException extends CustomException|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-096|class BadRequestException|com.cell.platform.exception; backend/src/main/java/com/cell/platform/exception/BadRequestException.java:5|업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약|class BadRequestException extends BusinessException|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-097|class BusinessException|com.cell.platform.exception; backend/src/main/java/com/cell/platform/exception/BusinessException.java:3|업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약|class BusinessException extends RuntimeException|int, ErrorCode|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-098|class CustomException|com.cell.platform.exception; backend/src/main/java/com/cell/platform/exception/CustomException.java:3|업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약|class CustomException extends RuntimeException|ErrorCode|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-099|class DuplicateUsernameException|com.cell.platform.exception; backend/src/main/java/com/cell/platform/exception/DuplicateUsernameException.java:3|업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약|class DuplicateUsernameException extends RuntimeException|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-100|class EntityNotFoundException|com.cell.platform.exception; backend/src/main/java/com/cell/platform/exception/EntityNotFoundException.java:3|업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약|class EntityNotFoundException extends RuntimeException|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-101|enum ErrorCode|com.cell.platform.exception; backend/src/main/java/com/cell/platform/exception/ErrorCode.java:3|업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약|enum ErrorCode|String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-102|record ErrorResponse|com.cell.platform.exception; backend/src/main/java/com/cell/platform/exception/ErrorResponse.java:3|업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약|record ErrorResponse( String message, String errorCode )|String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-103|class GlobalExceptionHandler|com.cell.platform.exception; backend/src/main/java/com/cell/platform/exception/GlobalExceptionHandler.java:13|업무/인증/검증/파일/일반 예외 HTTP 응답 변환|class GlobalExceptionHandler|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-104|class InfraStructureException|com.cell.platform.exception; backend/src/main/java/com/cell/platform/exception/InfraStructureException.java:3|업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약|class InfraStructureException extends CustomException|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-105|class NotFoundException|com.cell.platform.exception; backend/src/main/java/com/cell/platform/exception/NotFoundException.java:5|업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약|class NotFoundException extends BusinessException|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-106|interface AssignmentJpaRepository|com.cell.platform.infra.assignment; backend/src/main/java/com/cell/platform/infra/assignment/AssignmentJpaRepository.java:7|Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함)|interface AssignmentJpaRepository extends JpaRepository&lt;AssignmentEntity, Long&gt;|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-107|class CropCoreRepository|com.cell.platform.infra.crop; backend/src/main/java/com/cell/platform/infra/crop/CropCoreRepository.java:16|domain repository의 JPA adapter·Mapper 호출|class CropCoreRepository implements CropRepository|CropJpaRepository, TaskJpaRepository|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-108|interface CropJpaRepository|com.cell.platform.infra.crop; backend/src/main/java/com/cell/platform/infra/crop/CropJpaRepository.java:8|Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함)|interface CropJpaRepository extends JpaRepository&lt;CropEntity, Long&gt;|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-109|interface GameRecordJpaRepository|com.cell.platform.infra.game; backend/src/main/java/com/cell/platform/infra/game/GameRecordJpaRepository.java:11|Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함)|interface GameRecordJpaRepository extends JpaRepository&lt;GameRecordEntity, Long&gt;|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-110|class ConfusionMatrixCoreRepository|com.cell.platform.infra.matrix; backend/src/main/java/com/cell/platform/infra/matrix/ConfusionMatrixCoreRepository.java:13|domain repository의 JPA adapter·Mapper 호출|class ConfusionMatrixCoreRepository implements ConfusionMatrixRepository|ConfusionMatrixJpaRepository|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-111|interface ConfusionMatrixJpaRepository|com.cell.platform.infra.matrix; backend/src/main/java/com/cell/platform/infra/matrix/ConfusionMatrixJpaRepository.java:14|Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함)|interface ConfusionMatrixJpaRepository extends JpaRepository&lt;StudentConfusionMatrixEntity, Long&gt;|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-112|interface CropIssueReportJpaRepository|com.cell.platform.infra.report; backend/src/main/java/com/cell/platform/infra/report/CropIssueReportJpaRepository.java:9|Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함)|interface CropIssueReportJpaRepository extends JpaRepository&lt;CropIssueReportEntity, Long&gt;|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-113|interface AnimalSpeciesJpaRepository|com.cell.platform.infra.species; backend/src/main/java/com/cell/platform/infra/species/AnimalSpeciesJpaRepository.java:9|Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함)|interface AnimalSpeciesJpaRepository extends JpaRepository&lt;AnimalSpeciesEntity, Long&gt;|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-114|class SubmissionCoreRepository|com.cell.platform.infra.submission; backend/src/main/java/com/cell/platform/infra/submission/SubmissionCoreRepository.java:17|domain repository의 JPA adapter·Mapper 호출|class SubmissionCoreRepository implements SubmissionRepository|SubmissionJpaRepository, CropJpaRepository|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-115|interface SubmissionJpaRepository|com.cell.platform.infra.submission; backend/src/main/java/com/cell/platform/infra/submission/SubmissionJpaRepository.java:11|Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함)|interface SubmissionJpaRepository extends JpaRepository&lt;SubmissionEntity, Long&gt;|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-116|class TaskCoreRepository|com.cell.platform.infra.task; backend/src/main/java/com/cell/platform/infra/task/TaskCoreRepository.java:19|domain repository의 JPA adapter·Mapper 호출|class TaskCoreRepository implements TaskRepository|TaskJpaRepository, AnimalSpeciesJpaRepository|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-117|interface TaskJpaRepository|com.cell.platform.infra.task; backend/src/main/java/com/cell/platform/infra/task/TaskJpaRepository.java:9|Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함)|interface TaskJpaRepository extends JpaRepository&lt;TaskEntity, Long&gt;|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-118|interface StudentRosterJpaRepository|com.cell.platform.infra.user; backend/src/main/java/com/cell/platform/infra/user/StudentRosterJpaRepository.java:9|Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함)|interface StudentRosterJpaRepository extends JpaRepository&lt;StudentRosterEntity, Long&gt;|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-119|class UserCoreRepository|com.cell.platform.infra.user; backend/src/main/java/com/cell/platform/infra/user/UserCoreRepository.java:15|domain repository의 JPA adapter·Mapper 호출|class UserCoreRepository implements UserRepository|UserJpaRepository|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-120|interface UserJpaRepository|com.cell.platform.infra.user; backend/src/main/java/com/cell/platform/infra/user/UserJpaRepository.java:9|Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함)|interface UserJpaRepository extends JpaRepository&lt;UserEntity, Long&gt;|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-121|class AdminService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/AdminService.java:37|사용자·학생 명단·전체 도말/crop 관리|class AdminService|TaskJpaRepository, CropJpaRepository, UserRepository, UserJpaRepository, StudentRosterJpaRepository, PasswordEncoder|US-005, US-006, US-007, US-029; 각 US의 TK-xxx-01/02|
|C-122|class AiClientService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/AiClientService.java:20|multipart를 FastAPI에 동기로 보내고 응답 DTO 변환|class AiClientService|WebClient|US-032; 각 US의 TK-xxx-01/02|
|C-123|class AnimalSpeciesService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24|기본/사용자 종·이름 검증·Task 종 연결|class AnimalSpeciesService|String, AnimalSpeciesJpaRepository, TaskJpaRepository|US-008, US-009, US-010; 각 US의 TK-xxx-01/02|
|C-124|class AuthService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/AuthService.java:26|공개 학생 가입·명단 기반 상태·로그인 자격·JWT 발급 조율|class AuthService|UserRepository, StudentRosterJpaRepository, PasswordEncoder, JwtTokenProvider|US-001, US-002; 각 US의 TK-xxx-01/02|
|C-125|class CropIssueReportService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18|신고 요청값 저장·목록 파일/종 조합(대상/소유자 검증 없음)|class CropIssueReportService|CropIssueReportJpaRepository, CropRepository|US-025, US-026; 각 US의 TK-xxx-01/02|
|C-126|class CropService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/CropService.java:23|학생용 정답 숨김·crop 조회·final 정답 수정·학습 목록 추출|class CropService|CropRepository, CropCoreRepository, TaskRepository, SubmissionService|US-018, US-033; 각 US의 TK-xxx-01/02|
|C-127|class DiagnosticDatasetService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/DiagnosticDatasetService.java:20|진단 manifest 읽기·클래스별 보유량·비복원 무작위 표본|class DiagnosticDatasetService|ObjectMapper, String|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-128|record DiagnosticCell|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/DiagnosticDatasetService.java:106|소스 선언·사용 관계는 아래 멤버와 원본 위치 참조|record DiagnosticCell( String cropFilename, CellType label, String bbox )|String, CellType|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-129|class DiagnosticTaskService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:25|분포 검증과 GT 진단 Task 생성|class DiagnosticTaskService|DiagnosticDatasetService, TaskRepository, AnimalSpeciesService|US-024; 각 US의 TK-xxx-01/02|
|C-130|class FileStorageService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/FileStorageService.java:23|UUID 원본 저장·최대320 썸네일·파일 경로|class FileStorageService|int, Path|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-131|class GameRecordService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/GameRecordService.java:18|관리자 게임 양수 점수·모드 top15·전체 삭제|class GameRecordService|GameRecordJpaRepository, DateTimeFormatter|US-035; 각 US의 TK-xxx-01/02|
|C-132|class LabelingService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/LabelingService.java:34|VIA2.0.10 JSON·ZIP 입출력과 cropId/클래스/좌표 매핑|class LabelingService|TaskJpaRepository, CropJpaRepository, FileStorageService, ObjectMapper|US-027, US-028; 각 US의 TK-xxx-01/02|
|C-133|class PseudoLabelService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/PseudoLabelService.java:9|혼동행렬 행 정규화만. posterior·임계정책은 TODO|class PseudoLabelService|명시 보유 필드 없음|US-034; 각 US의 TK-xxx-01/02|
|C-134|class StatsService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/StatsService.java:21|세포별 투표·오답률·응답자 이름 통계|class StatsService|CropRepository, SubmissionRepository, UserRepository, List<String>|US-019, US-020, US-021; 각 US의 TK-xxx-01/02|
|C-135|class StudentAnalyticsService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:24|학생별 Assignment/Task/진단 이력·미응답/대기·셀 상세 요약|class StudentAnalyticsService|TaskRepository, CropRepository, SubmissionRepository, SubmissionService|US-022; 각 US의 TK-xxx-01/02|
|C-136|class SubmissionService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/SubmissionService.java:46|학생 답안 upsert·마감잠금·채점·복습·저장 혼동행렬 집계|class SubmissionService|String, SubmissionRepository, CropRepository, UserRepository, TaskRepository, DiagnosticDatasetService, ConfusionMatrixRepository|US-016, US-017, US-023; 각 US의 TK-xxx-01/02|
|C-137|record ScopeSnapshot|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/SubmissionService.java:398|소스 선언·사용 관계는 아래 멤버와 원본 위치 참조|record ScopeSnapshot( List&lt;Task&gt; tasks, List&lt;Crop&gt; crops, List&lt;Submission&gt; submissions, boolean diagnostic )|List<Task>, List<Crop>, List<Submission>, boolean|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-138|class TaskService|com.cell.platform.service; backend/src/main/java/com/cell/platform/service/TaskService.java:34|단일/다중 과제 생성·AI 호출·마감·DB 관련 기록 삭제|class TaskService|TaskRepository, FileStorageService, AiClientService, SubmissionJpaRepository, ConfusionMatrixJpaRepository, CropIssueReportJpaRepository, AssignmentJpaRepository, CropRepository, AnimalSpeciesService|US-011, US-012, US-013, US-014, US-015; 각 US의 TK-xxx-01/02|
|C-139|class Mapper|com.cell.platform.util; backend/src/main/java/com/cell/platform/util/Mapper.java:18|domain↔JPA entity 변환|class Mapper|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-140|class ApplicationTests [시험]|com.cell.platform; backend/src/test/java/com/cell/platform/ApplicationTests.java:7|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class ApplicationTests|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-141|class JwtTokenProviderTest [시험]|com.cell.platform.config; backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:10|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class JwtTokenProviderTest|JwtTokenProvider|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-142|class generateToken_메서드는 [시험]|com.cell.platform.config; backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:21|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class generateToken_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-143|class getUsername_메서드는 [시험]|com.cell.platform.config; backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:32|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class getUsername_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-144|class getRole_메서드는 [시험]|com.cell.platform.config; backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:42|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class getRole_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-145|class isValid_메서드는 [시험]|com.cell.platform.config; backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:52|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class isValid_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-146|class RepositoryContext [시험]|com.cell.platform.context; backend/src/test/java/com/cell/platform/context/RepositoryContext.java:22|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class RepositoryContext|UserJpaRepository, TaskJpaRepository, CropJpaRepository, SubmissionJpaRepository|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-147|class AuthControllerTest [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:27|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class AuthControllerTest|MockMvc, ObjectMapper, AuthService, JwtTokenProvider|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-148|class 회원가입_API는 [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:42|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class 회원가입_API는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-149|class 로그인_API는 [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:79|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class 로그인_API는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-150|class CropControllerTest [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:33|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class CropControllerTest|MockMvc, ObjectMapper, CropService, JwtTokenProvider|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-151|class 크롭_목록_조회_API는 [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:48|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class 크롭_목록_조회_API는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-152|class 정답_확정_API는 [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:67|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class 정답_확정_API는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-153|class 학습_데이터_조회_API는 [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:98|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class 학습_데이터_조회_API는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-154|class StatsControllerTest [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:27|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class StatsControllerTest|MockMvc, StatsService, JwtTokenProvider|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-155|class 과제별_통계_API는 [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:58|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class 과제별_통계_API는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-156|class 전체_통계_API는 [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:76|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class 전체_통계_API는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-157|class StudentAnalyticsControllerTest [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/StudentAnalyticsControllerTest.java:22|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class StudentAnalyticsControllerTest|MockMvc, StudentAnalyticsService, JwtTokenProvider|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-158|class SubmissionControllerTest [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:32|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class SubmissionControllerTest|MockMvc, ObjectMapper, SubmissionService, JwtTokenProvider|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-159|class 답안_제출_API는 [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:47|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class 답안_제출_API는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-160|class 풀이_이력_조회_API는 [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:87|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class 풀이_이력_조회_API는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-161|class 내_결과_조회_API는 [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:105|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class 내_결과_조회_API는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-162|class TaskControllerTest [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:34|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class TaskControllerTest|MockMvc, TaskService, DiagnosticTaskService, JwtTokenProvider|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-163|class 과제_목록_조회_API는 [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:49|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class 과제_목록_조회_API는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-164|class 이미지_업로드_API는 [시험]|com.cell.platform.controller; backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:77|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class 이미지_업로드_API는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-165|class CropTest [시험]|com.cell.platform.domain; backend/src/test/java/com/cell/platform/domain/CropTest.java:10|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class CropTest|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-166|class Crop은 [시험]|com.cell.platform.domain; backend/src/test/java/com/cell/platform/domain/CropTest.java:13|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class Crop은|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-167|class SubmissionTest [시험]|com.cell.platform.domain; backend/src/test/java/com/cell/platform/domain/SubmissionTest.java:10|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class SubmissionTest|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-168|class Submission은 [시험]|com.cell.platform.domain; backend/src/test/java/com/cell/platform/domain/SubmissionTest.java:13|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class Submission은|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-169|class TaskTest [시험]|com.cell.platform.domain; backend/src/test/java/com/cell/platform/domain/TaskTest.java:10|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class TaskTest|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-170|class Task는 [시험]|com.cell.platform.domain; backend/src/test/java/com/cell/platform/domain/TaskTest.java:13|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class Task는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-171|class UserTest [시험]|com.cell.platform.domain; backend/src/test/java/com/cell/platform/domain/UserTest.java:17|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class UserTest|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-172|class User는 [시험]|com.cell.platform.domain; backend/src/test/java/com/cell/platform/domain/UserTest.java:20|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class User는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-173|class CropEntityTest [시험]|com.cell.platform.entity; backend/src/test/java/com/cell/platform/entity/CropEntityTest.java:13|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class CropEntityTest|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-174|class CropEntity는 [시험]|com.cell.platform.entity; backend/src/test/java/com/cell/platform/entity/CropEntityTest.java:16|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class CropEntity는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-175|class updateFinalLabel_메서드는 [시험]|com.cell.platform.entity; backend/src/test/java/com/cell/platform/entity/CropEntityTest.java:44|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class updateFinalLabel_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-176|class getTaskId_메서드는 [시험]|com.cell.platform.entity; backend/src/test/java/com/cell/platform/entity/CropEntityTest.java:62|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class getTaskId_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-177|class SubmissionEntityTest [시험]|com.cell.platform.entity; backend/src/test/java/com/cell/platform/entity/SubmissionEntityTest.java:14|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class SubmissionEntityTest|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-178|class SubmissionEntity는 [시험]|com.cell.platform.entity; backend/src/test/java/com/cell/platform/entity/SubmissionEntityTest.java:17|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class SubmissionEntity는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-179|class TaskEntityTest [시험]|com.cell.platform.entity; backend/src/test/java/com/cell/platform/entity/TaskEntityTest.java:13|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class TaskEntityTest|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-180|class TaskEntity는 [시험]|com.cell.platform.entity; backend/src/test/java/com/cell/platform/entity/TaskEntityTest.java:16|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class TaskEntity는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-181|class addCrop_메서드는 [시험]|com.cell.platform.entity; backend/src/test/java/com/cell/platform/entity/TaskEntityTest.java:38|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class addCrop_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-182|class UserEntityTest [시험]|com.cell.platform.entity; backend/src/test/java/com/cell/platform/entity/UserEntityTest.java:11|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class UserEntityTest|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-183|class UserEntity는 [시험]|com.cell.platform.entity; backend/src/test/java/com/cell/platform/entity/UserEntityTest.java:14|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class UserEntity는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-184|class CropFixture [시험]|com.cell.platform.fixture; backend/src/test/java/com/cell/platform/fixture/CropFixture.java:8|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class CropFixture|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-185|class SubmissionFixture [시험]|com.cell.platform.fixture; backend/src/test/java/com/cell/platform/fixture/SubmissionFixture.java:8|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class SubmissionFixture|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-186|class TaskFixture [시험]|com.cell.platform.fixture; backend/src/test/java/com/cell/platform/fixture/TaskFixture.java:9|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class TaskFixture|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-187|class UserFixture [시험]|com.cell.platform.fixture; backend/src/test/java/com/cell/platform/fixture/UserFixture.java:7|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class UserFixture|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-188|class CropCoreRepositoryTest [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:22|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class CropCoreRepositoryTest extends RepositoryContext|CropRepository, CropCoreRepository, TaskRepository, Task|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-189|class save_메서드는 [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:46|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class save_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-190|class findById_메서드는 [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:75|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class findById_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-191|class findAllByTaskId_메서드는 [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:92|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class findAllByTaskId_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-192|class findAllByFinalLabelIsNotNull_메서드는 [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:105|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class findAllByFinalLabelIsNotNull_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-193|class findAll_메서드는 [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:129|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class findAll_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-194|class findEntityById_메서드는 [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:138|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class findEntityById_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-195|class SubmissionCoreRepositoryTest [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:20|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class SubmissionCoreRepositoryTest extends RepositoryContext|SubmissionRepository, TaskRepository, Task|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-196|class save_메서드는 [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:41|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class save_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-197|class findAllByCropIdIn_메서드는 [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:64|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class findAllByCropIdIn_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-198|class findAllByCropIdInAndStudentId_메서드는 [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:88|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class findAllByCropIdInAndStudentId_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-199|class TaskCoreRepositoryTest [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:18|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class TaskCoreRepositoryTest extends RepositoryContext|TaskRepository|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-200|class save_메서드는 [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:24|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class save_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-201|class findById_메서드는 [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:63|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class findById_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-202|class findAllByOrderByIdDesc_메서드는 [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:85|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class findAllByOrderByIdDesc_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-203|class UserCoreRepositoryTest [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:16|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class UserCoreRepositoryTest extends RepositoryContext|UserRepository|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-204|class save_메서드는 [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:22|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class save_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-205|class findByUsername_메서드는 [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:44|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class findByUsername_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-206|class existsByUsername_메서드는 [시험]|com.cell.platform.infra; backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:71|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class existsByUsername_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-207|class AuthServiceTest [시험]|com.cell.platform.service; backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:31|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class AuthServiceTest|AuthService, UserRepository, StudentRosterJpaRepository, PasswordEncoder, JwtTokenProvider|US-001, US-002; 각 US의 TK-xxx-01/02|
|C-208|class register_메서드는 [시험]|com.cell.platform.service; backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:40|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class register_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-209|class login_메서드는 [시험]|com.cell.platform.service; backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:63|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class login_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-210|class CropServiceTest [시험]|com.cell.platform.service; backend/src/test/java/com/cell/platform/service/CropServiceTest.java:27|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class CropServiceTest|CropService, CropRepository, CropCoreRepository|US-018, US-033; 각 US의 TK-xxx-01/02|
|C-211|class getCropsByTaskId_메서드는 [시험]|com.cell.platform.service; backend/src/test/java/com/cell/platform/service/CropServiceTest.java:39|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class getCropsByTaskId_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-212|class getConfirmedTrainingData_메서드는 [시험]|com.cell.platform.service; backend/src/test/java/com/cell/platform/service/CropServiceTest.java:52|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class getConfirmedTrainingData_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-213|class confirmLabel_메서드는 [시험]|com.cell.platform.service; backend/src/test/java/com/cell/platform/service/CropServiceTest.java:66|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class confirmLabel_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-214|class StatsServiceTest [시험]|com.cell.platform.service; backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:24|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class StatsServiceTest|StatsService, CropRepository, SubmissionRepository, UserRepository|US-019, US-020, US-021; 각 US의 TK-xxx-01/02|
|C-215|class getTaskStats_메서드는 [시험]|com.cell.platform.service; backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:32|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class getTaskStats_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-216|class getAllStats_메서드는 [시험]|com.cell.platform.service; backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:52|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class getAllStats_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-217|class StudentAnalyticsServiceTest [시험]|com.cell.platform.service; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:24|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class StudentAnalyticsServiceTest|TaskRepository, CropRepository, SubmissionRepository, UserRepository, DiagnosticDatasetService, ConfusionMatrixRepository, StudentAnalyticsService|US-022; 각 US의 TK-xxx-01/02|
|C-218|class TaskServiceTest [시험]|com.cell.platform.service; backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:25|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class TaskServiceTest|TaskService, TaskRepository, FileStorageService, AiClientService|US-011, US-012, US-013, US-014, US-015; 각 US의 TK-xxx-01/02|
|C-219|class getAllTasks_메서드는 [시험]|com.cell.platform.service; backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:33|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class getAllTasks_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|
|C-220|class createTask_메서드는 [시험]|com.cell.platform.service; backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:56|시험/fixture/context 전용 선언. 운영 Spring 서비스 아님|class createTask_메서드는|명시 보유 필드 없음|공통기반·변환·시험지원 / 직접 US 미확정 / Sprint 미배정|

### A.2 클래스별 멤버 명세

접근 제어자와 자료형/반환타입을 별도 열로 기록한다. record component는 명시 입력 필드이고 접근자·equals/hashCode/toString·canonical ctor는 언어 생성 규칙이다. Lombok @Getter/@Setter/@Builder/@RequiredArgsConstructor 등 생성 멤버 전체를 직접 작성한 코드 개수로 세지 않는다. enum 상수의 설명 문자열/테스트 합성 값·비밀 기본값 같은 initializer 값은 전사하지 않는다.

#### C-001 — CellApplication

- 역할: Spring Boot 진입점. 근거: `backend/src/main/java/com/cell/platform/CellApplication.java:7`.
- 선언 annotation: `@SpringBootApplication`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-001|method|public static void main(String[] args)|업무/보조 처리; 명시 호출 SpringApplication.run|void|public|; backend/src/main/java/com/cell/platform/CellApplication.java:9|

#### C-002 — AdminSeedRunner

- 역할: 시작 시 환경설정 관리자 계정 존재 보장. 근거: `backend/src/main/java/com/cell/platform/config/AdminSeedRunner.java:16`.
- 선언 annotation: `@Slf4j`, `@Component`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-002|field|private final UserRepository userRepository|주입/참조 저장소|UserRepository|private|; backend/src/main/java/com/cell/platform/config/AdminSeedRunner.java:18|
|C-002|field|private final PasswordEncoder passwordEncoder|선언된 상태/설정/응답 값|PasswordEncoder|private|; backend/src/main/java/com/cell/platform/config/AdminSeedRunner.java:19|
|C-002|field|private String adminUsername|선언된 상태/설정/응답 값|String|private|@Value("${admin.username:}"); backend/src/main/java/com/cell/platform/config/AdminSeedRunner.java:21|
|C-002|field|private String adminPassword|선언된 상태/설정/응답 값|String|private|@Value("${admin.password:}"); backend/src/main/java/com/cell/platform/config/AdminSeedRunner.java:24|
|C-002|method|public void run(String... args)|업무/보조 처리; 명시 호출 User.create, adminPassword.isBlank, adminUsername.isBlank, log.info, log.warn|void|public|@Override; backend/src/main/java/com/cell/platform/config/AdminSeedRunner.java:27|

#### C-003 — JwtAuthFilter

- 역할: Bearer 검증·ROLE claim으로 SecurityContext 인증 설정. 근거: `backend/src/main/java/com/cell/platform/config/JwtAuthFilter.java:17`.
- 선언 annotation: `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-003|field|private final JwtTokenProvider jwtTokenProvider|선언된 상태/설정/응답 값|JwtTokenProvider|private|; backend/src/main/java/com/cell/platform/config/JwtAuthFilter.java:19|
|C-003|method|protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException|업무/보조 처리; 명시 호출 filterChain.doFilter, jwtTokenProvider.isValid|void|protected|@Override; backend/src/main/java/com/cell/platform/config/JwtAuthFilter.java:21|
|C-003|method|private String extractToken(HttpServletRequest request)|업무/보조 처리; 명시 호출 header.startsWith, header.substring, request.getHeader|String|private|; backend/src/main/java/com/cell/platform/config/JwtAuthFilter.java:34|
|C-003|method|private void setAuthentication(String token)|업무/보조 처리; 명시 호출 List.of, SecurityContextHolder.getContext, jwtTokenProvider.getRole, jwtTokenProvider.getUsername|void|private|; backend/src/main/java/com/cell/platform/config/JwtAuthFilter.java:42|

#### C-004 — JwtTokenProvider

- 역할: 서명·만료·subject/role JWT 생성/파싱. 근거: `backend/src/main/java/com/cell/platform/config/JwtTokenProvider.java:14`.
- 선언 annotation: `@Component`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-004|field|private final SecretKey key|서명키 참조(값 제외)|SecretKey|private|; backend/src/main/java/com/cell/platform/config/JwtTokenProvider.java:16|
|C-004|field|private final long expirationMs|JWT 유효기간(ms)|long|private|; backend/src/main/java/com/cell/platform/config/JwtTokenProvider.java:17|
|C-004|constructor|public JwtTokenProvider( String secret, long expirationHours)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|@Value("${jwt.secret}") @Value("${jwt.expiration-hours}") long expirationHours); backend/src/main/java/com/cell/platform/config/JwtTokenProvider.java:19|
|C-004|method|public String generateToken(String username, String role)|생성·저장·구성; 명시 호출 Jwts.builder, System.currentTimeMillis|String|public|; backend/src/main/java/com/cell/platform/config/JwtTokenProvider.java:26|
|C-004|method|public String getUsername(String token)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|String|public|; backend/src/main/java/com/cell/platform/config/JwtTokenProvider.java:36|
|C-004|method|public String getRole(String token)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|String|public|; backend/src/main/java/com/cell/platform/config/JwtTokenProvider.java:40|
|C-004|method|public boolean isValid(String token)|검증·정규화·조건 판단; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|boolean|public|; backend/src/main/java/com/cell/platform/config/JwtTokenProvider.java:44|
|C-004|method|private Claims parseClaims(String token)|검증·정규화·조건 판단; 명시 호출 Jwts.parser|Claims|private|; backend/src/main/java/com/cell/platform/config/JwtTokenProvider.java:53|

#### C-005 — SecurityConfig

- 역할: stateless URL 인가·CORS·BCrypt·JWT filter 설치. 근거: `backend/src/main/java/com/cell/platform/config/SecurityConfig.java:24`.
- 선언 annotation: `@Configuration`, `@EnableWebSecurity`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-005|field|private final JwtTokenProvider jwtTokenProvider|선언된 상태/설정/응답 값|JwtTokenProvider|private|; backend/src/main/java/com/cell/platform/config/SecurityConfig.java:26|
|C-005|method|public SecurityFilterChain filterChain(HttpSecurity http) throws Exception|업무/보조 처리; 명시 호출 cors.configurationSource, csrf.disable, fo.disable, headers.frameOptions, http.build|SecurityFilterChain|public|@Bean; backend/src/main/java/com/cell/platform/config/SecurityConfig.java:28|
|C-005|method|public JwtAuthFilter jwtAuthFilter()|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|JwtAuthFilter|public|@Bean; backend/src/main/java/com/cell/platform/config/SecurityConfig.java:71|
|C-005|method|public PasswordEncoder passwordEncoder()|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|PasswordEncoder|public|@Bean; backend/src/main/java/com/cell/platform/config/SecurityConfig.java:76|
|C-005|method|public CorsConfigurationSource corsConfigurationSource()|업무/보조 처리; 명시 호출 List.of, config.setAllowCredentials, config.setAllowedHeaders, config.setAllowedMethods, config.setAllowedOrigins|CorsConfigurationSource|public|@Bean; backend/src/main/java/com/cell/platform/config/SecurityConfig.java:81|

#### C-006 — ThumbnailBackfillRunner

- 역할: 시작 시 기존 원본의 썸네일 보정. 근거: `backend/src/main/java/com/cell/platform/config/ThumbnailBackfillRunner.java:24`.
- 선언 annotation: `@Slf4j`, `@Component`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-006|field|private final FileStorageService fileStorageService|주입/참조 업무 서비스|FileStorageService|private|; backend/src/main/java/com/cell/platform/config/ThumbnailBackfillRunner.java:26|
|C-006|field|private String diagnosticRawImagesDir|선언된 상태/설정/응답 값|String|private|@Value("${diagnostic.dataset.raw-images-dir:../data/diagnostic_gt/raw/images}"); backend/src/main/java/com/cell/platform/config/ThumbnailBackfillRunner.java:28|
|C-006|method|public void run(String... args)|업무/보조 처리; 명시 호출 worker.setDaemon, worker.start|void|public|@Override; backend/src/main/java/com/cell/platform/config/ThumbnailBackfillRunner.java:31|
|C-006|method|private void backfill()|상태·라벨·통계 변경; 명시 호출 Paths.get, fileStorageService.getUploadDir, log.info|void|private|; backend/src/main/java/com/cell/platform/config/ThumbnailBackfillRunner.java:38|
|C-006|method|private int backfillDirectory(Path sourceDir)|상태·라벨·통계 변경; 명시 호출 Files.exists, Files.isDirectory, Files.list, file.getFileName, fileStorageService.ensureThumbnail|int|private|; backend/src/main/java/com/cell/platform/config/ThumbnailBackfillRunner.java:47|
|C-006|method|private boolean isImageFile(String filename)|검증·정규화·조건 판단; 명시 호출 filename.toLowerCase, lower.endsWith|boolean|private|; backend/src/main/java/com/cell/platform/config/ThumbnailBackfillRunner.java:71|

#### C-007 — WebConfig

- 역할: 인증된 원본/crop/썸네일·진단 파일 리소스 경로. 근거: `backend/src/main/java/com/cell/platform/config/WebConfig.java:11`.
- 선언 annotation: `@Configuration`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-007|field|private String uploadDir|선언된 상태/설정/응답 값|String|private|@Value("${file.upload-dir}"); backend/src/main/java/com/cell/platform/config/WebConfig.java:13|
|C-007|field|private String cropDir|선언된 상태/설정/응답 값|String|private|@Value("${file.crop-dir}"); backend/src/main/java/com/cell/platform/config/WebConfig.java:16|
|C-007|field|private String thumbnailDir|선언된 상태/설정/응답 값|String|private|@Value("${file.thumbnail-dir}"); backend/src/main/java/com/cell/platform/config/WebConfig.java:19|
|C-007|field|private String diagnosticProcessedDir|선언된 상태/설정/응답 값|String|private|@Value("${diagnostic.dataset.processed-dir:../data/diagnostic_gt/processed}"); backend/src/main/java/com/cell/platform/config/WebConfig.java:22|
|C-007|field|private String diagnosticRawImagesDir|선언된 상태/설정/응답 값|String|private|@Value("${diagnostic.dataset.raw-images-dir:../data/diagnostic_gt/raw/images}"); backend/src/main/java/com/cell/platform/config/WebConfig.java:25|
|C-007|method|public void addResourceHandlers(ResourceHandlerRegistry registry)|생성·저장·구성; 명시 호출 Paths.get, registry.addResourceHandler|void|public|@Override; backend/src/main/java/com/cell/platform/config/WebConfig.java:28|

#### C-008 — AdminController

- 역할: Admin 관련 HTTP 요청과 서비스/DTO 연결. 근거: `backend/src/main/java/com/cell/platform/controller/AdminController.java:23`.
- 선언 annotation: `@RestController`, `@RequestMapping("/api/admin")`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-008|field|private final AdminService adminService|주입/참조 업무 서비스|AdminService|private|; backend/src/main/java/com/cell/platform/controller/AdminController.java:25|
|C-008|method|public ResponseEntity&lt;List&lt;AdminSmearResponse&gt;&gt; getSmears()|조회·변환·판정; 명시 호출 ResponseEntity.ok, adminService.getSmears|ResponseEntity&lt;List&lt;AdminSmearResponse&gt;&gt;|public|@GetMapping("/smears"); backend/src/main/java/com/cell/platform/controller/AdminController.java:27|
|C-008|method|public ResponseEntity&lt;List&lt;AdminCropResponse&gt;&gt; getCrops()|조회·변환·판정; 명시 호출 ResponseEntity.ok, adminService.getCrops|ResponseEntity&lt;List&lt;AdminCropResponse&gt;&gt;|public|@GetMapping("/crops"); backend/src/main/java/com/cell/platform/controller/AdminController.java:32|
|C-008|method|public ResponseEntity&lt;List&lt;UserResponse&gt;&gt; getUsers()|조회·변환·판정; 명시 호출 ResponseEntity.ok, adminService.getUsers|ResponseEntity&lt;List&lt;UserResponse&gt;&gt;|public|@GetMapping("/users"); backend/src/main/java/com/cell/platform/controller/AdminController.java:37|
|C-008|method|public ResponseEntity&lt;Void&gt; createUser(RegisterRequest request)|생성·저장·구성; 명시 호출 ResponseEntity.ok, adminService.createUser|ResponseEntity&lt;Void&gt;|public|@PostMapping("/users") @RequestBody; backend/src/main/java/com/cell/platform/controller/AdminController.java:42|
|C-008|method|public ResponseEntity&lt;Void&gt; deleteUser(String username)|삭제·차감·초기화; 명시 호출 ResponseEntity.noContent, adminService.deleteUser|ResponseEntity&lt;Void&gt;|public|@DeleteMapping("/users/{username}") @PathVariable; backend/src/main/java/com/cell/platform/controller/AdminController.java:48|
|C-008|method|public ResponseEntity&lt;UserResponse&gt; updateUserStatus( Long userId, AdminStatusRequest request )|상태·라벨·통계 변경; 명시 호출 ResponseEntity.ok, adminService.updateUserStatus|ResponseEntity&lt;UserResponse&gt;|public|@PutMapping("/users/{userId}/status") @PathVariable @Valid @RequestBody; backend/src/main/java/com/cell/platform/controller/AdminController.java:54|
|C-008|method|public ResponseEntity&lt;List&lt;StudentRosterResponse&gt;&gt; getStudentRoster()|조회·변환·판정; 명시 호출 ResponseEntity.ok, adminService.getStudentRoster|ResponseEntity&lt;List&lt;StudentRosterResponse&gt;&gt;|public|@GetMapping("/student-roster"); backend/src/main/java/com/cell/platform/controller/AdminController.java:62|
|C-008|method|public ResponseEntity&lt;RosterImportResponse&gt; addStudentRoster( StudentRosterRequest request, Authentication authentication )|생성·저장·구성; 명시 호출 ResponseEntity.ok, adminService.addStudentRoster, authentication.getName|ResponseEntity&lt;RosterImportResponse&gt;|public|@PostMapping("/student-roster") @RequestBody; backend/src/main/java/com/cell/platform/controller/AdminController.java:67|

#### C-009 — AnimalSpeciesController

- 역할: AnimalSpecies 관련 HTTP 요청과 서비스/DTO 연결. 근거: `backend/src/main/java/com/cell/platform/controller/AnimalSpeciesController.java:23`.
- 선언 annotation: `@RestController`, `@RequestMapping("/api/species")`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-009|field|private final AnimalSpeciesService speciesService|주입/참조 업무 서비스|AnimalSpeciesService|private|; backend/src/main/java/com/cell/platform/controller/AnimalSpeciesController.java:25|
|C-009|method|public ResponseEntity&lt;List&lt;AnimalSpeciesResponse&gt;&gt; getAll()|조회·변환·판정; 명시 호출 ResponseEntity.ok, speciesService.getAll|ResponseEntity&lt;List&lt;AnimalSpeciesResponse&gt;&gt;|public|@GetMapping; backend/src/main/java/com/cell/platform/controller/AnimalSpeciesController.java:27|
|C-009|method|public ResponseEntity&lt;AnimalSpeciesResponse&gt; create( AnimalSpeciesNameRequest request)|생성·저장·구성; 명시 호출 ResponseEntity.ok, request.name, speciesService.create|ResponseEntity&lt;AnimalSpeciesResponse&gt;|public|@PostMapping @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @Valid @RequestBody; backend/src/main/java/com/cell/platform/controller/AnimalSpeciesController.java:32|
|C-009|method|public ResponseEntity&lt;AnimalSpeciesResponse&gt; rename( Long speciesId, AnimalSpeciesNameRequest request)|상태·라벨·통계 변경; 명시 호출 ResponseEntity.ok, request.name, speciesService.rename|ResponseEntity&lt;AnimalSpeciesResponse&gt;|public|@PutMapping("/{speciesId}") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @PathVariable @Valid @RequestBody; backend/src/main/java/com/cell/platform/controller/AnimalSpeciesController.java:39|

#### C-010 — AssignmentController

- 역할: Assignment 관련 HTTP 요청과 서비스/DTO 연결. 근거: `backend/src/main/java/com/cell/platform/controller/AssignmentController.java:24`.
- 선언 annotation: `@RestController`, `@RequestMapping("/api/assignments")`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-010|field|private final TaskService taskService|주입/참조 업무 서비스|TaskService|private|; backend/src/main/java/com/cell/platform/controller/AssignmentController.java:26|
|C-010|field|private final TaskRepository taskRepository|주입/참조 저장소|TaskRepository|private|; backend/src/main/java/com/cell/platform/controller/AssignmentController.java:27|
|C-010|method|public ResponseEntity&lt;AssignmentResponse&gt; createAssignment( String title, List&lt;MultipartFile&gt; files, LocalDateTime deadlineAt, List&lt;Long&gt; speciesIds, String username)|생성·저장·구성; 명시 호출 ResponseEntity.ok, taskService.createAssignment|ResponseEntity&lt;AssignmentResponse&gt;|public|@PostMapping @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @RequestParam("title") @RequestParam("files") @RequestParam(value = "deadlineAt", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) @RequestParam(value = "speciesIds", required = false) @AuthenticationPrincipal; backend/src/main/java/com/cell/platform/controller/AssignmentController.java:29|
|C-010|method|public ResponseEntity&lt;List&lt;TaskResponse&gt;&gt; getTasksForAssignment(Long assignmentId)|조회·변환·판정; 명시 호출 ResponseEntity.ok, taskRepository.findByAssignmentId, tasks.stream|ResponseEntity&lt;List&lt;TaskResponse&gt;&gt;|public|@GetMapping("/{assignmentId}/tasks") @PathVariable; backend/src/main/java/com/cell/platform/controller/AssignmentController.java:43|
|C-010|method|public ResponseEntity&lt;Void&gt; deleteAssignment(Long assignmentId)|삭제·차감·초기화; 명시 호출 ResponseEntity.noContent, taskService.deleteAssignment|ResponseEntity&lt;Void&gt;|public|@DeleteMapping("/{assignmentId}") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @PathVariable; backend/src/main/java/com/cell/platform/controller/AssignmentController.java:49|
|C-010|method|public ResponseEntity&lt;Void&gt; updateDeadline( Long assignmentId, DeadlineUpdateRequest request)|상태·라벨·통계 변경; 명시 호출 ResponseEntity.ok, request.deadlineAt, taskService.updateAssignmentDeadline|ResponseEntity&lt;Void&gt;|public|@PutMapping("/{assignmentId}/deadline") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @PathVariable @RequestBody; backend/src/main/java/com/cell/platform/controller/AssignmentController.java:56|

#### C-011 — AuthController

- 역할: Auth 관련 HTTP 요청과 서비스/DTO 연결. 근거: `backend/src/main/java/com/cell/platform/controller/AuthController.java:16`.
- 선언 annotation: `@RestController`, `@RequestMapping("/api/auth")`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-011|field|private final AuthService authService|주입/참조 업무 서비스|AuthService|private|; backend/src/main/java/com/cell/platform/controller/AuthController.java:18|
|C-011|method|public ResponseEntity&lt;RegisterResponse&gt; register(RegisterRequest request)|업무/보조 처리; 명시 호출 ResponseEntity.ok, authService.register|ResponseEntity&lt;RegisterResponse&gt;|public|@PostMapping("/register") @Valid @RequestBody; backend/src/main/java/com/cell/platform/controller/AuthController.java:20|
|C-011|method|public ResponseEntity&lt;LoginResponse&gt; login(LoginRequest request)|업무/보조 처리; 명시 호출 ResponseEntity.ok, authService.login|ResponseEntity&lt;LoginResponse&gt;|public|@PostMapping("/login") @RequestBody; backend/src/main/java/com/cell/platform/controller/AuthController.java:25|

#### C-012 — CropController

- 역할: Crop 관련 HTTP 요청과 서비스/DTO 연결. 근거: `backend/src/main/java/com/cell/platform/controller/CropController.java:17`.
- 선언 annotation: `@RestController`, `@RequestMapping("/api")`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-012|field|private final CropService cropService|주입/참조 업무 서비스|CropService|private|; backend/src/main/java/com/cell/platform/controller/CropController.java:19|
|C-012|method|public ResponseEntity&lt;List&lt;CropResponse&gt;&gt; getCropsByTask( Long taskId, Authentication authentication)|조회·변환·판정; 명시 호출 ResponseEntity.ok, cropService.getCropsByTaskId|ResponseEntity&lt;List&lt;CropResponse&gt;&gt;|public|@GetMapping("/tasks/{taskId}/crops") @PathVariable; backend/src/main/java/com/cell/platform/controller/CropController.java:21|
|C-012|method|public ResponseEntity&lt;List&lt;CropResponse&gt;&gt; getCropsByAssignment( Long assignmentId, Authentication authentication)|조회·변환·판정; 명시 호출 ResponseEntity.ok, cropService.getCropsByAssignmentId|ResponseEntity&lt;List&lt;CropResponse&gt;&gt;|public|@GetMapping("/assignments/{assignmentId}/crops") @PathVariable; backend/src/main/java/com/cell/platform/controller/CropController.java:28|
|C-012|method|public ResponseEntity&lt;Void&gt; confirmLabel( Long cropId, ConfirmRequest request)|상태·라벨·통계 변경; 명시 호출 ResponseEntity.ok, cropService.confirmLabel, request.finalLabel|ResponseEntity&lt;Void&gt;|public|@PutMapping("/crops/{cropId}/confirm") @PathVariable @RequestBody; backend/src/main/java/com/cell/platform/controller/CropController.java:35|
|C-012|method|public ResponseEntity&lt;List&lt;TrainingDataResponse&gt;&gt; getTrainingData()|조회·변환·판정; 명시 호출 ResponseEntity.ok, cropService.getConfirmedTrainingData|ResponseEntity&lt;List&lt;TrainingDataResponse&gt;&gt;|public|@GetMapping("/training-data"); backend/src/main/java/com/cell/platform/controller/CropController.java:43|
|C-012|method|private boolean isStudent(Authentication authentication)|검증·정규화·조건 판단; 명시 호출 authentication.getAuthorities, authority.getAuthority|boolean|private|; backend/src/main/java/com/cell/platform/controller/CropController.java:48|

#### C-013 — CropIssueReportController

- 역할: CropIssueReport 관련 HTTP 요청과 서비스/DTO 연결. 근거: `backend/src/main/java/com/cell/platform/controller/CropIssueReportController.java:16`.
- 선언 annotation: `@RestController`, `@RequestMapping("/api")`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-013|field|private final CropIssueReportService reportService|주입/참조 업무 서비스|CropIssueReportService|private|; backend/src/main/java/com/cell/platform/controller/CropIssueReportController.java:18|
|C-013|method|public ResponseEntity&lt;Void&gt; createReport(CropIssueReportRequest request)|생성·저장·구성; 명시 호출 ResponseEntity.ok, reportService.createReport|ResponseEntity&lt;Void&gt;|public|@PostMapping("/reports") @RequestBody; backend/src/main/java/com/cell/platform/controller/CropIssueReportController.java:20|
|C-013|method|public ResponseEntity&lt;List&lt;CropIssueReportResponse&gt;&gt; getReports()|조회·변환·판정; 명시 호출 ResponseEntity.ok, reportService.getReports|ResponseEntity&lt;List&lt;CropIssueReportResponse&gt;&gt;|public|@GetMapping("/reports") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')"); backend/src/main/java/com/cell/platform/controller/CropIssueReportController.java:26|

#### C-014 — GameRecordController

- 역할: GameRecord 관련 HTTP 요청과 서비스/DTO 연결. 근거: `backend/src/main/java/com/cell/platform/controller/GameRecordController.java:15`.
- 선언 annotation: `@RestController`, `@RequestMapping("/api/game")`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-014|field|private final GameRecordService gameRecordService|주입/참조 업무 서비스|GameRecordService|private|; backend/src/main/java/com/cell/platform/controller/GameRecordController.java:17|
|C-014|method|public ResponseEntity&lt;Void&gt; saveRecords(GameRecordRequest request)|생성·저장·구성; 명시 호출 ResponseEntity.ok, gameRecordService.saveRecords|ResponseEntity&lt;Void&gt;|public|@PostMapping("/records") @RequestBody; backend/src/main/java/com/cell/platform/controller/GameRecordController.java:19|
|C-014|method|public ResponseEntity&lt;List&lt;GameRecordResponse&gt;&gt; getLeaderboard( String mode)|조회·변환·판정; 명시 호출 ResponseEntity.ok, gameRecordService.getLeaderboard|ResponseEntity&lt;List&lt;GameRecordResponse&gt;&gt;|public|@GetMapping("/leaderboard") @RequestParam(defaultValue = "EASY") String mode); backend/src/main/java/com/cell/platform/controller/GameRecordController.java:25|
|C-014|method|public ResponseEntity&lt;Void&gt; deleteAll()|삭제·차감·초기화; 명시 호출 ResponseEntity.ok, gameRecordService.deleteAll|ResponseEntity&lt;Void&gt;|public|@DeleteMapping("/records"); backend/src/main/java/com/cell/platform/controller/GameRecordController.java:31|

#### C-015 — LabelingController

- 역할: Labeling 관련 HTTP 요청과 서비스/DTO 연결. 근거: `backend/src/main/java/com/cell/platform/controller/LabelingController.java:21`.
- 선언 annotation: `@RestController`, `@RequestMapping("/api/labeling/tasks")`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-015|field|private final LabelingService labelingService|주입/참조 업무 서비스|LabelingService|private|; backend/src/main/java/com/cell/platform/controller/LabelingController.java:23|
|C-015|method|public ResponseEntity&lt;byte[]&gt; exportTask(Long taskId)|업무/보조 처리; 명시 호출 ResponseEntity.ok, labelingService.buildArchiveFilename, labelingService.exportTask|ResponseEntity&lt;byte[]&gt;|public|@GetMapping("/{taskId}/export") @PathVariable; backend/src/main/java/com/cell/platform/controller/LabelingController.java:25|
|C-015|method|public ResponseEntity&lt;Map&lt;String, Integer&gt;&gt; importLabels( Long taskId, JsonNode viaJson )|업무/보조 처리; 명시 호출 Map.of, ResponseEntity.ok, labelingService.importLabels|ResponseEntity&lt;Map&lt;String, Integer&gt;&gt;|public|@PostMapping("/{taskId}/import") @PathVariable @RequestBody; backend/src/main/java/com/cell/platform/controller/LabelingController.java:35|

#### C-016 — StatsController

- 역할: Stats 관련 HTTP 요청과 서비스/DTO 연결. 근거: `backend/src/main/java/com/cell/platform/controller/StatsController.java:14`.
- 선언 annotation: `@RestController`, `@RequestMapping("/api")`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-016|field|private final StatsService statsService|주입/참조 업무 서비스|StatsService|private|; backend/src/main/java/com/cell/platform/controller/StatsController.java:16|
|C-016|method|public ResponseEntity&lt;List&lt;CropStatsResponse&gt;&gt; getTaskStats(Long taskId)|조회·변환·판정; 명시 호출 ResponseEntity.ok, statsService.getTaskStats|ResponseEntity&lt;List&lt;CropStatsResponse&gt;&gt;|public|@GetMapping("/tasks/{taskId}/stats") @PathVariable; backend/src/main/java/com/cell/platform/controller/StatsController.java:18|
|C-016|method|public ResponseEntity&lt;List&lt;CropStatsResponse&gt;&gt; getAllStats()|조회·변환·판정; 명시 호출 ResponseEntity.ok, statsService.getAllStats|ResponseEntity&lt;List&lt;CropStatsResponse&gt;&gt;|public|@GetMapping("/all-stats"); backend/src/main/java/com/cell/platform/controller/StatsController.java:23|

#### C-017 — StudentAnalyticsController

- 역할: StudentAnalytics 관련 HTTP 요청과 서비스/DTO 연결. 근거: `backend/src/main/java/com/cell/platform/controller/StudentAnalyticsController.java:13`.
- 선언 annotation: `@RestController`, `@RequestMapping("/api/analytics/students")`, `@RequiredArgsConstructor`, `@PreAuthorize("hasAnyRole('EXPERT','ADMIN')")`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-017|field|private final StudentAnalyticsService studentAnalyticsService|주입/참조 업무 서비스|StudentAnalyticsService|private|; backend/src/main/java/com/cell/platform/controller/StudentAnalyticsController.java:14|
|C-017|method|public StudentLearningResponse getHistory(String studentId)|조회·변환·판정; 명시 호출 studentAnalyticsService.getHistory|StudentLearningResponse|public|@GetMapping("/{studentId}/history") @PathVariable; backend/src/main/java/com/cell/platform/controller/StudentAnalyticsController.java:16|
|C-017|method|public StudentLearningResponse.TaskDetail getTaskDetail(String studentId, Long taskId)|조회·변환·판정; 명시 호출 studentAnalyticsService.getTaskDetail|StudentLearningResponse.TaskDetail|public|@GetMapping("/{studentId}/tasks/{taskId}") @PathVariable @PathVariable; backend/src/main/java/com/cell/platform/controller/StudentAnalyticsController.java:21|

#### C-018 — StudentReviewController

- 역할: StudentReview 관련 HTTP 요청과 서비스/DTO 연결. 근거: `backend/src/main/java/com/cell/platform/controller/StudentReviewController.java:16`.
- 선언 annotation: `@RestController`, `@RequestMapping("/api/student/reviews")`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-018|field|private final SubmissionService submissionService|주입/참조 업무 서비스|SubmissionService|private|; backend/src/main/java/com/cell/platform/controller/StudentReviewController.java:18|
|C-018|method|public ResponseEntity&lt;StudentReviewResponse&gt; getMyReviews( String username)|조회·변환·판정; 명시 호출 ResponseEntity.ok, submissionService.getStudentReviews|ResponseEntity&lt;StudentReviewResponse&gt;|public|@GetMapping @PreAuthorize("hasRole('STUDENT')") @AuthenticationPrincipal; backend/src/main/java/com/cell/platform/controller/StudentReviewController.java:20|

#### C-019 — SubmissionController

- 역할: Submission 관련 HTTP 요청과 서비스/DTO 연결. 근거: `backend/src/main/java/com/cell/platform/controller/SubmissionController.java:18`.
- 선언 annotation: `@RestController`, `@RequestMapping("/api")`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-019|field|private final SubmissionService submissionService|주입/참조 업무 서비스|SubmissionService|private|; backend/src/main/java/com/cell/platform/controller/SubmissionController.java:20|
|C-019|method|public ResponseEntity&lt;Void&gt; submit( SubmissionRequest request, String username)|업무/보조 처리; 명시 호출 ResponseEntity.ok, request.cropId, request.studentLabel, submissionService.submit|ResponseEntity&lt;Void&gt;|public|@PostMapping("/submit") @RequestBody @AuthenticationPrincipal; backend/src/main/java/com/cell/platform/controller/SubmissionController.java:22|
|C-019|method|public ResponseEntity&lt;List&lt;Long&gt;&gt; getSolvedCrops( Long taskId, String studentId, String username, Authentication authentication)|조회·변환·판정; 명시 호출 ResponseEntity.ok, submissionService.getSolvedCropIds|ResponseEntity&lt;List&lt;Long&gt;&gt;|public|@GetMapping("/tasks/{taskId}/submissions/{studentId}") @PathVariable @PathVariable @AuthenticationPrincipal; backend/src/main/java/com/cell/platform/controller/SubmissionController.java:30|
|C-019|method|public ResponseEntity&lt;Map&lt;Long, String&gt;&gt; getSolvedCropLabels( Long taskId, String studentId, String username, Authentication authentication)|조회·변환·판정; 명시 호출 ResponseEntity.ok, submissionService.getSolvedCropLabels|ResponseEntity&lt;Map&lt;Long, String&gt;&gt;|public|@GetMapping("/tasks/{taskId}/submissions/{studentId}/labels") @PathVariable @PathVariable @AuthenticationPrincipal; backend/src/main/java/com/cell/platform/controller/SubmissionController.java:40|
|C-019|method|public ResponseEntity&lt;Map&lt;Long, String&gt;&gt; getSolvedCropLabelsForAssignment( Long assignmentId, String studentId, String username, Authentication authentication)|조회·변환·판정; 명시 호출 ResponseEntity.ok, submissionService.getSolvedCropLabelsForAssignment|ResponseEntity&lt;Map&lt;Long, String&gt;&gt;|public|@GetMapping("/assignments/{assignmentId}/submissions/{studentId}/labels") @PathVariable @PathVariable @AuthenticationPrincipal; backend/src/main/java/com/cell/platform/controller/SubmissionController.java:50|
|C-019|method|public ResponseEntity&lt;MyResultsResponse&gt; getMyResults( Long taskId, String studentId, String username, Authentication authentication)|조회·변환·판정; 명시 호출 ResponseEntity.ok, submissionService.assertReviewAvailableForTask, submissionService.getMyResults|ResponseEntity&lt;MyResultsResponse&gt;|public|@GetMapping("/tasks/{taskId}/my-results/{studentId}") @PathVariable @PathVariable @AuthenticationPrincipal; backend/src/main/java/com/cell/platform/controller/SubmissionController.java:60|
|C-019|method|public ResponseEntity&lt;List&lt;Long&gt;&gt; getSolvedCropsForAssignment( Long assignmentId, String studentId, String username, Authentication authentication)|조회·변환·판정; 명시 호출 ResponseEntity.ok, submissionService.getSolvedCropIdsForAssignment|ResponseEntity&lt;List&lt;Long&gt;&gt;|public|@GetMapping("/assignments/{assignmentId}/submissions/{studentId}") @PathVariable @PathVariable @AuthenticationPrincipal; backend/src/main/java/com/cell/platform/controller/SubmissionController.java:73|
|C-019|method|public ResponseEntity&lt;MyResultsResponse&gt; getMyResultsForAssignment( Long assignmentId, String studentId, String username, Authentication authentication)|조회·변환·판정; 명시 호출 ResponseEntity.ok, submissionService.assertReviewAvailableForAssignment, submissionService.getMyResultsForAssignment|ResponseEntity&lt;MyResultsResponse&gt;|public|@GetMapping("/assignments/{assignmentId}/my-results/{studentId}") @PathVariable @PathVariable @AuthenticationPrincipal; backend/src/main/java/com/cell/platform/controller/SubmissionController.java:83|
|C-019|method|// STUDENT 역할은 자신의 데이터만 접근 가능, EXPERT/ADMIN은 모든 학생 데이터 접근 가능 private String resolveStudentId(String requestedId, String username, Authentication authentication)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|// STUDENT 역할은 자신의 데이터만 접근 가능, EXPERT/ADMIN은 모든 학생 데이터 접근 가능 private String|package-private|; backend/src/main/java/com/cell/platform/controller/SubmissionController.java:96|
|C-019|method|private boolean isStudent(Authentication authentication)|검증·정규화·조건 판단; 명시 호출 a.getAuthority, authentication.getAuthorities|boolean|private|; backend/src/main/java/com/cell/platform/controller/SubmissionController.java:101|

#### C-020 — TaskController

- 역할: Task 관련 HTTP 요청과 서비스/DTO 연결. 근거: `backend/src/main/java/com/cell/platform/controller/TaskController.java:33`.
- 선언 annotation: `@RestController`, `@RequestMapping("/api/tasks")`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-020|field|private final TaskService taskService|주입/참조 업무 서비스|TaskService|private|; backend/src/main/java/com/cell/platform/controller/TaskController.java:35|
|C-020|field|private final DiagnosticTaskService diagnosticTaskService|주입/참조 업무 서비스|DiagnosticTaskService|private|; backend/src/main/java/com/cell/platform/controller/TaskController.java:36|
|C-020|field|// [추가된 부분] SubmissionService 주입 private final SubmissionService submissionService|주입/참조 업무 서비스|// [추가된 부분] SubmissionService 주입 private final SubmissionService|package-private|; backend/src/main/java/com/cell/platform/controller/TaskController.java:38|
|C-020|field|private final AnimalSpeciesService animalSpeciesService|주입/참조 업무 서비스|AnimalSpeciesService|private|; backend/src/main/java/com/cell/platform/controller/TaskController.java:40|
|C-020|method|public ResponseEntity&lt;List&lt;TaskResponse&gt;&gt; getAllTasks()|조회·변환·판정; 명시 호출 ResponseEntity.ok, taskService.getAllTasks|ResponseEntity&lt;List&lt;TaskResponse&gt;&gt;|public|@GetMapping; backend/src/main/java/com/cell/platform/controller/TaskController.java:42|
|C-020|method|public ResponseEntity&lt;TaskUploadResponse&gt; uploadAndCreateTask( MultipartFile file, LocalDateTime deadlineAt, Long speciesId)|업무/보조 처리; 명시 호출 ResponseEntity.ok, taskService.createTask|ResponseEntity&lt;TaskUploadResponse&gt;|public|@PostMapping("/upload") @RequestParam("file") @RequestParam(value = "deadlineAt", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) @RequestParam(value = "speciesId", required = false) Long speciesId); backend/src/main/java/com/cell/platform/controller/TaskController.java:47|
|C-020|method|public ResponseEntity&lt;DiagnosticPoolStatsResponse&gt; getDiagnosticPoolStats()|조회·변환·판정; 명시 호출 ResponseEntity.ok, diagnosticTaskService.getPoolStats|ResponseEntity&lt;DiagnosticPoolStatsResponse&gt;|public|@GetMapping("/diagnostic/pool-stats"); backend/src/main/java/com/cell/platform/controller/TaskController.java:56|
|C-020|method|public ResponseEntity&lt;TaskUploadResponse&gt; createDiagnosticTask( DiagnosticTaskCreateRequest request)|생성·저장·구성; 명시 호출 ResponseEntity.ok, diagnosticTaskService.createDiagnosticTask|ResponseEntity&lt;TaskUploadResponse&gt;|public|@PostMapping("/diagnostic/create") @Valid @RequestBody; backend/src/main/java/com/cell/platform/controller/TaskController.java:61|
|C-020|method|public ResponseEntity&lt;DiagnosticStudentMatrixResponse&gt; getCumulativeStudentMatrices()|조회·변환·판정; 명시 호출 ResponseEntity.ok, submissionService.getCumulativeStudentMatrices|ResponseEntity&lt;DiagnosticStudentMatrixResponse&gt;|public|@GetMapping("/diagnostic/student-matrices") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')"); backend/src/main/java/com/cell/platform/controller/TaskController.java:67|
|C-020|method|// [추가된 부분] 교수님용: 특정 과제의 모든 학생 혼동행렬 조회 API public ResponseEntity&lt;DiagnosticStudentMatrixResponse&gt; getStudentMatrices(Long taskId)|조회·변환·판정; 명시 호출 ResponseEntity.ok, submissionService.getDiagnosticStudentMatrices|// [추가된 부분] 교수님용: 특정 과제의 모든 학생 혼동행렬 조회 API public ResponseEntity&lt;DiagnosticStudentMatrixResponse&gt;|package-private|@GetMapping("/{taskId}/diagnostic/student-matrices") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @PathVariable; backend/src/main/java/com/cell/platform/controller/TaskController.java:73|
|C-020|method|public ResponseEntity&lt;Void&gt; deleteTask(Long taskId)|삭제·차감·초기화; 명시 호출 ResponseEntity.noContent, taskService.deleteTask|ResponseEntity&lt;Void&gt;|public|@DeleteMapping("/{taskId}") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @PathVariable; backend/src/main/java/com/cell/platform/controller/TaskController.java:80|
|C-020|method|public ResponseEntity&lt;Void&gt; updateDeadline( Long taskId, DeadlineUpdateRequest request)|상태·라벨·통계 변경; 명시 호출 ResponseEntity.ok, request.deadlineAt, taskService.updateTaskDeadline|ResponseEntity&lt;Void&gt;|public|@PutMapping("/{taskId}/deadline") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @PathVariable @RequestBody; backend/src/main/java/com/cell/platform/controller/TaskController.java:87|
|C-020|method|public ResponseEntity&lt;AnimalSpeciesResponse&gt; updateSpecies( Long taskId, SpeciesUpdateRequest request)|상태·라벨·통계 변경; 명시 호출 ResponseEntity.ok, animalSpeciesService.updateTaskSpecies, request.speciesId|ResponseEntity&lt;AnimalSpeciesResponse&gt;|public|@PutMapping("/{taskId}/species") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @PathVariable @Valid @RequestBody; backend/src/main/java/com/cell/platform/controller/TaskController.java:96|

#### C-021 — CellType

- 역할: 업무 값/상태 상수 집합. 근거: `backend/src/main/java/com/cell/platform/domain/crop/CellType.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-021|enum constants|Band, Segment, Lymphocyte, Monocyte, Eosinophil, NucleatedRBC|허용 상수 집합|CellType|public static final|; backend/src/main/java/com/cell/platform/domain/crop/CellType.java:3|

#### C-022 — Crop

- 역할: 업무 모델·생성 규칙. 근거: `backend/src/main/java/com/cell/platform/domain/crop/Crop.java:7`.
- 선언 annotation: `@Getter`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-022|field|private Long id|PK 또는 식별자|Long|private|; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:9|
|C-022|field|private Long taskId|소속 Task ID|Long|private|; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:10|
|C-022|field|private String originalSmearFilename|선언된 상태/설정/응답 값|String|private|; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:11|
|C-022|field|private Long speciesId|선언된 상태/설정/응답 값|Long|private|; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:12|
|C-022|field|private String speciesCode|선언된 상태/설정/응답 값|String|private|; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:13|
|C-022|field|private String speciesName|선언된 상태/설정/응답 값|String|private|; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:14|
|C-022|field|private String cropFilename|세포 이미지 파일명|String|private|; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:15|
|C-022|field|private String bbox|xyxy 좌표의 문자열|String|private|; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:16|
|C-022|field|private CellType gtLabel|원천/가져온 GT 라벨|CellType|private|; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:17|
|C-022|field|private CellType pseudoLabel|현재 AI 예측 후보 라벨|CellType|private|; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:18|
|C-022|field|private Double aiBboxConfidence|선언된 상태/설정/응답 값|Double|private|; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:19|
|C-022|field|private Double aiClassificationConfidence|선언된 상태/설정/응답 값|Double|private|; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:20|
|C-022|field|private CellType finalLabel|전문가 확정/채점 정답|CellType|private|; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:21|
|C-022|constructor|public Crop(Long id, Long taskId, String originalSmearFilename, Long speciesId, String speciesCode, String speciesName, String cropFilename, String bbox, CellType gtLabel, CellType pseudoLabel, Double aiBboxConfidence, Double aiClassificationConfidence, CellType finalLabel)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|@Builder; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:23|
|C-022|method|public static Crop create(String cropFilename, String bbox, CellType gtLabel, CellType pseudoLabel, Double aiBboxConfidence, Double aiClassificationConfidence)|생성·저장·구성; 명시 호출 Crop.builder|Crop|public|; backend/src/main/java/com/cell/platform/domain/crop/Crop.java:45|

#### C-023 — CropRepository

- 역할: 업무 저장소 추상 계약. 근거: `backend/src/main/java/com/cell/platform/domain/crop/CropRepository.java:6`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-023|method|Crop save(Crop crop)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Crop|public (interface)|; backend/src/main/java/com/cell/platform/domain/crop/CropRepository.java:8|
|C-023|method|Optional&lt;Crop&gt; findById(Long id)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Optional&lt;Crop&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/crop/CropRepository.java:10|
|C-023|method|List&lt;Crop&gt; findAllByTaskId(Long taskId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Crop&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/crop/CropRepository.java:12|
|C-023|method|List&lt;Crop&gt; findAllByFinalLabelIsNotNull()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Crop&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/crop/CropRepository.java:14|
|C-023|method|List&lt;Long&gt; findDistinctTaskIdsByFinalLabelIsNotNull()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Long&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/crop/CropRepository.java:16|
|C-023|method|List&lt;Crop&gt; findAll()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Crop&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/crop/CropRepository.java:18|
|C-023|method|List&lt;Crop&gt; findAllByTaskIdIn(List&lt;Long&gt; taskIds)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Crop&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/crop/CropRepository.java:20|

#### C-024 — ConfusionMatrixRepository

- 역할: 업무 저장소 추상 계약. 근거: `backend/src/main/java/com/cell/platform/domain/matrix/ConfusionMatrixRepository.java:7`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-024|method|Optional&lt;StudentConfusionMatrixEntity&gt; findByStudentIdAndTaskId(String studentId, Long taskId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Optional&lt;StudentConfusionMatrixEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/matrix/ConfusionMatrixRepository.java:8|
|C-024|method|// [추가된 부분] 특정 과제의 모든 혼동행렬 조회 List&lt;StudentConfusionMatrixEntity&gt; findAllByTaskId(Long taskId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|// [추가된 부분] 특정 과제의 모든 혼동행렬 조회 List&lt;StudentConfusionMatrixEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/matrix/ConfusionMatrixRepository.java:9|
|C-024|method|List&lt;StudentConfusionMatrixEntity&gt; findAllByTaskIdIn(List&lt;Long&gt; taskIds)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;StudentConfusionMatrixEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/matrix/ConfusionMatrixRepository.java:11|
|C-024|method|StudentConfusionMatrixEntity save(StudentConfusionMatrixEntity entity)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|StudentConfusionMatrixEntity|public (interface)|; backend/src/main/java/com/cell/platform/domain/matrix/ConfusionMatrixRepository.java:13|

#### C-025 — Submission

- 역할: 업무 모델·생성 규칙. 근거: `backend/src/main/java/com/cell/platform/domain/submission/Submission.java:9`.
- 선언 annotation: `@Getter`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-025|field|private Long id|PK 또는 식별자|Long|private|; backend/src/main/java/com/cell/platform/domain/submission/Submission.java:11|
|C-025|field|private Long cropId|대상 crop ID|Long|private|; backend/src/main/java/com/cell/platform/domain/submission/Submission.java:12|
|C-025|field|private String studentId|학생 사용자 ID 문자열(실제 개인정보 값 생략)|String|private|; backend/src/main/java/com/cell/platform/domain/submission/Submission.java:13|
|C-025|field|private CellType studentLabel|선언된 상태/설정/응답 값|CellType|private|; backend/src/main/java/com/cell/platform/domain/submission/Submission.java:14|
|C-025|field|private LocalDateTime submittedAt|답안 저장 시각|LocalDateTime|private|; backend/src/main/java/com/cell/platform/domain/submission/Submission.java:15|
|C-025|constructor|public Submission(Long id, Long cropId, String studentId, CellType studentLabel, LocalDateTime submittedAt)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|@Builder; backend/src/main/java/com/cell/platform/domain/submission/Submission.java:17|
|C-025|method|public static Submission create(Long cropId, String studentId, CellType studentLabel)|생성·저장·구성; 명시 호출 Submission.builder|Submission|public|; backend/src/main/java/com/cell/platform/domain/submission/Submission.java:27|

#### C-026 — SubmissionRepository

- 역할: 업무 저장소 추상 계약. 근거: `backend/src/main/java/com/cell/platform/domain/submission/SubmissionRepository.java:7`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-026|method|Submission save(Submission submission)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Submission|public (interface)|; backend/src/main/java/com/cell/platform/domain/submission/SubmissionRepository.java:9|
|C-026|method|Optional&lt;Submission&gt; findByCropIdAndStudentId(Long cropId, String studentId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Optional&lt;Submission&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/submission/SubmissionRepository.java:11|
|C-026|method|void updateLabel(Long cropId, String studentId, CellType newLabel)|상태·라벨·통계 변경; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public (interface)|; backend/src/main/java/com/cell/platform/domain/submission/SubmissionRepository.java:13|
|C-026|method|List&lt;Submission&gt; findAllByCropId(Long cropId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Submission&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/submission/SubmissionRepository.java:15|
|C-026|method|List&lt;Submission&gt; findAllByCropIdIn(List&lt;Long&gt; cropIds)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Submission&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/submission/SubmissionRepository.java:17|
|C-026|method|List&lt;Submission&gt; findAllByCropIdInAndStudentId(List&lt;Long&gt; cropIds, String studentId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Submission&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/submission/SubmissionRepository.java:19|

#### C-027 — Task

- 역할: 업무 모델·생성 규칙. 근거: `backend/src/main/java/com/cell/platform/domain/task/Task.java:11`.
- 선언 annotation: `@Getter`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-027|field|private Long id|PK 또는 식별자|Long|private|; backend/src/main/java/com/cell/platform/domain/task/Task.java:13|
|C-027|field|private TaskStatus status|계정 또는 과제 상태|TaskStatus|private|; backend/src/main/java/com/cell/platform/domain/task/Task.java:14|
|C-027|field|private String originalFilename|UUID 원본 저장 파일명|String|private|; backend/src/main/java/com/cell/platform/domain/task/Task.java:15|
|C-027|field|private String uploadedFilename|업로드 당시 이름/진단 prefix|String|private|; backend/src/main/java/com/cell/platform/domain/task/Task.java:16|
|C-027|field|private Long assignmentId|논리 Assignment ID(FK는 별도 확인)|Long|private|; backend/src/main/java/com/cell/platform/domain/task/Task.java:17|
|C-027|field|private String title|선언된 상태/설정/응답 값|String|private|; backend/src/main/java/com/cell/platform/domain/task/Task.java:18|
|C-027|field|private Long speciesId|선언된 상태/설정/응답 값|Long|private|; backend/src/main/java/com/cell/platform/domain/task/Task.java:19|
|C-027|field|private String speciesCode|선언된 상태/설정/응답 값|String|private|; backend/src/main/java/com/cell/platform/domain/task/Task.java:20|
|C-027|field|private String speciesName|선언된 상태/설정/응답 값|String|private|; backend/src/main/java/com/cell/platform/domain/task/Task.java:21|
|C-027|field|private LocalDateTime createdAt|생성 시각|LocalDateTime|private|; backend/src/main/java/com/cell/platform/domain/task/Task.java:22|
|C-027|field|private LocalDateTime deadlineAt|과제 마감 시각|LocalDateTime|private|; backend/src/main/java/com/cell/platform/domain/task/Task.java:23|
|C-027|field|private List&lt;Crop&gt; crops|선언된 상태/설정/응답 값|List&lt;Crop&gt;|private|; backend/src/main/java/com/cell/platform/domain/task/Task.java:24|
|C-027|constructor|public Task(Long id, TaskStatus status, String originalFilename, String uploadedFilename, Long assignmentId, String title, Long speciesId, String speciesCode, String speciesName, LocalDateTime createdAt, LocalDateTime deadlineAt, List&lt;Crop&gt; crops)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|@Builder; backend/src/main/java/com/cell/platform/domain/task/Task.java:26|
|C-027|method|public static Task create(String originalFilename, String uploadedFilename)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Task|public|; backend/src/main/java/com/cell/platform/domain/task/Task.java:45|
|C-027|method|public static Task create(String originalFilename, String uploadedFilename, LocalDateTime deadlineAt)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Task|public|; backend/src/main/java/com/cell/platform/domain/task/Task.java:49|
|C-027|method|public static Task create(String originalFilename, String uploadedFilename, LocalDateTime deadlineAt, Long speciesId, String speciesCode, String speciesName)|생성·저장·구성; 명시 호출 Task.builder|Task|public|; backend/src/main/java/com/cell/platform/domain/task/Task.java:53|
|C-027|method|public static Task createForAssignment(String originalFilename, String uploadedFilename, Long assignmentId, String title, LocalDateTime deadlineAt)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Task|public|; backend/src/main/java/com/cell/platform/domain/task/Task.java:67|
|C-027|method|public static Task createForAssignment(String originalFilename, String uploadedFilename, Long assignmentId, String title, LocalDateTime deadlineAt, Long speciesId, String speciesCode, String speciesName)|생성·저장·구성; 명시 호출 Task.builder|Task|public|; backend/src/main/java/com/cell/platform/domain/task/Task.java:73|

#### C-028 — TaskRepository

- 역할: 업무 저장소 추상 계약. 근거: `backend/src/main/java/com/cell/platform/domain/task/TaskRepository.java:7`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-028|method|Task save(Task task)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Task|public (interface)|; backend/src/main/java/com/cell/platform/domain/task/TaskRepository.java:9|
|C-028|method|Optional&lt;Task&gt; findById(Long id)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Optional&lt;Task&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/task/TaskRepository.java:11|
|C-028|method|List&lt;Task&gt; findAllByOrderByIdDesc()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Task&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/task/TaskRepository.java:13|
|C-028|method|List&lt;Long&gt; findIdsByUploadedFilenameStartingWith(String prefix)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Long&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/task/TaskRepository.java:15|
|C-028|method|List&lt;Task&gt; findByAssignmentId(Long assignmentId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Task&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/task/TaskRepository.java:17|
|C-028|method|void updateDeadlineAt(Long taskId, LocalDateTime deadlineAt)|상태·라벨·통계 변경; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public (interface)|; backend/src/main/java/com/cell/platform/domain/task/TaskRepository.java:19|
|C-028|method|void updateDeadlineAtByAssignmentId(Long assignmentId, LocalDateTime deadlineAt)|상태·라벨·통계 변경; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public (interface)|; backend/src/main/java/com/cell/platform/domain/task/TaskRepository.java:21|
|C-028|method|void deleteById(Long id)|삭제·차감·초기화; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public (interface)|; backend/src/main/java/com/cell/platform/domain/task/TaskRepository.java:23|

#### C-029 — TaskStatus

- 역할: 업무 값/상태 상수 집합. 근거: `backend/src/main/java/com/cell/platform/domain/task/TaskStatus.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-029|enum constants|IN_PROGRESS, COMPLETED|허용 상수 집합|TaskStatus|public static final|; backend/src/main/java/com/cell/platform/domain/task/TaskStatus.java:3|

#### C-030 — Role

- 역할: 업무 값/상태 상수 집합. 근거: `backend/src/main/java/com/cell/platform/domain/user/Role.java:7`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-030|enum constants|STUDENT, EXPERT, ADMIN|허용 상수 집합|Role|public static final|; backend/src/main/java/com/cell/platform/domain/user/Role.java:7|
|C-030|field|STUDENT, EXPERT, ADMIN|선언된 상태/설정/응답 값|STUDENT, EXPERT,|package-private|; backend/src/main/java/com/cell/platform/domain/user/Role.java:8|
|C-030|method|public static Role find(String userRole)|조회·변환·판정; 명시 호출 Arrays.stream, role.name|Role|public|; backend/src/main/java/com/cell/platform/domain/user/Role.java:10|

#### C-031 — User

- 역할: 업무 모델·생성 규칙. 근거: `backend/src/main/java/com/cell/platform/domain/user/User.java:10`.
- 선언 annotation: `@Getter`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-031|field|private Long id|PK 또는 식별자|Long|private|; backend/src/main/java/com/cell/platform/domain/user/User.java:12|
|C-031|field|private String username|로그인 ID|String|private|; backend/src/main/java/com/cell/platform/domain/user/User.java:13|
|C-031|field|private String name|표시 이름 또는 명칭|String|private|; backend/src/main/java/com/cell/platform/domain/user/User.java:14|
|C-031|field|private String password|해시 저장/요청 비밀번호 필드; 실제 값 생략|String|private|; backend/src/main/java/com/cell/platform/domain/user/User.java:15|
|C-031|field|private Role role|STUDENT/EXPERT/ADMIN|Role|private|; backend/src/main/java/com/cell/platform/domain/user/User.java:16|
|C-031|field|private UserStatus status|계정 또는 과제 상태|UserStatus|private|; backend/src/main/java/com/cell/platform/domain/user/User.java:17|
|C-031|field|private LocalDateTime createdAt|생성 시각|LocalDateTime|private|; backend/src/main/java/com/cell/platform/domain/user/User.java:18|
|C-031|constructor|public User(Long id, String username, String name, String password, Role role, UserStatus status, LocalDateTime createdAt)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|@Builder; backend/src/main/java/com/cell/platform/domain/user/User.java:20|
|C-031|method|public static User create(String username, String name, String password, Role role)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|User|public|; backend/src/main/java/com/cell/platform/domain/user/User.java:31|
|C-031|method|public static User create(String username, String name, String password, Role role, UserStatus status)|생성·저장·구성; 명시 호출 User.builder|User|public|; backend/src/main/java/com/cell/platform/domain/user/User.java:35|
|C-031|method|public static User create(String username, String password, Role role)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|User|public|; backend/src/main/java/com/cell/platform/domain/user/User.java:45|

#### C-032 — UserRepository

- 역할: 업무 저장소 추상 계약. 근거: `backend/src/main/java/com/cell/platform/domain/user/UserRepository.java:6`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-032|method|User save(User user)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|User|public (interface)|; backend/src/main/java/com/cell/platform/domain/user/UserRepository.java:8|
|C-032|method|Optional&lt;User&gt; findByUsername(String username)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Optional&lt;User&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/user/UserRepository.java:10|
|C-032|method|List&lt;User&gt; findAll()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;User&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/user/UserRepository.java:12|
|C-032|method|List&lt;User&gt; findAllByRole(Role role)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;User&gt;|public (interface)|; backend/src/main/java/com/cell/platform/domain/user/UserRepository.java:14|
|C-032|method|boolean existsByUsername(String username)|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|boolean|public (interface)|; backend/src/main/java/com/cell/platform/domain/user/UserRepository.java:16|
|C-032|method|void deleteByUsername(String username)|삭제·차감·초기화; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public (interface)|; backend/src/main/java/com/cell/platform/domain/user/UserRepository.java:18|

#### C-033 — UserStatus

- 역할: 업무 값/상태 상수 집합. 근거: `backend/src/main/java/com/cell/platform/domain/user/UserStatus.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-033|enum constants|ACTIVE, PENDING, REJECTED, INACTIVE|허용 상수 집합|UserStatus|public static final|; backend/src/main/java/com/cell/platform/domain/user/UserStatus.java:3|

#### C-034 — AdminStatusRequest

- 역할: HTTP 요청 입력·필드/일부 validation 계약. 근거: `backend/src/main/java/com/cell/platform/dto/request/AdminStatusRequest.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-034|record component|String status|계정 또는 과제 상태|String|private final / accessor public (record 규칙)|@NotBlank String status; backend/src/main/java/com/cell/platform/dto/request/AdminStatusRequest.java:5|

#### C-035 — AnimalSpeciesNameRequest

- 역할: HTTP 요청 입력·필드/일부 validation 계약. 근거: `backend/src/main/java/com/cell/platform/dto/request/AnimalSpeciesNameRequest.java:6`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-035|record component|String name|표시 이름 또는 명칭|String|private final / accessor public (record 규칙)|@NotBlank(message = "동물 종 이름은 필수입니다.") @Size(max = 60, message = "동물 종 이름은 60자 이하여야 합니다.") String name; backend/src/main/java/com/cell/platform/dto/request/AnimalSpeciesNameRequest.java:6|

#### C-036 — ConfirmRequest

- 역할: HTTP 요청 입력·필드/일부 validation 계약. 근거: `backend/src/main/java/com/cell/platform/dto/request/ConfirmRequest.java:7`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-036|record component|String finalLabel|전문가 확정/채점 정답|String|private final / accessor public (record 규칙)|String finalLabel; backend/src/main/java/com/cell/platform/dto/request/ConfirmRequest.java:7|
|C-036|compact record constructor|public ConfirmRequest { ... }|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/dto/request/ConfirmRequest.java:10|

#### C-037 — CropIssueReportRequest

- 역할: HTTP 요청 입력·필드/일부 validation 계약. 근거: `backend/src/main/java/com/cell/platform/dto/request/CropIssueReportRequest.java:8`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-037|record component|Long taskId|소속 Task ID|Long|private final / accessor public (record 규칙)|Long taskId; backend/src/main/java/com/cell/platform/dto/request/CropIssueReportRequest.java:8|
|C-037|record component|Long cropId|대상 crop ID|Long|private final / accessor public (record 규칙)|Long cropId; backend/src/main/java/com/cell/platform/dto/request/CropIssueReportRequest.java:8|
|C-037|record component|String studentId|학생 사용자 ID 문자열(실제 개인정보 값 생략)|String|private final / accessor public (record 규칙)|String studentId; backend/src/main/java/com/cell/platform/dto/request/CropIssueReportRequest.java:8|
|C-037|record component|String reason|신고 사유|String|private final / accessor public (record 규칙)|String reason; backend/src/main/java/com/cell/platform/dto/request/CropIssueReportRequest.java:8|
|C-037|compact record constructor|public CropIssueReportRequest { ... }|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/dto/request/CropIssueReportRequest.java:14|
|C-037|method|private void validateNotBlank(String value, String fieldName)|검증·정규화·조건 판단; 명시 호출 Objects.isNull, value.isBlank|void|private|; backend/src/main/java/com/cell/platform/dto/request/CropIssueReportRequest.java:25|

#### C-038 — DeadlineUpdateRequest

- 역할: HTTP 요청 입력·필드/일부 validation 계약. 근거: `backend/src/main/java/com/cell/platform/dto/request/DeadlineUpdateRequest.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-038|record component|LocalDateTime deadlineAt|과제 마감 시각|LocalDateTime|private final / accessor public (record 규칙)|LocalDateTime deadlineAt; backend/src/main/java/com/cell/platform/dto/request/DeadlineUpdateRequest.java:5|

#### C-039 — DiagnosticTaskCreateRequest

- 역할: HTTP 요청 입력·필드/일부 validation 계약. 근거: `backend/src/main/java/com/cell/platform/dto/request/DiagnosticTaskCreateRequest.java:8`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-039|record component|Integer totalQuestions|선언된 상태/설정/응답 값|Integer|private final / accessor public (record 규칙)|@NotNull(message = "전체 문제 수는 필수입니다.") @Min(value = 1, message = "전체 문제 수는 1 이상이어야 합니다.") Integer totalQuestions; backend/src/main/java/com/cell/platform/dto/request/DiagnosticTaskCreateRequest.java:8|
|C-039|record component|Map&lt;String, Integer&gt; classDistribution|선언된 상태/설정/응답 값|Map&lt;String, Integer&gt;|private final / accessor public (record 규칙)|@NotNull(message = "클래스 분포는 필수입니다.") Map&lt;String, Integer&gt; classDistribution; backend/src/main/java/com/cell/platform/dto/request/DiagnosticTaskCreateRequest.java:8|

#### C-040 — GameRecordRequest

- 역할: HTTP 요청 입력·필드/일부 validation 계약. 근거: `backend/src/main/java/com/cell/platform/dto/request/GameRecordRequest.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-040|record component|String mode|게임 모드|String|private final / accessor public (record 규칙)|String mode; backend/src/main/java/com/cell/platform/dto/request/GameRecordRequest.java:5|
|C-040|record component|List&lt;Entry&gt; players|선언된 상태/설정/응답 값|List&lt;Entry&gt;|private final / accessor public (record 규칙)|List&lt;Entry&gt; players; backend/src/main/java/com/cell/platform/dto/request/GameRecordRequest.java:5|

#### C-041 — Entry

- 역할: HTTP 요청 입력·필드/일부 validation 계약. 근거: `backend/src/main/java/com/cell/platform/dto/request/GameRecordRequest.java:6`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-041|record component|String name|표시 이름 또는 명칭|String|private final / accessor public (record 규칙)|String name; backend/src/main/java/com/cell/platform/dto/request/GameRecordRequest.java:6|
|C-041|record component|int score|게임 점수|int|private final / accessor public (record 규칙)|int score; backend/src/main/java/com/cell/platform/dto/request/GameRecordRequest.java:6|

#### C-042 — LabelingImportRequest

- 역할: HTTP 요청 입력·필드/일부 validation 계약. 근거: `backend/src/main/java/com/cell/platform/dto/request/LabelingImportRequest.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-042|record component|Long taskId|소속 Task ID|Long|private final / accessor public (record 규칙)|Long taskId; backend/src/main/java/com/cell/platform/dto/request/LabelingImportRequest.java:5|
|C-042|record component|List&lt;CellLabel&gt; cells|선언된 상태/설정/응답 값|List&lt;CellLabel&gt;|private final / accessor public (record 규칙)|List&lt;CellLabel&gt; cells; backend/src/main/java/com/cell/platform/dto/request/LabelingImportRequest.java:5|

#### C-043 — CellLabel

- 역할: HTTP 요청 입력·필드/일부 validation 계약. 근거: `backend/src/main/java/com/cell/platform/dto/request/LabelingImportRequest.java:9`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-043|record component|Long cropId|대상 crop ID|Long|private final / accessor public (record 규칙)|Long cropId; backend/src/main/java/com/cell/platform/dto/request/LabelingImportRequest.java:9|
|C-043|record component|String gtLabel|원천/가져온 GT 라벨|String|private final / accessor public (record 규칙)|String gtLabel; backend/src/main/java/com/cell/platform/dto/request/LabelingImportRequest.java:9|
|C-043|record component|String finalLabel|전문가 확정/채점 정답|String|private final / accessor public (record 규칙)|String finalLabel; backend/src/main/java/com/cell/platform/dto/request/LabelingImportRequest.java:9|

#### C-044 — LoginRequest

- 역할: HTTP 요청 입력·필드/일부 validation 계약. 근거: `backend/src/main/java/com/cell/platform/dto/request/LoginRequest.java:7`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-044|record component|String username|로그인 ID|String|private final / accessor public (record 규칙)|String username; backend/src/main/java/com/cell/platform/dto/request/LoginRequest.java:7|
|C-044|record component|String password|해시 저장/요청 비밀번호 필드; 실제 값 생략|String|private final / accessor public (record 규칙)|String password; backend/src/main/java/com/cell/platform/dto/request/LoginRequest.java:7|
|C-044|compact record constructor|public LoginRequest { ... }|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/dto/request/LoginRequest.java:11|
|C-044|method|private void validateNotBlank(String value, String fieldName)|검증·정규화·조건 판단; 명시 호출 Objects.isNull, value.isBlank|void|private|; backend/src/main/java/com/cell/platform/dto/request/LoginRequest.java:16|

#### C-045 — RegisterRequest

- 역할: HTTP 요청 입력·필드/일부 validation 계약. 근거: `backend/src/main/java/com/cell/platform/dto/request/RegisterRequest.java:9`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-045|record component|String username|로그인 ID|String|private final / accessor public (record 규칙)|@NotBlank(message = "아이디는 비어있을 수 없습니다.") String username; backend/src/main/java/com/cell/platform/dto/request/RegisterRequest.java:9|
|C-045|record component|String name|표시 이름 또는 명칭|String|private final / accessor public (record 규칙)|String name; backend/src/main/java/com/cell/platform/dto/request/RegisterRequest.java:9|
|C-045|record component|String password|해시 저장/요청 비밀번호 필드; 실제 값 생략|String|private final / accessor public (record 규칙)|@NotBlank(message = "비밀번호는 비어있을 수 없습니다.") String password; backend/src/main/java/com/cell/platform/dto/request/RegisterRequest.java:9|
|C-045|record component|String role|STUDENT/EXPERT/ADMIN|String|private final / accessor public (record 규칙)|String role; backend/src/main/java/com/cell/platform/dto/request/RegisterRequest.java:9|
|C-045|constructor|public RegisterRequest(String username, String password, String role)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/dto/request/RegisterRequest.java:17|

#### C-046 — SpeciesUpdateRequest

- 역할: HTTP 요청 입력·필드/일부 validation 계약. 근거: `backend/src/main/java/com/cell/platform/dto/request/SpeciesUpdateRequest.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-046|record component|Long speciesId|선언된 상태/설정/응답 값|Long|private final / accessor public (record 규칙)|@NotNull(message = "동물 종은 필수입니다.") Long speciesId; backend/src/main/java/com/cell/platform/dto/request/SpeciesUpdateRequest.java:5|

#### C-047 — StudentRosterRequest

- 역할: HTTP 요청 입력·필드/일부 validation 계약. 근거: `backend/src/main/java/com/cell/platform/dto/request/StudentRosterRequest.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-047|record component|List&lt;String&gt; studentIds|선언된 상태/설정/응답 값|List&lt;String&gt;|private final / accessor public (record 규칙)|List&lt;String&gt; studentIds; backend/src/main/java/com/cell/platform/dto/request/StudentRosterRequest.java:5|

#### C-048 — SubmissionRequest

- 역할: HTTP 요청 입력·필드/일부 validation 계약. 근거: `backend/src/main/java/com/cell/platform/dto/request/SubmissionRequest.java:7`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-048|record component|Long cropId|대상 crop ID|Long|private final / accessor public (record 규칙)|Long cropId; backend/src/main/java/com/cell/platform/dto/request/SubmissionRequest.java:7|
|C-048|record component|String studentLabel|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String studentLabel; backend/src/main/java/com/cell/platform/dto/request/SubmissionRequest.java:7|
|C-048|compact record constructor|public SubmissionRequest { ... }|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/dto/request/SubmissionRequest.java:11|
|C-048|method|private void validateNotBlank(String value, String fieldName)|검증·정규화·조건 판단; 명시 호출 Objects.isNull, value.isBlank|void|private|; backend/src/main/java/com/cell/platform/dto/request/SubmissionRequest.java:18|

#### C-049 — AdminCropResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/AdminCropResponse.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-049|record component|Long cropId|대상 crop ID|Long|private final / accessor public (record 규칙)|Long cropId; backend/src/main/java/com/cell/platform/dto/response/AdminCropResponse.java:3|
|C-049|record component|Long taskId|소속 Task ID|Long|private final / accessor public (record 규칙)|Long taskId; backend/src/main/java/com/cell/platform/dto/response/AdminCropResponse.java:3|
|C-049|record component|String cropFilename|세포 이미지 파일명|String|private final / accessor public (record 규칙)|String cropFilename; backend/src/main/java/com/cell/platform/dto/response/AdminCropResponse.java:3|
|C-049|record component|String originalSmearFilename|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String originalSmearFilename; backend/src/main/java/com/cell/platform/dto/response/AdminCropResponse.java:3|
|C-049|record component|Long speciesId|선언된 상태/설정/응답 값|Long|private final / accessor public (record 규칙)|Long speciesId; backend/src/main/java/com/cell/platform/dto/response/AdminCropResponse.java:3|
|C-049|record component|String speciesCode|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesCode; backend/src/main/java/com/cell/platform/dto/response/AdminCropResponse.java:3|
|C-049|record component|String speciesName|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesName; backend/src/main/java/com/cell/platform/dto/response/AdminCropResponse.java:3|
|C-049|record component|String gtLabel|원천/가져온 GT 라벨|String|private final / accessor public (record 규칙)|String gtLabel; backend/src/main/java/com/cell/platform/dto/response/AdminCropResponse.java:3|
|C-049|record component|String pseudoLabel|현재 AI 예측 후보 라벨|String|private final / accessor public (record 규칙)|String pseudoLabel; backend/src/main/java/com/cell/platform/dto/response/AdminCropResponse.java:3|
|C-049|record component|String finalLabel|전문가 확정/채점 정답|String|private final / accessor public (record 규칙)|String finalLabel; backend/src/main/java/com/cell/platform/dto/response/AdminCropResponse.java:3|
|C-049|record component|boolean hasLabel|선언된 상태/설정/응답 값|boolean|private final / accessor public (record 규칙)|boolean hasLabel; backend/src/main/java/com/cell/platform/dto/response/AdminCropResponse.java:3|

#### C-050 — AdminSmearResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/AdminSmearResponse.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-050|record component|Long taskId|소속 Task ID|Long|private final / accessor public (record 규칙)|Long taskId; backend/src/main/java/com/cell/platform/dto/response/AdminSmearResponse.java:5|
|C-050|record component|String originalFilename|UUID 원본 저장 파일명|String|private final / accessor public (record 규칙)|String originalFilename; backend/src/main/java/com/cell/platform/dto/response/AdminSmearResponse.java:5|
|C-050|record component|String uploadedFilename|업로드 당시 이름/진단 prefix|String|private final / accessor public (record 규칙)|String uploadedFilename; backend/src/main/java/com/cell/platform/dto/response/AdminSmearResponse.java:5|
|C-050|record component|Long speciesId|선언된 상태/설정/응답 값|Long|private final / accessor public (record 규칙)|Long speciesId; backend/src/main/java/com/cell/platform/dto/response/AdminSmearResponse.java:5|
|C-050|record component|String speciesCode|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesCode; backend/src/main/java/com/cell/platform/dto/response/AdminSmearResponse.java:5|
|C-050|record component|String speciesName|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesName; backend/src/main/java/com/cell/platform/dto/response/AdminSmearResponse.java:5|
|C-050|record component|LocalDateTime createdAt|생성 시각|LocalDateTime|private final / accessor public (record 규칙)|LocalDateTime createdAt; backend/src/main/java/com/cell/platform/dto/response/AdminSmearResponse.java:5|
|C-050|record component|long totalCrops|선언된 상태/설정/응답 값|long|private final / accessor public (record 규칙)|long totalCrops; backend/src/main/java/com/cell/platform/dto/response/AdminSmearResponse.java:5|
|C-050|record component|long labeledCrops|선언된 상태/설정/응답 값|long|private final / accessor public (record 규칙)|long labeledCrops; backend/src/main/java/com/cell/platform/dto/response/AdminSmearResponse.java:5|
|C-050|record component|boolean hasLabel|선언된 상태/설정/응답 값|boolean|private final / accessor public (record 규칙)|boolean hasLabel; backend/src/main/java/com/cell/platform/dto/response/AdminSmearResponse.java:5|

#### C-051 — AiAnalysisResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/AiAnalysisResponse.java:10`.
- 선언 annotation: `@Getter`, `@NoArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-051|field|private int totalDetected|선언된 상태/설정/응답 값|int|private|@JsonProperty("total_detected"); backend/src/main/java/com/cell/platform/dto/response/AiAnalysisResponse.java:12|
|C-051|field|private List&lt;DetectedCell&gt; cells|선언된 상태/설정/응답 값|List&lt;DetectedCell&gt;|private|; backend/src/main/java/com/cell/platform/dto/response/AiAnalysisResponse.java:15|

#### C-052 — DetectedCell

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/AiAnalysisResponse.java:19`.
- 선언 annotation: `@Getter`, `@NoArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-052|field|private String cropFilename|세포 이미지 파일명|String|private|@JsonProperty("crop_filename"); backend/src/main/java/com/cell/platform/dto/response/AiAnalysisResponse.java:20|
|C-052|field|private String bbox|xyxy 좌표의 문자열|String|private|; backend/src/main/java/com/cell/platform/dto/response/AiAnalysisResponse.java:23|
|C-052|field|private String prediction|선언된 상태/설정/응답 값|String|private|; backend/src/main/java/com/cell/platform/dto/response/AiAnalysisResponse.java:24|
|C-052|field|private Double confidence|선언된 상태/설정/응답 값|Double|private|; backend/src/main/java/com/cell/platform/dto/response/AiAnalysisResponse.java:25|

#### C-053 — AnimalSpeciesResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/AnimalSpeciesResponse.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-053|record component|Long id|PK 또는 식별자|Long|private final / accessor public (record 규칙)|Long id; backend/src/main/java/com/cell/platform/dto/response/AnimalSpeciesResponse.java:5|
|C-053|record component|String code|종/오류 등 코드|String|private final / accessor public (record 규칙)|String code; backend/src/main/java/com/cell/platform/dto/response/AnimalSpeciesResponse.java:5|
|C-053|record component|String name|표시 이름 또는 명칭|String|private final / accessor public (record 규칙)|String name; backend/src/main/java/com/cell/platform/dto/response/AnimalSpeciesResponse.java:5|
|C-053|record component|boolean builtIn|선언된 상태/설정/응답 값|boolean|private final / accessor public (record 규칙)|boolean builtIn; backend/src/main/java/com/cell/platform/dto/response/AnimalSpeciesResponse.java:5|
|C-053|method|public static AnimalSpeciesResponse from(AnimalSpeciesEntity entity)|조회·변환·판정; 명시 호출 entity.getCode, entity.getId, entity.getName, entity.isBuiltIn|AnimalSpeciesResponse|public|; backend/src/main/java/com/cell/platform/dto/response/AnimalSpeciesResponse.java:11|

#### C-054 — AssignmentResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/AssignmentResponse.java:6`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-054|record component|Long assignmentId|논리 Assignment ID(FK는 별도 확인)|Long|private final / accessor public (record 규칙)|Long assignmentId; backend/src/main/java/com/cell/platform/dto/response/AssignmentResponse.java:6|
|C-054|record component|String title|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String title; backend/src/main/java/com/cell/platform/dto/response/AssignmentResponse.java:6|
|C-054|record component|String expertUsername|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String expertUsername; backend/src/main/java/com/cell/platform/dto/response/AssignmentResponse.java:6|
|C-054|record component|LocalDateTime createdAt|생성 시각|LocalDateTime|private final / accessor public (record 규칙)|LocalDateTime createdAt; backend/src/main/java/com/cell/platform/dto/response/AssignmentResponse.java:6|
|C-054|record component|List&lt;TaskUploadResponse&gt; tasks|선언된 상태/설정/응답 값|List&lt;TaskUploadResponse&gt;|private final / accessor public (record 규칙)|List&lt;TaskUploadResponse&gt; tasks; backend/src/main/java/com/cell/platform/dto/response/AssignmentResponse.java:6|
|C-054|record component|int totalCrops|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int totalCrops; backend/src/main/java/com/cell/platform/dto/response/AssignmentResponse.java:6|

#### C-055 — CropIssueReportResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/CropIssueReportResponse.java:7`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-055|record component|Long id|PK 또는 식별자|Long|private final / accessor public (record 규칙)|Long id; backend/src/main/java/com/cell/platform/dto/response/CropIssueReportResponse.java:7|
|C-055|record component|String studentId|학생 사용자 ID 문자열(실제 개인정보 값 생략)|String|private final / accessor public (record 규칙)|String studentId; backend/src/main/java/com/cell/platform/dto/response/CropIssueReportResponse.java:7|
|C-055|record component|Long taskId|소속 Task ID|Long|private final / accessor public (record 규칙)|Long taskId; backend/src/main/java/com/cell/platform/dto/response/CropIssueReportResponse.java:7|
|C-055|record component|Long cropId|대상 crop ID|Long|private final / accessor public (record 규칙)|Long cropId; backend/src/main/java/com/cell/platform/dto/response/CropIssueReportResponse.java:7|
|C-055|record component|String cropFilename|세포 이미지 파일명|String|private final / accessor public (record 규칙)|String cropFilename; backend/src/main/java/com/cell/platform/dto/response/CropIssueReportResponse.java:7|
|C-055|record component|String speciesCode|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesCode; backend/src/main/java/com/cell/platform/dto/response/CropIssueReportResponse.java:7|
|C-055|record component|String speciesName|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesName; backend/src/main/java/com/cell/platform/dto/response/CropIssueReportResponse.java:7|
|C-055|record component|String reason|신고 사유|String|private final / accessor public (record 규칙)|String reason; backend/src/main/java/com/cell/platform/dto/response/CropIssueReportResponse.java:7|
|C-055|record component|LocalDateTime createdAt|생성 시각|LocalDateTime|private final / accessor public (record 규칙)|LocalDateTime createdAt; backend/src/main/java/com/cell/platform/dto/response/CropIssueReportResponse.java:7|
|C-055|method|public static CropIssueReportResponse from(CropIssueReportEntity entity, String cropFilename, String speciesCode, String speciesName)|조회·변환·판정; 명시 호출 entity.getCreatedAt, entity.getCropId, entity.getId, entity.getReason, entity.getStudentId|CropIssueReportResponse|public|; backend/src/main/java/com/cell/platform/dto/response/CropIssueReportResponse.java:18|

#### C-056 — CropResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-056|record component|Long id|PK 또는 식별자|Long|private final / accessor public (record 규칙)|Long id; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:5|
|C-056|record component|Long taskId|소속 Task ID|Long|private final / accessor public (record 규칙)|Long taskId; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:5|
|C-056|record component|String cropFilename|세포 이미지 파일명|String|private final / accessor public (record 규칙)|String cropFilename; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:5|
|C-056|record component|String bbox|xyxy 좌표의 문자열|String|private final / accessor public (record 규칙)|String bbox; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:5|
|C-056|record component|String gtLabel|원천/가져온 GT 라벨|String|private final / accessor public (record 규칙)|String gtLabel; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:5|
|C-056|record component|String pseudoLabel|현재 AI 예측 후보 라벨|String|private final / accessor public (record 규칙)|String pseudoLabel; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:5|
|C-056|record component|String finalLabel|전문가 확정/채점 정답|String|private final / accessor public (record 규칙)|String finalLabel; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:5|
|C-056|record component|Double aiBboxConfidence|선언된 상태/설정/응답 값|Double|private final / accessor public (record 규칙)|Double aiBboxConfidence; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:5|
|C-056|record component|Double aiClassificationConfidence|선언된 상태/설정/응답 값|Double|private final / accessor public (record 규칙)|Double aiClassificationConfidence; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:5|
|C-056|record component|String originalSmearFilename|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String originalSmearFilename; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:5|
|C-056|record component|Long speciesId|선언된 상태/설정/응답 값|Long|private final / accessor public (record 규칙)|Long speciesId; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:5|
|C-056|record component|String speciesCode|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesCode; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:5|
|C-056|record component|String speciesName|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesName; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:5|
|C-056|constructor|public CropResponse(Long id, Long taskId, String cropFilename, String bbox, String gtLabel, String pseudoLabel, String finalLabel, Double aiBboxConfidence, Double aiClassificationConfidence, String originalSmearFilename)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:20|
|C-056|method|public static CropResponse from(Crop crop)|조회·변환·판정; 명시 호출 crop.getAiBboxConfidence, crop.getAiClassificationConfidence, crop.getBbox, crop.getCropFilename, crop.getFinalLabel|CropResponse|public|; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:29|
|C-056|method|public static CropResponse forStudent(Crop crop)|업무/보조 처리; 명시 호출 crop.getBbox, crop.getCropFilename, crop.getId, crop.getOriginalSmearFilename, crop.getSpeciesCode|CropResponse|public|; backend/src/main/java/com/cell/platform/dto/response/CropResponse.java:40|

#### C-057 — CropStatsResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8`.
- 선언 annotation: `@Builder`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-057|record component|Long taskId|소속 Task ID|Long|private final / accessor public (record 규칙)|Long taskId; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|Long cropId|대상 crop ID|Long|private final / accessor public (record 규칙)|Long cropId; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|String filename|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String filename; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|String originalSmearFilename|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String originalSmearFilename; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|Long speciesId|선언된 상태/설정/응답 값|Long|private final / accessor public (record 규칙)|Long speciesId; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|String speciesCode|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesCode; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|String speciesName|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesName; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|String bbox|xyxy 좌표의 문자열|String|private final / accessor public (record 규칙)|String bbox; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|String gtLabel|원천/가져온 GT 라벨|String|private final / accessor public (record 규칙)|String gtLabel; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|String pseudoLabel|현재 AI 예측 후보 라벨|String|private final / accessor public (record 규칙)|String pseudoLabel; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|Double aiBboxConfidence|선언된 상태/설정/응답 값|Double|private final / accessor public (record 규칙)|Double aiBboxConfidence; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|Double aiClassificationConfidence|선언된 상태/설정/응답 값|Double|private final / accessor public (record 규칙)|Double aiClassificationConfidence; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|String finalLabel|전문가 확정/채점 정답|String|private final / accessor public (record 규칙)|String finalLabel; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|int totalAnswers|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int totalAnswers; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|double errorRate|선언된 상태/설정/응답 값|double|private final / accessor public (record 규칙)|double errorRate; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|double accuracyRate|선언된 상태/설정/응답 값|double|private final / accessor public (record 규칙)|double accuracyRate; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|double hardScore|선언된 상태/설정/응답 값|double|private final / accessor public (record 규칙)|double hardScore; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|List&lt;String&gt; wrongDetails|선언된 상태/설정/응답 값|List&lt;String&gt;|private final / accessor public (record 규칙)|List&lt;String&gt; wrongDetails; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|Map&lt;String, Integer&gt; voteDistribution|선언된 상태/설정/응답 값|Map&lt;String, Integer&gt;|private final / accessor public (record 규칙)|Map&lt;String, Integer&gt; voteDistribution; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|
|C-057|record component|Map&lt;String, List&lt;VoterDetail&gt;&gt; votersByLabel|선언된 상태/설정/응답 값|Map&lt;String, List&lt;VoterDetail&gt;&gt;|private final / accessor public (record 규칙)|Map&lt;String, List&lt;VoterDetail&gt;&gt; votersByLabel; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:8|

#### C-058 — VoterDetail

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:30`.
- 선언 annotation: `@Builder`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-058|record component|String studentId|학생 사용자 ID 문자열(실제 개인정보 값 생략)|String|private final / accessor public (record 규칙)|String studentId; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:30|
|C-058|record component|String studentName|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String studentName; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:30|
|C-058|record component|String studentDisplayName|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String studentDisplayName; backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java:30|

#### C-059 — DiagnosticPoolStatsResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/DiagnosticPoolStatsResponse.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-059|record component|int totalAvailable|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int totalAvailable; backend/src/main/java/com/cell/platform/dto/response/DiagnosticPoolStatsResponse.java:5|
|C-059|record component|Map&lt;String, Integer&gt; availableByClass|선언된 상태/설정/응답 값|Map&lt;String, Integer&gt;|private final / accessor public (record 규칙)|Map&lt;String, Integer&gt; availableByClass; backend/src/main/java/com/cell/platform/dto/response/DiagnosticPoolStatsResponse.java:5|
|C-059|record component|Long speciesId|선언된 상태/설정/응답 값|Long|private final / accessor public (record 규칙)|Long speciesId; backend/src/main/java/com/cell/platform/dto/response/DiagnosticPoolStatsResponse.java:5|
|C-059|record component|String speciesCode|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesCode; backend/src/main/java/com/cell/platform/dto/response/DiagnosticPoolStatsResponse.java:5|
|C-059|record component|String speciesName|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesName; backend/src/main/java/com/cell/platform/dto/response/DiagnosticPoolStatsResponse.java:5|
|C-059|constructor|public DiagnosticPoolStatsResponse(int totalAvailable, Map&lt;String, Integer&gt; availableByClass)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/dto/response/DiagnosticPoolStatsResponse.java:12|

#### C-060 — DiagnosticStudentMatrixResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/DiagnosticStudentMatrixResponse.java:11`.
- 선언 annotation: `@Getter`, `@Builder`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-060|field|private List&lt;StudentMatrixDetail&gt; studentMatrices|선언된 상태/설정/응답 값|List&lt;StudentMatrixDetail&gt;|private|; backend/src/main/java/com/cell/platform/dto/response/DiagnosticStudentMatrixResponse.java:12|

#### C-061 — StudentMatrixDetail

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/DiagnosticStudentMatrixResponse.java:16`.
- 선언 annotation: `@Getter`, `@Builder`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-061|field|private String studentId|학생 사용자 ID 문자열(실제 개인정보 값 생략)|String|private|; backend/src/main/java/com/cell/platform/dto/response/DiagnosticStudentMatrixResponse.java:17|
|C-061|field|private String studentName|선언된 상태/설정/응답 값|String|private|; backend/src/main/java/com/cell/platform/dto/response/DiagnosticStudentMatrixResponse.java:18|
|C-061|field|private String studentDisplayName|선언된 상태/설정/응답 값|String|private|; backend/src/main/java/com/cell/platform/dto/response/DiagnosticStudentMatrixResponse.java:19|
|C-061|field|private Map&lt;String, Map&lt;String, Integer&gt;&gt; confusionMatrix|선언된 상태/설정/응답 값|Map&lt;String, Map&lt;String, Integer&gt;&gt;|private|; backend/src/main/java/com/cell/platform/dto/response/DiagnosticStudentMatrixResponse.java:20|
|C-061|field|private int totalSolved|선언된 상태/설정/응답 값|int|private|; backend/src/main/java/com/cell/platform/dto/response/DiagnosticStudentMatrixResponse.java:21|
|C-061|field|private int accuracy|선언된 상태/설정/응답 값|int|private|; backend/src/main/java/com/cell/platform/dto/response/DiagnosticStudentMatrixResponse.java:22|

#### C-062 — GameRecordResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/GameRecordResponse.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-062|record component|String name|표시 이름 또는 명칭|String|private final / accessor public (record 규칙)|String name; backend/src/main/java/com/cell/platform/dto/response/GameRecordResponse.java:3|
|C-062|record component|int score|게임 점수|int|private final / accessor public (record 규칙)|int score; backend/src/main/java/com/cell/platform/dto/response/GameRecordResponse.java:3|
|C-062|record component|String date|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String date; backend/src/main/java/com/cell/platform/dto/response/GameRecordResponse.java:3|

#### C-063 — LabelingManifestResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-063|record component|Long taskId|소속 Task ID|Long|private final / accessor public (record 규칙)|Long taskId; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:5|
|C-063|record component|String smearFilename|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String smearFilename; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:5|
|C-063|record component|String storedSmearFilename|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String storedSmearFilename; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:5|
|C-063|record component|String exportSmearFilename|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String exportSmearFilename; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:5|
|C-063|record component|Long speciesId|선언된 상태/설정/응답 값|Long|private final / accessor public (record 규칙)|Long speciesId; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:5|
|C-063|record component|String speciesCode|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesCode; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:5|
|C-063|record component|String speciesName|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesName; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:5|
|C-063|record component|List&lt;CellAnnotation&gt; cells|선언된 상태/설정/응답 값|List&lt;CellAnnotation&gt;|private final / accessor public (record 규칙)|List&lt;CellAnnotation&gt; cells; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:5|

#### C-064 — CellAnnotation

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:15`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-064|record component|Long cropId|대상 crop ID|Long|private final / accessor public (record 규칙)|Long cropId; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:15|
|C-064|record component|String exportFilename|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String exportFilename; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:15|
|C-064|record component|String storedFilename|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String storedFilename; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:15|
|C-064|record component|String bbox|xyxy 좌표의 문자열|String|private final / accessor public (record 규칙)|String bbox; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:15|
|C-064|record component|String gtLabel|원천/가져온 GT 라벨|String|private final / accessor public (record 규칙)|String gtLabel; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:15|
|C-064|record component|String finalLabel|전문가 확정/채점 정답|String|private final / accessor public (record 규칙)|String finalLabel; backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java:15|

#### C-065 — LoginResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/LoginResponse.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-065|record component|String accessToken|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String accessToken; backend/src/main/java/com/cell/platform/dto/response/LoginResponse.java:3|
|C-065|record component|String tokenType|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String tokenType; backend/src/main/java/com/cell/platform/dto/response/LoginResponse.java:3|
|C-065|record component|String role|STUDENT/EXPERT/ADMIN|String|private final / accessor public (record 규칙)|String role; backend/src/main/java/com/cell/platform/dto/response/LoginResponse.java:3|
|C-065|record component|String username|로그인 ID|String|private final / accessor public (record 규칙)|String username; backend/src/main/java/com/cell/platform/dto/response/LoginResponse.java:3|
|C-065|record component|String name|표시 이름 또는 명칭|String|private final / accessor public (record 규칙)|String name; backend/src/main/java/com/cell/platform/dto/response/LoginResponse.java:3|
|C-065|method|public static LoginResponse of(String token, String role, String username, String name)|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|LoginResponse|public|; backend/src/main/java/com/cell/platform/dto/response/LoginResponse.java:10|
|C-065|method|public static LoginResponse of(String token, String role, String username)|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|LoginResponse|public|; backend/src/main/java/com/cell/platform/dto/response/LoginResponse.java:14|

#### C-066 — MyResultsResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:8`.
- 선언 annotation: `@Builder`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-066|record component|int total|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int total; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:8|
|C-066|record component|int correct|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int correct; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:8|
|C-066|record component|int wrong|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int wrong; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:8|
|C-066|record component|int accuracy|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int accuracy; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:8|
|C-066|record component|List&lt;Detail&gt; details|선언된 상태/설정/응답 값|List&lt;Detail&gt;|private final / accessor public (record 규칙)|List&lt;Detail&gt; details; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:8|
|C-066|record component|List&lt;String&gt; labels|선언된 상태/설정/응답 값|List&lt;String&gt;|private final / accessor public (record 규칙)|List&lt;String&gt; labels; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:8|
|C-066|record component|Map&lt;String, Map&lt;String, Integer&gt;&gt; confusionMatrix|선언된 상태/설정/응답 값|Map&lt;String, Map&lt;String, Integer&gt;&gt;|private final / accessor public (record 규칙)|Map&lt;String, Map&lt;String, Integer&gt;&gt; confusionMatrix; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:8|

#### C-067 — Detail

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:18`.
- 선언 annotation: `@Builder`, `@Builder`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-067|record component|Long cropId|대상 crop ID|Long|private final / accessor public (record 규칙)|Long cropId; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:18|
|C-067|record component|String cropFilename|세포 이미지 파일명|String|private final / accessor public (record 규칙)|String cropFilename; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:18|
|C-067|record component|String speciesCode|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesCode; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:18|
|C-067|record component|String speciesName|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesName; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:18|
|C-067|record component|String studentLabel|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String studentLabel; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:18|
|C-067|record component|String correctLabel|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String correctLabel; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:18|
|C-067|record component|Boolean isCorrect|선언된 상태/설정/응답 값|Boolean|private final / accessor public (record 규칙)|Boolean isCorrect; backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java:18|

#### C-068 — RegisterResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/RegisterResponse.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-068|record component|String status|계정 또는 과제 상태|String|private final / accessor public (record 규칙)|String status; backend/src/main/java/com/cell/platform/dto/response/RegisterResponse.java:3|
|C-068|record component|String message|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String message; backend/src/main/java/com/cell/platform/dto/response/RegisterResponse.java:3|
|C-068|method|public static RegisterResponse active()|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|RegisterResponse|public|; backend/src/main/java/com/cell/platform/dto/response/RegisterResponse.java:7|
|C-068|method|public static RegisterResponse pending()|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|RegisterResponse|public|; backend/src/main/java/com/cell/platform/dto/response/RegisterResponse.java:11|

#### C-069 — RosterImportResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/RosterImportResponse.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-069|record component|int added|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int added; backend/src/main/java/com/cell/platform/dto/response/RosterImportResponse.java:3|
|C-069|record component|int skipped|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int skipped; backend/src/main/java/com/cell/platform/dto/response/RosterImportResponse.java:3|

#### C-070 — StudentLearningResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:6`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-070|record component|String studentId|학생 사용자 ID 문자열(실제 개인정보 값 생략)|String|private final / accessor public (record 규칙)|String studentId; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:6|
|C-070|record component|List&lt;Activity&gt; activities|선언된 상태/설정/응답 값|List&lt;Activity&gt;|private final / accessor public (record 규칙)|List&lt;Activity&gt; activities; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:6|

#### C-071 — Summary

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:7`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-071|record component|int totalCells|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int totalCells; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:7|
|C-071|record component|int answeredCells|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int answeredCells; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:7|
|C-071|record component|int correct|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int correct; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:7|
|C-071|record component|int wrong|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int wrong; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:7|
|C-071|record component|int pendingAnswers|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int pendingAnswers; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:7|
|C-071|record component|boolean labelingComplete|선언된 상태/설정/응답 값|boolean|private final / accessor public (record 규칙)|boolean labelingComplete; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:7|
|C-071|record component|Double accuracy|선언된 상태/설정/응답 값|Double|private final / accessor public (record 규칙)|Double accuracy; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:7|

#### C-072 — Activity

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:10`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-072|record component|String scopeType|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String scopeType; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:10|
|C-072|record component|Long scopeId|선언된 상태/설정/응답 값|Long|private final / accessor public (record 규칙)|Long scopeId; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:10|
|C-072|record component|String title|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String title; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:10|
|C-072|record component|LocalDateTime createdAt|생성 시각|LocalDateTime|private final / accessor public (record 규칙)|LocalDateTime createdAt; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:10|
|C-072|record component|LocalDateTime deadlineAt|과제 마감 시각|LocalDateTime|private final / accessor public (record 규칙)|LocalDateTime deadlineAt; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:10|
|C-072|record component|Summary summary|선언된 상태/설정/응답 값|Summary|private final / accessor public (record 규칙)|Summary summary; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:10|
|C-072|record component|List&lt;TaskResult&gt; tasks|선언된 상태/설정/응답 값|List&lt;TaskResult&gt;|private final / accessor public (record 규칙)|List&lt;TaskResult&gt; tasks; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:10|

#### C-073 — TaskResult

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:14`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-073|record component|Long taskId|소속 Task ID|Long|private final / accessor public (record 규칙)|Long taskId; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:14|
|C-073|record component|String title|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String title; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:14|
|C-073|record component|String filename|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String filename; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:14|
|C-073|record component|String speciesCode|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesCode; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:14|
|C-073|record component|String speciesName|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesName; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:14|
|C-073|record component|Summary summary|선언된 상태/설정/응답 값|Summary|private final / accessor public (record 규칙)|Summary summary; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:14|

#### C-074 — TaskDetail

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:17`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-074|record component|String studentId|학생 사용자 ID 문자열(실제 개인정보 값 생략)|String|private final / accessor public (record 규칙)|String studentId; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:17|
|C-074|record component|TaskResult task|소속 Task 엔티티|TaskResult|private final / accessor public (record 규칙)|TaskResult task; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:17|
|C-074|record component|List&lt;CellResult&gt; cells|선언된 상태/설정/응답 값|List&lt;CellResult&gt;|private final / accessor public (record 규칙)|List&lt;CellResult&gt; cells; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:17|

#### C-075 — CellResult

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:19`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-075|record component|Long cropId|대상 crop ID|Long|private final / accessor public (record 규칙)|Long cropId; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:19|
|C-075|record component|String cropFilename|세포 이미지 파일명|String|private final / accessor public (record 규칙)|String cropFilename; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:19|
|C-075|record component|String studentLabel|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String studentLabel; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:19|
|C-075|record component|String correctLabel|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String correctLabel; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:19|
|C-075|record component|Boolean isCorrect|선언된 상태/설정/응답 값|Boolean|private final / accessor public (record 규칙)|Boolean isCorrect; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:19|
|C-075|record component|LocalDateTime submittedAt|답안 저장 시각|LocalDateTime|private final / accessor public (record 규칙)|LocalDateTime submittedAt; backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java:19|

#### C-076 — StudentReviewResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:6`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-076|record component|List&lt;ReviewGroup&gt; reviews|선언된 상태/설정/응답 값|List&lt;ReviewGroup&gt;|private final / accessor public (record 규칙)|List&lt;ReviewGroup&gt; reviews; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:6|

#### C-077 — ReviewGroup

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-077|record component|String scopeType|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String scopeType; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|
|C-077|record component|Long scopeId|선언된 상태/설정/응답 값|Long|private final / accessor public (record 규칙)|Long scopeId; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|
|C-077|record component|String title|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String title; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|
|C-077|record component|String thumbnailFilename|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String thumbnailFilename; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|
|C-077|record component|LocalDateTime deadlineAt|과제 마감 시각|LocalDateTime|private final / accessor public (record 규칙)|LocalDateTime deadlineAt; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|
|C-077|record component|String availabilityReason|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String availabilityReason; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|
|C-077|record component|int totalCells|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int totalCells; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|
|C-077|record component|int answeredCells|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int answeredCells; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|
|C-077|record component|int unsubmittedCells|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int unsubmittedCells; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|
|C-077|record component|int gradedAnswers|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int gradedAnswers; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|
|C-077|record component|int pendingAnswers|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int pendingAnswers; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|
|C-077|record component|int correct|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int correct; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|
|C-077|record component|int wrong|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int wrong; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|
|C-077|record component|Integer accuracy|선언된 상태/설정/응답 값|Integer|private final / accessor public (record 규칙)|Integer accuracy; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|
|C-077|record component|List&lt;ReviewCell&gt; cells|선언된 상태/설정/응답 값|List&lt;ReviewCell&gt;|private final / accessor public (record 규칙)|List&lt;ReviewCell&gt; cells; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:9|

#### C-078 — ReviewCell

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:28`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-078|record component|Long taskId|소속 Task ID|Long|private final / accessor public (record 규칙)|Long taskId; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:28|
|C-078|record component|Long cropId|대상 crop ID|Long|private final / accessor public (record 규칙)|Long cropId; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:28|
|C-078|record component|String cropFilename|세포 이미지 파일명|String|private final / accessor public (record 규칙)|String cropFilename; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:28|
|C-078|record component|String originalSmearFilename|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String originalSmearFilename; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:28|
|C-078|record component|String speciesCode|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesCode; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:28|
|C-078|record component|String speciesName|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesName; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:28|
|C-078|record component|String bbox|xyxy 좌표의 문자열|String|private final / accessor public (record 규칙)|String bbox; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:28|
|C-078|record component|String studentLabel|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String studentLabel; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:28|
|C-078|record component|String correctLabel|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String correctLabel; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:28|
|C-078|record component|Boolean isCorrect|선언된 상태/설정/응답 값|Boolean|private final / accessor public (record 규칙)|Boolean isCorrect; backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java:28|

#### C-079 — StudentRosterResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/StudentRosterResponse.java:7`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-079|record component|Long id|PK 또는 식별자|Long|private final / accessor public (record 규칙)|Long id; backend/src/main/java/com/cell/platform/dto/response/StudentRosterResponse.java:7|
|C-079|record component|String studentId|학생 사용자 ID 문자열(실제 개인정보 값 생략)|String|private final / accessor public (record 규칙)|String studentId; backend/src/main/java/com/cell/platform/dto/response/StudentRosterResponse.java:7|
|C-079|record component|String registeredBy|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String registeredBy; backend/src/main/java/com/cell/platform/dto/response/StudentRosterResponse.java:7|
|C-079|record component|Long claimedUserId|명단을 claim한 사용자 ID|Long|private final / accessor public (record 규칙)|Long claimedUserId; backend/src/main/java/com/cell/platform/dto/response/StudentRosterResponse.java:7|
|C-079|record component|LocalDateTime createdAt|생성 시각|LocalDateTime|private final / accessor public (record 규칙)|LocalDateTime createdAt; backend/src/main/java/com/cell/platform/dto/response/StudentRosterResponse.java:7|
|C-079|method|public static StudentRosterResponse from(StudentRosterEntity roster)|조회·변환·판정; 명시 호출 roster.getClaimedUserId, roster.getCreatedAt, roster.getId, roster.getRegisteredBy, roster.getStudentId|StudentRosterResponse|public|; backend/src/main/java/com/cell/platform/dto/response/StudentRosterResponse.java:14|

#### C-080 — TaskResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:6`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-080|record component|Long id|PK 또는 식별자|Long|private final / accessor public (record 규칙)|Long id; backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:6|
|C-080|record component|String status|계정 또는 과제 상태|String|private final / accessor public (record 규칙)|String status; backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:6|
|C-080|record component|String originalFilename|UUID 원본 저장 파일명|String|private final / accessor public (record 규칙)|String originalFilename; backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:6|
|C-080|record component|String uploadedFilename|업로드 당시 이름/진단 prefix|String|private final / accessor public (record 규칙)|String uploadedFilename; backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:6|
|C-080|record component|Long assignmentId|논리 Assignment ID(FK는 별도 확인)|Long|private final / accessor public (record 규칙)|Long assignmentId; backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:6|
|C-080|record component|String title|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String title; backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:6|
|C-080|record component|Long speciesId|선언된 상태/설정/응답 값|Long|private final / accessor public (record 규칙)|Long speciesId; backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:6|
|C-080|record component|String speciesCode|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesCode; backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:6|
|C-080|record component|String speciesName|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesName; backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:6|
|C-080|record component|LocalDateTime createdAt|생성 시각|LocalDateTime|private final / accessor public (record 규칙)|LocalDateTime createdAt; backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:6|
|C-080|record component|LocalDateTime deadlineAt|과제 마감 시각|LocalDateTime|private final / accessor public (record 규칙)|LocalDateTime deadlineAt; backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:6|
|C-080|record component|int cropCount|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int cropCount; backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:6|
|C-080|constructor|public TaskResponse(Long id, String status, String originalFilename, String uploadedFilename, Long assignmentId, String title, LocalDateTime createdAt, LocalDateTime deadlineAt, int cropCount)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:20|
|C-080|method|public static TaskResponse from(Task task)|조회·변환·판정; 명시 호출 task.getAssignmentId, task.getCreatedAt, task.getCrops, task.getDeadlineAt, task.getId|TaskResponse|public|; backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java:27|

#### C-081 — TaskUploadResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/TaskUploadResponse.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-081|record component|Long taskId|소속 Task ID|Long|private final / accessor public (record 규칙)|Long taskId; backend/src/main/java/com/cell/platform/dto/response/TaskUploadResponse.java:5|
|C-081|record component|String originalImage|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String originalImage; backend/src/main/java/com/cell/platform/dto/response/TaskUploadResponse.java:5|
|C-081|record component|Long speciesId|선언된 상태/설정/응답 값|Long|private final / accessor public (record 규칙)|Long speciesId; backend/src/main/java/com/cell/platform/dto/response/TaskUploadResponse.java:5|
|C-081|record component|String speciesCode|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesCode; backend/src/main/java/com/cell/platform/dto/response/TaskUploadResponse.java:5|
|C-081|record component|String speciesName|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesName; backend/src/main/java/com/cell/platform/dto/response/TaskUploadResponse.java:5|
|C-081|record component|int totalDetected|선언된 상태/설정/응답 값|int|private final / accessor public (record 규칙)|int totalDetected; backend/src/main/java/com/cell/platform/dto/response/TaskUploadResponse.java:5|
|C-081|record component|List&lt;CropResponse&gt; crops|선언된 상태/설정/응답 값|List&lt;CropResponse&gt;|private final / accessor public (record 규칙)|List&lt;CropResponse&gt; crops; backend/src/main/java/com/cell/platform/dto/response/TaskUploadResponse.java:5|
|C-081|method|public static TaskUploadResponse of(Long taskId, String filename, List&lt;CropResponse&gt; crops)|업무/보조 처리; 명시 호출 crops.size|TaskUploadResponse|public|; backend/src/main/java/com/cell/platform/dto/response/TaskUploadResponse.java:14|
|C-081|method|public static TaskUploadResponse of(com.cell.platform.domain.task.Task task, String filename, List&lt;CropResponse&gt; crops)|업무/보조 처리; 명시 호출 crops.size, task.getId, task.getSpeciesCode, task.getSpeciesId, task.getSpeciesName|TaskUploadResponse|public|; backend/src/main/java/com/cell/platform/dto/response/TaskUploadResponse.java:18|

#### C-082 — TrainingDataResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/TrainingDataResponse.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-082|record component|Long cropId|대상 crop ID|Long|private final / accessor public (record 규칙)|Long cropId; backend/src/main/java/com/cell/platform/dto/response/TrainingDataResponse.java:5|
|C-082|record component|String cropFilename|세포 이미지 파일명|String|private final / accessor public (record 규칙)|String cropFilename; backend/src/main/java/com/cell/platform/dto/response/TrainingDataResponse.java:5|
|C-082|record component|String label|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String label; backend/src/main/java/com/cell/platform/dto/response/TrainingDataResponse.java:5|
|C-082|record component|Long speciesId|선언된 상태/설정/응답 값|Long|private final / accessor public (record 규칙)|Long speciesId; backend/src/main/java/com/cell/platform/dto/response/TrainingDataResponse.java:5|
|C-082|record component|String speciesCode|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesCode; backend/src/main/java/com/cell/platform/dto/response/TrainingDataResponse.java:5|
|C-082|record component|String speciesName|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String speciesName; backend/src/main/java/com/cell/platform/dto/response/TrainingDataResponse.java:5|
|C-082|constructor|public TrainingDataResponse(Long cropId, String cropFilename, String label)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/dto/response/TrainingDataResponse.java:13|
|C-082|method|public static TrainingDataResponse from(Crop crop)|조회·변환·판정; 명시 호출 crop.getCropFilename, crop.getFinalLabel, crop.getId, crop.getSpeciesCode, crop.getSpeciesId|TrainingDataResponse|public|; backend/src/main/java/com/cell/platform/dto/response/TrainingDataResponse.java:17|

#### C-083 — UserResponse

- 역할: HTTP 응답/중첩 자료 구조. 근거: `backend/src/main/java/com/cell/platform/dto/response/UserResponse.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-083|record component|Long id|PK 또는 식별자|Long|private final / accessor public (record 규칙)|Long id; backend/src/main/java/com/cell/platform/dto/response/UserResponse.java:5|
|C-083|record component|String username|로그인 ID|String|private final / accessor public (record 규칙)|String username; backend/src/main/java/com/cell/platform/dto/response/UserResponse.java:5|
|C-083|record component|String name|표시 이름 또는 명칭|String|private final / accessor public (record 규칙)|String name; backend/src/main/java/com/cell/platform/dto/response/UserResponse.java:5|
|C-083|record component|String role|STUDENT/EXPERT/ADMIN|String|private final / accessor public (record 규칙)|String role; backend/src/main/java/com/cell/platform/dto/response/UserResponse.java:5|
|C-083|record component|String status|계정 또는 과제 상태|String|private final / accessor public (record 규칙)|String status; backend/src/main/java/com/cell/platform/dto/response/UserResponse.java:5|
|C-083|record component|LocalDateTime createdAt|생성 시각|LocalDateTime|private final / accessor public (record 규칙)|LocalDateTime createdAt; backend/src/main/java/com/cell/platform/dto/response/UserResponse.java:5|

#### C-084 — AnimalSpeciesEntity

- 역할: JPA 테이블·관계·저장 필드와 일부 변경 메서드. 근거: `backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:22`.
- 선언 annotation: `@Entity`, `@Table(name = "animal_species")`, `@Getter`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-084|field|private Long id|PK 또는 식별자|Long|private|@Id @GeneratedValue(strategy = GenerationType.IDENTITY); backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:24|
|C-084|field|private String code|종/오류 등 코드|String|private|@Column(nullable = false, unique = true, length = 40); backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:28|
|C-084|field|private String name|표시 이름 또는 명칭|String|private|@Column(nullable = false, unique = true, length = 60); backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:31|
|C-084|field|private boolean builtIn|선언된 상태/설정/응답 값|boolean|private|@Column(nullable = false); backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:34|
|C-084|field|private LocalDateTime createdAt|생성 시각|LocalDateTime|private|@Column(nullable = false); backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:37|
|C-084|field|private LocalDateTime updatedAt|갱신 시각|LocalDateTime|private|@Column(nullable = false); backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:40|
|C-084|constructor|private AnimalSpeciesEntity(Long id, String code, String name, boolean builtIn, LocalDateTime createdAt, LocalDateTime updatedAt)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|private|@Builder; backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:43|
|C-084|method|void prePersist()|업무/보조 처리; 명시 호출 LocalDateTime.now|void|package-private|@PrePersist; backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:54|
|C-084|method|void preUpdate()|업무/보조 처리; 명시 호출 LocalDateTime.now|void|package-private|@PreUpdate; backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:61|
|C-084|method|public void rename(String name)|상태·라벨·통계 변경; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public|; backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:66|

#### C-085 — AssignmentEntity

- 역할: JPA 테이블·관계·저장 필드와 일부 변경 메서드. 근거: `backend/src/main/java/com/cell/platform/entity/AssignmentEntity.java:11`.
- 선언 annotation: `@Entity`, `@Table(name = "assignments")`, `@Getter`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-085|field|private Long id|PK 또는 식별자|Long|private|@Id @GeneratedValue(strategy = GenerationType.IDENTITY); backend/src/main/java/com/cell/platform/entity/AssignmentEntity.java:13|
|C-085|field|private String title|선언된 상태/설정/응답 값|String|private|@Column(nullable = false); backend/src/main/java/com/cell/platform/entity/AssignmentEntity.java:17|
|C-085|field|private String expertUsername|선언된 상태/설정/응답 값|String|private|@Column(nullable = false); backend/src/main/java/com/cell/platform/entity/AssignmentEntity.java:20|
|C-085|field|private LocalDateTime createdAt|생성 시각|LocalDateTime|private|; backend/src/main/java/com/cell/platform/entity/AssignmentEntity.java:23|
|C-085|method|void prePersist()|업무/보조 처리; 명시 호출 LocalDateTime.now|void|package-private|@PrePersist; backend/src/main/java/com/cell/platform/entity/AssignmentEntity.java:25|
|C-085|constructor|private AssignmentEntity(Long id, String title, String expertUsername, LocalDateTime createdAt)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|private|@Builder; backend/src/main/java/com/cell/platform/entity/AssignmentEntity.java:28|

#### C-086 — CropEntity

- 역할: JPA 테이블·관계·저장 필드와 일부 변경 메서드. 근거: `backend/src/main/java/com/cell/platform/entity/CropEntity.java:11`.
- 선언 annotation: `@Entity`, `@Table(name = "crops")`, `@Getter`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-086|field|private Long id|PK 또는 식별자|Long|private|@Id @GeneratedValue(strategy = GenerationType.IDENTITY); backend/src/main/java/com/cell/platform/entity/CropEntity.java:13|
|C-086|field|private TaskEntity task|소속 Task 엔티티|TaskEntity|private|@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "task_id", nullable = false); backend/src/main/java/com/cell/platform/entity/CropEntity.java:17|
|C-086|field|private String cropFilename|세포 이미지 파일명|String|private|@Column(nullable = false); backend/src/main/java/com/cell/platform/entity/CropEntity.java:21|
|C-086|field|private String bbox|xyxy 좌표의 문자열|String|private|; backend/src/main/java/com/cell/platform/entity/CropEntity.java:24|
|C-086|field|private CellType gtLabel|원천/가져온 GT 라벨|CellType|private|@Enumerated(EnumType.STRING) @Column(name = "gt_label"); backend/src/main/java/com/cell/platform/entity/CropEntity.java:26|
|C-086|field|private CellType pseudoLabel|현재 AI 예측 후보 라벨|CellType|private|@Enumerated(EnumType.STRING) @Column(name = "pseudo_label"); backend/src/main/java/com/cell/platform/entity/CropEntity.java:30|
|C-086|field|private Double aiBboxConfidence|선언된 상태/설정/응답 값|Double|private|@Column(name = "ai_bbox_confidence"); backend/src/main/java/com/cell/platform/entity/CropEntity.java:34|
|C-086|field|private Double aiClassificationConfidence|선언된 상태/설정/응답 값|Double|private|@Column(name = "ai_classification_confidence"); backend/src/main/java/com/cell/platform/entity/CropEntity.java:37|
|C-086|field|private CellType finalLabel|전문가 확정/채점 정답|CellType|private|@Enumerated(EnumType.STRING); backend/src/main/java/com/cell/platform/entity/CropEntity.java:40|
|C-086|constructor|private CropEntity(Long id, TaskEntity task, String cropFilename, String bbox, CellType gtLabel, CellType pseudoLabel, Double aiBboxConfidence, Double aiClassificationConfidence, CellType finalLabel)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|private|@Builder; backend/src/main/java/com/cell/platform/entity/CropEntity.java:43|
|C-086|method|public void assignTask(TaskEntity task)|상태·라벨·통계 변경; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public|; backend/src/main/java/com/cell/platform/entity/CropEntity.java:59|
|C-086|method|public Long getTaskId()|조회·변환·판정; 명시 호출 task.getId|Long|public|; backend/src/main/java/com/cell/platform/entity/CropEntity.java:63|
|C-086|method|public void updateFinalLabel(CellType finalLabel)|상태·라벨·통계 변경; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public|; backend/src/main/java/com/cell/platform/entity/CropEntity.java:67|
|C-086|method|public void updateGtLabel(CellType gtLabel)|상태·라벨·통계 변경; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public|; backend/src/main/java/com/cell/platform/entity/CropEntity.java:71|
|C-086|method|public void updatePseudoLabel(CellType pseudoLabel)|상태·라벨·통계 변경; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public|; backend/src/main/java/com/cell/platform/entity/CropEntity.java:75|

#### C-087 — CropIssueReportEntity

- 역할: JPA 테이블·관계·저장 필드와 일부 변경 메서드. 근거: `backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:19`.
- 선언 annotation: `@Entity`, `@Table(name = "crop_issue_reports")`, `@Getter`, `@Setter`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-087|field|private Long id|PK 또는 식별자|Long|private|@Id @GeneratedValue(strategy = GenerationType.IDENTITY); backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:21|
|C-087|field|private String studentId|학생 사용자 ID 문자열(실제 개인정보 값 생략)|String|private|@Column(name = "student_id", nullable = false); backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:25|
|C-087|field|private Long taskId|소속 Task ID|Long|private|@Column(name = "task_id", nullable = false); backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:28|
|C-087|field|private Long cropId|대상 crop ID|Long|private|@Column(name = "crop_id", nullable = false); backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:31|
|C-087|field|private String reason|신고 사유|String|private|@Column(name = "reason", nullable = false); backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:34|
|C-087|field|private LocalDateTime createdAt|생성 시각|LocalDateTime|private|@Column(name = "created_at", nullable = false); backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:37|
|C-087|method|void prePersist()|업무/보조 처리; 명시 호출 LocalDateTime.now|void|package-private|@PrePersist; backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:40|

#### C-088 — GameRecordEntity

- 역할: JPA 테이블·관계·저장 필드와 일부 변경 메서드. 근거: `backend/src/main/java/com/cell/platform/entity/GameRecordEntity.java:13`.
- 선언 annotation: `@Entity`, `@Table(name = "game_records")`, `@Getter`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`, `@Builder`, `@AllArgsConstructor(access = AccessLevel.PRIVATE)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-088|field|private Long id|PK 또는 식별자|Long|private|@Id @GeneratedValue(strategy = GenerationType.IDENTITY); backend/src/main/java/com/cell/platform/entity/GameRecordEntity.java:15|
|C-088|field|private String playerName|선언된 상태/설정/응답 값|String|private|@Column(name = "player_name", nullable = false, length = 50); backend/src/main/java/com/cell/platform/entity/GameRecordEntity.java:19|
|C-088|field|private int score|게임 점수|int|private|@Column(nullable = false); backend/src/main/java/com/cell/platform/entity/GameRecordEntity.java:22|
|C-088|field|private String mode|게임 모드|String|private|@Column(nullable = false, length = 10); backend/src/main/java/com/cell/platform/entity/GameRecordEntity.java:25|
|C-088|field|private LocalDateTime playedAt|선언된 상태/설정/응답 값|LocalDateTime|private|@Column(name = "played_at", nullable = false); backend/src/main/java/com/cell/platform/entity/GameRecordEntity.java:28|

#### C-089 — StudentConfusionMatrixEntity

- 역할: JPA 테이블·관계·저장 필드와 일부 변경 메서드. 근거: `backend/src/main/java/com/cell/platform/entity/StudentConfusionMatrixEntity.java:22`.
- 선언 annotation: `@Entity`, `@Table(name = "student_confusion_matrix")`, `@Getter`, `@Setter`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-089|field|private Long id|PK 또는 식별자|Long|private|@Id @GeneratedValue(strategy = GenerationType.IDENTITY); backend/src/main/java/com/cell/platform/entity/StudentConfusionMatrixEntity.java:24|
|C-089|field|private String studentId|학생 사용자 ID 문자열(실제 개인정보 값 생략)|String|private|@Column(name = "student_id", nullable = false); backend/src/main/java/com/cell/platform/entity/StudentConfusionMatrixEntity.java:28|
|C-089|field|private Long taskId|소속 Task ID|Long|private|@Column(name = "task_id", nullable = false); backend/src/main/java/com/cell/platform/entity/StudentConfusionMatrixEntity.java:31|
|C-089|field|private Map&lt;String, Map&lt;String, Integer&gt;&gt; matrixData|정답행×응답열 카운트 JSON|Map&lt;String, Map&lt;String, Integer&gt;&gt;|private|@JdbcTypeCode(SqlTypes.JSON) @Column(name = "matrix_data", columnDefinition = "json"); backend/src/main/java/com/cell/platform/entity/StudentConfusionMatrixEntity.java:34|
|C-089|field|private LocalDateTime updatedAt|갱신 시각|LocalDateTime|private|@Column(name = "updated_at"); backend/src/main/java/com/cell/platform/entity/StudentConfusionMatrixEntity.java:38|
|C-089|method|protected void onUpdate()|업무/보조 처리; 명시 호출 LocalDateTime.now|void|protected|@PreUpdate; backend/src/main/java/com/cell/platform/entity/StudentConfusionMatrixEntity.java:41|

#### C-090 — StudentRosterEntity

- 역할: JPA 테이블·관계·저장 필드와 일부 변경 메서드. 근거: `backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:14`.
- 선언 annotation: `@Entity`, `@Table(name = "student_roster")`, `@Getter`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-090|field|private Long id|PK 또는 식별자|Long|private|@Id @GeneratedValue(strategy = GenerationType.IDENTITY); backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:16|
|C-090|field|private String studentId|학생 사용자 ID 문자열(실제 개인정보 값 생략)|String|private|@Column(unique = true, nullable = false); backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:20|
|C-090|field|private String registeredBy|선언된 상태/설정/응답 값|String|private|; backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:23|
|C-090|field|private Long claimedUserId|명단을 claim한 사용자 ID|Long|private|; backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:25|
|C-090|field|private LocalDateTime createdAt|생성 시각|LocalDateTime|private|; backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:27|
|C-090|method|void prePersist()|업무/보조 처리; 명시 호출 LocalDateTime.now|void|package-private|@PrePersist; backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:29|
|C-090|constructor|public StudentRosterEntity(String studentId, String registeredBy)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:34|
|C-090|method|public void claim(Long userId)|상태·라벨·통계 변경; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public|; backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:39|

#### C-091 — SubmissionEntity

- 역할: JPA 테이블·관계·저장 필드와 일부 변경 메서드. 근거: `backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:12`.
- 선언 annotation: `@Entity`, `@Table(name = "submissions")`, `@Getter`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-091|field|private Long id|PK 또는 식별자|Long|private|@Id @GeneratedValue(strategy = GenerationType.IDENTITY); backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:14|
|C-091|field|private CropEntity crop|선언된 상태/설정/응답 값|CropEntity|private|@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "crop_id", nullable = false); backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:18|
|C-091|field|private String studentId|학생 사용자 ID 문자열(실제 개인정보 값 생략)|String|private|@Column(nullable = false); backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:22|
|C-091|field|private CellType studentLabel|선언된 상태/설정/응답 값|CellType|private|@Enumerated(EnumType.STRING) @Column(nullable = false); backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:25|
|C-091|field|private LocalDateTime submittedAt|답안 저장 시각|LocalDateTime|private|; backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:29|
|C-091|method|void prePersist()|업무/보조 처리; 명시 호출 LocalDateTime.now|void|package-private|@PrePersist; backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:31|
|C-091|method|public void updateLabel(CellType newLabel)|상태·라벨·통계 변경; 명시 호출 LocalDateTime.now|void|public|; backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:36|
|C-091|constructor|private SubmissionEntity(Long id, CropEntity crop, String studentId, CellType studentLabel, LocalDateTime submittedAt)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|private|@Builder; backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:41|

#### C-092 — TaskEntity

- 역할: JPA 테이블·관계·저장 필드와 일부 변경 메서드. 근거: `backend/src/main/java/com/cell/platform/entity/TaskEntity.java:14`.
- 선언 annotation: `@Entity`, `@Table(name = "tasks")`, `@Getter`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-092|field|private Long id|PK 또는 식별자|Long|private|@Id @GeneratedValue(strategy = GenerationType.IDENTITY); backend/src/main/java/com/cell/platform/entity/TaskEntity.java:16|
|C-092|field|private TaskStatus status|계정 또는 과제 상태|TaskStatus|private|@Enumerated(EnumType.STRING) @Column(nullable = false); backend/src/main/java/com/cell/platform/entity/TaskEntity.java:20|
|C-092|field|private String originalFilename|UUID 원본 저장 파일명|String|private|@Column(nullable = false); backend/src/main/java/com/cell/platform/entity/TaskEntity.java:24|
|C-092|field|private String uploadedFilename|업로드 당시 이름/진단 prefix|String|private|@Column; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:27|
|C-092|field|private Long assignmentId|논리 Assignment ID(FK는 별도 확인)|Long|private|@Column; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:30|
|C-092|field|private String title|선언된 상태/설정/응답 값|String|private|@Column; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:33|
|C-092|field|private AnimalSpeciesEntity animalSpecies|동물 종 JPA 연관|AnimalSpeciesEntity|private|@ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "animal_species_id"); backend/src/main/java/com/cell/platform/entity/TaskEntity.java:36|
|C-092|field|private LocalDateTime createdAt|생성 시각|LocalDateTime|private|; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:40|
|C-092|field|private LocalDateTime deadlineAt|과제 마감 시각|LocalDateTime|private|; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:42|
|C-092|field|private List&lt;CropEntity&gt; crops|선언된 상태/설정/응답 값|List&lt;CropEntity&gt;|private|@OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true); backend/src/main/java/com/cell/platform/entity/TaskEntity.java:44|
|C-092|method|void prePersist()|업무/보조 처리; 명시 호출 LocalDateTime.now|void|package-private|@PrePersist; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:47|
|C-092|constructor|private TaskEntity(Long id, TaskStatus status, String originalFilename, String uploadedFilename, Long assignmentId, String title, AnimalSpeciesEntity animalSpecies, LocalDateTime createdAt, LocalDateTime deadlineAt)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|private|@Builder; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:52|
|C-092|method|public void addCrop(CropEntity cropEntity)|생성·저장·구성; 명시 호출 cropEntity.assignTask, crops.add|void|public|; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:68|
|C-092|method|public void updateDeadlineAt(LocalDateTime deadlineAt)|상태·라벨·통계 변경; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public|; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:73|
|C-092|method|public void updateAnimalSpecies(AnimalSpeciesEntity animalSpecies)|상태·라벨·통계 변경; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public|; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:77|

#### C-093 — UserEntity

- 역할: JPA 테이블·관계·저장 필드와 일부 변경 메서드. 근거: `backend/src/main/java/com/cell/platform/entity/UserEntity.java:13`.
- 선언 annotation: `@Entity`, `@Table(name = "users")`, `@Getter`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-093|field|private Long id|PK 또는 식별자|Long|private|@Id @GeneratedValue(strategy = GenerationType.IDENTITY); backend/src/main/java/com/cell/platform/entity/UserEntity.java:15|
|C-093|field|private String username|로그인 ID|String|private|@Column(unique = true, nullable = false); backend/src/main/java/com/cell/platform/entity/UserEntity.java:19|
|C-093|field|private String name|표시 이름 또는 명칭|String|private|; backend/src/main/java/com/cell/platform/entity/UserEntity.java:22|
|C-093|field|private String password|해시 저장/요청 비밀번호 필드; 실제 값 생략|String|private|@Column(nullable = false); backend/src/main/java/com/cell/platform/entity/UserEntity.java:24|
|C-093|field|private Role role|STUDENT/EXPERT/ADMIN|Role|private|@Enumerated(EnumType.STRING) @Column(nullable = false); backend/src/main/java/com/cell/platform/entity/UserEntity.java:27|
|C-093|field|private UserStatus status|계정 또는 과제 상태|UserStatus|private|@Enumerated(EnumType.STRING) @Column(nullable = false); backend/src/main/java/com/cell/platform/entity/UserEntity.java:31|
|C-093|field|private LocalDateTime createdAt|생성 시각|LocalDateTime|private|; backend/src/main/java/com/cell/platform/entity/UserEntity.java:35|
|C-093|method|void prePersist()|업무/보조 처리; 명시 호출 LocalDateTime.now|void|package-private|@PrePersist; backend/src/main/java/com/cell/platform/entity/UserEntity.java:37|
|C-093|constructor|private UserEntity(Long id, String username, String name, String password, Role role, UserStatus status, LocalDateTime createdAt)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|private|@Builder; backend/src/main/java/com/cell/platform/entity/UserEntity.java:45|
|C-093|method|public void changeStatus(UserStatus status)|상태·라벨·통계 변경; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public|; backend/src/main/java/com/cell/platform/entity/UserEntity.java:56|

#### C-094 — AuthenticationException

- 역할: 업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약. 근거: `backend/src/main/java/com/cell/platform/exception/AuthenticationException.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-094|constructor|public AuthenticationException(String message, ErrorCode errorCode)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/exception/AuthenticationException.java:5|

#### C-095 — AuthorizationException

- 역할: 업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약. 근거: `backend/src/main/java/com/cell/platform/exception/AuthorizationException.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-095|constructor|public AuthorizationException(String message, ErrorCode errorCode)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/exception/AuthorizationException.java:5|

#### C-096 — BadRequestException

- 역할: 업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약. 근거: `backend/src/main/java/com/cell/platform/exception/BadRequestException.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-096|constructor|public BadRequestException(String message, ErrorCode errorCode)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/exception/BadRequestException.java:7|

#### C-097 — BusinessException

- 역할: 업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약. 근거: `backend/src/main/java/com/cell/platform/exception/BusinessException.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-097|field|private final int statusCode|선언된 상태/설정/응답 값|int|private|; backend/src/main/java/com/cell/platform/exception/BusinessException.java:5|
|C-097|field|private final ErrorCode errorCode|선언된 상태/설정/응답 값|ErrorCode|private|; backend/src/main/java/com/cell/platform/exception/BusinessException.java:6|
|C-097|constructor|public BusinessException(String message, int statusCode, ErrorCode errorCode)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/exception/BusinessException.java:8|
|C-097|method|public int getStatusCode()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|int|public|; backend/src/main/java/com/cell/platform/exception/BusinessException.java:14|
|C-097|method|public ErrorCode getErrorCode()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|ErrorCode|public|; backend/src/main/java/com/cell/platform/exception/BusinessException.java:18|

#### C-098 — CustomException

- 역할: 업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약. 근거: `backend/src/main/java/com/cell/platform/exception/CustomException.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-098|field|private final ErrorCode errorCode|선언된 상태/설정/응답 값|ErrorCode|private|; backend/src/main/java/com/cell/platform/exception/CustomException.java:5|
|C-098|constructor|public CustomException(String message, ErrorCode errorCode)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/exception/CustomException.java:7|
|C-098|method|public ErrorCode getErrorCode()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|ErrorCode|public|; backend/src/main/java/com/cell/platform/exception/CustomException.java:12|

#### C-099 — DuplicateUsernameException

- 역할: 업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약. 근거: `backend/src/main/java/com/cell/platform/exception/DuplicateUsernameException.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-099|constructor|public DuplicateUsernameException(String username)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/exception/DuplicateUsernameException.java:5|

#### C-100 — EntityNotFoundException

- 역할: 업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약. 근거: `backend/src/main/java/com/cell/platform/exception/EntityNotFoundException.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-100|constructor|public EntityNotFoundException(String entity, Long id)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/exception/EntityNotFoundException.java:5|

#### C-101 — ErrorCode

- 역할: 업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약. 근거: `backend/src/main/java/com/cell/platform/exception/ErrorCode.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-101|enum constants|U000, U001, U002, U003, U004, T000, T001, T002, C000, C001, S000, S001, AU00, AU01, G000, G001, G002, SERVER_ERROR|허용 상수 집합|ErrorCode|public static final|; backend/src/main/java/com/cell/platform/exception/ErrorCode.java:3|
|C-101|method|// User 관련 U000("회원가입 시, 이미 존재하는 아이디로 가입을 시도한 경우"), U001("로그인 시, 아이디 또는 비밀번호가 일치하지 않는 경우"), U002("회원가입 시, 유효하지 않은 역할(Role)을 입력한 경우"), U003("회원가입 시, 이름이 빈칸 또는 공백인 경우"), U004("회원가입 시, 비밀번호가 빈칸 또는 공백인 경우"), // Task 관련 T000("과제(Task) 조회 시, 과제를 찾을 수 없는 경우"), T001("과제 생성 시, 파일 저장에 실패한 경우"), T002("과제 생성 시, AI 분석에 실패한 경우"), // Crop 관련 C000("크롭(Crop) 조회 시, 크롭을 찾을 수 없는 경우"), C001("정답 확정 시, 유효하지 않은 셀 타입을 입력한 경우"), // Submission 관련 S000("답안 제출 시, 해당 크롭을 찾을 수 없는 경우"), S001("답안 제출 시, 유효하지 않은 셀 타입을 입력한 경우"), // 인증/인가 관련 AU00("인증되지 않은 사용자가 보호된 리소스에 접근한 경우"), AU01("권한이 없는 사용자가 접근한 경우"), // Global G000("필수 필드의 값이 NULL 또는 빈 값인 경우"), G001("파일 처리 실패"), G002("디렉토리 생성 실패"), // 서버 예외 SERVER_ERROR("서버에서 예기치 못한 예외가 발생한 경우")|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|// User 관련|package-private|; backend/src/main/java/com/cell/platform/exception/ErrorCode.java:5|
|C-101|field|private final String description|선언된 상태/설정/응답 값|String|private|; backend/src/main/java/com/cell/platform/exception/ErrorCode.java:37|
|C-101|constructor|ErrorCode(String description)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|package-private|; backend/src/main/java/com/cell/platform/exception/ErrorCode.java:39|
|C-101|method|public String getDescription()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|String|public|; backend/src/main/java/com/cell/platform/exception/ErrorCode.java:43|

#### C-102 — ErrorResponse

- 역할: 업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약. 근거: `backend/src/main/java/com/cell/platform/exception/ErrorResponse.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-102|record component|String message|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String message; backend/src/main/java/com/cell/platform/exception/ErrorResponse.java:3|
|C-102|record component|String errorCode|선언된 상태/설정/응답 값|String|private final / accessor public (record 규칙)|String errorCode; backend/src/main/java/com/cell/platform/exception/ErrorResponse.java:3|
|C-102|method|public static ErrorResponse of(String message, String errorCode)|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|ErrorResponse|public|; backend/src/main/java/com/cell/platform/exception/ErrorResponse.java:7|

#### C-103 — GlobalExceptionHandler

- 역할: 업무/인증/검증/파일/일반 예외 HTTP 응답 변환. 근거: `backend/src/main/java/com/cell/platform/exception/GlobalExceptionHandler.java:13`.
- 선언 annotation: `@Slf4j`, `@RestControllerAdvice`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-103|method|public ResponseEntity&lt;ErrorResponse&gt; handleAuthentication(AuthenticationException e)|업무/보조 처리; 명시 호출 ErrorResponse.of, ResponseEntity.status, e.getErrorCode, e.getMessage, log.warn|ResponseEntity&lt;ErrorResponse&gt;|public|@ExceptionHandler(AuthenticationException.class); backend/src/main/java/com/cell/platform/exception/GlobalExceptionHandler.java:15|
|C-103|method|public ResponseEntity&lt;ErrorResponse&gt; handleAuthorization(AuthorizationException e)|업무/보조 처리; 명시 호출 ErrorResponse.of, ResponseEntity.status, e.getErrorCode, e.getMessage, log.warn|ResponseEntity&lt;ErrorResponse&gt;|public|@ExceptionHandler(AuthorizationException.class); backend/src/main/java/com/cell/platform/exception/GlobalExceptionHandler.java:22|
|C-103|method|public ResponseEntity&lt;ErrorResponse&gt; handleBusiness(BusinessException e)|업무/보조 처리; 명시 호출 ErrorResponse.of, ResponseEntity.status, e.getErrorCode, e.getMessage, e.getStatusCode|ResponseEntity&lt;ErrorResponse&gt;|public|@ExceptionHandler(BusinessException.class); backend/src/main/java/com/cell/platform/exception/GlobalExceptionHandler.java:29|
|C-103|method|public ResponseEntity&lt;ErrorResponse&gt; handleInfraStructure(InfraStructureException e)|업무/보조 처리; 명시 호출 ErrorResponse.of, ResponseEntity.internalServerError, e.getErrorCode, e.getMessage, log.warn|ResponseEntity&lt;ErrorResponse&gt;|public|@ExceptionHandler(InfraStructureException.class); backend/src/main/java/com/cell/platform/exception/GlobalExceptionHandler.java:36|
|C-103|method|public ResponseEntity&lt;ErrorResponse&gt; handleValidation(MethodArgumentNotValidException e)|업무/보조 처리; 명시 호출 ErrorResponse.of, G000.name, ResponseEntity.badRequest, e.getBindingResult, error.getDefaultMessage|ResponseEntity&lt;ErrorResponse&gt;|public|@ExceptionHandler(MethodArgumentNotValidException.class); backend/src/main/java/com/cell/platform/exception/GlobalExceptionHandler.java:43|
|C-103|method|public ResponseEntity&lt;ErrorResponse&gt; handleNoResource(NoResourceFoundException e)|업무/보조 처리; 명시 호출 ErrorResponse.of, G000.name, ResponseEntity.status|ResponseEntity&lt;ErrorResponse&gt;|public|@ExceptionHandler(NoResourceFoundException.class); backend/src/main/java/com/cell/platform/exception/GlobalExceptionHandler.java:54|
|C-103|method|public ResponseEntity&lt;ErrorResponse&gt; handleInternalServerError(Exception e)|업무/보조 처리; 명시 호출 ErrorResponse.of, ResponseEntity.internalServerError, SERVER_ERROR.name, e.getMessage, log.error|ResponseEntity&lt;ErrorResponse&gt;|public|@ExceptionHandler(Exception.class); backend/src/main/java/com/cell/platform/exception/GlobalExceptionHandler.java:60|

#### C-104 — InfraStructureException

- 역할: 업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약. 근거: `backend/src/main/java/com/cell/platform/exception/InfraStructureException.java:3`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-104|constructor|public InfraStructureException(String message, ErrorCode errorCode)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/exception/InfraStructureException.java:5|

#### C-105 — NotFoundException

- 역할: 업무 오류/HTTP 상태/코드 전달 또는 오류 응답 계약. 근거: `backend/src/main/java/com/cell/platform/exception/NotFoundException.java:5`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-105|constructor|public NotFoundException(String message, ErrorCode errorCode)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|; backend/src/main/java/com/cell/platform/exception/NotFoundException.java:7|

#### C-106 — AssignmentJpaRepository

- 역할: Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함). 근거: `backend/src/main/java/com/cell/platform/infra/assignment/AssignmentJpaRepository.java:7`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-106|method|List&lt;AssignmentEntity&gt; findAllByOrderByIdDesc()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;AssignmentEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/assignment/AssignmentJpaRepository.java:8|

#### C-107 — CropCoreRepository

- 역할: domain repository의 JPA adapter·Mapper 호출. 근거: `backend/src/main/java/com/cell/platform/infra/crop/CropCoreRepository.java:16`.
- 선언 annotation: `@Repository`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-107|field|private final CropJpaRepository cropJpaRepository|주입/참조 저장소|CropJpaRepository|private|; backend/src/main/java/com/cell/platform/infra/crop/CropCoreRepository.java:18|
|C-107|field|private final TaskJpaRepository taskJpaRepository|주입/참조 저장소|TaskJpaRepository|private|; backend/src/main/java/com/cell/platform/infra/crop/CropCoreRepository.java:19|
|C-107|method|public Crop save(Crop crop)|생성·저장·구성; 명시 호출 Mapper.convertToCrop, Mapper.convertToCropEntity, crop.getTaskId, cropJpaRepository.save, entity.assignTask|Crop|public|@Override; backend/src/main/java/com/cell/platform/infra/crop/CropCoreRepository.java:21|
|C-107|method|public Optional&lt;Crop&gt; findById(Long id)|조회·변환·판정; 명시 호출 cropJpaRepository.findById|Optional&lt;Crop&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/crop/CropCoreRepository.java:35|
|C-107|method|public List&lt;Crop&gt; findAllByTaskId(Long taskId)|조회·변환·판정; 명시 호출 cropJpaRepository.findAllByTask_Id|List&lt;Crop&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/crop/CropCoreRepository.java:40|
|C-107|method|public List&lt;Crop&gt; findAllByFinalLabelIsNotNull()|조회·변환·판정; 명시 호출 cropJpaRepository.findAllByFinalLabelIsNotNull|List&lt;Crop&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/crop/CropCoreRepository.java:47|
|C-107|method|public List&lt;Long&gt; findDistinctTaskIdsByFinalLabelIsNotNull()|조회·변환·판정; 명시 호출 cropJpaRepository.findDistinctTaskIdsByFinalLabelIsNotNull|List&lt;Long&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/crop/CropCoreRepository.java:54|
|C-107|method|public List&lt;Crop&gt; findAll()|조회·변환·판정; 명시 호출 cropJpaRepository.findAll|List&lt;Crop&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/crop/CropCoreRepository.java:59|
|C-107|method|public List&lt;Crop&gt; findAllByTaskIdIn(List&lt;Long&gt; taskIds)|조회·변환·판정; 명시 호출 List.of, cropJpaRepository.findAllByTask_IdIn, taskIds.isEmpty|List&lt;Crop&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/crop/CropCoreRepository.java:66|
|C-107|method|public CropEntity findEntityById(Long id)|조회·변환·판정; 명시 호출 cropJpaRepository.findById|CropEntity|public|; backend/src/main/java/com/cell/platform/infra/crop/CropCoreRepository.java:74|

#### C-108 — CropJpaRepository

- 역할: Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함). 근거: `backend/src/main/java/com/cell/platform/infra/crop/CropJpaRepository.java:8`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-108|method|List&lt;CropEntity&gt; findAllByTask_Id(Long taskId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;CropEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/crop/CropJpaRepository.java:10|
|C-108|method|List&lt;CropEntity&gt; findAllByFinalLabelIsNotNull()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;CropEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/crop/CropJpaRepository.java:12|
|C-108|method|List&lt;Long&gt; findDistinctTaskIdsByFinalLabelIsNotNull()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Long&gt;|public (interface)|@Query("select distinct c.task.id from CropEntity c where c.finalLabel is not null"); backend/src/main/java/com/cell/platform/infra/crop/CropJpaRepository.java:14|
|C-108|method|List&lt;Object[]&gt; countByTaskId()|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Object[]&gt;|public (interface)|@Query("select c.task.id, count(c) from CropEntity c group by c.task.id"); backend/src/main/java/com/cell/platform/infra/crop/CropJpaRepository.java:17|
|C-108|method|List&lt;Object[]&gt; countLabeledByTaskId()|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Object[]&gt;|public (interface)|@Query("select c.task.id, count(c) from CropEntity c where c.finalLabel is not null group by c.task.id"); backend/src/main/java/com/cell/platform/infra/crop/CropJpaRepository.java:20|
|C-108|method|List&lt;CropEntity&gt; findAllWithTaskOriginalFilename()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;CropEntity&gt;|public (interface)|@Query("select c from CropEntity c join fetch c.task t where t.originalFilename is not null"); backend/src/main/java/com/cell/platform/infra/crop/CropJpaRepository.java:23|
|C-108|method|List&lt;CropEntity&gt; findAllByTask_IdIn(List&lt;Long&gt; taskIds)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;CropEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/crop/CropJpaRepository.java:26|

#### C-109 — GameRecordJpaRepository

- 역할: Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함). 근거: `backend/src/main/java/com/cell/platform/infra/game/GameRecordJpaRepository.java:11`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-109|method|List&lt;GameRecordEntity&gt; findTopByMode( String mode, Pageable pageable)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;GameRecordEntity&gt;|public (interface)|@Query("SELECT g FROM GameRecordEntity g WHERE g.mode = :mode ORDER BY g.score DESC, g.playedAt ASC") @Param("mode") String mode, Pageable pageable); backend/src/main/java/com/cell/platform/infra/game/GameRecordJpaRepository.java:13|

#### C-110 — ConfusionMatrixCoreRepository

- 역할: domain repository의 JPA adapter·Mapper 호출. 근거: `backend/src/main/java/com/cell/platform/infra/matrix/ConfusionMatrixCoreRepository.java:13`.
- 선언 annotation: `@Repository`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-110|field|private final ConfusionMatrixJpaRepository jpaRepository|주입/참조 저장소|ConfusionMatrixJpaRepository|private|; backend/src/main/java/com/cell/platform/infra/matrix/ConfusionMatrixCoreRepository.java:15|
|C-110|method|public Optional&lt;StudentConfusionMatrixEntity&gt; findByStudentIdAndTaskId(String studentId, Long taskId)|조회·변환·판정; 명시 호출 jpaRepository.findByStudentIdAndTaskId|Optional&lt;StudentConfusionMatrixEntity&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/matrix/ConfusionMatrixCoreRepository.java:17|
|C-110|method|// [추가된 부분] Override 구현 public List&lt;StudentConfusionMatrixEntity&gt; findAllByTaskId(Long taskId)|조회·변환·판정; 명시 호출 jpaRepository.findAllByTaskId|// [추가된 부분] Override 구현 public List&lt;StudentConfusionMatrixEntity&gt;|package-private|@Override; backend/src/main/java/com/cell/platform/infra/matrix/ConfusionMatrixCoreRepository.java:23|
|C-110|method|public List&lt;StudentConfusionMatrixEntity&gt; findAllByTaskIdIn(List&lt;Long&gt; taskIds)|조회·변환·판정; 명시 호출 jpaRepository.findAllByTaskIdIn|List&lt;StudentConfusionMatrixEntity&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/matrix/ConfusionMatrixCoreRepository.java:29|
|C-110|method|public StudentConfusionMatrixEntity save(StudentConfusionMatrixEntity entity)|생성·저장·구성; 명시 호출 jpaRepository.save|StudentConfusionMatrixEntity|public|@Override; backend/src/main/java/com/cell/platform/infra/matrix/ConfusionMatrixCoreRepository.java:34|

#### C-111 — ConfusionMatrixJpaRepository

- 역할: Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함). 근거: `backend/src/main/java/com/cell/platform/infra/matrix/ConfusionMatrixJpaRepository.java:14`.
- 선언 annotation: `@Repository`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-111|method|Optional&lt;StudentConfusionMatrixEntity&gt; findByStudentIdAndTaskId(String studentId, Long taskId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Optional&lt;StudentConfusionMatrixEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/matrix/ConfusionMatrixJpaRepository.java:15|
|C-111|method|List&lt;StudentConfusionMatrixEntity&gt; findAllByTaskId(Long taskId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;StudentConfusionMatrixEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/matrix/ConfusionMatrixJpaRepository.java:16|
|C-111|method|List&lt;StudentConfusionMatrixEntity&gt; findAllByTaskIdIn(List&lt;Long&gt; taskIds)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;StudentConfusionMatrixEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/matrix/ConfusionMatrixJpaRepository.java:17|
|C-111|method|void deleteAllByTaskId( Long taskId)|삭제·차감·초기화; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public (interface)|@Modifying @Query("DELETE FROM StudentConfusionMatrixEntity m WHERE m.taskId = :taskId") @Param("taskId") Long taskId); backend/src/main/java/com/cell/platform/infra/matrix/ConfusionMatrixJpaRepository.java:19|

#### C-112 — CropIssueReportJpaRepository

- 역할: Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함). 근거: `backend/src/main/java/com/cell/platform/infra/report/CropIssueReportJpaRepository.java:9`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-112|method|void deleteAllByTaskId( Long taskId)|삭제·차감·초기화; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public (interface)|@Modifying @Query("DELETE FROM CropIssueReportEntity r WHERE r.taskId = :taskId") @Param("taskId") Long taskId); backend/src/main/java/com/cell/platform/infra/report/CropIssueReportJpaRepository.java:11|

#### C-113 — AnimalSpeciesJpaRepository

- 역할: Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함). 근거: `backend/src/main/java/com/cell/platform/infra/species/AnimalSpeciesJpaRepository.java:9`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-113|method|Optional&lt;AnimalSpeciesEntity&gt; findByCode(String code)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Optional&lt;AnimalSpeciesEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/species/AnimalSpeciesJpaRepository.java:11|
|C-113|method|Optional&lt;AnimalSpeciesEntity&gt; findByNameIgnoreCase(String name)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Optional&lt;AnimalSpeciesEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/species/AnimalSpeciesJpaRepository.java:13|
|C-113|method|List&lt;AnimalSpeciesEntity&gt; findAllByOrderByBuiltInDescNameAsc()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;AnimalSpeciesEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/species/AnimalSpeciesJpaRepository.java:15|

#### C-114 — SubmissionCoreRepository

- 역할: domain repository의 JPA adapter·Mapper 호출. 근거: `backend/src/main/java/com/cell/platform/infra/submission/SubmissionCoreRepository.java:17`.
- 선언 annotation: `@Repository`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-114|field|private final SubmissionJpaRepository submissionJpaRepository|주입/참조 저장소|SubmissionJpaRepository|private|; backend/src/main/java/com/cell/platform/infra/submission/SubmissionCoreRepository.java:19|
|C-114|field|private final CropJpaRepository cropJpaRepository|주입/참조 저장소|CropJpaRepository|private|; backend/src/main/java/com/cell/platform/infra/submission/SubmissionCoreRepository.java:20|
|C-114|method|public Submission save(Submission submission)|생성·저장·구성; 명시 호출 Mapper.convertToSubmission, Mapper.convertToSubmissionEntity, cropJpaRepository.findById, submission.getCropId, submissionJpaRepository.save|Submission|public|@Override; backend/src/main/java/com/cell/platform/infra/submission/SubmissionCoreRepository.java:22|
|C-114|method|public Optional&lt;Submission&gt; findByCropIdAndStudentId(Long cropId, String studentId)|조회·변환·판정; 명시 호출 submissionJpaRepository.findByCrop_IdAndStudentId|Optional&lt;Submission&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/submission/SubmissionCoreRepository.java:31|
|C-114|method|public void updateLabel(Long cropId, String studentId, CellType newLabel)|상태·라벨·통계 변경; 명시 호출 entity.updateLabel, submissionJpaRepository.findByCrop_IdAndStudentId|void|public|@Override; backend/src/main/java/com/cell/platform/infra/submission/SubmissionCoreRepository.java:37|
|C-114|method|public List&lt;Submission&gt; findAllByCropId(Long cropId)|조회·변환·판정; 명시 호출 submissionJpaRepository.findAllByCrop_Id|List&lt;Submission&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/submission/SubmissionCoreRepository.java:43|
|C-114|method|public List&lt;Submission&gt; findAllByCropIdIn(List&lt;Long&gt; cropIds)|조회·변환·판정; 명시 호출 submissionJpaRepository.findAllByCrop_IdIn|List&lt;Submission&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/submission/SubmissionCoreRepository.java:50|
|C-114|method|public List&lt;Submission&gt; findAllByCropIdInAndStudentId(List&lt;Long&gt; cropIds, String studentId)|조회·변환·판정; 명시 호출 submissionJpaRepository.findAllByCrop_IdInAndStudentId|List&lt;Submission&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/submission/SubmissionCoreRepository.java:57|

#### C-115 — SubmissionJpaRepository

- 역할: Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함). 근거: `backend/src/main/java/com/cell/platform/infra/submission/SubmissionJpaRepository.java:11`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-115|method|Optional&lt;SubmissionEntity&gt; findByCrop_IdAndStudentId(Long cropId, String studentId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Optional&lt;SubmissionEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/submission/SubmissionJpaRepository.java:13|
|C-115|method|List&lt;SubmissionEntity&gt; findAllByCrop_Id(Long cropId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;SubmissionEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/submission/SubmissionJpaRepository.java:15|
|C-115|method|List&lt;SubmissionEntity&gt; findAllByCrop_IdIn(List&lt;Long&gt; cropIds)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;SubmissionEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/submission/SubmissionJpaRepository.java:17|
|C-115|method|List&lt;SubmissionEntity&gt; findAllByCrop_IdInAndStudentId(List&lt;Long&gt; cropIds, String studentId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;SubmissionEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/submission/SubmissionJpaRepository.java:19|
|C-115|method|void deleteAllByCropIdIn( List&lt;Long&gt; cropIds)|삭제·차감·초기화; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public (interface)|@Modifying @Query("DELETE FROM SubmissionEntity s WHERE s.crop.id IN :cropIds") @Param("cropIds") List&lt;Long&gt; cropIds); backend/src/main/java/com/cell/platform/infra/submission/SubmissionJpaRepository.java:21|

#### C-116 — TaskCoreRepository

- 역할: domain repository의 JPA adapter·Mapper 호출. 근거: `backend/src/main/java/com/cell/platform/infra/task/TaskCoreRepository.java:19`.
- 선언 annotation: `@Repository`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-116|field|private final TaskJpaRepository taskJpaRepository|주입/참조 저장소|TaskJpaRepository|private|; backend/src/main/java/com/cell/platform/infra/task/TaskCoreRepository.java:21|
|C-116|field|private final AnimalSpeciesJpaRepository animalSpeciesJpaRepository|주입/참조 저장소|AnimalSpeciesJpaRepository|private|; backend/src/main/java/com/cell/platform/infra/task/TaskCoreRepository.java:22|
|C-116|method|public Task save(Task task)|생성·저장·구성; 명시 호출 Mapper.convertToCropEntity, Mapper.convertToTask, Mapper.convertToTaskEntity, animalSpeciesJpaRepository.findByCode, animalSpeciesJpaRepository.findById|Task|public|@Override; backend/src/main/java/com/cell/platform/infra/task/TaskCoreRepository.java:24|
|C-116|method|public Optional&lt;Task&gt; findById(Long id)|조회·변환·판정; 명시 호출 taskJpaRepository.findById|Optional&lt;Task&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/task/TaskCoreRepository.java:39|
|C-116|method|public List&lt;Task&gt; findAllByOrderByIdDesc()|조회·변환·판정; 명시 호출 taskJpaRepository.findAllByOrderByIdDesc|List&lt;Task&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/task/TaskCoreRepository.java:44|
|C-116|method|public List&lt;Long&gt; findIdsByUploadedFilenameStartingWith(String prefix)|조회·변환·판정; 명시 호출 taskJpaRepository.findIdsByUploadedFilenameStartingWith|List&lt;Long&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/task/TaskCoreRepository.java:51|
|C-116|method|public List&lt;Task&gt; findByAssignmentId(Long assignmentId)|조회·변환·판정; 명시 호출 taskJpaRepository.findAllByAssignmentId|List&lt;Task&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/task/TaskCoreRepository.java:56|
|C-116|method|public void updateDeadlineAt(Long taskId, LocalDateTime deadlineAt)|상태·라벨·통계 변경; 명시 호출 taskJpaRepository.findById|void|public|@Override; backend/src/main/java/com/cell/platform/infra/task/TaskCoreRepository.java:63|
|C-116|method|public void updateDeadlineAtByAssignmentId(Long assignmentId, LocalDateTime deadlineAt)|상태·라벨·통계 변경; 명시 호출 task.updateDeadlineAt, taskJpaRepository.findAllByAssignmentId|void|public|@Override; backend/src/main/java/com/cell/platform/infra/task/TaskCoreRepository.java:70|
|C-116|method|public List&lt;Long&gt; findIdsByAssignmentId(Long assignmentId)|조회·변환·판정; 명시 호출 taskJpaRepository.findIdsByAssignmentId|List&lt;Long&gt;|public|; backend/src/main/java/com/cell/platform/infra/task/TaskCoreRepository.java:76|
|C-116|method|public void deleteById(Long id)|삭제·차감·초기화; 명시 호출 taskJpaRepository.deleteById|void|public|@Override; backend/src/main/java/com/cell/platform/infra/task/TaskCoreRepository.java:80|

#### C-117 — TaskJpaRepository

- 역할: Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함). 근거: `backend/src/main/java/com/cell/platform/infra/task/TaskJpaRepository.java:9`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-117|method|List&lt;TaskEntity&gt; findAllByOrderByIdDesc()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;TaskEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/task/TaskJpaRepository.java:11|
|C-117|method|List&lt;TaskEntity&gt; findAllUploadedSmearsOrderByIdDesc()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;TaskEntity&gt;|public (interface)|@Query; backend/src/main/java/com/cell/platform/infra/task/TaskJpaRepository.java:13|
|C-117|method|List&lt;Long&gt; findIdsByUploadedFilenameStartingWith( String prefix)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Long&gt;|public (interface)|@Query("select t.id from TaskEntity t where t.uploadedFilename like concat(:prefix, '%')") @Param("prefix") String prefix); backend/src/main/java/com/cell/platform/infra/task/TaskJpaRepository.java:22|
|C-117|method|List&lt;TaskEntity&gt; findAllByAssignmentId(Long assignmentId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;TaskEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/task/TaskJpaRepository.java:25|
|C-117|method|List&lt;TaskEntity&gt; findAllByAnimalSpeciesIsNull()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;TaskEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/task/TaskJpaRepository.java:27|
|C-117|method|List&lt;Long&gt; findIdsByAssignmentId( Long assignmentId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;Long&gt;|public (interface)|@Query("select t.id from TaskEntity t where t.assignmentId = :assignmentId") @Param("assignmentId") Long assignmentId); backend/src/main/java/com/cell/platform/infra/task/TaskJpaRepository.java:29|

#### C-118 — StudentRosterJpaRepository

- 역할: Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함). 근거: `backend/src/main/java/com/cell/platform/infra/user/StudentRosterJpaRepository.java:9`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-118|method|Optional&lt;StudentRosterEntity&gt; findByStudentId(String studentId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Optional&lt;StudentRosterEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/user/StudentRosterJpaRepository.java:11|
|C-118|method|boolean existsByStudentId(String studentId)|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|boolean|public (interface)|; backend/src/main/java/com/cell/platform/infra/user/StudentRosterJpaRepository.java:13|
|C-118|method|List&lt;StudentRosterEntity&gt; findAllByOrderByCreatedAtDesc()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;StudentRosterEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/user/StudentRosterJpaRepository.java:15|

#### C-119 — UserCoreRepository

- 역할: domain repository의 JPA adapter·Mapper 호출. 근거: `backend/src/main/java/com/cell/platform/infra/user/UserCoreRepository.java:15`.
- 선언 annotation: `@Repository`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-119|field|private final UserJpaRepository userJpaRepository|주입/참조 저장소|UserJpaRepository|private|; backend/src/main/java/com/cell/platform/infra/user/UserCoreRepository.java:17|
|C-119|method|public User save(User user)|생성·저장·구성; 명시 호출 Mapper.convertToUser, Mapper.convertToUserEntity, userJpaRepository.save|User|public|@Override; backend/src/main/java/com/cell/platform/infra/user/UserCoreRepository.java:19|
|C-119|method|public Optional&lt;User&gt; findByUsername(String username)|조회·변환·판정; 명시 호출 userJpaRepository.findByUsername|Optional&lt;User&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/user/UserCoreRepository.java:26|
|C-119|method|public List&lt;User&gt; findAll()|조회·변환·판정; 명시 호출 userJpaRepository.findAll|List&lt;User&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/user/UserCoreRepository.java:31|
|C-119|method|public List&lt;User&gt; findAllByRole(Role role)|조회·변환·판정; 명시 호출 userJpaRepository.findAllByRole|List&lt;User&gt;|public|@Override; backend/src/main/java/com/cell/platform/infra/user/UserCoreRepository.java:38|
|C-119|method|public boolean existsByUsername(String username)|업무/보조 처리; 명시 호출 userJpaRepository.existsByUsername|boolean|public|@Override; backend/src/main/java/com/cell/platform/infra/user/UserCoreRepository.java:45|
|C-119|method|public void deleteByUsername(String username)|삭제·차감·초기화; 명시 호출 entity.getId, userJpaRepository.deleteById, userJpaRepository.findByUsername|void|public|@Override; backend/src/main/java/com/cell/platform/infra/user/UserCoreRepository.java:50|

#### C-120 — UserJpaRepository

- 역할: Spring Data JPA 조회/갱신 포트(실행 쿼리는 프레임워크 생성 포함). 근거: `backend/src/main/java/com/cell/platform/infra/user/UserJpaRepository.java:9`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-120|method|Optional&lt;UserEntity&gt; findByUsername(String username)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Optional&lt;UserEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/user/UserJpaRepository.java:11|
|C-120|method|List&lt;UserEntity&gt; findAllByRole(Role role)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;UserEntity&gt;|public (interface)|; backend/src/main/java/com/cell/platform/infra/user/UserJpaRepository.java:13|
|C-120|method|boolean existsByUsername(String username)|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|boolean|public (interface)|; backend/src/main/java/com/cell/platform/infra/user/UserJpaRepository.java:15|

#### C-121 — AdminService

- 역할: 사용자·학생 명단·전체 도말/crop 관리. 근거: `backend/src/main/java/com/cell/platform/service/AdminService.java:37`.
- 선언 annotation: `@Service`, `@RequiredArgsConstructor`, `@Transactional(readOnly = true)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-121|field|private final TaskJpaRepository taskJpaRepository|주입/참조 저장소|TaskJpaRepository|private|; backend/src/main/java/com/cell/platform/service/AdminService.java:39|
|C-121|field|private final CropJpaRepository cropJpaRepository|주입/참조 저장소|CropJpaRepository|private|; backend/src/main/java/com/cell/platform/service/AdminService.java:40|
|C-121|field|private final UserRepository userRepository|주입/참조 저장소|UserRepository|private|; backend/src/main/java/com/cell/platform/service/AdminService.java:41|
|C-121|field|private final UserJpaRepository userJpaRepository|주입/참조 저장소|UserJpaRepository|private|; backend/src/main/java/com/cell/platform/service/AdminService.java:42|
|C-121|field|private final StudentRosterJpaRepository studentRosterJpaRepository|주입/참조 저장소|StudentRosterJpaRepository|private|; backend/src/main/java/com/cell/platform/service/AdminService.java:43|
|C-121|field|private final PasswordEncoder passwordEncoder|선언된 상태/설정/응답 값|PasswordEncoder|private|; backend/src/main/java/com/cell/platform/service/AdminService.java:44|
|C-121|method|public List&lt;AdminSmearResponse&gt; getSmears()|조회·변환·판정; 명시 호출 cropJpaRepository.countByTaskId, cropJpaRepository.countLabeledByTaskId, labeledCounts.getOrDefault, task.getAnimalSpecies, task.getCreatedAt|List&lt;AdminSmearResponse&gt;|public|; backend/src/main/java/com/cell/platform/service/AdminService.java:46|
|C-121|method|public List&lt;AdminCropResponse&gt; getCrops()|조회·변환·판정; 명시 호출 crop.getCropFilename, crop.getFinalLabel, crop.getGtLabel, crop.getId, crop.getPseudoLabel|List&lt;AdminCropResponse&gt;|public|; backend/src/main/java/com/cell/platform/service/AdminService.java:72|
|C-121|method|public List&lt;UserResponse&gt; getUsers()|조회·변환·판정; 명시 호출 u.getCreatedAt, u.getId, u.getName, u.getRole, u.getStatus|List&lt;UserResponse&gt;|public|; backend/src/main/java/com/cell/platform/service/AdminService.java:98|
|C-121|method|public List&lt;StudentRosterResponse&gt; getStudentRoster()|조회·변환·판정; 명시 호출 studentRosterJpaRepository.findAllByOrderByCreatedAtDesc|List&lt;StudentRosterResponse&gt;|public|; backend/src/main/java/com/cell/platform/service/AdminService.java:105|
|C-121|method|public RosterImportResponse addStudentRoster(StudentRosterRequest request, String adminUsername)|생성·저장·구성; 명시 호출 List.of, raw.trim, request.studentIds, studentId.isEmpty, studentRosterJpaRepository.existsByStudentId|RosterImportResponse|public|@Transactional; backend/src/main/java/com/cell/platform/service/AdminService.java:111|
|C-121|method|public UserResponse updateUserStatus(Long userId, AdminStatusRequest request)|상태·라벨·통계 변경; 명시 호출 request.status, user.changeStatus, user.getCreatedAt, user.getId, user.getName|UserResponse|public|@Transactional; backend/src/main/java/com/cell/platform/service/AdminService.java:128|
|C-121|method|private UserStatus parseStatus(String value)|검증·정규화·조건 판단; 명시 호출 UserStatus.valueOf, value.toUpperCase|UserStatus|private|; backend/src/main/java/com/cell/platform/service/AdminService.java:140|
|C-121|method|public void createUser(RegisterRequest request)|생성·저장·구성; 명시 호출 Role.find, User.create, passwordEncoder.encode, request.name, request.password|void|public|@Transactional; backend/src/main/java/com/cell/platform/service/AdminService.java:148|
|C-121|method|public void deleteUser(String username)|삭제·차감·초기화; 명시 호출 user.getRole, userRepository.deleteByUsername, userRepository.findByUsername|void|public|@Transactional; backend/src/main/java/com/cell/platform/service/AdminService.java:161|
|C-121|method|private Map&lt;Long, Long&gt; toCountMap(List&lt;Object[]&gt; rows)|조회·변환·판정; 명시 호출 map.put|Map&lt;Long, Long&gt;|private|; backend/src/main/java/com/cell/platform/service/AdminService.java:171|

#### C-122 — AiClientService

- 역할: multipart를 FastAPI에 동기로 보내고 응답 DTO 변환. 근거: `backend/src/main/java/com/cell/platform/service/AiClientService.java:20`.
- 선언 annotation: `@Slf4j`, `@Service`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-122|field|private final WebClient webClient|선언된 상태/설정/응답 값|WebClient|private|; backend/src/main/java/com/cell/platform/service/AiClientService.java:22|
|C-122|constructor|public AiClientService( String baseUrl)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|@Value("${ai-server.base-url}") String baseUrl); backend/src/main/java/com/cell/platform/service/AiClientService.java:24|
|C-122|method|public AiAnalysisResponse analyze(MultipartFile file)|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|AiAnalysisResponse|public|; backend/src/main/java/com/cell/platform/service/AiClientService.java:28|
|C-122|method|private MultipartBodyBuilder buildMultipartBody(MultipartFile file)|생성·저장·구성; 명시 호출 builder.part, file.getBytes, file.getOriginalFilename|MultipartBodyBuilder|private|; backend/src/main/java/com/cell/platform/service/AiClientService.java:33|
|C-122|method|private AiAnalysisResponse requestAnalysis(MultipartBodyBuilder body)|업무/보조 처리; 명시 호출 BodyInserters.fromMultipartData, body.build, e.getMessage, webClient.post|AiAnalysisResponse|private|; backend/src/main/java/com/cell/platform/service/AiClientService.java:45|

#### C-123 — AnimalSpeciesService

- 역할: 기본/사용자 종·이름 검증·Task 종 연결. 근거: `backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24`.
- 선언 annotation: `@Service`, `@RequiredArgsConstructor`, `@Transactional(readOnly = true)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-123|field|public static final String DOG_CODE|선언된 상태/설정/응답 값|String|public|; backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:26|
|C-123|field|public static final String CAT_CODE|선언된 상태/설정/응답 값|String|public|; backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:27|
|C-123|field|private final AnimalSpeciesJpaRepository speciesRepository|주입/참조 저장소|AnimalSpeciesJpaRepository|private|; backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:29|
|C-123|field|private final TaskJpaRepository taskRepository|주입/참조 저장소|TaskJpaRepository|private|; backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:30|
|C-123|method|public List&lt;AnimalSpeciesResponse&gt; getAll()|조회·변환·판정; 명시 호출 speciesRepository.findAllByOrderByBuiltInDescNameAsc|List&lt;AnimalSpeciesResponse&gt;|public|; backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:32|
|C-123|method|public AnimalSpeciesEntity getRequired(Long speciesId)|조회·변환·판정; 명시 호출 speciesRepository.findById|AnimalSpeciesEntity|public|; backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:38|
|C-123|method|public AnimalSpeciesEntity getDog()|조회·변환·판정; 명시 호출 speciesRepository.findByCode|AnimalSpeciesEntity|public|; backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:44|
|C-123|method|public AnimalSpeciesResponse create(String rawName)|생성·저장·구성; 명시 호출 AnimalSpeciesEntity.builder, AnimalSpeciesResponse.from, UUID.randomUUID, speciesRepository.save|AnimalSpeciesResponse|public|@Transactional; backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:49|
|C-123|method|public AnimalSpeciesResponse rename(Long speciesId, String rawName)|상태·라벨·통계 변경; 명시 호출 AnimalSpeciesResponse.from, species.rename|AnimalSpeciesResponse|public|@Transactional; backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:62|
|C-123|method|public AnimalSpeciesResponse updateTaskSpecies(Long taskId, Long speciesId)|상태·라벨·통계 변경; 명시 호출 AnimalSpeciesResponse.from, task.updateAnimalSpecies, taskRepository.findById|AnimalSpeciesResponse|public|@Transactional; backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:71|
|C-123|method|public void initializeDefaultsAndBackfill()|업무/보조 처리; 명시 호출 AnimalSpeciesEntity.builder, speciesRepository.findByCode, speciesRepository.save, task.updateAnimalSpecies, taskRepository.findAllByAnimalSpeciesIsNull|void|public|@EventListener(ApplicationReadyEvent.class) @Transactional; backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:81|
|C-123|method|private String normalizeName(String rawName)|검증·정규화·조건 판단; 명시 호출 normalized.isEmpty, normalized.length, rawName.trim|String|private|; backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:101|
|C-123|method|private void ensureUniqueName(String name, Long currentId)|검증·정규화·조건 판단; 명시 호출 existing.getId, speciesRepository.findByNameIgnoreCase|void|private|; backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:115|

#### C-124 — AuthService

- 역할: 공개 학생 가입·명단 기반 상태·로그인 자격·JWT 발급 조율. 근거: `backend/src/main/java/com/cell/platform/service/AuthService.java:26`.
- 선언 annotation: `@Service`, `@RequiredArgsConstructor`, `@Transactional(readOnly = true)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-124|field|private final UserRepository userRepository|주입/참조 저장소|UserRepository|private|; backend/src/main/java/com/cell/platform/service/AuthService.java:28|
|C-124|field|private final StudentRosterJpaRepository studentRosterJpaRepository|주입/참조 저장소|StudentRosterJpaRepository|private|; backend/src/main/java/com/cell/platform/service/AuthService.java:29|
|C-124|field|private final PasswordEncoder passwordEncoder|선언된 상태/설정/응답 값|PasswordEncoder|private|; backend/src/main/java/com/cell/platform/service/AuthService.java:30|
|C-124|field|private final JwtTokenProvider jwtTokenProvider|선언된 상태/설정/응답 값|JwtTokenProvider|private|; backend/src/main/java/com/cell/platform/service/AuthService.java:31|
|C-124|method|public RegisterResponse register(RegisterRequest request)|업무/보조 처리; 명시 호출 RegisterResponse.active, RegisterResponse.pending, Role.find, User.create, passwordEncoder.encode|RegisterResponse|public|@Transactional; backend/src/main/java/com/cell/platform/service/AuthService.java:33|
|C-124|method|public LoginResponse login(LoginRequest request)|업무/보조 처리; 명시 호출 LoginResponse.of, jwtTokenProvider.generateToken, request.password, request.username, user.getName|LoginResponse|public|; backend/src/main/java/com/cell/platform/service/AuthService.java:53|
|C-124|method|private UserStatus resolveSignupStatus(Role role, String username)|조회·변환·판정; 명시 호출 roster.isPresent, studentRosterJpaRepository.findByStudentId|UserStatus|private|; backend/src/main/java/com/cell/platform/service/AuthService.java:61|
|C-124|method|private void validateLoginStatus(User user)|검증·정규화·조건 판단; 명시 호출 user.getStatus|void|private|; backend/src/main/java/com/cell/platform/service/AuthService.java:69|
|C-124|method|private void validateUniqueUsername(String username)|검증·정규화·조건 판단; 명시 호출 userRepository.existsByUsername|void|private|; backend/src/main/java/com/cell/platform/service/AuthService.java:82|
|C-124|method|private void validateStudentName(Role role, String name)|검증·정규화·조건 판단; 명시 호출 name.isBlank|void|private|; backend/src/main/java/com/cell/platform/service/AuthService.java:88|
|C-124|method|private void validateRegisterRole(Role role)|검증·정규화·조건 판단; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|private|; backend/src/main/java/com/cell/platform/service/AuthService.java:94|
|C-124|method|private String normalizeName(String name)|검증·정규화·조건 판단; 명시 호출 name.isBlank, name.trim|String|private|; backend/src/main/java/com/cell/platform/service/AuthService.java:103|
|C-124|method|private User findUserByUsername(String username)|조회·변환·판정; 명시 호출 userRepository.findByUsername|User|private|; backend/src/main/java/com/cell/platform/service/AuthService.java:107|
|C-124|method|private void validatePassword(String rawPassword, String hashedPassword)|검증·정규화·조건 판단; 명시 호출 passwordEncoder.matches|void|private|; backend/src/main/java/com/cell/platform/service/AuthService.java:113|

#### C-125 — CropIssueReportService

- 역할: 신고 요청값 저장·목록 파일/종 조합(대상/소유자 검증 없음). 근거: `backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18`.
- 선언 annotation: `@Service`, `@RequiredArgsConstructor`, `@Transactional(readOnly = true)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-125|field|private final CropIssueReportJpaRepository reportRepository|주입/참조 저장소|CropIssueReportJpaRepository|private|; backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:20|
|C-125|field|private final CropRepository cropRepository|주입/참조 저장소|CropRepository|private|; backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:21|
|C-125|method|public void createReport(CropIssueReportRequest request)|생성·저장·구성; 명시 호출 entity.setCropId, entity.setReason, entity.setStudentId, entity.setTaskId, reportRepository.save|void|public|@Transactional; backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:23|
|C-125|method|public List&lt;CropIssueReportResponse&gt; getReports()|조회·변환·판정; 명시 호출 CropIssueReportResponse.from, crop.getCropFilename, crop.getSpeciesCode, crop.getSpeciesName, cropRepository.findById|List&lt;CropIssueReportResponse&gt;|public|; backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:33|

#### C-126 — CropService

- 역할: 학생용 정답 숨김·crop 조회·final 정답 수정·학습 목록 추출. 근거: `backend/src/main/java/com/cell/platform/service/CropService.java:23`.
- 선언 annotation: `@Service`, `@Transactional(readOnly = true)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-126|field|private final CropRepository cropRepository|주입/참조 저장소|CropRepository|private|; backend/src/main/java/com/cell/platform/service/CropService.java:25|
|C-126|field|private final CropCoreRepository cropCoreRepository|주입/참조 저장소|CropCoreRepository|private|; backend/src/main/java/com/cell/platform/service/CropService.java:26|
|C-126|field|private final TaskRepository taskRepository|주입/참조 저장소|TaskRepository|private|; backend/src/main/java/com/cell/platform/service/CropService.java:27|
|C-126|field|private final SubmissionService submissionService|주입/참조 업무 서비스|SubmissionService|private|; backend/src/main/java/com/cell/platform/service/CropService.java:28|
|C-126|constructor|public CropService(CropRepository cropRepository, CropCoreRepository cropCoreRepository, TaskRepository taskRepository, SubmissionService submissionService)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|@Lazy; backend/src/main/java/com/cell/platform/service/CropService.java:30|
|C-126|method|public List&lt;CropResponse&gt; getCropsByTaskId(Long taskId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;CropResponse&gt;|public|; backend/src/main/java/com/cell/platform/service/CropService.java:40|
|C-126|method|public List&lt;CropResponse&gt; getCropsByTaskId(Long taskId, boolean studentView)|조회·변환·판정; 명시 호출 CropResponse.forStudent, CropResponse.from, cropRepository.findAllByTaskId|List&lt;CropResponse&gt;|public|; backend/src/main/java/com/cell/platform/service/CropService.java:44|
|C-126|method|public List&lt;CropResponse&gt; getCropsByAssignmentId(Long assignmentId)|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|List&lt;CropResponse&gt;|public|; backend/src/main/java/com/cell/platform/service/CropService.java:50|
|C-126|method|public List&lt;CropResponse&gt; getCropsByAssignmentId(Long assignmentId, boolean studentView)|조회·변환·판정; 명시 호출 CropResponse.forStudent, CropResponse.from, cropRepository.findAllByTaskIdIn, t.getId, taskRepository.findByAssignmentId|List&lt;CropResponse&gt;|public|; backend/src/main/java/com/cell/platform/service/CropService.java:54|
|C-126|method|public List&lt;TrainingDataResponse&gt; getConfirmedTrainingData()|조회·변환·판정; 명시 호출 cropRepository.findAllByFinalLabelIsNotNull|List&lt;TrainingDataResponse&gt;|public|; backend/src/main/java/com/cell/platform/service/CropService.java:62|
|C-126|method|public void confirmLabel(Long cropId, String finalLabel)|상태·라벨·통계 변경; 명시 호출 cropCoreRepository.findEntityById, entity.getFinalLabel, entity.getTaskId, entity.updateFinalLabel, submissionService.backfillConfusionMatrixForCrop|void|public|@Transactional; backend/src/main/java/com/cell/platform/service/CropService.java:68|
|C-126|method|public Crop findCropById(Long id)|조회·변환·판정; 명시 호출 cropRepository.findById|Crop|public|; backend/src/main/java/com/cell/platform/service/CropService.java:82|
|C-126|method|private CellType parseCellType(String label)|검증·정규화·조건 판단; 명시 호출 CellType.valueOf|CellType|private|; backend/src/main/java/com/cell/platform/service/CropService.java:88|

#### C-127 — DiagnosticDatasetService

- 역할: 진단 manifest 읽기·클래스별 보유량·비복원 무작위 표본. 근거: `backend/src/main/java/com/cell/platform/service/DiagnosticDatasetService.java:20`.
- 선언 annotation: `@Service`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-127|field|private final ObjectMapper objectMapper|선언된 상태/설정/응답 값|ObjectMapper|private|; backend/src/main/java/com/cell/platform/service/DiagnosticDatasetService.java:22|
|C-127|field|private String processedDir|선언된 상태/설정/응답 값|String|private|@Value("${diagnostic.dataset.processed-dir:../data/diagnostic_gt/processed}"); backend/src/main/java/com/cell/platform/service/DiagnosticDatasetService.java:24|
|C-127|method|public Map&lt;CellType, Integer&gt; getAvailableCounts()|조회·변환·판정; 명시 호출 CellType.values, Collectors.counting, Collectors.groupingBy, cells.stream, grouped.getOrDefault|Map&lt;CellType, Integer&gt;|public|; backend/src/main/java/com/cell/platform/service/DiagnosticDatasetService.java:27|
|C-127|method|public List&lt;DiagnosticCell&gt; sampleCells(Map&lt;CellType, Integer&gt; distribution)|업무/보조 처리; 명시 호출 Collections.shuffle, Collectors.groupingBy, List.of, candidates.size, candidates.subList|List&lt;DiagnosticCell&gt;|public|; backend/src/main/java/com/cell/platform/service/DiagnosticDatasetService.java:39|
|C-127|method|public Optional&lt;CellType&gt; findLabelByCropFilename(String cropFilename)|조회·변환·판정; 명시 호출 Optional.empty, cell.cropFilename, cropFilename.equals, cropFilename.isBlank|Optional&lt;CellType&gt;|public|; backend/src/main/java/com/cell/platform/service/DiagnosticDatasetService.java:67|
|C-127|method|private List&lt;DiagnosticCell&gt; loadCells()|조회·변환·판정; 명시 호출 CellType.valueOf, Paths.get, bboxNode.isArray, bboxNode.toString, manifestPath.toFile|List&lt;DiagnosticCell&gt;|private|; backend/src/main/java/com/cell/platform/service/DiagnosticDatasetService.java:77|

#### C-128 — DiagnosticCell

- 역할: 소스 선언·사용 관계는 아래 멤버와 원본 위치 참조. 근거: `backend/src/main/java/com/cell/platform/service/DiagnosticDatasetService.java:106`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-128|record component|String cropFilename|세포 이미지 파일명|String|private final / accessor public (record 규칙)|String cropFilename; backend/src/main/java/com/cell/platform/service/DiagnosticDatasetService.java:106|
|C-128|record component|CellType label|선언된 상태/설정/응답 값|CellType|private final / accessor public (record 규칙)|CellType label; backend/src/main/java/com/cell/platform/service/DiagnosticDatasetService.java:106|
|C-128|record component|String bbox|xyxy 좌표의 문자열|String|private final / accessor public (record 규칙)|String bbox; backend/src/main/java/com/cell/platform/service/DiagnosticDatasetService.java:106|

#### C-129 — DiagnosticTaskService

- 역할: 분포 검증과 GT 진단 Task 생성. 근거: `backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:25`.
- 선언 annotation: `@Service`, `@RequiredArgsConstructor`, `@Transactional(readOnly = true)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-129|field|private final DiagnosticDatasetService diagnosticDatasetService|주입/참조 업무 서비스|DiagnosticDatasetService|private|; backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:27|
|C-129|field|private final TaskRepository taskRepository|주입/참조 저장소|TaskRepository|private|; backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:28|
|C-129|field|private final AnimalSpeciesService animalSpeciesService|주입/참조 업무 서비스|AnimalSpeciesService|private|; backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:29|
|C-129|method|public DiagnosticPoolStatsResponse getPoolStats()|조회·변환·판정; 명시 호출 CellType.values, animalSpeciesService.getDog, available.getOrDefault, byClass.put, diagnosticDatasetService.getAvailableCounts|DiagnosticPoolStatsResponse|public|; backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:31|
|C-129|method|public TaskUploadResponse createDiagnosticTask(DiagnosticTaskCreateRequest request)|생성·저장·구성; 명시 호출 Crop.create, DateTimeFormatter.ofPattern, LocalDateTime.now, Task.create, TaskUploadResponse.of|TaskUploadResponse|public|@Transactional; backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:46|
|C-129|method|private Map&lt;CellType, Integer&gt; normalizeAndValidateDistribution( DiagnosticTaskCreateRequest request, Map&lt;CellType, Integer&gt; available )|검증·정규화·조건 판단; 명시 호출 CellType.values, Math.max, available.getOrDefault, normalized.put, raw.getOrDefault|Map&lt;CellType, Integer&gt;|private|; backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:67|

#### C-130 — FileStorageService

- 역할: UUID 원본 저장·최대320 썸네일·파일 경로. 근거: `backend/src/main/java/com/cell/platform/service/FileStorageService.java:23`.
- 선언 annotation: `@Slf4j`, `@Service`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-130|field|private static final int THUMBNAIL_MAX_DIMENSION|선언된 상태/설정/응답 값|int|private|; backend/src/main/java/com/cell/platform/service/FileStorageService.java:25|
|C-130|field|private final Path uploadDir|선언된 상태/설정/응답 값|Path|private|; backend/src/main/java/com/cell/platform/service/FileStorageService.java:27|
|C-130|field|private final Path cropDir|선언된 상태/설정/응답 값|Path|private|; backend/src/main/java/com/cell/platform/service/FileStorageService.java:28|
|C-130|field|private final Path thumbnailDir|선언된 상태/설정/응답 값|Path|private|; backend/src/main/java/com/cell/platform/service/FileStorageService.java:29|
|C-130|constructor|public FileStorageService( String uploadDir, String cropDir, String thumbnailDir)|객체 생성/입력 검증 경로. 실제 기본값/검증은 소스와 ALG 참조|constructor|public|@Value("${file.upload-dir}") @Value("${file.crop-dir}") @Value("${file.thumbnail-dir}") String thumbnailDir); backend/src/main/java/com/cell/platform/service/FileStorageService.java:31|
|C-130|method|void init()|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|package-private|@PostConstruct; backend/src/main/java/com/cell/platform/service/FileStorageService.java:40|
|C-130|method|public String saveOriginal(MultipartFile file)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|String|public|; backend/src/main/java/com/cell/platform/service/FileStorageService.java:47|
|C-130|method|public String saveOriginal(MultipartFile file, String speciesCode)|생성·저장·구성; 명시 호출 file.getOriginalFilename, uploadDir.resolve|String|public|; backend/src/main/java/com/cell/platform/service/FileStorageService.java:51|
|C-130|method|public Path getUploadDir()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Path|public|; backend/src/main/java/com/cell/platform/service/FileStorageService.java:59|
|C-130|method|public Path getCropDir()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Path|public|; backend/src/main/java/com/cell/platform/service/FileStorageService.java:63|
|C-130|method|public Path getThumbnailDir()|조회·변환·판정; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|Path|public|; backend/src/main/java/com/cell/platform/service/FileStorageService.java:67|
|C-130|method|/** * 원본 이미지의 축소판을 thumbnailDir에 생성한다. 이미 존재하면 건너뛴다(원본 업로드 및 백필 양쪽에서 재사용). */ public void ensureThumbnail(Path sourceFile, String filename)|업무/보조 처리; 명시 호출 Files.exists, ImageIO.read, ImageIO.write, Math.max, Math.min|/** * 원본 이미지의 축소판을 thumbnailDir에 생성한다. 이미 존재하면|package-private|; backend/src/main/java/com/cell/platform/service/FileStorageService.java:71|
|C-130|method|private String thumbnailFormat(String filename)|업무/보조 처리; 명시 호출 filename.toLowerCase, lower.endsWith|String|private|; backend/src/main/java/com/cell/platform/service/FileStorageService.java:103|
|C-130|method|private String generateFilename(String originalName, String speciesCode)|생성·저장·구성; 명시 호출 UUID.randomUUID, speciesCode.toLowerCase|String|private|; backend/src/main/java/com/cell/platform/service/FileStorageService.java:108|
|C-130|method|private String extractExtension(String filename)|업무/보조 처리; 명시 호출 filename.lastIndexOf, filename.substring|String|private|; backend/src/main/java/com/cell/platform/service/FileStorageService.java:116|
|C-130|method|private void saveFile(MultipartFile file, Path target)|생성·저장·구성; 명시 호출 Files.copy, file.getInputStream|void|private|; backend/src/main/java/com/cell/platform/service/FileStorageService.java:121|
|C-130|method|private void createDirectories(Path path)|생성·저장·구성; 명시 호출 Files.createDirectories|void|private|; backend/src/main/java/com/cell/platform/service/FileStorageService.java:129|

#### C-131 — GameRecordService

- 역할: 관리자 게임 양수 점수·모드 top15·전체 삭제. 근거: `backend/src/main/java/com/cell/platform/service/GameRecordService.java:18`.
- 선언 annotation: `@Service`, `@RequiredArgsConstructor`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-131|field|private final GameRecordJpaRepository repo|주입/참조 저장소|GameRecordJpaRepository|private|; backend/src/main/java/com/cell/platform/service/GameRecordService.java:20|
|C-131|field|private static final DateTimeFormatter DATE_FMT|선언된 상태/설정/응답 값|DateTimeFormatter|private|; backend/src/main/java/com/cell/platform/service/GameRecordService.java:21|
|C-131|method|public void saveRecords(GameRecordRequest request)|생성·저장·구성; 명시 호출 GameRecordEntity.builder, LocalDateTime.now, p.name, p.score, repo.save|void|public|@Transactional; backend/src/main/java/com/cell/platform/service/GameRecordService.java:23|
|C-131|method|public List&lt;GameRecordResponse&gt; getLeaderboard(String mode)|조회·변환·판정; 명시 호출 PageRequest.of, e.getPlayedAt, e.getPlayerName, e.getScore, mode.toUpperCase|List&lt;GameRecordResponse&gt;|public|; backend/src/main/java/com/cell/platform/service/GameRecordService.java:37|
|C-131|method|public void deleteAll()|삭제·차감·초기화; 명시 호출 repo.deleteAll|void|public|@Transactional; backend/src/main/java/com/cell/platform/service/GameRecordService.java:43|

#### C-132 — LabelingService

- 역할: VIA2.0.10 JSON·ZIP 입출력과 cropId/클래스/좌표 매핑. 근거: `backend/src/main/java/com/cell/platform/service/LabelingService.java:34`.
- 선언 annotation: `@Service`, `@RequiredArgsConstructor`, `@Transactional(readOnly = true)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-132|method|// Frontend CELL_TYPES 순서와 동일하게 유지 (option 번호가 여기서 결정됨) private static final List&lt;String&gt; CELL_TYPE_ORDER = List.of("Segment", "Band", "Eosinophil", "NucleatedRBC", "Lymphocyte", "Monocyte")|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|// Frontend CELL_TYPES 순서와 동일하게|package-private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:36|
|C-132|field|private final TaskJpaRepository taskJpaRepository|주입/참조 저장소|TaskJpaRepository|private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:40|
|C-132|field|private final CropJpaRepository cropJpaRepository|주입/참조 저장소|CropJpaRepository|private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:41|
|C-132|field|private final FileStorageService fileStorageService|주입/참조 업무 서비스|FileStorageService|private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:42|
|C-132|field|private final ObjectMapper objectMapper|선언된 상태/설정/응답 값|ObjectMapper|private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:43|
|C-132|method|// ── Export ────────────────────────────────────────────────── public byte[] exportTask(Long taskId)|업무/보조 처리; 명시 호출 Files.size, crop.getCropFilename, cropJpaRepository.findAllByTask_Id, fileStorageService.getCropDir, fileStorageService.getUploadDir|// ── Export ────────────────────────────────────────────────── public byte[]|package-private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:45|
|C-132|method|private Map&lt;String, Object&gt; buildViaJson(TaskEntity task, List&lt;CropEntity&gt; crops, String smearExportName, long fileSize)|생성·저장·구성; 명시 호출 CELL_TYPE_ORDER.get, CELL_TYPE_ORDER.size, List.of, Map.of, String.valueOf|Map&lt;String, Object&gt;|private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:78|
|C-132|method|// ── Import ────────────────────────────────────────────────── public int importLabels(Long taskId, JsonNode viaJson)|업무/보조 처리; 명시 호출 CELL_TYPE_ORDER.get, CELL_TYPE_ORDER.size, Integer.parseInt, Long.parseLong, checkboxAttr.fields|// ── Import ────────────────────────────────────────────────── public int|package-private|@Transactional; backend/src/main/java/com/cell/platform/service/LabelingService.java:187|
|C-132|method|// ── Helpers ───────────────────────────────────────────────── private TaskEntity findUploadedSmearTask(Long taskId)|조회·변환·판정; 명시 호출 task.getOriginalFilename, task.getUploadedFilename, taskJpaRepository.findById|// ── Helpers ───────────────────────────────────────────────── private TaskEntity|package-private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:253|
|C-132|method|private String buildSmearExportName(TaskEntity task)|생성·저장·구성; 명시 호출 task.getId, task.getOriginalFilename, task.getUploadedFilename|String|private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:267|
|C-132|method|private String buildCropExportName(TaskEntity task, CropEntity crop)|생성·저장·구성; 명시 호출 crop.getId, task.getId|String|private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:275|
|C-132|method|public String buildArchiveFilename(Long taskId)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|String|public|; backend/src/main/java/com/cell/platform/service/LabelingService.java:280|
|C-132|method|private String speciesCode(TaskEntity task)|업무/보조 처리; 명시 호출 task.getAnimalSpecies|String|private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:285|
|C-132|method|private String speciesName(TaskEntity task)|업무/보조 처리; 명시 호출 task.getAnimalSpecies|String|private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:291|
|C-132|method|private String sanitizeFilename(String filename)|업무/보조 처리; 명시 호출 Path.of, baseName.replaceAll, safeName.isBlank|String|private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:297|
|C-132|method|/** bbox 문자열 "[x1, y1, x2, y2]" 또는 "[[x1, y1], [x2, y2]]" → int[4] */ private int[] parseBbox(String bbox)|검증·정규화·조건 판단; 명시 호출 Double.parseDouble, bbox.replaceAll, cleaned.split|/** bbox 문자열 "[x1, y1, x2, y2]" 또는 "[[x1, y1], [x2, y2]]" → int[4] */ private int[]|package-private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:303|
|C-132|method|private String optionIndex(String cellTypeName)|업무/보조 처리; 명시 호출 CELL_TYPE_ORDER.indexOf, String.valueOf|String|private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:315|
|C-132|method|private CellType parseCellType(String label)|검증·정규화·조건 판단; 명시 호출 CellType.valueOf|CellType|private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:320|
|C-132|method|private void addFile(ZipOutputStream zip, Path source, String entryName) throws IOException|생성·저장·구성; 명시 호출 Files.copy, Files.exists, zip.closeEntry, zip.putNextEntry|void|private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:328|
|C-132|method|private void addContent(ZipOutputStream zip, String entryName, byte[] content) throws IOException|생성·저장·구성; 명시 호출 zip.closeEntry, zip.putNextEntry, zip.write|void|private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:338|
|C-132|method|private boolean hasText(String value)|검증·정규화·조건 판단; 명시 호출 value.isBlank|boolean|private|; backend/src/main/java/com/cell/platform/service/LabelingService.java:344|

#### C-133 — PseudoLabelService

- 역할: 혼동행렬 행 정규화만. posterior·임계정책은 TODO. 근거: `backend/src/main/java/com/cell/platform/service/PseudoLabelService.java:9`.
- 선언 annotation: `@Service`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-133|method|/** * TODO: * 1) confusion matrix를 확률 행렬로 정규화 * 2) 학생 투표 분포와 결합해 pseudo label posterior 계산 * 3) 임계치 기반 확정/보류 정책 적용 * * 현재는 후속 알고리즘 연결을 위한 스캐폴드로, 행 단위 정규화 결과만 반환한다. */ public Map&lt;String, Map&lt;String, Double&gt;&gt; normalizeConfusionMatrix(Map&lt;String, Map&lt;String, Integer&gt;&gt; confusionMatrix)|검증·정규화·조건 판단; 명시 호출 cell.getKey, cell.getValue, confusionMatrix.entrySet, normalized.put, normalizedRow.put|/** * TODO: * 1) confusion matrix를 확률 행렬로 정규화 * 2) 학생 투표 분포와 결합해 pseudo label posterior 계산 * 3) 임계치 기반 확정/보류 정책 적용 * * 현재는 후속 알고리즘 연결을 위한 스캐폴드로, 행 단위 정규화 결과만 반환한다. */ public Map&lt;String, Map&lt;String, Double&gt;&gt;|package-private|; backend/src/main/java/com/cell/platform/service/PseudoLabelService.java:11|

#### C-134 — StatsService

- 역할: 세포별 투표·오답률·응답자 이름 통계. 근거: `backend/src/main/java/com/cell/platform/service/StatsService.java:21`.
- 선언 annotation: `@Service`, `@RequiredArgsConstructor`, `@Transactional(readOnly = true)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-134|field|private final CropRepository cropRepository|주입/참조 저장소|CropRepository|private|; backend/src/main/java/com/cell/platform/service/StatsService.java:23|
|C-134|field|private final SubmissionRepository submissionRepository|주입/참조 저장소|SubmissionRepository|private|; backend/src/main/java/com/cell/platform/service/StatsService.java:24|
|C-134|field|private final UserRepository userRepository|주입/참조 저장소|UserRepository|private|; backend/src/main/java/com/cell/platform/service/StatsService.java:25|
|C-134|field|private static final List&lt;String&gt; CELL_LABELS|선언된 상태/설정/응답 값|List&lt;String&gt;|private|; backend/src/main/java/com/cell/platform/service/StatsService.java:27|
|C-134|method|public List&lt;CropStatsResponse&gt; getTaskStats(Long taskId)|조회·변환·판정; 명시 호출 Comparator.comparingDouble, cropRepository.findAllByTaskId, studentNamesById.put, user.getName, user.getUsername|List&lt;CropStatsResponse&gt;|public|; backend/src/main/java/com/cell/platform/service/StatsService.java:31|
|C-134|method|public List&lt;CropStatsResponse&gt; getAllStats()|조회·변환·판정; 명시 호출 Comparator.comparingDouble, cropRepository.findAll|List&lt;CropStatsResponse&gt;|public|; backend/src/main/java/com/cell/platform/service/StatsService.java:47|
|C-134|method|private List&lt;CropStatsResponse&gt; buildStatsList( List&lt;Crop&gt; crops, Comparator&lt;CropStatsResponse&gt; sorter, Map&lt;String, String&gt; studentNamesById )|생성·저장·구성; 명시 호출 Collectors.groupingBy, List.of, allSubmissions.stream, crop.getId, crops.stream|List&lt;CropStatsResponse&gt;|private|; backend/src/main/java/com/cell/platform/service/StatsService.java:56|
|C-134|method|private CropStatsResponse buildCropStats( Crop crop, List&lt;Submission&gt; submissions, Map&lt;String, String&gt; studentNamesById )|생성·저장·구성; 명시 호출 Comparator.comparing, CropStatsResponse.builder, List.of, Math.round, crop.getAiBboxConfidence|CropStatsResponse|private|; backend/src/main/java/com/cell/platform/service/StatsService.java:77|
|C-134|method|private CropStatsResponse.VoterDetail buildVoterDetail( String studentId, Map&lt;String, String&gt; studentNamesById )|생성·저장·구성; 명시 호출 CropStatsResponse.VoterDetail, studentNamesById.get|CropStatsResponse.VoterDetail|private|; backend/src/main/java/com/cell/platform/service/StatsService.java:140|
|C-134|method|private String normalizeStudentName(String studentName)|검증·정규화·조건 판단; 명시 호출 studentName.isBlank, studentName.trim|String|private|; backend/src/main/java/com/cell/platform/service/StatsService.java:149|

#### C-135 — StudentAnalyticsService

- 역할: 학생별 Assignment/Task/진단 이력·미응답/대기·셀 상세 요약. 근거: `backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:24`.
- 선언 annotation: `@Service`, `@RequiredArgsConstructor`, `@Transactional(readOnly = true)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-135|field|private final TaskRepository taskRepository|주입/참조 저장소|TaskRepository|private|; backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:25|
|C-135|field|private final CropRepository cropRepository|주입/참조 저장소|CropRepository|private|; backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:26|
|C-135|field|private final SubmissionRepository submissionRepository|주입/참조 저장소|SubmissionRepository|private|; backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:27|
|C-135|field|private final SubmissionService submissionService|주입/참조 업무 서비스|SubmissionService|private|; backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:28|
|C-135|method|public StudentLearningResponse getHistory(String studentId)|조회·변환·판정; 명시 호출 Collectors.groupingBy, Comparator.comparing, Comparator.naturalOrder, List.of, activities.add|StudentLearningResponse|public|; backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:30|
|C-135|method|public TaskDetail getTaskDetail(String studentId, Long taskId)|조회·변환·판정; 명시 호출 cropRepository.findAllByTaskId, taskRepository.findById|TaskDetail|public|; backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:62|
|C-135|method|private Map&lt;Long, Submission&gt; getAnswers(List&lt;Crop&gt; crops, String studentId)|조회·변환·판정; 명시 호출 Collectors.toMap, Function.identity, Map.of, crops.isEmpty, crops.stream|Map&lt;Long, Submission&gt;|private|; backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:70|
|C-135|method|private List&lt;CellResult&gt; buildCells(Task task, List&lt;Crop&gt; crops, Map&lt;Long, Submission&gt; answers)|생성·저장·구성; 명시 호출 Comparator.comparing, answer.getStudentLabel, answer.getSubmittedAt, answers.get, crop.getCropFilename|List&lt;CellResult&gt;|private|; backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:76|
|C-135|method|private Summary summarize(List&lt;CellResult&gt; cells)|업무/보조 처리; 명시 호출 FALSE.equals, TRUE.equals, cell.correctLabel, cell.isCorrect, cell.studentLabel|Summary|private|; backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:88|
|C-135|method|private Summary combine(List&lt;Summary&gt; summaries)|업무/보조 처리; 명시 호출 s.totalCells, summaries.stream|Summary|private|; backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:96|
|C-135|method|private Summary summary(int total, int answered, int correct, int wrong, boolean complete)|업무/보조 처리; 명시 호출 Math.round|Summary|private|; backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:103|
|C-135|method|private TaskResult toTaskResult(Task task, Summary summary)|조회·변환·판정; 명시 호출 task.getId, task.getOriginalFilename, task.getSpeciesCode, task.getSpeciesName, task.getUploadedFilename|TaskResult|private|; backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:108|
|C-135|method|private boolean isDiagnostic(Task task)|검증·정규화·조건 판단; 명시 호출 task.getUploadedFilename|boolean|private|; backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:113|
|C-135|method|private String title(Task task)|업무/보조 처리; 명시 호출 task.getId, task.getTitle|String|private|; backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:117|

#### C-136 — SubmissionService

- 역할: 학생 답안 upsert·마감잠금·채점·복습·저장 혼동행렬 집계. 근거: `backend/src/main/java/com/cell/platform/service/SubmissionService.java:46`.
- 선언 annotation: `@Service`, `@RequiredArgsConstructor`, `@Transactional(readOnly = true)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-136|field|private static final String DIAGNOSTIC_PREFIX|선언된 상태/설정/응답 값|String|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:48|
|C-136|field|private final SubmissionRepository submissionRepository|주입/참조 저장소|SubmissionRepository|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:50|
|C-136|field|private final CropRepository cropRepository|주입/참조 저장소|CropRepository|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:51|
|C-136|field|private final UserRepository userRepository|주입/참조 저장소|UserRepository|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:52|
|C-136|field|private final TaskRepository taskRepository|주입/참조 저장소|TaskRepository|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:53|
|C-136|field|private final DiagnosticDatasetService diagnosticDatasetService|주입/참조 업무 서비스|DiagnosticDatasetService|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:54|
|C-136|field|private final ConfusionMatrixRepository confusionMatrixRepository|주입/참조 저장소|ConfusionMatrixRepository|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:55|
|C-136|method|public void submit(Long cropId, String studentId, String studentLabel)|업무/보조 처리; 명시 호출 Submission.create, correctLabel.name, crop.getTaskId, cropRepository.findById, existing.getStudentLabel|void|public|@Transactional; backend/src/main/java/com/cell/platform/service/SubmissionService.java:57|
|C-136|method|// --- 여기서부터 원래 주훈님이 가지고 계시던 소중한 코드들 복구 --- // public Map&lt;Long, String&gt; getSolvedCropLabels(Long taskId, String studentId)|조회·변환·판정; 명시 호출 cropRepository.findAllByTaskId, crops.stream, result.put, sub.getCropId, sub.getStudentLabel|// --- 여기서부터 원래 주훈님이 가지고 계시던 소중한 코드들 복구 --- // public Map&lt;Long, String&gt;|package-private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:91|
|C-136|method|public Map&lt;Long, String&gt; getSolvedCropLabelsForAssignment(Long assignmentId, String studentId)|조회·변환·판정; 명시 호출 cropRepository.findAllByTaskId, result.put, sub.getCropId, sub.getStudentLabel, submissionRepository.findAllByCropIdInAndStudentId|Map&lt;Long, String&gt;|public|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:102|
|C-136|method|public List&lt;Long&gt; getSolvedCropIdsForAssignment(Long assignmentId, String studentId)|조회·변환·판정; 명시 호출 crop.getId, cropRepository.findAllByTaskId, sub.getCropId, submissionRepository.findAllByCropIdInAndStudentId, task.getId|List&lt;Long&gt;|public|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:114|
|C-136|method|public MyResultsResponse getMyResultsForAssignment(Long assignmentId, String studentId)|조회·변환·판정; 명시 호출 Arrays.stream, CellType.values, Collectors.toMap, Detail.builder, Math.round|MyResultsResponse|public|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:124|
|C-136|method|public List&lt;Long&gt; getSolvedCropIds(Long taskId, String studentId)|조회·변환·판정; 명시 호출 cropRepository.findAllByTaskId, crops.stream, submissionRepository.findAllByCropIdInAndStudentId|List&lt;Long&gt;|public|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:167|
|C-136|method|public MyResultsResponse getMyResults(Long taskId, String studentId)|조회·변환·판정; 명시 호출 Arrays.stream, CellType.values, Collectors.toMap, Detail.builder, Function.identity|MyResultsResponse|public|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:176|
|C-136|method|public void assertReviewAvailableForTask(Long taskId, String studentId)|검증·정규화·조건 판단; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|public|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:235|
|C-136|method|public void assertReviewAvailableForAssignment(Long assignmentId, String studentId)|검증·정규화·조건 판단; 명시 호출 taskRepository.findByAssignmentId|void|public|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:242|
|C-136|method|public StudentReviewResponse getStudentReviews(String studentId)|조회·변환·판정; 명시 호출 Comparator.comparing, Comparator.reverseOrder, List.of, handledAssignments.add, review.deadlineAt|StudentReviewResponse|public|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:249|
|C-136|method|private java.util.Optional&lt;StudentReviewResponse.ReviewGroup&gt; buildReviewGroup( List&lt;Task&gt; tasks, String studentId )|생성·저장·구성; 명시 호출 Collectors.toMap, Comparator.comparing, Function.identity, Math.max, Math.round|java.util.Optional&lt;StudentReviewResponse.ReviewGroup&gt;|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:272|
|C-136|method|private List&lt;Task&gt; getScopeTasks(Long taskId)|조회·변환·판정; 명시 호출 List.of, task.getAssignmentId, taskRepository.findByAssignmentId, taskRepository.findById|List&lt;Task&gt;|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:335|
|C-136|method|private ScopeSnapshot createScopeSnapshot(List&lt;Task&gt; tasks, String studentId)|생성·저장·구성; 명시 호출 List.of, cropIds.isEmpty, cropRepository.findAllByTaskIdIn, crops.stream, submissionRepository.findAllByCropIdInAndStudentId|ScopeSnapshot|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:344|
|C-136|method|private boolean isReviewAvailable(ScopeSnapshot scope)|검증·정규화·조건 판단; 명시 호출 crop.getFinalLabel, scope.crops, scope.diagnostic, scope.submissions, scope.tasks|boolean|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:357|
|C-136|method|private boolean isSubmissionLocked(ScopeSnapshot scope)|검증·정규화·조건 판단; 명시 호출 crop.getFinalLabel, scope.crops, scope.diagnostic, scope.submissions, scope.tasks|boolean|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:366|
|C-136|method|private boolean isDeadlinePassed(List&lt;Task&gt; tasks)|검증·정규화·조건 판단; 명시 호출 LocalDateTime.now, deadlineAt.isAfter|boolean|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:375|
|C-136|method|private LocalDateTime getDeadlineAt(List&lt;Task&gt; tasks)|조회·변환·판정; 명시 호출 tasks.stream|LocalDateTime|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:380|
|C-136|method|private String getAvailabilityReason(ScopeSnapshot scope)|조회·변환·판정; 명시 호출 scope.diagnostic, scope.tasks|String|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:388|
|C-136|method|private boolean isDiagnosticTask(Task task)|검증·정규화·조건 판단; 명시 호출 task.getUploadedFilename|boolean|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:393|
|C-136|method|private boolean isDiagnosticTask(Long taskId)|검증·정규화·조건 판단; 명시 호출 task.getUploadedFilename, taskRepository.findById|boolean|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:406|
|C-136|method|CellType resolveCorrectLabel(Crop crop, boolean diagnosticTask)|조회·변환·판정; 명시 호출 crop.getCropFilename, crop.getFinalLabel, crop.getGtLabel, diagnosticDatasetService.findLabelByCropFilename|CellType|package-private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:416|
|C-136|method|private Map&lt;String, Map&lt;String, Integer&gt;&gt; initConfusionMatrix(List&lt;String&gt; labels)|업무/보조 처리; 명시 호출 matrix.put, row.put|Map&lt;String, Map&lt;String, Integer&gt;&gt;|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:430|
|C-136|method|private CellType parseCellType(String label)|검증·정규화·조건 판단; 명시 호출 CellType.valueOf|CellType|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:442|
|C-136|method|// --- 여기서부터 새롭게 추가된 혼동행렬 저장 핵심 로직 --- // public void backfillConfusionMatrixForCrop(Long cropId, Long taskId, CellType oldFinalLabel, CellType newFinalLabel)|상태·라벨·통계 변경; 명시 호출 newFinalLabel.name, oldFinalLabel.name, sub.getStudentId, sub.getStudentLabel, submissionRepository.findAllByCropId|// --- 여기서부터 새롭게 추가된 혼동행렬 저장 핵심 로직 --- // public void|package-private|@Transactional; backend/src/main/java/com/cell/platform/service/SubmissionService.java:451|
|C-136|method|private void subtractConfusionMatrixEntry(String studentId, Long taskId, String actualLabel, String predictedLabel)|삭제·차감·초기화; 명시 호출 LocalDateTime.now, Math.max, confusionMatrixRepository.findByStudentIdAndTaskId, confusionMatrixRepository.save, data.get|void|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:466|
|C-136|method|private void updateConfusionMatrix(String studentId, Long taskId, String actualLabel, String predictedLabel)|상태·라벨·통계 변경; 명시 호출 LocalDateTime.now, confusionMatrixRepository.save, data.computeIfAbsent, matrixEntity.getMatrixData, matrixEntity.setMatrixData|void|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:480|
|C-136|method|public DiagnosticStudentMatrixResponse getDiagnosticStudentMatrices(Long taskId)|조회·변환·판정; 명시 호출 DiagnosticStudentMatrixResponse.builder, StudentMatrixDetail.builder, actual.equals, confusionMatrixRepository.findAllByTaskId, entities.stream|DiagnosticStudentMatrixResponse|public|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:508|
|C-136|method|public DiagnosticStudentMatrixResponse getCumulativeStudentMatrices()|조회·변환·판정; 명시 호출 Arrays.stream, CellType.values, DiagnosticStudentMatrixResponse.builder, details.add, displayByStudent.get|DiagnosticStudentMatrixResponse|public|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:545|
|C-136|method|private DiagnosticStudentMatrixResponse.StudentMatrixDetail buildStudentMatrixDetail( String studentId, String studentName, String studentDisplayName, Map&lt;String, Map&lt;String, Integer&gt;&gt; matrix )|생성·저장·구성; 명시 호출 StudentMatrixDetail.builder, actual.equals, matrix.get, matrix.keySet|DiagnosticStudentMatrixResponse.StudentMatrixDetail|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:609|
|C-136|method|private List&lt;Long&gt; resolveEligibleTaskIds()|조회·변환·판정; 명시 호출 cropRepository.findDistinctTaskIdsByFinalLabelIsNotNull, taskIds.addAll, taskRepository.findIdsByUploadedFilenameStartingWith|List&lt;Long&gt;|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:635|
|C-136|method|private void mergeConfusionMatrix( Map&lt;String, Map&lt;String, Integer&gt;&gt; target, Map&lt;String, Map&lt;String, Integer&gt;&gt; source, List&lt;String&gt; labels )|상태·라벨·통계 변경; 명시 호출 actualEntry.getKey, actualEntry.getValue, predictedEntry.getKey, predictedEntry.getValue, source.entrySet|void|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:642|
|C-136|method|private Map&lt;String, Integer&gt; initMatrixRow(List&lt;String&gt; labels)|업무/보조 처리; 명시 호출 row.put|Map&lt;String, Integer&gt;|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:662|
|C-136|method|private String resolveStudentName(String studentId)|조회·변환·판정; 명시 호출 user.getName, userRepository.findByUsername|String|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:670|
|C-136|method|private String normalizeStudentName(String studentName)|검증·정규화·조건 판단; 명시 호출 studentName.isBlank|String|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:677|
|C-136|method|private String buildStudentDisplayName(String studentId, String studentName)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|String|private|; backend/src/main/java/com/cell/platform/service/SubmissionService.java:682|

#### C-137 — ScopeSnapshot

- 역할: 소스 선언·사용 관계는 아래 멤버와 원본 위치 참조. 근거: `backend/src/main/java/com/cell/platform/service/SubmissionService.java:398`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-137|record component|List&lt;Task&gt; tasks|선언된 상태/설정/응답 값|List&lt;Task&gt;|private final / accessor public (record 규칙)|List&lt;Task&gt; tasks; backend/src/main/java/com/cell/platform/service/SubmissionService.java:398|
|C-137|record component|List&lt;Crop&gt; crops|선언된 상태/설정/응답 값|List&lt;Crop&gt;|private final / accessor public (record 규칙)|List&lt;Crop&gt; crops; backend/src/main/java/com/cell/platform/service/SubmissionService.java:398|
|C-137|record component|List&lt;Submission&gt; submissions|선언된 상태/설정/응답 값|List&lt;Submission&gt;|private final / accessor public (record 규칙)|List&lt;Submission&gt; submissions; backend/src/main/java/com/cell/platform/service/SubmissionService.java:398|
|C-137|record component|boolean diagnostic|선언된 상태/설정/응답 값|boolean|private final / accessor public (record 규칙)|boolean diagnostic; backend/src/main/java/com/cell/platform/service/SubmissionService.java:398|

#### C-138 — TaskService

- 역할: 단일/다중 과제 생성·AI 호출·마감·DB 관련 기록 삭제. 근거: `backend/src/main/java/com/cell/platform/service/TaskService.java:34`.
- 선언 annotation: `@Service`, `@RequiredArgsConstructor`, `@Transactional(readOnly = true)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-138|field|private final TaskRepository taskRepository|주입/참조 저장소|TaskRepository|private|; backend/src/main/java/com/cell/platform/service/TaskService.java:36|
|C-138|field|private final FileStorageService fileStorageService|주입/참조 업무 서비스|FileStorageService|private|; backend/src/main/java/com/cell/platform/service/TaskService.java:37|
|C-138|field|private final AiClientService aiClientService|주입/참조 업무 서비스|AiClientService|private|; backend/src/main/java/com/cell/platform/service/TaskService.java:38|
|C-138|field|private final SubmissionJpaRepository submissionJpaRepository|주입/참조 저장소|SubmissionJpaRepository|private|; backend/src/main/java/com/cell/platform/service/TaskService.java:39|
|C-138|field|private final ConfusionMatrixJpaRepository confusionMatrixJpaRepository|주입/참조 저장소|ConfusionMatrixJpaRepository|private|; backend/src/main/java/com/cell/platform/service/TaskService.java:40|
|C-138|field|private final CropIssueReportJpaRepository cropIssueReportJpaRepository|주입/참조 저장소|CropIssueReportJpaRepository|private|; backend/src/main/java/com/cell/platform/service/TaskService.java:41|
|C-138|field|private final AssignmentJpaRepository assignmentJpaRepository|주입/참조 저장소|AssignmentJpaRepository|private|; backend/src/main/java/com/cell/platform/service/TaskService.java:42|
|C-138|field|private final CropRepository cropRepository|주입/참조 저장소|CropRepository|private|; backend/src/main/java/com/cell/platform/service/TaskService.java:43|
|C-138|field|private final AnimalSpeciesService animalSpeciesService|주입/참조 업무 서비스|AnimalSpeciesService|private|; backend/src/main/java/com/cell/platform/service/TaskService.java:44|
|C-138|method|public List&lt;TaskResponse&gt; getAllTasks()|조회·변환·판정; 명시 호출 taskRepository.findAllByOrderByIdDesc|List&lt;TaskResponse&gt;|public|; backend/src/main/java/com/cell/platform/service/TaskService.java:46|
|C-138|method|public Task getTaskById(Long id)|조회·변환·판정; 명시 호출 taskRepository.findById|Task|public|; backend/src/main/java/com/cell/platform/service/TaskService.java:52|
|C-138|method|public TaskUploadResponse createTask(MultipartFile file)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|TaskUploadResponse|public|@Transactional; backend/src/main/java/com/cell/platform/service/TaskService.java:58|
|C-138|method|public TaskUploadResponse createTask(MultipartFile file, LocalDateTime deadlineAt)|생성·저장·구성; 명시 호출 animalSpeciesService.getDog|TaskUploadResponse|public|@Transactional; backend/src/main/java/com/cell/platform/service/TaskService.java:63|
|C-138|method|public TaskUploadResponse createTask(MultipartFile file, LocalDateTime deadlineAt, Long speciesId)|생성·저장·구성; 명시 호출 Task.create, TaskUploadResponse.of, aiClientService.analyze, animalSpeciesService.getDog, animalSpeciesService.getRequired|TaskUploadResponse|public|@Transactional; backend/src/main/java/com/cell/platform/service/TaskService.java:68|
|C-138|method|private void addCropsToTask(Task task, AiAnalysisResponse aiResult)|생성·저장·구성; 명시 호출 Crop.create, aiResult.getCells, cell.getBbox, cell.getConfidence, cell.getCropFilename|void|private|; backend/src/main/java/com/cell/platform/service/TaskService.java:88|
|C-138|method|public AssignmentResponse createAssignment(String title, String expertUsername, List&lt;MultipartFile&gt; files)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|AssignmentResponse|public|@Transactional; backend/src/main/java/com/cell/platform/service/TaskService.java:102|
|C-138|method|public AssignmentResponse createAssignment(String title, String expertUsername, List&lt;MultipartFile&gt; files, LocalDateTime deadlineAt)|생성·저장·구성; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|AssignmentResponse|public|@Transactional; backend/src/main/java/com/cell/platform/service/TaskService.java:108|
|C-138|method|public AssignmentResponse createAssignment(String title, String expertUsername, List&lt;MultipartFile&gt; files, LocalDateTime deadlineAt, List&lt;Long&gt; speciesIds)|생성·저장·구성; 명시 호출 AssignmentEntity.builder, Task.createForAssignment, TaskUploadResponse.of, aiClientService.analyze, animalSpeciesService.getDog|AssignmentResponse|public|@Transactional; backend/src/main/java/com/cell/platform/service/TaskService.java:114|
|C-138|method|public void deleteAssignment(Long assignmentId)|삭제·차감·초기화; 명시 호출 assignmentJpaRepository.deleteById, task.getId, taskRepository.findByAssignmentId|void|public|@Transactional; backend/src/main/java/com/cell/platform/service/TaskService.java:160|
|C-138|method|public void deleteTask(Long taskId)|삭제·차감·초기화; 명시 호출 confusionMatrixJpaRepository.deleteAllByTaskId, cropIds.isEmpty, cropIssueReportJpaRepository.deleteAllByTaskId, submissionJpaRepository.deleteAllByCropIdIn, task.getCrops|void|public|@Transactional; backend/src/main/java/com/cell/platform/service/TaskService.java:169|
|C-138|method|public void updateTaskDeadline(Long taskId, LocalDateTime deadlineAt)|상태·라벨·통계 변경; 명시 호출 List.of, task.getAssignmentId, taskRepository.updateDeadlineAt|void|public|@Transactional; backend/src/main/java/com/cell/platform/service/TaskService.java:182|
|C-138|method|public void updateAssignmentDeadline(Long assignmentId, LocalDateTime deadlineAt)|상태·라벨·통계 변경; 명시 호출 assignmentJpaRepository.existsById, taskRepository.findByAssignmentId, taskRepository.updateDeadlineAtByAssignmentId|void|public|@Transactional; backend/src/main/java/com/cell/platform/service/TaskService.java:195|
|C-138|method|private void validateDeadlineChange(List&lt;Task&gt; tasks, LocalDateTime deadlineAt)|검증·정규화·조건 판단; 명시 호출 LocalDateTime.now, current.isAfter, tasks.stream|void|private|; backend/src/main/java/com/cell/platform/service/TaskService.java:205|
|C-138|method|private void validateFutureDeadline(LocalDateTime deadlineAt)|검증·정규화·조건 판단; 명시 호출 LocalDateTime.now, deadlineAt.isAfter|void|private|; backend/src/main/java/com/cell/platform/service/TaskService.java:216|
|C-138|method|private boolean isDiagnosticTask(Task task)|검증·정규화·조건 판단; 명시 호출 task.getUploadedFilename|boolean|private|; backend/src/main/java/com/cell/platform/service/TaskService.java:222|
|C-138|method|private CellType parseCellType(String prediction)|검증·정규화·조건 판단; 명시 호출 CellType.valueOf|CellType|private|; backend/src/main/java/com/cell/platform/service/TaskService.java:227|

#### C-139 — Mapper

- 역할: domain↔JPA entity 변환. 근거: `backend/src/main/java/com/cell/platform/util/Mapper.java:18`.
- 선언 annotation: `@NoArgsConstructor(access = AccessLevel.PRIVATE)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-139|method|// ── User ── public static User convertToUser(UserEntity entity)|업무/보조 처리; 명시 호출 User.builder, entity.getCreatedAt, entity.getId, entity.getName, entity.getPassword|// ── User ── public static User|package-private|; backend/src/main/java/com/cell/platform/util/Mapper.java:20|
|C-139|method|public static UserEntity convertToUserEntity(User user)|업무/보조 처리; 명시 호출 UserEntity.builder, user.getCreatedAt, user.getId, user.getName, user.getPassword|UserEntity|public|; backend/src/main/java/com/cell/platform/util/Mapper.java:33|
|C-139|method|// ── Task ── public static Task convertToTask(TaskEntity entity)|업무/보조 처리; 명시 호출 Task.builder, entity.getAnimalSpecies, entity.getAssignmentId, entity.getCreatedAt, entity.getCrops|// ── Task ── public static Task|package-private|; backend/src/main/java/com/cell/platform/util/Mapper.java:45|
|C-139|method|public static TaskEntity convertToTaskEntity(Task task)|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|TaskEntity|public|; backend/src/main/java/com/cell/platform/util/Mapper.java:70|
|C-139|method|public static TaskEntity convertToTaskEntity(Task task, AnimalSpeciesEntity animalSpecies)|업무/보조 처리; 명시 호출 TaskEntity.builder, task.getAssignmentId, task.getCreatedAt, task.getDeadlineAt, task.getId|TaskEntity|public|; backend/src/main/java/com/cell/platform/util/Mapper.java:74|
|C-139|method|// ── Crop ── public static Crop convertToCrop(CropEntity entity)|업무/보조 처리; 명시 호출 Crop.builder, entity.getAiBboxConfidence, entity.getAiClassificationConfidence, entity.getBbox, entity.getCropFilename|// ── Crop ── public static Crop|package-private|; backend/src/main/java/com/cell/platform/util/Mapper.java:88|
|C-139|method|public static CropEntity convertToCropEntity(Crop crop)|업무/보조 처리; 명시 호출 CropEntity.builder, crop.getAiBboxConfidence, crop.getAiClassificationConfidence, crop.getBbox, crop.getCropFilename|CropEntity|public|; backend/src/main/java/com/cell/platform/util/Mapper.java:110|
|C-139|method|// ── Submission ── public static Submission convertToSubmission(SubmissionEntity entity)|업무/보조 처리; 명시 호출 Submission.builder, entity.getCrop, entity.getId, entity.getStudentId, entity.getStudentLabel|// ── Submission ── public static Submission|package-private|; backend/src/main/java/com/cell/platform/util/Mapper.java:123|
|C-139|method|public static SubmissionEntity convertToSubmissionEntity(Submission submission, CropEntity cropEntity)|업무/보조 처리; 명시 호출 SubmissionEntity.builder, submission.getId, submission.getStudentId, submission.getStudentLabel, submission.getSubmittedAt|SubmissionEntity|public|; backend/src/main/java/com/cell/platform/util/Mapper.java:134|

#### C-140 — ApplicationTests

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/ApplicationTests.java:7`.
- 선언 annotation: `@SpringBootTest`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-140|method|void contextLoads()|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|package-private|@Test; backend/src/test/java/com/cell/platform/ApplicationTests.java:9|

#### C-141 — JwtTokenProviderTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:10`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-141|field|private JwtTokenProvider jwtTokenProvider|선언된 상태/설정/응답 값|JwtTokenProvider|private|; backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:12|
|C-141|method|void setUp()|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|package-private|@BeforeEach; backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:14|

#### C-142 — generateToken_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:21`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-142|method|void JWT_토큰을_생성한다()|업무/보조 처리; 명시 호출 jwtTokenProvider.generateToken, token.split|void|package-private|@Test; backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:23|

#### C-143 — getUsername_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:32`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-143|method|void 토큰에서_username을_추출한다()|업무/보조 처리; 명시 호출 jwtTokenProvider.generateToken, jwtTokenProvider.getUsername|void|package-private|@Test; backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:34|

#### C-144 — getRole_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:42`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-144|method|void 토큰에서_role을_추출한다()|업무/보조 처리; 명시 호출 jwtTokenProvider.generateToken, jwtTokenProvider.getRole|void|package-private|@Test; backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:44|

#### C-145 — isValid_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:52`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-145|method|void 유효한_토큰이면_true를_반환한다()|업무/보조 처리; 명시 호출 jwtTokenProvider.generateToken, jwtTokenProvider.isValid|void|package-private|@Test; backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:54|
|C-145|method|void 잘못된_토큰이면_false를_반환한다()|업무/보조 처리; 명시 호출 jwtTokenProvider.isValid|void|package-private|@Test; backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:60|
|C-145|method|void 빈_문자열이면_false를_반환한다()|업무/보조 처리; 명시 호출 jwtTokenProvider.isValid|void|package-private|@Test; backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:65|
|C-145|method|void 다른_시크릿으로_만든_토큰이면_false를_반환한다()|업무/보조 처리; 명시 호출 jwtTokenProvider.isValid, other.generateToken|void|package-private|@Test; backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java:70|

#### C-146 — RepositoryContext

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/context/RepositoryContext.java:22`.
- 선언 annotation: `@DataJpaTest`, `@Import`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-146|field|protected UserJpaRepository userJpaRepository|주입/참조 저장소|UserJpaRepository|protected|@Autowired; backend/src/test/java/com/cell/platform/context/RepositoryContext.java:24|
|C-146|field|protected TaskJpaRepository taskJpaRepository|주입/참조 저장소|TaskJpaRepository|protected|@Autowired; backend/src/test/java/com/cell/platform/context/RepositoryContext.java:27|
|C-146|field|protected CropJpaRepository cropJpaRepository|주입/참조 저장소|CropJpaRepository|protected|@Autowired; backend/src/test/java/com/cell/platform/context/RepositoryContext.java:30|
|C-146|field|protected SubmissionJpaRepository submissionJpaRepository|주입/참조 저장소|SubmissionJpaRepository|protected|@Autowired; backend/src/test/java/com/cell/platform/context/RepositoryContext.java:33|

#### C-147 — AuthControllerTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:27`.
- 선언 annotation: `@WebMvcTest(AuthController.class)`, `@AutoConfigureMockMvc(addFilters = false)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-147|field|private MockMvc mockMvc|선언된 상태/설정/응답 값|MockMvc|private|@Autowired; backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:29|
|C-147|field|private ObjectMapper objectMapper|선언된 상태/설정/응답 값|ObjectMapper|private|@Autowired; backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:32|
|C-147|field|private AuthService authService|주입/참조 업무 서비스|AuthService|private|@MockBean; backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:35|
|C-147|field|private JwtTokenProvider jwtTokenProvider|선언된 상태/설정/응답 값|JwtTokenProvider|private|@MockBean; backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:38|

#### C-148 — 회원가입_API는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:42`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-148|method|void 정상_요청이면_200을_반환한다() throws Exception|업무/보조 처리; 명시 호출 Map.of, RegisterResponse.active, authService.register, mockMvc.perform, objectMapper.writeValueAsString|void|package-private|@Test; backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:44|
|C-148|method|void username이_빈값이면_400을_반환한다() throws Exception|업무/보조 처리; 명시 호출 Map.of, mockMvc.perform, objectMapper.writeValueAsString|void|package-private|@Test; backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:61|

#### C-149 — 로그인_API는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:79`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-149|method|void 정상_요청이면_토큰을_반환한다() throws Exception|업무/보조 처리; 명시 호출 LoginResponse.of, Map.of, authService.login, mockMvc.perform, objectMapper.writeValueAsString|void|package-private|@Test; backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java:81|

#### C-150 — CropControllerTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:33`.
- 선언 annotation: `@WebMvcTest(CropController.class)`, `@Import(SecurityConfig.class)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-150|field|private MockMvc mockMvc|선언된 상태/설정/응답 값|MockMvc|private|@Autowired; backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:35|
|C-150|field|private ObjectMapper objectMapper|선언된 상태/설정/응답 값|ObjectMapper|private|@Autowired; backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:38|
|C-150|field|private CropService cropService|주입/참조 업무 서비스|CropService|private|@MockBean; backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:41|
|C-150|field|private JwtTokenProvider jwtTokenProvider|선언된 상태/설정/응답 값|JwtTokenProvider|private|@MockBean; backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:44|

#### C-151 — 크롭_목록_조회_API는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:48`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-151|method|void 인증된_사용자가_요청하면_200을_반환한다() throws Exception|업무/보조 처리; 명시 호출 List.of, cropService.getCropsByTaskId, mockMvc.perform|void|package-private|@Test @WithMockUser(roles = "STUDENT"); backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:50|

#### C-152 — 정답_확정_API는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:67`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-152|method|void EXPERT_권한이면_200을_반환한다() throws Exception|업무/보조 처리; 명시 호출 Map.of, mockMvc.perform, objectMapper.writeValueAsString|void|package-private|@Test @WithMockUser(roles = "EXPERT"); backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:69|
|C-152|method|void STUDENT_권한이면_403을_반환한다() throws Exception|업무/보조 처리; 명시 호출 Map.of, mockMvc.perform, objectMapper.writeValueAsString|void|package-private|@Test @WithMockUser(roles = "STUDENT"); backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:83|

#### C-153 — 학습_데이터_조회_API는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:98`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-153|method|void 확정된_데이터_목록을_반환한다() throws Exception|업무/보조 처리; 명시 호출 List.of, cropService.getConfirmedTrainingData, mockMvc.perform|void|package-private|@Test @WithMockUser(roles = "EXPERT"); backend/src/test/java/com/cell/platform/controller/CropControllerTest.java:100|

#### C-154 — StatsControllerTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:27`.
- 선언 annotation: `@WebMvcTest(StatsController.class)`, `@Import(SecurityConfig.class)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-154|field|private MockMvc mockMvc|선언된 상태/설정/응답 값|MockMvc|private|@Autowired; backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:29|
|C-154|field|private StatsService statsService|주입/참조 업무 서비스|StatsService|private|@MockBean; backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:32|
|C-154|field|private JwtTokenProvider jwtTokenProvider|선언된 상태/설정/응답 값|JwtTokenProvider|private|@MockBean; backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:35|
|C-154|method|private CropStatsResponse createStatsResponse()|생성·저장·구성; 명시 호출 CropStatsResponse.builder, List.of, votes.put|CropStatsResponse|private|; backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:38|

#### C-155 — 과제별_통계_API는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:58`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-155|method|void EXPERT_권한이면_200을_반환한다() throws Exception|업무/보조 처리; 명시 호출 List.of, mockMvc.perform, statsService.getTaskStats|void|package-private|@Test @WithMockUser(roles = "EXPERT"); backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:60|

#### C-156 — 전체_통계_API는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:76`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-156|method|void EXPERT_권한이면_200을_반환한다() throws Exception|업무/보조 처리; 명시 호출 List.of, mockMvc.perform, statsService.getAllStats|void|package-private|@Test @WithMockUser(roles = "EXPERT"); backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:78|
|C-156|method|void STUDENT_권한이면_403을_반환한다() throws Exception|업무/보조 처리; 명시 호출 mockMvc.perform|void|package-private|@Test @WithMockUser(roles = "STUDENT"); backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:90|
|C-156|method|void 인증되지_않은_사용자는_401을_반환한다() throws Exception|업무/보조 처리; 명시 호출 mockMvc.perform|void|package-private|@Test; backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java:97|

#### C-157 — StudentAnalyticsControllerTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/StudentAnalyticsControllerTest.java:22`.
- 선언 annotation: `@WebMvcTest(StudentAnalyticsController.class)`, `@Import(SecurityConfig.class)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-157|field|MockMvc mvc|선언된 상태/설정/응답 값|MockMvc|package-private|@Autowired; backend/src/test/java/com/cell/platform/controller/StudentAnalyticsControllerTest.java:23|
|C-157|field|StudentAnalyticsService service|주입/참조 업무 서비스|StudentAnalyticsService|package-private|@MockBean; backend/src/test/java/com/cell/platform/controller/StudentAnalyticsControllerTest.java:24|
|C-157|field|JwtTokenProvider jwtTokenProvider|선언된 상태/설정/응답 값|JwtTokenProvider|package-private|@MockBean; backend/src/test/java/com/cell/platform/controller/StudentAnalyticsControllerTest.java:25|
|C-157|method|void professorCanReadStudentHistoryAndTaskDetails() throws Exception|업무/보조 처리; 명시 호출 List.of, StudentLearningResponse.TaskDetail, mvc.perform, service.getHistory, service.getTaskDetail|void|package-private|@Test @WithMockUser(roles = "EXPERT"); backend/src/test/java/com/cell/platform/controller/StudentAnalyticsControllerTest.java:27|
|C-157|method|void adminCanReadHistory() throws Exception|업무/보조 처리; 명시 호출 List.of, mvc.perform, service.getHistory|void|package-private|@Test @WithMockUser(roles = "ADMIN"); backend/src/test/java/com/cell/platform/controller/StudentAnalyticsControllerTest.java:36|
|C-157|method|void studentsCannotReadEvenTheirOwnUnreleasedAnalytics() throws Exception|업무/보조 처리; 명시 호출 mvc.perform|void|package-private|@Test @WithMockUser(username = "s1", roles = "STUDENT"); backend/src/test/java/com/cell/platform/controller/StudentAnalyticsControllerTest.java:43|
|C-157|method|void anonymousRequestsAreRejected() throws Exception|업무/보조 처리; 명시 호출 mvc.perform|void|package-private|@Test; backend/src/test/java/com/cell/platform/controller/StudentAnalyticsControllerTest.java:51|

#### C-158 — SubmissionControllerTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:32`.
- 선언 annotation: `@WebMvcTest(SubmissionController.class)`, `@Import(SecurityConfig.class)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-158|field|private MockMvc mockMvc|선언된 상태/설정/응답 값|MockMvc|private|@Autowired; backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:34|
|C-158|field|private ObjectMapper objectMapper|선언된 상태/설정/응답 값|ObjectMapper|private|@Autowired; backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:37|
|C-158|field|private SubmissionService submissionService|주입/참조 업무 서비스|SubmissionService|private|@MockBean; backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:40|
|C-158|field|private JwtTokenProvider jwtTokenProvider|선언된 상태/설정/응답 값|JwtTokenProvider|private|@MockBean; backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:43|

#### C-159 — 답안_제출_API는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:47`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-159|method|void 정상_요청이면_200을_반환한다() throws Exception|업무/보조 처리; 명시 호출 Map.of, mockMvc.perform, objectMapper.writeValueAsString|void|package-private|@Test @WithMockUser(roles = "STUDENT"); backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:49|
|C-159|method|void 인증되지_않은_사용자는_401을_반환한다() throws Exception|업무/보조 처리; 명시 호출 Map.of, mockMvc.perform, objectMapper.writeValueAsString|void|package-private|@Test; backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:68|

#### C-160 — 풀이_이력_조회_API는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:87`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-160|method|void 풀이한_크롭_ID_목록을_반환한다() throws Exception|업무/보조 처리; 명시 호출 List.of, mockMvc.perform, submissionService.getSolvedCropIds|void|package-private|@Test @WithMockUser(roles = "STUDENT"); backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:89|

#### C-161 — 내_결과_조회_API는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:105`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-161|method|void 정답률과_상세_결과를_반환한다() throws Exception|업무/보조 처리; 명시 호출 Detail.builder, List.of, MyResultsResponse.builder, mockMvc.perform, submissionService.getMyResults|void|package-private|@Test @WithMockUser(roles = "STUDENT"); backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java:107|

#### C-162 — TaskControllerTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:34`.
- 선언 annotation: `@WebMvcTest(TaskController.class)`, `@Import(SecurityConfig.class)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-162|field|private MockMvc mockMvc|선언된 상태/설정/응답 값|MockMvc|private|@Autowired; backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:36|
|C-162|field|private TaskService taskService|주입/참조 업무 서비스|TaskService|private|@MockBean; backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:39|
|C-162|field|private DiagnosticTaskService diagnosticTaskService|주입/참조 업무 서비스|DiagnosticTaskService|private|@MockBean; backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:42|
|C-162|field|private JwtTokenProvider jwtTokenProvider|선언된 상태/설정/응답 값|JwtTokenProvider|private|@MockBean; backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:45|

#### C-163 — 과제_목록_조회_API는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:49`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-163|method|void 인증된_사용자가_요청하면_200을_반환한다() throws Exception|업무/보조 처리; 명시 호출 IN_PROGRESS.name, List.of, LocalDateTime.now, mockMvc.perform, taskService.getAllTasks|void|package-private|@Test @WithMockUser(roles = "STUDENT"); backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:51|
|C-163|method|void 인증되지_않은_사용자는_401을_반환한다() throws Exception|업무/보조 처리; 명시 호출 mockMvc.perform|void|package-private|@Test; backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:69|

#### C-164 — 이미지_업로드_API는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:77`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-164|method|void EXPERT_권한이면_200을_반환한다() throws Exception|업무/보조 처리; 명시 호출 List.of, TaskUploadResponse.of, mockMvc.perform, taskService.createTask|void|package-private|@Test @WithMockUser(roles = "EXPERT"); backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:79|
|C-164|method|void STUDENT_권한이면_403을_반환한다() throws Exception|업무/보조 처리; 명시 호출 mockMvc.perform|void|package-private|@Test @WithMockUser(roles = "STUDENT"); backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java:97|

#### C-165 — CropTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/domain/CropTest.java:10`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-165|명시 멤버 없음|—|상속/annotation 생성 경로는 선언 참조|—|—|backend/src/test/java/com/cell/platform/domain/CropTest.java:10|

#### C-166 — Crop은

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/domain/CropTest.java:13`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-166|method|void 정상적인_인자가_들어오면_객체가_생성된다()|업무/보조 처리; 명시 호출 Crop.create, crop.getAiConfidence, crop.getAiPrediction, crop.getBbox, crop.getCropFilename|void|package-private|@Test; backend/src/test/java/com/cell/platform/domain/CropTest.java:15|

#### C-167 — SubmissionTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/domain/SubmissionTest.java:10`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-167|명시 멤버 없음|—|상속/annotation 생성 경로는 선언 참조|—|—|backend/src/test/java/com/cell/platform/domain/SubmissionTest.java:10|

#### C-168 — Submission은

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/domain/SubmissionTest.java:13`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-168|method|void 정상적인_인자가_들어오면_객체가_생성된다()|업무/보조 처리; 명시 호출 Submission.create, submission.getCropId, submission.getId, submission.getStudentId, submission.getStudentLabel|void|package-private|@Test; backend/src/test/java/com/cell/platform/domain/SubmissionTest.java:15|

#### C-169 — TaskTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/domain/TaskTest.java:10`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-169|명시 멤버 없음|—|상속/annotation 생성 경로는 선언 참조|—|—|backend/src/test/java/com/cell/platform/domain/TaskTest.java:10|

#### C-170 — Task는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/domain/TaskTest.java:13`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-170|method|void 정상적인_인자가_들어오면_객체가_생성된다()|업무/보조 처리; 명시 호출 Task.create, task.getCreatedAt, task.getCrops, task.getId, task.getOriginalFilename|void|package-private|@Test; backend/src/test/java/com/cell/platform/domain/TaskTest.java:15|

#### C-171 — UserTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/domain/UserTest.java:17`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-171|명시 멤버 없음|—|상속/annotation 생성 경로는 선언 참조|—|—|backend/src/test/java/com/cell/platform/domain/UserTest.java:17|

#### C-172 — User는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/domain/UserTest.java:20`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-172|method|void 정상적인_인자가_들어오면_객체가_생성된다()|업무/보조 처리; 명시 호출 User.create, user.getCreatedAt, user.getPassword, user.getRole, user.getUsername|void|package-private|@Test; backend/src/test/java/com/cell/platform/domain/UserTest.java:22|
|C-172|method|void 잘못된_인자가_들어오면_예외가_발생한다(String username, String password)|업무/보조 처리; 명시 호출 User.builder|void|package-private|@ParameterizedTest @MethodSource("provideInvalidContent"); backend/src/test/java/com/cell/platform/domain/UserTest.java:39|
|C-172|method|private static Stream&lt;Arguments&gt; provideInvalidContent()|업무/보조 처리; 명시 호출 Arguments.of, Stream.of|Stream&lt;Arguments&gt;|private|; backend/src/test/java/com/cell/platform/domain/UserTest.java:55|

#### C-173 — CropEntityTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/entity/CropEntityTest.java:13`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-173|명시 멤버 없음|—|상속/annotation 생성 경로는 선언 참조|—|—|backend/src/test/java/com/cell/platform/entity/CropEntityTest.java:13|

#### C-174 — CropEntity는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/entity/CropEntityTest.java:16`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-174|method|void 빌더로_정상적으로_생성된다()|업무/보조 처리; 명시 호출 CropEntity.builder, TaskEntity.builder, crop.getAiConfidence, crop.getAiPrediction, crop.getCropFilename|void|package-private|@Test; backend/src/test/java/com/cell/platform/entity/CropEntityTest.java:18|

#### C-175 — updateFinalLabel_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/entity/CropEntityTest.java:44`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-175|method|void 최종_라벨을_정상적으로_변경한다()|업무/보조 처리; 명시 호출 CropEntity.builder, crop.getFinalLabel, crop.updateFinalLabel|void|package-private|@Test; backend/src/test/java/com/cell/platform/entity/CropEntityTest.java:46|

#### C-176 — getTaskId_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/entity/CropEntityTest.java:62`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-176|method|void Task가_null이면_null을_반환한다()|업무/보조 처리; 명시 호출 CropEntity.builder, crop.getTaskId|void|package-private|@Test; backend/src/test/java/com/cell/platform/entity/CropEntityTest.java:64|

#### C-177 — SubmissionEntityTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/entity/SubmissionEntityTest.java:14`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-177|명시 멤버 없음|—|상속/annotation 생성 경로는 선언 참조|—|—|backend/src/test/java/com/cell/platform/entity/SubmissionEntityTest.java:14|

#### C-178 — SubmissionEntity는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/entity/SubmissionEntityTest.java:17`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-178|method|void 빌더로_정상적으로_생성된다()|업무/보조 처리; 명시 호출 CropEntity.builder, SubmissionEntity.builder, TaskEntity.builder, submission.getCrop, submission.getId|void|package-private|@Test; backend/src/test/java/com/cell/platform/entity/SubmissionEntityTest.java:19|

#### C-179 — TaskEntityTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/entity/TaskEntityTest.java:13`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-179|명시 멤버 없음|—|상속/annotation 생성 경로는 선언 참조|—|—|backend/src/test/java/com/cell/platform/entity/TaskEntityTest.java:13|

#### C-180 — TaskEntity는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/entity/TaskEntityTest.java:16`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-180|method|void 빌더로_정상적으로_생성된다()|업무/보조 처리; 명시 호출 TaskEntity.builder, task.getCrops, task.getId, task.getOriginalFilename, task.getStatus|void|package-private|@Test; backend/src/test/java/com/cell/platform/entity/TaskEntityTest.java:18|

#### C-181 — addCrop_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/entity/TaskEntityTest.java:38`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-181|method|void CropEntity를_추가하고_양방향_관계를_설정한다()|업무/보조 처리; 명시 호출 CropEntity.builder, TaskEntity.builder, crop.getTask, task.addCrop, task.getCrops|void|package-private|@Test; backend/src/test/java/com/cell/platform/entity/TaskEntityTest.java:40|

#### C-182 — UserEntityTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/entity/UserEntityTest.java:11`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-182|명시 멤버 없음|—|상속/annotation 생성 경로는 선언 참조|—|—|backend/src/test/java/com/cell/platform/entity/UserEntityTest.java:11|

#### C-183 — UserEntity는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/entity/UserEntityTest.java:14`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-183|method|void 빌더로_정상적으로_생성된다()|업무/보조 처리; 명시 호출 UserEntity.builder, user.getId, user.getPassword, user.getRole, user.getUsername|void|package-private|@Test; backend/src/test/java/com/cell/platform/entity/UserEntityTest.java:16|

#### C-184 — CropFixture

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/fixture/CropFixture.java:8`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-184|method|public static Crop createDomain()|생성·저장·구성; 명시 호출 Crop.builder|Crop|public|; backend/src/test/java/com/cell/platform/fixture/CropFixture.java:10|
|C-184|method|public static Crop createDomainWithFinalLabel()|생성·저장·구성; 명시 호출 Crop.builder|Crop|public|; backend/src/test/java/com/cell/platform/fixture/CropFixture.java:21|
|C-184|method|public static CropEntity createEntity(TaskEntity task)|생성·저장·구성; 명시 호출 CropEntity.builder|CropEntity|public|; backend/src/test/java/com/cell/platform/fixture/CropFixture.java:33|

#### C-185 — SubmissionFixture

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/fixture/SubmissionFixture.java:8`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-185|method|public static Submission createDomain()|생성·저장·구성; 명시 호출 Submission.builder|Submission|public|; backend/src/test/java/com/cell/platform/fixture/SubmissionFixture.java:10|
|C-185|method|public static SubmissionEntity createEntity(CropEntity crop)|생성·저장·구성; 명시 호출 SubmissionEntity.builder|SubmissionEntity|public|; backend/src/test/java/com/cell/platform/fixture/SubmissionFixture.java:19|

#### C-186 — TaskFixture

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/fixture/TaskFixture.java:9`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-186|method|public static Task createDomain()|생성·저장·구성; 명시 호출 Task.builder|Task|public|; backend/src/test/java/com/cell/platform/fixture/TaskFixture.java:11|
|C-186|method|public static TaskEntity createEntity()|생성·저장·구성; 명시 호출 TaskEntity.builder|TaskEntity|public|; backend/src/test/java/com/cell/platform/fixture/TaskFixture.java:21|

#### C-187 — UserFixture

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/fixture/UserFixture.java:7`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-187|method|public static User createDomain()|생성·저장·구성; 명시 호출 User.builder|User|public|; backend/src/test/java/com/cell/platform/fixture/UserFixture.java:9|
|C-187|method|public static UserEntity createEntity()|생성·저장·구성; 명시 호출 UserEntity.builder|UserEntity|public|; backend/src/test/java/com/cell/platform/fixture/UserFixture.java:18|

#### C-188 — CropCoreRepositoryTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:22`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-188|field|private CropRepository cropRepository|주입/참조 저장소|CropRepository|private|@Autowired; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:24|
|C-188|field|private CropCoreRepository cropCoreRepository|주입/참조 저장소|CropCoreRepository|private|@Autowired; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:27|
|C-188|field|private TaskRepository taskRepository|주입/참조 저장소|TaskRepository|private|@Autowired; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:30|
|C-188|field|private Task savedTask|선언된 상태/설정/응답 값|Task|private|; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:33|
|C-188|method|void setUp()|업무/보조 처리; 명시 호출 Crop.create, Task.create, task.getCrops, taskRepository.save|void|package-private|@BeforeEach; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:35|

#### C-189 — save_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:46`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-189|method|void 크롭을_저장하고_ID를_부여한다()|업무/보조 처리; 명시 호출 Crop.builder, cropRepository.save, saved.getAiConfidence, saved.getAiPrediction, saved.getCropFilename|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:48|

#### C-190 — findById_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:75`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-190|method|void 존재하는_크롭을_조회한다()|업무/보조 처리; 명시 호출 cropRepository.findById, found.get, savedTask.getCrops|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:77|

#### C-191 — findAllByTaskId_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:92`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-191|method|void 해당_과제의_크롭만_반환한다()|업무/보조 처리; 명시 호출 cropRepository.findAllByTaskId, savedTask.getId|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:94|

#### C-192 — findAllByFinalLabelIsNotNull_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:105`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-192|method|void 확정된_크롭만_반환한다()|업무/보조 처리; 명시 호출 confirmed.get, cropCoreRepository.findEntityById, cropJpaRepository.flush, cropRepository.findAllByFinalLabelIsNotNull, entity.updateFinalLabel|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:107|
|C-192|method|void 확정된_크롭이_없으면_빈_리스트를_반환한다()|업무/보조 처리; 명시 호출 cropRepository.findAllByFinalLabelIsNotNull|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:122|

#### C-193 — findAll_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:129`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-193|method|void 전체_크롭을_반환한다()|업무/보조 처리; 명시 호출 cropRepository.findAll|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:131|

#### C-194 — findEntityById_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:138`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-194|method|void 존재하는_크롭_엔티티를_반환한다()|업무/보조 처리; 명시 호출 cropCoreRepository.findEntityById, entity.getCropFilename, savedTask.getCrops|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:140|
|C-194|method|void 존재하지_않는_크롭이면_null을_반환한다()|업무/보조 처리; 명시 호출 cropCoreRepository.findEntityById|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java:155|

#### C-195 — SubmissionCoreRepositoryTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:20`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-195|field|private SubmissionRepository submissionRepository|주입/참조 저장소|SubmissionRepository|private|@Autowired; backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:22|
|C-195|field|private TaskRepository taskRepository|주입/참조 저장소|TaskRepository|private|@Autowired; backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:25|
|C-195|field|private Task savedTask|선언된 상태/설정/응답 값|Task|private|; backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:28|
|C-195|method|void setUp()|업무/보조 처리; 명시 호출 Crop.create, Task.create, task.getCrops, taskRepository.save|void|package-private|@BeforeEach; backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:30|

#### C-196 — save_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:41`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-196|method|void 제출_답안을_저장하고_ID를_부여한다()|업무/보조 처리; 명시 호출 Submission.create, saved.getCropId, saved.getId, saved.getStudentId, saved.getStudentLabel|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:43|

#### C-197 — findAllByCropIdIn_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:64`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-197|method|void 크롭_ID_목록에_해당하는_제출을_반환한다()|업무/보조 처리; 명시 호출 List.of, Submission.create, savedTask.getCrops, submissionRepository.findAllByCropIdIn, submissionRepository.save|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:66|
|C-197|method|void 해당하는_제출이_없으면_빈_리스트를_반환한다()|업무/보조 처리; 명시 호출 List.of, submissionRepository.findAllByCropIdIn|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:81|

#### C-198 — findAllByCropIdInAndStudentId_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:88`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-198|method|void 특정_학생의_제출만_반환한다()|업무/보조 처리; 명시 호출 List.of, Submission.create, result.get, savedTask.getCrops, submissionRepository.save|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java:90|

#### C-199 — TaskCoreRepositoryTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:18`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-199|field|private TaskRepository taskRepository|주입/참조 저장소|TaskRepository|private|@Autowired; backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:20|

#### C-200 — save_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:24`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-200|method|void 과제를_저장하고_ID를_부여한다()|업무/보조 처리; 명시 호출 Task.create, saved.getCreatedAt, saved.getId, saved.getOriginalFilename, saved.getUploadedFilename|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:26|
|C-200|method|void 과제와_크롭을_함께_저장한다()|업무/보조 처리; 명시 호출 Crop.create, Task.create, saved.getCrops, task.getCrops, taskRepository.save|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:43|

#### C-201 — findById_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:63`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-201|method|void 존재하는_과제를_조회한다()|업무/보조 처리; 명시 호출 Task.create, found.get, saved.getId, taskRepository.findById, taskRepository.save|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:65|
|C-201|method|void 존재하지_않는_과제는_빈값을_반환한다()|업무/보조 처리; 명시 호출 taskRepository.findById|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:78|

#### C-202 — findAllByOrderByIdDesc_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:85`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-202|method|void ID_내림차순으로_정렬된_과제를_반환한다()|업무/보조 처리; 명시 호출 Task.create, taskRepository.findAllByOrderByIdDesc, taskRepository.save, tasks.get|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java:87|

#### C-203 — UserCoreRepositoryTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:16`.
- 선언 annotation: 별도 class annotation 없음.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-203|field|private UserRepository userRepository|주입/참조 저장소|UserRepository|private|@Autowired; backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:18|

#### C-204 — save_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:22`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-204|method|void 사용자를_저장하고_ID를_부여한다()|업무/보조 처리; 명시 호출 User.create, saved.getCreatedAt, saved.getId, saved.getPassword, saved.getRole|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:24|

#### C-205 — findByUsername_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:44`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-205|method|void 존재하는_사용자를_조회한다()|업무/보조 처리; 명시 호출 User.create, found.get, userRepository.findByUsername, userRepository.save|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:46|
|C-205|method|void 존재하지_않는_사용자는_빈값을_반환한다()|업무/보조 처리; 명시 호출 userRepository.findByUsername|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:60|

#### C-206 — existsByUsername_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:71`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-206|method|void 존재하는_아이디면_true를_반환한다()|업무/보조 처리; 명시 호출 User.create, userRepository.existsByUsername, userRepository.save|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:73|
|C-206|method|void 존재하지_않는_아이디면_false를_반환한다()|업무/보조 처리; 명시 호출 userRepository.existsByUsername|void|package-private|@Test; backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java:82|

#### C-207 — AuthServiceTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:31`.
- 선언 annotation: `@ExtendWith(MockitoExtension.class)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-207|field|private AuthService authService|주입/참조 업무 서비스|AuthService|private|@InjectMocks; backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:33|
|C-207|field|private UserRepository userRepository|주입/참조 저장소|UserRepository|private|@Mock; backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:34|
|C-207|field|private StudentRosterJpaRepository studentRosterJpaRepository|주입/참조 저장소|StudentRosterJpaRepository|private|@Mock; backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:35|
|C-207|field|private PasswordEncoder passwordEncoder|선언된 상태/설정/응답 값|PasswordEncoder|private|@Mock; backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:36|
|C-207|field|private JwtTokenProvider jwtTokenProvider|선언된 상태/설정/응답 값|JwtTokenProvider|private|@Mock; backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:37|

#### C-208 — register_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:40`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-208|method|void 정상적으로_회원가입한다()|업무/보조 처리; 명시 호출 authService.register, i.getArgument, passwordEncoder.encode, userRepository.existsByUsername, userRepository.save|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:42|
|C-208|method|void 중복된_아이디면_예외가_발생한다()|업무/보조 처리; 명시 호출 authService.register, userRepository.existsByUsername|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:53|

#### C-209 — login_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:63`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-209|method|void 정상적으로_로그인한다()|업무/보조 처리; 명시 호출 Optional.of, User.builder, authService.login, jwtTokenProvider.generateToken, passwordEncoder.matches|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:65|
|C-209|method|void 아이디가_없으면_예외가_발생한다()|업무/보조 처리; 명시 호출 Optional.empty, authService.login, userRepository.findByUsername|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:79|
|C-209|method|void 비밀번호가_틀리면_예외가_발생한다()|업무/보조 처리; 명시 호출 Optional.of, User.builder, authService.login, passwordEncoder.matches, userRepository.findByUsername|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/AuthServiceTest.java:87|

#### C-210 — CropServiceTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/service/CropServiceTest.java:27`.
- 선언 annotation: `@ExtendWith(MockitoExtension.class)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-210|field|private CropService cropService|주입/참조 업무 서비스|CropService|private|; backend/src/test/java/com/cell/platform/service/CropServiceTest.java:29|
|C-210|field|private CropRepository cropRepository|주입/참조 저장소|CropRepository|private|@Mock; backend/src/test/java/com/cell/platform/service/CropServiceTest.java:30|
|C-210|field|private CropCoreRepository cropCoreRepository|주입/참조 저장소|CropCoreRepository|private|@Mock; backend/src/test/java/com/cell/platform/service/CropServiceTest.java:31|
|C-210|method|void setUp()|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|package-private|@BeforeEach; backend/src/test/java/com/cell/platform/service/CropServiceTest.java:33|

#### C-211 — getCropsByTaskId_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/service/CropServiceTest.java:39`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-211|method|void 해당_과제의_크롭_목록을_반환한다()|업무/보조 처리; 명시 호출 CropFixture.createDomain, List.of, cropRepository.findAllByTaskId, cropService.getCropsByTaskId|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/CropServiceTest.java:41|

#### C-212 — getConfirmedTrainingData_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/service/CropServiceTest.java:52`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-212|method|void 확정된_크롭만_반환한다()|업무/보조 처리; 명시 호출 CropFixture.createDomainWithFinalLabel, List.of, cropRepository.findAllByFinalLabelIsNotNull, cropService.getConfirmedTrainingData|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/CropServiceTest.java:54|

#### C-213 — confirmLabel_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/service/CropServiceTest.java:66`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-213|method|void 정상적으로_라벨을_확정한다()|업무/보조 처리; 명시 호출 CropFixture.createEntity, TaskFixture.createEntity, cropCoreRepository.findEntityById, cropService.confirmLabel, entity.getFinalLabel|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/CropServiceTest.java:68|
|C-213|method|void 크롭이_없으면_예외가_발생한다()|업무/보조 처리; 명시 호출 cropCoreRepository.findEntityById, cropService.confirmLabel|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/CropServiceTest.java:78|
|C-213|method|void 유효하지_않은_셀타입이면_예외가_발생한다()|업무/보조 처리; 명시 호출 cropService.confirmLabel|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/CropServiceTest.java:86|

#### C-214 — StatsServiceTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:24`.
- 선언 annotation: `@ExtendWith(MockitoExtension.class)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-214|field|private StatsService statsService|주입/참조 업무 서비스|StatsService|private|@InjectMocks; backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:26|
|C-214|field|private CropRepository cropRepository|주입/참조 저장소|CropRepository|private|@Mock; backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:27|
|C-214|field|private SubmissionRepository submissionRepository|주입/참조 저장소|SubmissionRepository|private|@Mock; backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:28|
|C-214|field|private UserRepository userRepository|주입/참조 저장소|UserRepository|private|@Mock; backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:29|

#### C-215 — getTaskStats_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:32`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-215|method|void hardScore_내림차순으로_정렬된다()|업무/보조 처리; 명시 호출 Crop.builder, CropFixture.createDomainWithFinalLabel, List.of, cropRepository.findAllByTaskId, result.get|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:34|

#### C-216 — getAllStats_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:52`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-216|method|void errorRate_내림차순으로_정렬된다()|업무/보조 처리; 명시 호출 CropFixture.createDomainWithFinalLabel, List.of, Submission.builder, cropRepository.findAll, result.get|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:54|
|C-216|method|void voteDistribution에_모든_셀타입이_포함된다()|업무/보조 처리; 명시 호출 CropFixture.createDomain, List.of, cropRepository.findAll, result.get, statsService.getAllStats|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/StatsServiceTest.java:69|

#### C-217 — StudentAnalyticsServiceTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:24`.
- 선언 annotation: `@ExtendWith(MockitoExtension.class)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-217|field|TaskRepository tasks|주입/참조 저장소|TaskRepository|package-private|@Mock; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:25|
|C-217|field|CropRepository crops|주입/참조 저장소|CropRepository|package-private|@Mock; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:26|
|C-217|field|SubmissionRepository submissions|주입/참조 저장소|SubmissionRepository|package-private|@Mock; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:27|
|C-217|field|UserRepository users|주입/참조 저장소|UserRepository|package-private|@Mock; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:28|
|C-217|field|DiagnosticDatasetService dataset|주입/참조 업무 서비스|DiagnosticDatasetService|package-private|@Mock; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:29|
|C-217|field|ConfusionMatrixRepository matrices|주입/참조 저장소|ConfusionMatrixRepository|package-private|@Mock; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:30|
|C-217|field|StudentAnalyticsService service|주입/참조 업무 서비스|StudentAnalyticsService|package-private|; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:31|
|C-217|method|void setup()|업무/보조 처리; 필드 직접 처리 또는 자체 메서드 호출(구체 알고리즘 참조)|void|package-private|@BeforeEach; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:33|
|C-217|method|private Task task(long id, Long assignmentId)|업무/보조 처리; 명시 호출 Task.builder|Task|private|; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:39|
|C-217|method|private Crop crop(long id, long taskId, CellType label)|업무/보조 처리; 명시 호출 Crop.builder|Crop|private|; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:43|
|C-217|method|private Submission answer(long cropId, CellType label)|업무/보조 처리; 명시 호출 Submission.builder|Submission|private|; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:47|
|C-217|method|void groupsAssignmentsAndSeparatesPendingFromWrongAndUnanswered()|업무/보조 처리; 명시 호출 List.of, assignment.scopeId, assignment.scopeType, assignment.summary, assignment.tasks|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:51|
|C-217|method|void taskDetailIncludesUnansweredCellsAndUsesAllCellsAsDenominator()|업무/보조 처리; 명시 호출 List.of, Optional.of, cell.cropId, crops.findAllByTaskId, detail.cells|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:78|
|C-217|method|void diagnosticUsesGtAndManifestButOrdinaryTasksRequireFinalLabels()|업무/보조 처리; 명시 호출 Crop.builder, List.of, Optional.of, Task.builder, crops.findAllByTaskIdIn|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:91|
|C-217|method|void studentsWithoutAnswersAndTasksWithoutCellsHaveNoArtificialCompletion()|업무/보조 처리; 명시 호출 List.of, crops.findAllByTaskIdIn, result.activities, service.getHistory, submissions.findAllByCropIdInAndStudentId|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:109|
|C-217|method|void missingTasksReturnNotFoundAndEmptyTaskListNeedsNoSubmissionQuery()|업무/보조 처리; 명시 호출 List.of, Optional.empty, service.getHistory, service.getTaskDetail, tasks.findAllByOrderByIdDesc|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java:122|

#### C-218 — TaskServiceTest

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:25`.
- 선언 annotation: `@ExtendWith(MockitoExtension.class)`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-218|field|private TaskService taskService|주입/참조 업무 서비스|TaskService|private|@InjectMocks; backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:27|
|C-218|field|private TaskRepository taskRepository|주입/참조 저장소|TaskRepository|private|@Mock; backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:28|
|C-218|field|private FileStorageService fileStorageService|주입/참조 업무 서비스|FileStorageService|private|@Mock; backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:29|
|C-218|field|private AiClientService aiClientService|주입/참조 업무 서비스|AiClientService|private|@Mock; backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:30|

#### C-219 — getAllTasks_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:33`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-219|method|void 전체_과제를_반환한다()|업무/보조 처리; 명시 호출 List.of, TaskFixture.createDomain, taskRepository.findAllByOrderByIdDesc, taskService.getAllTasks|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:35|
|C-219|method|void 과제가_없으면_빈_리스트를_반환한다()|업무/보조 처리; 명시 호출 List.of, taskRepository.findAllByOrderByIdDesc, taskService.getAllTasks|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:45|

#### C-220 — createTask_메서드는

- 역할: 시험/fixture/context 전용 선언. 운영 Spring 서비스 아님. 근거: `backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:56`.
- 선언 annotation: `@Nested`.

|C_ID|멤버 종류|이름·시그니처|설명/호출 관계|자료형·반환 타입|접근 제어자|참고/근거|
|---|---|---|---|---|---|---|
|C-220|method|void 파일_업로드와_AI_분석_후_과제를_생성한다()|업무/보조 처리; 명시 호출 List.of, TaskFixture.createDomain, aiClientService.analyze, aiResponse.getCells, file.getOriginalFilename|void|package-private|@Test; backend/src/test/java/com/cell/platform/service/TaskServiceTest.java:58|

## B. Python 클래스·함수와 프런트엔드 모듈

### B.1 Python 전체 명시 선언

AI routers/services/models/tools, 독립 컬러화 app/processing/persistence/tests, load_test를 포함한다. 미호출 재학습 골격·오프라인 준비도구·시험 스크립트는 실행 서비스와 구분한다. 외부 라이브러리 코드는 미포함. 함수 시그니처의 타입 주석은 소스 그대로이며 클래스가 없는 모듈에 임의 클래스를 만들지 않는다.

|PY_ID|범위/종류|소속·시그니처|역할/주의|멤버 필드(명시 주석)|근거|
|---|---|---|---|---|---|
|PY-001|AI 추론 서비스 / ClassDef|DetectedCell(BaseModel)|역할은 함수명·호출/API·ALG 참조|crop_filename:str @5; bbox:str @6; prediction:str @7; confidence:float @8|ai-server/app/models/__init__.py:4|
|PY-002|AI 추론 서비스 / ClassDef|AnalysisResponse(BaseModel)|역할은 함수명·호출/API·ALG 참조|total_detected:int @12; cells:list[DetectedCell] @13|ai-server/app/models/__init__.py:11|
|PY-003|AI 추론 서비스 / FunctionDef|AnalysisResponse.from_cells(cells: list[DetectedCell]) -&gt; 'AnalysisResponse'|역할은 함수명·호출/API·ALG 참조||ai-server/app/models/__init__.py:16|
|PY-004|AI 추론 서비스 / AsyncFunctionDef|analyze_image(file: UploadFile=File(...))|원본 이미지를 받아 YOLO 탐지 + DenseNet 분류 결과를 반환||ai-server/app/routers/analyze_router.py:13|
|PY-005|AI 추론 서비스 / FunctionDef|_check_models_ready()|역할은 함수명·호출/API·ALG 참조||ai-server/app/routers/analyze_router.py:20|
|PY-006|AI 추론 서비스 / AsyncFunctionDef|_save_uploaded_file(file: UploadFile) -&gt; str|역할은 함수명·호출/API·ALG 참조||ai-server/app/routers/analyze_router.py:25|
|PY-007|부분 구현/계획 / ClassDef|RetrainRequest(BaseModel)|재학습 요청 파라미터|epochs:int @15; batch_size:int @16; learning_rate:float @17|ai-server/app/routers/retrain_router.py:13|
|PY-008|부분 구현/계획 / ClassDef|RetrainResponse(BaseModel)|역할은 함수명·호출/API·ALG 참조|total_samples:int @21; label_distribution:dict[str, int] @22; status:str @23|ai-server/app/routers/retrain_router.py:20|
|PY-009|부분 구현/계획 / AsyncFunctionDef|retrain_model(request: RetrainRequest)|재학습 파이프라인:||ai-server/app/routers/retrain_router.py:27|
|PY-010|부분 구현/계획 / AsyncFunctionDef|_fetch_training_data() -&gt; list[dict]|Spring Boot 백엔드에서 확정된 학습 데이터 목록 조회||ai-server/app/routers/retrain_router.py:48|
|PY-011|부분 구현/계획 / FunctionDef|_validate_training_data(data: list[dict])|학습 데이터가 충분한지 검증||ai-server/app/routers/retrain_router.py:56|
|PY-012|부분 구현/계획 / FunctionDef|_crop_file_exists(filename: str) -&gt; bool|역할은 함수명·호출/API·ALG 참조||ai-server/app/routers/retrain_router.py:72|
|PY-013|부분 구현/계획 / FunctionDef|_count_labels(data: list[dict]) -&gt; dict[str, int]|역할은 함수명·호출/API·ALG 참조||ai-server/app/routers/retrain_router.py:76|
|PY-014|AI 추론 서비스 / ClassDef|ClassificationResult()|DenseNet 분류 결과|predicted_class:str @13; confidence:float @14|ai-server/app/services/classifier.py:11|
|PY-015|AI 추론 서비스 / ClassDef|ClassifierService()|DenseNet-201로 크롭된 세포 이미지를 분류하는 서비스|_transform:inferred / 미주석 @20|ai-server/app/services/classifier.py:17|
|PY-016|AI 추론 서비스 / FunctionDef|ClassifierService.classify(crop_path: str) -&gt; ClassificationResult|역할은 함수명·호출/API·ALG 참조||ai-server/app/services/classifier.py:27|
|PY-017|AI 추론 서비스 / FunctionDef|ClassifierService._preprocess(image_path: str) -&gt; torch.Tensor|역할은 함수명·호출/API·ALG 참조||ai-server/app/services/classifier.py:37|
|PY-018|AI 추론 서비스 / FunctionDef|ClassifierService._infer(input_tensor: torch.Tensor) -&gt; tuple[int, float]|역할은 함수명·호출/API·ALG 참조||ai-server/app/services/classifier.py:44|
|PY-019|AI 추론 서비스 / ClassDef|CroppedCell()|YOLO가 탐지하고 크롭한 개별 세포 정보|crop_filename:str @12; crop_path:str @13; bbox:list[int] @14|ai-server/app/services/detector.py:10|
|PY-020|AI 추론 서비스 / ClassDef|DetectorService()|YOLOv8로 원본 이미지에서 백혈구를 탐지하고 크롭하는 서비스||ai-server/app/services/detector.py:17|
|PY-021|AI 추론 서비스 / FunctionDef|DetectorService.detect_and_crop(image_path: str) -&gt; list[CroppedCell]|역할은 함수명·호출/API·ALG 참조||ai-server/app/services/detector.py:21|
|PY-022|AI 추론 서비스 / FunctionDef|DetectorService._crop_single(image, box) -&gt; CroppedCell|역할은 함수명·호출/API·ALG 참조||ai-server/app/services/detector.py:32|
|PY-023|AI 추론 서비스 / FunctionDef|DetectorService._extract_bbox(box) -&gt; list[int]|역할은 함수명·호출/API·ALG 참조||ai-server/app/services/detector.py:44|
|PY-024|AI 추론 서비스 / FunctionDef|DetectorService._crop_image(image, bbox: list[int])|역할은 함수명·호출/API·ALG 참조||ai-server/app/services/detector.py:48|
|PY-025|AI 추론 서비스 / FunctionDef|DetectorService._save_crop(cropped_image) -&gt; str|역할은 함수명·호출/API·ALG 참조||ai-server/app/services/detector.py:53|
|PY-026|AI 추론 서비스 / ClassDef|ModelLoader()|서버 시작 시 한 번만 모델을 로드하고, 전역에서 접근 가능하게 하는 싱글턴|yolo_model:inferred / 미주석 @10; densenet_model:inferred / 미주석 @11; device:inferred / 미주석 @12; _ready:inferred / 미주석 @13|ai-server/app/services/model_loader.py:7|
|PY-027|AI 추론 서비스 / FunctionDef|ModelLoader.load_all(cls)|역할은 함수명·호출/API·ALG 참조||ai-server/app/services/model_loader.py:16|
|PY-028|AI 추론 서비스 / FunctionDef|ModelLoader.is_ready(cls) -&gt; bool|역할은 함수명·호출/API·ALG 참조||ai-server/app/services/model_loader.py:24|
|PY-029|AI 추론 서비스 / FunctionDef|ModelLoader._resolve_device(cls)|역할은 함수명·호출/API·ALG 참조||ai-server/app/services/model_loader.py:28|
|PY-030|AI 추론 서비스 / FunctionDef|ModelLoader._load_yolo(cls) -&gt; YOLO|역할은 함수명·호출/API·ALG 참조||ai-server/app/services/model_loader.py:32|
|PY-031|AI 추론 서비스 / FunctionDef|ModelLoader._load_densenet(cls)|역할은 함수명·호출/API·ALG 참조||ai-server/app/services/model_loader.py:37|
|PY-032|AI 추론 서비스 / ClassDef|PipelineService()|탐지(YOLO) → 분류(DenseNet) 전체 파이프라인을 조율하는 서비스||ai-server/app/services/pipeline.py:6|
|PY-033|AI 추론 서비스 / FunctionDef|PipelineService.run(image_path: str) -&gt; AnalysisResponse|역할은 함수명·호출/API·ALG 참조||ai-server/app/services/pipeline.py:10|
|PY-034|AI 추론 서비스 / FunctionDef|PipelineService._process_single(cell) -&gt; DetectedCell|역할은 함수명·호출/API·ALG 참조||ai-server/app/services/pipeline.py:19|
|PY-035|AI 추론 서비스 / FunctionDef|startup()|역할은 함수명·호출/API·ALG 참조||ai-server/main.py:17|
|PY-036|AI 추론 서비스 / FunctionDef|health_check()|역할은 함수명·호출/API·ALG 참조||ai-server/main.py:25|
|PY-037|진단 데이터 오프라인 준비/검토(학습 아님) / FunctionDef|load_manifest() -&gt; list[dict]|역할은 함수명·호출/API·ALG 참조||ai-server/tools/build_diagnostic_gt_review.py:26|
|PY-038|진단 데이터 오프라인 준비/검토(학습 아님) / FunctionDef|reset_dir(path: Path) -&gt; None|역할은 함수명·호출/API·ALG 참조||ai-server/tools/build_diagnostic_gt_review.py:30|
|PY-039|진단 데이터 오프라인 준비/검토(학습 아님) / FunctionDef|copy_by_class(records: list[dict]) -&gt; dict[str, list[dict]]|역할은 함수명·호출/API·ALG 참조||ai-server/tools/build_diagnostic_gt_review.py:36|
|PY-040|진단 데이터 오프라인 준비/검토(학습 아님) / FunctionDef|draw_contact_sheet(label: str, items: list[dict]) -&gt; list[str]|역할은 함수명·호출/API·ALG 참조||ai-server/tools/build_diagnostic_gt_review.py:52|
|PY-041|진단 데이터 오프라인 준비/검토(학습 아님) / FunctionDef|main() -&gt; None|역할은 함수명·호출/API·ALG 참조||ai-server/tools/build_diagnostic_gt_review.py:87|
|PY-042|진단 데이터 오프라인 준비/검토(학습 아님) / ClassDef|CellRecord()|역할은 함수명·호출/API·ALG 참조|cell_id:str @25; label:str @26; class_id:int @27; source_image:str @28; source_label:str @29; crop_filename:str @30; bbox_xyxy:list[int] @31|ai-server/tools/prepare_diagnostic_gt_dataset.py:24|
|PY-043|진단 데이터 오프라인 준비/검토(학습 아님) / FunctionDef|yolo_to_xyxy(xc: float, yc: float, w: float, h: float, img_w: int, img_h: int) -&gt; list[int]|역할은 함수명·호출/API·ALG 참조||ai-server/tools/prepare_diagnostic_gt_dataset.py:45|
|PY-044|진단 데이터 오프라인 준비/검토(학습 아님) / FunctionDef|iter_label_lines(path: Path) -&gt; Iterable[tuple[int, float, float, float, float]]|역할은 함수명·호출/API·ALG 참조||ai-server/tools/prepare_diagnostic_gt_dataset.py:57|
|PY-045|진단 데이터 오프라인 준비/검토(학습 아님) / FunctionDef|prepare_dataset(root: Path=Path('C:\\CELL2\\CELL\\data\\diagnostic_gt')) -&gt; dict|역할은 함수명·호출/API·ALG 참조||ai-server/tools/prepare_diagnostic_gt_dataset.py:68|
|PY-046|진단 데이터 오프라인 준비/검토(학습 아님) / FunctionDef|CellRecord.to_dict(self) -&gt; dict|역할은 함수명·호출/API·ALG 참조||ai-server/tools/prepare_diagnostic_gt_dataset.py:33|
|PY-047|쓰기 가능한 부하/벤치 도구(이번 미실행) / FunctionDef|single_inference(url: str, image_path: str, results: list, idx: int)|역할은 함수명·호출/API·ALG 참조||load_test/ai_bench.py:22|
|PY-048|쓰기 가능한 부하/벤치 도구(이번 미실행) / FunctionDef|run_benchmark(url: str, image_path: str, concurrency: int, rounds: int=3)|역할은 함수명·호출/API·ALG 참조||load_test/ai_bench.py:44|
|PY-049|쓰기 가능한 부하/벤치 도구(이번 미실행) / ClassDef|StudentUser(HttpUser)|학생 60명이 동시에 라벨링하는 시나리오|wait_time:inferred / 미주석 @36|load_test/locustfile.py:31|
|PY-050|쓰기 가능한 부하/벤치 도구(이번 미실행) / ClassDef|ExpertUser(HttpUser)|교수 1명의 분석/확인 시나리오|wait_time:inferred / 미주석 @149; weight:inferred / 미주석 @150|load_test/locustfile.py:145|
|PY-051|쓰기 가능한 부하/벤치 도구(이번 미실행) / FunctionDef|StudentUser.on_start(self)|각 가상 유저 시작 시 로그인||load_test/locustfile.py:38|
|PY-052|쓰기 가능한 부하/벤치 도구(이번 미실행) / FunctionDef|StudentUser.auth_headers(self)|역할은 함수명·호출/API·ALG 참조||load_test/locustfile.py:58|
|PY-053|쓰기 가능한 부하/벤치 도구(이번 미실행) / FunctionDef|StudentUser.get_task_list(self)|과제 목록 조회||load_test/locustfile.py:62|
|PY-054|쓰기 가능한 부하/벤치 도구(이번 미실행) / FunctionDef|StudentUser.get_crops(self)|세포 이미지 목록 조회||load_test/locustfile.py:78|
|PY-055|쓰기 가능한 부하/벤치 도구(이번 미실행) / FunctionDef|StudentUser.submit_label(self)|세포 라벨 제출 (가장 빈번한 행동)||load_test/locustfile.py:97|
|PY-056|쓰기 가능한 부하/벤치 도구(이번 미실행) / FunctionDef|StudentUser.get_solved_crops(self)|내가 푼 세포 목록 조회 (진행률 체크)||load_test/locustfile.py:117|
|PY-057|쓰기 가능한 부하/벤치 도구(이번 미실행) / FunctionDef|StudentUser.load_crop_image(self)|세포 이미지 파일 로드 (nginx 정적 파일 서빙 부하)||load_test/locustfile.py:134|
|PY-058|쓰기 가능한 부하/벤치 도구(이번 미실행) / FunctionDef|StudentUser._is_diagnostic(self, task)|역할은 함수명·호출/API·ALG 참조||load_test/locustfile.py:140|
|PY-059|쓰기 가능한 부하/벤치 도구(이번 미실행) / FunctionDef|ExpertUser.on_start(self)|역할은 함수명·호출/API·ALG 참조||load_test/locustfile.py:152|
|PY-060|쓰기 가능한 부하/벤치 도구(이번 미실행) / FunctionDef|ExpertUser.auth_headers(self)|역할은 함수명·호출/API·ALG 참조||load_test/locustfile.py:163|
|PY-061|쓰기 가능한 부하/벤치 도구(이번 미실행) / FunctionDef|ExpertUser.view_all_stats(self)|역할은 함수명·호출/API·ALG 참조||load_test/locustfile.py:167|
|PY-062|쓰기 가능한 부하/벤치 도구(이번 미실행) / FunctionDef|ExpertUser.view_tasks(self)|역할은 함수명·호출/API·ALG 참조||load_test/locustfile.py:177|
|PY-063|독립 컬러화 / FunctionDef|default_acquisition_summary() -&gt; dict[str, Any]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:100|
|PY-064|독립 컬러화 / FunctionDef|_service_secret() -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:119|
|PY-065|독립 컬러화 / ClassDef|BatchItem()|역할은 함수명·호출/API·ALG 참조|item_id:str @145; batch_id:str @146; user_id:str @147; relative_path:str @148; original_relative_path:str @149; source_path:Path @150; content_hash:str @151; image_hash:str \| None @152; error:str \| None @153; acquisition:dict[str, Any] @154; lock:Any @155|컬러화POC/app.py:144|
|PY-066|독립 컬러화 / ClassDef|Batch()|역할은 함수명·호출/API·ALG 참조|batch_id:str @160; user_id:str @161; label:str @162; source_type:str @163; items:OrderedDict[str, BatchItem] @164; created_at:float @165|컬러화POC/app.py:159|
|PY-067|독립 컬러화 / ClassDef|ExportJob()|역할은 함수명·호출/API·ALG 참조|job_id:str @170; batch_id:str @171; user_id:str @172; job_type:str @173; format:str @174; jpeg_quality:int @175; status:str @176; processed_files:int @177; total_files:int @178; current_file:str @179; error_count:int @180; message:str @181; error:str \| None @182; result_path:Path \| None @183; created_at:float @184; finished_at:float \| None @185; cancel_event:threading.Event @186|컬러화POC/app.py:169|
|PY-068|독립 컬러화 / FunctionDef|configure_data_directory(path: Path) -&gt; None|Reconfigure persistence for tests or an embedded deployment.||컬러화POC/app.py:200|
|PY-069|독립 컬러화 / FunctionDef|current_user_id() -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:217|
|PY-070|독립 컬러화 / FunctionDef|_optional_float(value: Any) -&gt; float \| None|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:224|
|PY-071|독립 컬러화 / FunctionDef|canonical_settings(payload: dict[str, Any], *, default_invert: bool=True) -&gt; dict[str, Any]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:233|
|PY-072|독립 컬러화 / FunctionDef|utc_timestamp() -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:283|
|PY-073|독립 컬러화 / FunctionDef|configured_roi_labels(user_id: str) -&gt; list[str]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:287|
|PY-074|독립 컬러화 / FunctionDef|canonical_roi_label(value: Any) -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:293|
|PY-075|독립 컬러화 / FunctionDef|migrate_legacy_json_for_first_user(user_id: str) -&gt; None|Assign the former single-user JSON state to the first service account.||컬러화POC/app.py:304|
|PY-076|독립 컬러화 / FunctionDef|_integer_coordinate(value: Any, maximum: int, name: str) -&gt; int|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:366|
|PY-077|독립 컬러화 / FunctionDef|canonical_regions(payload: Any, image: DicomImage, user_id: str) -&gt; list[dict[str, Any]]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:381|
|PY-078|독립 컬러화 / FunctionDef|saved_annotations_for(item: BatchItem) -&gt; dict[str, Any] \| None|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:453|
|PY-079|독립 컬러화 / FunctionDef|annotation_summary(item: BatchItem, image: DicomImage) -&gt; dict[str, Any]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:459|
|PY-080|독립 컬러화 / FunctionDef|render_parameters(settings: dict[str, Any]) -&gt; dict[str, Any]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:476|
|PY-081|독립 컬러화 / FunctionDef|hash_file(path: Path) -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:491|
|PY-082|독립 컬러화 / FunctionDef|user_storage_bytes(user_id: str) -&gt; int|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:499|
|PY-083|독립 컬러화 / FunctionDef|save_uploaded_file(uploaded: Any, destination: Path, user_id: str) -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:510|
|PY-084|독립 컬러화 / FunctionDef|clean_relative_path(raw_path: str, fallback_name: str) -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:537|
|PY-085|독립 컬러화 / FunctionDef|unique_relative_path(batch: Batch, relative_path: str) -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:547|
|PY-086|독립 컬러화 / FunctionDef|clean_item_filename(raw_name: Any, current_path: str) -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:560|
|PY-087|독립 컬러화 / FunctionDef|renamed_relative_path(batch: Batch, item: BatchItem, raw_name: Any) -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:583|
|PY-088|독립 컬러화 / FunctionDef|_dicom_numeric_value(value: Any) -&gt; int \| float \| None|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:610|
|PY-089|독립 컬러화 / FunctionDef|dicom_acquisition_summary(dataset: Any) -&gt; dict[str, Any]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:622|
|PY-090|독립 컬러화 / FunctionDef|backfill_missing_acquisition_summaries() -&gt; dict[str, int]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:653|
|PY-091|독립 컬러화 / FunctionDef|inspect_dicom_image(path: Path) -&gt; tuple[str \| None, str \| None, dict[str, Any]]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:690|
|PY-092|독립 컬러화 / FunctionDef|create_batch(label: str, source_type: str, user_id: str) -&gt; Batch|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:719|
|PY-093|독립 컬러화 / FunctionDef|add_batch_item(batch: Batch, source_path: Path, relative_path: str, *, content_hash: str \| None=None) -&gt; BatchItem|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:740|
|PY-094|독립 컬러화 / FunctionDef|_item_from_record(record: dict[str, Any]) -&gt; BatchItem|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:782|
|PY-095|독립 컬러화 / FunctionDef|_load_batch(batch_id: str) -&gt; Batch \| None|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:804|
|PY-096|독립 컬러화 / FunctionDef|get_batch(batch_id: str, user_id: str \| None=None) -&gt; Batch|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:824|
|PY-097|독립 컬러화 / FunctionDef|get_item(item_id: str, user_id: str \| None=None) -&gt; BatchItem|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:836|
|PY-098|독립 컬러화 / FunctionDef|saved_settings_for(item: BatchItem) -&gt; dict[str, Any] \| None|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:852|
|PY-099|독립 컬러화 / FunctionDef|item_summary(item: BatchItem) -&gt; dict[str, Any]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:858|
|PY-100|독립 컬러화 / FunctionDef|batch_summary(batch: Batch) -&gt; dict[str, Any]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:874|
|PY-101|독립 컬러화 / FunctionDef|load_item_image(item: BatchItem) -&gt; DicomImage|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:885|
|PY-102|독립 컬러화 / FunctionDef|image_information(image: DicomImage) -&gt; dict[str, Any]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:909|
|PY-103|독립 컬러화 / FunctionDef|source_information(item: BatchItem, image: DicomImage) -&gt; dict[str, Any]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:923|
|PY-104|독립 컬러화 / FunctionDef|image_data_url(rgb: np.ndarray) -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:937|
|PY-105|독립 컬러화 / FunctionDef|safe_stem(relative_path: str) -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:942|
|PY-106|독립 컬러화 / FunctionDef|item_download_name(item: BatchItem, settings: dict[str, Any]) -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:946|
|PY-107|독립 컬러화 / FunctionDef|render_color_image(image: DicomImage, settings: dict[str, Any]) -&gt; np.ndarray|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:951|
|PY-108|독립 컬러화 / FunctionDef|archive_base_path(item: BatchItem) -&gt; PurePosixPath|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:960|
|PY-109|독립 컬러화 / FunctionDef|via_region(region: dict[str, Any]) -&gt; dict[str, Any]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:965|
|PY-110|독립 컬러화 / FunctionDef|via_export_filename(item: BatchItem, *, unique: bool) -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:986|
|PY-111|독립 컬러화 / FunctionDef|render_annotation_reference(item: BatchItem, image: DicomImage, annotations: dict[str, Any], *, unique_filename: bool) -&gt; tuple[str, bytes, dict[str, Any]]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:997|
|PY-112|독립 컬러화 / FunctionDef|via_metadata_key(metadata: dict[str, Any]) -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1026|
|PY-113|독립 컬러화 / FunctionDef|cleanup_expired_jobs() -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1030|
|PY-114|독립 컬러화 / FunctionDef|remove_job_result(job: ExportJob) -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1044|
|PY-115|독립 컬러화 / FunctionDef|job_summary(job: ExportJob) -&gt; dict[str, Any]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1051|
|PY-116|독립 컬러화 / FunctionDef|run_export_job(job_id: str, entries: list[tuple[str, dict[str, Any]]]) -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1072|
|PY-117|독립 컬러화 / FunctionDef|run_via_export_job(job_id: str, entries: list[tuple[str, dict[str, Any]]]) -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1126|
|PY-118|독립 컬러화 / FunctionDef|handle_value_error(error: ValueError)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1231|
|PY-119|독립 컬러화 / FunctionDef|handle_permission_error(error: PermissionError)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1236|
|PY-120|독립 컬러화 / FunctionDef|handle_too_large(_error)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1241|
|PY-121|독립 컬러화 / FunctionDef|require_api_login()|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1246|
|PY-122|독립 컬러화 / FunctionDef|_credentials() -&gt; tuple[str, str]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1256|
|PY-123|독립 컬러화 / FunctionDef|_user_response(user: dict[str, Any]) -&gt; dict[str, Any]|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1267|
|PY-124|독립 컬러화 / FunctionDef|health()|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1272|
|PY-125|독립 컬러화 / FunctionDef|api_register()|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1277|
|PY-126|독립 컬러화 / FunctionDef|api_login()|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1298|
|PY-127|독립 컬러화 / FunctionDef|api_logout()|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1310|
|PY-128|독립 컬러화 / FunctionDef|api_me()|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1316|
|PY-129|독립 컬러화 / FunctionDef|index()|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1326|
|PY-130|독립 컬러화 / FunctionDef|api_create_batch()|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1331|
|PY-131|독립 컬러화 / FunctionDef|api_list_batches()|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1343|
|PY-132|독립 컬러화 / FunctionDef|api_upload_batch_files(batch_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1361|
|PY-133|독립 컬러화 / FunctionDef|api_remove_batch_items(batch_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1409|
|PY-134|독립 컬러화 / FunctionDef|api_get_batch(batch_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1435|
|PY-135|독립 컬러화 / FunctionDef|api_reset_batch_item_names(batch_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1440|
|PY-136|독립 컬러화 / FunctionDef|api_delete_batch(batch_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1451|
|PY-137|독립 컬러화 / FunctionDef|api_get_item(item_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1472|
|PY-138|독립 컬러화 / FunctionDef|api_rename_item(item_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1479|
|PY-139|독립 컬러화 / FunctionDef|api_render_item(item_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1494|
|PY-140|독립 컬러화 / FunctionDef|api_get_roi_labels()|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1520|
|PY-141|독립 컬러화 / FunctionDef|api_add_roi_label()|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1525|
|PY-142|독립 컬러화 / FunctionDef|api_rename_roi_label()|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1543|
|PY-143|독립 컬러화 / FunctionDef|api_get_item_annotations(item_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1582|
|PY-144|독립 컬러화 / FunctionDef|api_save_item_annotations(item_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1589|
|PY-145|독립 컬러화 / FunctionDef|api_download_item_annotations_via(item_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1623|
|PY-146|독립 컬러화 / FunctionDef|api_save_item_settings(item_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1649|
|PY-147|독립 컬러화 / FunctionDef|api_download_item(item_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1659|
|PY-148|독립 컬러화 / FunctionDef|api_create_export_job()|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1675|
|PY-149|독립 컬러화 / FunctionDef|api_get_export_job(job_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1755|
|PY-150|독립 컬러화 / FunctionDef|api_cancel_export_job(job_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1765|
|PY-151|독립 컬러화 / FunctionDef|api_download_export_job(job_id: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1777|
|PY-152|독립 컬러화 / FunctionDef|open_browser() -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/app.py:1804|
|PY-153|독립 컬러화 / FunctionDef|_get_colormap(name: str)|역할은 함수명·호출/API·ALG 참조||컬러화POC/dicom_processing.py:37|
|PY-154|독립 컬러화 / ClassDef|DicomImage()|Pixel frames and non-identifying, display-related DICOM information.|frames:np.ndarray @50; modality:str @51; photometric_interpretation:str @52; rows:int @53; columns:int @54; bits_stored:int \| None @55; metadata_window_center:float \| None @56; metadata_window_width:float \| None @57|컬러화POC/dicom_processing.py:47|
|PY-155|독립 컬러화 / FunctionDef|_first_number(value: object) -&gt; float \| None|역할은 함수명·호출/API·ALG 참조||컬러화POC/dicom_processing.py:60|
|PY-156|독립 컬러화 / FunctionDef|read_dicom_bytes(data: bytes) -&gt; tuple[Dataset, DicomImage]|Read a DICOM byte stream and return its display-ready intensity frames.||컬러화POC/dicom_processing.py:71|
|PY-157|독립 컬러화 / FunctionDef|suggested_window(frame: np.ndarray, metadata_center: float \| None, metadata_width: float \| None) -&gt; tuple[float, float, str]|Choose the DICOM window when available, otherwise use robust percentiles.||컬러화POC/dicom_processing.py:120|
|PY-158|독립 컬러화 / FunctionDef|intensity_statistics(frame: np.ndarray) -&gt; dict[str, float]|Return useful finite-pixel statistics for display and initial controls.||컬러화POC/dicom_processing.py:139|
|PY-159|독립 컬러화 / FunctionDef|_linear_scale(frame: np.ndarray, low: float, high: float) -&gt; np.ndarray|역할은 함수명·호출/API·ALG 참조||컬러화POC/dicom_processing.py:153|
|PY-160|독립 컬러화 / FunctionDef|normalize_frame(frame: np.ndarray, *, method: str='linear', center: float \| None=None, width: float \| None=None, lower_percentile: float=1.0, upper_percentile: float=99.0, lower_bound: float \| None=None, upper_bound: float \| None=None, log_strength: float=20.0) -&gt; np.ndarray|Normalize a DICOM intensity frame to the inclusive range 0..1.||컬러화POC/dicom_processing.py:159|
|PY-161|독립 컬러화 / FunctionDef|render_colormap(frame: np.ndarray, *, colormap: str, normalization: str='linear', center: float \| None=None, width: float \| None=None, lower_percentile: float=1.0, upper_percentile: float=99.0, lower_bound: float \| None=None, upper_bound: float \| None=None, log_strength: float=20.0, invert: bool=False, gamma: float=1.0, background_threshold: float=0.0) -&gt; np.ndarray|Normalize a frame, apply gamma and a colormap, and return uint8 RGB.||컬러화POC/dicom_processing.py:238|
|PY-162|독립 컬러화 / FunctionDef|make_colormap_scale(colormap: str, *, width: int=512, height: int=24) -&gt; np.ndarray|Return a horizontal RGB scale for the requested colormap.||컬러화POC/dicom_processing.py:283|
|PY-163|독립 컬러화 / FunctionDef|encode_image(rgb: np.ndarray, image_format: str, *, jpeg_quality: int=95) -&gt; bytes|Encode an RGB array as metadata-free PNG or JPEG bytes.||컬러화POC/dicom_processing.py:289|
|PY-164|독립 컬러화 / ClassDef|ColorizerStore()|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:12|
|PY-165|독립 컬러화 / FunctionDef|ColorizerStore.__init__(self, database_path: Path)|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:13|
|PY-166|독립 컬러화 / FunctionDef|ColorizerStore._connect(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:17|
|PY-167|독립 컬러화 / FunctionDef|ColorizerStore.initialize(self) -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:32|
|PY-168|독립 컬러화 / FunctionDef|ColorizerStore._dict(row: sqlite3.Row \| None) -&gt; dict[str, Any] \| None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:122|
|PY-169|독립 컬러화 / FunctionDef|ColorizerStore.create_user(self, user_id: str, username: str, password_hash: str, created_at: str, default_labels: Iterable[str]) -&gt; dict[str, Any]|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:125|
|PY-170|독립 컬러화 / FunctionDef|ColorizerStore.user_by_username(self, username: str) -&gt; dict[str, Any] \| None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:144|
|PY-171|독립 컬러화 / FunctionDef|ColorizerStore.user_by_id(self, user_id: str) -&gt; dict[str, Any] \| None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:153|
|PY-172|독립 컬러화 / FunctionDef|ColorizerStore.create_batch(self, record: dict[str, Any]) -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:162|
|PY-173|독립 컬러화 / FunctionDef|ColorizerStore.list_batches(self, user_id: str) -&gt; list[dict[str, Any]]|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:172|
|PY-174|독립 컬러화 / FunctionDef|ColorizerStore.batch_by_id(self, batch_id: str) -&gt; dict[str, Any] \| None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:188|
|PY-175|독립 컬러화 / FunctionDef|ColorizerStore.delete_batch(self, batch_id: str, user_id: str) -&gt; bool|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:197|
|PY-176|독립 컬러화 / FunctionDef|ColorizerStore.create_item(self, record: dict[str, Any]) -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:204|
|PY-177|독립 컬러화 / FunctionDef|ColorizerStore.list_items(self, batch_id: str) -&gt; list[dict[str, Any]]|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:219|
|PY-178|독립 컬러화 / FunctionDef|ColorizerStore.item_by_id(self, item_id: str) -&gt; dict[str, Any] \| None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:235|
|PY-179|독립 컬러화 / FunctionDef|ColorizerStore.list_items_missing_acquisition(self) -&gt; list[dict[str, Any]]|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:252|
|PY-180|독립 컬러화 / FunctionDef|ColorizerStore.update_item_acquisitions(self, records: Iterable[tuple[str, dict[str, Any]]]) -&gt; int|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:265|
|PY-181|독립 컬러화 / FunctionDef|ColorizerStore.delete_items(self, batch_id: str, user_id: str, item_ids: list[str]) -&gt; int|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:289|
|PY-182|독립 컬러화 / FunctionDef|ColorizerStore.update_item_error(self, item_id: str, error: str \| None) -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:300|
|PY-183|독립 컬러화 / FunctionDef|ColorizerStore.update_item_relative_path(self, item_id: str, user_id: str, relative_path: str) -&gt; bool|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:304|
|PY-184|독립 컬러화 / FunctionDef|ColorizerStore.reset_item_relative_paths(self, batch_id: str, user_id: str) -&gt; int|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:314|
|PY-185|독립 컬러화 / FunctionDef|ColorizerStore.get_settings(self, user_id: str, content_hash: str) -&gt; dict[str, Any] \| None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:327|
|PY-186|독립 컬러화 / FunctionDef|ColorizerStore.save_settings(self, user_id: str, content_hash: str, payload: dict[str, Any], updated_at: str) -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:335|
|PY-187|독립 컬러화 / FunctionDef|ColorizerStore.get_annotations(self, user_id: str, content_hash: str) -&gt; dict[str, Any] \| None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:350|
|PY-188|독립 컬러화 / FunctionDef|ColorizerStore.save_annotations(self, user_id: str, content_hash: str, rows: int, columns: int, payload: dict[str, Any], updated_at: str) -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:369|
|PY-189|독립 컬러화 / FunctionDef|ColorizerStore.delete_annotations(self, user_id: str, content_hash: str) -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:400|
|PY-190|독립 컬러화 / FunctionDef|ColorizerStore.list_labels(self, user_id: str) -&gt; list[str]|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:407|
|PY-191|독립 컬러화 / FunctionDef|ColorizerStore.replace_labels(self, user_id: str, labels: Iterable[str]) -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:415|
|PY-192|독립 컬러화 / FunctionDef|ColorizerStore.add_label(self, user_id: str, name: str) -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:423|
|PY-193|독립 컬러화 / FunctionDef|ColorizerStore.rename_label(self, user_id: str, old_name: str, new_name: str) -&gt; int|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:434|
|PY-194|독립 컬러화 / FunctionDef|ColorizerStore.metadata_value(self, key: str) -&gt; str \| None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:469|
|PY-195|독립 컬러화 / FunctionDef|ColorizerStore.save_metadata(self, key: str, value: str) -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/persistence.py:476|
|PY-196|시험 / FunctionDef|registered_user_id(client) -&gt; str|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:20|
|PY-197|시험 / ClassDef|DicomBatchAppTests(unittest.TestCase)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:25|
|PY-198|시험 / FunctionDef|DicomBatchAppTests.setUp(self) -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:26|
|PY-199|시험 / FunctionDef|DicomBatchAppTests.make_sample_dicom(*, duration_ms: int \| None=None, counts: int \| None=None, termination_condition: str \| None=None) -&gt; bytes|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:39|
|PY-200|시험 / FunctionDef|DicomBatchAppTests.tearDown(self) -&gt; None|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:72|
|PY-201|시험 / FunctionDef|DicomBatchAppTests.create_upload_batch(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:75|
|PY-202|시험 / FunctionDef|DicomBatchAppTests.upload(self, batch_id: str, files: list[tuple[bytes, str, str]])|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:82|
|PY-203|시험 / FunctionDef|DicomBatchAppTests.roi_payload(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:94|
|PY-204|시험 / FunctionDef|DicomBatchAppTests.test_uploaded_item_and_grayscale_only_inversion(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:120|
|PY-205|시험 / FunctionDef|DicomBatchAppTests.test_multiple_upload_keeps_duplicates_and_marks_invalid_item(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:145|
|PY-206|시험 / FunctionDef|DicomBatchAppTests.test_acquisition_classification_priority_and_persistence(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:167|
|PY-207|시험 / FunctionDef|DicomBatchAppTests.test_existing_item_acquisition_is_backfilled_from_stored_dicom(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:211|
|PY-208|시험 / FunctionDef|DicomBatchAppTests.test_image_duplicates_ignore_unrelated_metadata_and_can_be_removed(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:238|
|PY-209|시험 / FunctionDef|DicomBatchAppTests.test_large_file_list_ingestion(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:265|
|PY-210|시험 / FunctionDef|DicomBatchAppTests.test_saved_settings_restore_for_same_content_hash(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:275|
|PY-211|시험 / FunctionDef|DicomBatchAppTests.test_account_ownership_and_persistent_batch_restore(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:298|
|PY-212|시험 / FunctionDef|DicomBatchAppTests.test_roi_annotations_persist_by_hash_and_reject_invalid_regions(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:355|
|PY-213|시험 / FunctionDef|DicomBatchAppTests.test_individual_via_json_and_batch_roi_package(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:418|
|PY-214|시험 / FunctionDef|DicomBatchAppTests.test_roi_labels_can_be_added_and_renamed_with_saved_regions_migrated(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:491|
|PY-215|시험 / FunctionDef|DicomBatchAppTests.test_individual_and_background_batch_downloads(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:523|
|PY-216|시험 / FunctionDef|DicomBatchAppTests.test_item_name_edit_is_persisted_used_for_downloads_and_can_be_reset(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:615|
|PY-217|시험 / FunctionDef|DicomBatchAppTests.test_page_uses_action_level_png_and_jpg_exports(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:690|
|PY-218|시험 / FunctionDef|DicomBatchAppTests.test_background_job_can_be_cancelled(self)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:730|
|PY-219|시험 / FunctionDef|test_background_job_can_be_cancelled.slow_render(*args, **kwargs)|역할은 함수명·호출/API·ALG 참조||컬러화POC/tests/test_app.py:744|

### B.2 프런트엔드·브라우저 함수 모듈 전체

F_ID는 파일 단위다. 명시된 이름 있는 함수/컴포넌트/hook·주요 화살표 함수와 API 래퍼를 기록한다. 익명 이벤트 콜백·구조분해된 state setter는 별도 클래스로 세지 않는다. HTML game의 inline JS도 포함한다. mock는 `vite.config.js`에서 mode=mock일 때만 활성화되며 서버 API 구현으로 세지 않는다.

#### F-001 — frontend/mock/mockServer.js

- 범위: Vite mock(메모리·합성 데이터); import: ./studentAnalytics.js.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|makeVotes|function makeVotes(index) (function)|frontend/mock/mockServer.js:27|
|makeVoters|function makeVoters(index) (function)|frontend/mock/mockServer.js:33|
|makeCrop|function makeCrop(taskId, index) (function)|frontend/mock/mockServer.js:53|
|analyticsStudents|function analyticsStudents() (function)|frontend/mock/mockServer.js:110|
|cropDto|function cropDto(crop, studentView = false) (function)|frontend/mock/mockServer.js:127|
|answersFor|function answersFor(studentId = 'student') (function)|frontend/mock/mockServer.js:145|
|resultFor|function resultFor(crops, studentId) (function)|frontend/mock/mockServer.js:150|
|reviewFor|function reviewFor(taskGroup, studentId) (function)|frontend/mock/mockServer.js:178|
|getStudentReviews|function getStudentReviews(studentId) (function)|frontend/mock/mockServer.js:230|
|isMockSubmissionLocked|function isMockSubmissionLocked(taskId, studentId) (function)|frontend/mock/mockServer.js:247|
|refreshScore|function refreshScore(crop) (function)|frontend/mock/mockServer.js:254|
|json|function json(res, data, status = 200) (function)|frontend/mock/mockServer.js:261|
|readJson|function readJson(req) (function)|frontend/mock/mockServer.js:267|
|readMultipart|function readMultipart(req) (function)|frontend/mock/mockServer.js:278|
|smearSvg|function smearSvg(variant) (function)|frontend/mock/mockServer.js:306|
|cropSvg|function cropSvg(filename) (function)|frontend/mock/mockServer.js:323|
|serveImage|function serveImage(pathname, res) (function)|frontend/mock/mockServer.js:334|
|mockServerPlugin|export function mockServerPlugin() (function)|frontend/mock/mockServer.js:345|

#### F-002 — frontend/mock/studentAnalytics.js

- 범위: Vite mock(메모리·합성 데이터); import: 정적/자체 스크립트.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|summary|function summary(cells) (function)|frontend/mock/studentAnalytics.js:4|
|mockTaskDetail|export function mockTaskDetail(task, crops, answers, studentId) (function)|frontend/mock/studentAnalytics.js:14|
|mockLearningHistory|export function mockLearningHistory(tasks, cropStats, answers, studentId) (function)|frontend/mock/studentAnalytics.js:25|
|mockStudentMatrices|export function mockStudentMatrices(students, tasks, cropStats, studentAnswers, labels) (function)|frontend/mock/studentAnalytics.js:43|
|diagnostic|const diagnostic = task =&gt; (arrow function)|frontend/mock/studentAnalytics.js:1|
|title|const title = task =&gt; (arrow function)|frontend/mock/studentAnalytics.js:2|
|emptyMatrix|const emptyMatrix = () =&gt; (arrow function)|frontend/mock/studentAnalytics.js:44|
|withScore|const withScore = (student, confusionMatrix) =&gt; (arrow function)|frontend/mock/studentAnalytics.js:46|

#### F-003 — frontend/src/api/admin.js

- 범위: React·API·공통 모듈; import: ./client.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|getSmears|GET /api/admin/smears (HTTP 래퍼)|frontend/src/api/admin.js:4|
|getCrops|GET /api/admin/crops (HTTP 래퍼)|frontend/src/api/admin.js:5|
|getUsers|GET /api/admin/users (HTTP 래퍼)|frontend/src/api/admin.js:6|
|createUser|POST /api/admin/users (HTTP 래퍼)|frontend/src/api/admin.js:7|
|deleteUser|DELETE /api/admin/users/${username} (HTTP 래퍼)|frontend/src/api/admin.js:8|
|updateUserStatus|PUT /api/admin/users/${userId}/status (HTTP 래퍼)|frontend/src/api/admin.js:9|
|getStudentRoster|GET /api/admin/student-roster (HTTP 래퍼)|frontend/src/api/admin.js:10|
|addStudentRoster|POST /api/admin/student-roster (HTTP 래퍼)|frontend/src/api/admin.js:11|

#### F-004 — frontend/src/api/auth.js

- 범위: React·API·공통 모듈; import: ./client.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|register|POST /api/auth/register (HTTP 래퍼)|frontend/src/api/auth.js:4|
|login|POST /api/auth/login (HTTP 래퍼)|frontend/src/api/auth.js:6|

#### F-005 — frontend/src/api/client.js

- 범위: React·API·공통 모듈; import: ./createApiClient, ../utils/browserAuthSession.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|명시 함수 없음|상수·re-export·브라우저 엔트리/모듈 초기화는 원본 참조|frontend/src/api/client.js:1|

#### F-006 — frontend/src/api/createApiClient.js

- 범위: React·API·공통 모듈; import: axios.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|createApiClient|export function createApiClient(authSession) (function)|frontend/src/api/createApiClient.js:3|

#### F-007 — frontend/src/api/crops.js

- 범위: React·API·공통 모듈; import: ./client.
- 연결 US: US-033.

|이름|시그니처/종류|근거|
|---|---|---|
|getByTaskId|GET /api/tasks/${taskId}/crops (HTTP 래퍼)|frontend/src/api/crops.js:4|
|getByAssignmentId|GET /api/assignments/${assignmentId}/crops (HTTP 래퍼)|frontend/src/api/crops.js:6|
|confirm|PUT /api/crops/${cropId}/confirm (HTTP 래퍼)|frontend/src/api/crops.js:9|
|confirmLabel|PUT /api/crops/${cropId}/confirm (HTTP 래퍼)|frontend/src/api/crops.js:12|
|getTrainingData|GET /api/training-data (HTTP 래퍼)|frontend/src/api/crops.js:15|

#### F-008 — frontend/src/api/diagnostic.js

- 범위: React·API·공통 모듈; import: ./client, ./client.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|getPoolStats|GET /api/tasks/diagnostic/pool-stats (HTTP 래퍼)|frontend/src/api/diagnostic.js:5|
|createTask|POST /api/tasks/diagnostic/create (HTTP 래퍼)|frontend/src/api/diagnostic.js:7|
|getStudentMatrices|GET /api/tasks/diagnostic/student-matrices (HTTP 래퍼)|frontend/src/api/diagnostic.js:10|

#### F-009 — frontend/src/api/index.js

- 범위: React·API·공통 모듈; import: ./auth, ./tasks, ./crops, ./submissions, ./stats, ./diagnostic, ./reports, ./admin, ./labeling, ./species.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|명시 함수 없음|상수·re-export·브라우저 엔트리/모듈 초기화는 원본 참조|frontend/src/api/index.js:1|

#### F-010 — frontend/src/api/labeling.js

- 범위: React·API·공통 모듈; import: ./client.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|exportTask|GET /api/labeling/tasks/${taskId}/export (HTTP 래퍼)|frontend/src/api/labeling.js:4|
|importTask|POST /api/labeling/tasks/${taskId}/import (HTTP 래퍼)|frontend/src/api/labeling.js:6|

#### F-011 — frontend/src/api/reports.js

- 범위: React·API·공통 모듈; import: ./client.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|create|POST /api/reports (HTTP 래퍼)|frontend/src/api/reports.js:4|
|getAll|GET /api/reports (HTTP 래퍼)|frontend/src/api/reports.js:5|

#### F-012 — frontend/src/api/species.js

- 범위: React·API·공통 모듈; import: ./client.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|getAll|GET /api/species (HTTP 래퍼)|frontend/src/api/species.js:4|
|create|POST /api/species (HTTP 래퍼)|frontend/src/api/species.js:5|
|rename|PUT /api/species/${speciesId} (HTTP 래퍼)|frontend/src/api/species.js:6|
|updateTask|PUT /api/tasks/${taskId}/species (HTTP 래퍼)|frontend/src/api/species.js:7|

#### F-013 — frontend/src/api/stats.js

- 범위: React·API·공통 모듈; import: ./client.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|getByTaskId|GET /api/tasks/${taskId}/stats (HTTP 래퍼)|frontend/src/api/stats.js:4|
|getAll|GET /api/all-stats (HTTP 래퍼)|frontend/src/api/stats.js:6|

#### F-014 — frontend/src/api/studentAnalytics.js

- 범위: React·API·공통 모듈; import: ./client.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|getHistory|GET /api/analytics/students/${encodeURIComponent(studentId)}/history (HTTP 래퍼)|frontend/src/api/studentAnalytics.js:4|
|getTaskDetail|GET /api/analytics/students/${encodeURIComponent(studentId)}/tasks/${taskId} (HTTP 래퍼)|frontend/src/api/studentAnalytics.js:5|

#### F-015 — frontend/src/api/submissions.js

- 범위: React·API·공통 모듈; import: ./client.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|submit|POST /api/submit (HTTP 래퍼)|frontend/src/api/submissions.js:4|
|getSolvedCrops|GET /api/tasks/${taskId}/submissions/${studentId} (HTTP 래퍼)|frontend/src/api/submissions.js:6|
|getMyResults|GET /api/tasks/${taskId}/my-results/${studentId} (HTTP 래퍼)|frontend/src/api/submissions.js:9|
|getSolvedCropsForAssignment|GET /api/assignments/${assignmentId}/submissions/${studentId} (HTTP 래퍼)|frontend/src/api/submissions.js:12|
|getSolvedCropLabels|GET /api/tasks/${taskId}/submissions/${studentId}/labels (HTTP 래퍼)|frontend/src/api/submissions.js:15|
|getSolvedCropLabelsForAssignment|GET /api/assignments/${assignmentId}/submissions/${studentId}/labels (HTTP 래퍼)|frontend/src/api/submissions.js:18|
|getMyResultsForAssignment|GET /api/assignments/${assignmentId}/my-results/${studentId} (HTTP 래퍼)|frontend/src/api/submissions.js:21|
|getMyReviews|GET /api/student/reviews (HTTP 래퍼)|frontend/src/api/submissions.js:24|

#### F-016 — frontend/src/api/tasks.js

- 범위: React·API·공통 모듈; import: ./client.
- 연결 US: US-011.

|이름|시그니처/종류|근거|
|---|---|---|
|getAll|GET /api/tasks (HTTP 래퍼)|frontend/src/api/tasks.js:4|
|upload|POST /api/tasks/upload (HTTP 래퍼)|frontend/src/api/tasks.js:6|
|createAssignment|POST /api/assignments (HTTP 래퍼)|frontend/src/api/tasks.js:11|
|deleteAssignment|DELETE /api/assignments/${assignmentId} (HTTP 래퍼)|frontend/src/api/tasks.js:16|
|updateAssignmentDeadline|PUT /api/assignments/${assignmentId}/deadline (HTTP 래퍼)|frontend/src/api/tasks.js:19|
|updateDeadline|PUT /api/tasks/${taskId}/deadline (HTTP 래퍼)|frontend/src/api/tasks.js:22|
|updateSpecies|PUT /api/tasks/${taskId}/species (HTTP 래퍼)|frontend/src/api/tasks.js:25|
|delete|DELETE /api/tasks/${taskId} (HTTP 래퍼)|frontend/src/api/tasks.js:28|

#### F-017 — frontend/src/App.jsx

- 범위: React·API·공통 모듈; import: react-router-dom, ./context/AuthContext, ./components/common, ./context/AuthContext, ./pages/LoginPage, ./pages/StudentPage, ./pages/ExpertPage, ./pages/AdminPage, ./pages/BombGamePage.
- 연결 US: US-004.

|이름|시그니처/종류|근거|
|---|---|---|
|App|export default function App() (function)|frontend/src/App.jsx:11|
|MainLayout|function MainLayout() (function)|frontend/src/App.jsx:27|
|ProtectedRoute|function ProtectedRoute({ allowedRole, children }) (function)|frontend/src/App.jsx:53|
|LoginRedirect|function LoginRedirect({ children }) (function)|frontend/src/App.jsx:68|
|RoleRedirect|function RoleRedirect() (function)|frontend/src/App.jsx:78|
|normalizeRole|function normalizeRole(role) (function)|frontend/src/App.jsx:84|
|getHomePath|function getHomePath(role) (function)|frontend/src/App.jsx:88|

#### F-018 — frontend/src/assets/bomb-game.html

- 범위: 관리자 게임 inline script; import: 정적/자체 스크립트.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|ac|function ac() (function)|frontend/src/assets/bomb-game.html:580|
|tone|function tone(freq,dur,type,vol,slideTo) (function)|frontend/src/assets/bomb-game.html:585|
|noise|function noise(dur,vol) (function)|frontend/src/assets/bomb-game.html:594|
|mhz|function mhz(m){ return 440*Math.pow(2,(m-69)/12) (function)|frontend/src/assets/bomb-game.html:615|
|show|function show(name){ Object.values(screens).forEach(s=&gt;s.classList.remove("active")); screens[name].classList.add("active") (function)|frontend/src/assets/bomb-game.html:805|
|defaultNames|function defaultNames(n){ const a=[]; for(let i=0;i&lt;n;i++) a.push("") (function)|frontend/src/assets/bomb-game.html:815|
|renderPlayers|function renderPlayers() (function)|frontend/src/assets/bomb-game.html:818|
|syncPlayControls|function syncPlayControls() (function)|frontend/src/assets/bomb-game.html:862|
|buildTicks|function buildTicks() (function)|frontend/src/assets/bomb-game.html:904|
|curBombStart|function curBombStart() (function)|frontend/src/assets/bomb-game.html:909|
|nextMult|function nextMult() (function)|frontend/src/assets/bomb-game.html:910|
|startTurn|function startTurn() (function)|frontend/src/assets/bomb-game.html:912|
|setBombWidth|function setBombWidth() (function)|frontend/src/assets/bomb-game.html:929|
|updateHud|function updateHud() (function)|frontend/src/assets/bomb-game.html:942|
|beginSweep|function beginSweep() (function)|frontend/src/assets/bomb-game.html:948|
|loop|function loop(now) (function)|frontend/src/assets/bomb-game.html:964|
|curPos|function curPos() (function)|frontend/src/assets/bomb-game.html:984|
|doStop|function doStop() (function)|frontend/src/assets/bomb-game.html:988|
|offerDecision|function offerDecision() (function)|frontend/src/assets/bomb-game.html:1032|
|bank|function bank() (function)|frontend/src/assets/bomb-game.html:1043|
|bust|function bust() (function)|frontend/src/assets/bomb-game.html:1046|
|finishTurn|function finishTurn(score,busted) (function)|frontend/src/assets/bomb-game.html:1058|
|openGate|function openGate() (function)|frontend/src/assets/bomb-game.html:1071|
|closeGateAndStart|function closeGateAndStart(){ gate.classList.remove("show"); startTurn() (function)|frontend/src/assets/bomb-game.html:1084|
|renderBoard|function renderBoard() (function)|frontend/src/assets/bomb-game.html:1088|
|escapeHtml|function escapeHtml(s){ return s.replace(/[&&lt;&gt;"]/g,c=&gt;({"&":"&amp;","&lt;":"&lt;","&gt;":"&gt;",'"':"&quot;"}[c])) (function)|frontend/src/assets/bomb-game.html:1102|
|authHeaders|function authHeaders() (function)|frontend/src/assets/bomb-game.html:1105|
|lbRecord|async function lbRecord(players,isHard) (function)|frontend/src/assets/bomb-game.html:1109|
|lbFetch|async function lbFetch(mode) (function)|frontend/src/assets/bomb-game.html:1117|
|lbRender|async function lbRender(innerEl, activeKey) (function)|frontend/src/assets/bomb-game.html:1125|
|showResults|async function showResults() (function)|frontend/src/assets/bomb-game.html:1182|
|startSoloPlay|function startSoloPlay() (function)|frontend/src/assets/bomb-game.html:1216|
|showSoloResult|async function showSoloResult(score,busted) (function)|frontend/src/assets/bomb-game.html:1224|
|launchSolo|function launchSolo() (function)|frontend/src/assets/bomb-game.html:1250|
|resize|function resize(){ cv.width=innerWidth; cv.height=innerHeight; } resize(); addEventListener("resize",resize) (function)|frontend/src/assets/bomb-game.html:1262|
|burstConfetti|function burstConfetti() (function)|frontend/src/assets/bomb-game.html:1263|
|animConf|function animConf() (function)|frontend/src/assets/bomb-game.html:1274|

#### F-019 — frontend/src/components/AnalyticsFeedback.jsx

- 범위: React·API·공통 모듈; import: react, ../api, ../constants, ./AuthImage, ./ImageDisplayControls, ../utils/fetchAuthImage, ./SpeciesBadge, ./TaskSpeciesEditor, ./StudentResponsesPanel, ./StudentManagement.
- 연결 US: US-014, US-015, US-018, US-019, US-020, US-026, US-027, US-028.

|이름|시그니처/종류|근거|
|---|---|---|
|getAccuracyColor|function getAccuracyColor(accuracy, totalAnswers = 1) (function)|frontend/src/components/AnalyticsFeedback.jsx:12|
|VoteBar|function VoteBar({ voteDistribution, votersByLabel, totalAnswers }) (function)|frontend/src/components/AnalyticsFeedback.jsx:22|
|toDateTimeInputValue|function toDateTimeInputValue(value) (function)|frontend/src/components/AnalyticsFeedback.jsx:101|
|getMinimumDeadlineValue|function getMinimumDeadlineValue() (function)|frontend/src/components/AnalyticsFeedback.jsx:105|
|DeadlineControl|function DeadlineControl({ deadlineAt, onSave }) (function)|frontend/src/components/AnalyticsFeedback.jsx:111|
|GtProgressBadge|function GtProgressBadge({ progress, completeLabel = '✓ 완료', incompleteLabel = 'GT' }) (function)|frontend/src/components/AnalyticsFeedback.jsx:154|
|isDiagnosticTask|function isDiagnosticTask(task) (function)|frontend/src/components/AnalyticsFeedback.jsx:184|
|getReportCategory|function getReportCategory(reason) (function)|frontend/src/components/AnalyticsFeedback.jsx:188|
|AnalyticsFeedback|export default function AnalyticsFeedback() (function)|frontend/src/components/AnalyticsFeedback.jsx:194|
|save|const save = async (event, nextValue = value) =&gt; (arrow function)|frontend/src/components/AnalyticsFeedback.jsx:118|
|getTaskGtProgress|const getTaskGtProgress = (task) =&gt; (arrow function)|frontend/src/components/AnalyticsFeedback.jsx:268|
|getAssignmentGtProgress|const getAssignmentGtProgress = (groupTasks) =&gt; (arrow function)|frontend/src/components/AnalyticsFeedback.jsx:277|
|displaySmearFilename|const displaySmearFilename = (item) =&gt; (arrow function)|frontend/src/components/AnalyticsFeedback.jsx:292|
|selectCropAt|const selectCropAt = (index) =&gt; (arrow function)|frontend/src/components/AnalyticsFeedback.jsx:300|
|handleCanvasClick|const handleCanvasClick = (e) =&gt; (arrow function)|frontend/src/components/AnalyticsFeedback.jsx:412|
|handleDeleteTask|const handleDeleteTask = async (task, e) =&gt; (arrow function)|frontend/src/components/AnalyticsFeedback.jsx:434|
|handleUpdateDeadline|const handleUpdateDeadline = async (scopeType, scopeId, deadlineAt) =&gt; (arrow function)|frontend/src/components/AnalyticsFeedback.jsx:455|
|refreshTasks|const refreshTasks = async () =&gt; (arrow function)|frontend/src/components/AnalyticsFeedback.jsx:465|
|handleConfirmLabel|const handleConfirmLabel = async (cropId, finalLabel) =&gt; (arrow function)|frontend/src/components/AnalyticsFeedback.jsx:472|
|handleLabelingExport|const handleLabelingExport = async (taskId) =&gt; (arrow function)|frontend/src/components/AnalyticsFeedback.jsx:483|
|handleLabelingImport|const handleLabelingImport = async (taskId, file) =&gt; (arrow function)|frontend/src/components/AnalyticsFeedback.jsx:498|

#### F-020 — frontend/src/components/AuthImage.jsx

- 범위: React·API·공통 모듈; import: react, ../utils/fetchAuthImage.
- 연결 US: US-030.

|이름|시그니처/종류|근거|
|---|---|---|
|AuthImage|export default function AuthImage({ src, fallbackSrc, alt, style, onLoad, className, loadingText, errorText, placeholderStyle, ...props }) (function)|frontend/src/components/AuthImage.jsx:4|
|load|const load = (url, allowFallback) =&gt; (arrow function)|frontend/src/components/AuthImage.jsx:22|

#### F-021 — frontend/src/components/common/index.js

- 범위: React·API·공통 모듈; import: ./NavBar.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|명시 함수 없음|상수·re-export·브라우저 엔트리/모듈 초기화는 원본 참조|frontend/src/components/common/index.js:1|

#### F-022 — frontend/src/components/common/NavBar.jsx

- 범위: React·API·공통 모듈; import: ../../context/AuthContext.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|NavBar|export default function NavBar() (function)|frontend/src/components/common/NavBar.jsx:3|

#### F-023 — frontend/src/components/ImageDisplayControls.jsx

- 범위: React·API·공통 모듈; import: react, ../utils/browserAuthSession.
- 연결 US: US-031.

|이름|시그니처/종류|근거|
|---|---|---|
|readStoredSettings|function readStoredSettings() (function)|frontend/src/components/ImageDisplayControls.jsx:7|
|getImageDisplayFilter|export function getImageDisplayFilter(settings = DEFAULT_IMAGE_DISPLAY_SETTINGS) (function)|frontend/src/components/ImageDisplayControls.jsx:15|
|useImageDisplaySettings|export function useImageDisplaySettings(imageKey) (function)|frontend/src/components/ImageDisplayControls.jsx:19|
|ImageDisplayControls|export default function ImageDisplayControls({ settings, onChange, onReset }) (function)|frontend/src/components/ImageDisplayControls.jsx:43|

#### F-024 — frontend/src/components/SpeciesBadge.jsx

- 범위: React·API·공통 모듈; import: 정적/자체 스크립트.
- 연결 US: US-008.

|이름|시그니처/종류|근거|
|---|---|---|
|SpeciesBadge|export default function SpeciesBadge({ name, code, compact = false, style }) (function)|frontend/src/components/SpeciesBadge.jsx:1|

#### F-025 — frontend/src/components/SpeciesDataSettings.jsx

- 범위: React·API·공통 모듈; import: react, ../api.
- 연결 US: US-009.

|이름|시그니처/종류|근거|
|---|---|---|
|SpeciesDataSettings|export default function SpeciesDataSettings({ species, onSaved }) (function)|frontend/src/components/SpeciesDataSettings.jsx:4|
|normalize|const normalize = (value) =&gt; (arrow function)|frontend/src/components/SpeciesDataSettings.jsx:17|
|createSpecies|const createSpecies = async () =&gt; (arrow function)|frontend/src/components/SpeciesDataSettings.jsx:19|
|startEditing|const startEditing = (item) =&gt; (arrow function)|frontend/src/components/SpeciesDataSettings.jsx:36|
|cancelEditing|const cancelEditing = () =&gt; (arrow function)|frontend/src/components/SpeciesDataSettings.jsx:42|
|renameSpecies|const renameSpecies = async (item) =&gt; (arrow function)|frontend/src/components/SpeciesDataSettings.jsx:47|

#### F-026 — frontend/src/components/SpeciesSelector.jsx

- 범위: React·API·공통 모듈; import: 정적/자체 스크립트.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|명시 함수 없음|상수·re-export·브라우저 엔트리/모듈 초기화는 원본 참조|frontend/src/components/SpeciesSelector.jsx:1|

#### F-027 — frontend/src/components/StudentManagement.jsx

- 범위: React·API·공통 모듈; import: react, ../api, ../api/studentAnalytics, ../constants, ../utils/studentLearning, ./AuthImage.
- 연결 US: US-022, US-023.

|이름|시그니처/종류|근거|
|---|---|---|
|useApiData|function useApiData(loader) (function)|frontend/src/components/StudentManagement.jsx:11|
|LoadState|function LoadState({ request }) (function)|frontend/src/components/StudentManagement.jsx:27|
|StudentManagement|export default function StudentManagement() (function)|frontend/src/components/StudentManagement.jsx:33|
|StudentMatrix|function StudentMatrix({ student }) (function)|frontend/src/components/StudentManagement.jsx:80|
|StudentHistory|function StudentHistory({ studentId }) (function)|frontend/src/components/StudentManagement.jsx:99|
|TaskAnswers|function TaskAnswers({ studentId, taskId }) (function)|frontend/src/components/StudentManagement.jsx:147|

#### F-028 — frontend/src/components/StudentResponsesPanel.jsx

- 범위: React·API·공통 모듈; import: react, ../constants, ../utils/studentResponses, ./AuthImage, ./SpeciesBadge.
- 연결 US: US-021.

|이름|시그니처/종류|근거|
|---|---|---|
|StudentResponsesPanel|export default function StudentResponsesPanel({ crops, selectedCrop, onSelectCrop, imageFilter, smearFilename }) (function)|frontend/src/components/StudentResponsesPanel.jsx:10|
|score|const score = (item) =&gt; (arrow function)|frontend/src/components/StudentResponsesPanel.jsx:16|

#### F-029 — frontend/src/components/StudentReviewPanel.jsx

- 범위: React·API·공통 모듈; import: react, ../api, ../constants, ./AuthImage, ./ImageDisplayControls, ./SpeciesBadge.
- 연결 US: US-017.

|이름|시그니처/종류|근거|
|---|---|---|
|resultMeta|function resultMeta(cell) (function)|frontend/src/components/StudentReviewPanel.jsx:14|
|ReviewSummary|function ReviewSummary({ review }) (function)|frontend/src/components/StudentReviewPanel.jsx:20|
|ReviewDetail|function ReviewDetail({ review, selectedIndex, onSelectIndex, onBack }) (function)|frontend/src/components/StudentReviewPanel.jsx:40|
|StudentReviewPanel|export default function StudentReviewPanel() (function)|frontend/src/components/StudentReviewPanel.jsx:228|
|selectSmear|const selectSmear = (index) =&gt; (arrow function)|frontend/src/components/StudentReviewPanel.jsx:61|
|getScaledBbox|const getScaledBbox = (bboxValue) =&gt; (arrow function)|frontend/src/components/StudentReviewPanel.jsx:66|
|openCell|const openCell = (review, index) =&gt; (arrow function)|frontend/src/components/StudentReviewPanel.jsx:254|

#### F-030 — frontend/src/components/TaskSpeciesEditor.jsx

- 범위: React·API·공통 모듈; import: react, ../api.
- 연결 US: US-010.

|이름|시그니처/종류|근거|
|---|---|---|
|TaskSpeciesEditor|export default function TaskSpeciesEditor({ taskId, species, value, onUpdated }) (function)|frontend/src/components/TaskSpeciesEditor.jsx:4|
|update|const update = async (event) =&gt; (arrow function)|frontend/src/components/TaskSpeciesEditor.jsx:6|

#### F-031 — frontend/src/constants.js

- 범위: React·API·공통 모듈; import: 정적/자체 스크립트.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|명시 함수 없음|상수·re-export·브라우저 엔트리/모듈 초기화는 원본 참조|frontend/src/constants.js:1|

#### F-032 — frontend/src/context/AuthContext.jsx

- 범위: React·API·공통 모듈; import: react, ../api, ../utils/browserAuthSession, ../utils/authSession.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|AuthProvider|export function AuthProvider({ children }) (function)|frontend/src/context/AuthContext.jsx:8|
|useAuth|export function useAuth() (function)|frontend/src/context/AuthContext.jsx:27|

#### F-033 — frontend/src/hooks/index.js

- 범위: React·API·공통 모듈; import: ./useTasks, ./useTaskCrops, ./useSolvedCrops, ./useTaskStats.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|명시 함수 없음|상수·re-export·브라우저 엔트리/모듈 초기화는 원본 참조|frontend/src/hooks/index.js:1|

#### F-034 — frontend/src/hooks/useSolvedCrops.js

- 범위: React·API·공통 모듈; import: react, ../api.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|useSolvedCrops|export function useSolvedCrops(taskId, studentId) (function)|frontend/src/hooks/useSolvedCrops.js:4|

#### F-035 — frontend/src/hooks/useTaskCrops.js

- 범위: React·API·공통 모듈; import: react, ../api.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|useTaskCrops|export function useTaskCrops(taskId) (function)|frontend/src/hooks/useTaskCrops.js:4|

#### F-036 — frontend/src/hooks/useTasks.js

- 범위: React·API·공통 모듈; import: react, ../api.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|useTasks|export function useTasks() (function)|frontend/src/hooks/useTasks.js:4|

#### F-037 — frontend/src/hooks/useTaskStats.js

- 범위: React·API·공통 모듈; import: react, ../api.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|useTaskStats|export function useTaskStats() (function)|frontend/src/hooks/useTaskStats.js:4|

#### F-038 — frontend/src/main.jsx

- 범위: React·API·공통 모듈; import: react, react-dom/client, ./App.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|명시 함수 없음|상수·re-export·브라우저 엔트리/모듈 초기화는 원본 참조|frontend/src/main.jsx:1|

#### F-039 — frontend/src/pages/AdminPage.jsx

- 범위: React·API·공통 모듈; import: react, ../api, ../constants, ../components/AuthImage, ../components/SpeciesBadge, ../components/AnalyticsFeedback.
- 연결 US: US-005, US-006, US-007, US-029.

|이름|시그니처/종류|근거|
|---|---|---|
|AdminPage|export default function AdminPage() (function)|frontend/src/pages/AdminPage.jsx:9|
|handleCreateUser|const handleCreateUser = async () =&gt; (arrow function)|frontend/src/pages/AdminPage.jsx:42|
|handleDeleteUser|const handleDeleteUser = async (username) =&gt; (arrow function)|frontend/src/pages/AdminPage.jsx:53|
|handleUpdateUserStatus|const handleUpdateUserStatus = async (user, status) =&gt; (arrow function)|frontend/src/pages/AdminPage.jsx:63|
|handleAddRoster|const handleAddRoster = async () =&gt; (arrow function)|frontend/src/pages/AdminPage.jsx:74|
|displaySmearFilename|const displaySmearFilename = (item) =&gt; (arrow function)|frontend/src/pages/AdminPage.jsx:144|
|handleLabelingExport|const handleLabelingExport = async (taskId) =&gt; (arrow function)|frontend/src/pages/AdminPage.jsx:164|
|handleLabelingImport|const handleLabelingImport = async (taskId, file) =&gt; (arrow function)|frontend/src/pages/AdminPage.jsx:178|

#### F-040 — frontend/src/pages/BombGamePage.jsx

- 범위: React·API·공통 모듈; import: ../assets/bomb-game.html?raw, ../utils/browserAuthSession.
- 연결 US: US-035.

|이름|시그니처/종류|근거|
|---|---|---|
|BombGamePage|export default function BombGamePage() (function)|frontend/src/pages/BombGamePage.jsx:4|
|getAuthHeaders|const getAuthHeaders = () =&gt; (arrow function)|frontend/src/pages/BombGamePage.jsx:5|

#### F-041 — frontend/src/pages/ExpertPage.jsx

- 범위: React·API·공통 모듈; import: react, ../api, ../constants, ../utils/fetchAuthImage, ../components/SpeciesBadge, ../components/SpeciesSelector, ../components/SpeciesDataSettings, ../components/AnalyticsFeedback.
- 연결 US: US-012, US-024.

|이름|시그니처/종류|근거|
|---|---|---|
|getMinimumDeadlineValue|function getMinimumDeadlineValue() (function)|frontend/src/pages/ExpertPage.jsx:11|
|emptyDistribution|function emptyDistribution() (function)|frontend/src/pages/ExpertPage.jsx:26|
|autoDistributeByTotal|function autoDistributeByTotal(total, availableByClass) (function)|frontend/src/pages/ExpertPage.jsx:30|
|ExpertPage|export default function ExpertPage() (function)|frontend/src/pages/ExpertPage.jsx:52|
|addSmearFiles|const addSmearFiles = (newFiles) =&gt; (arrow function)|frontend/src/pages/ExpertPage.jsx:206|
|handleFileChange|const handleFileChange = (e) =&gt; (arrow function)|frontend/src/pages/ExpertPage.jsx:215|
|handleRemoveFile|const handleRemoveFile = (idx) =&gt; (arrow function)|frontend/src/pages/ExpertPage.jsx:220|
|handleDragOver|const handleDragOver = (e) =&gt; (arrow function)|frontend/src/pages/ExpertPage.jsx:225|
|handleDragLeave|const handleDragLeave = (e) =&gt; (arrow function)|frontend/src/pages/ExpertPage.jsx:226|
|handleDrop|const handleDrop = (e) =&gt; (arrow function)|frontend/src/pages/ExpertPage.jsx:227|
|handleUpload|const handleUpload = async () =&gt; (arrow function)|frontend/src/pages/ExpertPage.jsx:232|
|handleDistributionChange|const handleDistributionChange = (label, value) =&gt; (arrow function)|frontend/src/pages/ExpertPage.jsx:269|
|handleCreateDiagnosticTask|const handleCreateDiagnosticTask = async () =&gt; (arrow function)|frontend/src/pages/ExpertPage.jsx:276|

#### F-042 — frontend/src/pages/LoginPage.jsx

- 범위: React·API·공통 모듈; import: react, ../context/AuthContext, ../api.
- 연결 US: US-001, US-002.

|이름|시그니처/종류|근거|
|---|---|---|
|LoginPage|export default function LoginPage() (function)|frontend/src/pages/LoginPage.jsx:5|
|handleSubmit|const handleSubmit = async (e) =&gt; (arrow function)|frontend/src/pages/LoginPage.jsx:25|
|toggleMode|const toggleMode = () =&gt; (arrow function)|frontend/src/pages/LoginPage.jsx:51|

#### F-043 — frontend/src/pages/StudentPage.jsx

- 범위: React·API·공통 모듈; import: react, react-router-dom, ../context/AuthContext, ../api, ../constants, ../components/AuthImage, ../components/StudentReviewPanel, ../components/ImageDisplayControls, ../components/SpeciesBadge.
- 연결 US: US-013, US-016, US-025.

|이름|시그니처/종류|근거|
|---|---|---|
|isDiagnosticTask|function isDiagnosticTask(task) (function)|frontend/src/pages/StudentPage.jsx:11|
|TaskCardItem|function TaskCardItem({ task, username, onClick, onReview, diagnostic = false, displayNumber = null }) (function)|frontend/src/pages/StudentPage.jsx:16|
|AssignmentCard|function AssignmentCard({ assignment, username, onClick, onReview }) (function)|frontend/src/pages/StudentPage.jsx:94|
|StudentPage|export default function StudentPage() (function)|frontend/src/pages/StudentPage.jsx:158|
|fetchData|const fetchData = async () =&gt; (arrow function)|frontend/src/pages/StudentPage.jsx:23|
|handlePopState|const handlePopState = (e) =&gt; (arrow function)|frontend/src/pages/StudentPage.jsx:181|
|handleSelectTask|const handleSelectTask = async (task) =&gt; (arrow function)|frontend/src/pages/StudentPage.jsx:188|
|handleSelectAssignment|const handleSelectAssignment = async (assignment) =&gt; (arrow function)|frontend/src/pages/StudentPage.jsx:224|
|handleImageLoad|const handleImageLoad = (e) =&gt; (arrow function)|frontend/src/pages/StudentPage.jsx:254|
|parseBbox|const parseBbox = (bboxStr) =&gt; (arrow function)|frontend/src/pages/StudentPage.jsx:258|
|getScaledBbox|const getScaledBbox = (bboxStr) =&gt; (arrow function)|frontend/src/pages/StudentPage.jsx:262|
|handleStudentSubmit|const handleStudentSubmit = async (label) =&gt; (arrow function)|frontend/src/pages/StudentPage.jsx:270|
|handleFinalSubmit|const handleFinalSubmit = async () =&gt; (arrow function)|frontend/src/pages/StudentPage.jsx:293|
|handleReportCrop|const handleReportCrop = () =&gt; (arrow function)|frontend/src/pages/StudentPage.jsx:316|
|goToSmearGroup|const goToSmearGroup = (groupIndex) =&gt; (arrow function)|frontend/src/pages/StudentPage.jsx:363|

#### F-044 — frontend/src/utils/authSession.js

- 범위: React·API·공통 모듈; import: 정적/자체 스크립트.
- 연결 US: US-003.

|이름|시그니처/종류|근거|
|---|---|---|
|getSessionHomePath|export function getSessionHomePath(session) (function)|frontend/src/utils/authSession.js:4|
|decodeSession|function decodeSession(raw) (function)|frontend/src/utils/authSession.js:10|
|createAuthSession|export function createAuthSession({ storage, onChange, createId = () =&gt; globalThis.crypto?.randomUUID?.() \|\| `${Date.now()}-${Math.random()}` }) (function)|frontend/src/utils/authSession.js:20|
|watchAuthSession|export function watchAuthSession(session, targetWindow, targetDocument) (function)|frontend/src/utils/authSession.js:72|
|sync|const sync = () =&gt; (arrow function)|frontend/src/utils/authSession.js:35|
|assertCurrent|const assertCurrent = () =&gt; (arrow function)|frontend/src/utils/authSession.js:43|
|sync|const sync = () =&gt; (arrow function)|frontend/src/utils/authSession.js:73|
|onStorage|const onStorage = event =&gt; (arrow function)|frontend/src/utils/authSession.js:74|
|onVisible|const onVisible = () =&gt; (arrow function)|frontend/src/utils/authSession.js:77|

#### F-045 — frontend/src/utils/authSession.test.js

- 범위: 회귀 시험; import: node:test, node:assert/strict, axios, ./authSession.js, ../api/createApiClient.js.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|setup|function setup(initial = professor) (function)|frontend/src/utils/authSession.test.js:9|
|tab|const tab = () =&gt; (arrow function)|frontend/src/utils/authSession.test.js:18|

#### F-046 — frontend/src/utils/browserAuthSession.js

- 범위: React·API·공통 모듈; import: ./authSession.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|명시 함수 없음|상수·re-export·브라우저 엔트리/모듈 초기화는 원본 참조|frontend/src/utils/browserAuthSession.js:1|

#### F-047 — frontend/src/utils/fetchAuthImage.js

- 범위: React·API·공통 모듈; import: ./browserAuthSession.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|fetchAuthImage|export async function fetchAuthImage(url) (function)|frontend/src/utils/fetchAuthImage.js:3|

#### F-048 — frontend/src/utils/studentLearning.js

- 범위: React·API·공통 모듈; import: 정적/자체 스크립트.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|learningStatus|export function learningStatus(summary, deadlineAt, now = Date.now()) (function)|frontend/src/utils/studentLearning.js:1|
|learningScore|export function learningScore(summary) (function)|frontend/src/utils/studentLearning.js:12|
|summarizeLearningHistory|export function summarizeLearningHistory(activities) (function)|frontend/src/utils/studentLearning.js:19|
|completed|const completed = summary =&gt; (arrow function)|frontend/src/utils/studentLearning.js:20|

#### F-049 — frontend/src/utils/studentLearning.test.js

- 범위: 회귀 시험; import: node:test, node:assert/strict, ./studentLearning.js, ../../mock/studentAnalytics.js.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|명시 함수 없음|상수·re-export·브라우저 엔트리/모듈 초기화는 원본 참조|frontend/src/utils/studentLearning.test.js:1|

#### F-050 — frontend/src/utils/studentResponses.js

- 범위: React·API·공통 모듈; import: 정적/자체 스크립트.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|summarizeStudentResponses|export function summarizeStudentResponses(crops) (function)|frontend/src/utils/studentResponses.js:2|

#### F-051 — frontend/src/utils/studentResponses.test.js

- 범위: 회귀 시험; import: node:test, node:assert/strict, ./studentResponses.js.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|명시 함수 없음|상수·re-export·브라우저 엔트리/모듈 초기화는 원본 참조|frontend/src/utils/studentResponses.test.js:1|

#### F-052 — 컬러화POC/static/app.js

- 범위: 독립 컬러화 UI/기하; import: 정적/자체 스크립트.
- 연결 US: US-037, US-038, US-039, US-041.

|이름|시그니처/종류|근거|
|---|---|---|
|clone|function clone(value) (function)|컬러화POC/static/app.js:90|
|setBusy|function setBusy(active, message = "영상을 준비하고 있습니다") (function)|컬러화POC/static/app.js:94|
|setPreviewBusy|function setPreviewBusy(active, message = "DICOM 파일을 읽고 있습니다") (function)|컬러화POC/static/app.js:100|
|showError|function showError(message) (function)|컬러화POC/static/app.js:108|
|clearError|function clearError() (function)|컬러화POC/static/app.js:114|
|api|async function api(url, options = {}) (function)|컬러화POC/static/app.js:118|
|showAuthScreen|function showAuthScreen() (function)|컬러화POC/static/app.js:134|
|updateAuthMode|function updateAuthMode(mode) (function)|컬러화POC/static/app.js:141|
|handleAuthSubmit|async function handleAuthSubmit(event) (function)|컬러화POC/static/app.js:156|
|enterWorkspace|async function enterWorkspace(user) (function)|컬러화POC/static/app.js:184|
|logout|async function logout() (function)|컬러화POC/static/app.js:193|
|renderSavedBatchOptions|function renderSavedBatchOptions(preferredBatchId = null) (function)|컬러화POC/static/app.js:203|
|updateSavedBatchButtons|function updateSavedBatchButtons() (function)|컬러화POC/static/app.js:228|
|refreshSavedBatches|async function refreshSavedBatches(preferredBatchId = null, openFirst = false) (function)|컬러화POC/static/app.js:235|
|openSavedBatch|async function openSavedBatch(batchId) (function)|컬러화POC/static/app.js:244|
|deleteSavedBatch|async function deleteSavedBatch() (function)|컬러화POC/static/app.js:262|
|selectedRadio|function selectedRadio(name) (function)|컬러화POC/static/app.js:279|
|updateBatchScopeHelp|function updateBatchScopeHelp() (function)|컬러화POC/static/app.js:283|
|numberValue|function numberValue(selector) (function)|컬러화POC/static/app.js:290|
|normalizedSettings|function normalizedSettings(raw, defaultInvert = true) (function)|컬러화POC/static/app.js:295|
|currentSettings|function currentSettings() (function)|컬러화POC/static/app.js:315|
|comparableColorSettings|function comparableColorSettings(settings) (function)|컬러화POC/static/app.js:337|
|settingsEqual|function settingsEqual(first, second) (function)|컬러화POC/static/app.js:344|
|defaultSettingsFor|function defaultSettingsFor(source) (function)|컬러화POC/static/app.js:348|
|itemStatus|function itemStatus(item) (function)|컬러화POC/static/app.js:352|
|storeCurrentDraft|function storeCurrentDraft() (function)|컬러화POC/static/app.js:359|
|effectiveItemSettings|function effectiveItemSettings(item) (function)|컬러화POC/static/app.js:364|
|updateRangeOutputs|function updateRangeOutputs() (function)|컬러화POC/static/app.js:371|
|updateNormalizationControls|function updateNormalizationControls() (function)|컬러화POC/static/app.js:378|
|updateSourceControls|function updateSourceControls() (function)|컬러화POC/static/app.js:387|
|applySettings|function applySettings(settings, source) (function)|컬러화POC/static/app.js:393|
|formatNumber|function formatNumber(value) (function)|컬러화POC/static/app.js:412|
|applyImageInfo|function applyImageInfo(info, resetDerived = false) (function)|컬러화POC/static/app.js:418|
|applySourceInfo|function applySourceInfo(source) (function)|컬러화POC/static/app.js:433|
|resetMainPanel|function resetMainPanel() (function)|컬러화POC/static/app.js:447|
|visibleItems|function visibleItems() (function)|컬러화POC/static/app.js:473|
|acquisitionTooltip|function acquisitionTooltip(acquisition) (function)|컬러화POC/static/app.js:487|
|pathFilename|function pathFilename(relativePath) (function)|컬러화POC/static/app.js:499|
|applyRenamedItem|function applyRenamedItem(updated) (function)|컬러화POC/static/app.js:503|
|beginItemNameEdit|function beginItemNameEdit(item, label) (function)|컬러화POC/static/app.js:519|
|resetItemNames|async function resetItemNames() (function)|컬러화POC/static/app.js:577|
|renderFileList|function renderFileList() (function)|컬러화POC/static/app.js:598|
|scheduleFileListRender|function scheduleFileListRender() (function)|컬러화POC/static/app.js:693|
|selectItem|async function selectItem(itemId) (function)|컬러화POC/static/app.js:702|
|scheduleRender|function scheduleRender(delay = 170) (function)|컬러화POC/static/app.js:733|
|renderPreview|async function renderPreview() (function)|컬러화POC/static/app.js:738|
|resetBatch|function resetBatch(batch) (function)|컬러화POC/static/app.js:777|
|makeUploadChunks|function makeUploadChunks(entries) (function)|컬러화POC/static/app.js:791|
|updateImportProgress|function updateImportProgress(completed, total, message) (function)|컬러화POC/static/app.js:809|
|setImportSummary|function setImportSummary(message = "") (function)|컬러화POC/static/app.js:817|
|duplicateImageGroups|function duplicateImageGroups(items) (function)|컬러화POC/static/app.js:823|
|resolveDuplicateImages|async function resolveDuplicateImages(batchId, items) (function)|컬러화POC/static/app.js:834|
|cancelImport|function cancelImport() (function)|컬러화POC/static/app.js:869|
|uploadEntries|async function uploadEntries(entries, sourceType, label) (function)|컬러화POC/static/app.js:877|
|worker|async function worker() (function)|컬러화POC/static/app.js:924|
|saveCurrentSettings|async function saveCurrentSettings() (function)|컬러화POC/static/app.js:997|
|filenameFromResponse|function filenameFromResponse(response, fallback) (function)|컬러화POC/static/app.js:1026|
|saveBlob|function saveBlob(blob, filename) (function)|컬러화POC/static/app.js:1034|
|downloadItem|async function downloadItem(item, format) (function)|컬러화POC/static/app.js:1045|
|createRegionId|function createRegionId() (function)|컬러화POC/static/app.js:1069|
|roiColor|function roiColor(label) (function)|컬러화POC/static/app.js:1074|
|populateRoiLabels|function populateRoiLabels(labels, preferred = null) (function)|컬러화POC/static/app.js:1083|
|addRoiLabel|async function addRoiLabel() (function)|컬러화POC/static/app.js:1098|
|renameRoiLabel|async function renameRoiLabel() (function)|컬러화POC/static/app.js:1117|
|selectedRoiRegion|function selectedRoiRegion() (function)|컬러화POC/static/app.js:1149|
|updateRoiStatus|function updateRoiStatus(message = null) (function)|컬러화POC/static/app.js:1153|
|setRoiDirty|function setRoiDirty(dirty = true) (function)|컬러화POC/static/app.js:1168|
|renderRoiRegionList|function renderRoiRegionList() (function)|컬러화POC/static/app.js:1173|
|updateRoiToolButtons|function updateRoiToolButtons() (function)|컬러화POC/static/app.js:1206|
|setRoiTool|function setRoiTool(tool) (function)|컬러화POC/static/app.js:1216|
|roiCanvasSize|function roiCanvasSize() (function)|컬러화POC/static/app.js:1230|
|roiTransform|function roiTransform() (function)|컬러화POC/static/app.js:1236|
|eventCanvasPoint|function eventCanvasPoint(event) (function)|컬러화POC/static/app.js:1249|
|canvasPointToImage|function canvasPointToImage(point, allowOutside = false) (function)|컬러화POC/static/app.js:1254|
|resizeRoiCanvas|function resizeRoiCanvas() (function)|컬러화POC/static/app.js:1268|
|rgbaColor|function rgbaColor(hex, alpha) (function)|컬러화POC/static/app.js:1282|
|drawRegion|function drawRegion(ctx, region, transform, selected = false) (function)|컬러화POC/static/app.js:1288|
|drawRoiCanvas|function drawRoiCanvas() (function)|컬러화POC/static/app.js:1331|
|finishPolygonDraft|function finishPolygonDraft() (function)|컬러화POC/static/app.js:1387|
|deleteSelectedRoi|function deleteSelectedRoi() (function)|컬러화POC/static/app.js:1408|
|selectedHandleAt|function selectedHandleAt(canvasPoint) (function)|컬러화POC/static/app.js:1419|
|canAdjustExistingRoi|function canAdjustExistingRoi() (function)|컬러화POC/static/app.js:1441|
|hitTestRegion|function hitTestRegion(imagePoint, canvasPoint = null) (function)|컬러화POC/static/app.js:1447|
|updateRoiHoverState|function updateRoiHoverState(canvasPoint, imagePoint) (function)|컬러화POC/static/app.js:1480|
|handleRoiPointerDown|function handleRoiPointerDown(event) (function)|컬러화POC/static/app.js:1490|
|handleRoiPointerMove|function handleRoiPointerMove(event) (function)|컬러화POC/static/app.js:1582|
|handleRoiPointerUp|function handleRoiPointerUp(event) (function)|컬러화POC/static/app.js:1651|
|changeRoiZoom|function changeRoiZoom(multiplier, anchor = null) (function)|컬러화POC/static/app.js:1670|
|fitRoiCanvas|function fitRoiCanvas() (function)|컬러화POC/static/app.js:1688|
|closeRoiEditor|function closeRoiEditor(force = false) (function)|컬러화POC/static/app.js:1695|
|openRoiEditor|async function openRoiEditor() (function)|컬러화POC/static/app.js:1711|
|saveRoiAnnotations|async function saveRoiAnnotations() (function)|컬러화POC/static/app.js:1771|
|downloadCurrentRoiVia|async function downloadCurrentRoiVia() (function)|컬러화POC/static/app.js:1817|
|updateBatchJob|function updateBatchJob(job) (function)|컬러화POC/static/app.js:1830|
|pollBatchJob|async function pollBatchJob() (function)|컬러화POC/static/app.js:1855|
|startBatchExport|async function startBatchExport(format) (function)|컬러화POC/static/app.js:1871|
|startViaExport|async function startViaExport() (function)|컬러화POC/static/app.js:1906|
|cancelBatchExport|async function cancelBatchExport() (function)|컬러화POC/static/app.js:1930|
|bindEvents|function bindEvents() (function)|컬러화POC/static/app.js:1940|
|initialize|async function initialize() (function)|컬러화POC/static/app.js:2106|
|formatValue|const formatValue = (value) =&gt; (arrow function)|컬러화POC/static/app.js:488|
|cancel|const cancel = () =&gt; (arrow function)|컬러화POC/static/app.js:532|
|commit|const commit = async () =&gt; (arrow function)|컬러화POC/static/app.js:537|

#### F-053 — 컬러화POC/static/roi_geometry.js

- 범위: 독립 컬러화 UI/기하; import: 정적/자체 스크립트.
- 연결 US: US-040.

|이름|시그니처/종류|근거|
|---|---|---|
|attachRoiGeometry|function attachRoiGeometry(root, factory) (function)|컬러화POC/static/roi_geometry.js:1|
|clamp|function clamp(value, minimum, maximum) (function)|컬러화POC/static/roi_geometry.js:6|
|imageToCanvas|function imageToCanvas(point, transform) (function)|컬러화POC/static/roi_geometry.js:32|
|canvasToImage|function canvasToImage(point, transform, imageWidth, imageHeight, round = true) (function)|컬러화POC/static/roi_geometry.js:39|
|distance|function distance(first, second) (function)|컬러화POC/static/roi_geometry.js:52|
|distanceToSegment|function distanceToSegment(point, start, end) (function)|컬러화POC/static/roi_geometry.js:56|
|pointInPolygon|function pointInPolygon(point, points) (function)|컬러화POC/static/roi_geometry.js:68|
|regionBounds|function regionBounds(region) (function)|컬러화POC/static/roi_geometry.js:80|
|translateRegionWithinBounds|function translateRegionWithinBounds(region, deltaX, deltaY, imageWidth, imageHeight) (function)|컬러화POC/static/roi_geometry.js:99|

#### F-054 — 컬러화POC/tests/roi_geometry.test.js

- 범위: 회귀 시험; import: 정적/자체 스크립트.
- 연결 US: 공통 연결은 API·UI 표/호출자 참조; 직접 US 미확정.

|이름|시그니처/종류|근거|
|---|---|---|
|명시 함수 없음|상수·re-export·브라우저 엔트리/모듈 초기화는 원본 참조|컬러화POC/tests/roi_geometry.test.js:1|

## C. 핵심 알고리즘 ALG-01~21

아래 동작은 정적 분석이다. 설정/분모/경계조건을 추정 기본값으로 채우지 않는다. 단계의 화살표는 실제 호출 순서이며 과거 Sprint 일정이 아니다.

### ALG-01 — 인증·가입·권한

|항목|명세|
|---|---|
|소속/함수|AuthService.register/login, JwtTokenProvider.generateToken, JwtAuthFilter.doFilterInternal, SecurityConfig.filterChain|
|입력|username/name/password/role·Bearer JWT|
|전제|활성계정·비밀키 설정|
|단계|1) 가입:중복ID·역할·이름검사→명단존재시ACTIVE/아니면PENDING→BCrypt→User저장→명단claim. 2) 로그인:ID조회→해시비교→상태검사→subject=username/role/iat/exp JWT발급. 3)요청:Bearer 검증→ROLE_권한→URL matcher. 공개가입은STUDENT만.|
|출력|가입상태 또는 accessToken/tokenType/role/username/name|
|예외·경계|잘못된자격은현재BadRequest400;없거나유효하지않은JWT는인증실패401;권한오류403. JWT만검증하므로기존토큰상태재검사는없음.|
|설정·임계값·분모|dev만기기본24h;stateless·CSRF비활성·BCrypt|
|읽기/쓰기 DB·파일|users·student_roster|
|관련 요구·태스크|US-001 / TK-001-01/02; US-002 / TK-002-01/02; US-004 / TK-004-01/02|
|API|POST /api/auth/login; POST /api/auth/register; GET /api/tasks; GET /api/admin/users; GET /api/analytics/students/{studentId}/history|
|근거|backend/src/main/java/com/cell/platform/service/AuthService.java:26; backend/src/main/java/com/cell/platform/config/JwtTokenProvider.java:14; backend/src/main/java/com/cell/platform/config/JwtAuthFilter.java:17; backend/src/main/java/com/cell/platform/config/SecurityConfig.java:24|

### ALG-02 — 브라우저 세션 동기화·이전요청 차단

|항목|명세|
|---|---|
|소속/함수|createAuthSession/watchAuthSession, createApiClient, AuthImage/fetchAuthImage|
|입력|로그인응답·storage/focus/visibility이벤트|
|전제|같은 origin localStorage|
|단계|legacy4키→단일cell-auth-session-v1/sessionId로이행→문서초기세션고정→세션변경시역할홈reload→모든요청/응답에서assertCurrent→구세션결과폐기. 현세션보호요청401만clear;공개로그인실패는세션보존.|
|출력|다른탭동기화·구계정화면요청취소|
|예외·경계|늦은이전401/200은새세션을덮어쓰거나로그아웃시키지않음. 브라우저상태표시일뿐서버인가는별도.|
|설정·임계값·분모|localStorage record·새sessionId|
|읽기/쓰기 DB·파일|브라우저저장소;추가DB없음|
|관련 요구·태스크|US-003 / TK-003-01/02|
|API|프런트엔드 로컬 동작; POST /api/auth/login|
|근거|frontend/src/utils/authSession.js:20; frontend/src/api/createApiClient.js:3|

### ALG-03 — 업로드·파일·과제 생성

|항목|명세|
|---|---|
|소속/함수|TaskService.createTask/createAssignment, FileStorageService.saveOriginal/ensureThumbnail, AiClientService.analyze|
|입력|file또는title/files/speciesIds/deadlineAt|
|전제|MySQL·파일쓰기권한·AI모델준비|
|단계|미래마감/최소파일/종개수확인→Assignment저장→각영상UUID원본·최대320썸네일→multipart분석호출→returnedcrop를Task에추가→JPA저장. prediction은pseudoLabel,classificationconfidence만저장하며bboxconfidence는null.|
|출력|TaskUploadResponse/AssignmentResponse|
|예외·경계|UI이미지필터외서버magic/MIME검증빈약. AI실패500/T002. DB트랜잭션이실패해도원본/crop파일보상삭제없음. AI서버도원본을별도이름으로저장.|
|설정·임계값·분모|CELL multipart max-file/max-request50MB;WebClient block() 명시timeout없음|
|읽기/쓰기 DB·파일|assignments·tasks·crops·animal_species·FS|
|관련 요구·태스크|US-011 / TK-011-01/02; US-012 / TK-012-01/02; US-030 / TK-030-01/02|
|API|POST /api/tasks/upload; POST AI:/api/analyze; POST /api/assignments; GET /data/** (리소스 핸들러)|
|근거|backend/src/main/java/com/cell/platform/service/TaskService.java:34; backend/src/main/java/com/cell/platform/service/FileStorageService.java:23; backend/src/main/java/com/cell/platform/service/AiClientService.java:20|

### ALG-04 — 조회·마감·삭제·상태

|항목|명세|
|---|---|
|소속/함수|TaskService.getAllTasks/updateTaskDeadline/updateAssignmentDeadline/deleteTask/deleteAssignment, Task.create|
|입력|taskId/assignmentId/deadlineAt|
|전제|로그인·권한·대상과제|
|단계|ID역순목록→assignmentId로프런트묶음. 마감변경:assignment개별도말/진단과제거부→이미마감이면변경불가→미래검사→갱신. 삭제:crop제출→행렬/신고→Task;Assignment면Task순회후Assignment.|
|출력|Task[]·200/204|
|예외·경계|미존재T000/404;과거마감400. DELETE URL권한미비가능. 파일삭제코드없음. TaskStatus초기IN_PROGRESS;COMPLETED enum만으로실제전이확정불가.|
|설정·임계값·분모|현재시각LocalDateTime;생성시마감없음허용|
|읽기/쓰기 DB·파일|tasks·assignments·crops·submissions·reports·matrix|
|관련 요구·태스크|US-013 / TK-013-01/02; US-014 / TK-014-01/02; US-015 / TK-015-01/02|
|API|GET /api/tasks; GET /api/assignments/{assignmentId}/tasks; GET /api/tasks/{taskId}/crops; GET /api/assignments/{assignmentId}/crops; PUT /api/tasks/{taskId}/deadline; PUT /api/assignments/{assignmentId}/deadline; DELETE /api/tasks/{taskId}; DELETE /api/assignments/{assignmentId}|
|근거|backend/src/main/java/com/cell/platform/service/TaskService.java:34; backend/src/main/java/com/cell/platform/domain/task/Task.java:11|

### ALG-05 — 답안 upsert·진행률·잠금

|항목|명세|
|---|---|
|소속/함수|SubmissionService.submit/isSubmissionLocked, SubmissionController.submit/resolveStudentId, StudentPage.handleSubmit|
|입력|cropId/studentLabel·principal|
|전제|과제/crop존재·잠금전|
|단계|과제범위snapshot구성→마감/완료잠금검사→6라벨파싱→학생/crop기존답안조회→갱신또는저장→정답있으면기존혼동행렬항목차감/새항목가산. 화면답변즉시POST→다음미응답index→이미푼답변복원.|
|출력|200·submissions·진행률|
|예외·경계|일반마감후잠금;전답변+전GT이면잠금;진단전답변이면잠금. 별도임시저장/최종제출API없음. 중복동시요청DBunique없음.|
|설정·임계값·분모|6클래스·진행률=학생답안수/총crop|
|읽기/쓰기 DB·파일|submissions·crops·tasks·matrix|
|관련 요구·태스크|US-016 / TK-016-01/02|
|API|POST /api/submit; GET /api/tasks/{taskId}/submissions/{studentId}; GET /api/tasks/{taskId}/submissions/{studentId}/labels; GET /api/assignments/{assignmentId}/submissions/{studentId}; GET /api/assignments/{assignmentId}/submissions/{studentId}/labels|
|근거|backend/src/main/java/com/cell/platform/service/SubmissionService.java:46; backend/src/main/java/com/cell/platform/controller/SubmissionController.java:18; frontend/src/pages/StudentPage.jsx:271|

### ALG-06 — 학생 채점·복습·누적행렬

|항목|명세|
|---|---|
|소속/함수|SubmissionService.resolveCorrectLabel/getMyResults/getStudentReviews/getCumulativeStudentMatrices|
|입력|studentId/과제범위/저장답안|
|전제|결과공개조건충족|
|단계|정답:final우선;일반final없으면null;진단gt다음manifest. 공개:답변·crop있고일반(마감또는전답변+전GT),진단전답변. 제출답안별정오답·채점대기분리→행렬[정답][학생라벨]가산. 복습scope를과제/Task/진단별구성. 누적은대상Task의저장행렬을학생별/ALL로합산.|
|출력|MyResults/StudentReview/studentMatrices|
|예외·경계|미공개결과400(Controller)·미제출/미확정구분. 학생URL ID는principal로대체. 기존저장행렬이부정확하면누적에도영향.|
|설정·임계값·분모|자기결과accuracy=round(correct/(correct+wrong)*100);혼동행렬전클래스초기0|
|읽기/쓰기 DB·파일|submissions·crops·tasks·matrix·manifest|
|관련 요구·태스크|US-017 / TK-017-01/02; US-023 / TK-023-01/02|
|API|GET /api/tasks/{taskId}/my-results/{studentId}; GET /api/assignments/{assignmentId}/my-results/{studentId}; GET /api/student/reviews; GET /api/tasks/diagnostic/student-matrices; GET /api/tasks/{taskId}/diagnostic/student-matrices|
|근거|backend/src/main/java/com/cell/platform/service/SubmissionService.java:46|

### ALG-07 — GT 확정·재수정·완료 배지

|항목|명세|
|---|---|
|소속/함수|CropService.confirmLabel, SubmissionService.backfillConfusionMatrixForCrop, AnalyticsFeedback.handleConfirmLabel|
|입력|cropId/finalLabel|
|전제|EXPERT/ADMIN·유효클래스|
|단계|기존final보관→entity.final갱신→해당crop모든학생응답별기존정답행-1/새정답행+1→트랜잭션. 화면현재crop선택유지→도말통계/전체통계재조회. 완료는final있는crop수=전체수로계산.|
|출력|200·갱신GT/행렬/배지|
|예외·경계|미존재404·라벨오류400. Confirm후자동다음이동없음;◀▶는별도. GT확정해제(null)용API없음.|
|설정·임계값·분모|행렬차감최소0;빈crop은완료아님|
|읽기/쓰기 DB·파일|crops·submissions·matrix|
|관련 요구·태스크|US-018 / TK-018-01/02; US-019 / TK-019-01/02|
|API|PUT /api/crops/{cropId}/confirm; GET /api/all-stats; GET /api/tasks/{taskId}/stats|
|근거|backend/src/main/java/com/cell/platform/service/CropService.java:23; backend/src/main/java/com/cell/platform/service/SubmissionService.java:46; frontend/src/components/AnalyticsFeedback.jsx:1|

### ALG-08 — 투표·응답자·도말학생 점수

|항목|명세|
|---|---|
|소속/함수|StatsService.buildStatsList/buildCropStats, summarizeStudentResponses|
|입력|crop들과제출·사용자이름|
|전제|권한있는통계조회|
|단계|cropId별제출group→voteDistribution·votersByLabel생성→final기준틀린답집계→error/accuracy/hardScore→정렬. 도말비교표는학생별answers Map을재구성하고전GT확정시전체crop분모점수.|
|출력|CropStats[]·학생비교표|
|예외·경계|미확정GT는채점불가;응답0경계. 전체통계는votersByLabel빈배열. 없는응답상세와학생무응답을구분.|
|설정·임계값·분모|error=wrong/answers*100;accuracy=100-error;hardScore=error(정답미설정0);도말점수=correct/totalcrop|
|읽기/쓰기 DB·파일|crops·submissions·users|
|관련 요구·태스크|US-020 / TK-020-01/02; US-021 / TK-021-01/02|
|API|GET /api/tasks/{taskId}/stats; GET /api/all-stats|
|근거|backend/src/main/java/com/cell/platform/service/StatsService.java:21; frontend/src/utils/studentResponses.js:2|

### ALG-09 — 학생 학습 이력·전체문항 분모

|항목|명세|
|---|---|
|소속/함수|StudentAnalyticsService.getHistory/getTaskDetail/buildCells/summarize/combine|
|입력|studentId/taskId|
|전제|EXPERT/ADMIN|
|단계|Task전체·crop·학생답안읽기→Assignment별group→셀별studentLabel/correctLabel/isCorrect구성→미응답/채점대기분리→과제/Task요약. 프런트learningStatus는답변수완료와마감을독립판정.|
|출력|StudentLearningResponse(Activity/TaskDetail/Summary/CellResult)|
|예외·경계|미존재Task404;유저없는ID그자체를유저존재검사로거부하는코드없음. pending=답변수-correct-wrong. 모든GT준비전accuracy null.|
|설정·임계값·분모|모든셀정답있어야labelingComplete;accuracy=round(correct*1000/total)/10(미응답포함)|
|읽기/쓰기 DB·파일|tasks·crops·submissions|
|관련 요구·태스크|US-022 / TK-022-01/02|
|API|GET /api/analytics/students/{studentId}/history; GET /api/analytics/students/{studentId}/tasks/{taskId}|
|근거|backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:24; frontend/src/utils/studentLearning.js:1|

### ALG-10 — 관리자·명단·종 메타데이터

|항목|명세|
|---|---|
|소속/함수|AdminService, AnimalSpeciesService|
|입력|계정/상태/명단/종이름/종ID|
|전제|ADMIN 또는종API EXERT/ADMIN|
|단계|관리자계정생성/삭제/상태변경보호→사용자상태갱신. 명단은trim·빈/중복skip후추가(기존PENDING자동승인없음). 기본DOG/CAT보장·기존누락종보정·사용자종고유code생성·task종변경.|
|출력|사용자/명단/종응답·added/skipped|
|예외·경계|명단후추가가과거가입상태를자동변경하지않음. 종이름대소문자중복·빈이름·미존재거부. 종메타와AI모델은독립.|
|설정·임계값·분모|종name&lt;=60·code&lt;=40;DOG/CAT기본|
|읽기/쓰기 DB·파일|users·student_roster·animal_species·tasks|
|관련 요구·태스크|US-005 / TK-005-01/02; US-006 / TK-006-01/02; US-007 / TK-007-01/02; US-008 / TK-008-01/02; US-009 / TK-009-01/02; US-010 / TK-010-01/02; US-029 / TK-029-01/02|
|API|GET /api/admin/users; POST /api/admin/users; PUT /api/admin/users/{userId}/status; DELETE /api/admin/users/{username}; GET /api/admin/student-roster; POST /api/admin/student-roster; GET /api/species; POST /api/species; PUT /api/species/{speciesId}; PUT /api/tasks/{taskId}/species; GET /api/admin/smears; GET /api/admin/crops|
|근거|backend/src/main/java/com/cell/platform/service/AdminService.java:37; backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24|

### ALG-11 — 진단 GT 데이터·표본 선택

|항목|명세|
|---|---|
|소속/함수|DiagnosticDatasetService.loadCells/sampleCells, DiagnosticTaskService.createDiagnosticTask|
|입력|totalQuestions/classDistribution|
|전제|processed manifest 존재·crop준비|
|단계|manifestarray→유효cropFilename/label/bbox수집→클래스별보유량→라벨키/분포합/보유초과검사→클래스별shuffle후requested개비복원선택→전체shuffle→DOG진단Task및gt/finalcrop저장.|
|출력|진단Task·poolStats|
|예외·경계|음수분포는0정규화;알수없는키·합계불일치·보유초과400;manifest읽기/매핑오류500. GT/일반문제를임의비율로섞는기능은확인안됨.|
|설정·임계값·분모|min totalQuestions1;진단uploadedFilename diagnostic- prefix;마감설정불가|
|읽기/쓰기 DB·파일|tasks·crops·manifest·animal_species|
|관련 요구·태스크|US-024 / TK-024-01/02|
|API|GET /api/tasks/diagnostic/pool-stats; POST /api/tasks/diagnostic/create|
|근거|backend/src/main/java/com/cell/platform/service/DiagnosticDatasetService.java:20; backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:25|

### ALG-12 — 문제 세포 신고

|항목|명세|
|---|---|
|소속/함수|CropIssueReportService.createReport/getReports, CropIssueReportRequest|
|입력|taskId/cropId/studentId/reason|
|전제|로그인·목록조회EXPERT/ADMIN|
|단계|DTO에서 taskId/cropId null·studentId/reason 공백 검사→요청값 그대로 신고 저장. 목록은crop를조회해있으면파일/종을붙이고없으면null/DOG fallback→프런트사유필터.|
|출력|200·CropIssueReportResponse[]|
|예외·경계|studentId는principal치환없고Task/Crop존재·소속검사도없음. 신고해결상태/승인/삭제API없음.|
|설정·임계값·분모|프런트기본사유5개(잘림/없는영역/화질/헷갈림/기타)|
|읽기/쓰기 DB·파일|crop_issue_reports·tasks·crops|
|관련 요구·태스크|US-025 / TK-025-01/02; US-026 / TK-026-01/02|
|API|POST /api/reports; GET /api/reports|
|근거|backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18; backend/src/main/java/com/cell/platform/dto/request/CropIssueReportRequest.java:8|

### ALG-13 — VIA2.0.10 좌표·클래스·파일 교환

|항목|명세|
|---|---|
|소속/함수|LabelingService.exportTask/buildViaJson/importLabels|
|입력|taskId/VIA JSON|
|전제|실제업로드도말·파일존재·EXPERT/ADMIN|
|단계|export:bboxxyxy→rect(x,y,width,height)→고정6클래스option1~6·cropId·종metadata→원본/crop/annotations.zip. label은final우선gt차선. import:_via_img_metadata.regions→cropId가해당Task인지검사→attribute1에서첫trueoption→gt/final갱신.|
|출력|ZIP/updated 개수|
|예외·경계|진단과제거부;없는파일500·다른taskcrop400;불완전행건너뜀;option키정수변환일반예외가능. import는기존행렬소급갱신안함.|
|설정·임계값·분모|option순서 Segment,Band,Eosinophil,NucleatedRBC,Lymphocyte,Monocyte;VIA2.0.10|
|읽기/쓰기 DB·파일|tasks·crops·원본/crop파일|
|관련 요구·태스크|US-027 / TK-027-01/02; US-028 / TK-028-01/02|
|API|GET /api/labeling/tasks/{taskId}/export; POST /api/labeling/tasks/{taskId}/import|
|근거|backend/src/main/java/com/cell/platform/service/LabelingService.java:34|

### ALG-14 — 영상 표시 조정

|항목|명세|
|---|---|
|소속/함수|useImageDisplaySettings/getImageDisplayFilter, ImageDisplayControls|
|입력|brightness/contrast/saturation|
|전제|영상로드·브라우저저장소|
|단계|사용자+imageKey설정load→슬라이더값저장→CSS filter문자열→img와Canvas draw 적용→초기화100%.|
|출력|조정된화면(원본파일동일)|
|예외·경계|브라우저에만보관;모델입력/정답파일변경없음. 자동염색표준화·화질복원없음.|
|설정·임계값·분모|밝기50~150%;대비50~180%;채도0~180%|
|읽기/쓰기 DB·파일|localStorage|
|관련 요구·태스크|US-031 / TK-031-01/02|
|API|추가 API 없음|
|근거|frontend/src/components/ImageDisplayControls.jsx:1|

### ALG-15 — YOLO→crop→DenseNet 추론

|항목|명세|
|---|---|
|소속/함수|ModelLoader.load_all, DetectorService.detect_and_crop, ClassifierService.classify, PipelineService.run|
|입력|업로드영상|
|전제|weights2개·OpenCV/PyTorch|
|단계|시작시device선택cuda_available?cuda:cpu→YOLOweights와torchvision.densenet201(classifier Linear6)로드/eval. 영상저장→YOLO(image_path)의box.xyxy를int→cv2 crop/JPG UUID→BGR→RGB PIL→Resize256²/ToTensor/ImageNetNormalize→batch1→no_grad/softmax/argmax→confidence소수4자리.|
|출력|total_detected,cells[crop_filename,bbox문자열,prediction,confidence]|
|예외·경계|503모델미준비;파일/빈box/cv2실패의개별정교한처리없음. detector class/nms/conf threshold는자체명시없어라이브러리기본값·weights세부미확인. bboxconfidence는반환안함.|
|설정·임계값·분모|CLASS_NAMES순서Band,Segment,Lymphocyte,Monocyte,Eosinophil,NucleatedRBC;mean.485/.456/.406,std.229/.224/.225|
|읽기/쓰기 DB·파일|ai-server/weights/*.pt/*.pth·data/originals·data/crops|
|관련 요구·태스크|US-032 / TK-032-01/02|
|API|POST AI:/api/analyze; GET AI:/health|
|근거|ai-server/app/services/model_loader.py:16; ai-server/app/services/detector.py:21; ai-server/app/services/classifier.py:20; ai-server/app/routers/analyze_router.py:12|

### ALG-16 — 학습 데이터 준비·미연결 재학습

|항목|명세|
|---|---|
|소속/함수|CropService.getConfirmedTrainingData, retrain_router, PseudoLabelService.normalizeConfusionMatrix, tools.prepare_dataset|
|입력|finalLabel목록·epochs/batch_size/learning_rate|
|전제|추출은로그인;router연결은현재문제있음|
|단계|final있는crop목록→router가localhost8080로무인증GET→최소10/파일존재검사→분포집계→READY. trainer호출은주석. PseudoLabelService는행합정규화만. tools는원천YOLO label에서6종crop/manifest준비.|
|출력|TrainingData[] 또는READY;학습된모델아님|
|예외·경계|학습실행·모델평가·가중치교체·서빙갱신·posterior임계정책·스케줄미발견. 데이터준비script를학습script로부르지않음.|
|설정·임계값·분모|epochs10,batch16,lr.001 요청기본값은있으나학습소비안함;최소10건|
|읽기/쓰기 DB·파일|crops·진단manifest·weights(변경루프없음)|
|관련 요구·태스크|US-033 / TK-033-01/02; US-034 / TK-034-01/02|
|API|GET /api/training-data; POST AI:/api/retrain|
|근거|backend/src/main/java/com/cell/platform/service/CropService.java:23; backend/src/main/java/com/cell/platform/service/PseudoLabelService.java:9; ai-server/app/routers/retrain_router.py:26; ai-server/tools/prepare_diagnostic_gt_dataset.py:68|

### ALG-17 — 부가 게임 점수

|항목|명세|
|---|---|
|소속/함수|GameRecordService.saveRecords/getLeaderboard/deleteAll|
|입력|mode,players(name,score)|
|전제|ADMIN|
|단계|HTML게임→부모iframe인증headers요청→유효양수기록저장→모드별점수내림차순top15→관리자전체삭제.|
|출력|기록·leaderboard|
|예외·경계|비양수점수필터만명시. 빈이름/mode/players null 검증은서비스에서확인되지않음;교육과제점수와별개.|
|설정·임계값·분모|상위15;mode기본EASY|
|읽기/쓰기 DB·파일|game_records|
|관련 요구·태스크|US-035 / TK-035-01/02|
|API|POST /api/game/records; GET /api/game/leaderboard; DELETE /api/game/records|
|근거|backend/src/main/java/com/cell/platform/service/GameRecordService.java:18; frontend/src/pages/BombGamePage.jsx:1; frontend/src/assets/bomb-game.html:1113|

### ALG-18 — 컬러화 계정·영구작업·촬영분류

|항목|명세|
|---|---|
|소속/함수|api_register/api_login, save_uploaded_file/add_batch_item/get_batch/get_item, dicom_acquisition_summary|
|입력|DICOMfiles·relativePaths·별도계정|
|전제|Flask세션·SQLite·user전용파일|
|단계|인증소유권→크기/quota읽으며저장/hash→pydicom메타/화소검사→batch/item SQLite저장→다시로그인시목록복원. 이름변경은경로정리/확장자/중복정책. ActualFrameDuration60000±500면time60우선,아니고CountsAccumulated200000이면counts200000. 미기록촬영조건은시작시백필.|
|출력|작업·item정보·저장설정·촬영유형|
|예외·경계|파일별실패는items[].error로반환하고실패파일삭제. 잘못된계정·소유권·quota거부. CELL계정과SSO아님.|
|설정·임계값·분모|파일512MiB;요청528MiB;기본quota10GiB;user3~40자/password8~128자;캐시12;Secure환경설정|
|읽기/쓰기 DB·파일|SQLite.users/batches/items·전용볼륨uploads|
|관련 요구·태스크|US-036 / TK-036-01/02; US-037 / TK-037-01/02; US-038 / TK-038-01/02|
|API|POST COLOR:/api/auth/register; POST COLOR:/api/auth/login; POST COLOR:/api/auth/logout; GET COLOR:/api/auth/me; POST COLOR:/api/batches; GET COLOR:/api/batches; POST COLOR:/api/batches/&lt;batch_id&gt;/files; POST COLOR:/api/batches/&lt;batch_id&gt;/remove-items; GET COLOR:/api/batches/&lt;batch_id&gt;; DELETE COLOR:/api/batches/&lt;batch_id&gt;; GET COLOR:/api/items/&lt;item_id&gt;; PATCH COLOR:/api/items/&lt;item_id&gt;/name; POST COLOR:/api/batches/&lt;batch_id&gt;/reset-item-names|
|근거|컬러화POC/app.py:510; 컬러화POC/app.py:622; 컬러화POC/app.py:1276; 컬러화POC/app.py:1360|

### ALG-19 — DICOM 픽셀·정규화·컬러맵

|항목|명세|
|---|---|
|소속/함수|read_dicom_bytes/normalize_frame/render_colormap/canonical_settings/api_render_item|
|입력|normalization,colormap,gamma,backgroundThreshold,bounds/window|
|전제|PixelData·지원디코더|
|단계|force dcmread→pixelarray;회색은modalityLUT,RGB는가중휘도→frame축. 현재웹render/download는frames[0]. 유한픽셀정리→linear/percentile/window/histogram1024bin/log→clip0..1→옵션invert→power(1/gamma)→colormap RGB8bit→PNG/JPG.|
|출력|흑백/컬러/scale dataURL·파일·metadata|
|예외·경계|다중프레임파싱은하나웹선택기능은확인안됨. PixelData/압축코덱/유효픽셀오류·설정범위거부. 현재UI gamma.2~3·threshold%0~100(내부비율로변환).|
|설정·임계값·분모|정규화5종·컬러맵13종;흑백invert기본true,color에는적용안함;JPGquality1~100|
|읽기/쓰기 DB·파일|SQLite.color_settings·원본DICOM|
|관련 요구·태스크|US-039 / TK-039-01/02|
|API|POST COLOR:/api/items/&lt;item_id&gt;/render; PUT COLOR:/api/items/&lt;item_id&gt;/settings; POST COLOR:/api/items/&lt;item_id&gt;/download|
|근거|컬러화POC/dicom_processing.py:71; 컬러화POC/dicom_processing.py:159; 컬러화POC/dicom_processing.py:238; 컬러화POC/app.py:233; 컬러화POC/app.py:1493|

### ALG-20 — ROI 기하·라벨 검증

|항목|명세|
|---|---|
|소속/함수|canonical_regions/canonical_roi_label, roi_geometry.js, ColorizerStore.save_annotations|
|입력|polygon점목록또는ellipse중심/반경·label·rows/columns|
|전제|본인영상·등록라벨|
|단계|정수좌표범위/도형형식/다각형점수·타원반경검증→라벨검사→user+contenthash JSON저장→VIA polygon/ellipse속성으로export. JS는선택/이동/resize/zoom 좌표변환.|
|출력|ROI JSON·VIA·라벨목록|
|예외·경계|ROI초과·범위밖좌표·알수없는라벨/중복거부;DB와영상크기대조.|
|설정·임계값·분모|파일당500영역·polygon3~2000점·라벨32·이름40자|
|읽기/쓰기 DB·파일|SQLite.roi_annotations·roi_labels|
|관련 요구·태스크|US-040 / TK-040-01/02|
|API|GET COLOR:/api/roi-labels; POST COLOR:/api/roi-labels; PUT COLOR:/api/roi-labels; GET COLOR:/api/items/&lt;item_id&gt;/annotations; PUT COLOR:/api/items/&lt;item_id&gt;/annotations; GET COLOR:/api/items/&lt;item_id&gt;/annotations/via|
|근거|컬러화POC/app.py:381; 컬러화POC/app.py:1588; 컬러화POC/static/roi_geometry.js:1; 컬러화POC/persistence.py:369|

### ALG-21 — 백그라운드 ZIP·VIA export

|항목|명세|
|---|---|
|소속/함수|api_create_export_job/run_export_job/run_via_export_job/cleanup_expired_jobs|
|입력|batchId,jobType images/via,scope saved/all,format/settings|
|전제|로그인·본인작업·저장ROI 또는파일|
|단계|선택파일/저장설정스냅샷→메모리job생성→executor실행→영상변환또는ROI+기준PNG ZIP→진행상태폴링→다운로드→취소·TTL정리.|
|출력|202 job/진행률/ZIP|
|예외·경계|소유권·만료·준비전다운로드·취소·렌더실패처리. job은메모리에있어서프로세스재시작시연속성보장아님.|
|설정·임계값·분모|JOB_TTL_SECONDS3600;Gunicorn1worker4threads|
|읽기/쓰기 DB·파일|전용파일·SQLite설정/ROI·메모리_jobs|
|관련 요구·태스크|US-041 / TK-041-01/02|
|API|POST COLOR:/api/export-jobs; GET COLOR:/api/export-jobs/&lt;job_id&gt;; DELETE COLOR:/api/export-jobs/&lt;job_id&gt;; GET COLOR:/api/export-jobs/&lt;job_id&gt;/download|
|근거|컬러화POC/app.py:1674; 컬러화POC/app.py:1754; 컬러화POC/app.py:1776|

## D. DB 스키마 전체 — 실제 관측과 ORM/DDL 대조

### D.1 관측 범위·관계 정책

2026-10-19 `information_schema.COLUMNS/KEY_COLUMN_USAGE/STATISTICS/REFERENTIAL_CONSTRAINTS/TRIGGERS/ROUTINES`를 **읽기 전용**으로 조회했다. celldb의 업무 데이터 값은 읽지 않았다. 실제 MySQL10테이블·61컬럼·FK3개. SQLite는 전용 컨테이너의 `colorizer.db`를 `mode=ro`로 열어 sqlite_master만 읽었다. ORM에서 유추한 타입을 실제 물리 타입처럼 확정하지 않는다. 아래 MySQL 자료형·NULL/default/index는 실제 metadata이고, JPA annotation/SQL은 추가 근거다.

실제FK: crops→tasks(N:1), submissions→crops(N:1), tasks→animal_species(N:1). DB DELETE/UPDATE 정책은 NO ACTION. Task→Crop의 JPA CascadeType.ALL/orphanRemoval=true는 ORM 정책이다. Assignment→Task·User→답안/행렬/명단/신고·Task→행렬/신고는 **스칼라ID 논리관계**이며 FK 미설정이다. User 삭제가 관련 답안/신고를 cascade 삭제한다는 근거도 없다.

### DB-M01 — animal_species

목적: DOG/CAT/사용자 정의 동물 종 메타데이터. ORM: C-084 backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:22. 아래 PK/FK/unique/index는 2026-10-19 celldb metadata 기준.

|컬럼|실제 자료형·길이|NULL 허용|DB 기본값|키 표시·추가 속성|의미/ORM 대응|
|---|---|---|---|---|---|
|id|bigint|NO|&lt;NULL&gt;|PRI auto_increment|PK 또는 식별자; Long; backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:24|
|code|varchar(40)|NO|&lt;NULL&gt;|UNI |종/오류 등 코드; String; backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:28|
|name|varchar(60)|NO|&lt;NULL&gt;|UNI |표시 이름 또는 명칭; String; backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:31|
|built_in|bit(1)|NO|b'0'| |builtIn; boolean; backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:34|
|created_at|datetime(6)|NO|&lt;NULL&gt;| |생성 시각; LocalDateTime; backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:37|
|updated_at|datetime(6)|NO|&lt;NULL&gt;| |갱신 시각; LocalDateTime; backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java:40|

인덱스: PRIMARY(id; 순서1; unique); uk_animal_species_code(code; 순서1; unique); uk_animal_species_name(name; 순서1; unique).

FK: 선언된 FK 없음.

### DB-M02 — assignments

목적: 여러 도말 Task를 묶는 과제 이름·교수. ORM: C-085 backend/src/main/java/com/cell/platform/entity/AssignmentEntity.java:11. 아래 PK/FK/unique/index는 2026-10-19 celldb metadata 기준.

|컬럼|실제 자료형·길이|NULL 허용|DB 기본값|키 표시·추가 속성|의미/ORM 대응|
|---|---|---|---|---|---|
|id|bigint|NO|&lt;NULL&gt;|PRI auto_increment|PK 또는 식별자; Long; backend/src/main/java/com/cell/platform/entity/AssignmentEntity.java:13|
|created_at|datetime(6)|YES|&lt;NULL&gt;| |생성 시각; LocalDateTime; backend/src/main/java/com/cell/platform/entity/AssignmentEntity.java:23|
|expert_username|varchar(255)|NO|&lt;NULL&gt;| |expertUsername; String; backend/src/main/java/com/cell/platform/entity/AssignmentEntity.java:20|
|title|varchar(255)|NO|&lt;NULL&gt;| |title; String; backend/src/main/java/com/cell/platform/entity/AssignmentEntity.java:17|

인덱스: PRIMARY(id; 순서1; unique).

FK: 선언된 FK 없음.

### DB-M03 — crop_issue_reports

목적: 학생이 보고한 세포/영상 문제. ORM: C-087 backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:19. 아래 PK/FK/unique/index는 2026-10-19 celldb metadata 기준.

|컬럼|실제 자료형·길이|NULL 허용|DB 기본값|키 표시·추가 속성|의미/ORM 대응|
|---|---|---|---|---|---|
|id|bigint|NO|&lt;NULL&gt;|PRI auto_increment|PK 또는 식별자; Long; backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:21|
|created_at|datetime(6)|NO|&lt;NULL&gt;| |생성 시각; LocalDateTime; backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:37|
|crop_id|bigint|NO|&lt;NULL&gt;| |대상 crop ID; Long; backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:31|
|reason|varchar(255)|NO|&lt;NULL&gt;| |신고 사유; String; backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:34|
|student_id|varchar(255)|NO|&lt;NULL&gt;| |학생 사용자 ID 문자열(실제 개인정보 값 생략); String; backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:25|
|task_id|bigint|NO|&lt;NULL&gt;| |소속 Task ID; Long; backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java:28|

인덱스: PRIMARY(id; 순서1; unique).

FK: 선언된 FK 없음.

### DB-M04 — crops

목적: 검출 세포 파일·bbox·원천/AI/최종 라벨. ORM: C-086 backend/src/main/java/com/cell/platform/entity/CropEntity.java:11. 아래 PK/FK/unique/index는 2026-10-19 celldb metadata 기준.

|컬럼|실제 자료형·길이|NULL 허용|DB 기본값|키 표시·추가 속성|의미/ORM 대응|
|---|---|---|---|---|---|
|id|bigint|NO|&lt;NULL&gt;|PRI auto_increment|PK 또는 식별자; Long; backend/src/main/java/com/cell/platform/entity/CropEntity.java:13|
|ai_bbox_confidence|double|YES|&lt;NULL&gt;| |aiBboxConfidence; Double; backend/src/main/java/com/cell/platform/entity/CropEntity.java:34|
|ai_classification_confidence|double|YES|&lt;NULL&gt;| |aiClassificationConfidence; Double; backend/src/main/java/com/cell/platform/entity/CropEntity.java:37|
|bbox|varchar(255)|YES|&lt;NULL&gt;| |xyxy 좌표의 문자열; String; backend/src/main/java/com/cell/platform/entity/CropEntity.java:24|
|crop_filename|varchar(255)|NO|&lt;NULL&gt;| |세포 이미지 파일명; String; backend/src/main/java/com/cell/platform/entity/CropEntity.java:21|
|final_label|enum('Band','Eosinophil','Lymphocyte','Monocyte','NucleatedRBC','Segment')|YES|&lt;NULL&gt;| |전문가 확정/채점 정답; CellType; backend/src/main/java/com/cell/platform/entity/CropEntity.java:40|
|gt_label|enum('Band','Eosinophil','Lymphocyte','Monocyte','NucleatedRBC','Segment')|YES|&lt;NULL&gt;| |원천/가져온 GT 라벨; CellType; backend/src/main/java/com/cell/platform/entity/CropEntity.java:26|
|pseudo_label|enum('Band','Eosinophil','Lymphocyte','Monocyte','NucleatedRBC','Segment')|YES|&lt;NULL&gt;| |현재 AI 예측 후보 라벨; CellType; backend/src/main/java/com/cell/platform/entity/CropEntity.java:30|
|task_id|bigint|NO|&lt;NULL&gt;|MUL |소속 Task 엔티티; TaskEntity; backend/src/main/java/com/cell/platform/entity/CropEntity.java:17|

인덱스: FKol3dnpcqk20jjhmtbc37pxu25(task_id; 순서1; nonunique); PRIMARY(id; 순서1; unique).

FK: task_id→tasks.id.

### DB-M05 — game_records

목적: 관리자 부가게임 점수. ORM: C-088 backend/src/main/java/com/cell/platform/entity/GameRecordEntity.java:13. 아래 PK/FK/unique/index는 2026-10-19 celldb metadata 기준.

|컬럼|실제 자료형·길이|NULL 허용|DB 기본값|키 표시·추가 속성|의미/ORM 대응|
|---|---|---|---|---|---|
|id|bigint|NO|&lt;NULL&gt;|PRI auto_increment|PK 또는 식별자; Long; backend/src/main/java/com/cell/platform/entity/GameRecordEntity.java:15|
|player_name|varchar(50)|NO|&lt;NULL&gt;| |playerName; String; backend/src/main/java/com/cell/platform/entity/GameRecordEntity.java:19|
|score|int|NO|&lt;NULL&gt;| |게임 점수; int; backend/src/main/java/com/cell/platform/entity/GameRecordEntity.java:22|
|mode|varchar(10)|NO|&lt;NULL&gt;| |게임 모드; String; backend/src/main/java/com/cell/platform/entity/GameRecordEntity.java:25|
|played_at|datetime(6)|NO|&lt;NULL&gt;| |playedAt; LocalDateTime; backend/src/main/java/com/cell/platform/entity/GameRecordEntity.java:28|

인덱스: PRIMARY(id; 순서1; unique).

FK: 선언된 FK 없음.

### DB-M06 — student_confusion_matrix

목적: 학생·Task별 정답행×응답열 JSON 카운트. ORM: C-089 backend/src/main/java/com/cell/platform/entity/StudentConfusionMatrixEntity.java:22. 아래 PK/FK/unique/index는 2026-10-19 celldb metadata 기준.

|컬럼|실제 자료형·길이|NULL 허용|DB 기본값|키 표시·추가 속성|의미/ORM 대응|
|---|---|---|---|---|---|
|id|bigint|NO|&lt;NULL&gt;|PRI auto_increment|PK 또는 식별자; Long; backend/src/main/java/com/cell/platform/entity/StudentConfusionMatrixEntity.java:24|
|matrix_data|json|YES|&lt;NULL&gt;| |정답행×응답열 카운트 JSON; Map<String, Map<String, Integer>>; backend/src/main/java/com/cell/platform/entity/StudentConfusionMatrixEntity.java:34|
|student_id|varchar(255)|NO|&lt;NULL&gt;| |학생 사용자 ID 문자열(실제 개인정보 값 생략); String; backend/src/main/java/com/cell/platform/entity/StudentConfusionMatrixEntity.java:28|
|task_id|bigint|NO|&lt;NULL&gt;| |소속 Task ID; Long; backend/src/main/java/com/cell/platform/entity/StudentConfusionMatrixEntity.java:31|
|updated_at|datetime(6)|YES|&lt;NULL&gt;| |갱신 시각; LocalDateTime; backend/src/main/java/com/cell/platform/entity/StudentConfusionMatrixEntity.java:38|

인덱스: PRIMARY(id; 순서1; unique).

FK: 선언된 FK 없음.

### DB-M07 — student_roster

목적: 가입 사전 명단·claim된 사용자. ORM: C-090 backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:14. 아래 PK/FK/unique/index는 2026-10-19 celldb metadata 기준.

|컬럼|실제 자료형·길이|NULL 허용|DB 기본값|키 표시·추가 속성|의미/ORM 대응|
|---|---|---|---|---|---|
|id|bigint|NO|&lt;NULL&gt;|PRI auto_increment|PK 또는 식별자; Long; backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:16|
|claimed_user_id|bigint|YES|&lt;NULL&gt;| |명단을 claim한 사용자 ID; Long; backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:25|
|created_at|datetime(6)|YES|&lt;NULL&gt;| |생성 시각; LocalDateTime; backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:27|
|registered_by|varchar(255)|YES|&lt;NULL&gt;| |registeredBy; String; backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:23|
|student_id|varchar(255)|NO|&lt;NULL&gt;|UNI |학생 사용자 ID 문자열(실제 개인정보 값 생략); String; backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java:20|

인덱스: PRIMARY(id; 순서1; unique); UKeis2ootxjnp1soqan5mptwvmk(student_id; 순서1; unique).

FK: 선언된 FK 없음.

### DB-M08 — submissions

목적: 학생의 세포별 답안. ORM: C-091 backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:12. 아래 PK/FK/unique/index는 2026-10-19 celldb metadata 기준.

|컬럼|실제 자료형·길이|NULL 허용|DB 기본값|키 표시·추가 속성|의미/ORM 대응|
|---|---|---|---|---|---|
|id|bigint|NO|&lt;NULL&gt;|PRI auto_increment|PK 또는 식별자; Long; backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:14|
|student_id|varchar(255)|NO|&lt;NULL&gt;| |학생 사용자 ID 문자열(실제 개인정보 값 생략); String; backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:22|
|student_label|enum('Band','Eosinophil','Lymphocyte','Monocyte','NucleatedRBC','Segment')|NO|&lt;NULL&gt;| |studentLabel; CellType; backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:25|
|submitted_at|datetime(6)|YES|&lt;NULL&gt;| |답안 저장 시각; LocalDateTime; backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:29|
|crop_id|bigint|NO|&lt;NULL&gt;|MUL |crop; CropEntity; backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java:18|

인덱스: FKbx91yne4vcolhdiotstfd9o65(crop_id; 순서1; nonunique); PRIMARY(id; 순서1; unique).

FK: crop_id→crops.id.

### DB-M09 — tasks

목적: 도말 또는 진단 평가 단위·마감·종. ORM: C-092 backend/src/main/java/com/cell/platform/entity/TaskEntity.java:14. 아래 PK/FK/unique/index는 2026-10-19 celldb metadata 기준.

|컬럼|실제 자료형·길이|NULL 허용|DB 기본값|키 표시·추가 속성|의미/ORM 대응|
|---|---|---|---|---|---|
|id|bigint|NO|&lt;NULL&gt;|PRI auto_increment|PK 또는 식별자; Long; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:16|
|created_at|datetime(6)|YES|&lt;NULL&gt;| |생성 시각; LocalDateTime; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:40|
|original_filename|varchar(255)|NO|&lt;NULL&gt;| |UUID 원본 저장 파일명; String; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:24|
|status|enum('COMPLETED','IN_PROGRESS')|NO|&lt;NULL&gt;| |계정 또는 과제 상태; TaskStatus; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:20|
|uploaded_filename|varchar(255)|YES|&lt;NULL&gt;| |업로드 당시 이름/진단 prefix; String; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:27|
|assignment_id|bigint|YES|&lt;NULL&gt;| |논리 Assignment ID(FK는 별도 확인); Long; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:30|
|title|varchar(255)|YES|&lt;NULL&gt;| |title; String; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:33|
|deadline_at|datetime(6)|YES|&lt;NULL&gt;| |과제 마감 시각; LocalDateTime; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:42|
|animal_species_id|bigint|NO|&lt;NULL&gt;|MUL |동물 종 JPA 연관; AnimalSpeciesEntity; backend/src/main/java/com/cell/platform/entity/TaskEntity.java:36|

인덱스: idx_tasks_animal_species_id(animal_species_id; 순서1; nonunique); PRIMARY(id; 순서1; unique).

FK: animal_species_id→animal_species.id.

### DB-M10 — users

목적: 로그인 자격·역할·상태. ORM: C-093 backend/src/main/java/com/cell/platform/entity/UserEntity.java:13. 아래 PK/FK/unique/index는 2026-10-19 celldb metadata 기준.

|컬럼|실제 자료형·길이|NULL 허용|DB 기본값|키 표시·추가 속성|의미/ORM 대응|
|---|---|---|---|---|---|
|id|bigint|NO|&lt;NULL&gt;|PRI auto_increment|PK 또는 식별자; Long; backend/src/main/java/com/cell/platform/entity/UserEntity.java:15|
|created_at|datetime(6)|YES|&lt;NULL&gt;| |생성 시각; LocalDateTime; backend/src/main/java/com/cell/platform/entity/UserEntity.java:35|
|name|varchar(255)|YES|&lt;NULL&gt;| |표시 이름 또는 명칭; String; backend/src/main/java/com/cell/platform/entity/UserEntity.java:22|
|password|varchar(255)|NO|&lt;NULL&gt;| |해시 저장/요청 비밀번호 필드; 실제 값 생략; String; backend/src/main/java/com/cell/platform/entity/UserEntity.java:24|
|role|enum('ADMIN','EXPERT','STUDENT')|NO|&lt;NULL&gt;| |STUDENT/EXPERT/ADMIN; Role; backend/src/main/java/com/cell/platform/entity/UserEntity.java:27|
|username|varchar(255)|NO|&lt;NULL&gt;|UNI |로그인 ID; String; backend/src/main/java/com/cell/platform/entity/UserEntity.java:19|
|status|enum('ACTIVE','INACTIVE','PENDING','REJECTED')|YES|&lt;NULL&gt;| |계정 또는 과제 상태; UserStatus; backend/src/main/java/com/cell/platform/entity/UserEntity.java:31|

인덱스: PRIMARY(id; 순서1; unique); UKr43af9ap4edm43mmtq01oddj6(username; 순서1; unique).

FK: 선언된 FK 없음.

### D.2 ORM·수동 SQL·구버전 DDL 불일치

- `backend/sql/20260819_add_task_deadline.sql:1`: tasks.deadline_at 추가.
- `backend/sql/20260821_add_animal_species.sql:5`: 종 테이블·DOG/CAT seed·tasks 종FK/index·NOT NULL. 현재 관측은 이 NOT NULL/FK를 가진다. 그러나 `TaskEntity`의 JoinColumn에는 nullable=false가 없으므로 **ORM 선언만으로 물리NOT NULL을 추론하면 틀릴 수 있다**.
- 두 root SQL dump는 7개 구테이블 CREATE를 포함하며 assignments/animal_species/game_records 등의 최신 전체 스키마를 대표하지 않는다. INSERT·사용자 값·AUTO_INCREMENT 현재값은 전사하지 않았다.
- dev는 update, compose는 validate, prod도 validate. Flyway/Liquibase 자동 마이그레이션 의존/설정은 미발견이다. SQL 수동 적용 이력은 별도 운영 기록이 필요하다.
- submissions(crop_id,student_id), student_confusion_matrix(student_id,task_id)는 코드의 find 조합이지만 현재 실제 unique index가 없다. 동시에 같은 요청이 들어오면 DB가 한 행으로 강제한다는 보장은 없다.
- MySQL metadata에서 현재 프로시저·트리거 0개. 저장프로시저 사용으로 문서를 채우지 않는다.

### D.3 독립 컬러화 SQLite — 전체 실제 DDL

SQLite INTEGER/REAL/TEXT의 선언과 복합PK/FK/삭제정책은 아래 실제 sqlite_master SQL을 따른다. NULL은 DDL의 NOT NULL 유무 그대로이며 SQLite의 rowid/복합PK 규칙을 MySQL 규칙과 혼동하지 않는다. DB 유일성·데이터 단위는 user_id+content_hash 기반이며 실제 사용자 값은 없다.

#### DB-D01 — batches

근거: 읽기 전용 sqlite_master(2026-10-19); `컬러화POC/persistence.py:32` 초기화.

```sql
CREATE TABLE batches (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    label TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
```
인덱스: CREATE INDEX idx_batches_user_created
                    ON batches(user_id, created_at DESC); sqlite_autoindex_batches_1 (PK/unique 자동인덱스).

#### DB-D02 — color_settings

근거: 읽기 전용 sqlite_master(2026-10-19); `컬러화POC/persistence.py:32` 초기화.

```sql
CREATE TABLE color_settings (
                    user_id TEXT NOT NULL,
                    content_hash TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (user_id, content_hash),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
```
인덱스: sqlite_autoindex_color_settings_1 (PK/unique 자동인덱스).

#### DB-D03 — items

근거: 읽기 전용 sqlite_master(2026-10-19); `컬러화POC/persistence.py:32` 초기화.

```sql
CREATE TABLE items (
                    id TEXT PRIMARY KEY,
                    batch_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    relative_path TEXT NOT NULL,
                    storage_path TEXT NOT NULL,
                    content_hash TEXT NOT NULL,
                    image_hash TEXT,
                    error TEXT,
                    created_at REAL NOT NULL, acquisition_json TEXT, original_relative_path TEXT,
                    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
```
인덱스: CREATE INDEX idx_items_batch ON items(batch_id, created_at); CREATE INDEX idx_items_user_hash ON items(user_id, content_hash); sqlite_autoindex_items_1 (PK/unique 자동인덱스).

#### DB-D04 — roi_annotations

근거: 읽기 전용 sqlite_master(2026-10-19); `컬러화POC/persistence.py:32` 초기화.

```sql
CREATE TABLE roi_annotations (
                    user_id TEXT NOT NULL,
                    content_hash TEXT NOT NULL,
                    rows INTEGER NOT NULL,
                    columns INTEGER NOT NULL,
                    payload_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (user_id, content_hash),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
```
인덱스: sqlite_autoindex_roi_annotations_1 (PK/unique 자동인덱스).

#### DB-D05 — roi_labels

근거: 읽기 전용 sqlite_master(2026-10-19); `컬러화POC/persistence.py:32` 초기화.

```sql
CREATE TABLE roi_labels (
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    position INTEGER NOT NULL,
                    PRIMARY KEY (user_id, name),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
```
인덱스: CREATE INDEX idx_roi_labels_user_position
                    ON roi_labels(user_id, position); sqlite_autoindex_roi_labels_1 (PK/unique 자동인덱스).

#### DB-D06 — service_metadata

근거: 읽기 전용 sqlite_master(2026-10-19); `컬러화POC/persistence.py:32` 초기화.

```sql
CREATE TABLE service_metadata (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                )
```
인덱스: sqlite_autoindex_service_metadata_1 (PK/unique 자동인덱스).

#### DB-D07 — users

근거: 읽기 전용 sqlite_master(2026-10-19); `컬러화POC/persistence.py:32` 초기화.

```sql
CREATE TABLE users (
                    id TEXT PRIMARY KEY,
                    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
```
인덱스: sqlite_autoindex_users_1 (PK/unique 자동인덱스); sqlite_autoindex_users_2 (PK/unique 자동인덱스).

SQLite FK는 batches.user_id→users, items.batch_id→batches·items.user_id→users, settings/annotations/labels.user_id→users의 6개이고 모두 ON DELETE CASCADE다. DB연결마다 PRAGMA foreign_keys=ON·busy_timeout=30000, 초기화 시 WAL을 설정한다. `content_hash`는 파일/영상 설정 연결키이며 SQL FK는 아니다. 기존DB의 acquisition_json/original_relative_path 보정도 initialize 코드에 있다. 실제 SQLite의 생존 데이터/소유자/ROI내용은 조사하지 않았다.

### D.4 영상·라벨 파일과 DB 연결

|객체|DB 필드→파일|처리 위치|
|---|---|---|
|원본 도말|tasks.original_filename→file.upload-dir;uploaded_filename은 원래 표시명|FileStorageService·TaskService|
|세포 crop|crops.crop_filename→공유crop 또는진단processed/crops|DetectorService·WebConfig|
|bbox|crops.bbox문자열 xyxy→원본Canvas/ZIP의rect|AnalyticsFeedback·LabelingService|
|정답|gt_label(원천/수입),pseudo_label(AI),final_label(채점)|CropService·SubmissionService|
|진단문제|processed/manifest.json→선택crop·GT|DiagnosticDatasetService|
|컬러화원본|SQLite.items.storage_path/content_hash→전용uploads|ColorizerStore·get_item|
|컬러화설정/ROI|user_id+content_hash→payload_json|persistence.py|

## E. 전체 API·외부 인터페이스

### E.1 집계·권한 해석·오류 계약

자체 선언 API는 **Spring49(GET27/POST12/PUT6/DELETE4), AI3(GET1/POST2), Flask28(GET11/POST11/PUT3/PATCH1/DELETE2)**다. Spring은 PUBLIC2·ADMIN11·EXPERT/ADMIN18·STUDENT1·인증만17. 따라서 인증만 적용되는 endpoint가 항상 의도상 모든 역할 기능이라는 뜻은 아니다. @PreAuthorize는 있지만 method security 활성 annotation이 미발견이므로 삭제·일부 GET의 의도권한과 실제URL규칙을 구분한다.

Spring 공통 오류: BusinessException의 상태(400/404 등), AuthenticationException401, AuthorizationException403, InfraStructureException500, Bean Validation400, NoResource404, 일반Exception500. ErrorResponse는 `message,errorCode`인지 아래 DTO 선언을 확인한다. Filter 단계 401(sendError)·서버가 직접 내는403/업로드크기/JSON역직렬화 오류는 업무 ErrorResponse와 같다고 단정하지 않는다. 특히 record compact ctor/JSON binding 오류는 wrapper 예외가 일반handler로 갈 수 있으므로 실제 상태/형식 시험이 필요하다.

모든 예시 ID/계정은 합성값이며 실제 레코드가 아니다. API번호는 이번 조사 순번이다.

### API-B001 — GET /api/admin/smears

|항목|명세|
|---|---|
|목적/US|US-029 원본·crop 데이터 목록 관리|
|인증·서버 권한|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;AdminSmearResponse&gt;&gt; getSmears()|
|Form/query/body·필수/검증 annotation|@GetMapping("/smears")|
|요청/응답 DTO 세부|C-050 AdminSmearResponse: taskId:Long, originalFilename:String, uploadedFilename:String, speciesId:Long, speciesCode:String, speciesName:String, createdAt:LocalDateTime, totalCrops:long, labeledCrops:long, hasLabel:boolean|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;AdminSmearResponse&gt;&gt;|
|정상 처리/저장|DB집계+파일 표시·선택·라벨 입출력 진입|
|오류·경계|미로그인401·다른역할403; 파일 자체 삭제는 별도 아님; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AdminController.getSmears → adminService.getSmears|
|프런트엔드 호출/화면|frontend/src/api/admin.js:4 getSmears; frontend/src/pages/AdminPage.jsx|
|DB·알고리즘|tasks;crops;파일; ALG-10|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AdminController.java:27 / AdminController.getSmears|

### API-B002 — GET /api/admin/crops

|항목|명세|
|---|---|
|목적/US|US-029 원본·crop 데이터 목록 관리|
|인증·서버 권한|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;AdminCropResponse&gt;&gt; getCrops()|
|Form/query/body·필수/검증 annotation|@GetMapping("/crops")|
|요청/응답 DTO 세부|C-049 AdminCropResponse: cropId:Long, taskId:Long, cropFilename:String, originalSmearFilename:String, speciesId:Long, speciesCode:String, speciesName:String, gtLabel:String, pseudoLabel:String, finalLabel:String, hasLabel:boolean|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;AdminCropResponse&gt;&gt;|
|정상 처리/저장|DB집계+파일 표시·선택·라벨 입출력 진입|
|오류·경계|미로그인401·다른역할403; 파일 자체 삭제는 별도 아님; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AdminController.getCrops → adminService.getCrops|
|프런트엔드 호출/화면|frontend/src/api/admin.js:5 getCrops; frontend/src/pages/AdminPage.jsx|
|DB·알고리즘|tasks;crops;파일; ALG-10|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AdminController.java:32 / AdminController.getCrops|

### API-B003 — GET /api/admin/users

|항목|명세|
|---|---|
|목적/US|US-004 서버·화면 권한 제어; US-005 관리자 사용자 목록·생성|
|인증·서버 권한|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;UserResponse&gt;&gt; getUsers()|
|Form/query/body·필수/검증 annotation|@GetMapping("/users")|
|요청/응답 DTO 세부|C-083 UserResponse: id:Long, username:String, name:String, role:String, status:String, createdAt:LocalDateTime|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;UserResponse&gt;&gt;|
|정상 처리/저장|React route guard와 Spring URL matcher 검사 / 사용자 전체 조회; 중복 검사·비밀번호 해시 후 생성; ADMIN 생성 제한|
|오류·경계|미인증·다른 역할 거부; 메서드 보안 누락 의심 구간 별도 검증 / 중복 ID·ADMIN 생성 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AdminController.getUsers → adminService.getUsers|
|프런트엔드 호출/화면|frontend/src/api/admin.js:6 getUsers; frontend/src/App.jsx; frontend/src/pages/AdminPage.jsx|
|DB·알고리즘|users(로그인 시);JWT claims; users; ALG-01, ALG-10|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AdminController.java:37 / AdminController.getUsers|

### API-B004 — POST /api/admin/users

|항목|명세|
|---|---|
|목적/US|US-005 관리자 사용자 목록·생성|
|인증·서버 권한|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;Void&gt; createUser(RegisterRequest request)|
|Form/query/body·필수/검증 annotation|@PostMapping("/users") @RequestBody|
|요청/응답 DTO 세부|C-045 RegisterRequest: username:String, name:String, password:String, role:String|
|정상 HTTP/출력|200; ResponseEntity&lt;Void&gt;|
|정상 처리/저장|사용자 전체 조회; 중복 검사·비밀번호 해시 후 생성; ADMIN 생성 제한|
|오류·경계|중복 ID·ADMIN 생성 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AdminController.createUser → adminService.createUser|
|프런트엔드 호출/화면|frontend/src/api/admin.js:7 createUser; frontend/src/pages/AdminPage.jsx|
|DB·알고리즘|users; ALG-10|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AdminController.java:42 / AdminController.createUser|

### API-B005 — DELETE /api/admin/users/{username}

|항목|명세|
|---|---|
|목적/US|US-006 가입 승인·비활성화·삭제|
|인증·서버 권한|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{username}|
|입력·반환 시그니처|public ResponseEntity&lt;Void&gt; deleteUser(String username)|
|Form/query/body·필수/검증 annotation|@DeleteMapping("/users/{username}") @PathVariable|
|요청/응답 DTO 세부|Void/기본형/List/Map/바이너리. responseType: ResponseEntity&lt;Void&gt;|
|정상 HTTP/출력|204; ResponseEntity&lt;Void&gt;|
|정상 처리/저장|상태 enum 검증·관리자 변경 보호·삭제|
|오류·경계|미존재 사용자·보호 대상 ADMIN 변경/삭제 거부; 기존 JWT 즉시 폐기 아님; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AdminController.deleteUser → adminService.deleteUser|
|프런트엔드 호출/화면|frontend/src/api/admin.js:8 deleteUser; frontend/src/pages/AdminPage.jsx|
|DB·알고리즘|users; ALG-10|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AdminController.java:48 / AdminController.deleteUser|

### API-B006 — PUT /api/admin/users/{userId}/status

|항목|명세|
|---|---|
|목적/US|US-006 가입 승인·비활성화·삭제|
|인증·서버 권한|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{userId}|
|입력·반환 시그니처|public ResponseEntity&lt;UserResponse&gt; updateUserStatus( Long userId, AdminStatusRequest request )|
|Form/query/body·필수/검증 annotation|@PutMapping("/users/{userId}/status") @PathVariable @Valid @RequestBody|
|요청/응답 DTO 세부|C-034 AdminStatusRequest: status:String; C-083 UserResponse: id:Long, username:String, name:String, role:String, status:String, createdAt:LocalDateTime|
|정상 HTTP/출력|200; ResponseEntity&lt;UserResponse&gt;|
|정상 처리/저장|상태 enum 검증·관리자 변경 보호·삭제|
|오류·경계|미존재 사용자·보호 대상 ADMIN 변경/삭제 거부; 기존 JWT 즉시 폐기 아님; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AdminController.updateUserStatus → adminService.updateUserStatus|
|프런트엔드 호출/화면|frontend/src/api/admin.js:9 updateUserStatus; frontend/src/pages/AdminPage.jsx|
|DB·알고리즘|users; ALG-10|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AdminController.java:54 / AdminController.updateUserStatus|

### API-B007 — GET /api/admin/student-roster

|항목|명세|
|---|---|
|목적/US|US-007 학생 사전 명단 관리|
|인증·서버 권한|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;StudentRosterResponse&gt;&gt; getStudentRoster()|
|Form/query/body·필수/검증 annotation|@GetMapping("/student-roster")|
|요청/응답 DTO 세부|C-079 StudentRosterResponse: id:Long, studentId:String, registeredBy:String, claimedUserId:Long, createdAt:LocalDateTime|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;StudentRosterResponse&gt;&gt;|
|정상 처리/저장|공백 항목 trim·중복 건너뛰기·명단 저장; 이미 PENDING인 계정을 자동 활성화하는 코드는 없음|
|오류·경계|빈 명단·중복 항목 처리; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AdminController.getStudentRoster → adminService.getStudentRoster|
|프런트엔드 호출/화면|frontend/src/api/admin.js:10 getStudentRoster; frontend/src/pages/AdminPage.jsx|
|DB·알고리즘|student_roster;users; ALG-10|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AdminController.java:62 / AdminController.getStudentRoster|

### API-B008 — POST /api/admin/student-roster

|항목|명세|
|---|---|
|목적/US|US-007 학생 사전 명단 관리|
|인증·서버 권한|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;RosterImportResponse&gt; addStudentRoster( StudentRosterRequest request, Authentication authentication )|
|Form/query/body·필수/검증 annotation|@PostMapping("/student-roster") @RequestBody|
|요청/응답 DTO 세부|C-047 StudentRosterRequest: studentIds:List&lt;String&gt;; C-069 RosterImportResponse: added:int, skipped:int|
|정상 HTTP/출력|200; ResponseEntity&lt;RosterImportResponse&gt;|
|정상 처리/저장|공백 항목 trim·중복 건너뛰기·명단 저장; 이미 PENDING인 계정을 자동 활성화하는 코드는 없음|
|오류·경계|빈 명단·중복 항목 처리; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AdminController.addStudentRoster → adminService.addStudentRoster|
|프런트엔드 호출/화면|frontend/src/api/admin.js:11 addStudentRoster; frontend/src/pages/AdminPage.jsx|
|DB·알고리즘|student_roster;users; ALG-10|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AdminController.java:67 / AdminController.addStudentRoster|

### API-B009 — GET /api/species

|항목|명세|
|---|---|
|목적/US|US-008 동물 종 조회·표시|
|인증·서버 권한|AUTHENTICATED; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;AnimalSpeciesResponse&gt;&gt; getAll()|
|Form/query/body·필수/검증 annotation|@GetMapping|
|요청/응답 DTO 세부|C-053 AnimalSpeciesResponse: id:Long, code:String, name:String, builtIn:boolean|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;AnimalSpeciesResponse&gt;&gt;|
|정상 처리/저장|DOG/CAT 기본 종과 사용자 종을 조회; DTO에 종 메타데이터 전달|
|오류·경계|기존 누락 종은 DOG fallback; 종별 AI 모델은 아님; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AnimalSpeciesController.getAll → speciesService.getAll|
|프런트엔드 호출/화면|frontend/src/api/species.js:4 getAll; frontend/src/components/SpeciesBadge.jsx|
|DB·알고리즘|animal_species;tasks; ALG-10|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AnimalSpeciesController.java:27 / AnimalSpeciesController.getAll|

### API-B010 — POST /api/species

|항목|명세|
|---|---|
|목적/US|US-009 종 생성·이름 수정|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 메서드 annotation 존재(활성 별도 확인)|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;AnimalSpeciesResponse&gt; create( AnimalSpeciesNameRequest request)|
|Form/query/body·필수/검증 annotation|@PostMapping @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @Valid @RequestBody|
|요청/응답 DTO 세부|C-035 AnimalSpeciesNameRequest: name:String; C-053 AnimalSpeciesResponse: id:Long, code:String, name:String, builtIn:boolean|
|정상 HTTP/출력|200; ResponseEntity&lt;AnimalSpeciesResponse&gt;|
|정상 처리/저장|이름 공백·60자·대소문자 중복 검사; custom code UUID 생성|
|오류·경계|빈 이름·중복·미존재 종 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AnimalSpeciesController.create → speciesService.create|
|프런트엔드 호출/화면|frontend/src/api/species.js:5 create; frontend/src/components/SpeciesDataSettings.jsx|
|DB·알고리즘|animal_species; ALG-10|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AnimalSpeciesController.java:32 / AnimalSpeciesController.create|

### API-B011 — PUT /api/species/{speciesId}

|항목|명세|
|---|---|
|목적/US|US-009 종 생성·이름 수정|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 메서드 annotation 존재(활성 별도 확인)|
|Path parameter|{speciesId}|
|입력·반환 시그니처|public ResponseEntity&lt;AnimalSpeciesResponse&gt; rename( Long speciesId, AnimalSpeciesNameRequest request)|
|Form/query/body·필수/검증 annotation|@PutMapping("/{speciesId}") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @PathVariable @Valid @RequestBody|
|요청/응답 DTO 세부|C-035 AnimalSpeciesNameRequest: name:String; C-053 AnimalSpeciesResponse: id:Long, code:String, name:String, builtIn:boolean|
|정상 HTTP/출력|200; ResponseEntity&lt;AnimalSpeciesResponse&gt;|
|정상 처리/저장|이름 공백·60자·대소문자 중복 검사; custom code UUID 생성|
|오류·경계|빈 이름·중복·미존재 종 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AnimalSpeciesController.rename → speciesService.rename|
|프런트엔드 호출/화면|frontend/src/api/species.js:6 rename; frontend/src/components/SpeciesDataSettings.jsx|
|DB·알고리즘|animal_species; ALG-10|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AnimalSpeciesController.java:39 / AnimalSpeciesController.rename|

### API-B012 — POST /api/assignments

|항목|명세|
|---|---|
|목적/US|US-012 다중 도말 과제 생성|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 메서드 annotation 존재(활성 별도 확인)|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;AssignmentResponse&gt; createAssignment( String title, List&lt;MultipartFile&gt; files, LocalDateTime deadlineAt, List&lt;Long&gt; speciesIds, String username)|
|Form/query/body·필수/검증 annotation|@PostMapping @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @RequestParam("title") @RequestParam("files") @RequestParam(value = "deadlineAt", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) @RequestParam(value = "speciesIds", required = false) @AuthenticationPrincipal|
|요청/응답 DTO 세부|C-054 AssignmentResponse: assignmentId:Long, title:String, expertUsername:String, createdAt:LocalDateTime, tasks:List&lt;TaskUploadResponse&gt;, totalCrops:int|
|정상 HTTP/출력|200; ResponseEntity&lt;AssignmentResponse&gt;|
|정상 처리/저장|파일 개수·종 배열·마감 검사; Assignment 저장 후 영상별 순차 AI 호출·Task 저장|
|오류·경계|파일 없음·종 개수 불일치·AI 중간 실패; FS 롤백은 보장 안 됨; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AssignmentController.createAssignment → taskService.createAssignment|
|프런트엔드 호출/화면|frontend/src/api/tasks.js:11 createAssignment; frontend/src/pages/ExpertPage.jsx|
|DB·알고리즘|assignments;tasks;crops;animal_species;파일; ALG-03|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AssignmentController.java:29 / AssignmentController.createAssignment|

### API-B013 — GET /api/assignments/{assignmentId}/tasks

|항목|명세|
|---|---|
|목적/US|US-013 과제 조회·선택·진행률|
|인증·서버 권한|AUTHENTICATED; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{assignmentId}|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;TaskResponse&gt;&gt; getTasksForAssignment(Long assignmentId)|
|Form/query/body·필수/검증 annotation|@GetMapping("/{assignmentId}/tasks") @PathVariable|
|요청/응답 DTO 세부|C-080 TaskResponse: id:Long, status:String, originalFilename:String, uploadedFilename:String, assignmentId:Long, title:String, speciesId:Long, speciesCode:String, speciesName:String, createdAt:LocalDateTime, deadlineAt:LocalDateTime, cropCount:int|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;TaskResponse&gt;&gt;|
|정상 처리/저장|Task 목록·crop·기존 제출 조회; assignment별 묶음; 답변수/총crop 계산|
|오류·경계|빈 과제·조회 실패 표시; 개별 학생 배정 테이블 없음; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AssignmentController.getTasksForAssignment → 서비스 연결은 C 멤버 호출목록 참조|
|프런트엔드 호출/화면|현재React 래퍼 직접 연결 미발견/백엔드용; frontend/src/pages/StudentPage.jsx|
|DB·알고리즘|tasks;crops;submissions;assignments; ALG-04|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AssignmentController.java:43 / AssignmentController.getTasksForAssignment|

### API-B014 — DELETE /api/assignments/{assignmentId}

|항목|명세|
|---|---|
|목적/US|US-015 과제·도말 삭제|
|인증·서버 권한|의도 EXPERT/ADMIN / URL은 AUTHENTICATED(검증 필요); SecurityConfig URL matcher 우선. 메서드 annotation 존재(활성 별도 확인)|
|Path parameter|{assignmentId}|
|입력·반환 시그니처|public ResponseEntity&lt;Void&gt; deleteAssignment(Long assignmentId)|
|Form/query/body·필수/검증 annotation|@DeleteMapping("/{assignmentId}") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @PathVariable|
|요청/응답 DTO 세부|Void/기본형/List/Map/바이너리. responseType: ResponseEntity&lt;Void&gt;|
|정상 HTTP/출력|204; ResponseEntity&lt;Void&gt;|
|정상 처리/저장|제출→혼동행렬→신고→Task 삭제; Assignment면 구성 Task 순회|
|오류·경계|미존재 ID 처리·서버 DELETE 권한 누락 의심; 원본/crop 파일 삭제는 확인 안 됨; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AssignmentController.deleteAssignment → taskService.deleteAssignment|
|프런트엔드 호출/화면|frontend/src/api/tasks.js:16 deleteAssignment; frontend/src/components/AnalyticsFeedback.jsx|
|DB·알고리즘|submissions;student_confusion_matrix;crop_issue_reports;crops;tasks;assignments; ALG-04|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AssignmentController.java:49 / AssignmentController.deleteAssignment|

### API-B015 — PUT /api/assignments/{assignmentId}/deadline

|항목|명세|
|---|---|
|목적/US|US-014 마감일 설정·변경|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 메서드 annotation 존재(활성 별도 확인)|
|Path parameter|{assignmentId}|
|입력·반환 시그니처|public ResponseEntity&lt;Void&gt; updateDeadline( Long assignmentId, DeadlineUpdateRequest request)|
|Form/query/body·필수/검증 annotation|@PutMapping("/{assignmentId}/deadline") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @PathVariable @RequestBody|
|요청/응답 DTO 세부|C-038 DeadlineUpdateRequest: deadlineAt:LocalDateTime|
|정상 HTTP/출력|200; ResponseEntity&lt;Void&gt;|
|정상 처리/저장|미래 시각·기존 마감 여부 검사; Assignment 단위 갱신|
|오류·경계|이미 마감된 과제 변경·진단평가 마감 설정·묶음 도말 개별 변경 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AssignmentController.updateDeadline → taskService.updateAssignmentDeadline|
|프런트엔드 호출/화면|frontend/src/api/tasks.js:19 updateAssignmentDeadline; frontend/src/components/AnalyticsFeedback.jsx|
|DB·알고리즘|tasks; ALG-04|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AssignmentController.java:56 / AssignmentController.updateDeadline|

### API-B016 — POST /api/auth/register

|항목|명세|
|---|---|
|목적/US|US-002 학생 회원가입|
|인증·서버 권한|PUBLIC; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;RegisterResponse&gt; register(RegisterRequest request)|
|Form/query/body·필수/검증 annotation|@PostMapping("/register") @Valid @RequestBody|
|요청/응답 DTO 세부|C-045 RegisterRequest: username:String, name:String, password:String, role:String; C-068 RegisterResponse: status:String, message:String|
|정상 HTTP/출력|200; ResponseEntity&lt;RegisterResponse&gt;|
|정상 처리/저장|아이디 중복·학생 이름·허용 역할 검사, 명단이면 ACTIVE 아니면 PENDING|
|오류·경계|EXPERT/ADMIN 공개가입·중복 아이디·빈 이름 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AuthController.register → authService.register|
|프런트엔드 호출/화면|frontend/src/api/auth.js:4 register; frontend/src/pages/LoginPage.jsx|
|DB·알고리즘|users;student_roster; ALG-01|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AuthController.java:20 / AuthController.register|

### API-B017 — POST /api/auth/login

|항목|명세|
|---|---|
|목적/US|US-001 로그인; US-003 로그아웃·다중 탭 계정 동기화|
|인증·서버 권한|PUBLIC; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;LoginResponse&gt; login(LoginRequest request)|
|Form/query/body·필수/검증 annotation|@PostMapping("/login") @RequestBody|
|요청/응답 DTO 세부|C-044 LoginRequest: username:String, password:String; C-065 LoginResponse: accessToken:String, tokenType:String, role:String, username:String, name:String|
|정상 HTTP/출력|200; ResponseEntity&lt;LoginResponse&gt;|
|정상 처리/저장|비밀번호 BCrypt 비교·계정 상태 검사 후 JWT 발급 / 단일 localStorage 레코드와 sessionId; 구세션 요청·지연 응답 취소|
|오류·경계|오입력·PENDING/REJECTED/INACTIVE 로그인 거부 / 이전 세션의 늦은 401이 새 세션 삭제하지 않음; 공통 HTTP/에러계약은 E.1|
|Controller→Service|AuthController.login → authService.login|
|프런트엔드 호출/화면|frontend/src/api/auth.js:6 login; frontend/src/pages/LoginPage.jsx; frontend/src/utils/authSession.js|
|DB·알고리즘|users; 브라우저 localStorage; ALG-01, ALG-02|
|소스 근거|backend/src/main/java/com/cell/platform/controller/AuthController.java:25 / AuthController.login|

### API-B018 — GET /api/tasks/{taskId}/crops

|항목|명세|
|---|---|
|목적/US|US-013 과제 조회·선택·진행률|
|인증·서버 권한|AUTHENTICATED; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{taskId}|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;CropResponse&gt;&gt; getCropsByTask( Long taskId, Authentication authentication)|
|Form/query/body·필수/검증 annotation|@GetMapping("/tasks/{taskId}/crops") @PathVariable|
|요청/응답 DTO 세부|C-056 CropResponse: id:Long, taskId:Long, cropFilename:String, bbox:String, gtLabel:String, pseudoLabel:String, finalLabel:String, aiBboxConfidence:Double, aiClassificationConfidence:Double, originalSmearFilename:String, speciesId:Long, speciesCode:String, speciesName:String|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;CropResponse&gt;&gt;|
|정상 처리/저장|Task 목록·crop·기존 제출 조회; assignment별 묶음; 답변수/총crop 계산|
|오류·경계|빈 과제·조회 실패 표시; 개별 학생 배정 테이블 없음; 공통 HTTP/에러계약은 E.1|
|Controller→Service|CropController.getCropsByTask → cropService.getCropsByTaskId|
|프런트엔드 호출/화면|frontend/src/api/crops.js:4 getByTaskId; frontend/src/pages/StudentPage.jsx|
|DB·알고리즘|tasks;crops;submissions;assignments; ALG-04|
|소스 근거|backend/src/main/java/com/cell/platform/controller/CropController.java:21 / CropController.getCropsByTask|

### API-B019 — GET /api/assignments/{assignmentId}/crops

|항목|명세|
|---|---|
|목적/US|US-013 과제 조회·선택·진행률|
|인증·서버 권한|AUTHENTICATED; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{assignmentId}|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;CropResponse&gt;&gt; getCropsByAssignment( Long assignmentId, Authentication authentication)|
|Form/query/body·필수/검증 annotation|@GetMapping("/assignments/{assignmentId}/crops") @PathVariable|
|요청/응답 DTO 세부|C-056 CropResponse: id:Long, taskId:Long, cropFilename:String, bbox:String, gtLabel:String, pseudoLabel:String, finalLabel:String, aiBboxConfidence:Double, aiClassificationConfidence:Double, originalSmearFilename:String, speciesId:Long, speciesCode:String, speciesName:String|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;CropResponse&gt;&gt;|
|정상 처리/저장|Task 목록·crop·기존 제출 조회; assignment별 묶음; 답변수/총crop 계산|
|오류·경계|빈 과제·조회 실패 표시; 개별 학생 배정 테이블 없음; 공통 HTTP/에러계약은 E.1|
|Controller→Service|CropController.getCropsByAssignment → cropService.getCropsByAssignmentId|
|프런트엔드 호출/화면|frontend/src/api/crops.js:6 getByAssignmentId; frontend/src/pages/StudentPage.jsx|
|DB·알고리즘|tasks;crops;submissions;assignments; ALG-04|
|소스 근거|backend/src/main/java/com/cell/platform/controller/CropController.java:28 / CropController.getCropsByAssignment|

### API-B020 — PUT /api/crops/{cropId}/confirm

|항목|명세|
|---|---|
|목적/US|US-018 전문가 정답 확정·재수정|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{cropId}|
|입력·반환 시그니처|public ResponseEntity&lt;Void&gt; confirmLabel( Long cropId, ConfirmRequest request)|
|Form/query/body·필수/검증 annotation|@PutMapping("/crops/{cropId}/confirm") @PathVariable @RequestBody|
|요청/응답 DTO 세부|C-036 ConfirmRequest: finalLabel:String|
|정상 HTTP/출력|200; ResponseEntity&lt;Void&gt;|
|정상 처리/저장|finalLabel 갱신; 기존 GT 기준 혼동행렬 차감 후 새 GT 가산|
|오류·경계|미존재 crop·유효하지 않은 label 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|CropController.confirmLabel → cropService.confirmLabel|
|프런트엔드 호출/화면|frontend/src/api/crops.js:9 confirm; frontend/src/api/crops.js:12 confirmLabel; frontend/src/components/AnalyticsFeedback.jsx|
|DB·알고리즘|crops;submissions;student_confusion_matrix; ALG-07|
|소스 근거|backend/src/main/java/com/cell/platform/controller/CropController.java:35 / CropController.confirmLabel|

### API-B021 — GET /api/training-data

|항목|명세|
|---|---|
|목적/US|US-033 확정 학습 데이터 조회|
|인증·서버 권한|AUTHENTICATED; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;TrainingDataResponse&gt;&gt; getTrainingData()|
|Form/query/body·필수/검증 annotation|@GetMapping("/training-data")|
|요청/응답 DTO 세부|C-082 TrainingDataResponse: cropId:Long, cropFilename:String, label:String, speciesId:Long, speciesCode:String, speciesName:String|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;TrainingDataResponse&gt;&gt;|
|정상 처리/저장|finalLabel 있는 crop 선택|
|오류·경계|역할 제한이 URL에 없어 학생접근 가능성; 화면 호출연결 미확인; 공통 HTTP/에러계약은 E.1|
|Controller→Service|CropController.getTrainingData → cropService.getConfirmedTrainingData|
|프런트엔드 호출/화면|frontend/src/api/crops.js:15 getTrainingData; frontend/src/api/crops.js|
|DB·알고리즘|crops; ALG-16|
|소스 근거|backend/src/main/java/com/cell/platform/controller/CropController.java:43 / CropController.getTrainingData|

### API-B022 — POST /api/reports

|항목|명세|
|---|---|
|목적/US|US-025 문제 세포 신고|
|인증·서버 권한|AUTHENTICATED; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;Void&gt; createReport(CropIssueReportRequest request)|
|Form/query/body·필수/검증 annotation|@PostMapping("/reports") @RequestBody|
|요청/응답 DTO 세부|C-037 CropIssueReportRequest: taskId:Long, cropId:Long, studentId:String, reason:String|
|정상 HTTP/출력|200; ResponseEntity&lt;Void&gt;|
|정상 처리/저장|DTO 필수값만 검사한 뒤 요청의 studentId/taskId/cropId/reason 그대로 저장; 대상 ID 존재·소속 확인은 없음|
|오류·경계|필수값 누락 거부; 미존재·다른 과제 ID 및 학생ID 위조는 서버 검증 없음; 공통 HTTP/에러계약은 E.1|
|Controller→Service|CropIssueReportController.createReport → reportService.createReport|
|프런트엔드 호출/화면|frontend/src/api/reports.js:4 create; frontend/src/pages/StudentPage.jsx|
|DB·알고리즘|crop_issue_reports;tasks;crops; ALG-12|
|소스 근거|backend/src/main/java/com/cell/platform/controller/CropIssueReportController.java:20 / CropIssueReportController.createReport|

### API-B023 — GET /api/reports

|항목|명세|
|---|---|
|목적/US|US-026 신고 조회·분류|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 메서드 annotation 존재(활성 별도 확인)|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;CropIssueReportResponse&gt;&gt; getReports()|
|Form/query/body·필수/검증 annotation|@GetMapping("/reports") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')")|
|요청/응답 DTO 세부|C-055 CropIssueReportResponse: id:Long, studentId:String, taskId:Long, cropId:Long, cropFilename:String, speciesCode:String, speciesName:String, reason:String, createdAt:LocalDateTime|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;CropIssueReportResponse&gt;&gt;|
|정상 처리/저장|신고 목록에 crop·종 메타데이터 결합|
|오류·경계|STUDENT GET403; 해결상태 워크플로는 없음; 공통 HTTP/에러계약은 E.1|
|Controller→Service|CropIssueReportController.getReports → reportService.getReports|
|프런트엔드 호출/화면|frontend/src/api/reports.js:5 getAll; frontend/src/components/AnalyticsFeedback.jsx|
|DB·알고리즘|crop_issue_reports;crops;tasks; ALG-12|
|소스 근거|backend/src/main/java/com/cell/platform/controller/CropIssueReportController.java:26 / CropIssueReportController.getReports|

### API-B024 — POST /api/game/records

|항목|명세|
|---|---|
|목적/US|US-035 관리자 부가 게임·기록|
|인증·서버 권한|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;Void&gt; saveRecords(GameRecordRequest request)|
|Form/query/body·필수/검증 annotation|@PostMapping("/records") @RequestBody|
|요청/응답 DTO 세부|C-040 GameRecordRequest: mode:String, players:List&lt;Entry&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;Void&gt;|
|정상 처리/저장|iframe 게임→양수기록 저장·모드별 상위15·전체기록삭제|
|오류·경계|다른 role403·비양수 점수 제외; 빈 이름·mode/players null의 서비스 검증은 미확인; 공통 HTTP/에러계약은 E.1|
|Controller→Service|GameRecordController.saveRecords → gameRecordService.saveRecords|
|프런트엔드 호출/화면|frontend/src/assets/bomb-game.html:1113 (직접fetch); frontend/src/pages/BombGamePage.jsx|
|DB·알고리즘|game_records; ALG-17|
|소스 근거|backend/src/main/java/com/cell/platform/controller/GameRecordController.java:19 / GameRecordController.saveRecords|

### API-B025 — GET /api/game/leaderboard

|항목|명세|
|---|---|
|목적/US|US-035 관리자 부가 게임·기록|
|인증·서버 권한|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;GameRecordResponse&gt;&gt; getLeaderboard( String mode)|
|Form/query/body·필수/검증 annotation|@GetMapping("/leaderboard") @RequestParam(defaultValue = "EASY") String mode)|
|요청/응답 DTO 세부|C-062 GameRecordResponse: name:String, score:int, date:String|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;GameRecordResponse&gt;&gt;|
|정상 처리/저장|iframe 게임→양수기록 저장·모드별 상위15·전체기록삭제|
|오류·경계|다른 role403·비양수 점수 제외; 빈 이름·mode/players null의 서비스 검증은 미확인; 공통 HTTP/에러계약은 E.1|
|Controller→Service|GameRecordController.getLeaderboard → gameRecordService.getLeaderboard|
|프런트엔드 호출/화면|frontend/src/assets/bomb-game.html:1113 (직접fetch); frontend/src/pages/BombGamePage.jsx|
|DB·알고리즘|game_records; ALG-17|
|소스 근거|backend/src/main/java/com/cell/platform/controller/GameRecordController.java:25 / GameRecordController.getLeaderboard|

### API-B026 — DELETE /api/game/records

|항목|명세|
|---|---|
|목적/US|US-035 관리자 부가 게임·기록|
|인증·서버 권한|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;Void&gt; deleteAll()|
|Form/query/body·필수/검증 annotation|@DeleteMapping("/records")|
|요청/응답 DTO 세부|Void/기본형/List/Map/바이너리. responseType: ResponseEntity&lt;Void&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;Void&gt;|
|정상 처리/저장|iframe 게임→양수기록 저장·모드별 상위15·전체기록삭제|
|오류·경계|다른 role403·비양수 점수 제외; 빈 이름·mode/players null의 서비스 검증은 미확인; 공통 HTTP/에러계약은 E.1|
|Controller→Service|GameRecordController.deleteAll → gameRecordService.deleteAll|
|프런트엔드 호출/화면|frontend/src/assets/bomb-game.html:1113 (직접fetch); frontend/src/pages/BombGamePage.jsx|
|DB·알고리즘|game_records; ALG-17|
|소스 근거|backend/src/main/java/com/cell/platform/controller/GameRecordController.java:31 / GameRecordController.deleteAll|

### API-B027 — GET /api/labeling/tasks/{taskId}/export

|항목|명세|
|---|---|
|목적/US|US-027 라벨링 ZIP/VIA 내보내기|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{taskId}|
|입력·반환 시그니처|public ResponseEntity&lt;byte[]&gt; exportTask(Long taskId)|
|Form/query/body·필수/검증 annotation|@GetMapping("/{taskId}/export") @PathVariable|
|요청/응답 DTO 세부|Void/기본형/List/Map/바이너리. responseType: ResponseEntity&lt;byte[]&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;byte[]&gt;;application/zip·Content-Disposition attachment|
|정상 처리/저장|원본+crop+VIA2.0.10 ZIP; bbox→rect; final우선 gt차선; 종 metadata|
|오류·경계|진단평가/파일 누락 거부; AI pseudo만으로 정답 export 안 함; 공통 HTTP/에러계약은 E.1|
|Controller→Service|LabelingController.exportTask → labelingService.buildArchiveFilename, labelingService.exportTask|
|프런트엔드 호출/화면|frontend/src/api/labeling.js:4 exportTask; frontend/src/components/AnalyticsFeedback.jsx|
|DB·알고리즘|tasks;crops;파일; ALG-13|
|소스 근거|backend/src/main/java/com/cell/platform/controller/LabelingController.java:25 / LabelingController.exportTask|

### API-B028 — POST /api/labeling/tasks/{taskId}/import

|항목|명세|
|---|---|
|목적/US|US-028 VIA 라벨 가져오기|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{taskId}|
|입력·반환 시그니처|public ResponseEntity&lt;Map&lt;String, Integer&gt;&gt; importLabels( Long taskId, JsonNode viaJson )|
|Form/query/body·필수/검증 annotation|@PostMapping("/{taskId}/import") @PathVariable @RequestBody|
|요청/응답 DTO 세부|Void/기본형/List/Map/바이너리. responseType: ResponseEntity&lt;Map&lt;String, Integer&gt;&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;Map&lt;String, Integer&gt;&gt;|
|정상 처리/저장|task별 cropId 검증·6클래스 순서 매핑·gt와final 갱신|
|오류·경계|다른task cropId·형식오류 거부; import 경로 혼동행렬 backfill 미호출; 공통 HTTP/에러계약은 E.1|
|Controller→Service|LabelingController.importLabels → labelingService.importLabels|
|프런트엔드 호출/화면|frontend/src/api/labeling.js:6 importTask; frontend/src/components/AnalyticsFeedback.jsx|
|DB·알고리즘|crops;tasks; ALG-13|
|소스 근거|backend/src/main/java/com/cell/platform/controller/LabelingController.java:35 / LabelingController.importLabels|

### API-B029 — GET /api/tasks/{taskId}/stats

|항목|명세|
|---|---|
|목적/US|US-019 세포 이동·GT 완료 표시; US-020 세포 통계·학생별 선택자; US-021 도말별 학생 응답 비교표|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{taskId}|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;CropStatsResponse&gt;&gt; getTaskStats(Long taskId)|
|Form/query/body·필수/검증 annotation|@GetMapping("/tasks/{taskId}/stats") @PathVariable|
|요청/응답 DTO 세부|C-057 CropStatsResponse: taskId:Long, cropId:Long, filename:String, originalSmearFilename:String, speciesId:Long, speciesCode:String, speciesName:String, bbox:String, gtLabel:String, pseudoLabel:String, aiBboxConfidence:Double, aiClassificationConfidence:Double, finalLabel:String, totalAnswers:int, errorRate:double, accuracyRate:double, hardScore:double, wrongDetails:List&lt;String&gt;, voteDistribution:Map&lt;String, Integer&gt;, votersByLabel:Map&lt;String, List&lt;VoterDetail&gt;&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;CropStatsResponse&gt;&gt;|
|정상 처리/저장|선택 index 이동; finalLabel 개수 집계·Assignment 합산 / 정답 기준 오류율·투표분포·학생표시이름 집계 / 학생별 답 Map; 무응답 포함 총crop 분모; 모든 GT 확정 시 점수 공개|
|오류·경계|빈 crop은 완료 아님; Confirm 자동 다음 이동은 없음 / 응답0·미확정 GT는 채점수치 구분; 전체통계는 선택자명 비움 / 응답 상세 누락·무응답·GT미완료 구분; 공통 HTTP/에러계약은 E.1|
|Controller→Service|StatsController.getTaskStats → statsService.getTaskStats|
|프런트엔드 호출/화면|frontend/src/api/stats.js:4 getByTaskId; frontend/src/components/AnalyticsFeedback.jsx; frontend/src/components/AnalyticsFeedback.jsx; frontend/src/components/StudentResponsesPanel.jsx|
|DB·알고리즘|crops;tasks; crops;submissions;users; submissions;crops;users; ALG-07, ALG-08|
|소스 근거|backend/src/main/java/com/cell/platform/controller/StatsController.java:18 / StatsController.getTaskStats|

### API-B030 — GET /api/all-stats

|항목|명세|
|---|---|
|목적/US|US-019 세포 이동·GT 완료 표시; US-020 세포 통계·학생별 선택자|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;CropStatsResponse&gt;&gt; getAllStats()|
|Form/query/body·필수/검증 annotation|@GetMapping("/all-stats")|
|요청/응답 DTO 세부|C-057 CropStatsResponse: taskId:Long, cropId:Long, filename:String, originalSmearFilename:String, speciesId:Long, speciesCode:String, speciesName:String, bbox:String, gtLabel:String, pseudoLabel:String, aiBboxConfidence:Double, aiClassificationConfidence:Double, finalLabel:String, totalAnswers:int, errorRate:double, accuracyRate:double, hardScore:double, wrongDetails:List&lt;String&gt;, voteDistribution:Map&lt;String, Integer&gt;, votersByLabel:Map&lt;String, List&lt;VoterDetail&gt;&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;CropStatsResponse&gt;&gt;|
|정상 처리/저장|선택 index 이동; finalLabel 개수 집계·Assignment 합산 / 정답 기준 오류율·투표분포·학생표시이름 집계|
|오류·경계|빈 crop은 완료 아님; Confirm 자동 다음 이동은 없음 / 응답0·미확정 GT는 채점수치 구분; 전체통계는 선택자명 비움; 공통 HTTP/에러계약은 E.1|
|Controller→Service|StatsController.getAllStats → statsService.getAllStats|
|프런트엔드 호출/화면|frontend/src/api/stats.js:6 getAll; frontend/src/components/AnalyticsFeedback.jsx; frontend/src/components/AnalyticsFeedback.jsx|
|DB·알고리즘|crops;tasks; crops;submissions;users; ALG-07, ALG-08|
|소스 근거|backend/src/main/java/com/cell/platform/controller/StatsController.java:23 / StatsController.getAllStats|

### API-B031 — GET /api/analytics/students/{studentId}/history

|항목|명세|
|---|---|
|목적/US|US-004 서버·화면 권한 제어; US-022 학생별 학습 이력·세포별 결과|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{studentId}|
|입력·반환 시그니처|public StudentLearningResponse getHistory(String studentId)|
|Form/query/body·필수/검증 annotation|@GetMapping("/{studentId}/history") @PathVariable|
|요청/응답 DTO 세부|C-070 StudentLearningResponse: studentId:String, activities:List&lt;Activity&gt;|
|정상 HTTP/출력|200; StudentLearningResponse|
|정상 처리/저장|React route guard와 Spring URL matcher 검사 / Task를 Assignment별 묶음; 응답·미응답·GT대기 구분; 모든GT 확정 시 전체문항 분모 점수|
|오류·경계|미인증·다른 역할 거부; 메서드 보안 누락 의심 구간 별도 검증 / 미존재 task404; STUDENT API접근403; 무응답 학생은 빈/미응답 내역; 공통 HTTP/에러계약은 E.1|
|Controller→Service|StudentAnalyticsController.getHistory → studentAnalyticsService.getHistory|
|프런트엔드 호출/화면|frontend/src/api/studentAnalytics.js:4 getHistory; frontend/src/App.jsx; frontend/src/components/StudentManagement.jsx|
|DB·알고리즘|users(로그인 시);JWT claims; tasks;crops;submissions; ALG-01, ALG-09|
|소스 근거|backend/src/main/java/com/cell/platform/controller/StudentAnalyticsController.java:16 / StudentAnalyticsController.getHistory|

### API-B032 — GET /api/analytics/students/{studentId}/tasks/{taskId}

|항목|명세|
|---|---|
|목적/US|US-022 학생별 학습 이력·세포별 결과|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{studentId}, {taskId}|
|입력·반환 시그니처|public StudentLearningResponse.TaskDetail getTaskDetail(String studentId, Long taskId)|
|Form/query/body·필수/검증 annotation|@GetMapping("/{studentId}/tasks/{taskId}") @PathVariable @PathVariable|
|요청/응답 DTO 세부|C-070 StudentLearningResponse: studentId:String, activities:List&lt;Activity&gt;; C-074 TaskDetail: studentId:String, task:TaskResult, cells:List&lt;CellResult&gt;|
|정상 HTTP/출력|200; StudentLearningResponse.TaskDetail|
|정상 처리/저장|Task를 Assignment별 묶음; 응답·미응답·GT대기 구분; 모든GT 확정 시 전체문항 분모 점수|
|오류·경계|미존재 task404; STUDENT API접근403; 무응답 학생은 빈/미응답 내역; 공통 HTTP/에러계약은 E.1|
|Controller→Service|StudentAnalyticsController.getTaskDetail → studentAnalyticsService.getTaskDetail|
|프런트엔드 호출/화면|frontend/src/api/studentAnalytics.js:5 getTaskDetail; frontend/src/components/StudentManagement.jsx|
|DB·알고리즘|tasks;crops;submissions; ALG-09|
|소스 근거|backend/src/main/java/com/cell/platform/controller/StudentAnalyticsController.java:21 / StudentAnalyticsController.getTaskDetail|

### API-B033 — GET /api/student/reviews

|항목|명세|
|---|---|
|목적/US|US-017 학생 결과·오답 복습|
|인증·서버 권한|STUDENT; SecurityConfig URL matcher 우선. 메서드 annotation 존재(활성 별도 확인)|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;StudentReviewResponse&gt; getMyReviews( String username)|
|Form/query/body·필수/검증 annotation|@GetMapping @PreAuthorize("hasRole('STUDENT')") @AuthenticationPrincipal|
|요청/응답 DTO 세부|C-076 StudentReviewResponse: reviews:List&lt;ReviewGroup&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;StudentReviewResponse&gt;|
|정상 처리/저장|일반: 전답변+전GT 또는 마감; 진단: 전답변; finalLabel 우선; GT 없는 항목 채점대기|
|오류·경계|공개 전 결과 접근 거부; 다른학생 ID는 principal로 교체; AI예측 비교 미제공; 공통 HTTP/에러계약은 E.1|
|Controller→Service|StudentReviewController.getMyReviews → submissionService.getStudentReviews|
|프런트엔드 호출/화면|frontend/src/api/submissions.js:24 getMyReviews; frontend/src/components/StudentReviewPanel.jsx|
|DB·알고리즘|submissions;crops;tasks;diagnostic manifest; ALG-06|
|소스 근거|backend/src/main/java/com/cell/platform/controller/StudentReviewController.java:20 / StudentReviewController.getMyReviews|

### API-B034 — POST /api/submit

|항목|명세|
|---|---|
|목적/US|US-016 학생 세포 답안 저장·수정|
|인증·서버 권한|AUTHENTICATED; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;Void&gt; submit( SubmissionRequest request, String username)|
|Form/query/body·필수/검증 annotation|@PostMapping("/submit") @RequestBody @AuthenticationPrincipal|
|요청/응답 DTO 세부|C-048 SubmissionRequest: cropId:Long, studentLabel:String|
|정상 HTTP/출력|200; ResponseEntity&lt;Void&gt;|
|정상 처리/저장|principal을 학생ID로 사용; 답안 upsert; GT 있으면 혼동행렬 차감/가산; 다음 미응답 이동|
|오류·경계|유효하지 않은 label·미존재 crop·마감/완료 잠금 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|SubmissionController.submit → submissionService.submit|
|프런트엔드 호출/화면|frontend/src/api/submissions.js:4 submit; frontend/src/pages/StudentPage.jsx|
|DB·알고리즘|submissions;crops;tasks;student_confusion_matrix; ALG-05|
|소스 근거|backend/src/main/java/com/cell/platform/controller/SubmissionController.java:22 / SubmissionController.submit|

### API-B035 — GET /api/tasks/{taskId}/submissions/{studentId}

|항목|명세|
|---|---|
|목적/US|US-016 학생 세포 답안 저장·수정|
|인증·서버 권한|AUTHENTICATED; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{taskId}, {studentId}|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;Long&gt;&gt; getSolvedCrops( Long taskId, String studentId, String username, Authentication authentication)|
|Form/query/body·필수/검증 annotation|@GetMapping("/tasks/{taskId}/submissions/{studentId}") @PathVariable @PathVariable @AuthenticationPrincipal|
|요청/응답 DTO 세부|Void/기본형/List/Map/바이너리. responseType: ResponseEntity&lt;List&lt;Long&gt;&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;Long&gt;&gt;|
|정상 처리/저장|principal을 학생ID로 사용; 답안 upsert; GT 있으면 혼동행렬 차감/가산; 다음 미응답 이동|
|오류·경계|유효하지 않은 label·미존재 crop·마감/완료 잠금 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|SubmissionController.getSolvedCrops → submissionService.getSolvedCropIds|
|프런트엔드 호출/화면|frontend/src/api/submissions.js:6 getSolvedCrops; frontend/src/pages/StudentPage.jsx|
|DB·알고리즘|submissions;crops;tasks;student_confusion_matrix; ALG-05|
|소스 근거|backend/src/main/java/com/cell/platform/controller/SubmissionController.java:30 / SubmissionController.getSolvedCrops|

### API-B036 — GET /api/tasks/{taskId}/submissions/{studentId}/labels

|항목|명세|
|---|---|
|목적/US|US-016 학생 세포 답안 저장·수정|
|인증·서버 권한|AUTHENTICATED; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{taskId}, {studentId}|
|입력·반환 시그니처|public ResponseEntity&lt;Map&lt;Long, String&gt;&gt; getSolvedCropLabels( Long taskId, String studentId, String username, Authentication authentication)|
|Form/query/body·필수/검증 annotation|@GetMapping("/tasks/{taskId}/submissions/{studentId}/labels") @PathVariable @PathVariable @AuthenticationPrincipal|
|요청/응답 DTO 세부|Void/기본형/List/Map/바이너리. responseType: ResponseEntity&lt;Map&lt;Long, String&gt;&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;Map&lt;Long, String&gt;&gt;|
|정상 처리/저장|principal을 학생ID로 사용; 답안 upsert; GT 있으면 혼동행렬 차감/가산; 다음 미응답 이동|
|오류·경계|유효하지 않은 label·미존재 crop·마감/완료 잠금 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|SubmissionController.getSolvedCropLabels → submissionService.getSolvedCropLabels|
|프런트엔드 호출/화면|frontend/src/api/submissions.js:15 getSolvedCropLabels; frontend/src/pages/StudentPage.jsx|
|DB·알고리즘|submissions;crops;tasks;student_confusion_matrix; ALG-05|
|소스 근거|backend/src/main/java/com/cell/platform/controller/SubmissionController.java:40 / SubmissionController.getSolvedCropLabels|

### API-B037 — GET /api/assignments/{assignmentId}/submissions/{studentId}/labels

|항목|명세|
|---|---|
|목적/US|US-016 학생 세포 답안 저장·수정|
|인증·서버 권한|AUTHENTICATED; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{assignmentId}, {studentId}|
|입력·반환 시그니처|public ResponseEntity&lt;Map&lt;Long, String&gt;&gt; getSolvedCropLabelsForAssignment( Long assignmentId, String studentId, String username, Authentication authentication)|
|Form/query/body·필수/검증 annotation|@GetMapping("/assignments/{assignmentId}/submissions/{studentId}/labels") @PathVariable @PathVariable @AuthenticationPrincipal|
|요청/응답 DTO 세부|Void/기본형/List/Map/바이너리. responseType: ResponseEntity&lt;Map&lt;Long, String&gt;&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;Map&lt;Long, String&gt;&gt;|
|정상 처리/저장|principal을 학생ID로 사용; 답안 upsert; GT 있으면 혼동행렬 차감/가산; 다음 미응답 이동|
|오류·경계|유효하지 않은 label·미존재 crop·마감/완료 잠금 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|SubmissionController.getSolvedCropLabelsForAssignment → submissionService.getSolvedCropLabelsForAssignment|
|프런트엔드 호출/화면|frontend/src/api/submissions.js:18 getSolvedCropLabelsForAssignment; frontend/src/pages/StudentPage.jsx|
|DB·알고리즘|submissions;crops;tasks;student_confusion_matrix; ALG-05|
|소스 근거|backend/src/main/java/com/cell/platform/controller/SubmissionController.java:50 / SubmissionController.getSolvedCropLabelsForAssignment|

### API-B038 — GET /api/tasks/{taskId}/my-results/{studentId}

|항목|명세|
|---|---|
|목적/US|US-017 학생 결과·오답 복습|
|인증·서버 권한|AUTHENTICATED; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{taskId}, {studentId}|
|입력·반환 시그니처|public ResponseEntity&lt;MyResultsResponse&gt; getMyResults( Long taskId, String studentId, String username, Authentication authentication)|
|Form/query/body·필수/검증 annotation|@GetMapping("/tasks/{taskId}/my-results/{studentId}") @PathVariable @PathVariable @AuthenticationPrincipal|
|요청/응답 DTO 세부|C-066 MyResultsResponse: total:int, correct:int, wrong:int, accuracy:int, details:List&lt;Detail&gt;, labels:List&lt;String&gt;, confusionMatrix:Map&lt;String, Map&lt;String, Integer&gt;&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;MyResultsResponse&gt;|
|정상 처리/저장|일반: 전답변+전GT 또는 마감; 진단: 전답변; finalLabel 우선; GT 없는 항목 채점대기|
|오류·경계|공개 전 결과 접근 거부; 다른학생 ID는 principal로 교체; AI예측 비교 미제공; 공통 HTTP/에러계약은 E.1|
|Controller→Service|SubmissionController.getMyResults → submissionService.assertReviewAvailableForTask, submissionService.getMyResults|
|프런트엔드 호출/화면|frontend/src/api/submissions.js:9 getMyResults; frontend/src/components/StudentReviewPanel.jsx|
|DB·알고리즘|submissions;crops;tasks;diagnostic manifest; ALG-06|
|소스 근거|backend/src/main/java/com/cell/platform/controller/SubmissionController.java:60 / SubmissionController.getMyResults|

### API-B039 — GET /api/assignments/{assignmentId}/submissions/{studentId}

|항목|명세|
|---|---|
|목적/US|US-016 학생 세포 답안 저장·수정|
|인증·서버 권한|AUTHENTICATED; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{assignmentId}, {studentId}|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;Long&gt;&gt; getSolvedCropsForAssignment( Long assignmentId, String studentId, String username, Authentication authentication)|
|Form/query/body·필수/검증 annotation|@GetMapping("/assignments/{assignmentId}/submissions/{studentId}") @PathVariable @PathVariable @AuthenticationPrincipal|
|요청/응답 DTO 세부|Void/기본형/List/Map/바이너리. responseType: ResponseEntity&lt;List&lt;Long&gt;&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;Long&gt;&gt;|
|정상 처리/저장|principal을 학생ID로 사용; 답안 upsert; GT 있으면 혼동행렬 차감/가산; 다음 미응답 이동|
|오류·경계|유효하지 않은 label·미존재 crop·마감/완료 잠금 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|SubmissionController.getSolvedCropsForAssignment → submissionService.getSolvedCropIdsForAssignment|
|프런트엔드 호출/화면|frontend/src/api/submissions.js:12 getSolvedCropsForAssignment; frontend/src/pages/StudentPage.jsx|
|DB·알고리즘|submissions;crops;tasks;student_confusion_matrix; ALG-05|
|소스 근거|backend/src/main/java/com/cell/platform/controller/SubmissionController.java:73 / SubmissionController.getSolvedCropsForAssignment|

### API-B040 — GET /api/assignments/{assignmentId}/my-results/{studentId}

|항목|명세|
|---|---|
|목적/US|US-017 학생 결과·오답 복습|
|인증·서버 권한|AUTHENTICATED; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|{assignmentId}, {studentId}|
|입력·반환 시그니처|public ResponseEntity&lt;MyResultsResponse&gt; getMyResultsForAssignment( Long assignmentId, String studentId, String username, Authentication authentication)|
|Form/query/body·필수/검증 annotation|@GetMapping("/assignments/{assignmentId}/my-results/{studentId}") @PathVariable @PathVariable @AuthenticationPrincipal|
|요청/응답 DTO 세부|C-066 MyResultsResponse: total:int, correct:int, wrong:int, accuracy:int, details:List&lt;Detail&gt;, labels:List&lt;String&gt;, confusionMatrix:Map&lt;String, Map&lt;String, Integer&gt;&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;MyResultsResponse&gt;|
|정상 처리/저장|일반: 전답변+전GT 또는 마감; 진단: 전답변; finalLabel 우선; GT 없는 항목 채점대기|
|오류·경계|공개 전 결과 접근 거부; 다른학생 ID는 principal로 교체; AI예측 비교 미제공; 공통 HTTP/에러계약은 E.1|
|Controller→Service|SubmissionController.getMyResultsForAssignment → submissionService.assertReviewAvailableForAssignment, submissionService.getMyResultsForAssignment|
|프런트엔드 호출/화면|frontend/src/api/submissions.js:21 getMyResultsForAssignment; frontend/src/components/StudentReviewPanel.jsx|
|DB·알고리즘|submissions;crops;tasks;diagnostic manifest; ALG-06|
|소스 근거|backend/src/main/java/com/cell/platform/controller/SubmissionController.java:83 / SubmissionController.getMyResultsForAssignment|

### API-B041 — GET /api/tasks

|항목|명세|
|---|---|
|목적/US|US-004 서버·화면 권한 제어; US-013 과제 조회·선택·진행률|
|인증·서버 권한|AUTHENTICATED; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;List&lt;TaskResponse&gt;&gt; getAllTasks()|
|Form/query/body·필수/검증 annotation|@GetMapping|
|요청/응답 DTO 세부|C-080 TaskResponse: id:Long, status:String, originalFilename:String, uploadedFilename:String, assignmentId:Long, title:String, speciesId:Long, speciesCode:String, speciesName:String, createdAt:LocalDateTime, deadlineAt:LocalDateTime, cropCount:int|
|정상 HTTP/출력|200; ResponseEntity&lt;List&lt;TaskResponse&gt;&gt;|
|정상 처리/저장|React route guard와 Spring URL matcher 검사 / Task 목록·crop·기존 제출 조회; assignment별 묶음; 답변수/총crop 계산|
|오류·경계|미인증·다른 역할 거부; 메서드 보안 누락 의심 구간 별도 검증 / 빈 과제·조회 실패 표시; 개별 학생 배정 테이블 없음; 공통 HTTP/에러계약은 E.1|
|Controller→Service|TaskController.getAllTasks → taskService.getAllTasks|
|프런트엔드 호출/화면|frontend/src/api/tasks.js:4 getAll; frontend/src/App.jsx; frontend/src/pages/StudentPage.jsx|
|DB·알고리즘|users(로그인 시);JWT claims; tasks;crops;submissions;assignments; ALG-01, ALG-04|
|소스 근거|backend/src/main/java/com/cell/platform/controller/TaskController.java:42 / TaskController.getAllTasks|

### API-B042 — POST /api/tasks/upload

|항목|명세|
|---|---|
|목적/US|US-011 단일 도말 업로드·AI 과제 생성|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;TaskUploadResponse&gt; uploadAndCreateTask( MultipartFile file, LocalDateTime deadlineAt, Long speciesId)|
|Form/query/body·필수/검증 annotation|@PostMapping("/upload") @RequestParam("file") @RequestParam(value = "deadlineAt", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) @RequestParam(value = "speciesId", required = false) Long speciesId)|
|요청/응답 DTO 세부|C-081 TaskUploadResponse: taskId:Long, originalImage:String, speciesId:Long, speciesCode:String, speciesName:String, totalDetected:int, crops:List&lt;CropResponse&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;TaskUploadResponse&gt;|
|정상 처리/저장|원본·썸네일 저장→AI 분석→Task/Crop 저장|
|오류·경계|AI 장애·파일 저장 실패·과거 마감 거부; 독립 단일 업로드 API의 주 UI 연결은 제한; 공통 HTTP/에러계약은 E.1|
|Controller→Service|TaskController.uploadAndCreateTask → taskService.createTask|
|프런트엔드 호출/화면|frontend/src/api/tasks.js:6 upload; frontend/src/api/tasks.js|
|DB·알고리즘|tasks;crops;animal_species;data/originals;data/crops; ALG-03|
|소스 근거|backend/src/main/java/com/cell/platform/controller/TaskController.java:47 / TaskController.uploadAndCreateTask|

### API-B043 — GET /api/tasks/diagnostic/pool-stats

|항목|명세|
|---|---|
|목적/US|US-024 진단평가 문제 생성|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;DiagnosticPoolStatsResponse&gt; getDiagnosticPoolStats()|
|Form/query/body·필수/검증 annotation|@GetMapping("/diagnostic/pool-stats")|
|요청/응답 DTO 세부|C-059 DiagnosticPoolStatsResponse: totalAvailable:int, availableByClass:Map&lt;String, Integer&gt;, speciesId:Long, speciesCode:String, speciesName:String|
|정상 HTTP/출력|200; ResponseEntity&lt;DiagnosticPoolStatsResponse&gt;|
|정상 처리/저장|manifest class별 섞기→요청수 비복원 선택→전체 섞기→gtLabel Task 저장; DOG 고정|
|오류·경계|알수없는 클래스·보유초과·합계불일치·manifest오류 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|TaskController.getDiagnosticPoolStats → diagnosticTaskService.getPoolStats|
|프런트엔드 호출/화면|frontend/src/api/diagnostic.js:5 getPoolStats; frontend/src/pages/ExpertPage.jsx|
|DB·알고리즘|tasks;crops;data/diagnostic_gt/processed/manifest.json; ALG-11|
|소스 근거|backend/src/main/java/com/cell/platform/controller/TaskController.java:56 / TaskController.getDiagnosticPoolStats|

### API-B044 — POST /api/tasks/diagnostic/create

|항목|명세|
|---|---|
|목적/US|US-024 진단평가 문제 생성|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 추가 메서드 annotation 없음|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;TaskUploadResponse&gt; createDiagnosticTask( DiagnosticTaskCreateRequest request)|
|Form/query/body·필수/검증 annotation|@PostMapping("/diagnostic/create") @Valid @RequestBody|
|요청/응답 DTO 세부|C-039 DiagnosticTaskCreateRequest: totalQuestions:Integer, classDistribution:Map&lt;String, Integer&gt;; C-081 TaskUploadResponse: taskId:Long, originalImage:String, speciesId:Long, speciesCode:String, speciesName:String, totalDetected:int, crops:List&lt;CropResponse&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;TaskUploadResponse&gt;|
|정상 처리/저장|manifest class별 섞기→요청수 비복원 선택→전체 섞기→gtLabel Task 저장; DOG 고정|
|오류·경계|알수없는 클래스·보유초과·합계불일치·manifest오류 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|TaskController.createDiagnosticTask → diagnosticTaskService.createDiagnosticTask|
|프런트엔드 호출/화면|frontend/src/api/diagnostic.js:7 createTask; frontend/src/pages/ExpertPage.jsx|
|DB·알고리즘|tasks;crops;data/diagnostic_gt/processed/manifest.json; ALG-11|
|소스 근거|backend/src/main/java/com/cell/platform/controller/TaskController.java:61 / TaskController.createDiagnosticTask|

### API-B045 — GET /api/tasks/diagnostic/student-matrices

|항목|명세|
|---|---|
|목적/US|US-023 진단·누적 혼동행렬|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 메서드 annotation 존재(활성 별도 확인)|
|Path parameter|없음|
|입력·반환 시그니처|public ResponseEntity&lt;DiagnosticStudentMatrixResponse&gt; getCumulativeStudentMatrices()|
|Form/query/body·필수/검증 annotation|@GetMapping("/diagnostic/student-matrices") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')")|
|요청/응답 DTO 세부|C-060 DiagnosticStudentMatrixResponse: studentMatrices:List&lt;StudentMatrixDetail&gt;|
|정상 HTTP/출력|200; ResponseEntity&lt;DiagnosticStudentMatrixResponse&gt;|
|정상 처리/저장|진단·대상 과제에 저장된 혼동행렬 합산; 학생 목록 및 ALL 합계 구성|
|오류·경계|미존재/비진단 task·응답 없음 경계; task별 GET 권한 보강 필요; 공통 HTTP/에러계약은 E.1|
|Controller→Service|TaskController.getCumulativeStudentMatrices → submissionService.getCumulativeStudentMatrices|
|프런트엔드 호출/화면|frontend/src/api/diagnostic.js:10 getStudentMatrices; frontend/src/components/StudentManagement.jsx|
|DB·알고리즘|student_confusion_matrix;tasks;crops;submissions;users; ALG-06|
|소스 근거|backend/src/main/java/com/cell/platform/controller/TaskController.java:67 / TaskController.getCumulativeStudentMatrices|

### API-B046 — GET /api/tasks/{taskId}/diagnostic/student-matrices

|항목|명세|
|---|---|
|목적/US|US-023 진단·누적 혼동행렬|
|인증·서버 권한|의도 EXPERT/ADMIN / URL은 AUTHENTICATED(검증 필요); SecurityConfig URL matcher 우선. 메서드 annotation 존재(활성 별도 확인)|
|Path parameter|{taskId}|
|입력·반환 시그니처|// [추가된 부분] 교수님용: 특정 과제의 모든 학생 혼동행렬 조회 API public ResponseEntity&lt;DiagnosticStudentMatrixResponse&gt; getStudentMatrices(Long taskId)|
|Form/query/body·필수/검증 annotation|@GetMapping("/{taskId}/diagnostic/student-matrices") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @PathVariable|
|요청/응답 DTO 세부|C-060 DiagnosticStudentMatrixResponse: studentMatrices:List&lt;StudentMatrixDetail&gt;|
|정상 HTTP/출력|200; // [추가된 부분] 교수님용: 특정 과제의 모든 학생 혼동행렬 조회 API public ResponseEntity&lt;DiagnosticStudentMatrixResponse&gt;|
|정상 처리/저장|진단·대상 과제에 저장된 혼동행렬 합산; 학생 목록 및 ALL 합계 구성|
|오류·경계|미존재/비진단 task·응답 없음 경계; task별 GET 권한 보강 필요; 공통 HTTP/에러계약은 E.1|
|Controller→Service|TaskController.getStudentMatrices → submissionService.getDiagnosticStudentMatrices|
|프런트엔드 호출/화면|현재React 래퍼 직접 연결 미발견/백엔드용; frontend/src/components/StudentManagement.jsx|
|DB·알고리즘|student_confusion_matrix;tasks;crops;submissions;users; ALG-06|
|소스 근거|backend/src/main/java/com/cell/platform/controller/TaskController.java:74 / TaskController.getStudentMatrices|

### API-B047 — DELETE /api/tasks/{taskId}

|항목|명세|
|---|---|
|목적/US|US-015 과제·도말 삭제|
|인증·서버 권한|의도 EXPERT/ADMIN / URL은 AUTHENTICATED(검증 필요); SecurityConfig URL matcher 우선. 메서드 annotation 존재(활성 별도 확인)|
|Path parameter|{taskId}|
|입력·반환 시그니처|public ResponseEntity&lt;Void&gt; deleteTask(Long taskId)|
|Form/query/body·필수/검증 annotation|@DeleteMapping("/{taskId}") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @PathVariable|
|요청/응답 DTO 세부|Void/기본형/List/Map/바이너리. responseType: ResponseEntity&lt;Void&gt;|
|정상 HTTP/출력|204; ResponseEntity&lt;Void&gt;|
|정상 처리/저장|제출→혼동행렬→신고→Task 삭제; Assignment면 구성 Task 순회|
|오류·경계|미존재 ID 처리·서버 DELETE 권한 누락 의심; 원본/crop 파일 삭제는 확인 안 됨; 공통 HTTP/에러계약은 E.1|
|Controller→Service|TaskController.deleteTask → taskService.deleteTask|
|프런트엔드 호출/화면|frontend/src/api/tasks.js:28 delete; frontend/src/components/AnalyticsFeedback.jsx|
|DB·알고리즘|submissions;student_confusion_matrix;crop_issue_reports;crops;tasks;assignments; ALG-04|
|소스 근거|backend/src/main/java/com/cell/platform/controller/TaskController.java:80 / TaskController.deleteTask|

### API-B048 — PUT /api/tasks/{taskId}/deadline

|항목|명세|
|---|---|
|목적/US|US-014 마감일 설정·변경|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 메서드 annotation 존재(활성 별도 확인)|
|Path parameter|{taskId}|
|입력·반환 시그니처|public ResponseEntity&lt;Void&gt; updateDeadline( Long taskId, DeadlineUpdateRequest request)|
|Form/query/body·필수/검증 annotation|@PutMapping("/{taskId}/deadline") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @PathVariable @RequestBody|
|요청/응답 DTO 세부|C-038 DeadlineUpdateRequest: deadlineAt:LocalDateTime|
|정상 HTTP/출력|200; ResponseEntity&lt;Void&gt;|
|정상 처리/저장|미래 시각·기존 마감 여부 검사; Assignment 단위 갱신|
|오류·경계|이미 마감된 과제 변경·진단평가 마감 설정·묶음 도말 개별 변경 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|TaskController.updateDeadline → taskService.updateTaskDeadline|
|프런트엔드 호출/화면|frontend/src/api/tasks.js:22 updateDeadline; frontend/src/components/AnalyticsFeedback.jsx|
|DB·알고리즘|tasks; ALG-04|
|소스 근거|backend/src/main/java/com/cell/platform/controller/TaskController.java:87 / TaskController.updateDeadline|

### API-B049 — PUT /api/tasks/{taskId}/species

|항목|명세|
|---|---|
|목적/US|US-010 기존 도말의 종 변경|
|인증·서버 권한|EXPERT\|ADMIN; SecurityConfig URL matcher 우선. 메서드 annotation 존재(활성 별도 확인)|
|Path parameter|{taskId}|
|입력·반환 시그니처|public ResponseEntity&lt;AnimalSpeciesResponse&gt; updateSpecies( Long taskId, SpeciesUpdateRequest request)|
|Form/query/body·필수/검증 annotation|@PutMapping("/{taskId}/species") @PreAuthorize("hasAnyRole('EXPERT','ADMIN')") @PathVariable @Valid @RequestBody|
|요청/응답 DTO 세부|C-046 SpeciesUpdateRequest: speciesId:Long; C-053 AnimalSpeciesResponse: id:Long, code:String, name:String, builtIn:boolean|
|정상 HTTP/출력|200; ResponseEntity&lt;AnimalSpeciesResponse&gt;|
|정상 처리/저장|과제·종 존재 확인 후 tasks 연관 종 수정|
|오류·경계|미존재 task/species 거부; 공통 HTTP/에러계약은 E.1|
|Controller→Service|TaskController.updateSpecies → animalSpeciesService.updateTaskSpecies|
|프런트엔드 호출/화면|frontend/src/api/species.js:7 updateTask; frontend/src/api/tasks.js:25 updateSpecies; frontend/src/components/TaskSpeciesEditor.jsx|
|DB·알고리즘|tasks;animal_species; ALG-10|
|소스 근거|backend/src/main/java/com/cell/platform/controller/TaskController.java:96 / TaskController.updateSpecies|

### E.2 AI 서버 3개 계약

#### API-A001 — POST /api/analyze

|권한|입력|응답/상태|오류/한계|호출자/근거/연계|
|---|---|---|---|---|
|별도JWT/API키검사없음;Docker내부노출|multipart file:UploadFile(필수)|200 total_detected:int,cells:[crop_filename:str,bbox:str,prediction:str,confidence:float]|미로딩503;입력누락FastAPI422;잘못된영상일반예외가능|ai-server/app/routers/analyze_router.py:12 analyze_image; US-011, US-012, US-032; AiClientService|

#### API-A002 — POST /api/retrain

|권한|입력|응답/상태|오류/한계|호출자/근거/연계|
|---|---|---|---|---|
|별도JWT/API키검사없음;Docker내부노출|JSON epochs:int=10,batch_size:int=16,learning_rate:float=.001|200 total_samples:int,label_distribution:dict,status:READY|미구현 trainer·백엔드URL/JWT문제;최소데이터/파일부족400;학습완료아님|ai-server/app/routers/retrain_router.py:26 retrain_model; US-034; 프런트엔드 호출 연결 미발견|

#### API-A003 — GET /health

|권한|입력|응답/상태|오류/한계|호출자/근거/연계|
|---|---|---|---|---|
|별도JWT/API키검사없음;Docker내부노출|없음|200 status:ok,models_loaded:boolean|모델 ready 플래그 확인(HTTP 성공만으로 결과품질보장아님)|ai-server/main.py:24 health_check; US-032; Docker healthcheck|

### E.3 독립 컬러화 Flask API 28개

아래 경로는 Flask 내부경로다. 공개 URL은 Nginx가 `/colorizer`를 앞에 붙여 전달한다. `/api/auth/login`이 Spring 로그인과 문자열이 같아도 별도 서비스다. API의 본인 batch/item/job 소유권은 helper에서 확인한다. 공개경로는 index/health/register/login이며 logout은 /api/auth/** 공개예외로 허용된다. me는 공개예외를 통과한 뒤 함수 내부에서 로그인 여부를 검사하여 미인증401을 낸다. 미로그인 API401 JSON(error), ValueError400, PermissionError401, 요청크기413의 실제 handler가 있으며 모든 실패가500이라고 쓰지 않는다.

#### API-D001 — GET /colorizer/health

|항목|구현 계약|
|---|---|
|내부 route/함수|GET /health / health|
|권한|공개|
|입력|없음|
|처리·출력|status:ok; 직접 응답키: status|
|반환 코드 표현|jsonify({"status": "ok"}); 명시status 기본200(파일/도우미응답포함)|
|예외|공개경로;서비스오류는공통handler; 400/401/404/413 등 공통handler 별도|
|연결/근거|NFR-08 / 공개진입·health; 컬러화POC/app.py:1271; 컬러화POC/static/app.js (전용UI)|

#### API-D002 — POST /colorizer/api/auth/register

|항목|구현 계약|
|---|---|
|내부 route/함수|POST /api/auth/register / api_register|
|권한|공개|
|입력|JSON username,password(3~40자/8~128자)|
|처리·출력|Werkzeug hash·Flask signed cookie; CELL JWT와 별개 → 계정·세션·me; 직접 응답키: user|
|반환 코드 표현|jsonify({"user": _user_response(user)}), 201; 명시status 201|
|예외|중복·오입력·미로그인 API거부; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-036 ALG-18; 컬러화POC/app.py:1276; 컬러화POC/static/app.js (전용UI)|

#### API-D003 — POST /colorizer/api/auth/login

|항목|구현 계약|
|---|---|
|내부 route/함수|POST /api/auth/login / api_login|
|권한|공개|
|입력|JSON username,password|
|처리·출력|Werkzeug hash·Flask signed cookie; CELL JWT와 별개 → 계정·세션·me; 직접 응답키: user|
|반환 코드 표현|jsonify({"user": _user_response(user)}); 명시status 기본200(파일/도우미응답포함)|
|예외|중복·오입력·미로그인 API거부; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-036 ALG-18; 컬러화POC/app.py:1297; 컬러화POC/static/app.js (전용UI)|

#### API-D004 — POST /colorizer/api/auth/logout

|항목|구현 계약|
|---|---|
|내부 route/함수|POST /api/auth/logout / api_logout|
|권한|로그아웃(whitelist 허용; 세션clear)|
|입력|추가입력없음|
|처리·출력|Werkzeug hash·Flask signed cookie; CELL JWT와 별개 → 계정·세션·me; 직접 응답키: message|
|반환 코드 표현|jsonify({"message": "로그아웃되었습니다."}); 명시status 기본200(파일/도우미응답포함)|
|예외|중복·오입력·미로그인 API거부; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-036 ALG-18; 컬러화POC/app.py:1309; 컬러화POC/static/app.js (전용UI)|

#### API-D005 — GET /colorizer/api/auth/me

|항목|구현 계약|
|---|---|
|내부 route/함수|GET /api/auth/me / api_me|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|세션쿠키|
|처리·출력|Werkzeug hash·Flask signed cookie; CELL JWT와 별개 → 계정·세션·me; 직접 응답키: user|
|반환 코드 표현|jsonify({"user": _user_response(user)}); 명시status 기본200(파일/도우미응답포함)|
|예외|중복·오입력·미로그인 API거부; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-036 ALG-18; 컬러화POC/app.py:1315; 컬러화POC/static/app.js (전용UI)|

#### API-D006 — GET /colorizer/

|항목|구현 계약|
|---|---|
|내부 route/함수|GET / / index|
|권한|공개|
|입력|없음|
|처리·출력|templates/index.html 반환; 직접 응답키: helper/파일 반환|
|반환 코드 표현|render_template("index.html"); 명시status 기본200(파일/도우미응답포함)|
|예외|공개경로;서비스오류는공통handler; 400/401/404/413 등 공통handler 별도|
|연결/근거|NFR-08 / 공개진입·health; 컬러화POC/app.py:1325; 컬러화POC/static/app.js (전용UI)|

#### API-D007 — POST /colorizer/api/batches

|항목|구현 계약|
|---|---|
|내부 route/함수|POST /api/batches / api_create_batch|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|JSON label(<=200),sourceType(upload/folder)|
|처리·출력|원본저장·hash·pydicom읽기·계정소유권·512MB/10GB검사·영구메타 → batch/items·작업목록; 직접 응답키: helper/파일 반환|
|반환 코드 표현|jsonify(batch_summary(batch)), 201; 명시status 201|
|예외|다른계정 접근·quota·손상영상 오류; batch삭제는본인만; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-037 ALG-18; 컬러화POC/app.py:1330; 컬러화POC/static/app.js (전용UI)|

#### API-D008 — GET /colorizer/api/batches

|항목|구현 계약|
|---|---|
|내부 route/함수|GET /api/batches / api_list_batches|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|세션쿠키|
|처리·출력|원본저장·hash·pydicom읽기·계정소유권·512MB/10GB검사·영구메타 → batch/items·작업목록; 직접 응답키: batchId, label, sourceType, createdAt, itemCount, batches|
|반환 코드 표현|jsonify({"batches": batches}); 명시status 기본200(파일/도우미응답포함)|
|예외|다른계정 접근·quota·손상영상 오류; batch삭제는본인만; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-037 ALG-18; 컬러화POC/app.py:1342; 컬러화POC/static/app.js (전용UI)|

#### API-D009 — POST /colorizer/api/batches/<batch_id>/files

|항목|구현 계약|
|---|---|
|내부 route/함수|POST /api/batches/<batch_id>/files / api_upload_batch_files|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|multipart files[],relativePaths[](선택;개수일치)|
|처리·출력|원본저장·hash·pydicom읽기·계정소유권·512MB/10GB검사·영구메타 → batch/items·작업목록; 직접 응답키: itemId, relativePath, contentHash, imageHash, error, acquisition, savedSettings, roiCount, items, itemCount|
|반환 코드 표현|jsonify({"items": accepted, "itemCount": len(batch.items)}); 명시status 기본200(파일/도우미응답포함)|
|예외|다른계정 접근·quota·손상영상 오류; batch삭제는본인만; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-037 ALG-18; 컬러화POC/app.py:1360; 컬러화POC/static/app.js (전용UI)|

#### API-D010 — POST /colorizer/api/batches/<batch_id>/remove-items

|항목|구현 계약|
|---|---|
|내부 route/함수|POST /api/batches/<batch_id>/remove-items / api_remove_batch_items|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|JSON itemIds[]|
|처리·출력|원본저장·hash·pydicom읽기·계정소유권·512MB/10GB검사·영구메타 → batch/items·작업목록; 직접 응답키: removedCount|
|반환 코드 표현|jsonify({"removedCount": len(removed), **batch_summary(batch)}); 명시status 기본200(파일/도우미응답포함)|
|예외|다른계정 접근·quota·손상영상 오류; batch삭제는본인만; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-037 ALG-18; 컬러화POC/app.py:1408; 컬러화POC/static/app.js (전용UI)|

#### API-D011 — GET /colorizer/api/batches/<batch_id>

|항목|구현 계약|
|---|---|
|내부 route/함수|GET /api/batches/<batch_id> / api_get_batch|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|path batch_id|
|처리·출력|원본저장·hash·pydicom읽기·계정소유권·512MB/10GB검사·영구메타 → batch/items·작업목록; 직접 응답키: helper/파일 반환|
|반환 코드 표현|jsonify(batch_summary(get_batch(batch_id, current_user_id()))); 명시status 기본200(파일/도우미응답포함)|
|예외|다른계정 접근·quota·손상영상 오류; batch삭제는본인만; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-037 ALG-18; 컬러화POC/app.py:1434; 컬러화POC/static/app.js (전용UI)|

#### API-D012 — POST /colorizer/api/batches/<batch_id>/reset-item-names

|항목|구현 계약|
|---|---|
|내부 route/함수|POST /api/batches/<batch_id>/reset-item-names / api_reset_batch_item_names|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|path batch_id|
|처리·출력|이름검증·중복접미사; duration60000±500ms 또는 count200000 분류·기존메타 백필 → 수정이름·촬영유형·필터목록; 직접 응답키: resetCount|
|반환 코드 표현|jsonify({"resetCount": reset_count, **batch_summary(batch)}); 명시status 기본200(파일/도우미응답포함)|
|예외|경로분리문자/허용안된이름 거부; 분류불가 미확인; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-038 ALG-18; 컬러화POC/app.py:1439; 컬러화POC/static/app.js (전용UI)|

#### API-D013 — DELETE /colorizer/api/batches/<batch_id>

|항목|구현 계약|
|---|---|
|내부 route/함수|DELETE /api/batches/<batch_id> / api_delete_batch|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|path batch_id|
|처리·출력|원본저장·hash·pydicom읽기·계정소유권·512MB/10GB검사·영구메타 → batch/items·작업목록; 직접 응답키: deleted, batchId|
|반환 코드 표현|jsonify({"deleted": True, "batchId": batch_id}); 명시status 기본200(파일/도우미응답포함)|
|예외|다른계정 접근·quota·손상영상 오류; batch삭제는본인만; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-037 ALG-18; 컬러화POC/app.py:1450; 컬러화POC/static/app.js (전용UI)|

#### API-D014 — GET /colorizer/api/items/<item_id>

|항목|구현 계약|
|---|---|
|내부 route/함수|GET /api/items/<item_id> / api_get_item|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|path item_id|
|처리·출력|원본저장·hash·pydicom읽기·계정소유권·512MB/10GB검사·영구메타 → batch/items·작업목록; 직접 응답키: helper/파일 반환|
|반환 코드 표현|jsonify(source_information(item, image)); 명시status 기본200(파일/도우미응답포함)|
|예외|다른계정 접근·quota·손상영상 오류; batch삭제는본인만; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-037 ALG-18; 컬러화POC/app.py:1471; 컬러화POC/static/app.js (전용UI)|

#### API-D015 — PATCH /colorizer/api/items/<item_id>/name

|항목|구현 계약|
|---|---|
|내부 route/함수|PATCH /api/items/<item_id>/name / api_rename_item|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|JSON name;path item_id|
|처리·출력|이름검증·중복접미사; duration60000±500ms 또는 count200000 분류·기존메타 백필 → 수정이름·촬영유형·필터목록; 직접 응답키: helper/파일 반환|
|반환 코드 표현|jsonify(item_summary(item)); 명시status 기본200(파일/도우미응답포함)|
|예외|경로분리문자/허용안된이름 거부; 분류불가 미확인; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-038 ALG-18; 컬러화POC/app.py:1478; 컬러화POC/static/app.js (전용UI)|

#### API-D016 — POST /colorizer/api/items/<item_id>/render

|항목|구현 계약|
|---|---|
|내부 route/함수|POST /api/items/<item_id>/render / api_render_item|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|JSON canonical_settings(normalization,colormap,invertGrayscale,gamma,backgroundThreshold,manualBounds,lowerBound,upperBound,lowerPercentile,upperPercentile,logStrength,center,width,format,jpegQuality)|
|처리·출력|5정규화·13컬러맵·모달리티LUT·다중프레임·렌더·설정hash저장 → 흑백/컬러PNG·설정복원; 직접 응답키: grayscale, color, scale|
|반환 코드 표현|jsonify(; 명시status 기본200(파일/도우미응답포함)|
|예외|미지원맵·값범위·압축코덱 오류; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-039 ALG-19; 컬러화POC/app.py:1493; 컬러화POC/static/app.js (전용UI)|

#### API-D017 — GET /colorizer/api/roi-labels

|항목|구현 계약|
|---|---|
|내부 route/함수|GET /api/roi-labels / api_get_roi_labels|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|세션쿠키|
|처리·출력|좌표범위·최대500영역·다각형3~2000점·라벨32개/40자 검사; user+content hash저장 → ROI·라벨목록·VIA JSON; 직접 응답키: labels|
|반환 코드 표현|jsonify({"labels": configured_roi_labels(current_user_id())}); 명시status 기본200(파일/도우미응답포함)|
|예외|잘못된좌표·영역초과·이름중복 거부; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-040 ALG-20; 컬러화POC/app.py:1519; 컬러화POC/static/app.js (전용UI)|

#### API-D018 — POST /colorizer/api/roi-labels

|항목|구현 계약|
|---|---|
|내부 route/함수|POST /api/roi-labels / api_add_roi_label|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|JSON name|
|처리·출력|좌표범위·최대500영역·다각형3~2000점·라벨32개/40자 검사; user+content hash저장 → ROI·라벨목록·VIA JSON; 직접 응답키: labels, added|
|반환 코드 표현|jsonify({"labels": labels, "added": label}), 201; 명시status 201|
|예외|잘못된좌표·영역초과·이름중복 거부; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-040 ALG-20; 컬러화POC/app.py:1524; 컬러화POC/static/app.js (전용UI)|

#### API-D019 — PUT /colorizer/api/roi-labels

|항목|구현 계약|
|---|---|
|내부 route/함수|PUT /api/roi-labels / api_rename_roi_label|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|JSON oldName,newName|
|처리·출력|좌표범위·최대500영역·다각형3~2000점·라벨32개/40자 검사; user+content hash저장 → ROI·라벨목록·VIA JSON; 직접 응답키: labels, oldName, newName, renamedRegionCount|
|반환 코드 표현|jsonify( ; jsonify(; 명시status 기본200(파일/도우미응답포함)|
|예외|잘못된좌표·영역초과·이름중복 거부; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-040 ALG-20; 컬러화POC/app.py:1542; 컬러화POC/static/app.js (전용UI)|

#### API-D020 — GET /colorizer/api/items/<item_id>/annotations

|항목|구현 계약|
|---|---|
|내부 route/함수|GET /api/items/<item_id>/annotations / api_get_item_annotations|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|path item_id|
|처리·출력|좌표범위·최대500영역·다각형3~2000점·라벨32개/40자 검사; user+content hash저장 → ROI·라벨목록·VIA JSON; 직접 응답키: helper/파일 반환|
|반환 코드 표현|jsonify(annotation_summary(item, image)); 명시status 기본200(파일/도우미응답포함)|
|예외|잘못된좌표·영역초과·이름중복 거부; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-040 ALG-20; 컬러화POC/app.py:1581; 컬러화POC/static/app.js (전용UI)|

#### API-D021 — PUT /colorizer/api/items/<item_id>/annotations

|항목|구현 계약|
|---|---|
|내부 route/함수|PUT /api/items/<item_id>/annotations / api_save_item_annotations|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|JSON regions[],colorSettingsSnapshot(선택);path item_id. 영상 크기는 서버가 원본에서 읽어 검증|
|처리·출력|좌표범위·최대500영역·다각형3~2000점·라벨32개/40자 검사; user+content hash저장 → ROI·라벨목록·VIA JSON; 직접 응답키: regions, colorSettingsSnapshot|
|반환 코드 표현|jsonify(result); 명시status 기본200(파일/도우미응답포함)|
|예외|잘못된좌표·영역초과·이름중복 거부; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-040 ALG-20; 컬러화POC/app.py:1588; 컬러화POC/static/app.js (전용UI)|

#### API-D022 — GET /colorizer/api/items/<item_id>/annotations/via

|항목|구현 계약|
|---|---|
|내부 route/함수|GET /api/items/<item_id>/annotations/via / api_download_item_annotations_via|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|path item_id|
|처리·출력|좌표범위·최대500영역·다각형3~2000점·라벨32개/40자 검사; user+content hash저장 → ROI·라벨목록·VIA JSON; 직접 응답키: helper/파일 반환|
|반환 코드 표현|send_file(; 명시status 기본200(파일/도우미응답포함)|
|예외|잘못된좌표·영역초과·이름중복 거부; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-040 ALG-20; 컬러화POC/app.py:1622; 컬러화POC/static/app.js (전용UI)|

#### API-D023 — PUT /colorizer/api/items/<item_id>/settings

|항목|구현 계약|
|---|---|
|내부 route/함수|PUT /api/items/<item_id>/settings / api_save_item_settings|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|JSON canonical_settings;path item_id|
|처리·출력|5정규화·13컬러맵·모달리티LUT·다중프레임·렌더·설정hash저장 → 흑백/컬러PNG·설정복원; 직접 응답키: contentHash, savedSettings|
|반환 코드 표현|jsonify({"contentHash": item.content_hash, "savedSettings": settings}); 명시status 기본200(파일/도우미응답포함)|
|예외|미지원맵·값범위·압축코덱 오류; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-039 ALG-19; 컬러화POC/app.py:1648; 컬러화POC/static/app.js (전용UI)|

#### API-D024 — POST /colorizer/api/items/<item_id>/download

|항목|구현 계약|
|---|---|
|내부 route/함수|POST /api/items/<item_id>/download / api_download_item|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|JSON canonical_settings;path item_id|
|처리·출력|5정규화·13컬러맵·모달리티LUT·다중프레임·렌더·설정hash저장 → 흑백/컬러PNG·설정복원; 직접 응답키: helper/파일 반환|
|반환 코드 표현|send_file(; 명시status 기본200(파일/도우미응답포함)|
|예외|미지원맵·값범위·압축코덱 오류; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-039 ALG-19; 컬러화POC/app.py:1658; 컬러화POC/static/app.js (전용UI)|

#### API-D025 — POST /colorizer/api/export-jobs

|항목|구현 계약|
|---|---|
|내부 route/함수|POST /api/export-jobs / api_create_export_job|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|JSON batchId,jobType(images/via),scope(saved/all),settings/format|
|처리·출력|백그라운드 export job→진행률→ZIP·취소·TTL1h 정리 → PNG/JPG ZIP 또는 VIA+기준PNG; 직접 응답키: via, format, jpegQuality, all|
|반환 코드 표현|jsonify(job_summary(job)), 202 ; jsonify(job_summary(job)), 202; 명시status 202|
|예외|다른계정job·취소·만료·파일오류; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-041 ALG-21; 컬러화POC/app.py:1674; 컬러화POC/static/app.js (전용UI)|

#### API-D026 — GET /colorizer/api/export-jobs/<job_id>

|항목|구현 계약|
|---|---|
|내부 route/함수|GET /api/export-jobs/<job_id> / api_get_export_job|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|path job_id|
|처리·출력|백그라운드 export job→진행률→ZIP·취소·TTL1h 정리 → PNG/JPG ZIP 또는 VIA+기준PNG; 직접 응답키: helper/파일 반환|
|반환 코드 표현|jsonify(job_summary(job)); 명시status 기본200(파일/도우미응답포함)|
|예외|다른계정job·취소·만료·파일오류; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-041 ALG-21; 컬러화POC/app.py:1754; 컬러화POC/static/app.js (전용UI)|

#### API-D027 — DELETE /colorizer/api/export-jobs/<job_id>

|항목|구현 계약|
|---|---|
|내부 route/함수|DELETE /api/export-jobs/<job_id> / api_cancel_export_job|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|path job_id|
|처리·출력|백그라운드 export job→진행률→ZIP·취소·TTL1h 정리 → PNG/JPG ZIP 또는 VIA+기준PNG; 직접 응답키: helper/파일 반환|
|반환 코드 표현|jsonify(job_summary(job)); 명시status 기본200(파일/도우미응답포함)|
|예외|다른계정job·취소·만료·파일오류; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-041 ALG-21; 컬러화POC/app.py:1764; 컬러화POC/static/app.js (전용UI)|

#### API-D028 — GET /colorizer/api/export-jobs/<job_id>/download

|항목|구현 계약|
|---|---|
|내부 route/함수|GET /api/export-jobs/<job_id>/download / api_download_export_job|
|권한|컬러화 세션 필요·대상 소유권검사|
|입력|path job_id|
|처리·출력|백그라운드 export job→진행률→ZIP·취소·TTL1h 정리 → PNG/JPG ZIP 또는 VIA+기준PNG; 직접 응답키: helper/파일 반환|
|반환 코드 표현|response; 명시status 기본200(파일/도우미응답포함)|
|예외|다른계정job·취소·만료·파일오류; 400/401/404/413 등 공통handler 별도|
|연결/근거|US-041 ALG-21; 컬러화POC/app.py:1776; 컬러화POC/static/app.js (전용UI)|

### E.4 프레임워크/정적 경로와 합성 예시

- Spring `/data/originals/**`, `/data/crops/**`, `/data/thumbnails/**`: WebConfig resource handler·로그인필요. 단일 endpoint 수가 아니라 경로규칙3개다.
- React 5개 실제 route `/`, `/student`, `/expert`, `/admin`, `/game`; App에는 wildcard route2개도 있으나 별도 화면으로 세지 않는다.
- FastAPI 기본 docs/openapi/redoc/OAuth redirect와 Flask `/static/<path>`는 라이브러리가 생성하는 경로이며 위 자체 선언 API80개와 별도. Spring /error·CORS OPTIONS도 별도다. 실제 노출·보안정책은 배포/시험에서 확인한다.

아래는 **구현 계약 기반 합성 예시**다. 실제 학생/과제/영상은 아니다.

```http
POST /api/submit
Authorization: Bearer [SECRET]
Content-Type: application/json

{"cropId":101,"studentLabel":"Band"}

HTTP/1.1 200 OK
(응답 본문 없음)
```

```json
{"total_detected":1,"cells":[{"crop_filename":"crop_SYNTHETIC.jpg","bbox":"[10, 20, 60, 80]","prediction":"Band","confidence":0.8}]}
```

두 번째 JSON은 AI 응답 형식 예시일 뿐 정확도/실측결과가 아니다. JWT·비밀번호 실제 값은 전사하지 않는다. Spring AiAnalysisResponse의 snake_case JsonProperty와 record DTO 원본을 확인하여 camelCase와 혼동하지 않는다.

## F. GUI·화면 캡처 준비 목록

화면19개는 실제URL5개+컬러화앱의 **화면 상태/탭/모달 단위**다. 독립 page 소스는5개이며 화면 수와 route 수는 다르다. 이번엔 실제 브라우저를 열거나 캡처하지 않았다. 캡처 시 학생·교수·관리자 시험계정을 별도브라우저프로필로 준비하고 실사용자 정보는 가린다.

|UI_ID|화면명|역할·route/진입|컴포넌트·입력/버튼/출력|검증·오류·API|US·근거|
|---|---|---|---|---|---|
|UI-01|로그인·학생 가입|방문자; /|ID/비밀번호·이름·로그인/가입전환·DICOM링크;실패/승인대기메시지|오입력·PENDING/REJECTED/INACTIVE 로그인 거부; EXPERT/ADMIN 공개가입·중복 아이디·빈 이름 거부; 이전 세션의 늦은 401이 새 세션 삭제하지 않음; API: POST /api/auth/login; POST /api/auth/register; 프런트엔드 로컬 동작;POST /api/auth/login|US-001, US-002, US-003; frontend/src/pages/LoginPage.jsx:1|
|UI-02|학생 과제 대시보드|STUDENT; /student|일반/진단목록·과제묶음·종·마감·진행률·이어풀기|기존 누락 종은 DOG fallback; 종별 AI 모델은 아님; 빈 과제·조회 실패 표시; 개별 학생 배정 테이블 없음; 유효하지 않은 label·미존재 crop·마감/완료 잠금 거부; API: GET /api/species; GET /api/tasks;GET /api/assignments/{assignmentId}/tasks;GET /api/tasks/{taskId}/crops;GET /api/assignments/{assignmentId}/crops; POST /api/submit;GET /api/tasks/{taskId}/submissions/{studentId};GET /api/tasks/{taskId}/submissions/{studentId}/labels;GET /api/assignments/{assignmentId}/submissions/{studentId};GET /api/assignments/{assignmentId}/submissions/{studentId}/labels|US-008, US-013, US-016; frontend/src/pages/StudentPage.jsx:1|
|UI-03|학생 세포 분류|STUDENT; /student → 과제선택|도말bbox/crop·6선택지·자동미응답이동·답안수정·신고·화면조정|유효하지 않은 label·미존재 crop·마감/완료 잠금 거부; 필수값 누락 거부; 미존재·다른 과제 ID 및 학생ID 위조는 서버 검증 없음; 401·없는파일404; Task별 파일 소유권 분리는 없음; 원본은 변경하지 않음; 초해상도·자동 염색보정 없음; API: POST /api/submit;GET /api/tasks/{taskId}/submissions/{studentId};GET /api/tasks/{taskId}/submissions/{studentId}/labels;GET /api/assignments/{assignmentId}/submissions/{studentId};GET /api/assignments/{assignmentId}/submissions/{studentId}/labels; POST /api/reports; GET /data/** (리소스 핸들러); 추가 API 없음|US-016, US-025, US-030, US-031; frontend/src/pages/StudentPage.jsx:1|
|UI-04|학생 채점 결과|STUDENT; /student → 제출하고 채점받기|정답/오답/정확도·셀별내답/GT·혼동행렬;결과공개전대기|공개 전 결과 접근 거부; 다른학생 ID는 principal로 교체; AI예측 비교 미제공; API: GET /api/tasks/{taskId}/my-results/{studentId};GET /api/assignments/{assignmentId}/my-results/{studentId};GET /api/student/reviews|US-017; frontend/src/pages/StudentPage.jsx:1|
|UI-05|학생 학습결과·복습|STUDENT; /student → 학습 결과|일반/진단완료내역·전체/정답/오답/채점대기·셀상세·도말/crop|공개 전 결과 접근 거부; 다른학생 ID는 principal로 교체; AI예측 비교 미제공; 원본은 변경하지 않음; 초해상도·자동 염색보정 없음; API: GET /api/tasks/{taskId}/my-results/{studentId};GET /api/assignments/{assignmentId}/my-results/{studentId};GET /api/student/reviews; 추가 API 없음|US-017, US-031; frontend/src/components/StudentReviewPanel.jsx:1|
|UI-06|교수 과제 생성|EXPERT; /expert → 2.Task Management|title·다중영상·이미지별종·선택마감·drag/drop·미리보기·AI진행안내(시간기반)|미존재 task/species 거부; 파일 없음·종 개수 불일치·AI 중간 실패; FS 롤백은 보장 안 됨; 미로딩503; 잘못된영상 일반예외 가능; 탐지confidence/NMS 자체설정 없음; API: PUT /api/tasks/{taskId}/species; POST /api/assignments;POST AI:/api/analyze; POST AI:/api/analyze;GET AI:/health|US-010, US-012, US-032; frontend/src/pages/ExpertPage.jsx:1|
|UI-07|공통 분석·과제/도말 목록|EXPERT·ADMIN; /expert 또는 /admin → 1.Analytics & Feedback(기본)|과제·도말·GT완료·마감변경·삭제·선택·라벨export/import|이미 마감된 과제 변경·진단평가 마감 설정·묶음 도말 개별 변경 거부; 미존재 ID 처리·서버 DELETE 권한 누락 의심; 원본/crop 파일 삭제는 확인 안 됨; 빈 crop은 완료 아님; Confirm 자동 다음 이동은 없음; 응답0·미확정 GT는 채점수치 구분; 전체통계는 선택자명 비움; 진단평가/파일 누락 거부; AI pseudo만으로 정답 export 안 함; 다른task cropId·형식오류 거부; import 경로 혼동행렬 backfill 미호출; API: PUT /api/tasks/{taskId}/deadline;PUT /api/assignments/{assignmentId}/deadline; DELETE /api/tasks/{taskId};DELETE /api/assignments/{assignmentId}; GET /api/all-stats;GET /api/tasks/{taskId}/stats; GET /api/tasks/{taskId}/stats;GET /api/all-stats; GET /api/labeling/tasks/{taskId}/export; POST /api/labeling/tasks/{taskId}/import|US-014, US-015, US-019, US-020, US-027, US-028; frontend/src/components/AnalyticsFeedback.jsx:1|
|UI-08|공통 세포 GT 검토·응답표|EXPERT·ADMIN; 공통 분석 → 도말/셀선택|bbox클릭/세포목록·◀▶·GT수정/저장·분포클릭학생명·도말학생응답표·화면조정|미존재 crop·유효하지 않은 label 거부; 빈 crop은 완료 아님; Confirm 자동 다음 이동은 없음; 응답0·미확정 GT는 채점수치 구분; 전체통계는 선택자명 비움; 응답 상세 누락·무응답·GT미완료 구분; 원본은 변경하지 않음; 초해상도·자동 염색보정 없음; API: PUT /api/crops/{cropId}/confirm; GET /api/all-stats;GET /api/tasks/{taskId}/stats; GET /api/tasks/{taskId}/stats;GET /api/all-stats; GET /api/tasks/{taskId}/stats; 추가 API 없음|US-018, US-019, US-020, US-021, US-031; frontend/src/components/AnalyticsFeedback.jsx:1|
|UI-09|학생 관리·학습 이력·행렬|EXPERT·ADMIN; 공통 분석 → Students → 학생선택|검색·학습이력·과제펼치기·셀별응답·정오답/미응답/대기·전체누적행렬·오류재시도|미존재 task404; STUDENT API접근403; 무응답 학생은 빈/미응답 내역; 미존재/비진단 task·응답 없음 경계; task별 GET 권한 보강 필요; API: GET /api/analytics/students/{studentId}/history;GET /api/analytics/students/{studentId}/tasks/{taskId}; GET /api/tasks/diagnostic/student-matrices;GET /api/tasks/{taskId}/diagnostic/student-matrices|US-022, US-023; frontend/src/components/StudentManagement.jsx:1|
|UI-10|진단평가 생성|EXPERT; /expert → 3.Diagnostic Evaluation|보유량·총문제·class분포·자동분배·최대검사·진단생성|알수없는 클래스·보유초과·합계불일치·manifest오류 거부; API: GET /api/tasks/diagnostic/pool-stats;POST /api/tasks/diagnostic/create|US-024; frontend/src/pages/ExpertPage.jsx:1|
|UI-11|종 데이터 설정|EXPERT; /expert → 4.Data Settings|종추가/이름수정;세포클래스관리영역은추후업데이트문구|기존 누락 종은 DOG fallback; 종별 AI 모델은 아님; 빈 이름·중복·미존재 종 거부; 미존재 task/species 거부; API: GET /api/species; POST /api/species;PUT /api/species/{speciesId}; PUT /api/tasks/{taskId}/species|US-008, US-009, US-010; frontend/src/components/SpeciesDataSettings.jsx:1|
|UI-12|관리자 도말 목록|ADMIN; /admin → 2.Smear Images|검색·라벨필터·종/개수·도말/crop·라벨입출력|진단평가/파일 누락 거부; AI pseudo만으로 정답 export 안 함; 다른task cropId·형식오류 거부; import 경로 혼동행렬 backfill 미호출; 미로그인401·다른역할403; 파일 자체 삭제는 별도 아님; API: GET /api/labeling/tasks/{taskId}/export; POST /api/labeling/tasks/{taskId}/import; GET /api/admin/smears;GET /api/admin/crops|US-029, US-027, US-028; frontend/src/pages/AdminPage.jsx:1|
|UI-13|관리자 crop 목록|ADMIN; /admin → 3.Cell(Crop) Images|원본명검색·라벨상태·종·crop표시|미로그인401·다른역할403; 파일 자체 삭제는 별도 아님; 401·없는파일404; Task별 파일 소유권 분리는 없음; API: GET /api/admin/smears;GET /api/admin/crops; GET /data/** (리소스 핸들러)|US-029, US-030; frontend/src/pages/AdminPage.jsx:1|
|UI-14|관리자 계정·명단|ADMIN; /admin → 4.User Management|EXPERT/STUDENT생성·상태변경·삭제·학생명단일괄등록·중복결과|중복 ID·ADMIN 생성 거부; 미존재 사용자·보호 대상 ADMIN 변경/삭제 거부; 기존 JWT 즉시 폐기 아님; 빈 명단·중복 항목 처리; API: GET /api/admin/users;POST /api/admin/users; PUT /api/admin/users/{userId}/status;DELETE /api/admin/users/{username}; GET /api/admin/student-roster;POST /api/admin/student-roster|US-005, US-006, US-007; frontend/src/pages/AdminPage.jsx:1|
|UI-15|관리자 부가 게임|ADMIN; /game(관리자NavBar아이콘)|iframe게임·모드·기록·순위·전체삭제|다른 role403·비양수 점수 제외; 빈 이름·mode/players null의 서비스 검증은 미확인; API: POST /api/game/records;GET /api/game/leaderboard;DELETE /api/game/records|US-035; frontend/src/pages/BombGamePage.jsx:1|
|UI-16|컬러화 별도 인증·작업목록|별도 컬러화 계정; /colorizer/ (로그인화면링크)|가입/로그인/로그아웃·작업만들기/열기/삭제·다중파일/폴더|중복·오입력·미로그인 API거부; 다른계정 접근·quota·손상영상 오류; batch삭제는본인만; API: POST COLOR:/api/auth/register;POST COLOR:/api/auth/login;POST COLOR:/api/auth/logout;GET COLOR:/api/auth/me; POST COLOR:/api/batches;GET COLOR:/api/batches;POST COLOR:/api/batches/&lt;batch_id&gt;/files;POST COLOR:/api/batches/&lt;batch_id&gt;/remove-items;GET COLOR:/api/batches/&lt;batch_id&gt;;DELETE COLOR:/api/batches/&lt;batch_id&gt;;GET COLOR:/api/items/&lt;item_id&gt;|US-036, US-037; 컬러화POC/templates/index.html:1|
|UI-17|컬러화 파일·렌더|컬러화 사용자; /colorizer/ → 작업/파일선택|파일명/촬영유형/상태필터·이름변경/복원·5정규화/13맵·설정저장·현재PNG/JPG|경로분리문자/허용안된이름 거부; 분류불가 미확인; 미지원맵·값범위·압축코덱 오류; API: PATCH COLOR:/api/items/&lt;item_id&gt;/name;POST COLOR:/api/batches/&lt;batch_id&gt;/reset-item-names; POST COLOR:/api/items/&lt;item_id&gt;/render;PUT COLOR:/api/items/&lt;item_id&gt;/settings;POST COLOR:/api/items/&lt;item_id&gt;/download|US-038, US-039; 컬러화POC/static/app.js:1|
|UI-18|컬러화 ROI 편집기|컬러화 사용자; /colorizer/ → ROI 라벨링|polygon/ellipse·선택/이동/resize/zoom·라벨추가/이름수정·ROI저장/VIA|잘못된좌표·영역초과·이름중복 거부; API: GET COLOR:/api/roi-labels;POST COLOR:/api/roi-labels;PUT COLOR:/api/roi-labels;GET COLOR:/api/items/&lt;item_id&gt;/annotations;PUT COLOR:/api/items/&lt;item_id&gt;/annotations;GET COLOR:/api/items/&lt;item_id&gt;/annotations/via|US-040; 컬러화POC/static/app.js:1|
|UI-19|컬러화 일괄 내보내기|컬러화 사용자; /colorizer/ → 전체 변환 또는 ROI VIA 다운로드|saved/all·PNG/JPG또는VIA·진행률·취소·ZIP다운로드|다른계정job·취소·만료·파일오류; API: POST COLOR:/api/export-jobs;GET COLOR:/api/export-jobs/&lt;job_id&gt;;DELETE COLOR:/api/export-jobs/&lt;job_id&gt;;GET COLOR:/api/export-jobs/&lt;job_id&gt;/download|US-041; 컬러화POC/static/app.js:1|

## G. 환경·실행·배포·오픈소스

### G.1 선언/lock/실행 버전

|기술|선언·고정/역할|lock 또는 현재 컨테이너 관측|근거|
|---|---|---|---|
|React/DOM|^18.3.0·UI|lock18.3.1|frontend/package.json:12·package-lock.json|
|Router|^6.26.0·역할별SPA|lock6.30.3|package.json·App.jsx|
|Axios|^1.7.0·REST|lock1.13.5|package.json·createApiClient|
|Vite/plugin-react|^5.4.0/^4.3.0·build/dev/mock|lock5.4.21/4.7.0|package-lock.json·vite.config.js|
|Java/Spring|Java17/SpringBoot3.3.5|Java런타임 이번 별도조회안함|backend/build.gradle:1|
|Gradle|Docker build8.13-jdk17/gradle wrapper|선언8.13|backend/Dockerfile:1·wrapper properties|
|JJWT|0.12.6·서명/검증|라이브러리실행별도분해안함|backend/build.gradle|
|MySQL|image mysql:8.0·업무DB|실행8.0.46|compose·mysql --version|
|Python|image3.12-slim|AI/컬러화3.12.14|Dockerfiles·sys.version|
|FastAPI/Uvicorn|>=.115/>=.30·AI HTTP|.141.1/.52.4|ai requirements·설치metadata|
|Torch/Torchvision|>=2.6/>=.21|2.13.0/.28.0|requirements·metadata|
|Ultralytics|>=8.2·YOLO추론|8.4.128|requirements·metadata|
|OpenCV-headless/Pillow/httpx|>=4.10/>=10.4/>=.27|5.0.0.93/12.3.0/.28.1|requirements·metadata|
|Flask/pydicom/NumPy|>=3.1<4/>=3<4/>=2<3|3.1.3/3.0.2/2.5.2|컬러화requirements·metadata|
|Matplotlib/Gunicorn|>=3.9<4/>=23<24|3.11.1/23.0.0|컬러화requirements·metadata|
|Nginx|nginx:alpine·TLS/정적/프록시|1.31.7|frontend/Dockerfile·nginx -v|
|Docker/Compose|Docker Desktop/compose|29.5.2 / v5.1.3|현재실행도구버전(공식시험장비확정아님)|

PyTorch가 CUDA 빌드라는 사실과 GPU 실제 사용은 별개다. 코드가 cuda_available에 따라 선택하나 compose에 GPU device 예약이 없고 이번 조사에서 GPU 활성/추론 성능은 새로 측정하지 않았다.

### G.2 서비스/컨테이너·network·포트·volume·의존

|compose service / 관측 container|image/build|내부·외부 포트|volume/환경변수 이름|dependency·health·network|
|---|---|---|---|---|
|mysql / dev-mysql-1|mysql:8.0|3306내부(33060이미지포트도표시),publish없음|mysql-data:/var/lib/mysql;MYSQL_ROOT_PASSWORD=[SECRET],MYSQL_DATABASE|healthmysqladmin ping;restart unless-stopped;기본compose network|
|ai-server / dev-ai-server-1|./ai-server|8001내부,publish없음|weights read/write bind·./data:/data|/health30s·timeout10s·retry3·start90s;명시depends없음;기본network|
|backend / dev-backend-1|./backend|8080내부,publish없음|./data:/data;SPRING_DATASOURCE_*,JWT_SECRET=[SECRET],ADMIN_*,AI_SERVER_URL,FILE_*|mysql healthy만기다림;AI readiness dependency없음;자체healthcheck없음|
|colorizer / dev-colorizer-1|./컬러화POC|8501내부,publish없음|colorizer-data:/data;COLORIZER_*;memory기본2g/cpu1.5|/health30s·timeout10s·retry3·start10s;별도DB계정;기본network|
|frontend / dev-frontend-1|./frontend(Node20 build→nginx)|80:80·443:443 외부|./ssl:/etc/nginx/ssl:ro|backend 시작에depends(healthy대기아님);자체health없음;기본network|

모든 service restart는 unless-stopped. named volume2개·공유파일 bind·weights bind·TLS bind를 구분한다. 현재 컨테이너명은 compose project 이름에 따라 달라지는 관측값이지 고정API가 아니다.

### G.3 환경변수·설정 키(비밀값 미출력)

|이름/키|용도|
|---|---|
|MYSQL_ROOT_PASSWORD,SPRING_DATASOURCE_PASSWORD,DB_PASSWORD|DB비밀번호 [SECRET]|
|JWT_SECRET,COLORIZER_SECRET_KEY,ADMIN_PASSWORD|서명/세션/초기계정 비밀 [SECRET]|
|SPRING_DATASOURCE_URL/USERNAME,DB_URL/USERNAME|compose/dev/prod DB 연결|
|SPRING_JPA_HIBERNATE_DDL_AUTO/SHOW_SQL|compose validate/SQL로그 비활성 덮어쓰기|
|JWT_EXPIRATION_HOURS|JWT유효시간(dev기본24h,prod필수)|
|ADMIN_USERNAME|초기관리자ID설정(값미출력)|
|AI_SERVER_URL|Spring→AI base URL|
|FILE_UPLOAD_DIR,FILE_CROP_DIR,FILE_THUMBNAIL_DIR|업무영상3종FS경로|
|diagnostic.dataset.processed-dir/raw-images-dir|진단manifest/crop·원천영상 경로(Spring설정키)|
|COLORIZER_DATA_DIR/SECURE_COOKIE/USER_STORAGE_LIMIT_GB|컬러화저장소·HTTPS쿠키·사용자quota|
|COLORIZER_MEMORY_LIMIT/CPU_LIMIT|compose컬러화자원상한|
|VITE_COLORIZER_URL|로그인화면별도컬러화링크|
|MPLCONFIGDIR,PYTHONDONTWRITEBYTECODE,PYTHONUNBUFFERED|Docker내Matplotlib캐시·Python실행옵션|

컬러화 요청 제한의 배포 차이: Flask MAX_CONTENT_LENGTH는 파일 한도에 16MiB를 더한 528MiB지만, Nginx `/colorizer/`의 `client_max_body_size 512m`가 요청 전체를 먼저 제한한다. 따라서 프록시 경유에서 파일 정확히512MiB에 multipart 부가정보까지 더하면 거부될 수 있다. 파일당/요청전체/프록시 제한은 시험에서 따로 확인해야 한다.

### G.4 실행 명령(문서화만, 이번 미실행)

```powershell
# 개발 화면(실서버 연결)
cd frontend
npm ci
npm run dev
# mock는 npm run dev:mock, 데이터는 메모리 합성값
# 백엔드: backend에서 Java17 설정 후
.\gradlew.bat bootRun
# AI: 의존성/weights 준비 후 ai-server에서
uvicorn main:app --host 0.0.0.0 --port 8001
# 전체 Docker 배포(서비스/DB에 영향이 있으므로 조사에서는 실행 안 함)
docker compose up -d --build
```

CI/CD workflow는 .github 기준 미발견. Docker backend build는 `bootJar -x test`여서 배포이미지build 성공이 테스트통과를 뜻하지 않는다. README의 `down -v`/DROP/초기화 예시는 데이터파괴 가능하므로 일반 업데이트 절차에 복사하지 않는다. TLS갱신스크립트 존재와 예약실행 성공은 다르다.

### G.5 오픈소스·출처·재사용 경계

아래 npm license는 현재 lock의 package metadata, Python은 실행 컨테이너 설치 metadata에서 읽었다. 웹에서 라이선스 의무를 새로 법률 검토한 결과가 아니다. 현재 프로젝트·데이터·모델 자체 배포허가는 별도 확인한다.

|OSS_ID|이름·버전|역할|확인 라이선스·근거|출처(저장소/설치metadata)|
|---|---|---|---|---|
|OSS-01|react 18.3.1|프런트엔드/빌드|MIT; frontend/package-lock.json|https://registry.npmjs.org/react/-/react-18.3.1.tgz|
|OSS-02|react-dom 18.3.1|프런트엔드/빌드|MIT; frontend/package-lock.json|https://registry.npmjs.org/react-dom/-/react-dom-18.3.1.tgz|
|OSS-03|react-router-dom 6.30.3|프런트엔드/빌드|MIT; frontend/package-lock.json|https://registry.npmjs.org/react-router-dom/-/react-router-dom-6.30.3.tgz|
|OSS-04|axios 1.13.5|프런트엔드/빌드|MIT; frontend/package-lock.json|https://registry.npmjs.org/axios/-/axios-1.13.5.tgz|
|OSS-05|vite 5.4.21|프런트엔드/빌드|MIT; frontend/package-lock.json|https://registry.npmjs.org/vite/-/vite-5.4.21.tgz|
|OSS-06|@vitejs/plugin-react 4.7.0|프런트엔드/빌드|MIT; frontend/package-lock.json|https://registry.npmjs.org/@vitejs/plugin-react/-/plugin-react-4.7.0.tgz|
|OSS-07|fastapi (실행버전G.1)|AI/컬러화·픽셀/서빙|MIT;설치distribution metadata|Homepage, https://github.com/fastapi/fastapi; Repository, https://github.com/fastapi/fastapi|
|OSS-08|uvicorn (실행버전G.1)|AI/컬러화·픽셀/서빙|BSD-3-Clause;설치distribution metadata|Homepage, https://uvicorn.dev/; Source, https://github.com/Kludex/uvicorn|
|OSS-09|torch (실행버전G.1)|AI/컬러화·픽셀/서빙|Apache-2.0 AND Apache-2.0 WITH LLVM-exception AND BSD-2-Clause AND BSD-3-Clause AND BSL-1.0 AND MIT;설치distribution metadata|Homepage, https://pytorch.org; Repository, https://github.com/pytorch/pytorch|
|OSS-10|torchvision (실행버전G.1)|AI/컬러화·픽셀/서빙|BSD;설치distribution metadata|설치metadata URL 미기록|
|OSS-11|ultralytics (실행버전G.1)|AI/컬러화·픽셀/서빙|AGPL-3.0;설치distribution metadata|Homepage, https://ultralytics.com; Source, https://github.com/ultralytics/ultralytics|
|OSS-12|opencv-python-headless (실행버전G.1)|AI/컬러화·픽셀/서빙|Apache 2.0;설치distribution metadata|설치metadata URL 미기록|
|OSS-13|Pillow (실행버전G.1)|AI/컬러화·픽셀/서빙|MIT-CMU;설치distribution metadata|Funding, https://tidelift.com/subscription/pkg/pypi-pillow?utm_source=pypi-pillow&utm_medium=pypi; Homepage, https://python-pillow.github.io|
|OSS-14|httpx (실행버전G.1)|AI/컬러화·픽셀/서빙|BSD-3-Clause;설치distribution metadata|Homepage, https://github.com/encode/httpx; Source, https://github.com/encode/httpx|
|OSS-15|Flask (실행버전G.1)|AI/컬러화·픽셀/서빙|BSD-3-Clause;설치distribution metadata|Source, https://github.com/pallets/flask/|
|OSS-16|pydicom (실행버전G.1)|AI/컬러화·픽셀/서빙|해당metadata필드비어있음·라이선스추가확인;설치distribution metadata|homepage, https://github.com/pydicom/pydicom; repository, https://github.com/pydicom/pydicom|
|OSS-17|numpy (실행버전G.1)|AI/컬러화·픽셀/서빙|BSD-3-Clause AND 0BSD AND MIT AND Zlib AND CC0-1.0;설치distribution metadata|homepage, https://numpy.org; source, https://github.com/numpy/numpy|
|OSS-18|matplotlib (실행버전G.1)|AI/컬러화·픽셀/서빙|License agreement for matplotlib versions 1.3.0 and later&lt;br&gt; =========================================;설치distribution metadata|Homepage, https://matplotlib.org; Source Code, https://github.com/matplotlib/matplotlib|
|OSS-19|Pillow (실행버전G.1)|AI/컬러화·픽셀/서빙|MIT-CMU;설치distribution metadata|Funding, https://tidelift.com/subscription/pkg/pypi-pillow?utm_source=pypi-pillow&utm_medium=pypi; Homepage, https://python-pillow.github.io|
|OSS-20|gunicorn (실행버전G.1)|AI/컬러화·픽셀/서빙|MIT;설치distribution metadata|Homepage, https://gunicorn.org; Source code, https://github.com/benoitc/gunicorn|
|OSS-21|Spring/Gradle/JJWT/MySQL/Nginx/Java·기타전이의존성|백엔드·DB·빌드·TLS|저장소선언에는완전한라이선스목록없음→추가확인|build.gradle/Dockerfile/compose|

재사용 범위: Ultralytics 모델 로더, torchvision DenseNet201 구조·transform, pydicom pixel decode/LUT, Matplotlib colormap, React/Router/Axios/Spring/JPA/Security 기반을 사용한다. 서비스·데이터 가중치의 학습/사용허가와 연구초안·그림의 인용허가는 해당 프로젝트 소유자의 확인이 필요하다. Ultralytics 설치 metadata는 AGPL-3.0을 명시하므로 배포 방식별 의무/별도계약 여부는 확인 대상이며 여기서 준수/위반을 단정하지 않는다.


## H. 사용사례·요구사항 입출력 상세 연결

### H.1 UC 전체 명세

각 UC는 D03 주제와 동일 번호이며 여럿의 세부 US를 포함한다. 아래 정상/예외 흐름은 현 코드 기반이고 실제 수행결과는 미확인이다. 화면 메뉴를 사용사례 그 자체로 바꾸지 않는다.

|UC_ID·명칭|주요 액터|목적·시작 조건|기본 흐름|예외 흐름|결과·구현 상태|화면/API·US·근거|
|---|---|---|---|---|---|---|
|UC-01 인증·브라우저 세션|학생·EXPERT·ADMIN; 비로그인 학생|본인 계정으로 역할별 작업을 시작한다; 시작: 가입/로그인 화면 진입 또는 기존 브라우저 세션|US-001: 비밀번호 BCrypt 비교·계정 상태 검사 후 JWT 발급 → US-002: 아이디 중복·학생 이름·허용 역할 검사, 명단이면 ACTIVE 아니면 PENDING → US-003: 단일 localStorage 레코드와 sessionId; 구세션 요청·지연 응답 취소|US-001: 오입력·PENDING/REJECTED/INACTIVE 로그인 거부; US-002: EXPERT/ADMIN 공개가입·중복 아이디·빈 이름 거부; US-003: 이전 세션의 늦은 401이 새 세션 삭제하지 않음|역할별 첫 화면과 accessToken; 가입 결과 상태·메시지; 로그인/역할 홈으로 재이동; 정적 구현|US-001, US-002, US-003; frontend/src/pages/LoginPage.jsx; frontend/src/utils/authSession.js; 해당API/ALG절; frontend/src/pages/LoginPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AuthService.java:26|
|UC-02 접근 권한|학생·EXPERT·ADMIN|권한이 있는 기능만 접근한다; 시작: 보호 URL 요청·서버 보안 설정 활성|US-004: React route guard와 Spring URL matcher 검사|US-004: 미인증·다른 역할 거부; 메서드 보안 누락 의심 구간 별도 검증|허용 화면/API 또는 401/403; 정적 구현|US-004; frontend/src/App.jsx; 해당API/ALG절; frontend/src/App.jsx:1 / backend/src/main/java/com/cell/platform/config/SecurityConfig.java:24|
|UC-03 계정·학생 명단|ADMIN|교수·학생 계정을 관리한다; 시작: ADMIN 인증|US-005: 사용자 전체 조회; 중복 검사·비밀번호 해시 후 생성; ADMIN 생성 제한 → US-006: 상태 enum 검증·관리자 변경 보호·삭제 → US-007: 공백 항목 trim·중복 건너뛰기·명단 저장; 이미 PENDING인 계정을 자동 활성화하는 코드는 없음|US-005: 중복 ID·ADMIN 생성 거부; US-006: 미존재 사용자·보호 대상 ADMIN 변경/삭제 거부; 기존 JWT 즉시 폐기 아님; US-007: 빈 명단·중복 항목 처리|사용자 목록·생성 결과; 갱신 사용자 또는 삭제204; added,skipped와 명단; 정적 구현|US-005, US-006, US-007; frontend/src/pages/AdminPage.jsx; 해당API/ALG절; frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37|
|UC-04 동물 종 메타데이터|로그인 사용자; EXPERT·ADMIN(API); EXPERT·ADMIN|도말·세포가 어느 종인지 확인한다; 시작: 로그인 사용자 또는 종 변경 권한|US-008: DOG/CAT 기본 종과 사용자 종을 조회; DTO에 종 메타데이터 전달 → US-009: 이름 공백·60자·대소문자 중복 검사; custom code UUID 생성 → US-010: 과제·종 존재 확인 후 tasks 연관 종 수정|US-008: 기존 누락 종은 DOG fallback; 종별 AI 모델은 아님; US-009: 빈 이름·중복·미존재 종 거부; US-010: 미존재 task/species 거부|화면 종 배지; 종 정보; 갱신 종 정보; 정적 구현|US-008, US-009, US-010; frontend/src/components/SpeciesBadge.jsx; frontend/src/components/SpeciesDataSettings.jsx; frontend/src/components/TaskSpeciesEditor.jsx; 해당API/ALG절; frontend/src/components/SpeciesBadge.jsx:1 / backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24|
|UC-05 도말 업로드·과제 생성|EXPERT·ADMIN(API); EXPERT(화면)·ADMIN(API)|도말을 세포 단위 문제로 만든다; 시작: EXPERT 인증·업로드할 영상·AI/DB/파일 환경 준비|US-011: 원본·썸네일 저장→AI 분석→Task/Crop 저장 → US-012: 파일 개수·종 배열·마감 검사; Assignment 저장 후 영상별 순차 AI 호출·Task 저장|US-011: AI 장애·파일 저장 실패·과거 마감 거부; 독립 단일 업로드 API의 주 UI 연결은 제한; US-012: 파일 없음·종 개수 불일치·AI 중간 실패; FS 롤백은 보장 안 됨|TaskUploadResponse; assignmentId,tasks,totalCrops; 정적 구현|US-011, US-012; frontend/src/api/tasks.js; frontend/src/pages/ExpertPage.jsx; 해당API/ALG절; frontend/src/api/tasks.js:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|UC-06 과제 조회·마감·삭제|학생·EXPERT·ADMIN; EXPERT·ADMIN; EXPERT·ADMIN 의도|일반 과제와 진단평가를 구분하고 이어 푼다; 시작: 로그인·대상 Task/Assignment 존재|US-013: Task 목록·crop·기존 제출 조회; assignment별 묶음; 답변수/총crop 계산 → US-014: 미래 시각·기존 마감 여부 검사; Assignment 단위 갱신 → US-015: 제출→혼동행렬→신고→Task 삭제; Assignment면 구성 Task 순회|US-013: 빈 과제·조회 실패 표시; 개별 학생 배정 테이블 없음; US-014: 이미 마감된 과제 변경·진단평가 마감 설정·묶음 도말 개별 변경 거부; US-015: 미존재 ID 처리·서버 DELETE 권한 누락 의심; 원본/crop 파일 삭제는 확인 안 됨|과제 카드·진행률·첫 미응답 셀; 갱신 결과; 204; 정적 구현|US-013, US-014, US-015; frontend/src/pages/StudentPage.jsx; frontend/src/components/AnalyticsFeedback.jsx; 해당API/ALG절; frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|UC-07 학생 학습·복습|STUDENT(화면)·로그인(API); STUDENT|세포를 분류하고 진행 중 답안을 저장한다; 시작: STUDENT 인증·crop와 제출 범위 존재|US-016: principal을 학생ID로 사용; 답안 upsert; GT 있으면 혼동행렬 차감/가산; 다음 미응답 이동 → US-017: 일반: 전답변+전GT 또는 마감; 진단: 전답변; finalLabel 우선; GT 없는 항목 채점대기|US-016: 유효하지 않은 label·미존재 crop·마감/완료 잠금 거부; US-017: 공개 전 결과 접근 거부; 다른학생 ID는 principal로 교체; AI예측 비교 미제공|200 및 답안 복원; 정오답·정확도·혼동행렬·세포별 내 답/GT; 정적 구현|US-016, US-017; frontend/src/pages/StudentPage.jsx; frontend/src/components/StudentReviewPanel.jsx; 해당API/ALG절; frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/SubmissionService.java:46|
|UC-08 전문가 GT 검토|EXPERT·ADMIN|검증된 정답을 제공하고 오류를 바로잡는다; 시작: EXPERT/ADMIN 인증·검토할 crop 존재|US-018: finalLabel 갱신; 기존 GT 기준 혼동행렬 차감 후 새 GT 가산 → US-019: 선택 index 이동; finalLabel 개수 집계·Assignment 합산|US-018: 미존재 crop·유효하지 않은 label 거부; US-019: 빈 crop은 완료 아님; Confirm 자동 다음 이동은 없음|200·갱신 통계; GT n/N·COMPLETE; 정적 구현|US-018, US-019; frontend/src/components/AnalyticsFeedback.jsx; 해당API/ALG절; frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/CropService.java:23|
|UC-09 통계·학생별 분석|EXPERT·ADMIN|어떤 세포를 누가 어떤 클래스로 답했는지 분석한다; 시작: EXPERT/ADMIN 인증·집계할 Task/학생 데이터|US-020: 정답 기준 오류율·투표분포·학생표시이름 집계 → US-021: 학생별 답 Map; 무응답 포함 총crop 분모; 모든 GT 확정 시 점수 공개 → US-022: Task를 Assignment별 묶음; 응답·미응답·GT대기 구분; 모든GT 확정 시 전체문항 분모 점수 → US-023: 진단·대상 과제에 저장된 혼동행렬 합산; 학생 목록 및 ALL 합계 구성|US-020: 응답0·미확정 GT는 채점수치 구분; 전체통계는 선택자명 비움; US-021: 응답 상세 누락·무응답·GT미완료 구분; US-022: 미존재 task404; STUDENT API접근403; 무응답 학생은 빈/미응답 내역; US-023: 미존재/비진단 task·응답 없음 경계; task별 GET 권한 보강 필요|accuracyRate,errorRate,hardScore,voteDistribution,votersByLabel; StudentResponsesPanel 비교표; Activity/TaskDetail·누적 요약; studentMatrices,totalSolved,accuracy; 정적 구현|US-020, US-021, US-022, US-023; frontend/src/components/AnalyticsFeedback.jsx; frontend/src/components/StudentResponsesPanel.jsx; frontend/src/components/StudentManagement.jsx; 해당API/ALG절; frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/StatsService.java:21|
|UC-10 진단평가|EXPERT(화면)·ADMIN(API)|정답이 준비된 셀로 평가 과제를 만든다; 시작: EXPERT 인증·허가된 진단 manifest와 crop 준비|US-024: manifest class별 섞기→요청수 비복원 선택→전체 섞기→gtLabel Task 저장; DOG 고정|US-024: 알수없는 클래스·보유초과·합계불일치·manifest오류 거부|진단 Task 및 보유량; 정적 구현|US-024; frontend/src/pages/ExpertPage.jsx; 해당API/ALG절; frontend/src/pages/ExpertPage.jsx:1 / backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:25|
|UC-11 문제 세포 신고|STUDENT(화면)·로그인(API); EXPERT·ADMIN|이미지·탐지 문제를 교수에게 전달한다; 시작: 로그인·신고 요청 또는 EXPERT/ADMIN 목록조회|US-025: DTO 필수값만 검사한 뒤 요청의 studentId/taskId/cropId/reason 그대로 저장; 대상 ID 존재·소속 확인은 없음 → US-026: 신고 목록에 crop·종 메타데이터 결합|US-025: 필수값 누락 거부; 미존재·다른 과제 ID 및 학생ID 위조는 서버 검증 없음; US-026: STUDENT GET403; 해결상태 워크플로는 없음|200·목록; 신고 목록·이미지; 정적 구현|US-025, US-026; frontend/src/pages/StudentPage.jsx; frontend/src/components/AnalyticsFeedback.jsx; 해당API/ALG절; frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18|
|UC-12 라벨 파일 입출력|EXPERT·ADMIN|전문가 라벨과 이미지를 외부 도구로 전달한다; 시작: EXPERT/ADMIN 인증·업로드 도말 및 crop·VIA 파일|US-027: 원본+crop+VIA2.0.10 ZIP; bbox→rect; final우선 gt차선; 종 metadata → US-028: task별 cropId 검증·6클래스 순서 매핑·gt와final 갱신|US-027: 진단평가/파일 누락 거부; AI pseudo만으로 정답 export 안 함; US-028: 다른task cropId·형식오류 거부; import 경로 혼동행렬 backfill 미호출|ZIP 파일; updated 개수; 정적 구현|US-027, US-028; frontend/src/components/AnalyticsFeedback.jsx; 해당API/ALG절; frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/LabelingService.java:34|
|UC-13 영상 관리·표시|ADMIN; 로그인 사용자; 학생·EXPERT·ADMIN|전체 영상과 라벨 유무를 확인한다; 시작: 영상 표시 인증; 전체 영상 관리는 ADMIN|US-029: DB집계+파일 표시·선택·라벨 입출력 진입 → US-030: Bearer 포함 fetch→blob; Spring resource handler; 썸네일 max320 → US-031: CSS/Canvas filter; 사용자·영상별 localStorage|US-029: 미로그인401·다른역할403; 파일 자체 삭제는 별도 아님; US-030: 401·없는파일404; Task별 파일 소유권 분리는 없음; US-031: 원본은 변경하지 않음; 초해상도·자동 염색보정 없음|도말/crop 목록; 영상·Canvas bbox; 밝기·대비·채도 조절 화면; 정적 구현|US-029, US-030, US-031; frontend/src/pages/AdminPage.jsx; frontend/src/components/AuthImage.jsx; frontend/src/components/ImageDisplayControls.jsx; 해당API/ALG절; frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37|
|UC-14 AI 추론|Spring 백엔드(시스템 액터)|도말을 자동 분석해 분류 후보를 얻는다; 시작: AI 모델 로드 완료·백엔드의 영상 요청|US-032: YOLO box→정수xyxy→OpenCV JPG crop→RGB256/정규화→DenseNet201 softmax argmax|US-032: 미로딩503; 잘못된영상 일반예외 가능; 탐지confidence/NMS 자체설정 없음|total_detected,cells[crop_filename,bbox,prediction,confidence]; 정적 구현|US-032; ai-server/app/services/pipeline.py; 해당API/ALG절; ai-server/app/services/pipeline.py:1 / backend/src/main/java/com/cell/platform/service/AiClientService.java:20|
|UC-15 학습 데이터·재학습 경계|로그인(API;문서상EXPERT 의도); 서비스 확장 계획|확정 라벨과 crop 목록을 추출한다; 시작: 확정 라벨 목록은 존재 가능; 재학습 실행 경계는 미구현|US-033: finalLabel 있는 crop 선택 → US-034: 목록 조회·최소10·crop존재검사 골격; 실제trainer·평가·가중치교체 없음|US-033: 역할 제한이 URL에 없어 학생접근 가능성; 화면 호출연결 미확인; US-034: localhost 백엔드주소·JWT없음; posterior도 TODO|TrainingDataResponse[]; READY 더미 상태; 부분 구현 포함|US-033, US-034; frontend/src/api/crops.js; ai-server/app/routers/retrain_router.py; 해당API/ALG절; frontend/src/api/crops.js:1 / backend/src/main/java/com/cell/platform/service/CropService.java:23|
|UC-16 관리자 부가 게임|ADMIN|관리자용 게임과 순위표를 사용한다; 시작: ADMIN 인증·게임 페이지|US-035: iframe 게임→양수기록 저장·모드별 상위15·전체기록삭제|US-035: 다른 role403·비양수 점수 제외; 빈 이름·mode/players null의 서비스 검증은 미확인|게임·leaderboard; 정적 구현|US-035; frontend/src/pages/BombGamePage.jsx; 해당API/ALG절; frontend/src/pages/BombGamePage.jsx:1 / backend/src/main/java/com/cell/platform/service/GameRecordService.java:18|
|UC-17 독립 컬러화 계정·파일|컬러화 사용자(별도 계정); 컬러화 사용자|자신의 DICOM 작업을 저장한다; 시작: 별도 컬러화 계정·업로드할 합성 DICOM|US-036: Werkzeug hash·Flask signed cookie; CELL JWT와 별개 → US-037: 원본저장·hash·pydicom읽기·계정소유권·512MB/10GB검사·영구메타 → US-038: 이름검증·중복접미사; duration60000±500ms 또는 count200000 분류·기존메타 백필|US-036: 중복·오입력·미로그인 API거부; US-037: 다른계정 접근·quota·손상영상 오류; batch삭제는본인만; US-038: 경로분리문자/허용안된이름 거부; 분류불가 미확인|계정·세션·me; batch/items·작업목록; 수정이름·촬영유형·필터목록; 정적 구현|US-036, US-037, US-038; 컬러화POC/templates/index.html; 컬러화POC/static/app.js; 해당API/ALG절; 컬러화POC/templates/index.html:1 / ColorizerStore|
|UC-18 독립 컬러화 시각화·ROI·내보내기|컬러화 사용자|명암·컬러 결과를 비교한다; 시작: 컬러화 인증·본인 작업/영상·지원 설정|US-039: 5정규화·13컬러맵·모달리티LUT·다중프레임·렌더·설정hash저장 → US-040: 좌표범위·최대500영역·다각형3~2000점·라벨32개/40자 검사; user+content hash저장 → US-041: 백그라운드 export job→진행률→ZIP·취소·TTL1h 정리|US-039: 미지원맵·값범위·압축코덱 오류; US-040: 잘못된좌표·영역초과·이름중복 거부; US-041: 다른계정job·취소·만료·파일오류|흑백/컬러PNG·설정복원; ROI·라벨목록·VIA JSON; PNG/JPG ZIP 또는 VIA+기준PNG; 정적 구현|US-039, US-040, US-041; 컬러화POC/static/app.js; 컬러화POC/static/roi_geometry.js; 해당API/ALG절; 컬러화POC/static/app.js:1 / dicom_processing|

### H.2 US별 입력→처리→출력·수용 기준

D04와 동일ID·동일 요구이다. 학생/교수/관리자 API권한과 화면의 route role을 별도 E/F 절에서 대조한다.

|US_ID·기능|입력|처리|출력|정상 조건|예외/미구현 경계|근거/상태|
|---|---|---|---|---|---|---|
|US-001 로그인|username,password|비밀번호 BCrypt 비교·계정 상태 검사 후 JWT 발급|역할별 첫 화면과 accessToken|활성 계정은 로그인 성공|오입력·PENDING/REJECTED/INACTIVE 로그인 거부|frontend/src/pages/LoginPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AuthService.java:26; ALG-01; 정적 구현 확인|
|US-002 학생 회원가입|username,name,password,role=STUDENT|아이디 중복·학생 이름·허용 역할 검사, 명단이면 ACTIVE 아니면 PENDING|가입 결과 상태·메시지|명단 등록 학생은 즉시 활성화|EXPERT/ADMIN 공개가입·중복 아이디·빈 이름 거부|frontend/src/pages/LoginPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AuthService.java:26; ALG-01; 정적 구현 확인|
|US-003 로그아웃·다중 탭 계정 동기화|로그인·로그아웃·storage/focus/visibility 이벤트|단일 localStorage 레코드와 sessionId; 구세션 요청·지연 응답 취소|로그인/역할 홈으로 재이동|새 세션은 모든 탭에 동기화|이전 세션의 늦은 401이 새 세션 삭제하지 않음|frontend/src/utils/authSession.js:1 / backend/src/main/java/com/cell/platform/config/JwtAuthFilter.java:17; ALG-02; 정적 구현 확인|
|US-004 서버·화면 권한 제어|JWT·role·URL|React route guard와 Spring URL matcher 검사|허용 화면/API 또는 401/403|권한별 URL 규칙에 맞게 접근|미인증·다른 역할 거부; 메서드 보안 누락 의심 구간 별도 검증|frontend/src/App.jsx:1 / backend/src/main/java/com/cell/platform/config/SecurityConfig.java:24; ALG-01; 정적 구현 확인|
|US-005 관리자 사용자 목록·생성|username,name,password,role|사용자 전체 조회; 중복 검사·비밀번호 해시 후 생성; ADMIN 생성 제한|사용자 목록·생성 결과|EXPERT/STUDENT 생성 가능|중복 ID·ADMIN 생성 거부|frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37; ALG-10; 정적 구현 확인|
|US-006 가입 승인·비활성화·삭제|userId,status 또는 username|상태 enum 검증·관리자 변경 보호·삭제|갱신 사용자 또는 삭제204|상태 변경이 다음 로그인 검사에 반영|미존재 사용자·보호 대상 ADMIN 변경/삭제 거부; 기존 JWT 즉시 폐기 아님|frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37; ALG-10; 정적 구현 확인|
|US-007 학생 사전 명단 관리|studentIds 배열|공백 항목 trim·중복 건너뛰기·명단 저장; 이미 PENDING인 계정을 자동 활성화하는 코드는 없음|added,skipped와 명단|새 명단 항목 저장|빈 명단·중복 항목 처리|frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37; ALG-10; 정적 구현 확인|
|US-008 동물 종 조회·표시|speciesId/code/name|DOG/CAT 기본 종과 사용자 종을 조회; DTO에 종 메타데이터 전달|화면 종 배지|과제·세포·통계에 종 표시|기존 누락 종은 DOG fallback; 종별 AI 모델은 아님|frontend/src/components/SpeciesBadge.jsx:1 / backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24; ALG-10; 정적 구현 확인|
|US-009 종 생성·이름 수정|name,speciesId|이름 공백·60자·대소문자 중복 검사; custom code UUID 생성|종 정보|유일한 이름 저장|빈 이름·중복·미존재 종 거부|frontend/src/components/SpeciesDataSettings.jsx:1 / backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24; ALG-10; 정적 구현 확인|
|US-010 기존 도말의 종 변경|taskId,speciesId|과제·종 존재 확인 후 tasks 연관 종 수정|갱신 종 정보|종 배지·DTO 변경|미존재 task/species 거부|frontend/src/components/TaskSpeciesEditor.jsx:1 / backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24; ALG-10; 정적 구현 확인|
|US-011 단일 도말 업로드·AI 과제 생성|multipart file,deadlineAt?,speciesId?|원본·썸네일 저장→AI 분석→Task/Crop 저장|TaskUploadResponse|유효 영상에서 검출 crop 반환|AI 장애·파일 저장 실패·과거 마감 거부; 독립 단일 업로드 API의 주 UI 연결은 제한|frontend/src/api/tasks.js:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; ALG-03; 정적 구현 확인·주 UI 연결 미확인|
|US-012 다중 도말 과제 생성|title,files[],speciesIds[],deadlineAt?|파일 개수·종 배열·마감 검사; Assignment 저장 후 영상별 순차 AI 호출·Task 저장|assignmentId,tasks,totalCrops|한 개 이상 파일·영상별 종 지정|파일 없음·종 개수 불일치·AI 중간 실패; FS 롤백은 보장 안 됨|frontend/src/pages/ExpertPage.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; ALG-03; 정적 구현 확인|
|US-013 과제 조회·선택·진행률|task/assignment 선택|Task 목록·crop·기존 제출 조회; assignment별 묶음; 답변수/총crop 계산|과제 카드·진행률·첫 미응답 셀|기존 답안 복원|빈 과제·조회 실패 표시; 개별 학생 배정 테이블 없음|frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; ALG-04; 정적 구현 확인|
|US-014 마감일 설정·변경|deadlineAt(null 해제 가능),taskId/assignmentId|미래 시각·기존 마감 여부 검사; Assignment 단위 갱신|갱신 결과|마감 전 미래 날짜 변경|이미 마감된 과제 변경·진단평가 마감 설정·묶음 도말 개별 변경 거부|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; ALG-04; 정적 구현 확인|
|US-015 과제·도말 삭제|taskId/assignmentId,삭제 확인|제출→혼동행렬→신고→Task 삭제; Assignment면 구성 Task 순회|204|연결 DB기록 삭제|미존재 ID 처리·서버 DELETE 권한 누락 의심; 원본/crop 파일 삭제는 확인 안 됨|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/TaskService.java:34; ALG-04; 정적 구현 확인|
|US-016 학생 세포 답안 저장·수정|cropId,studentLabel|principal을 학생ID로 사용; 답안 upsert; GT 있으면 혼동행렬 차감/가산; 다음 미응답 이동|200 및 답안 복원|6개 label·잠기지 않은 과제|유효하지 않은 label·미존재 crop·마감/완료 잠금 거부|frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/SubmissionService.java:46; ALG-05; 정적 구현 확인|
|US-017 학생 결과·오답 복습|taskId/assignmentId 또는 학습결과 탭|일반: 전답변+전GT 또는 마감; 진단: 전답변; finalLabel 우선; GT 없는 항목 채점대기|정오답·정확도·혼동행렬·세포별 내 답/GT|공개 조건 충족|공개 전 결과 접근 거부; 다른학생 ID는 principal로 교체; AI예측 비교 미제공|frontend/src/components/StudentReviewPanel.jsx:1 / backend/src/main/java/com/cell/platform/service/SubmissionService.java:46; ALG-06; 정적 구현 확인|
|US-018 전문가 정답 확정·재수정|cropId,finalLabel|finalLabel 갱신; 기존 GT 기준 혼동행렬 차감 후 새 GT 가산|200·갱신 통계|유효6클래스·수정 버튼·저장|미존재 crop·유효하지 않은 label 거부|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/CropService.java:23; ALG-07; 정적 구현 확인|
|US-019 세포 이동·GT 완료 표시|이전/다음·세포목록·도말 선택|선택 index 이동; finalLabel 개수 집계·Assignment 합산|GT n/N·COMPLETE|모든 finalLabel 존재 시 완료 배지|빈 crop은 완료 아님; Confirm 자동 다음 이동은 없음|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/StatsService.java:21; ALG-07; 정적 구현 확인|
|US-020 세포 통계·학생별 선택자|taskId,crop 선택|정답 기준 오류율·투표분포·학생표시이름 집계|accuracyRate,errorRate,hardScore,voteDistribution,votersByLabel|응답 있을 때 클래스별 학생 펼치기|응답0·미확정 GT는 채점수치 구분; 전체통계는 선택자명 비움|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/StatsService.java:21; ALG-08; 정적 구현 확인|
|US-021 도말별 학생 응답 비교표|task stats의 votersByLabel/finalLabel|학생별 답 Map; 무응답 포함 총crop 분모; 모든 GT 확정 시 점수 공개|StudentResponsesPanel 비교표|GT 완료 시 점수; 수정하면 재계산|응답 상세 누락·무응답·GT미완료 구분|frontend/src/components/StudentResponsesPanel.jsx:1 / backend/src/main/java/com/cell/platform/service/StatsService.java:21; ALG-08; 정적 구현 확인|
|US-022 학생별 학습 이력·세포별 결과|studentId,taskId|Task를 Assignment별 묶음; 응답·미응답·GT대기 구분; 모든GT 확정 시 전체문항 분모 점수|Activity/TaskDetail·누적 요약|학생 선택→학습이력→세포별 응답|미존재 task404; STUDENT API접근403; 무응답 학생은 빈/미응답 내역|frontend/src/components/StudentManagement.jsx:1 / backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:24; ALG-09; 정적 구현 확인|
|US-023 진단·누적 혼동행렬|taskId 또는 누적 요청|진단·대상 과제에 저장된 혼동행렬 합산; 학생 목록 및 ALL 합계 구성|studentMatrices,totalSolved,accuracy|기존 제출과 GT 관계에 따른 집계|미존재/비진단 task·응답 없음 경계; task별 GET 권한 보강 필요|frontend/src/components/StudentManagement.jsx:1 / backend/src/main/java/com/cell/platform/service/SubmissionService.java:46; ALG-06; 정적 구현 확인|
|US-024 진단평가 문제 생성|totalQuestions,classDistribution|manifest class별 섞기→요청수 비복원 선택→전체 섞기→gtLabel Task 저장; DOG 고정|진단 Task 및 보유량|양의 총수·분포합 일치·보유량 이내|알수없는 클래스·보유초과·합계불일치·manifest오류 거부|frontend/src/pages/ExpertPage.jsx:1 / backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:25; ALG-11; 정적 구현 확인|
|US-025 문제 세포 신고|taskId,cropId,studentId,reason|DTO 필수값만 검사한 뒤 요청의 studentId/taskId/cropId/reason 그대로 저장; 대상 ID 존재·소속 확인은 없음|200·목록|필수 ID·사유가 있으면 신고 저장|필수값 누락 거부; 미존재·다른 과제 ID 및 학생ID 위조는 서버 검증 없음|frontend/src/pages/StudentPage.jsx:1 / backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18; ALG-12; 정적 구현 확인|
|US-026 신고 조회·분류|신고 사유 필터|신고 목록에 crop·종 메타데이터 결합|신고 목록·이미지|EXPERT/ADMIN 조회|STUDENT GET403; 해결상태 워크플로는 없음|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18; ALG-12; 정적 구현 확인|
|US-027 라벨링 ZIP/VIA 내보내기|taskId|원본+crop+VIA2.0.10 ZIP; bbox→rect; final우선 gt차선; 종 metadata|ZIP 파일|실제 업로드 도말·파일 존재|진단평가/파일 누락 거부; AI pseudo만으로 정답 export 안 함|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/LabelingService.java:34; ALG-13; 정적 구현 확인|
|US-028 VIA 라벨 가져오기|VIA JSON _via_img_metadata·cropId·checkbox option|task별 cropId 검증·6클래스 순서 매핑·gt와final 갱신|updated 개수|기존 task 소속 crop|다른task cropId·형식오류 거부; import 경로 혼동행렬 backfill 미호출|frontend/src/components/AnalyticsFeedback.jsx:1 / backend/src/main/java/com/cell/platform/service/LabelingService.java:34; ALG-13; 정적 구현 확인|
|US-029 원본·crop 데이터 목록 관리|검색·라벨유무·도말/crop 탭|DB집계+파일 표시·선택·라벨 입출력 진입|도말/crop 목록|권한있는 전체목록|미로그인401·다른역할403; 파일 자체 삭제는 별도 아님|frontend/src/pages/AdminPage.jsx:1 / backend/src/main/java/com/cell/platform/service/AdminService.java:37; ALG-10; 정적 구현 확인|
|US-030 인증된 영상 조회·썸네일|/data/{originals\|crops\|thumbnails}/filename|Bearer 포함 fetch→blob; Spring resource handler; 썸네일 max320|영상·Canvas bbox|인증이 있으면 리소스 제공|401·없는파일404; Task별 파일 소유권 분리는 없음|frontend/src/components/AuthImage.jsx:1 / backend/src/main/java/com/cell/platform/config/WebConfig.java:11; ALG-03; 정적 구현 확인|
|US-031 영상 화면 조정|brightness,contrast,saturation|CSS/Canvas filter; 사용자·영상별 localStorage|밝기·대비·채도 조절 화면|기본100·밝기50~150·대비50~180·채도0~180|원본은 변경하지 않음; 초해상도·자동 염색보정 없음|frontend/src/components/ImageDisplayControls.jsx:1 / 프런트엔드 전용; ALG-14; 정적 구현 확인|
|US-032 AI 세포 탐지·crop·분류|multipart file|YOLO box→정수xyxy→OpenCV JPG crop→RGB256/정규화→DenseNet201 softmax argmax|total_detected,cells[crop_filename,bbox,prediction,confidence]|모델 로딩 완료·읽을 수 있는 영상|미로딩503; 잘못된영상 일반예외 가능; 탐지confidence/NMS 자체설정 없음|ai-server/app/services/pipeline.py:1 / backend/src/main/java/com/cell/platform/service/AiClientService.java:20; ALG-15; 정적 구현 확인|
|US-033 확정 학습 데이터 조회|인증 JWT|finalLabel 있는 crop 선택|TrainingDataResponse[]|확정라벨 존재|역할 제한이 URL에 없어 학생접근 가능성; 화면 호출연결 미확인|frontend/src/api/crops.js:1 / backend/src/main/java/com/cell/platform/service/CropService.java:23; ALG-16; 정적 구현 확인·주 UI 연결 미확인|
|US-034 AI 재학습·pseudo-label 확장|epochs,batch_size,learning_rate|목록 조회·최소10·crop존재검사 골격; 실제trainer·평가·가중치교체 없음|READY 더미 상태|완료 조건 미구현|localhost 백엔드주소·JWT없음; posterior도 TODO|ai-server/app/routers/retrain_router.py:1 / backend/src/main/java/com/cell/platform/service/PseudoLabelService.java:9; ALG-16; 부분 구현/계획|
|US-035 관리자 부가 게임·기록|mode,players[name,score]|iframe 게임→양수기록 저장·모드별 상위15·전체기록삭제|게임·leaderboard|ADMIN;유효점수|다른 role403·비양수 점수 제외; 빈 이름·mode/players null의 서비스 검증은 미확인|frontend/src/pages/BombGamePage.jsx:1 / backend/src/main/java/com/cell/platform/service/GameRecordService.java:18; ALG-17; 정적 구현 확인|
|US-036 독립 컬러화 계정·세션|username,password;로그인·로그아웃|Werkzeug hash·Flask signed cookie; CELL JWT와 별개|계정·세션·me|컬러화 로그인 상태|중복·오입력·미로그인 API거부|컬러화POC/templates/index.html:1 / ColorizerStore; ALG-18; 정적 구현 확인|
|US-037 DICOM 작업·업로드·복원·삭제|batch label,source_type;files·relative_paths·중복정책|원본저장·hash·pydicom읽기·계정소유권·512MB/10GB검사·영구메타|batch/items·작업목록|본인작업 조회·복원|다른계정 접근·quota·손상영상 오류; batch삭제는본인만|컬러화POC/static/app.js:1 / ColorizerStore; ALG-18; 정적 구현 확인|
|US-038 DICOM 파일명·촬영유형 필터|새파일명·원래이름복원·time60/counts200000 필터|이름검증·중복접미사; duration60000±500ms 또는 count200000 분류·기존메타 백필|수정이름·촬영유형·필터목록|지원촬영조건·본인파일|경로분리문자/허용안된이름 거부; 분류불가 미확인|컬러화POC/static/app.js:1 / ColorizerStore; ALG-18; 정적 구현 확인|
|US-039 DICOM 정규화·컬러맵·설정저장|normalization,colormap,gamma,threshold,window 등(현재 웹 렌더는 첫 프레임)|5정규화·13컬러맵·모달리티LUT·다중프레임·렌더·설정hash저장|흑백/컬러PNG·설정복원|지원설정·유효프레임|미지원맵·값범위·압축코덱 오류|컬러화POC/static/app.js:1 / dicom_processing; ALG-19; 정적 구현 확인|
|US-040 DICOM ROI 라벨·좌표 저장|polygon/ellipse,좌표,라벨 이름|좌표범위·최대500영역·다각형3~2000점·라벨32개/40자 검사; user+content hash저장|ROI·라벨목록·VIA JSON|본인영상·지원도형|잘못된좌표·영역초과·이름중복 거부|컬러화POC/static/roi_geometry.js:1 / ColorizerStore; ALG-20; 정적 구현 확인|
|US-041 DICOM 일괄 내보내기·취소|scope saved/all,format,preset|백그라운드 export job→진행률→ZIP·취소·TTL1h 정리|PNG/JPG ZIP 또는 VIA+기준PNG|본인job·렌더성공|다른계정job·취소·만료·파일오류|컬러화POC/static/app.js:1 / 컬러화 export 함수; ALG-21; 정적 구현 확인|

### H.3 설명용 AI·학생 처리 의사코드

```text
createAssignment(title, files, speciesIds, deadline):
  require future(deadline) or null
  require files not empty and speciesIds count matches when supplied
  assignment = saveAssignment(title, authenticatedExpert)
  for each file sequentially:
    original = saveOriginalAndThumbnail(file, species)
    result = POST AI /api/analyze(file)
    task = createTask(assignment, original, species, deadline)
    for cell in result.cells:
      addCrop(task, bbox, prediction -> pseudoLabel,
              confidence -> aiClassificationConfidence,
              aiBboxConfidence = null)
    save(task)
  return assignment response
  // DB transaction != filesystem rollback

submit(cropId, principal, label):
  crop = requiredCrop(cropId)
  scope = allTasksInAssignmentOrSingleTask(crop)
  require not locked(scope, principal)
  upsertAnswer(cropId, principal, validCellType(label))
  if correctLabel(crop) exists:
    subtract old answer's matrix entry when revising
    add current answer's matrix entry
  // no separate final-submit API

resolveCorrectLabel(crop, diagnostic):
  if finalLabel != null: return finalLabel
  if not diagnostic: return null
  return gtLabel or manifestLabel(cropFilename)

retrain(request):
  trainingRows = GET localhost:8080/api/training-data // JWT not provided
  require len >= 10 and crop files exist
  return distribution + status READY
  // trainer/evaluation/model promotion/reload absent
```

의사코드는 실제 함수의 순서를 설명한 문서화 표현이며 실행 스크립트가 아니다. 세부 경계/HTTP는 ALG/E 절을 우선한다.


### H.4 D06 양식 태스크 표(US/TK 동일 ID)

이 표의 담당자·종료일·완료%는 공식 기록 미확보로 전부 미정이다. 정적 구현 상태를 퍼센트로 바꾸지 않는다. D05와 같은 전체 후보82개이며 Sprint 미배정이다.

|US_ID|스토리 요약|TK_ID|태스크명|담당자|종료일|완료%|정적 상태·관련 모듈·근거|
|---|---|---|---|---|---|---|---|
|US-001|로그인|TK-001-01|계정 자격 검증|미정|미정|미정|정적 구현 확인; ALG-01; frontend/src/pages/LoginPage.jsx:1; C-124 backend/src/main/java/com/cell/platform/service/AuthService.java:26|
|US-001|로그인|TK-001-02|인증 API와 역할별 로그인 UI|미정|미정|미정|정적 구현 확인; ALG-01; frontend/src/pages/LoginPage.jsx:1; C-124 backend/src/main/java/com/cell/platform/service/AuthService.java:26|
|US-002|학생 회원가입|TK-002-01|명단 기반 가입 판정|미정|미정|미정|정적 구현 확인; ALG-01; frontend/src/pages/LoginPage.jsx:1; C-124 backend/src/main/java/com/cell/platform/service/AuthService.java:26|
|US-002|학생 회원가입|TK-002-02|가입 폼과 가입 검증·명단 연결|미정|미정|미정|정적 구현 확인; ALG-01; frontend/src/pages/LoginPage.jsx:1; C-124 backend/src/main/java/com/cell/platform/service/AuthService.java:26|
|US-003|로그아웃·다중 탭 계정 동기화|TK-003-01|브라우저 세션 전환|미정|미정|미정|정적 구현 확인; ALG-02; frontend/src/utils/authSession.js:1; C-003 backend/src/main/java/com/cell/platform/config/JwtAuthFilter.java:17|
|US-003|로그아웃·다중 탭 계정 동기화|TK-003-02|세션 유틸과 Axios·이미지·게임 요청 연결|미정|미정|미정|정적 구현 확인; ALG-02; frontend/src/utils/authSession.js:1; C-003 backend/src/main/java/com/cell/platform/config/JwtAuthFilter.java:17|
|US-004|서버·화면 권한 제어|TK-004-01|역할 접근 규칙|미정|미정|미정|정적 구현 확인; ALG-01; frontend/src/App.jsx:1; C-005 backend/src/main/java/com/cell/platform/config/SecurityConfig.java:24|
|US-004|서버·화면 권한 제어|TK-004-02|라우트 guard와 서버 URL matcher|미정|미정|미정|정적 구현 확인; ALG-01; frontend/src/App.jsx:1; C-005 backend/src/main/java/com/cell/platform/config/SecurityConfig.java:24|
|US-005|관리자 사용자 목록·생성|TK-005-01|관리자 계정 생성|미정|미정|미정|정적 구현 확인; ALG-10; frontend/src/pages/AdminPage.jsx:1; C-121 backend/src/main/java/com/cell/platform/service/AdminService.java:37|
|US-005|관리자 사용자 목록·생성|TK-005-02|사용자 관리 폼·API·해시 저장|미정|미정|미정|정적 구현 확인; ALG-10; frontend/src/pages/AdminPage.jsx:1; C-121 backend/src/main/java/com/cell/platform/service/AdminService.java:37|
|US-006|가입 승인·비활성화·삭제|TK-006-01|계정 상태 변경|미정|미정|미정|정적 구현 확인; ALG-10; frontend/src/pages/AdminPage.jsx:1; C-121 backend/src/main/java/com/cell/platform/service/AdminService.java:37|
|US-006|가입 승인·비활성화·삭제|TK-006-02|계정 상태·삭제 UI와 보호 로직|미정|미정|미정|정적 구현 확인; ALG-10; frontend/src/pages/AdminPage.jsx:1; C-121 backend/src/main/java/com/cell/platform/service/AdminService.java:37|
|US-007|학생 사전 명단 관리|TK-007-01|학생 명단 등록|미정|미정|미정|정적 구현 확인; ALG-10; frontend/src/pages/AdminPage.jsx:1; C-121 backend/src/main/java/com/cell/platform/service/AdminService.java:37|
|US-007|학생 사전 명단 관리|TK-007-02|명단 입력·중복 판정·가입 상태 연계|미정|미정|미정|정적 구현 확인; ALG-10; frontend/src/pages/AdminPage.jsx:1; C-121 backend/src/main/java/com/cell/platform/service/AdminService.java:37|
|US-008|동물 종 조회·표시|TK-008-01|종 메타데이터 제공|미정|미정|미정|정적 구현 확인; ALG-10; frontend/src/components/SpeciesBadge.jsx:1; C-123 backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24|
|US-008|동물 종 조회·표시|TK-008-02|종 응답 DTO와 공통 배지 연결|미정|미정|미정|정적 구현 확인; ALG-10; frontend/src/components/SpeciesBadge.jsx:1; C-123 backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24|
|US-009|종 생성·이름 수정|TK-009-01|동물 종 관리|미정|미정|미정|정적 구현 확인; ALG-10; frontend/src/components/SpeciesDataSettings.jsx:1; C-123 backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24|
|US-009|종 생성·이름 수정|TK-009-02|종 설정 폼과 종 검증·저장|미정|미정|미정|정적 구현 확인; ALG-10; frontend/src/components/SpeciesDataSettings.jsx:1; C-123 backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24|
|US-010|기존 도말의 종 변경|TK-010-01|도말 종 편집|미정|미정|미정|정적 구현 확인; ALG-10; frontend/src/components/TaskSpeciesEditor.jsx:1; C-123 backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24|
|US-010|기존 도말의 종 변경|TK-010-02|도말별 선택 UI와 Task 종 관계 갱신|미정|미정|미정|정적 구현 확인; ALG-10; frontend/src/components/TaskSpeciesEditor.jsx:1; C-123 backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java:24|
|US-011|단일 도말 업로드·AI 과제 생성|TK-011-01|단일 영상 처리|미정|미정|미정|정적 구현 확인·주 UI 연결 미확인; ALG-03; frontend/src/api/tasks.js:1; C-138 backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|US-011|단일 도말 업로드·AI 과제 생성|TK-011-02|업로드 API·파일 저장·AI 클라이언트 연계|미정|미정|미정|정적 구현 확인·주 UI 연결 미확인; ALG-03; frontend/src/api/tasks.js:1; C-138 backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|US-012|다중 도말 과제 생성|TK-012-01|묶음 과제 생성|미정|미정|미정|정적 구현 확인; ALG-03; frontend/src/pages/ExpertPage.jsx:1; C-138 backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|US-012|다중 도말 과제 생성|TK-012-02|다중 선택 UI와 Assignment·Task 생성 트랜잭션|미정|미정|미정|정적 구현 확인; ALG-03; frontend/src/pages/ExpertPage.jsx:1; C-138 backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|US-013|과제 조회·선택·진행률|TK-013-01|학습 목록·이어풀기|미정|미정|미정|정적 구현 확인; ALG-04; frontend/src/pages/StudentPage.jsx:1; C-138 backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|US-013|과제 조회·선택·진행률|TK-013-02|과제 그룹 UI와 crop·답안 조회|미정|미정|미정|정적 구현 확인; ALG-04; frontend/src/pages/StudentPage.jsx:1; C-138 backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|US-014|마감일 설정·변경|TK-014-01|마감 변경|미정|미정|미정|정적 구현 확인; ALG-04; frontend/src/components/AnalyticsFeedback.jsx:1; C-138 backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|US-014|마감일 설정·변경|TK-014-02|마감 편집 UI와 시간 검증·일괄 갱신|미정|미정|미정|정적 구현 확인; ALG-04; frontend/src/components/AnalyticsFeedback.jsx:1; C-138 backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|US-015|과제·도말 삭제|TK-015-01|과제 삭제|미정|미정|미정|정적 구현 확인; ALG-04; frontend/src/components/AnalyticsFeedback.jsx:1; C-138 backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|US-015|과제·도말 삭제|TK-015-02|삭제 확인 UI와 DB 관련 레코드 정리|미정|미정|미정|정적 구현 확인; ALG-04; frontend/src/components/AnalyticsFeedback.jsx:1; C-138 backend/src/main/java/com/cell/platform/service/TaskService.java:34|
|US-016|학생 세포 답안 저장·수정|TK-016-01|답안 upsert·잠금|미정|미정|미정|정적 구현 확인; ALG-05; frontend/src/pages/StudentPage.jsx:1; C-136 backend/src/main/java/com/cell/platform/service/SubmissionService.java:46|
|US-016|학생 세포 답안 저장·수정|TK-016-02|분류 버튼·이어풀기 API와 제출 로직|미정|미정|미정|정적 구현 확인; ALG-05; frontend/src/pages/StudentPage.jsx:1; C-136 backend/src/main/java/com/cell/platform/service/SubmissionService.java:46|
|US-017|학생 결과·오답 복습|TK-017-01|결과 공개·복습|미정|미정|미정|정적 구현 확인; ALG-06; frontend/src/components/StudentReviewPanel.jsx:1; C-136 backend/src/main/java/com/cell/platform/service/SubmissionService.java:46|
|US-017|학생 결과·오답 복습|TK-017-02|학습결과 UI와 채점·결과 공개 조건|미정|미정|미정|정적 구현 확인; ALG-06; frontend/src/components/StudentReviewPanel.jsx:1; C-136 backend/src/main/java/com/cell/platform/service/SubmissionService.java:46|
|US-018|전문가 정답 확정·재수정|TK-018-01|GT 재확정|미정|미정|미정|정적 구현 확인; ALG-07; frontend/src/components/AnalyticsFeedback.jsx:1; C-126 backend/src/main/java/com/cell/platform/service/CropService.java:23|
|US-018|전문가 정답 확정·재수정|TK-018-02|수정 UI·정답 저장·혼동행렬 소급 갱신|미정|미정|미정|정적 구현 확인; ALG-07; frontend/src/components/AnalyticsFeedback.jsx:1; C-126 backend/src/main/java/com/cell/platform/service/CropService.java:23|
|US-019|세포 이동·GT 완료 표시|TK-019-01|GT 진행률·내비게이션|미정|미정|미정|정적 구현 확인; ALG-07; frontend/src/components/AnalyticsFeedback.jsx:1; C-134 backend/src/main/java/com/cell/platform/service/StatsService.java:21|
|US-019|세포 이동·GT 완료 표시|TK-019-02|세포 목록·이동 버튼·도말/과제 배지|미정|미정|미정|정적 구현 확인; ALG-07; frontend/src/components/AnalyticsFeedback.jsx:1; C-134 backend/src/main/java/com/cell/platform/service/StatsService.java:21|
|US-020|세포 통계·학생별 선택자|TK-020-01|투표·정답률 집계|미정|미정|미정|정적 구현 확인; ALG-08; frontend/src/components/AnalyticsFeedback.jsx:1; C-134 backend/src/main/java/com/cell/platform/service/StatsService.java:21|
|US-020|세포 통계·학생별 선택자|TK-020-02|공통 분석 UI와 통계 DTO 집계|미정|미정|미정|정적 구현 확인; ALG-08; frontend/src/components/AnalyticsFeedback.jsx:1; C-134 backend/src/main/java/com/cell/platform/service/StatsService.java:21|
|US-021|도말별 학생 응답 비교표|TK-021-01|학생 비교표 계산|미정|미정|미정|정적 구현 확인; ALG-08; frontend/src/components/StudentResponsesPanel.jsx:1; C-134 backend/src/main/java/com/cell/platform/service/StatsService.java:21|
|US-021|도말별 학생 응답 비교표|TK-021-02|학생응답 유틸·비교표 컴포넌트|미정|미정|미정|정적 구현 확인; ALG-08; frontend/src/components/StudentResponsesPanel.jsx:1; C-134 backend/src/main/java/com/cell/platform/service/StatsService.java:21|
|US-022|학생별 학습 이력·세포별 결과|TK-022-01|학습 이력 요약|미정|미정|미정|정적 구현 확인; ALG-09; frontend/src/components/StudentManagement.jsx:1; C-135 backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:24|
|US-022|학생별 학습 이력·세포별 결과|TK-022-02|학생 관리 UI와 학습 이력 집계 서비스|미정|미정|미정|정적 구현 확인; ALG-09; frontend/src/components/StudentManagement.jsx:1; C-135 backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java:24|
|US-023|진단·누적 혼동행렬|TK-023-01|혼동행렬 집계|미정|미정|미정|정적 구현 확인; ALG-06; frontend/src/components/StudentManagement.jsx:1; C-136 backend/src/main/java/com/cell/platform/service/SubmissionService.java:46|
|US-023|진단·누적 혼동행렬|TK-023-02|학생별·전체 누적 행렬 UI와 집계|미정|미정|미정|정적 구현 확인; ALG-06; frontend/src/components/StudentManagement.jsx:1; C-136 backend/src/main/java/com/cell/platform/service/SubmissionService.java:46|
|US-024|진단평가 문제 생성|TK-024-01|진단 표본 추출|미정|미정|미정|정적 구현 확인; ALG-11; frontend/src/pages/ExpertPage.jsx:1; C-129 backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:25|
|US-024|진단평가 문제 생성|TK-024-02|분포 입력 UI·manifest 파싱·표본 저장|미정|미정|미정|정적 구현 확인; ALG-11; frontend/src/pages/ExpertPage.jsx:1; C-129 backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java:25|
|US-025|문제 세포 신고|TK-025-01|문제 신고 생성|미정|미정|미정|정적 구현 확인; ALG-12; frontend/src/pages/StudentPage.jsx:1; C-125 backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18|
|US-025|문제 세포 신고|TK-025-02|신고 모달과 신고 저장 API|미정|미정|미정|정적 구현 확인; ALG-12; frontend/src/pages/StudentPage.jsx:1; C-125 backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18|
|US-026|신고 조회·분류|TK-026-01|신고 검토|미정|미정|미정|정적 구현 확인; ALG-12; frontend/src/components/AnalyticsFeedback.jsx:1; C-125 backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18|
|US-026|신고 조회·분류|TK-026-02|신고 목록·필터와 응답 DTO|미정|미정|미정|정적 구현 확인; ALG-12; frontend/src/components/AnalyticsFeedback.jsx:1; C-125 backend/src/main/java/com/cell/platform/service/CropIssueReportService.java:18|
|US-027|라벨링 ZIP/VIA 내보내기|TK-027-01|VIA export|미정|미정|미정|정적 구현 확인; ALG-13; frontend/src/components/AnalyticsFeedback.jsx:1; C-132 backend/src/main/java/com/cell/platform/service/LabelingService.java:34|
|US-027|라벨링 ZIP/VIA 내보내기|TK-027-02|ZIP 다운로드 UI·VIA 좌표/클래스 매핑|미정|미정|미정|정적 구현 확인; ALG-13; frontend/src/components/AnalyticsFeedback.jsx:1; C-132 backend/src/main/java/com/cell/platform/service/LabelingService.java:34|
|US-028|VIA 라벨 가져오기|TK-028-01|VIA import|미정|미정|미정|정적 구현 확인; ALG-13; frontend/src/components/AnalyticsFeedback.jsx:1; C-132 backend/src/main/java/com/cell/platform/service/LabelingService.java:34|
|US-028|VIA 라벨 가져오기|TK-028-02|JSON 선택 UI·cropId 매핑·정답 갱신|미정|미정|미정|정적 구현 확인; ALG-13; frontend/src/components/AnalyticsFeedback.jsx:1; C-132 backend/src/main/java/com/cell/platform/service/LabelingService.java:34|
|US-029|원본·crop 데이터 목록 관리|TK-029-01|관리자 영상 목록|미정|미정|미정|정적 구현 확인; ALG-10; frontend/src/pages/AdminPage.jsx:1; C-121 backend/src/main/java/com/cell/platform/service/AdminService.java:37|
|US-029|원본·crop 데이터 목록 관리|TK-029-02|영상 목록·검색 UI와 집계 DTO|미정|미정|미정|정적 구현 확인; ALG-10; frontend/src/pages/AdminPage.jsx:1; C-121 backend/src/main/java/com/cell/platform/service/AdminService.java:37|
|US-030|인증된 영상 조회·썸네일|TK-030-01|영상 접근·축소|미정|미정|미정|정적 구현 확인; ALG-03; frontend/src/components/AuthImage.jsx:1; C-007 backend/src/main/java/com/cell/platform/config/WebConfig.java:11|
|US-030|인증된 영상 조회·썸네일|TK-030-02|인증 이미지 컴포넌트와 리소스·썸네일 설정|미정|미정|미정|정적 구현 확인; ALG-03; frontend/src/components/AuthImage.jsx:1; C-007 backend/src/main/java/com/cell/platform/config/WebConfig.java:11|
|US-031|영상 화면 조정|TK-031-01|영상 표시 필터|미정|미정|미정|정적 구현 확인; ALG-14; frontend/src/components/ImageDisplayControls.jsx:1; 프런트엔드 전용|
|US-031|영상 화면 조정|TK-031-02|공통 화면조절 hook과 Canvas/CSS 적용|미정|미정|미정|정적 구현 확인; ALG-14; frontend/src/components/ImageDisplayControls.jsx:1; 프런트엔드 전용|
|US-032|AI 세포 탐지·crop·분류|TK-032-01|AI 추론 파이프라인|미정|미정|미정|정적 구현 확인; ALG-15; ai-server/app/services/pipeline.py:1; C-122 backend/src/main/java/com/cell/platform/service/AiClientService.java:20|
|US-032|AI 세포 탐지·crop·분류|TK-032-02|탐지·crop·분류와 응답 계약|미정|미정|미정|정적 구현 확인; ALG-15; ai-server/app/services/pipeline.py:1; C-122 backend/src/main/java/com/cell/platform/service/AiClientService.java:20|
|US-033|확정 학습 데이터 조회|TK-033-01|확정 라벨 추출|미정|미정|미정|정적 구현 확인·주 UI 연결 미확인; ALG-16; frontend/src/api/crops.js:1; C-126 backend/src/main/java/com/cell/platform/service/CropService.java:23|
|US-033|확정 학습 데이터 조회|TK-033-02|학습 데이터 DTO·조회 API|미정|미정|미정|정적 구현 확인·주 UI 연결 미확인; ALG-16; frontend/src/api/crops.js:1; C-126 backend/src/main/java/com/cell/platform/service/CropService.java:23|
|US-034|AI 재학습·pseudo-label 확장|TK-034-01|재학습 골격 검토|미정|미정|미정|부분 구현/계획; ALG-16; ai-server/app/routers/retrain_router.py:1; C-133 backend/src/main/java/com/cell/platform/service/PseudoLabelService.java:9|
|US-034|AI 재학습·pseudo-label 확장|TK-034-02|기존 TODO와 미연결 경계 기록|미정|미정|미정|부분 구현/계획; ALG-16; ai-server/app/routers/retrain_router.py:1; C-133 backend/src/main/java/com/cell/platform/service/PseudoLabelService.java:9|
|US-035|관리자 부가 게임·기록|TK-035-01|부가 게임 기록|미정|미정|미정|정적 구현 확인; ALG-17; frontend/src/pages/BombGamePage.jsx:1; C-131 backend/src/main/java/com/cell/platform/service/GameRecordService.java:18|
|US-035|관리자 부가 게임·기록|TK-035-02|게임iframe·인증연결·순위 API|미정|미정|미정|정적 구현 확인; ALG-17; frontend/src/pages/BombGamePage.jsx:1; C-131 backend/src/main/java/com/cell/platform/service/GameRecordService.java:18|
|US-036|독립 컬러화 계정·세션|TK-036-01|컬러화 계정|미정|미정|미정|정적 구현 확인; ALG-18; 컬러화POC/templates/index.html:1; ColorizerStore|
|US-036|독립 컬러화 계정·세션|TK-036-02|별도 인증 UI·세션·SQLite 사용자|미정|미정|미정|정적 구현 확인; ALG-18; 컬러화POC/templates/index.html:1; ColorizerStore|
|US-037|DICOM 작업·업로드·복원·삭제|TK-037-01|DICOM 영구 작업|미정|미정|미정|정적 구현 확인; ALG-18; 컬러화POC/static/app.js:1; ColorizerStore|
|US-037|DICOM 작업·업로드·복원·삭제|TK-037-02|배치 UI·파일검사·SQLite 영구 저장|미정|미정|미정|정적 구현 확인; ALG-18; 컬러화POC/static/app.js:1; ColorizerStore|
|US-038|DICOM 파일명·촬영유형 필터|TK-038-01|파일명·촬영조건|미정|미정|미정|정적 구현 확인; ALG-18; 컬러화POC/static/app.js:1; ColorizerStore|
|US-038|DICOM 파일명·촬영유형 필터|TK-038-02|촬영메타 파싱·백필·필터·이름편집|미정|미정|미정|정적 구현 확인; ALG-18; 컬러화POC/static/app.js:1; ColorizerStore|
|US-039|DICOM 정규화·컬러맵·설정저장|TK-039-01|DICOM 시각화|미정|미정|미정|정적 구현 확인; ALG-19; 컬러화POC/static/app.js:1; dicom_processing|
|US-039|DICOM 정규화·컬러맵·설정저장|TK-039-02|정규화·컬러맵 UI·픽셀처리·설정저장|미정|미정|미정|정적 구현 확인; ALG-19; 컬러화POC/static/app.js:1; dicom_processing|
|US-040|DICOM ROI 라벨·좌표 저장|TK-040-01|ROI 검증|미정|미정|미정|정적 구현 확인; ALG-20; 컬러화POC/static/roi_geometry.js:1; ColorizerStore|
|US-040|DICOM ROI 라벨·좌표 저장|TK-040-02|ROI편집기·기하유틸·좌표/라벨 저장|미정|미정|미정|정적 구현 확인; ALG-20; 컬러화POC/static/roi_geometry.js:1; ColorizerStore|
|US-041|DICOM 일괄 내보내기·취소|TK-041-01|내보내기 작업|미정|미정|미정|정적 구현 확인; ALG-21; 컬러화POC/static/app.js:1; 컬러화 export 함수|
|US-041|DICOM 일괄 내보내기·취소|TK-041-02|export UI·작업큐·ZIP·취소 처리|미정|미정|미정|정적 구현 확인; ALG-21; 컬러화POC/static/app.js:1; 컬러화 export 함수|

## I. 정량적 소스 집계·목록 완전성

집계는 자체 작성 source만 대상으로 물리줄/빈줄제외줄을 구분한다. node_modules/build/dist/.gradle/venv/__pycache__/실영상/weights/DB dump/ZIP 내용은 LOC에서 제외. comment는 물리줄에 포함하며 정교한 SLOC나 개발공수로 바꾸지 않는다. 아래 file 수는 언어/설정 범위가 아니라 code extension(.java/.js/.jsx/.py/.html/.css)의 명시 집계다.

|범위|파일|물리줄|빈줄제외|
|---|---|---|---|
|ai-server|14|629|502|
|backend main|123|6146|5210|
|backend tests|30|2174|1783|
|frontend/mock|2|816|764|
|frontend/src|51|6499|5991|
|load_test|2|291|251|
|colorizer production|7|5701|5202|
|colorizer tests|2|833|764|
|합계|231|23089|20467|

세부 검증: 운영 Java파일123·타입139(중첩포함), 시험 Java파일30·타입81; Controller13파일·Service16파일·Repository20파일(domain5+infra15)·Entity10파일·DTO36파일(중첩record포함타입50). 전용 React page5파일·components 폴더11개JSX(하위NavBar포함)·실제route5/wildcard2·API래퍼46. Python 함수/클래스와 F 모듈은 B절 전체 목록. AI모델2개(Detector/Classifier), 분류클래스6개, detector자체학습클래스수는weights metadata를안읽어미확인. MySQL테이블10/컬럼61/FK3,컬러화테이블7/FK6.

### I.1 소스 파일별 LOC·무변경 검증 기준 SHA256

이 표는 선언이 없는 __init__/상수/스타일/HTML/fixture도 목록에서 빠뜨리지 않기 위한 전체 코드 파일 지도다. 파일 내용/학생데이터는 복사하지 않고 hash만 보관한다. 결과 파일 자체·기존 문서는 LOC에서 제외했다.

|상대 경로|물리줄|빈줄제외|SHA256|
|---|---|---|---|
|ai-server/app/__init__.py|0|0|e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855|
|ai-server/app/config.py|28|21|3cf6d8d213fc1aa974921ac559df1b9a47a112994f02a34a2e4b2df7f9261921|
|ai-server/app/models/__init__.py|20|15|3d46e96a48520984dce47725d637272881747fc56793e9704660e18b785f6720|
|ai-server/app/routers/__init__.py|0|0|e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855|
|ai-server/app/routers/analyze_router.py|34|25|440d8eb846b8b5d1b84d91679faea424c46d7a7a10e9e4ae1572dc34a83205f0|
|ai-server/app/routers/retrain_router.py|81|63|fc31c71786495104516da27d166cfeefaf9e7a950dc0d99a4585ce7291512faa|
|ai-server/app/services/__init__.py|0|0|e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855|
|ai-server/app/services/classifier.py|49|40|c49c8cf49b2a48695126b7a0945dae0858b290246938580b7780f6a2452781dc|
|ai-server/app/services/detector.py|56|45|563186853be5a75df2f1401e17abccf6410cb45f98c6e90bd2a50bb4c7405813|
|ai-server/app/services/model_loader.py|48|40|6c800216146810a5166b46fef9143e27c53376ce112d87ccabfa9ec98c0c8c36|
|ai-server/app/services/pipeline.py|26|22|e06af7c7da1073b8239dcbd5046c2983b03ab79304736eaeb199370d1bc08ebb|
|ai-server/main.py|26|21|93538601008f0bedf626ec787a22c4f59809efee8f79898fac9449ebff943208|
|ai-server/tools/build_diagnostic_gt_review.py|110|87|51d4c223ff5a03d0f27c855e85504cc2fdffa5073eed45439103a48193304b27|
|ai-server/tools/prepare_diagnostic_gt_dataset.py|151|123|5aea2f0f1121fedf04ad29c52a9981212c9e381a8fcc25946a80ab9876e9639c|
|backend/src/main/java/com/cell/platform/CellApplication.java|12|9|d2463cd488828db3d1e2db04abf6d2d796f55835450dc23e9329b262969869cb|
|backend/src/main/java/com/cell/platform/config/AdminSeedRunner.java|44|36|c92cd982e30849201b81ef5a5998f34e2b26b660bcb516c1b0bfb4a5ff98d2b4|
|backend/src/main/java/com/cell/platform/config/JwtAuthFilter.java|49|40|95d95352ac1263843ea09456c25847511b804e1c94249ceb5cbd87435a24b949|
|backend/src/main/java/com/cell/platform/config/JwtTokenProvider.java|57|47|e7415aaebca1d8034be06e274f0ad9659b3dc30a69bbb08ccad0323c8a915bc0|
|backend/src/main/java/com/cell/platform/config/SecurityConfig.java|93|83|a177cd81ceb91355ed615fcf5e0e84e54212554f5ab319c6debefcf56cc5d222|
|backend/src/main/java/com/cell/platform/config/ThumbnailBackfillRunner.java|75|66|2e4ffef4039ea9c1a04685406fa92f4c2e465a18ee24f35f6801cd0ca1a45c99|
|backend/src/main/java/com/cell/platform/config/WebConfig.java|65|53|3c429c1969cdca39a9b05ee3c5e67cea3c456a12638980380df85d8b67c3f641|
|backend/src/main/java/com/cell/platform/controller/AdminController.java|75|63|801369bcb3a2c16562ad2d1fdc7f4582fb216cea04b98de8049d78c56f6282d4|
|backend/src/main/java/com/cell/platform/controller/AnimalSpeciesController.java|46|39|03245686cded7482e240d0711d678d939f7d338466ac6bf75b569fa0fdbfa8eb|
|backend/src/main/java/com/cell/platform/controller/AssignmentController.java|65|55|67adb9d93984ab10b6f1c8eb754a78df622a7c58935a2401c1ead385d6c0e8fb|
|backend/src/main/java/com/cell/platform/controller/AuthController.java|29|24|b861a907148aef909ad1f293eaf3a5011e6dc91fded2df660c8aa7c90d479928|
|backend/src/main/java/com/cell/platform/controller/CropController.java|52|43|315dd39fe78bf488347f5cc582a7185993e81d5d188fb2295b7de1e93a963bae|
|backend/src/main/java/com/cell/platform/controller/CropIssueReportController.java|31|25|2bc0eb2e23cebad9d46cc3dec3a3bfe6b2b7bc788cc7f5aff9409aafe3588c46|
|backend/src/main/java/com/cell/platform/controller/GameRecordController.java|36|29|f09e3cb054867c450d1a531ad5879fc0edaa4b445665b136a60231f590d519a0|
|backend/src/main/java/com/cell/platform/controller/LabelingController.java|43|37|d0aadd7f0069bb9126a2e1e9fea18c3257cedc36cd651b358cfdd8c537dc4079|
|backend/src/main/java/com/cell/platform/controller/StatsController.java|27|21|429afec0ef4abf50212b985fd6dcc8ba72fc8fe89a49719889e5646febc35ef5|
|backend/src/main/java/com/cell/platform/controller/StudentAnalyticsController.java|25|21|84e67caca9a990e96fabbd24873eb236e62fbfab677e9cf45d39f1e3d49f2a1f|
|backend/src/main/java/com/cell/platform/controller/StudentReviewController.java|26|22|7e905692cd14e2a47f5709e9a6bfea932404b2ca29e2d259803f8d4b36ff8a75|
|backend/src/main/java/com/cell/platform/controller/SubmissionController.java|105|92|3cdb7843a320dd1fcad227af4b14bf0866c276e1b49bb82fa407e85f490b599d|
|backend/src/main/java/com/cell/platform/controller/TaskController.java|103|88|42a99811505c81f05843a7c820b1e3c40970b27e780c945e0124857bba797305|
|backend/src/main/java/com/cell/platform/domain/crop/CellType.java|5|4|8995d555e1681c6e113ae7794885fceeb24bae47a1fcdc1aa972eb3463e4feef|
|backend/src/main/java/com/cell/platform/domain/crop/Crop.java|58|53|fa1b772d46ddf815dfeaac74c8134cf96c390ff07599a46959c95c9d8cb6666d|
|backend/src/main/java/com/cell/platform/domain/crop/CropRepository.java|21|12|eee6b77d0eacac93e646f3a59c09e0ca243d32b3b3e02af6607beaa0f2171df9|
|backend/src/main/java/com/cell/platform/domain/matrix/ConfusionMatrixRepository.java|14|11|e08455ca43cc981f67bbed1764757979cbb50629f9fcb3b40347afe4c10dd62c|
|backend/src/main/java/com/cell/platform/domain/submission/Submission.java|34|29|257ce3a11ee9cd337b77cbe433f6f54e8547c7edc9f48ee917d2b83fb54f6447|
|backend/src/main/java/com/cell/platform/domain/submission/SubmissionRepository.java|20|12|5f34cd58f05e7865bf0aab6b605e6b84015851a32e3cf60a0ae8ea393518d59f|
|backend/src/main/java/com/cell/platform/domain/task/Task.java|89|80|56f81c37852043340ebc68f7da4a02f1cf754873cfd41fa6a25b0c265e3cbf25|
|backend/src/main/java/com/cell/platform/domain/task/TaskRepository.java|24|14|eda67ff0877d34aaae4f13b591ca872df71533b40b7339ab9e619783beebe8fd|
|backend/src/main/java/com/cell/platform/domain/task/TaskStatus.java|5|4|6c0654f53852a787434fbe9ca61472c54e6e853627bab3d388ec7fb0cdda0ac4|
|backend/src/main/java/com/cell/platform/domain/user/Role.java|17|14|b48380220f118e79fbd3b7972b162514e5a65bed8d90d23075cd6bb0fb441199|
|backend/src/main/java/com/cell/platform/domain/user/User.java|49|41|1c0695ec53e4f0420ee020adb96d3179565e8cf85fa75fb5f73c78900ec91d89|
|backend/src/main/java/com/cell/platform/domain/user/UserRepository.java|19|11|5a54ebbcc4b8f9550978157a07a1f32aa017992edf86858e89e209e3ee20eb9b|
|backend/src/main/java/com/cell/platform/domain/user/UserStatus.java|8|7|182aa13c7bc3b4c37d170126c456ef3ae131a0188f23d4f26edd5d4ee8e11a40|
|backend/src/main/java/com/cell/platform/dto/request/AdminStatusRequest.java|8|6|c2921950c0b1b62351d00d013241f97578e965123c6a58a3081ccb08063caf26|
|backend/src/main/java/com/cell/platform/dto/request/AnimalSpeciesNameRequest.java|11|9|96371040b110d35c90fda6bfdea3dbb9154b4c02b092ab278ca3a99a637a01b9|
|backend/src/main/java/com/cell/platform/dto/request/ConfirmRequest.java|15|13|9d9dea330cb286829b0e86396ea6ffad60121b0761d69475d81b349050deacf4|
|backend/src/main/java/com/cell/platform/dto/request/CropIssueReportRequest.java|30|26|3bb3a3fc271857e9c84243ae7f3979624e925ef1a0f667b91bfbb05d5441b0f9|
|backend/src/main/java/com/cell/platform/dto/request/DeadlineUpdateRequest.java|8|6|cc62524d64b20bb17c6ce19cef1f47f814a5a17344f90a87663680c0cc7b8f2c|
|backend/src/main/java/com/cell/platform/dto/request/DiagnosticTaskCreateRequest.java|16|12|5afd931e34fcb692793ebddf20cff23555fbc6706647346599d694babc09f804|
|backend/src/main/java/com/cell/platform/dto/request/GameRecordRequest.java|7|5|586114f3f7adfdf5bf095371da6f29e9aeaa026a9a35985ad898e4c92d66200e|
|backend/src/main/java/com/cell/platform/dto/request/LabelingImportRequest.java|15|13|1c2d3680131dad6dd90cc78a203e53a23248757d3a13bc286172eb5e32c56e0b|
|backend/src/main/java/com/cell/platform/dto/request/LoginRequest.java|21|18|98448e8950ec67883d30398826749d6a96aeded7183a1d039fc7e95e8127bbdc|
|backend/src/main/java/com/cell/platform/dto/request/RegisterRequest.java|20|17|47f2e5cf5ab2fbc100f011b1cc9cd58c305b5165a7faf31a6d578aeacee047e3|
|backend/src/main/java/com/cell/platform/dto/request/SpeciesUpdateRequest.java|9|7|be9b9502be740d1fb7bf868e5049ad4b59b85625aa935be63205677fabfee8bb|
|backend/src/main/java/com/cell/platform/dto/request/StudentRosterRequest.java|8|6|43848698dc559cb0a57b81e47b0b3827f796e85ec59a9d39e56fafa7b2477ffe|
|backend/src/main/java/com/cell/platform/dto/request/SubmissionRequest.java|23|20|cf7e467760c31f7983aba5e647bbadb918d59ffc9ba6de094a50d9406626a2de|
|backend/src/main/java/com/cell/platform/dto/response/AdminCropResponse.java|16|15|a568a10180ad1127dc705505ef3d4b90b51e7d8d5967ddb8b41dab10a4f27c84|
|backend/src/main/java/com/cell/platform/dto/response/AdminSmearResponse.java|17|15|cdd0c1d9f0478c744ffe842a672151e35b8ad27c98b89db115a3ef74b7592282|
|backend/src/main/java/com/cell/platform/dto/response/AiAnalysisResponse.java|27|21|9b4bce061d2bb3cb27674a5dc129fd5f8e0a361d9bb361990bdbe5677303aefe|
|backend/src/main/java/com/cell/platform/dto/response/AnimalSpeciesResponse.java|19|17|4ca42d4c8a47f00de81b309d3fa80d2e0f93e8f1bae2ae76542d14bd8cdd2403|
|backend/src/main/java/com/cell/platform/dto/response/AssignmentResponse.java|13|11|648f4b450d0c68168a9d2806767d9c8636e64223fb0e29ac5b31d59bdb669521|
|backend/src/main/java/com/cell/platform/dto/response/CropIssueReportResponse.java|32|29|e0320fc38071f3ccc9af8c46d5a4123f9b2d68754fe2cd92291f42686603e039|
|backend/src/main/java/com/cell/platform/dto/response/CropResponse.java|47|43|807b957256b12f3454313af1de7aff89ff49dee20f68c57983cb279d78ad5679|
|backend/src/main/java/com/cell/platform/dto/response/CropStatsResponse.java|36|34|847256bef063e51f5a349a71147cfe145da8076d131ec4abbdbcc77a88b597bf|
|backend/src/main/java/com/cell/platform/dto/response/DiagnosticPoolStatsResponse.java|15|13|cc62c2ca2c24ac4530cd5e4f67c51bf8b1e2607234ac27607faed79ec4cc62d0|
|backend/src/main/java/com/cell/platform/dto/response/DiagnosticStudentMatrixResponse.java|24|20|d1a7d25bd39fbd3cc6ad789d171505a86a83684c0ef0ed6efe581acc5a52bd0b|
|backend/src/main/java/com/cell/platform/dto/response/GameRecordResponse.java|3|2|fde9782c5985a20b3a2cc8eb1de05c2be91eaaae12bdfc8c31a6d5f0c91cfdb6|
|backend/src/main/java/com/cell/platform/dto/response/LabelingManifestResponse.java|24|22|316957c5f3c37649bb01f2892ddce8e5d01dea627e3af866e96737490147b896|
|backend/src/main/java/com/cell/platform/dto/response/LoginResponse.java|17|15|ea0ed19cd3f0c0bd0febd2983e7ca07433bfbb0a6836469b018434dec0027e49|
|backend/src/main/java/com/cell/platform/dto/response/MyResultsResponse.java|28|26|65a95d3a2583883ea1dbccae80e82478477e8965d33f2908fa8b133816af6689|
|backend/src/main/java/com/cell/platform/dto/response/RegisterResponse.java|14|12|95a0df24f54d51b2818ca106c6122606141aff73d8704cf0fbb6203ed0932c54|
|backend/src/main/java/com/cell/platform/dto/response/RosterImportResponse.java|7|6|20bea180a5ba5d7c936d8468f77f09c6d9aaae5dfff19432558ef9d5e2ecea81|
|backend/src/main/java/com/cell/platform/dto/response/StudentLearningResponse.java|21|15|3ce621405a8279c0fd8633c75aee16cbeab55f1fd57c3fa7fd505f42534869ea|
|backend/src/main/java/com/cell/platform/dto/response/StudentReviewResponse.java|41|38|b8cb97b0bd660943ec54181a13d20a5cc623c4aea9a11eacd03b60a2633fcda1|
|backend/src/main/java/com/cell/platform/dto/response/StudentRosterResponse.java|23|20|5f086bf5694c189c320d27864cf57edb88d482c490a643f5c239b17cfa6e339e|
|backend/src/main/java/com/cell/platform/dto/response/TaskResponse.java|43|40|fa983854f94e4a89c76d7e57c0ea78134db0302999ff3bc04c70b8be03f035b7|
|backend/src/main/java/com/cell/platform/dto/response/TaskUploadResponse.java|26|23|37ead2e199f07024f523490e87c2142e59d1c404f653e8a974f5bc62a9a80923|
|backend/src/main/java/com/cell/platform/dto/response/TrainingDataResponse.java|23|20|e8c20edcc5529c293468f038e8bdaa076824831152dbbba22dc0c433840b7acc|
|backend/src/main/java/com/cell/platform/dto/response/UserResponse.java|12|10|6646d8d3171dbbca286a3a67a18990d3a454a08386b65bf9916d15129143a487|
|backend/src/main/java/com/cell/platform/entity/AnimalSpeciesEntity.java|69|56|2a778a5ce24412bff607a46de9297bc59c4017576fa225a86d53ba047fa23ea5|
|backend/src/main/java/com/cell/platform/entity/AssignmentEntity.java|35|27|960cd41fa9d8c0c64cc313b2d9e38b3a5577f0a8f79afbca8156ff3117d2ea7a|
|backend/src/main/java/com/cell/platform/entity/CropEntity.java|78|61|e3b0d63e6cfcf75bfcbdde34eb6a63cd371bab4026301cb3d75cf09ca6395075|
|backend/src/main/java/com/cell/platform/entity/CropIssueReportEntity.java|44|34|ce217ed752c5efc06dff97d87b7e436d5456a59aaa1c48fc335b47a1ea53df6d|
|backend/src/main/java/com/cell/platform/entity/GameRecordEntity.java|30|23|eead5a6692138fce09356680c8b38874458d99806aa408c22b8f23d51e89eb37|
|backend/src/main/java/com/cell/platform/entity/StudentConfusionMatrixEntity.java|45|36|9650054ecde90bc917a1e4adbda1ba6c9f4c566a76d6091a77655e8177f04043|
|backend/src/main/java/com/cell/platform/entity/StudentRosterEntity.java|42|31|9d99d046e6f0d4d372f50ad89e905c6fb2f4d05aa8d65aa747f0fc9e26808a0e|
|backend/src/main/java/com/cell/platform/entity/SubmissionEntity.java|50|40|af71ead90384b718f15034cffea384bad213698fd4022df3fad83df1ec693cb7|
|backend/src/main/java/com/cell/platform/entity/TaskEntity.java|80|63|0180578fef66fa3cfa27fdbc364bb5c8a646742feb829720dc8168567456da11|
|backend/src/main/java/com/cell/platform/entity/UserEntity.java|59|47|ee59a93743fb77df8b3e1703538d0ec6cca49592296a52a14f912dfbe9cf8a87|
|backend/src/main/java/com/cell/platform/exception/AuthenticationException.java|8|6|bd19b8bfa9982a24058e53d6254cc6e0e3d9b9cfd707219cf07f02bd4c2734b1|
|backend/src/main/java/com/cell/platform/exception/AuthorizationException.java|8|6|34c58413a55afa114a2b1cca17890878daa50e4e2f13ec89ba24a14f2a4cb46b|
|backend/src/main/java/com/cell/platform/exception/BadRequestException.java|10|7|a53f41c6bdb090b7dc6a4b2aed22d39105d402d131afec96299dca82041362ce|
|backend/src/main/java/com/cell/platform/exception/BusinessException.java|21|16|2a3e18fbb5d81cbad3f8fc07687c285d6d8de7420121d14cb6681b144c57a435|
|backend/src/main/java/com/cell/platform/exception/CustomException.java|15|11|6e0a0ef93fe5f635feef49a033f4fc0f60e64c919e93e60dccab39c358a658a1|
|backend/src/main/java/com/cell/platform/exception/DuplicateUsernameException.java|8|6|dc4f68e3b7e791f752a20ab1ac45cfab49c8d9ad08767826a0b7030f3e68dd7c|
|backend/src/main/java/com/cell/platform/exception/EntityNotFoundException.java|8|6|3b78bcfd0667e1848439f9b810fa1792bc0c13e92e9c8dac90bfe83f81bfe63a|
|backend/src/main/java/com/cell/platform/exception/ErrorCode.java|46|35|ef122966434085f73539b4f4403f0d5ac937b9d07da7254a9fd82f438810c48c|
|backend/src/main/java/com/cell/platform/exception/ErrorResponse.java|10|9|fac4b3e8cd5c3a282752a9a000cd3fd9013240005a8048ba2976d39007a92e88|
|backend/src/main/java/com/cell/platform/exception/GlobalExceptionHandler.java|66|57|520aea4e17c92977d96b0611ae00d9fe71f958899d1ba934358712112246cd0f|
|backend/src/main/java/com/cell/platform/exception/InfraStructureException.java|8|6|538178fdb05f9a024ef179abb7bac9328e09863ca43126e31a32298a89faf348|
|backend/src/main/java/com/cell/platform/exception/NotFoundException.java|10|7|efd2792af373c348472e8d3e547f167149d35ed8eb457c877726e6f9a4178e40|
|backend/src/main/java/com/cell/platform/infra/assignment/AssignmentJpaRepository.java|9|7|cab70a79ac6b89f7076d9c15af7f82913cbaab80a519ecb9d28302e171ab597e|
|backend/src/main/java/com/cell/platform/infra/crop/CropCoreRepository.java|77|65|559da0c9459dac151a7965c5264cf22ab9841d1a916c8697b40933c8b6caad70|
|backend/src/main/java/com/cell/platform/infra/crop/CropJpaRepository.java|27|18|aaee37faa56f2a609637e2ce605c962b9e0f09aa14b7b59fdb452143037192b4|
|backend/src/main/java/com/cell/platform/infra/game/GameRecordJpaRepository.java|15|11|863faf8cd2db3dd9f6999e55a2638ec62283efbab794f8b476650c755c183b8d|
|backend/src/main/java/com/cell/platform/infra/matrix/ConfusionMatrixCoreRepository.java|38|30|42b330f45d7c1bfe2a37de6f022d705c792a9781ad2fd27174f8a27c5d8d7db2|
|backend/src/main/java/com/cell/platform/infra/matrix/ConfusionMatrixJpaRepository.java|22|18|875c28dc91c96051036674857c4d9c21b64301a1bad96d4baae5cd68136e6983|
|backend/src/main/java/com/cell/platform/infra/report/CropIssueReportJpaRepository.java|14|11|86b1aa6163395ad4add3cc128e3a91b37e0805f92c3ab609551821358181fb51|
|backend/src/main/java/com/cell/platform/infra/species/AnimalSpeciesJpaRepository.java|16|10|6c3599637caa0da654b61c2ff361d1252325f71f8860b8e64bb7b92d4313b82f|
|backend/src/main/java/com/cell/platform/infra/submission/SubmissionCoreRepository.java|63|54|69d40b3c87f917ab45fcfaaeef2d0fab0c0b9ed70138bf5aef12f8f987a24d9e|
|backend/src/main/java/com/cell/platform/infra/submission/SubmissionJpaRepository.java|24|17|6919e5961c3e937e1408bc57a0a8894dd75de26980fe773748b6fabdd3feb5be|
|backend/src/main/java/com/cell/platform/infra/task/TaskCoreRepository.java|84|72|e8bf7f93a1da603c5a22b3381bf750852b574fc727131dbe27324ee3612ad02a|
|backend/src/main/java/com/cell/platform/infra/task/TaskJpaRepository.java|31|23|4a4b0e7087c61905f8df74f1b91258dc14ee3772a46033572fc392e461ed34f8|
|backend/src/main/java/com/cell/platform/infra/user/StudentRosterJpaRepository.java|16|10|3921010146185af21eaf42e5e77ba750ff72a9deddc3692a53ac7e071e7f25fe|
|backend/src/main/java/com/cell/platform/infra/user/UserCoreRepository.java|55|46|a8fd82746ca3bd285c9a220933a29ee430b9735a0e38c2dadefd71fb4d52bfd6|
|backend/src/main/java/com/cell/platform/infra/user/UserJpaRepository.java|16|11|ef2cc14191837186a245527a6ce30dc873246ad6a03d02adff65d2d006f24c74|
|backend/src/main/java/com/cell/platform/service/AdminService.java|183|168|1842bdc7fd73d7289f848c9b37cfaed5bd656f6342baf5ecdd4d5835513a583a|
|backend/src/main/java/com/cell/platform/service/AiClientService.java|58|50|ec309809f86291a857631898ad154d9acb5f4a4494f2ee1e88433287ccefbd0f|
|backend/src/main/java/com/cell/platform/service/AnimalSpeciesService.java|122|107|398fe9f72860ce90213c92d91c0ccd4e1c5a7114ae1de77c5a0261f29b4be080|
|backend/src/main/java/com/cell/platform/service/AuthService.java|118|102|3d0dd2ca91cb58a2d5721ecdc9b39e17ae478dcf4801e14ec2aa370a2f9a612f|
|backend/src/main/java/com/cell/platform/service/CropIssueReportService.java|46|40|e51576a4faf6e0e306c8286932d478e5668a690086445f8bd60c276b85903614|
|backend/src/main/java/com/cell/platform/service/CropService.java|96|83|3f4cf7b5fc604761c68fd41b1f2dda23cc004b72331da4f59f7b2717bb48e0d0|
|backend/src/main/java/com/cell/platform/service/DiagnosticDatasetService.java|112|96|5367979fefe46a014e462649540062b28ff8d8318202b5027ef4d7654010a5aa|
|backend/src/main/java/com/cell/platform/service/DiagnosticTaskService.java|111|99|f1509e75063be07063b4a223710dc1b3322a5071bd7b459f995cf408a4645552|
|backend/src/main/java/com/cell/platform/service/FileStorageService.java|136|116|d344e5cca6c9b9eb947de8a35cbf674f3452d6039230fc2ba30bd1878cee9b80|
|backend/src/main/java/com/cell/platform/service/GameRecordService.java|47|40|e208776f1536441a014efd03fbc8a1131c889eb07cfe52909973284e8820baaf|
|backend/src/main/java/com/cell/platform/service/LabelingService.java|347|294|ca6f9807b174cb68776aae061773489f00df5865e21a5680cc073a83648a39e0|
|backend/src/main/java/com/cell/platform/service/PseudoLabelService.java|37|30|faf0447f931c22cb1e430f8abe41cde55f123a5fdad22d7e2c69d63cf283edc9|
|backend/src/main/java/com/cell/platform/service/StatsService.java|152|135|a32cfad58665bbcd2ff012d80b638bf8de70f3f11a34d466a2e47648419f1d0f|
|backend/src/main/java/com/cell/platform/service/StudentAnalyticsService.java|121|107|c9314f8a8e2f5a30137829a999aa649859756f6f0df51c067af4f97d548f71a7|
|backend/src/main/java/com/cell/platform/service/SubmissionService.java|685|602|49a801515d13c2039b3a9eeae855130e904ca42e635c71bca04b7c75dd09c9af|
|backend/src/main/java/com/cell/platform/service/TaskService.java|235|207|55af576fef5eeb66b5c5058dd5c1afb61f4c75aa72c6f06c78e9b71923a59f4b|
|backend/src/main/java/com/cell/platform/util/Mapper.java|143|131|f2c0255df76cf35f564e18e7a13f1e2b5f32a9af79a8bef7a370d3bb775fccc3|
|backend/src/test/java/com/cell/platform/ApplicationTests.java|13|9|f1bf3097507fc0bc728bcda046e626d50799f6e86fe4c818a5ea99b887f8e8e2|
|backend/src/test/java/com/cell/platform/config/JwtTokenProviderTest.java|78|62|191e8eb5429e7ddaabc387898e849de832def797dae27bb20b0b07164c925b00|
|backend/src/test/java/com/cell/platform/context/RepositoryContext.java|35|29|0c5c25ad3a002539eae34705e8f00b8fb0abb789cbedf1d6f3882d4cfe276298|
|backend/src/test/java/com/cell/platform/controller/AuthControllerTest.java|102|86|4dc1aa252d03a4cd59e32d33e25a3c3a987d28abd7e713969c95c7487f40f811|
|backend/src/test/java/com/cell/platform/controller/CropControllerTest.java|115|96|201b5e6558c53f26ca1bf34c04e48f20b97d02314dea9577ba073062b01a231e|
|backend/src/test/java/com/cell/platform/controller/StatsControllerTest.java|103|86|128aebc3a57268ae99df5e21220f1b94bd73797148e10db6be6b3ed13b1c86e8|
|backend/src/test/java/com/cell/platform/controller/StudentAnalyticsControllerTest.java|57|50|b81a8dd263c157ad5e1ecce68b69ac610780eb92666b1d9eda5c97152b54f562|
|backend/src/test/java/com/cell/platform/controller/SubmissionControllerTest.java|128|109|d84c14929a361d0182d49912bbd0b2651dfc4a35a421f2a2cb459a4b2eabf411|
|backend/src/test/java/com/cell/platform/controller/TaskControllerTest.java|109|92|608546261f1d6397d6335344227a069f7a8021c629a5e3b4e13b008fa45f8ff7|
|backend/src/test/java/com/cell/platform/domain/CropTest.java|36|29|c93f2e6018ca3f0f7ff1115b8640c8cdf99c1a1b5bb6083fa863964cc9ffb972|
|backend/src/test/java/com/cell/platform/domain/SubmissionTest.java|33|26|cd0f92ab6d2202018dad97db74bd217a550dfdb81764c0521d9bac3415ae5626|
|backend/src/test/java/com/cell/platform/domain/TaskTest.java|33|26|de17ebbcabab55e73d05280f951065add66dbff133aa09bab4e31bb34dcc3b35|
|backend/src/test/java/com/cell/platform/domain/UserTest.java|64|53|577087edc82fcab3a36e0a3147b874f4eeb9c03944e7b289111259b13d773edb|
|backend/src/test/java/com/cell/platform/entity/CropEntityTest.java|75|61|8703ac98ae9f20ae0d27a717a3d319e0ff6a913474521aef61c5dcb00b36c9d8|
|backend/src/test/java/com/cell/platform/entity/SubmissionEntityTest.java|43|36|c09fe101e149e6a80a1e0c649bc9e67c611df00e932122c5d61a0e7d1ff4abf7|
|backend/src/test/java/com/cell/platform/entity/TaskEntityTest.java|62|52|7fdc64c7a02d978afd5fd30c9d7d43365be312f624109729925b89f3c1cbd9cb|
|backend/src/test/java/com/cell/platform/entity/UserEntityTest.java|33|27|282292fff6969b3d1e99e96d26e2bd7fa3e4f66326cda69432befec28a8c3335|
|backend/src/test/java/com/cell/platform/fixture/CropFixture.java|43|38|51ce87e7e82e5cbf8460f0ec358abc0f07c4d1cf6d668bf05d22ec5910f6d6d5|
|backend/src/test/java/com/cell/platform/fixture/SubmissionFixture.java|27|23|402e220ed58456caf861db498883eca0d8f1a975e9ace67155f55268484e6b90|
|backend/src/test/java/com/cell/platform/fixture/TaskFixture.java|29|24|0fcbff606ae729f906db5d8546c4fc24c6ab37fd9983ff27c0ef50a2350bfc8a|
|backend/src/test/java/com/cell/platform/fixture/UserFixture.java|26|22|8e3397b4469fdbd5462cbd3c872cf52f9dc88be228e7c4456cb6421107d45a1e|
|backend/src/test/java/com/cell/platform/infra/CropCoreRepositoryTest.java|160|128|7986187d0d9a7711bebfddb1387cc800facdbe44caf1572a25a29a41cdfa56d5|
|backend/src/test/java/com/cell/platform/infra/SubmissionCoreRepositoryTest.java|106|85|d93821c867ae5eaa562f469f306ae49c80d183884d61c292be12b2061728bb94|
|backend/src/test/java/com/cell/platform/infra/TaskCoreRepositoryTest.java|101|80|058ac4a834fa11424fcfdaafe5cb4c4b18921e44c03dbcb63bcc39bfa09ef718|
|backend/src/test/java/com/cell/platform/infra/UserCoreRepositoryTest.java|87|68|907dcd47dea89c335867f28aff03a247a90d9ad11611a3473c26e6ab45ddf136|
|backend/src/test/java/com/cell/platform/service/AuthServiceTest.java|98|79|5b9302bb1fc72729a93d741e6214a68f6241860a07c6ce0ee7a542a282e7a7ff|
|backend/src/test/java/com/cell/platform/service/CropServiceTest.java|92|71|61b30a2c57498d97a37cae96c6223eaf57da66971b394dd80d06c6f2e006c19d|
|backend/src/test/java/com/cell/platform/service/StatsServiceTest.java|80|62|03784fe7039afeba5e7339211a0ed1c126d30e7c66a22a179744755452ceffa3|
|backend/src/test/java/com/cell/platform/service/StudentAnalyticsServiceTest.java|130|116|b99618479b164bbe09cb777de7d8fba41350e0c2e802130bbfd2d651277ac6d6|
|backend/src/test/java/com/cell/platform/service/TaskServiceTest.java|76|58|43ddacb1811ca4f5c094f1bacd7b2f1d2bc7914d7b6b6eb690268b1f1f962df2|
|frontend/mock/mockServer.js|751|703|306e7db96dc7e99883f91b9f51976b6e2af182828e94ac95fe58552f9ff9b6a4|
|frontend/mock/studentAnalytics.js|65|61|29fb7200b19708fe4f0a6966cbe076a49eda769b8e85d3d3005b7a21f6f21d0a|
|frontend/src/api/admin.js|12|11|70fcab1ba925d0b2f42979891ef7a2874dd49f6603f56aeba4a40a10eae3d209|
|frontend/src/api/auth.js|9|7|754b43dc7ff5d964bf931212dbb8c0b6ddbd2c30a09756124d1d1b5ea09f5523|
|frontend/src/api/client.js|4|3|25754ed51b5e311a75f8405a9288787d5bd463d18b5693f77b3abce0f3cf290f|
|frontend/src/api/createApiClient.js|40|36|3f3a9d347766d281e5a5560fe41a6dc349f1f87cff9698cea368b3046992b363|
|frontend/src/api/crops.js|18|13|7a396c22c9a5fbf29a78bb55e19c71cc006cdd2b0dd3b296b8aede240afc54cc|
|frontend/src/api/diagnostic.js|11|9|59763a58743326482af74c692fe7626bb1fb0fe950815159b448d67bb92dbbde|
|frontend/src/api/index.js|10|10|0c1685f65bd67c612391ebd698beddf3600ed5d8e491e68e0bdac638ce0e6541|
|frontend/src/api/labeling.js|9|7|8abea1e982e0fabb1ad5530a012f55d5b31d66acff02b35ec2eab29984e7aa82|
|frontend/src/api/reports.js|6|5|d0494b4638fa1336c5ef0d16ab61509147b009d72a7abf57068a4f97a0561348|
|frontend/src/api/species.js|8|7|dc7120405eb1d7c4698717c8e261303d251937dba15676271fa41d3590d02b37|
|frontend/src/api/stats.js|9|7|dd14493f7f64cec524ca1f7a0e212c0346bedde3e76875cef4dcec88a8221305|
|frontend/src/api/studentAnalytics.js|6|5|12db3bf8bd63b78bbbde978ee23781def78a10d57afffca943046fdac5c192ce|
|frontend/src/api/submissions.js|27|19|bb747a98a54a021cdfef367be809393ea3ac268da46e79cdee9aac2d5d076190|
|frontend/src/api/tasks.js|31|23|5b6be7160054323df7c8b097c3fea5461986296ea19c1b2c3ac73c07fdba76e6|
|frontend/src/App.jsx|91|79|bdfd0eb65a4908cd42cf6b46b7058b744d873a1bc5fa6f3ee0d2bb7e23a3ab57|
|frontend/src/assets/bomb-game.html|1305|1187|8d4579589694163d649080f4084ebd29a61db505581972aad963a760b4b58a01|
|frontend/src/components/AnalyticsFeedback.jsx|1131|1071|a436d6c212b88a15edba13e4106465d5f894268b42412e50db36c7d25751d06e|
|frontend/src/components/AuthImage.jsx|57|49|056a1f0a726616a01d6b60e169e76452e56cc1e2bdd5d7d0ec8e2df8b4454d53|
|frontend/src/components/common/index.js|1|1|411ceefe2293220a4b070d3c5ddec8b2f21379ba13d2761e6a6c5336fcdf9a6d|
|frontend/src/components/common/NavBar.jsx|27|23|64a1b4e5f95509c74dd9ebf42c57e071fa30c04ae4dea58c57dbf0f60f93af44|
|frontend/src/components/ImageDisplayControls.jsx|87|77|3b9514c0eb6cc64801a462b53cf7e1097483c5fb9a031cb35cd3d7e68bc16d4d|
|frontend/src/components/SpeciesBadge.jsx|18|18|3ad64cdd74e711cea96054d7e5006835628c0079e33233aa7d3e847cbe9b4d9b|
|frontend/src/components/SpeciesDataSettings.jsx|184|171|99173d348b82339bacc82c5c98600af0d9d890dd038264ba8062d92f8893912d|
|frontend/src/components/SpeciesSelector.jsx|27|26|80b26cedf0eaeabcb6b0e7451b12f22f8e8f30f6cf3eef60cdfde63d1747c788|
|frontend/src/components/StudentManagement.css|54|54|d88d30819f4bd457461577e6db1f6c8310a8c48d40006c8254b154a3679251a1|
|frontend/src/components/StudentManagement.jsx|163|155|d6386ea77ee9b8b8ed5a2c225b213dd0eb30cdb443ec300102b4cbde2c51a000|
|frontend/src/components/StudentResponsesPanel.jsx|94|90|bbb44de8a3dd0fd70e7aa616ac9431b39b896588dc62b138c42c6d56d1cfa018|
|frontend/src/components/StudentReviewPanel.jsx|353|333|413da5bcb0ea7316d6fd62f599b765979afc45125a93e257b928dbf7f333174f|
|frontend/src/components/TaskSpeciesEditor.jsx|33|30|b9a7f5c7a2fdbff4e38836b5066d1948ec561591fa69a50be97e9e6164b02a3f|
|frontend/src/constants.js|24|21|1da617dba326a6721fd558c1468735e37f3e8e2a4fd5dd7d33b8cb816faa2b07|
|frontend/src/context/AuthContext.jsx|31|24|2d77ad64e38fb6aa4e38ff2523043072b4b476b5eaed3838fdb7c2fafae929ab|
|frontend/src/hooks/index.js|4|4|97b657a4bfac5f4d49b426bf1fe3cd6c309f2384fa28c7b31fe47a6195208f14|
|frontend/src/hooks/useSolvedCrops.js|19|15|e4f0b731cf5a4e94c8516e85151daad44641426a512acef7e5472f8155dd4892|
|frontend/src/hooks/useTaskCrops.js|18|15|238bde8a859d78c9ad10cacc6c6a5123ffb07cc88b7a879ac459bf23b85b95f5|
|frontend/src/hooks/useTasks.js|19|15|98090178af714b321d270ccfc3db99d6c0fa7507c5b6c865dd5d7c57b2172554|
|frontend/src/hooks/useTaskStats.js|18|15|3c09fde8e0260a9ef01f7c609a2a8d5b61b72e06551994f01b5752ad2e4d8bea|
|frontend/src/main.jsx|10|9|4e162c7b252d69183cd2add517ca46f7e9d3f69dc409185e85d148b8d594bccc|
|frontend/src/pages/AdminPage.jsx|532|497|91e8878bf0ce08ec28f4f21ecc22bbd2a726e142e695b5aee8ac3fe5a5c54960|
|frontend/src/pages/BombGamePage.jsx|18|17|1b0c924bcaffd53ce0f9faa0802ffac452531c99a7cd6ba718ee5d210b0cbc3b|
|frontend/src/pages/ExpertPage.jsx|623|567|965b8080637dfc0c0bd2081dd2a7563b43269885212e8fced3328dff750d5ed0|
|frontend/src/pages/LoginPage.jsx|153|137|d91b0528385e104cfccd029430fd162fbaf28b201e56effde92e8001f6e323fe|
|frontend/src/pages/StudentPage.jsx|759|720|52ab5692e8636c21524bffe23531c997f283271bba35d360b02bce97e2ea262c|
|frontend/src/styles/global.css|32|28|a76d4e4da0cc2737b189aeaaed1802901fbea50fd6ffcdff1a1d6efaf5988bf2|
|frontend/src/utils/authSession.js|87|81|f380fda90c130ad76594f5bd8e1b883bb146eda9c0c7df791cc8720e287c5a7e|
|frontend/src/utils/authSession.test.js|148|137|7b77daecdcc9ffe51150c12f326ffa609da32a782032bda51391866bd63fb132|
|frontend/src/utils/browserAuthSession.js|6|5|22ea14ca44c67cca773bbc260616c1a185a4ee5fc5d0f9a3c887a8b2291a37f8|
|frontend/src/utils/fetchAuthImage.js|12|11|77efc9caf6e458be981d4195cd8baf524f011c3475bcc722b7513ff6c2f31e5e|
|frontend/src/utils/studentLearning.js|28|25|8f456275badfacffc32f0d26ae9e214c4d5180e6ed7878e65b2262beb2addc32|
|frontend/src/utils/studentLearning.test.js|44|40|28cced00ee6dc37cbb3e2a1312396758f6aa0869506b3e33c6277edde5fa1753|
|frontend/src/utils/studentResponses.js|44|42|eb4b704fe0dbabb520ab117086ca96287d9c628809f46414e706fb9ae978aaba|
|frontend/src/utils/studentResponses.test.js|45|40|f3444c1fda55dd4126413de36fba51286bcc74e30b6b1af2313369ca48e50339|
|load_test/ai_bench.py|107|89|544af97784d7cc0397bd80ebb2af64e3597e1909f868d9851606c49f173e7715|
|load_test/locustfile.py|184|162|0a075109fe83eaa17c2721b1e652d0820664a0b32371bf45aaf49336c971f97e|
|컬러화POC/app.py|1810|1584|3d34d2ab290de431581836ab333318e9d2bcd5305cd4565b8761f6991cd145bb|
|컬러화POC/dicom_processing.py|309|267|659a3c22d5417cf10c80af2ba74513c18e70a03dd448fb0c46c9ddeb4675a43f|
|컬러화POC/persistence.py|484|444|06029930e06dbfbdd40bb9b3ecaa3233cd256c45cff0b92e51bcad5650fbf602|
|컬러화POC/static/app.js|2124|1993|51382a88c26f5c9f01f6a081b39adaf78c6cda789af022207808c375a4b4b769|
|컬러화POC/static/roi_geometry.js|124|115|d16f31a20357a2f063796d1065882ca6f1bc6f5855b259a37bd7099871c24834|
|컬러화POC/static/styles.css|482|453|552e1ab04b42589bfd3dfcc2f6c5245625c4025411cb8f16d61e707c67e069c3|
|컬러화POC/templates/index.html|368|346|79d4a5b64860246100bfb933e502ef33c52c6c95396939c23fb48dda919b9ec8|
|컬러화POC/tests/roi_geometry.test.js|62|54|c575dd09da65a644a289b1196710e84d5065b77d51d1f73adf82c00bb60e2d6e|
|컬러화POC/tests/test_app.py|771|710|b6ddb5977d232c13747633ea23e39a682a2b797f1e47d3e74ebf3f462965d5a6|

