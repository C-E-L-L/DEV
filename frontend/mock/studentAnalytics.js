const diagnostic = task => task.uploadedFilename?.startsWith('diagnostic-');
const title = task => diagnostic(task) ? `Diagnostic #${task.id}` : task.title || `Task #${task.id}`;

function summary(cells) {
  const totalCells = cells.length;
  const answeredCells = cells.filter(cell => cell.studentLabel).length;
  const correct = cells.filter(cell => cell.isCorrect === true).length;
  const wrong = cells.filter(cell => cell.isCorrect === false).length;
  const labelingComplete = totalCells > 0 && cells.every(cell => cell.correctLabel);
  return { totalCells, answeredCells, correct, wrong, pendingAnswers: answeredCells - correct - wrong,
    labelingComplete: Boolean(labelingComplete), accuracy: labelingComplete ? Math.round(correct / totalCells * 1000) / 10 : null };
}

export function mockTaskDetail(task, crops, answers, studentId) {
  const cells = [...crops].sort((a, b) => a.cropId - b.cropId).map(crop => {
    const studentLabel = answers[crop.cropId] || null;
    const correctLabel = crop.finalLabel || (diagnostic(task) ? crop.gtLabel : null) || null;
    return { cropId: crop.cropId, cropFilename: crop.filename, studentLabel, correctLabel,
      isCorrect: studentLabel && correctLabel ? studentLabel === correctLabel : null, submittedAt: null };
  });
  return { studentId, task: { taskId: task.id, title: title(task), filename: task.uploadedFilename || task.originalFilename,
    speciesCode: task.speciesCode, speciesName: task.speciesName, summary: summary(cells) }, cells };
}

export function mockLearningHistory(tasks, cropStats, answers, studentId) {
  const groups = new Map();
  for (const task of [...tasks].sort((a, b) => b.id - a.id)) {
    const key = task.assignmentId ? `ASSIGNMENT:${task.assignmentId}` : `TASK:${task.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(task);
  }
  return { studentId, activities: [...groups.values()].map(group => {
    group.sort((a, b) => a.id - b.id);
    const first = group[0];
    const details = group.map(task => mockTaskDetail(task, cropStats.get(task.id) || [], answers, studentId));
    return { scopeType: diagnostic(first) ? 'DIAGNOSTIC' : first.assignmentId ? 'ASSIGNMENT' : 'TASK',
      scopeId: first.assignmentId || first.id, title: title(first), createdAt: first.createdAt,
      deadlineAt: group.map(task => task.deadlineAt).filter(Boolean).sort()[0] || null,
      summary: summary(details.flatMap(detail => detail.cells)), tasks: details.map(detail => detail.task) };
  }) };
}

export function mockStudentMatrices(students, tasks, cropStats, studentAnswers, labels) {
  const emptyMatrix = () => Object.fromEntries(labels.map(label => [label, Object.fromEntries(labels.map(key => [key, 0]))]));
  const total = emptyMatrix();
  const withScore = (student, confusionMatrix) => {
    const totalSolved = Object.values(confusionMatrix).flatMap(Object.values).reduce((sum, value) => sum + value, 0);
    const correct = labels.reduce((sum, label) => sum + confusionMatrix[label][label], 0);
    return { ...student, confusionMatrix, totalSolved, accuracy: totalSolved ? Math.floor(correct / totalSolved * 100) : 0 };
  };
  const studentMatrices = students.map(student => {
    const matrix = emptyMatrix();
    for (const task of tasks) {
      const detail = mockTaskDetail(task, cropStats.get(task.id) || [], studentAnswers.get(student.studentId) || {}, student.studentId);
      for (const cell of detail.cells) {
        if (cell.isCorrect != null) {
          matrix[cell.correctLabel][cell.studentLabel]++;
          total[cell.correctLabel][cell.studentLabel]++;
        }
      }
    }
    return withScore(student, matrix);
  });
  return { studentMatrices: [withScore({ studentId: 'ALL', studentDisplayName: '전체 합계' }, total), ...studentMatrices] };
}
