const CELL_LABELS = ['Segment', 'Band', 'Eosinophil', 'NucleatedRBC', 'Lymphocyte', 'Monocyte'];

let animalSpecies = [
  { id: 1, code: 'DOG', name: '개 (Dog)', builtIn: true },
  { id: 2, code: 'CAT', name: '고양이 (Cat)', builtIn: true },
];

const tasks = [
  { id: 101, assignmentId: 10, title: '로컬 테스트 - 마감된 과제', originalFilename: 'mock-smear-1.svg', uploadedFilename: 'mock-smear-1.svg', speciesId: 1, speciesCode: 'DOG', speciesName: '개 (Dog)', cropCount: 11, deadlineAt: '2026-08-18T18:00:00', createdAt: '2026-08-18T10:00:00' },
  { id: 102, assignmentId: 10, title: '로컬 테스트 - 마감된 과제', originalFilename: 'mock-smear-2.svg', uploadedFilename: 'mock-smear-2.svg', speciesId: 2, speciesCode: 'CAT', speciesName: '고양이 (Cat)', cropCount: 11, deadlineAt: '2026-08-18T18:00:00', createdAt: '2026-08-18T10:05:00' },
  { id: 103, assignmentId: null, title: 'GT 채점 완료 과제', originalFilename: 'mock-smear-1.svg', uploadedFilename: 'mock-smear-1.svg', speciesId: 1, speciesCode: 'DOG', speciesName: '개 (Dog)', cropCount: 11, deadlineAt: null, createdAt: '2026-08-18T11:00:00' },
  { id: 104, assignmentId: 11, title: '마감 예정 과제', originalFilename: 'mock-smear-2.svg', uploadedFilename: 'mock-smear-2.svg', speciesId: 1, speciesCode: 'DOG', speciesName: '개 (Dog)', cropCount: 11, deadlineAt: '2027-01-15T18:00:00', createdAt: '2026-08-18T11:30:00' },
  { id: 201, assignmentId: null, title: null, originalFilename: '', uploadedFilename: 'diagnostic-20260818120000', speciesId: 1, speciesCode: 'DOG', speciesName: '개 (Dog)', cropCount: 11, deadlineAt: null, createdAt: '2026-08-18T12:00:00' },
];

const boxes = [
  [90, 110, 205, 235], [220, 105, 330, 225], [350, 145, 465, 270],
  [500, 95, 615, 220], [640, 130, 755, 255], [780, 90, 900, 220],
  [150, 330, 270, 455], [310, 300, 430, 430], [480, 335, 600, 465],
  [650, 305, 775, 440], [805, 335, 925, 465],
];

const labelsByIndex = ['Segment', null, 'Band', 'Eosinophil', null, 'Segment', 'Lymphocyte', null, 'Monocyte', 'NucleatedRBC', null];

function makeVotes(index) {
  const primary = CELL_LABELS[index % CELL_LABELS.length];
  const secondary = CELL_LABELS[(index + 1) % CELL_LABELS.length];
  return Object.fromEntries(CELL_LABELS.map(label => [label, label === primary ? 3 : label === secondary ? 2 : 0]));
}

function makeVoters(index) {
  const primary = CELL_LABELS[index % CELL_LABELS.length];
  const secondary = CELL_LABELS[(index + 1) % CELL_LABELS.length];
  const students = [
    { studentId: '20260001', studentName: '김민지', studentDisplayName: '20260001_김민지' },
    { studentId: '20260002', studentName: '이준호', studentDisplayName: '20260002_이준호' },
    { studentId: '20260003', studentName: '박서연', studentDisplayName: '20260003_박서연' },
    { studentId: '20260004', studentName: '최도윤', studentDisplayName: '20260004_최도윤' },
    { studentId: '20260005', studentName: '정하은', studentDisplayName: '20260005_정하은' },
  ];
  return Object.fromEntries(CELL_LABELS.map(label => [
    label,
    label === primary
      ? students.slice(0, 3)
      : label === secondary
        ? students.slice(3)
        : [],
  ]));
}

function makeCrop(taskId, index) {
  const task = tasks.find(item => item.id === taskId);
  const fullyGraded = [102, 103, 201].includes(taskId);
  const finalLabel = fullyGraded ? CELL_LABELS[index % CELL_LABELS.length] : labelsByIndex[index];
  const voteDistribution = makeVotes(index);
  const totalAnswers = Object.values(voteDistribution).reduce((sum, count) => sum + count, 0);
  const correctAnswers = finalLabel ? voteDistribution[finalLabel] || 0 : 0;
  const accuracyRate = finalLabel ? Math.round((correctAnswers / totalAnswers) * 1000) / 10 : 0;
  return {
    taskId,
    cropId: taskId * 100 + index + 1,
    filename: `mock-cell-${taskId}-${index + 1}.svg`,
    originalSmearFilename: task?.originalFilename || null,
    speciesId: task?.speciesId || null,
    speciesCode: task?.speciesCode || null,
    speciesName: task?.speciesName || null,
    bbox: JSON.stringify(boxes[index]),
    gtLabel: taskId === 201 ? finalLabel : null,
    pseudoLabel: CELL_LABELS[index % CELL_LABELS.length],
    aiBboxConfidence: 0.94,
    aiClassificationConfidence: 0.82,
    finalLabel,
    totalAnswers,
    accuracyRate,
    errorRate: finalLabel ? Math.round((100 - accuracyRate) * 10) / 10 : 0,
    hardScore: finalLabel ? 100 - accuracyRate : 0,
    wrongDetails: [],
    voteDistribution,
    votersByLabel: makeVoters(index),
  };
}

const cropStats = new Map(tasks.map(task => [task.id, boxes.map((_, index) => makeCrop(task.id, index))]));
const studentAnswers = new Map();
studentAnswers.set('student', Object.fromEntries([
  ...(cropStats.get(101) || []).slice(0, 5),
  ...(cropStats.get(102) || []).slice(0, 3),
  ...(cropStats.get(103) || []),
  ...(cropStats.get(201) || []),
].map((crop, index) => [crop.cropId, CELL_LABELS[(index + 1) % CELL_LABELS.length]])));
let mockUsers = [
  { id: 1, username: 'admin', name: '로컬 관리자', role: 'ADMIN', status: 'ACTIVE', createdAt: '2026-08-18T09:00:00' },
  { id: 2, username: 'professor', name: '로컬 테스트 교수', role: 'EXPERT', status: 'ACTIVE', createdAt: '2026-08-18T09:05:00' },
  { id: 3, username: 'student', name: '로컬 테스트 학생', role: 'STUDENT', status: 'ACTIVE', createdAt: '2026-08-18T09:10:00' },
];
let mockRoster = [
  { id: 1, studentId: 'student', registeredBy: 'admin', claimedUserId: 3, createdAt: '2026-08-18T09:00:00' },
  { id: 2, studentId: '20260001', registeredBy: 'admin', claimedUserId: null, createdAt: '2026-08-18T09:00:00' },
];

function cropDto(crop, studentView = false) {
  return {
    id: crop.cropId,
    taskId: crop.taskId,
    originalSmearFilename: crop.originalSmearFilename,
    speciesId: crop.speciesId,
    speciesCode: crop.speciesCode,
    speciesName: crop.speciesName,
    cropFilename: crop.filename,
    bbox: crop.bbox,
    gtLabel: studentView ? null : crop.gtLabel,
    pseudoLabel: studentView ? null : crop.pseudoLabel,
    aiBboxConfidence: studentView ? null : crop.aiBboxConfidence,
    aiClassificationConfidence: studentView ? null : crop.aiClassificationConfidence,
    finalLabel: studentView ? null : crop.finalLabel,
  };
}

function answersFor(studentId = 'student') {
  if (!studentAnswers.has(studentId)) studentAnswers.set(studentId, {});
  return studentAnswers.get(studentId);
}

function resultFor(crops, studentId) {
  const answers = answersFor(studentId);
  const details = crops
    .filter(crop => answers[crop.cropId])
    .map(crop => {
      const studentLabel = answers[crop.cropId];
      const correctLabel = crop.finalLabel;
      return {
        cropId: crop.cropId,
        cropFilename: crop.filename,
        studentLabel,
        correctLabel,
        isCorrect: correctLabel ? studentLabel === correctLabel : null,
      };
    });
  const scorable = details.filter(item => item.isCorrect !== null);
  const correct = scorable.filter(item => item.isCorrect).length;
  return {
    total: scorable.length,
    correct,
    wrong: scorable.length - correct,
    accuracy: scorable.length ? Math.round((correct / scorable.length) * 100) : 0,
    details,
    labels: CELL_LABELS,
    confusionMatrix: {},
  };
}

function reviewFor(taskGroup, studentId) {
  const answers = answersFor(studentId);
  const crops = taskGroup.flatMap(task => cropStats.get(task.id) || []);
  const submitted = crops.filter(crop => answers[crop.cropId]);
  if (submitted.length === 0) return null;
  const representative = taskGroup[0];
  const diagnostic = representative.uploadedFilename?.startsWith('diagnostic-');
  const deadlineAt = representative.deadlineAt || null;
  const deadlinePassed = Boolean(deadlineAt && new Date(deadlineAt).getTime() <= Date.now());
  const allAnswered = submitted.length >= crops.length;
  const allGraded = crops.length > 0 && crops.every(crop => crop.finalLabel);
  if (!(diagnostic ? allAnswered : deadlinePassed || (allAnswered && allGraded))) return null;

  const cells = submitted.map(crop => {
    const studentLabel = answers[crop.cropId];
    const correctLabel = crop.finalLabel;
    return {
      taskId: crop.taskId,
      cropId: crop.cropId,
      cropFilename: crop.filename,
      originalSmearFilename: crop.originalSmearFilename,
      speciesCode: crop.speciesCode,
      speciesName: crop.speciesName,
      bbox: crop.bbox,
      studentLabel,
      correctLabel,
      isCorrect: correctLabel ? studentLabel === correctLabel : null,
    };
  });
  const correct = cells.filter(cell => cell.isCorrect === true).length;
  const wrong = cells.filter(cell => cell.isCorrect === false).length;
  const pendingAnswers = cells.filter(cell => cell.isCorrect == null).length;
  const gradedAnswers = correct + wrong;
  return {
    scopeType: diagnostic ? 'DIAGNOSTIC' : representative.assignmentId ? 'ASSIGNMENT' : 'TASK',
    scopeId: representative.assignmentId || representative.id,
    title: diagnostic ? `Diagnostic #${representative.id}` : representative.title || `Task #${representative.id}`,
    thumbnailFilename: diagnostic ? cells[0]?.cropFilename : representative.originalFilename,
    deadlineAt,
    availabilityReason: diagnostic ? 'DIAGNOSTIC_COMPLETED' : deadlinePassed ? 'DEADLINE_PASSED' : 'GRADED',
    totalCells: crops.length,
    answeredCells: cells.length,
    unsubmittedCells: Math.max(0, crops.length - cells.length),
    gradedAnswers,
    pendingAnswers,
    correct,
    wrong,
    accuracy: gradedAnswers ? Math.round((correct / gradedAnswers) * 100) : null,
    cells,
  };
}

function getStudentReviews(studentId) {
  const reviews = [];
  const handledAssignments = new Set();
  for (const task of tasks) {
    if (task.assignmentId) {
      if (handledAssignments.has(task.assignmentId)) continue;
      handledAssignments.add(task.assignmentId);
      const review = reviewFor(tasks.filter(item => item.assignmentId === task.assignmentId), studentId);
      if (review) reviews.push(review);
    } else {
      const review = reviewFor([task], studentId);
      if (review) reviews.push(review);
    }
  }
  return reviews;
}

function isMockSubmissionLocked(taskId, studentId) {
  const task = tasks.find(item => item.id === taskId);
  if (!task) return false;
  const group = task.assignmentId ? tasks.filter(item => item.assignmentId === task.assignmentId) : [task];
  return Boolean(reviewFor(group, studentId)) || Boolean(task.deadlineAt && new Date(task.deadlineAt).getTime() <= Date.now());
}

function refreshScore(crop) {
  const correctAnswers = crop.finalLabel ? crop.voteDistribution[crop.finalLabel] || 0 : 0;
  crop.accuracyRate = crop.finalLabel ? Math.round((correctAnswers / crop.totalAnswers) * 1000) / 10 : 0;
  crop.errorRate = crop.finalLabel ? Math.round((100 - crop.accuracyRate) * 10) / 10 : 0;
  crop.hardScore = crop.errorRate;
}

function json(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { resolve({}); }
    });
  });
}

function readMultipart(req) {
  return new Promise(resolve => {
    const chunks = [];
    req.on('data', chunk => { chunks.push(chunk); });
    req.on('end', () => {
      const contentType = String(req.headers['content-type'] || '');
      const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.slice(1).find(Boolean);
      if (!boundary) { resolve({ fields: {}, files: [] }); return; }

      const fields = {};
      const files = [];
      const raw = Buffer.concat(chunks).toString('binary');
      for (const part of raw.split(`--${boundary}`)) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd < 0) continue;
        const headers = part.slice(0, headerEnd);
        const name = headers.match(/name="([^"]+)"/)?.[1];
        if (!name) continue;
        const filename = headers.match(/filename="([^"]*)"/)?.[1];
        const value = part.slice(headerEnd + 4).replace(/\r\n$/, '');
        if (filename !== undefined) files.push({ fieldName: name, filename });
        else (fields[name] ||= []).push(Buffer.from(value, 'binary').toString('utf8'));
      }
      resolve({ fields, files });
    });
  });
}

function smearSvg(variant) {
  const offset = variant === 2 ? 28 : 0;
  const cells = boxes.map(([x1, y1, x2, y2], index) => {
    const cx = (x1 + x2) / 2 + (index % 2 ? offset : -offset / 2);
    const cy = (y1 + y2) / 2;
    const rx = (x2 - x1) * 0.36;
    const ry = (y2 - y1) * 0.39;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#f3ddec" stroke="#b782aa" stroke-width="5"/><path d="M ${cx - 22} ${cy} C ${cx - 12} ${cy - 32}, ${cx + 15} ${cy - 30}, ${cx + 22} ${cy} C ${cx + 10} ${cy + 28}, ${cx - 12} ${cy + 30}, ${cx - 22} ${cy}" fill="#633a91" opacity="0.9"/>`;
  }).join('');
  const redCells = Array.from({ length: 70 }, (_, index) => {
    const x = 25 + (index * 83) % 950;
    const y = 25 + (index * 137) % 600;
    return `<ellipse cx="${x}" cy="${y}" rx="30" ry="22" fill="#d89ab1" opacity="0.48" stroke="#bf7896" stroke-width="2"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="650" viewBox="0 0 1000 650"><rect width="1000" height="650" fill="#efd6df"/>${redCells}${cells}<text x="30" y="45" fill="#dc3545" font-family="Arial" font-size="24" font-weight="700">LOCAL MOCK x40</text><text x="850" y="610" fill="#dc3545" font-family="Arial" font-size="24">50um</text></svg>`;
}

function cropSvg(filename) {
  const match = filename.match(/-(\d+)\.svg$/);
  const index = Math.max(0, Number(match?.[1] || 1) - 1);
  const label = CELL_LABELS[index % CELL_LABELS.length];
  const colors = {
    Segment: '#59317d', Band: '#70459a', Eosinophil: '#b75476',
    NucleatedRBC: '#4c276e', Lymphocyte: '#3e1d70', Monocyte: '#765099',
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><rect width="220" height="220" fill="#f4e5ec"/><circle cx="110" cy="110" r="82" fill="#e8c9dc" stroke="#bd87aa" stroke-width="8"/><path d="M55 112 C65 55, 100 55, 108 98 C120 50, 165 65, 164 118 C160 164, 125 168, 108 132 C92 168, 60 158, 55 112" fill="${colors[label]}"/><circle cx="78" cy="85" r="8" fill="#f3d9e6" opacity="0.8"/><text x="110" y="207" text-anchor="middle" font-family="Arial" font-size="15" fill="#495057">${label} · MOCK</text></svg>`;
}

function serveImage(pathname, res) {
  const filename = decodeURIComponent(pathname.split('/').pop());
  const svg = filename.startsWith('mock-smear')
    ? smearSvg(filename.includes('-2.') ? 2 : 1)
    : cropSvg(filename);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(svg);
}

export function mockServerPlugin() {
  return {
    name: 'cell-local-mock-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        const { pathname } = url;
        const studentRequest = String(req.headers.authorization || '').includes('local-mock-student-token');

        if (pathname.startsWith('/data/')) {
          serveImage(pathname, res);
          return;
        }
        if (!pathname.startsWith('/api/')) {
          next();
          return;
        }

        if (req.method === 'POST' && pathname === '/api/auth/login') {
          const body = await readJson(req);
          const username = String(body.username || 'professor').toLowerCase();
          const role = username === 'admin' ? 'ADMIN' : username === 'student' ? 'STUDENT' : 'EXPERT';
          const names = { ADMIN: '로컬 관리자', STUDENT: '로컬 테스트 학생', EXPERT: '로컬 테스트 교수' };
          json(res, { username, name: names[role], role, accessToken: `local-mock-${role.toLowerCase()}-token` });
          return;
        }
        if (req.method === 'POST' && pathname === '/api/assignments') {
          const multipart = await readMultipart(req);
          const title = multipart.fields.title?.[0] || '목업 도말 과제';
          const speciesIds = (multipart.fields.speciesIds || []).map(Number);
          const deadlineAt = multipart.fields.deadlineAt?.[0] || null;
          const assignmentId = Math.max(...tasks.map(task => task.assignmentId || 0), 0) + 1;
          const createdTasks = [];

          multipart.files.filter(file => file.fieldName === 'files').forEach((file, index) => {
            const species = animalSpecies.find(item => item.id === speciesIds[index]) || animalSpecies[0];
            const task = {
              id: Math.max(...tasks.map(item => item.id), 0) + 1,
              assignmentId,
              title,
              originalFilename: index % 2 === 0 ? 'mock-smear-1.svg' : 'mock-smear-2.svg',
              uploadedFilename: file.filename || `mock-smear-${index + 1}.png`,
              speciesId: species.id,
              speciesCode: species.code,
              speciesName: species.name,
              cropCount: boxes.length,
              deadlineAt,
              createdAt: new Date().toISOString(),
            };
            tasks.push(task);
            const crops = boxes.map((_, cropIndex) => makeCrop(task.id, cropIndex));
            cropStats.set(task.id, crops);
            createdTasks.push({
              taskId: task.id,
              originalImage: task.originalFilename,
              speciesId: species.id,
              speciesCode: species.code,
              speciesName: species.name,
              totalDetected: crops.length,
              crops: crops.map(crop => cropDto(crop)),
            });
          });

          json(res, {
            assignmentId,
            title,
            expertUsername: 'professor',
            createdAt: new Date().toISOString(),
            tasks: createdTasks,
            totalCrops: createdTasks.reduce((sum, task) => sum + task.totalDetected, 0),
          });
          return;
        }
        if (req.method === 'GET' && pathname === '/api/tasks') {
          json(res, tasks);
          return;
        }
        if (req.method === 'GET' && pathname === '/api/species') {
          json(res, animalSpecies);
          return;
        }
        if (req.method === 'POST' && pathname === '/api/species') {
          const body = await readJson(req);
          const name = String(body.name || '').trim().replace(/\s+/g, ' ');
          if (!name || name.length > 60 || animalSpecies.some(item => item.name.toLowerCase() === name.toLowerCase())) {
            json(res, { message: !name ? '동물 종 이름은 필수입니다.' : name.length > 60 ? '동물 종 이름은 60자 이하여야 합니다.' : `이미 등록된 동물 종입니다: ${name}` }, 400);
            return;
          }
          const created = {
            id: Math.max(...animalSpecies.map(item => item.id), 0) + 1,
            code: `ANIMAL_MOCK_${Date.now()}`,
            name,
            builtIn: false,
          };
          animalSpecies.push(created);
          json(res, created);
          return;
        }

        const speciesRenameMatch = pathname.match(/^\/api\/species\/(\d+)$/);
        if (req.method === 'PUT' && speciesRenameMatch) {
          const species = animalSpecies.find(item => item.id === Number(speciesRenameMatch[1]));
          const body = await readJson(req);
          if (!species) {
            json(res, { message: '동물 종을 찾을 수 없습니다.' }, 404);
            return;
          }
          const name = String(body.name || '').trim().replace(/\s+/g, ' ');
          if (!name || name.length > 60 || animalSpecies.some(item => item.id !== species.id && item.name.toLowerCase() === name.toLowerCase())) {
            json(res, { message: !name ? '동물 종 이름은 필수입니다.' : name.length > 60 ? '동물 종 이름은 60자 이하여야 합니다.' : `이미 등록된 동물 종입니다: ${name}` }, 400);
            return;
          }
          species.name = name;
          tasks.filter(task => task.speciesId === species.id).forEach(task => { task.speciesName = species.name; });
          [...cropStats.values()].flat().filter(crop => crop.speciesId === species.id).forEach(crop => { crop.speciesName = species.name; });
          json(res, species);
          return;
        }

        const taskSpeciesMatch = pathname.match(/^\/api\/tasks\/(\d+)\/species$/);
        if (req.method === 'PUT' && taskSpeciesMatch) {
          const task = tasks.find(item => item.id === Number(taskSpeciesMatch[1]));
          const body = await readJson(req);
          const species = animalSpecies.find(item => item.id === Number(body.speciesId));
          if (!task || !species) {
            json(res, { message: '도말 이미지 또는 동물 종을 찾을 수 없습니다.' }, 404);
            return;
          }
          task.speciesId = species.id;
          task.speciesCode = species.code;
          task.speciesName = species.name;
          (cropStats.get(task.id) || []).forEach(crop => {
            crop.speciesId = species.id;
            crop.speciesCode = species.code;
            crop.speciesName = species.name;
          });
          json(res, species);
          return;
        }
        if (req.method === 'GET' && pathname === '/api/all-stats') {
          json(res, [...cropStats.values()].flat());
          return;
        }
        if (req.method === 'GET' && pathname === '/api/student/reviews') {
          json(res, { reviews: getStudentReviews('student') });
          return;
        }

        const taskCropsMatch = pathname.match(/^\/api\/tasks\/(\d+)\/crops$/);
        if (req.method === 'GET' && taskCropsMatch) {
          json(res, (cropStats.get(Number(taskCropsMatch[1])) || []).map(crop => cropDto(crop, studentRequest)));
          return;
        }

        const assignmentCropsMatch = pathname.match(/^\/api\/assignments\/(\d+)\/crops$/);
        if (req.method === 'GET' && assignmentCropsMatch) {
          const assignmentId = Number(assignmentCropsMatch[1]);
          const assignmentTaskIds = tasks.filter(task => task.assignmentId === assignmentId).map(task => task.id);
          json(res, assignmentTaskIds.flatMap(taskId => cropStats.get(taskId) || []).map(crop => cropDto(crop, studentRequest)));
          return;
        }

        const taskLabelsMatch = pathname.match(/^\/api\/tasks\/(\d+)\/submissions\/([^/]+)\/labels$/);
        if (req.method === 'GET' && taskLabelsMatch) {
          const taskId = Number(taskLabelsMatch[1]);
          const studentId = decodeURIComponent(taskLabelsMatch[2]);
          const taskCropIds = new Set((cropStats.get(taskId) || []).map(crop => crop.cropId));
          const labels = Object.fromEntries(Object.entries(answersFor(studentId)).filter(([cropId]) => taskCropIds.has(Number(cropId))));
          json(res, labels);
          return;
        }

        const assignmentLabelsMatch = pathname.match(/^\/api\/assignments\/(\d+)\/submissions\/([^/]+)\/labels$/);
        if (req.method === 'GET' && assignmentLabelsMatch) {
          const assignmentId = Number(assignmentLabelsMatch[1]);
          const studentId = decodeURIComponent(assignmentLabelsMatch[2]);
          const assignmentTaskIds = new Set(tasks.filter(task => task.assignmentId === assignmentId).map(task => task.id));
          const cropIds = new Set([...cropStats.values()].flat().filter(crop => assignmentTaskIds.has(crop.taskId)).map(crop => crop.cropId));
          const labels = Object.fromEntries(Object.entries(answersFor(studentId)).filter(([cropId]) => cropIds.has(Number(cropId))));
          json(res, labels);
          return;
        }

        const taskSolvedMatch = pathname.match(/^\/api\/tasks\/(\d+)\/submissions\/([^/]+)$/);
        if (req.method === 'GET' && taskSolvedMatch) {
          const taskId = Number(taskSolvedMatch[1]);
          const studentId = decodeURIComponent(taskSolvedMatch[2]);
          const taskCropIds = new Set((cropStats.get(taskId) || []).map(crop => crop.cropId));
          json(res, Object.keys(answersFor(studentId)).map(Number).filter(cropId => taskCropIds.has(cropId)));
          return;
        }

        const assignmentSolvedMatch = pathname.match(/^\/api\/assignments\/(\d+)\/submissions\/([^/]+)$/);
        if (req.method === 'GET' && assignmentSolvedMatch) {
          const assignmentId = Number(assignmentSolvedMatch[1]);
          const studentId = decodeURIComponent(assignmentSolvedMatch[2]);
          const assignmentTaskIds = new Set(tasks.filter(task => task.assignmentId === assignmentId).map(task => task.id));
          const cropIds = new Set([...cropStats.values()].flat().filter(crop => assignmentTaskIds.has(crop.taskId)).map(crop => crop.cropId));
          json(res, Object.keys(answersFor(studentId)).map(Number).filter(cropId => cropIds.has(cropId)));
          return;
        }

        if (req.method === 'POST' && pathname === '/api/submit') {
          const body = await readJson(req);
          const crop = [...cropStats.values()].flat().find(item => item.cropId === Number(body.cropId));
          if (crop && isMockSubmissionLocked(crop.taskId, body.studentId || 'student')) {
            json(res, { message: '이미 마감되었거나 결과가 공개된 과제의 답안은 수정할 수 없습니다.' }, 400);
            return;
          }
          answersFor(body.studentId)[body.cropId] = body.studentLabel;
          json(res, { success: true });
          return;
        }

        const taskResultsMatch = pathname.match(/^\/api\/tasks\/(\d+)\/my-results\/([^/]+)$/);
        if (req.method === 'GET' && taskResultsMatch) {
          const taskId = Number(taskResultsMatch[1]);
          const task = tasks.find(item => item.id === taskId);
          const group = task?.assignmentId ? tasks.filter(item => item.assignmentId === task.assignmentId) : task ? [task] : [];
          if (!reviewFor(group, decodeURIComponent(taskResultsMatch[2]))) {
            json(res, { message: '채점이 완료되거나 마감된 뒤 결과를 확인할 수 있습니다.' }, 400);
            return;
          }
          json(res, resultFor(cropStats.get(taskId) || [], decodeURIComponent(taskResultsMatch[2])));
          return;
        }

        const assignmentResultsMatch = pathname.match(/^\/api\/assignments\/(\d+)\/my-results\/([^/]+)$/);
        if (req.method === 'GET' && assignmentResultsMatch) {
          const assignmentId = Number(assignmentResultsMatch[1]);
          const assignmentTaskIds = new Set(tasks.filter(task => task.assignmentId === assignmentId).map(task => task.id));
          const crops = [...cropStats.values()].flat().filter(crop => assignmentTaskIds.has(crop.taskId));
          if (!reviewFor(tasks.filter(task => task.assignmentId === assignmentId), decodeURIComponent(assignmentResultsMatch[2]))) {
            json(res, { message: '채점이 완료되거나 마감된 뒤 결과를 확인할 수 있습니다.' }, 400);
            return;
          }
          json(res, resultFor(crops, decodeURIComponent(assignmentResultsMatch[2])));
          return;
        }

        const statsMatch = pathname.match(/^\/api\/tasks\/(\d+)\/stats$/);
        if (req.method === 'GET' && statsMatch) {
          json(res, cropStats.get(Number(statsMatch[1])) || []);
          return;
        }

        const assignmentDeadlineMatch = pathname.match(/^\/api\/assignments\/(\d+)\/deadline$/);
        if (req.method === 'PUT' && assignmentDeadlineMatch) {
          const assignmentId = Number(assignmentDeadlineMatch[1]);
          const assignmentTasks = tasks.filter(task => task.assignmentId === assignmentId);
          if (assignmentTasks.some(task => task.deadlineAt && new Date(task.deadlineAt).getTime() <= Date.now())) {
            json(res, { message: '이미 마감된 과제의 마감일은 변경하거나 해제할 수 없습니다.' }, 400);
            return;
          }
          const body = await readJson(req);
          assignmentTasks.forEach(task => { task.deadlineAt = body.deadlineAt || null; });
          json(res, { success: true });
          return;
        }

        const taskDeadlineMatch = pathname.match(/^\/api\/tasks\/(\d+)\/deadline$/);
        if (req.method === 'PUT' && taskDeadlineMatch) {
          const task = tasks.find(item => item.id === Number(taskDeadlineMatch[1]));
          if (!task || task.assignmentId || task.uploadedFilename?.startsWith('diagnostic-')) {
            json(res, { message: '이 Task의 마감일은 개별 변경할 수 없습니다.' }, 400);
            return;
          }
          if (task.deadlineAt && new Date(task.deadlineAt).getTime() <= Date.now()) {
            json(res, { message: '이미 마감된 과제의 마감일은 변경하거나 해제할 수 없습니다.' }, 400);
            return;
          }
          const body = await readJson(req);
          task.deadlineAt = body.deadlineAt || null;
          json(res, { success: true });
          return;
        }

        const confirmMatch = pathname.match(/^\/api\/crops\/(\d+)\/confirm$/);
        if (req.method === 'PUT' && confirmMatch) {
          const cropId = Number(confirmMatch[1]);
          const body = await readJson(req);
          const crop = [...cropStats.values()].flat().find(item => item.cropId === cropId);
          if (!crop) {
            json(res, { message: 'Mock crop not found' }, 404);
            return;
          }
          crop.finalLabel = body.finalLabel || null;
          refreshScore(crop);
          json(res, { success: true });
          return;
        }

        if (req.method === 'GET' && pathname === '/api/reports') {
          json(res, []);
          return;
        }
        if (req.method === 'POST' && pathname === '/api/reports') {
          await readJson(req);
          json(res, { success: true });
          return;
        }

        if (req.method === 'GET' && pathname === '/api/admin/smears') {
          json(res, tasks.map(task => {
            const crops = cropStats.get(task.id) || [];
            const labeledCrops = crops.filter(crop => crop.finalLabel).length;
            return {
              taskId: task.id,
              originalFilename: task.originalFilename,
              uploadedFilename: task.uploadedFilename,
              speciesId: task.speciesId,
              speciesCode: task.speciesCode,
              speciesName: task.speciesName,
              createdAt: task.createdAt,
              totalCrops: crops.length,
              labeledCrops,
              hasLabel: labeledCrops > 0,
            };
          }));
          return;
        }
        if (req.method === 'GET' && pathname === '/api/admin/crops') {
          json(res, [...cropStats.values()].flat().map(crop => ({
            cropId: crop.cropId,
            taskId: crop.taskId,
            cropFilename: crop.filename,
            originalSmearFilename: crop.originalSmearFilename,
            speciesId: crop.speciesId,
            speciesCode: crop.speciesCode,
            speciesName: crop.speciesName,
            gtLabel: crop.gtLabel,
            pseudoLabel: crop.pseudoLabel,
            finalLabel: crop.finalLabel,
            hasLabel: Boolean(crop.finalLabel),
          })));
          return;
        }
        if (req.method === 'GET' && pathname === '/api/admin/users') {
          json(res, mockUsers);
          return;
        }
        if (req.method === 'POST' && pathname === '/api/admin/users') {
          const body = await readJson(req);
          mockUsers.push({ id: Math.max(...mockUsers.map(user => user.id), 0) + 1, username: body.username, name: body.name || null, role: body.role || 'EXPERT', status: 'ACTIVE', createdAt: new Date().toISOString() });
          json(res, { success: true });
          return;
        }
        const deleteUserMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
        if (req.method === 'DELETE' && deleteUserMatch) {
          const username = decodeURIComponent(deleteUserMatch[1]);
          mockUsers = mockUsers.filter(user => user.username !== username);
          json(res, { success: true });
          return;
        }
        const userStatusMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\/status$/);
        if (req.method === 'PUT' && userStatusMatch) {
          const body = await readJson(req);
          const user = mockUsers.find(item => item.id === Number(userStatusMatch[1]));
          if (user) user.status = body.status;
          json(res, { success: true });
          return;
        }
        if (req.method === 'GET' && pathname === '/api/admin/student-roster') {
          json(res, mockRoster);
          return;
        }
        if (req.method === 'POST' && pathname === '/api/admin/student-roster') {
          const body = await readJson(req);
          let added = 0;
          let skipped = 0;
          for (const studentId of body.studentIds || []) {
            if (mockRoster.some(item => item.studentId === studentId)) { skipped += 1; continue; }
            mockRoster.push({ id: Math.max(...mockRoster.map(item => item.id), 0) + 1, studentId, registeredBy: 'admin', claimedUserId: null, createdAt: new Date().toISOString() });
            added += 1;
          }
          json(res, { added, skipped });
          return;
        }
        if (req.method === 'GET' && pathname === '/api/tasks/diagnostic/student-matrices') {
          json(res, { studentMatrices: [] });
          return;
        }
        if (req.method === 'GET' && pathname === '/api/tasks/diagnostic/pool-stats') {
          json(res, { totalAvailable: 0, availableByClass: Object.fromEntries(CELL_LABELS.map(label => [label, 0])) });
          return;
        }

        json(res, { message: `Mock API가 지원하지 않는 요청입니다: ${req.method} ${pathname}` }, 404);
      });
    },
  };
}
