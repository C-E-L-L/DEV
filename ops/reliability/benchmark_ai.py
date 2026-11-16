"""Bounded AI API checks using a repository microscopy sample, never production uploads."""
import concurrent.futures
import hashlib
import json
import statistics
import time
import urllib.request
import uuid
from pathlib import Path

root=Path('/work')
image=(root/'runtime/ai-benchmark.jpg').read_bytes()
base='http://ai-benchmark:8001'
for attempt in range(60):
    try:
        with urllib.request.urlopen(base+'/health',timeout=3) as response:
            health=json.load(response)
        if health.get('models_loaded') is True:
            break
    except Exception:
        pass
    time.sleep(1)
else:
    raise SystemExit('Isolated AI service did not become ready')

def request(index):
    boundary='cell-benchmark-'+uuid.uuid4().hex
    body=(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="benchmark.jpg"\r\n'
          'Content-Type: image/jpeg\r\n\r\n').encode()+image+f'\r\n--{boundary}--\r\n'.encode()
    started=time.monotonic()
    try:
        req=urllib.request.Request(base+'/api/analyze',body,{'Content-Type':'multipart/form-data; boundary='+boundary})
        with urllib.request.urlopen(req,timeout=180) as response:
            data=json.load(response)
        cells=data['cells']
        valid=len(cells)>0 and data['total_detected']==len(cells)
        valid=valid and all(c['prediction'] and 0<=float(c['confidence'])<=1 for c in cells)
        return {'success':valid,'seconds':round(time.monotonic()-started,3),'detected_cells':len(cells)}
    except Exception as error:
        return {'success':False,'seconds':round(time.monotonic()-started,3),'error_type':type(error).__name__}

groups=[]
all_results=[]
for concurrency in (1,3):
    values=[]
    for round_number in range(1,4):
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as pool:
            results=list(pool.map(request,range(concurrency)))
        values+=results
        all_results+=results
        print(f'AI concurrency={concurrency}, round={round_number}, success={sum(r["success"] for r in results)}/{len(results)}, seconds={[r["seconds"] for r in results]}',flush=True)
    times=[r['seconds'] for r in values]
    groups.append({'concurrency':concurrency,'requests':len(values),'successful':sum(r['success'] for r in values),
                   'average_seconds':round(statistics.mean(times),3),'maximum_seconds':max(times),
                   'detected_cells':sorted({r.get('detected_cells',0) for r in values})})
report={'passed':all(r['success'] for r in all_results),'requests_total':len(all_results),
        'successful':sum(r['success'] for r in all_results),'model_health_ready':True,
        'test_image':'repository data/diagnostic_gt/raw/images/1000_99.jpg','image_sha256':hashlib.sha256(image).hexdigest(),
        'resource_limit':'2 CPUs / 2 GiB; same host as the 60-user isolated API load',
        'groups':groups,'requests':all_results}
(root/'results/ai-benchmark.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('AI benchmark completed; passed='+str(report['passed']),flush=True)
if not report['passed']:
    raise SystemExit(1)
