import { useState, useCallback } from 'react';
import { statsApi } from '../api';

export function useTaskStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback((taskId) => {
    if (!taskId) return;
    setLoading(true);
    statsApi.getByTaskId(taskId)
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, fetchStats };
}
