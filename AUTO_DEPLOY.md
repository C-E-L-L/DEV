# main 자동 배포

`main` push/병합 → GitHub Actions 테스트 → GHCR 이미지 4개 빌드 → production Release 게시 → 서버의 `CELL-AutoDeploy` 작업이 2분 간격으로 확인 → 이미지 다운로드 → 컨테이너 교체 → 상태 확인.

PR은 GitHub 호스팅 환경에서 테스트만 합니다. 운영 PC에 self-hosted runner나 외부 배포 포트를 추가하지 않습니다. 배포 스크립트는 서버에 한 번 설치한 로컬 파일을 사용합니다. 저장소의 스크립트 변경이 운영 스크립트를 자동으로 덮어쓰지는 않습니다.

## 서버 최초 설치

현재 운영 루트는 `C:\CELL\server`, 배포 관리 디렉터리는 `C:\CELL\autodeploy`입니다. `.env`, 인증서, AI weights, 업로드 파일은 운영 루트에서 유지합니다. MySQL은 `dev_mysql-data`, 컬러화는 `dev_colorizer-data` 외부 볼륨을 그대로 사용합니다. 앱 배포는 MySQL 컨테이너를 재생성하거나 업데이트하지 않습니다.

1. GitHub Actions의 첫 이미지 빌드가 끝난 뒤 GHCR의 `dev-backend`, `dev-frontend`, `dev-ai-server`, `dev-colorizer` 패키지를 **Public**으로 설정합니다. 소스 저장소가 공개여도 새 패키지는 기본 비공개입니다. 이미지 빌드에는 `.env`, SSL, 실제 업로드와 모델 weights를 넣지 않습니다. 서버는 공개 이미지와 Release를 인증 토큰 없이 읽습니다.
2. Docker Desktop을 사용하는 Windows 계정에서 설치합니다. 기존 컨테이너의 경로·볼륨·DB 상태와 SQL 기준점을 검사하며, 기존 이미지를 되돌림 태그로 보존합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\ops\deploy\Install-ProductionPoller.ps1
```

3. 작업과 첫 배포 결과를 확인합니다.

```powershell
Get-ScheduledTask -TaskName CELL-AutoDeploy
Get-Content C:\CELL\autodeploy\deploy.log -Tail 30
Get-Content C:\CELL\autodeploy\state.json
```

이미지들은 digest로 고정되며 네 이미지의 빌드가 모두 성공해야 Release가 게시됩니다. 다운로드 중 실패하면 운영 컨테이너를 건드리지 않습니다. 기동 또는 Nginx→백엔드 상태 확인이 실패하면 이전 앱 이미지로 복구합니다. DB는 자동 복원하지 않습니다. 실패한 커밋은 반복해서 배포하지 않습니다. 새 커밋이나 명시적 재시도를 사용합니다.

GitHub Actions의 초록색 결과는 **테스트·이미지 게시 성공**을 뜻합니다. 실제 서버 배포 성공은 로컬 `deploy.log`의 `DEPLOYED`와 `state.json`으로 확인합니다. `ERROR`, `ROLLED_BACK`, `ROLLBACK_FAILED`도 같은 로그에 남습니다. 현재 구성은 컨테이너 교체 중 짧은 중단이 있을 수 있습니다.

## 일시 정지·재개·재시도

```powershell
# 정지: 현재 진행 중인 배포가 있으면 완료될 때까지 기다립니다.
New-Item C:\CELL\autodeploy\paused -ItemType File -Force
# 재개
Remove-Item -LiteralPath C:\CELL\autodeploy\paused
# 컨테이너 변경 없이 후보 검증
powershell -NoProfile -File C:\CELL\autodeploy\Poll-Production.ps1 -CheckOnly
# 실패 원인을 해결한 후 해당 커밋 재시도
powershell -NoProfile -File C:\CELL\autodeploy\Poll-Production.ps1 -RetryFailed
```

수동 배포와 예약 작업은 같은 파일 잠금을 사용합니다. 동시에 두 배포가 실행되지 않습니다. `state.json`의 `previous_compose_path`와 설치 시 `baseline-compose.json`은 이전 앱 이미지 정보입니다. 롤백 이미지·과거 Release 파일은 자동으로 삭제하지 않으므로 디스크 사용량을 보고 필요 없는 것만 정리합니다.

## SQL이 추가·수정되는 배포

일반 코드 수정은 자동 배포됩니다. SQL 목록/내용이 기존 적용 기준점과 달라지면 **다운로드·컨테이너 교체 전에 중단**합니다. 기존 SQL 파일을 무조건 반복 실행하지 않습니다. 기존 SQL의 해시는 Windows/Linux 줄바꿈 차이를 정규화합니다.

1. `paused` 파일로 자동 배포를 멈추고, [기존 마이그레이션 절차](COURSEWORK_WORKFLOW.md#운영-서버-반영-순서와-롤백)에 따라 백업과 쓰기 중단 후 필요한 SQL만 적용합니다.
2. 검증한 production Release의 `deploy.json`에서 `migrations`를 확인합니다. 실제 적용이 완료된 경우에만 로컬 `state.json`의 `migrations`를 그 값으로 갱신합니다. `sha`, `run_number`, `compose_path`는 변경하지 않습니다.
3. `paused` 파일을 제거하고 배포합니다. DB 구조 변경 후 이전 앱으로의 복구 가능성은 해당 마이그레이션별로 검토해야 합니다.

DB 변경까지 완전히 자동화하려면 향후 Flyway/Liquibase 등으로 마이그레이션 이력과 호환성 관리 체계를 도입합니다.

## Windows 재부팅

예약 작업은 현재 Docker Desktop 계정의 로그인 세션에서 실행합니다. 로그인 상태로 화면을 잠가 두어도 동작합니다. 로그아웃·절전·PC 꺼짐 또는 Docker 엔진 중지는 자동 배포와 서비스 운영을 막습니다. 다른 계정/SYSTEM으로 runner를 띄워도 Docker Desktop 로그인 의존성이 없어지는 것은 아닙니다.

Docker Desktop의 로그인 시 자동 시작을 사용하고 절전을 끕니다. 로그인 없는 재부팅 복구까지 필요하면 Linux VM/서버와 Docker Engine으로 이전하는 구성이 적합합니다.
