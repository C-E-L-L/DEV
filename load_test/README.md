# CELL Platform 부하 테스트

## 테스트 전 준비

1. Expert로 로그인 → 혈액도말 이미지 업로드 → 과제 생성 (크롭이 있어야 의미 있는 테스트 가능)
2. 의존성 설치:
   ```
   pip install locust requests pillow
   ```

---

## 1. 학생 60명 동시 라벨링 테스트 (Locust)

```bash
locust -f locustfile.py --host=https://cell.cbnu.ac.kr
```

브라우저에서 http://localhost:8089 열고:
- Number of users: **60**
- Spawn rate: **5** (초당 5명씩 접속)
- Start swarming 클릭

### 주요 지표
| 지표 | 기준 | 해석 |
|------|------|------|
| /api/submit 응답시간 | < 500ms | 정상 |
| /api/submit 응답시간 | 500ms~2s | 서버 부하 시작 |
| /api/submit 응답시간 | > 2s | 병목 발생 → 스펙 업 필요 |
| 실패율 (Failures) | < 1% | 정상 |
| 실패율 | > 5% | 심각한 문제 |

---

## 2. AI 서버 추론 속도 테스트

```bash
# 단일 이미지 추론 속도
python ai_bench.py --image 혈액도말샘플.jpg --url http://localhost:8001

# 동시 3장 (교수가 여러 장 올릴 때)
python ai_bench.py --image 혈액도말샘플.jpg --concurrency 3
```

### GPU 유무에 따른 기대 성능
| 환경 | 이미지 1장 추론 | 10장 업로드 대기 |
|------|----------------|-----------------|
| CPU only | 30~90초 | 5~15분 |
| RTX 3060 | 3~8초 | 30~80초 |
| RTX 4070 | 1~3초 | 10~30초 |

---

## 3. 결과 해석 및 스펙 권장사항

### 병목별 해결책
| 병목 지점 | 증상 | 해결 |
|----------|------|------|
| DB (MySQL) | /api/submit 느림, 60명 동시 시 급격히 느려짐 | RAM 증설 (buffer pool 확장) |
| 이미지 서빙 | 이미지 로딩 느림 | SSD 교체, nginx worker 수 증가 |
| AI 추론 | 업로드 후 대기 시간 김 | GPU 추가/업그레이드 |
| Spring Boot | 전반적으로 느림 | CPU 코어 수 증가, JVM heap 튜닝 |

---

## 권장 서버 스펙 (60명 기준)

```
최소 사양:
  CPU: 8코어 이상 (Intel i5-13600K / Ryzen 5 7600X)
  RAM: 32GB
  GPU: RTX 3060 12GB 이상
  SSD: 1TB NVMe (OS+앱+DB), 추가 2TB (이미지 파일)
  네트워크: 1Gbps

권장 사양 (쾌적한 수업 환경):
  CPU: 12코어 이상 (Intel i7-13700K / Ryzen 9 7900X)
  RAM: 64GB
  GPU: RTX 4070 12GB
  SSD: 2TB NVMe
  네트워크: 1Gbps
```
