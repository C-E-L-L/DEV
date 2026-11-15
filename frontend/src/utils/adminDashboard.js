export function aggregateMatrix(calibration) {
  const labels = calibration?.labels || [];
  const counts = Object.fromEntries(labels.map(label => [label, Object.fromEntries(labels.map(predicted => [predicted, 0]))]));
  let unknown = 0;
  for (const student of calibration?.studentMatrices || []) {
    if (student.studentId === 'ALL') continue;
    unknown += student.unknownCount || 0;
    for (const actual of labels) for (const predicted of labels) counts[actual][predicted] += student.confusionMatrix?.[actual]?.[predicted] || 0;
  }
  const total = labels.reduce((sum, label) => sum + labels.reduce((n, p) => n + counts[label][p], 0), 0);
  const correct = labels.reduce((sum, label) => sum + counts[label][label], 0);
  return { labels, counts, total, unknown, accuracy: total ? Math.round(correct / total * 1000) / 10 : null };
}

// Final submissions count once per student and coursework, using existing grouped progress records.
export function weeklySubmissions(progress, now = new Date()) {
  const end = new Date(now); end.setHours(0, 0, 0, 0);
  const weekday = (end.getDay() + 6) % 7;
  end.setDate(end.getDate() - weekday);
  const rows = Array.from({ length: 8 }, (_, index) => {
    const start = new Date(end); start.setDate(start.getDate() - (7 - index) * 7);
    const stop = new Date(start); stop.setDate(stop.getDate() + 7);
    return { start: start.getTime(), stop: stop.getTime(), label: `${start.getMonth() + 1}/${start.getDate()}`, count: 0 };
  });
  for (const item of progress?.items || []) for (const submitted of item.submitted || []) {
    const time = new Date(submitted.finalizedAt).getTime();
    const week = rows.find(row => time >= row.start && time < row.stop && time <= now.getTime());
    if (week) week.count++;
  }
  return rows;
}
