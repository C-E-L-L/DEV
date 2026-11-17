// Pure helpers for the professor's two work screens on one coursework:
// labeling before publishing (confirm answers, leave cells out) and results after publishing.

/** Green from 80%, amber from 50%, rose below; 'none' when there is no score yet. */
export const accuracyTone = rate => (rate == null ? 'none' : rate >= 80 ? 'good' : rate >= 50 ? 'mid' : 'low');

/**
 * Index of the next item after `from` for which `open(item, index)` holds, wrapping around to the
 * start. The item at `from` itself is not considered. -1 when there is none.
 */
export function nextIndex(items, from, open) {
  for (let step = 1; step < items.length; step += 1) {
    const index = (from + step) % items.length;
    if (open(items[index], index)) return index;
  }
  return -1;
}

/* ---------- Labeling (draft coursework) ---------- */

/** 'excluded' (left out of the questions), 'labeled' (answer confirmed) or 'open'. */
export function editStatus(edit) {
  if (edit?.excluded) return 'excluded';
  return edit?.label ? 'labeled' : 'open';
}

export function labelingCounts(cells, edits) {
  const counts = { total: cells.length, active: 0, labeled: 0, excluded: 0, open: 0 };
  for (const cell of cells) {
    const status = editStatus(edits[cell.id]);
    counts[status] += 1;
    if (status !== 'excluded') counts.active += 1;
  }
  return counts;
}

/** Why the coursework cannot be published yet, or null. */
export function publishBlocker({ title, counts, mustLabel }) {
  if (!title?.trim()) return '과제 제목을 입력해주세요';
  if (counts.active === 0) return '출제할 세포가 없습니다';
  if (mustLabel && counts.open > 0) return `정답 미확정 ${counts.open}문항`;
  return null;
}

/**
 * Fills every open cell (not excluded, no answer yet) with the AI's suggestion, when the suggestion is
 * one of that cell's classes. Returns the new edits and how many cells were filled.
 */
export function fillFromAi(cells, edits, choicesOf) {
  const next = { ...edits };
  let filled = 0;
  for (const cell of cells) {
    if (editStatus(edits[cell.id]) !== 'open' || !cell.pseudoLabel) continue;
    if (!choicesOf(cell).some(choice => choice.key === cell.pseudoLabel)) continue;
    next[cell.id] = { ...edits[cell.id], label: cell.pseudoLabel };
    filled += 1;
  }
  return { edits: next, filled };
}

/* ---------- Results (published coursework) ---------- */

/** Class accuracy of one cell from its statistics, or null while there is no confirmed answer or no response. */
export function cellAccuracy(stats) {
  if (!stats?.finalLabel || !stats.totalAnswers) return null;
  return Math.round(Number(stats.accuracyRate) || 0);
}

/** One row per class choice with its response count and share. "모르겠어요" is counted separately. */
export function voteRows(choices, stats) {
  const total = Number(stats?.totalAnswers) || 0;
  const votes = stats?.voteDistribution || {};
  const share = count => (total ? Math.round((count / total) * 100) : 0);
  return {
    total,
    unknown: votes.UNKNOWN || 0,
    rows: choices.map(choice => ({ ...choice, count: votes[choice.key] || 0, share: share(votes[choice.key] || 0) })),
  };
}

const voterId = voter => String(typeof voter === 'string' ? voter : voter?.studentId);

/** Every responding student's answers over `cells` ([{ id, finalLabel, stats }]) and their score so far. */
export function studentAnswers(cells) {
  const students = new Map();
  for (const cell of cells) {
    for (const [label, voters] of Object.entries(cell.stats?.votersByLabel || {})) {
      for (const voter of voters || []) {
        if (voter == null || (typeof voter !== 'string' && voter.studentId == null)) continue;
        const id = voterId(voter);
        if (!students.has(id)) students.set(id, { studentId: id, name: typeof voter === 'string' ? null : voter.studentName || null, answers: new Map() });
        students.get(id).answers.set(cell.id, label);
      }
    }
  }
  return [...students.values()].map(student => {
    // Scored over the answered cells that already have a confirmed answer.
    const graded = cells.filter(cell => cell.finalLabel && student.answers.has(cell.id));
    const correct = graded.filter(cell => student.answers.get(cell.id) === cell.finalLabel).length;
    return {
      ...student,
      answered: student.answers.size,
      graded: graded.length,
      correct,
      rate: graded.length ? Math.round((correct / graded.length) * 100) : null,
    };
  }).sort((a, b) => a.studentId.localeCompare(b.studentId, 'ko', { numeric: true }));
}

/** How one student's answer on one cell stands: 'missing', 'waiting' (no confirmed answer), 'correct' or 'wrong'. */
export function answerState(answer, finalLabel) {
  if (!answer) return 'missing';
  if (!finalLabel) return 'waiting';
  return answer === finalLabel ? 'correct' : 'wrong';
}
