export const isDiagnostic = task => task?.kind ? task.kind === 'DIAGNOSTIC' : (task?.uploadedFilename || '').startsWith('diagnostic-');
export const isPublished = task => !['DRAFT', 'ARCHIVED'].includes(task?.status);

export function groupCoursework(tasks) {
  const groups = new Map();
  for (const task of tasks) {
    const key = task.assignmentId ? `assignment-${task.assignmentId}` : `task-${task.id}`;
    if (!groups.has(key)) groups.set(key, { ...task, tasks: [], cropCount: 0, labeledCount: 0, excludedCount: 0 });
    const group = groups.get(key);
    group.tasks.push(task);
    for (const key of ['cropCount', 'labeledCount', 'excludedCount']) group[key] += task[key] || 0;
  }
  return [...groups.values()].sort((a, b) => Number(isDiagnostic(b)) - Number(isDiagnostic(a)) || b.id - a.id);
}

export function distributeQuestions(total, available) {
  const result = Object.fromEntries(Object.keys(available).map(key => [key, 0]));
  let left = Math.max(0, Math.min(Math.floor(Number(total) || 0), Object.values(available).reduce((a, b) => a + b, 0)));
  while (left > 0) {
    for (const key of Object.keys(result)) {
      if (left && result[key] < available[key]) { result[key]++; left--; }
    }
  }
  return result;
}

export function savePayload(workspace, metadata, edits) {
  return {
    title: metadata.title.trim(), deadlineAt: metadata.deadlineAt ? `${metadata.deadlineAt.slice(0, 16)}:00` : null,
    requireLabels: metadata.requireLabels, resultsAfterDeadline: metadata.resultsAfterDeadline,
    revisions: Object.fromEntries(workspace.tasks.map(({ task }) => [task.id, task.revision])),
    cells: workspace.tasks.flatMap(({ crops }) => crops.map(cell => ({
      cropId: cell.id, label: edits[cell.id]?.label || null,
      excluded: Boolean(edits[cell.id]?.excluded), exclusionReason: edits[cell.id]?.exclusionReason || null,
    }))),
  };
}
