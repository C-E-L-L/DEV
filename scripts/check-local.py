"""Check the real local stack; --seed creates local accounts and uploads a real smear."""
import argparse
import json
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

ROOT = Path(__file__).resolve().parents[1]
BASE = 'http://127.0.0.1:15173'
settings = json.loads((ROOT / '.local/settings.json').read_text(encoding='utf-8-sig'))


def request(path, token=None, payload=None, raw=None, content_type=None):
    headers = {'Origin': BASE}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    data = raw
    if payload is not None:
        data = json.dumps(payload).encode()
        headers['Content-Type'] = 'application/json'
    if content_type:
        headers['Content-Type'] = content_type
    with urlopen(Request(BASE + path, data=data, headers=headers), timeout=120) as response:
        body = response.read()
        if 'application/json' in response.headers.get('Content-Type', '') and body:
            return json.loads(body)
        return body


def login(username):
    return request('/api/auth/login', payload={
        'username': username, 'password': settings['adminPassword']})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--seed', action='store_true')
    args = parser.parse_args()
    admin = login('local-admin')
    assert admin['role'] == 'ADMIN'
    token = admin['accessToken']
    with urlopen('http://127.0.0.1:18001/health', timeout=15) as response:
        assert json.load(response)['models_loaded'] is True
    assert request('/colorizer/health')['status'] == 'ok'
    assert b'text/html' not in request('/colorizer/static/styles.css')[:80]
    users = request('/api/admin/users', token)
    if args.seed:
        for username, role in [('local-professor', 'EXPERT'), ('local-student', 'STUDENT')]:
            if not any(user['username'] == username for user in users):
                request('/api/admin/users', token, {
                    'username': username, 'name': username,
                    'password': settings['adminPassword'], 'role': role})
        tasks = request('/api/tasks', token)
        if not any(task.get('title') == 'local-smoke.jpg' for task in tasks):
            boundary = 'cell-local-smoke-boundary'
            picture = (ROOT / 'frontend/src/assets/login/smear-1000_152.jpg').read_bytes()
            raw = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="local-smoke.jpg"\r\n'
                   'Content-Type: image/jpeg\r\n\r\n').encode() + picture + f'\r\n--{boundary}--\r\n'.encode()
            task = request('/api/tasks/upload', token, raw=raw,
                           content_type=f'multipart/form-data; boundary={boundary}')
            assert task['totalDetected'] > 0, 'AI returned no cells'
            print(f"Real AI upload: task {task['taskId']}, {task['totalDetected']} cells")
    users = request('/api/admin/users', token)
    for username, role in [('local-professor', 'EXPERT'), ('local-student', 'STUDENT')]:
        if any(user['username'] == username for user in users):
            account = login(username)
            assert account['role'] == role
            if role == 'STUDENT':
                try:
                    request('/api/admin/users', account['accessToken'])
                except HTTPError as error:
                    assert error.code == 403
                else:
                    raise AssertionError('Student could access admin API')
    tasks = request('/api/tasks', token)
    sample = next((task for task in tasks if task.get('title') == 'local-smoke.jpg'), None)
    if sample:
        crops = request(f"/api/tasks/{sample['id']}/crops", token)
        assert crops, 'Saved task has no crops'
        image = request('/data/crops/' + crops[0]['cropFilename'], token)
        assert image.startswith((b'\xff\xd8', b'\x89PNG')), 'Crop URL did not return an image'
    print(json.dumps({'login': 'ok', 'ai': 'ok', 'colorizer': 'ok',
                      'users': len(users), 'tasks': len(tasks),
                      'saved_sample': bool(sample)}))


if __name__ == '__main__':
    main()
