// Pure helpers for the professor's smear data page: label state, filtering, sorting, paging.

/**
 * COMPLETE: every question cell has a confirmed answer. PARTIAL: some do. NONE: none do.
 * (An AI suggestion is not a label: only answers the professor confirmed count.)
 */
export function labelState(task) {
  const total = task.cropCount || 0;
  const confirmed = task.labeledCount || 0;
  if (total > 0 && confirmed >= total) return 'COMPLETE';
  return confirmed > 0 ? 'PARTIAL' : 'NONE';
}

export const pendingCells = task => Math.max(0, (task.cropCount || 0) - (task.labeledCount || 0));
export const smearName = task => task.uploadedFilename || task.originalFilename || `도말 #${task.id}`;

export function labelStateCounts(tasks) {
  const counts = { ALL: tasks.length, COMPLETE: 0, PARTIAL: 0, NONE: 0 };
  for (const task of tasks) counts[labelState(task)]++;
  return counts;
}

/** `tab`: ALL or a label state. `query` matches the file name, coursework title or #id. */
export function filterSmears(tasks, { tab = 'ALL', query = '', speciesId = '' } = {}) {
  const text = query.trim().toLowerCase();
  return tasks.filter(task => (tab === 'ALL' || labelState(task) === tab)
    && (!speciesId || String(task.speciesId) === String(speciesId))
    && (!text || `${smearName(task)} ${task.title || ''} #${task.id}`.toLowerCase().includes(text)));
}

const SORTERS = {
  NEWEST: (a, b) => b.id - a.id,
  CELLS: (a, b) => (b.cropCount || 0) - (a.cropCount || 0) || b.id - a.id,
  PENDING: (a, b) => pendingCells(b) - pendingCells(a) || b.id - a.id,
};
export function sortSmears(tasks, sort = 'NEWEST') {
  return [...tasks].sort(SORTERS[sort] || SORTERS.NEWEST);
}

export function paginate(items, page, size) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * size;
  return {
    items: items.slice(start, start + size), page: current, pages, total: items.length,
    from: items.length ? start + 1 : 0, to: Math.min(start + size, items.length),
  };
}

/** Page buttons with gaps, e.g. [1, 2, 3, 4, 5, '…', 16]. */
export function pageNumbers(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  const shown = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 4) for (let n = 2; n <= 5; n++) shown.add(n);
  if (page >= pages - 3) for (let n = pages - 4; n < pages; n++) shown.add(n);
  const result = [];
  let previous = 0;
  for (const n of [...shown].filter(value => value >= 1 && value <= pages).sort((a, b) => a - b)) {
    if (n - previous > 1) result.push('…');
    result.push(n);
    previous = n;
  }
  return result;
}

/** Species that appear in the data, with how many smears each has. */
export function speciesOptions(tasks) {
  const byId = new Map();
  for (const task of tasks) {
    if (task.speciesId == null) continue;
    const entry = byId.get(task.speciesId) || { id: task.speciesId, name: task.speciesName || task.speciesCode, count: 0 };
    entry.count++;
    byId.set(task.speciesId, entry);
  }
  return [...byId.values()].sort((a, b) => b.count - a.count || String(a.name).localeCompare(String(b.name)));
}

/**
 * Delete calls for the selected drafts. When every smear of an assignment is selected the
 * assignment itself is deleted, so no empty assignment is left behind.
 */
export function deletionPlan(selected, all) {
  const plan = [];
  const byAssignment = new Map();
  for (const task of selected) {
    if (task.assignmentId == null) plan.push({ type: 'task', id: task.id });
    else byAssignment.set(task.assignmentId, [...(byAssignment.get(task.assignmentId) || []), task]);
  }
  for (const [assignmentId, tasks] of byAssignment) {
    const size = all.filter(task => task.assignmentId === assignmentId).length;
    if (tasks.length === size) plan.push({ type: 'assignment', id: assignmentId });
    else tasks.forEach(task => plan.push({ type: 'task', id: task.id }));
  }
  return plan;
}
