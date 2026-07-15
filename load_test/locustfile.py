"""
CELL Platform 부하 테스트 스크립트
=====================================
사용법:
  1. pip install locust
  2. locust -f locustfile.py --host=https://cell.cbnu.ac.kr
  3. 브라우저에서 http://localhost:8089 열기
  4. 동시 사용자 수: 60, Spawn rate: 5 로 시작

로컬 테스트 시:
  locust -f locustfile.py --host=http://localhost
"""

import random
import json
from locust import HttpUser, task, between, events

# 테스트용 학생 계정 (DB에 미리 존재해야 함)
STUDENT_ACCOUNTS = [
    {"username": "2024123001", "password": "1234!"},
    {"username": "2024123002", "password": "1234!"},
    {"username": "2024123003", "password": "1234!"},
    {"username": "2024123004", "password": "1234!"},
    {"username": "2024123005", "password": "1234!"},
]

# 세포 분류 레이블 (실제 CellType enum 값)
CELL_LABELS = ["Segment", "Band", "Lymphocyte", "Monocyte", "Eosinophil", "NucleatedRBC"]


class StudentUser(HttpUser):
    """
    학생 60명이 동시에 라벨링하는 시나리오
    각 학생은: 로그인 → 과제 목록 → 세포 목록 → 라벨 제출 반복
    """
    wait_time = between(1, 3)  # 실제 사람처럼 1~3초 간격

    def on_start(self):
        """각 가상 유저 시작 시 로그인"""
        account = random.choice(STUDENT_ACCOUNTS)
        self.username = account["username"]
        self.token = None
        self.task_ids = []
        self.crop_ids = []

        with self.client.post(
            "/api/auth/login",
            json={"username": self.username, "password": account["password"]},
            name="/api/auth/login",
            catch_response=True
        ) as resp:
            if resp.status_code == 200:
                self.token = resp.json().get("accessToken")
                resp.success()
            else:
                resp.failure(f"로그인 실패: {resp.status_code}")

    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(1)
    def get_task_list(self):
        """과제 목록 조회"""
        with self.client.get(
            "/api/tasks",
            headers=self.auth_headers(),
            name="/api/tasks",
            catch_response=True
        ) as resp:
            if resp.status_code == 200:
                tasks = resp.json()
                self.task_ids = [t["id"] for t in tasks if not self._is_diagnostic(t)]
                resp.success()
            else:
                resp.failure(f"과제 목록 실패: {resp.status_code}")

    @task(3)
    def get_crops(self):
        """세포 이미지 목록 조회"""
        if not self.task_ids:
            return
        task_id = random.choice(self.task_ids)
        with self.client.get(
            f"/api/tasks/{task_id}/crops",
            headers=self.auth_headers(),
            name="/api/tasks/[id]/crops",
            catch_response=True
        ) as resp:
            if resp.status_code == 200:
                crops = resp.json()
                self.crop_ids = [c["id"] for c in crops]
                resp.success()
            else:
                resp.failure(f"세포 목록 실패: {resp.status_code}")

    @task(8)
    def submit_label(self):
        """세포 라벨 제출 (가장 빈번한 행동)"""
        if not self.crop_ids:
            return
        crop_id = random.choice(self.crop_ids)
        label = random.choice(CELL_LABELS)

        with self.client.post(
            "/api/submit",
            headers=self.auth_headers(),
            json={"cropId": crop_id, "studentLabel": label},
            name="/api/submit",
            catch_response=True
        ) as resp:
            if resp.status_code in (200, 201):
                resp.success()
            else:
                resp.failure(f"제출 실패: {resp.status_code} - {resp.text[:100]}")

    @task(2)
    def get_solved_crops(self):
        """내가 푼 세포 목록 조회 (진행률 체크)"""
        if not self.task_ids:
            return
        task_id = random.choice(self.task_ids)
        with self.client.get(
            f"/api/tasks/{task_id}/submissions/{self.username}",
            headers=self.auth_headers(),
            name="/api/tasks/[id]/submissions/[studentId]",
            catch_response=True
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"제출 목록 실패: {resp.status_code}")

    @task(1)
    def load_crop_image(self):
        """세포 이미지 파일 로드 (nginx 정적 파일 서빙 부하)"""
        # 실제 파일명은 DB에서 가져와야 하지만, 패턴 테스트용으로 임의 경로 사용
        # 실제 테스트 시 crop_filenames 리스트를 채워서 사용
        pass

    def _is_diagnostic(self, task):
        return not task.get("originalFilename") or \
               (task.get("uploadedFilename") or "").startswith("diagnostic-")


class ExpertUser(HttpUser):
    """
    교수 1명의 분석/확인 시나리오
    """
    wait_time = between(2, 5)
    weight = 1  # 60명 중 1명

    def on_start(self):
        self.token = None
        with self.client.post(
            "/api/auth/login",
            json={"username": "prof1", "password": "1234!"},
            name="/api/auth/login [expert]",
            catch_response=True
        ) as resp:
            if resp.status_code == 200:
                self.token = resp.json().get("accessToken")

    def auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(3)
    def view_all_stats(self):
        with self.client.get(
            "/api/all-stats",
            headers=self.auth_headers(),
            name="/api/all-stats",
            catch_response=True
        ) as resp:
            resp.success() if resp.status_code == 200 else resp.failure(str(resp.status_code))

    @task(2)
    def view_tasks(self):
        with self.client.get(
            "/api/tasks",
            headers=self.auth_headers(),
            name="/api/tasks [expert]",
            catch_response=True
        ) as resp:
            resp.success() if resp.status_code == 200 else resp.failure(str(resp.status_code))
