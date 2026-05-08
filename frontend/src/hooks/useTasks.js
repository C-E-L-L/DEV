import { useState, useEffect, useCallback } from 'react';
import { taskApi } from '../api';

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    taskApi.getAll()
      .then(({ data }) => setTasks(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { tasks, loading, refresh };
}
