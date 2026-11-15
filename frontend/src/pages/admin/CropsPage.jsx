import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api';
import AuthImage from '../../components/AuthImage';
import { imageUrl } from '../../constants';
import { Dialog, RemoteState, useRemote } from '../../components/console/ConsoleUI';
import { useProfessorData } from '../professor/ProfessorData';

export default function CropsPage() {
  const request = useRemote(adminApi.getCrops);
  const { tasks, species } = useProfessorData();
  const [query,setQuery]=useState(''), [status,setStatus]=useState(''), [speciesId,setSpeciesId]=useState('');
  const [page,setPage]=useState(1), [selected,setSelected]=useState(null);
  const taskById=useMemo(()=>new Map(tasks.map(t=>[t.id,t])),[tasks]);
  const filtered=(request.data||[]).filter(c=>(!status || (status==='COMPLETE'?c.hasLabel:!c.hasLabel)) && (!speciesId || String(c.speciesId)===speciesId) && `${c.cropFilename} ${c.originalSmearFilename||''} ${taskById.get(c.taskId)?.uploadedFilename||''} ${c.cropId}`.toLowerCase().includes(query.toLowerCase().trim()));
  const pages=Math.max(1,Math.ceil(filtered.length/30)), current=Math.min(page,pages);
  const onFilter=(setter,value)=>{setter(value);setPage(1);};
  return <><div className="prof-page-head"><div><span className="adm-eyebrow">CELL INVENTORY</span><h1>세포 데이터</h1><p>세포 이미지와 GT·Pseudo·확정 라벨을 확인합니다.</p></div><button className="prof-btn" onClick={request.reload}>새로고침</button></div>
    <section className="adm-card"><div className="adm-filters"><input aria-label="세포 검색" placeholder="파일명·원본 도말·세포 ID 검색" value={query} onChange={e=>onFilter(setQuery,e.target.value)}/><select aria-label="세포 라벨 상태" value={status} onChange={e=>onFilter(setStatus,e.target.value)}><option value="">전체 상태</option><option value="COMPLETE">라벨 있음</option><option value="PENDING">라벨 없음</option></select><select aria-label="세포 동물 종" value={speciesId} onChange={e=>onFilter(setSpeciesId,e.target.value)}><option value="">전체 동물 종</option>{species.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <RemoteState state={request} empty={!filtered.length}><div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>세포</th><th>자료 / 도말</th><th>동물 종</th><th>GT</th><th>Pseudo</th><th>확정 라벨</th><th>검토</th></tr></thead><tbody>{filtered.slice((current-1)*30,current*30).map(c=>{const task=taskById.get(c.taskId);return <tr key={c.cropId}><td><button className="adm-thumb-button" onClick={()=>setSelected(c)}><AuthImage src={imageUrl.crop(c.cropFilename)} alt={`세포 ${c.cropId}`} style={{width:52,height:52,objectFit:'contain'}}/></button></td><td><strong>세포 #{c.cropId}</strong><small className="adm-cell-file">{task?.uploadedFilename||c.originalSmearFilename||'도말 정보 없음'} · 과제 #{c.taskId}</small></td><td>{c.speciesName||'—'}</td><td>{c.gtLabel||'—'}</td><td>{c.pseudoLabel||'—'}</td><td>{c.finalLabel||'미확정'}</td><td><Link to={`/admin/assignments/${c.taskId}/${task?.status==='DRAFT'?'edit':'results'}`}>열기 →</Link></td></tr>;})}</tbody></table></div></RemoteState>
      <footer className="adm-card-foot"><span>{request.data&&!request.error?`${filtered.length}개 세포`:''}</span><div className="adm-pagination"><button disabled={current<=1} onClick={()=>setPage(current-1)}>이전</button><span>{current} / {pages}</span><button disabled={current>=pages} onClick={()=>setPage(current+1)}>다음</button></div></footer>
    </section>{selected&&<Dialog title={`세포 #${selected.cropId}`} onClose={()=>setSelected(null)}><AuthImage src={imageUrl.crop(selected.cropFilename)} alt={`세포 ${selected.cropId}`} style={{width:'100%',height:300,objectFit:'contain'}}/><p>GT: {selected.gtLabel||'—'} · Pseudo: {selected.pseudoLabel||'—'} · 확정: {selected.finalLabel||'미확정'}</p><code className="adm-cell-file">{selected.cropFilename}</code></Dialog>}
  </>;
}
