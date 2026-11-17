import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const config = JSON.parse(open(__ENV.CELL_TEST_CONFIG || '/work/runtime/test-config.json'));
if (config.isolated !== true || !config.marker?.startsWith('cell-stability-')) {
  throw new Error('An explicitly isolated test configuration is required.');
}
const submissionLatency = new Trend('submission_latency', true);
const consistency = new Rate('answer_consistency');
const loginSuccess = new Rate('login_success');
export const options = {
  scenarios: {
    students: {
      executor: 'ramping-vus', startVUs: 0,
      stages: [
        { duration: '30s', target: Math.min(10, config.users) },
        { duration: '30s', target: config.users },
        { duration: __ENV.CELL_HOLD || '30m', target: config.users },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '15s', gracefulStop: '15s',
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true, delayAbortEval: '60s' }],
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    submission_latency: ['p(95)<500', 'p(99)<2000'],
    checks: ['rate>0.99'],
    login_success: ['rate==1'],
    answer_consistency: ['rate==1'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  systemTags: ['status', 'method', 'name', 'scenario', 'expected_response'],
  discardResponseBodies: false,
};

function guardedHealth() {
  const response = http.get(`${config.baseUrl}/api/health`, { tags: { name: 'isolation_preflight' } });
  if (response.status !== 200 || response.headers['X-Cell-Test-Environment'] !== config.marker) {
    throw new Error('Isolation marker missing. Refusing to send any write requests.');
  }
}
export function setup() { guardedHealth(); }
let token;
let lastAnswer;
const labels = ['Band', 'Segment', 'Lymphocyte', 'Monocyte', 'Eosinophil', 'NucleatedRBC'];

export default function () {
  const username = `stability-${String(__VU).padStart(4, '0')}`;
  if (!token) {
    const response = http.post(`${config.baseUrl}/api/auth/login`, JSON.stringify({ username, password: config.password }), {
      headers: { 'Content-Type': 'application/json' }, tags: { name: 'student_login' },
    });
    const valid = response.status === 200 && response.json('role') === 'STUDENT';
    loginSuccess.add(valid);
    if (!valid) fail('Synthetic student login failed');
    token = response.json('accessToken');
  }
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const task = config.tasks[(__VU - 1) % config.tasks.length];
  let response;
  const action = __ITER % 10;
  if (action === 0) {
    response = http.get(`${config.baseUrl}/api/tasks`, { headers, tags: { name: 'task_list' } });
    check(response, { 'task list is available': r => r.status === 200 && Array.isArray(r.json()) });
  } else if (action === 1) {
    response = http.get(`${config.baseUrl}/api/tasks/${task.id}/crops`, { headers, tags: { name: 'crop_list' } });
    check(response, { 'all synthetic crops returned': r => r.status === 200 && r.json().length === task.crops.length });
  } else if (action === 2) {
    response = http.get(`${config.baseUrl}/api/tasks/${task.id}/submissions/${username}/labels`, { headers, tags: { name: 'answer_readback' } });
    check(response, { 'answer lookup is available': r => r.status === 200 });
    if (lastAnswer && response.status === 200) {
      const correct = response.json()[String(lastAnswer.id)] === lastAnswer.label;
      consistency.add(correct);
      check(response, { 'saved answer matches readback': () => correct });
    }
  } else if (action === 3) {
    const file = `stability-crop-${String((__ITER % 200) + 1).padStart(4, '0')}.png`;
    response = http.get(`${config.baseUrl}/data/crops/${file}`, { headers, tags: { name: 'crop_image' }, responseType: 'binary' });
    check(response, { 'crop image is available': r => r.status === 200 && r.body.byteLength > 100 });
  } else {
    const id = task.crops[(__ITER + __VU) % task.crops.length];
    const label = labels[(__ITER + __VU) % labels.length];
    response = http.post(`${config.baseUrl}/api/submit`, JSON.stringify({ cropId: id, studentLabel: label }), {
      headers, tags: { name: 'answer_submit' },
    });
    submissionLatency.add(response.timings.duration);
    check(response, { 'answer saved successfully': r => r.status === 200 });
    if (response.status === 200) lastAnswer = { id, label };
  }
  sleep(1 + Math.random() * 2);
}

export function handleSummary(data) {
  return {
    '/results/summary.json': JSON.stringify(data, null, 2),
    stdout: `CELL isolated stability run finished. Requests: ${data.metrics.http_reqs.values.count}; ` +
      `HTTP failures: ${data.metrics.http_req_failed.values.rate}; p95: ${data.metrics.http_req_duration.values['p(95)']} ms\n`,
  };
}
