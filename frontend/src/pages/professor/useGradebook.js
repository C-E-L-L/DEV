import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { professorApi } from '../../api/professor';

/** The gradebook response ({ students, items, results }) with loading and error state. */
export default function useGradebook() {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const load = useCallback(() => {
    let active = true;
    setState(current => ({ ...current, loading: true, error: '' }));
    professorApi.gradebook()
      .then(({ data }) => { if (active) setState({ loading: false, data, error: '' }); })
      .catch(error => { if (active && !axios.isCancel(error)) setState(current => ({ ...current, loading: false, error: '학생 성적을 불러오지 못했습니다.' })); });
    return () => { active = false; };
  }, []);
  useEffect(() => load(), [load]);
  return { ...state, reload: load };
}
