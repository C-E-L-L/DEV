import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProfessorData } from '../professor/ProfessorData';
import { courseworkTitle } from '../../utils/professorDashboard';
import { isDiagnostic } from '../../utils/coursework';

export default function ReviewPage() {
  const { groups, loading, error, reload } = useProfessorData();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const scope = params.get('scope') || 'ALL';
  const rows = groups.filter(g => g.status !== 'ARCHIVED' && g.cropCount > g.labeledCount
    && (scope !== 'PUBLISHED' || g.status !== 'DRAFT')
    && `${courseworkTitle(g)} ${g.id}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a,b) => (b.cropCount-b.labeledCount)-(a.cropCount-a.labeledCount));
  return <><div className="prof-page-head"><div><h1>라벨 검수</h1><p>정답 미확정 문항이 있는 분류 실습과 진단평가를 확인합니다. 게시된 과제의 정답을 수정하면 답안을 다시 채점합니다.</p></div><button className="prof-btn" onClick={() => reload()}>새로고침</button></div>
    <section className="adm-card"><div className="adm-filters"><input aria-label="검수 과제 검색" placeholder="과제명·ID 검색" value={query} onChange={e => setQuery(e.target.value)}/><select aria-label="검수 범위" value={scope} onChange={e => setParams(e.target.value === 'ALL' ? {} : {scope:e.target.value})}><option value="ALL">임시저장 + 게시 과제</option><option value="PUBLISHED">게시 과제</option></select></div>
      {loading ? <p role="status" className="adm-empty">검수 목록을 불러오는 중…</p> : error ? <p role="alert" className="adm-error">{error}</p> : !rows.length ? <p className="adm-empty">정답을 확정할 문항이 없습니다.</p> : <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>과제</th><th>유형</th><th>상태</th><th>확정 / 출제 문항</th><th>미확정</th><th>검수</th></tr></thead><tbody>{rows.map(g => <tr key={g.id}><td><strong>{courseworkTitle(g)}</strong><small className="adm-cell-file">과제 #{g.id} · 도말 {g.tasks.length}개</small></td><td>{isDiagnostic(g) ? '진단평가' : '분류 실습'}</td><td><span className="adm-badge">{g.status === 'DRAFT' ? '임시저장' : '게시됨'}</span></td><td>{g.labeledCount} / {g.cropCount}</td><td>{g.cropCount-g.labeledCount}개</td><td><Link to={`/admin/assignments/${g.id}/${g.status === 'DRAFT' ? 'edit' : 'results'}`}>정답 검수 →</Link></td></tr>)}</tbody></table></div>}
    </section></>;
}
