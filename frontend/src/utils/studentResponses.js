// Task statistics include the submitted students for each cell/class pair.
export function summarizeStudentResponses(crops) {
  const students = new Map();
  const gradingComplete = crops.length > 0 && crops.every(crop => Boolean(crop.finalLabel));
  const responsesAvailable = crops.every(crop =>
    Object.values(crop.votersByLabel || {}).reduce((count, voters) => count + (voters?.length || 0), 0)
      === Number(crop.totalAnswers || 0)
  );

  for (const crop of crops) {
    for (const [label, voters] of Object.entries(crop.votersByLabel || {})) {
      for (const voter of voters || []) {
        const studentId = typeof voter === 'string' ? voter : voter.studentId;
        if (studentId == null) continue;
        const id = String(studentId);
        if (!students.has(id)) {
          students.set(id, {
            studentId: id,
            displayName: typeof voter === 'string' ? voter : voter.studentDisplayName
              || (voter.studentName ? `${id}_${voter.studentName}` : id),
            answers: new Map(),
          });
        }
        students.get(id).answers.set(crop.cropId, label);
      }
    }
  }

  return {
    gradingComplete,
    responsesAvailable,
    students: [...students.values()].map(student => {
      const correctCount = gradingComplete
        ? crops.filter(crop => student.answers.get(crop.cropId) === crop.finalLabel).length
        : null;
      return {
        ...student,
        answeredCount: student.answers.size,
        correctCount,
        accuracy: gradingComplete ? correctCount / crops.length * 100 : null,
      };
    }).sort((a, b) => a.studentId.localeCompare(b.studentId, 'ko', { numeric: true })),
  };
}
