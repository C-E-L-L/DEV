import json
import ssl
import time
import urllib.request
import urllib.error
from pathlib import Path

config = json.loads(Path('/work/runtime/test-config.json').read_text())
base = config['baseUrl']
context = ssl.create_default_context()
token = None

def request(path, payload=None, authorized=True):
    headers = {'Content-Type': 'application/json'}
    if token and authorized:
        headers['Authorization'] = 'Bearer ' + token
    body = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(base + path, body, headers)
    with urllib.request.urlopen(req, context=context, timeout=15) as response:
        return response.status, response.headers, response.read()

_, headers, body = request('/api/health', authorized=False)
assert headers.get('X-CELL-Test-Environment') == config['marker'], 'Isolation marker missing'
assert json.loads(body)['status'] == 'ok'
_, _, body = request('/api/auth/login', {'username': 'stability-0001', 'password': config['password']}, authorized=False)
login = json.loads(body)
assert login['role'] == 'STUDENT'
token = login['accessToken']
task = config['tasks'][0]
_, _, body = request('/api/tasks')
assert len(json.loads(body)) == 3
_, _, body = request(f'/api/tasks/{task["id"]}/crops')
assert len(json.loads(body)) == 200
crop = task['crops'][0]
request('/api/submit', {'cropId': crop, 'studentLabel': 'Band'})
_, _, body = request(f'/api/tasks/{task["id"]}/submissions/stability-0001/labels')
assert json.loads(body)[str(crop)] == 'Band'
_, headers, body = request('/data/crops/stability-crop-0001.png')
assert len(body) > 100 and headers.get_content_type() == 'image/png'
try:
    request('/api/admin/dashboard')
    raise AssertionError('Student reached the admin dashboard')
except urllib.error.HTTPError as error:
    assert error.code == 403
print('Sandbox preflight passed: isolation, verified TLS, student login, task/crop reads, answer write/readback, image delivery, admin role protection.')
