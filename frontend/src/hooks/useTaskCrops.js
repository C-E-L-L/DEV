import { useState, useEffect } from 'react';
import { cropApi } from '../api';

export function useTaskCrops(taskId) {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    cropApi.getByTaskId(taskId)
      .then(({ data }) => setCrops(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [taskId]);

  return { crops, loading };
}
