import { useState, useEffect, useCallback } from 'react';
import { submissionApi } from '../api';

export function useSolvedCrops(taskId, studentId) {
  const [solvedIds, setSolvedIds] = useState(new Set());

  useEffect(() => {
    if (!taskId || !studentId) return;
    submissionApi.getSolvedCrops(taskId, studentId)
      .then(({ data }) => setSolvedIds(new Set(data)))
      .catch(console.error);
  }, [taskId, studentId]);

  const markSolved = useCallback((cropId) => {
    setSolvedIds((prev) => new Set(prev).add(cropId));
  }, []);

  return { solvedIds, markSolved };
}
