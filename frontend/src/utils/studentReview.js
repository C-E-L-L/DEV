// Analysis of results already published to this student. Pending answers never become errors.
export const UNKNOWN_ANSWER = 'UNKNOWN';
export const SMALL_SAMPLE_SIZE = 5;
export const reviewKey = review => `${review.scopeType}-${review.scopeId}`;
export const speciesKey = cell => cell.speciesCode || 'UNSPECIFIED';
export const classKey = cell => JSON.stringify([speciesKey(cell), cell.correctLabel]);
export const confusionKey = cell => JSON.stringify([speciesKey(cell), cell.studentLabel, cell.correctLabel]);

export function reviewEntries(reviews = []) {
  return reviews.flatMap(review => (review.cells || []).map((cell, index) => ({
    review, cell, index, key: `${reviewKey(review)}-${cell.cropId}`,
  })));
}

/** The smears of a result in the order their cells appear (diagnostic cells have none). */
export function reviewSmears(review) {
  return [...new Set((review?.cells || []).map(cell => cell.originalSmearFilename).filter(Boolean))];
}

export function cellStatus(cell) {
  return cell.isCorrect === true ? 'correct' : cell.isCorrect === false ? 'wrong' : 'pending';
}

export function matchesCellFilter(cell, filter = 'all') {
  if (filter === 'unknown') return cell.studentLabel === UNKNOWN_ANSWER;
  return filter === 'all' || cellStatus(cell) === filter;
}

export function resolveReviewLink(reviews, { review: key, cell: cropId, focus }) {
  const review = reviews.find(item => reviewKey(item) === key);
  if (!review) return null;
  const requestedIndex = cropId != null ? review.cells.findIndex(cell => String(cell.cropId) === String(cropId)) : -1;
  const requestedCell = review.cells[requestedIndex];
  const filter = focus === 'wrong' ? 'wrong' : requestedCell
    ? requestedCell.studentLabel === UNKNOWN_ANSWER ? 'unknown' : cellStatus(requestedCell)
    : ['correct', 'wrong', 'unknown', 'pending'].find(key => review.cells.some(cell => matchesCellFilter(cell, key))) || 'correct';
  const index = requestedCell && matchesCellFilter(requestedCell, filter) ? requestedIndex
    : review.cells.findIndex(cell => matchesCellFilter(cell, filter));
  return { key: reviewKey(review), index: Math.max(0, index), filter };
}

export function summarizeReviewCells(entries) {
  const correct = entries.filter(({ cell }) => cellStatus(cell) === 'correct').length;
  const wrong = entries.filter(({ cell }) => cellStatus(cell) === 'wrong').length;
  const graded = correct + wrong;
  return {
    total: entries.length, graded, correct, wrong, pending: entries.length - graded,
    unknown: entries.filter(({ cell }) => cell.studentLabel === UNKNOWN_ANSWER).length,
    gradedUnknown: entries.filter(({ cell }) => cellStatus(cell) === 'wrong' && cell.studentLabel === UNKNOWN_ANSWER).length,
    accuracy: graded ? Math.round(correct * 100 / graded) : null,
  };
}

export function reviewSpecies(entries) {
  const species = new Map();
  for (const { cell } of entries) {
    const code = speciesKey(cell);
    if (!species.has(code)) species.set(code, { code, name: cell.speciesName || cell.speciesCode || '동물 종 미확인' });
  }
  return [...species.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export function analyzeReviewCells(entries) {
  const classes = new Map();
  const pairs = new Map();
  for (const entry of entries) {
    const { cell } = entry;
    if (cellStatus(cell) === 'pending' || !cell.correctLabel) continue;
    const key = classKey(cell);
    if (!classes.has(key)) classes.set(key, {
      key, speciesCode: speciesKey(cell), label: cell.correctLabel,
      total: 0, correct: 0, wrong: 0, unknown: 0,
    });
    const row = classes.get(key);
    row.total++;
    if (cell.isCorrect === true) row.correct++;
    else {
      row.wrong++;
      if (cell.studentLabel === UNKNOWN_ANSWER) row.unknown++;
      else if (cell.studentLabel) {
        const pair = confusionKey(cell);
        if (!pairs.has(pair)) pairs.set(pair, { key: pair, answer: cell.studentLabel, correct: cell.correctLabel, count: 0 });
        pairs.get(pair).count++;
      }
    }
  }
  return {
    summary: summarizeReviewCells(entries),
    classes: [...classes.values()].map(row => ({ ...row, accuracy: Math.round(row.correct * 100 / row.total) }))
      .sort((a, b) => b.wrong - a.wrong || b.total - a.total || a.key.localeCompare(b.key)),
    pairs: [...pairs.values()].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)),
  };
}

export function matchesAnalysisFocus(entry, focus) {
  const { cell } = entry;
  if (cellStatus(cell) !== 'wrong') return false;
  if (focus?.kind === 'class') return classKey(cell) === focus.key;
  if (focus?.kind === 'pair') return confusionKey(cell) === focus.key;
  if (focus?.kind === 'unknown') return cell.studentLabel === UNKNOWN_ANSWER;
  return true;
}
