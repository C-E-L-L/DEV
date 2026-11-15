"""
AI 서버 단독 성능 벤치마크
================================
GPU 유무, 동시 요청 수에 따른 추론 속도 측정

사용법:
  pip install requests pillow numpy
  python ai_bench.py --image 테스트이미지.jpg --concurrency 1
  python ai_bench.py --image 테스트이미지.jpg --concurrency 3

결과: 요청당 평균 처리 시간, 초당 처리 가능 이미지 수 출력
"""

import argparse
import time
import statistics
import threading
import requests
from pathlib import Path


def single_inference(url: str, image_path: str, results: list, idx: int):
    start = time.time()
    try:
        with open(image_path, "rb") as f:
            resp = requests.post(
                f"{url}/api/analyze",
                files={"file": ("test.jpg", f, "image/jpeg")},
                timeout=120
            )
        elapsed = time.time() - start
        success = resp.status_code == 200
        crop_count = len(resp.json().get("crops", [])) if success else 0
        results[idx] = {
            "success": success,
            "elapsed": elapsed,
            "crops": crop_count,
            "status": resp.status_code
        }
    except Exception as e:
        results[idx] = {"success": False, "elapsed": time.time() - start, "error": str(e)}


def run_benchmark(url: str, image_path: str, concurrency: int, rounds: int = 3):
    print(f"\n{'='*60}")
    print(f"AI 서버: {url}")
    print(f"이미지: {image_path}")
    print(f"동시 요청 수: {concurrency}, 반복: {rounds}회")
    print(f"{'='*60}")

    all_times = []

    for r in range(rounds):
        results = [None] * concurrency
        threads = [
            threading.Thread(target=single_inference, args=(url, image_path, results, i))
            for i in range(concurrency)
        ]

        wall_start = time.time()
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        wall_elapsed = time.time() - wall_start

        times = [res["elapsed"] for res in results if res and res.get("success")]
        errors = [res for res in results if res and not res.get("success")]
        crops = [res["crops"] for res in results if res and res.get("success")]

        if times:
            all_times.extend(times)
            print(f"\n라운드 {r+1}:")
            print(f"  벽시계 시간(전체): {wall_elapsed:.2f}s")
            print(f"  요청당 평균:       {statistics.mean(times):.2f}s")
            print(f"  최소/최대:         {min(times):.2f}s / {max(times):.2f}s")
            print(f"  감지된 세포(평균): {statistics.mean(crops):.0f}개")
            if errors:
                print(f"  오류: {len(errors)}건")

    if all_times:
        print(f"\n{'='*60}")
        print(f"전체 통계 ({len(all_times)}회 성공)")
        print(f"  평균 추론 시간: {statistics.mean(all_times):.2f}s")
        print(f"  중앙값:         {statistics.median(all_times):.2f}s")
        print(f"  처리량:         {concurrency / statistics.mean(all_times):.2f} 이미지/초")
        print(f"  시간당 처리:    {3600 * concurrency / statistics.mean(all_times):.0f} 이미지/시간")

        # 60명 수업 시나리오에서 업로드 예상 시간
        typical_images_per_class = 10  # 교수가 한 수업에 업로드하는 도말 이미지 수
        expected_wait = statistics.mean(all_times) * typical_images_per_class / concurrency
        print(f"\n[수업 시나리오] 도말 이미지 {typical_images_per_class}장 업로드 예상 대기: {expected_wait:.0f}s")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://localhost:8001", help="AI 서버 주소")
    parser.add_argument("--image", required=True, help="테스트할 혈액도말 이미지 경로")
    parser.add_argument("--concurrency", type=int, default=1, help="동시 요청 수")
    parser.add_argument("--rounds", type=int, default=3, help="반복 횟수")
    args = parser.parse_args()

    if not Path(args.image).exists():
        print(f"이미지 파일을 찾을 수 없음: {args.image}")
        exit(1)

    run_benchmark(args.url, args.image, args.concurrency, args.rounds)
