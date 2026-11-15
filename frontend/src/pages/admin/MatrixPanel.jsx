import { useState } from 'react';
import { Link } from 'react-router-dom';
import { professorApi } from '../../api/professor';
import { useRemote, RemoteState } from '../../components/console/ConsoleUI';
import Icon from '../../components/login/icons';
import { aggregateMatrix } from '../../utils/adminDashboard';
import { useProfessorData } from '../professor/ProfessorData';

export default function MatrixPanel({ compact = false }) {
  const { species, loading, error } = useProfessorData();
  const [speciesId, setSpeciesId] = useState('');
  const [source, setSource] = useState('ALL');
  const [schema, setSchema] = useState('');
  const selected = speciesId || species.find(s => s.code === 'DOG')?.id || species[0]?.id || '';
  const request = useRemote(() => selected ? professorApi.calibration({ speciesId:selected, source, schema:schema || undefined }) : Promise.resolve({data:null}), [selected, source, schema]);
  const matrix = aggregateMatrix(request.data);
  return <section className="adm-card adm-matrix">
    <header className="adm-card-head"><h2><Icon name="grid" size={18} />세포 감별 혼동행렬</h2>{matrix.accuracy != null && !request.loading && !request.error && <span className="adm-badge is-active">정확도 {matrix.accuracy}%</span>}</header>
    <div className="adm-card-body">
      <p className="adm-muted">확정 정답 대비 학생의 최종 제출 응답 · 행: 정답 / 열: 학생 응답</p>
      <div className="adm-filters is-inline"><select aria-label="혼동행렬 동물 종" value={selected} onChange={e => {setSpeciesId(e.target.value);setSchema('');}}>{species.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select><select aria-label="혼동행렬 집계 범위" value={source} onChange={e => {setSource(e.target.value);setSchema('');}}><option value="ALL">정답 확인 과제 누적</option><option value="DIAGNOSTIC">진단평가 누적</option><option value="INITIAL">초기 진단</option></select>
        {request.data?.schemas?.length > 1 && <select aria-label="혼동행렬 클래스 구성" value={schema || request.data.schema} onChange={e => setSchema(e.target.value)}>{request.data.schemas.map(s => <option key={s} value={s}>{s.split('|').join(' · ')}</option>)}</select>}
      </div>
      {loading ? <p className="adm-empty" role="status">동물 종을 불러오는 중…</p> : error ? <p role="alert" className="adm-error">{error}</p> : !selected ? <p className="adm-empty">등록된 동물 종이 없습니다.</p> : <RemoteState state={request}>
        {!matrix.total ? <p className="adm-empty">채점된 응답이 없습니다. 학생이 최종 제출하고 정답이 확정되면 표시됩니다.</p> : <>
          <div className="adm-table-wrap"><table className="adm-heatmap"><thead><tr><th>정답 / 응답</th>{matrix.labels.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{matrix.labels.map(actual => {
            const total = matrix.labels.reduce((sum,p) => sum + matrix.counts[actual][p],0);
            return <tr key={actual}><th>{actual}<small>표본 {total}</small></th>{matrix.labels.map(predicted => {
              const count = matrix.counts[actual][predicted]; const percent = total ? count/total*100 : 0;
              return <td key={predicted} title={`${count}개 / ${total}개 (${percent.toFixed(1)}%)`} style={{background:count ? `rgba(${actual === predicted ? '79,65,218' : '223,62,81'},${.08+percent/100*.82})` : '#f5f6fb', color:percent>65?'#fff':actual===predicted?'#3f32a4':'#a62d42'}}>{total ? percent.toFixed(1) : '—'}</td>;
            })}</tr>;
          })}</tbody></table></div>
          <p className="adm-info">분류 응답 {matrix.total.toLocaleString()}개 · 모르겠어요 {matrix.unknown}개 별도 집계. 미응답·채점 대기·출제 제외 문항은 행렬에서 제외합니다.</p>
        </>}
      </RemoteState>}
    </div>
    {compact && <footer className="adm-card-foot"><span>종·클래스 구성별 집계</span><Link to="/admin/statistics/matrix">상세 혼동행렬 →</Link></footer>}
  </section>;
}
