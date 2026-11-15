================================================================
CELL Platform DB 백업 안내
백업 일시: 2026-07-03 (파일럿 테스트 시작 전)
================================================================

[백업 파일]
  c:\DEV\backups\celldb_backup_before_pilot_test.sql
  - users 7명 (admin, guswns, prof1, 2023041052, 2020039027, 2023078040, 2025299003)
  - tasks 20개, crops 490개, submissions 292개, assignments 3개 포함

[이미지 파일 백업]
  이미지 파일(originals/crops/thumbnails)은 백업하지 않았음
  → DB 복구 후 이미지 없이 사용하거나, 수동으로 다시 업로드 필요

================================================================
복구 방법 (파일럿 테스트 후 원래 데이터로 돌아가려면)
================================================================

1. PowerShell 열기 (c:\DEV 폴더에서)

2. DB 복구:
   Get-Content backups\celldb_backup_before_pilot_test.sql | docker exec -i dev-mysql-1 sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" celldb'

3. 백엔드 재시작:
   docker compose restart backend

4. 확인:
   docker exec dev-mysql-1 sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" celldb -e "SELECT username, role FROM users;"'

================================================================
현재 상태 (초기화 후)
================================================================

  - DB: 모든 테이블 비워짐, admin 계정만 존재
  - 이미지 파일: originals/crops/thumbnails 모두 삭제됨
  - diagnostic_gt: 건드리지 않음 (진단평가용 GT 세포 보존)

================================================================
