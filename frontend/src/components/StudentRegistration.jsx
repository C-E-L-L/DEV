import { useEffect, useState } from 'react';
import api from '../api/client';

export default function StudentRegistration({ onChanged, defaultOpen = false }) {
  const [roster, setRoster] = useState([]);
  const [ids, setIds] = useState('');
  const [account, setAccount] = useState({ username: '', name: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('');
  const sections = [...new Set(roster.map(item => item.section).filter(Boolean))].sort();
  const visible = roster.filter(item => `${item.studentId} ${item.name || ''}`.toLowerCase().includes(query.trim().toLowerCase())
    && (!section || (section === '__NONE__' ? !item.section : item.section === section)));
  const reload = () => api.get('/professor/students/roster').then(({ data }) => setRoster(data)).catch(() => setMessage('등록 명단을 불러오지 못했습니다.'));
  useEffect(() => { reload(); }, []);
  const submit = async (event, mode) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (mode === 'roster') {
        const { data } = await api.post('/professor/students/roster', { studentIds: [...new Set(ids.split(/[\s,;]+/).filter(Boolean))] });
        setMessage(`명단 ${data.added}명 등록 · 중복/빈 항목 ${data.skipped}개 제외`); setIds('');
      } else {
        await api.post('/professor/students', account);
        setMessage(`${account.name} 학생 계정을 등록했습니다.`); setAccount({ username: '', name: '', password: '' });
      }
      await reload(); onChanged();
    } catch (error) { setMessage(error.response?.data?.message || '학생 등록에 실패했습니다.'); }
    finally { setBusy(false); }
  };
  return <details className="pw-card" open={defaultOpen || undefined}><summary>학생 등록 및 계정 만들기</summary>
    <p>명단에 학번을 등록하면 해당 학번으로 학생이 가입할 수 있습니다. 직접 계정을 만들 수도 있습니다.</p>
    <form onSubmit={event => submit(event, 'roster')}>
      <label className="pw-field">가입 허용 학번 목록<textarea required value={ids} onChange={event => setIds(event.target.value)} placeholder="줄바꿈 또는 쉼표로 여러 학번 입력" disabled={busy} /></label>
      <button disabled={busy}>명단 등록</button>
    </form>
    <form onSubmit={event => submit(event, 'account')}>
      <h4>학생 계정 직접 만들기</h4>
      <div className="pw-actions">{[['username','학번 / 아이디'],['name','이름'],['password','초기 비밀번호']].map(([key,label]) => <label key={key}>{label}<input required aria-label={label} type={key === 'password' ? 'password' : 'text'} minLength={key === 'password' ? 8 : 1} maxLength={key === 'password' ? 72 : 100} autoComplete={key === 'password' ? 'new-password' : 'off'} value={account[key]} onChange={e => setAccount(value => ({...value, [key]:e.target.value}))} disabled={busy} /></label>)}</div>
      <button disabled={busy}>학생 계정 생성</button>
    </form>
    {message && <p role="status">{message}</p>}
    <p>가입 허용 명단 {roster.length}명 · 검색 결과 {visible.length}명</p>
    <div className="pw-actions"><label>명단 검색 <input aria-label="가입 명단 검색" placeholder="학번·이름" value={query} onChange={e => setQuery(e.target.value)}/></label><label>분반 <select aria-label="가입 명단 분반" value={section} onChange={e => setSection(e.target.value)}><option value="">전체 분반</option><option value="__NONE__">분반 미지정</option>{sections.map(name => <option key={name} value={name}>{name}</option>)}</select></label></div>
    <div className="prof-table-wrap"><table className="prof-table"><thead><tr><th>학번</th><th>이름</th><th>분반 (선택)</th><th>가입 상태</th></tr></thead><tbody>{visible.map(item => <tr key={item.id}><td>{item.studentId}</td><td>{item.name || '—'}</td><td>{item.section || '—'}</td><td>{item.claimedUserId ? '가입 완료' : '가입 대기'}</td></tr>)}</tbody></table>{!visible.length && <p className="pw-muted">조건에 맞는 학생이 없습니다.</p>}</div>
  </details>;
}
