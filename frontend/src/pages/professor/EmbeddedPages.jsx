// Existing professor screens, shown unchanged inside the console frame.
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { courseworkApi } from '../../api/coursework';
import { imageUrl } from '../../constants';
import AuthImage from '../../components/AuthImage';
import ReportsPanel from '../../components/ReportsPanel';
import SpeciesDataSettings from '../../components/SpeciesDataSettings';
import StudentManagement from '../../components/StudentManagement';
import { useProfessorData } from './ProfessorData';

const errorMessage = error => error?.response?.data?.message || error.message || '요청을 처리하지 못했습니다. 다시 시도해주세요.';

export function StudentAchievementPage() {
  return <div className="professor-workspace prof-embedded"><StudentManagement showRegistration={false} /></div>;
}

export function ReportsPage() {
  return <div className="professor-workspace prof-embedded"><ReportsPanel /></div>;
}

export function SettingsPage() {
  const { species, reload } = useProfessorData();
  return <div className="professor-workspace prof-embedded">
    <section className="pw-card"><h2>데이터 설정</h2><SpeciesDataSettings species={species} onSaved={() => reload({ silent: true })} /></section>
  </div>;
}

export function DataPage() {
  const navigate = useNavigate();
  const { reload } = useProfessorData();
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData((await courseworkApi.data()).data); }
    catch (e) { if (!axios.isCancel(e)) setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const copy = async id => {
    try {
      const { data: copied } = await courseworkApi.copy(id);
      reload({ silent: true });
      navigate(`/expert/assignments/${copied.id}/edit`);
    } catch (e) { setError(errorMessage(e)); }
  };
  const smears = data.filter(task => filter !== 'LABELED' || (task.cropCount > 0 && task.labeledCount === task.cropCount));

  return <div className="professor-workspace prof-embedded">
    <div className="pw-section-heading"><div><h2>도말 데이터</h2><p>라벨링한 자료를 확인하고 새 과제로 복사할 수 있습니다. 기존 학생 기록은 유지됩니다.</p></div><button onClick={load}>새로고침</button></div>
    {error && <div role="alert" className="pw-error">{error} <button onClick={load}>다시 불러오기</button></div>}
    <div className="pw-filters">{[['ALL', '전체 자료'], ['LABELED', '라벨링 완료']].map(([key, text]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{text}</button>)}</div>
    {loading && <p role="status">도말 자료를 불러오는 중…</p>}
    <div className="pw-cards">{smears.map(task => <article className="pw-card" key={task.id}>
      <AuthImage className="pw-data-image" src={imageUrl.original(task.originalFilename)} alt={task.uploadedFilename || '도말 이미지'} />
      <h3>{task.uploadedFilename}</h3><p>{task.speciesName} · 정답 확정 {task.labeledCount}/{task.cropCount} · 제외 {task.excludedCount}</p>
      <span className="pw-badge">{task.cropCount > 0 && task.labeledCount === task.cropCount ? '라벨링 완료' : '라벨링 진행 중'}</span>
      <div className="pw-actions">{task.status === 'DRAFT' && <button onClick={() => navigate(`/expert/assignments/${task.id}/edit`)}>라벨링 이어하기</button>}<button onClick={() => copy(task.id)}>새 과제로 사용</button></div>
    </article>)}</div>{!loading && !error && !smears.length && <div className="pw-empty">해당하는 도말 자료가 없습니다.</div>}
  </div>;
}
