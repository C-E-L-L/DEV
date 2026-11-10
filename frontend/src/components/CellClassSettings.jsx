import { useEffect, useState } from 'react';
import api from '../api/client';
import { CELL_KEYS } from '../constants';

export default function CellClassSettings({ species }) {
  const [speciesId,setSpeciesId] = useState(species[0]?.id || '');
  const [classes,setClasses] = useState([]);
  const [code,setCode] = useState('');
  const [name,setName] = useState('');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const reload = async () => { if (!speciesId) return; const {data}=await api.get(`/species/${speciesId}/classes`);setClasses(data); };
  useEffect(() => { if (!speciesId && species.length) setSpeciesId(species[0].id); },[species]);
  useEffect(() => { setError('');reload().catch(() => setError('클래스 목록을 불러오지 못했습니다.')); },[speciesId]);
  const save = async (item, active=item.active) => {
    setBusy(true);setError('');
    try { await api.put(`/species/${speciesId}/classes/${item.id}`, {name:item.name,active});await reload(); }
    catch(e){setError(e.response?.data?.message || '클래스를 저장하지 못했습니다.');} finally{setBusy(false);}
  };
  const add = async e => {
    e.preventDefault();setBusy(true);setError('');
    try {await api.post(`/species/${speciesId}/classes`,{code,name});setCode('');setName('');await reload();}
    catch(e){setError(e.response?.data?.message || '클래스를 추가하지 못했습니다.');}finally{setBusy(false);}
  };
  return <section className="pw-card" style={{marginTop:18}}><h3>세포 클래스 관리</h3>
    <p>변경 사항은 새로 만드는 과제에 적용됩니다. 기존 과제의 클래스와 학생 기록은 유지됩니다. 사용 중지는 새 과제의 선택지에서 제외하며 다시 활성화할 수 있습니다.</p>
    <label>동물 종 <select value={speciesId} disabled={busy} onChange={e=>setSpeciesId(e.target.value)}>{species.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <p className="pw-muted">클래스를 추가해도 AI 모델의 분류 능력이 자동으로 늘어나지는 않습니다. 추가 클래스는 교수가 직접 라벨을 지정합니다. 종별 모델 성능도 별도 검증이 필요합니다.</p>
    {classes.map(item=><div key={item.id} className="pw-upload-row"><code>{item.code}</code><input aria-label={`${item.code} 표시 이름`} disabled={busy} maxLength={100} value={item.name} onChange={e=>setClasses(v=>v.map(c=>c.id===item.id?{...c,name:e.target.value}:c))}/><small>{CELL_KEYS.includes(item.code)?'기존 AI 출력 클래스':'수동 라벨링 클래스'} · {item.active?'사용 중':'사용 중지'}</small><button disabled={busy||!item.name.trim()} onClick={()=>save(item)}>이름 저장</button><button disabled={busy} onClick={()=>save(item,!item.active)}>{item.active?'사용 중지':'다시 사용'}</button></div>)}
    <form onSubmit={add}><h4>클래스 추가</h4><div className="pw-actions"><label>고정 코드<input required pattern="[A-Za-z][A-Za-z0-9_]{0,59}" value={code} onChange={e=>setCode(e.target.value)} disabled={busy} placeholder="예: Basophil"/></label><label>표시 이름<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} disabled={busy}/></label><button disabled={busy||!speciesId}>추가</button></div></form>
    {error&&<p role="alert">{error}</p>}
  </section>;
}
