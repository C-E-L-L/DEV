import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { courseworkApi } from '../api/coursework';
import { imageUrl } from '../constants';
import { filterLibrary, smearLibrary } from '../utils/smearData';
import AuthImage from './AuthImage';
import { Dialog } from './console/ConsoleUI';
import Icon from './login/icons';
import './Announcements.css'; // the shared dialog styles live here

const USAGE = [['ALL', '전체'], ['UNUSED', '실습에 쓴 적 없음'], ['USED', '실습에 쓴 적 있음']];
const errorMessage = error => error?.response?.data?.message || error.message || '도말 목록을 불러오지 못했습니다.';

/**
 * Dialog for choosing smears that are already on the server (the 데이터 menu) for a new practice coursework.
 * `addedKeys`: images already in the coursework. `onAdd` receives the chosen library entries.
 */
export default function SmearPicker({ addedKeys, onAdd, onClose }) {
  const [library, setLibrary] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [speciesId, setSpeciesId] = useState('');
  const [usage, setUsage] = useState('ALL');
  const [selected, setSelected] = useState(() => new Set());

  useEffect(() => {
    let active = true;
    courseworkApi.data()
      .then(({ data }) => { if (active) setLibrary(smearLibrary(data)); })
      .catch(e => { if (active && !axios.isCancel(e)) setError(errorMessage(e)); });
    return () => { active = false; };
  }, []);

  const species = useMemo(() => {
    const byId = new Map();
    (library || []).forEach(item => { if (item.speciesId != null) byId.set(item.speciesId, item.speciesName); });
    return [...byId].map(([id, name]) => ({ id, name }));
  }, [library]);
  const shown = useMemo(() => filterLibrary(library || [], { query, speciesId, usage }), [library, query, speciesId, usage]);
  const toggle = key => setSelected(current => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  const add = () => { onAdd(library.filter(item => selected.has(item.key))); onClose(); };

  return (
    <Dialog title="서버 도말에서 선택" onClose={onClose} wide>
      <div className="prof-picker">
        <div className="prof-picker__filters">
          <label className="prof-data__search">
            <Icon name="search" size={15} />
            <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="파일명, 과제명 검색" aria-label="도말 검색" />
          </label>
          <label className="prof-select">
            <span className="prof-sr">동물 종</span>
            <select value={speciesId} onChange={event => setSpeciesId(event.target.value)}>
              <option value="">동물 종: 전체</option>
              {species.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <div className="prof-tabs" role="group" aria-label="분류 실습 사용 이력">
            {USAGE.map(([key, label]) => <button key={key} type="button" aria-pressed={usage === key} onClick={() => setUsage(key)}>{label}</button>)}
          </div>
        </div>

        <div className="prof-picker__list">
          {error ? <p role="alert" className="prof-alert">{error}</p>
            : !library ? <p role="status" className="prof-empty">도말 목록을 불러오는 중…</p>
              : !library.length ? <p className="prof-empty">서버에 올라온 도말이 아직 없습니다. 새 도말을 업로드해주세요.</p>
                : !shown.length ? <p className="prof-empty">조건에 맞는 도말이 없습니다.</p>
                  : (
                    <ul className="prof-picker__grid">
                      {shown.map(item => {
                        const added = addedKeys.has(item.key);
                        const checked = added || selected.has(item.key);
                        return (
                          <li key={item.key}>
                            <label className={`prof-picker__item${checked ? ' is-selected' : ''}${added ? ' is-added' : ''}`}>
                              <span className="prof-picker__thumb">
                                <AuthImage src={imageUrl.thumbnail(item.key)} fallbackSrc={imageUrl.original(item.key)} alt="" />
                                <input type="checkbox" className="prof-check" checked={checked} disabled={added} onChange={() => toggle(item.key)} aria-label={`${item.name} 선택`} />
                                {item.speciesName && <span className="prof-data__species">{item.speciesName}</span>}
                              </span>
                              <span className="prof-picker__body">
                                <strong className="prof-mono" title={item.name}>{item.name}</strong>
                                <span className="prof-muted">세포 <span className="prof-mono">{item.cropCount}</span>개 · 정답 확정 <span className="prof-mono">{item.labeledCount}/{item.cropCount}</span></span>
                                {added ? <span className="prof-badge is-indigo">이 과제에 추가됨</span>
                                  : item.usedCount
                                    ? <span className="prof-picker__usage" title={item.usedTitles.join(', ')}><span className="prof-badge is-amber">실습 {item.usedCount}회 사용</span><span>{item.usedTitles[0]}</span></span>
                                    : <span className="prof-picker__usage"><span className="prof-badge is-emerald">사용한 적 없음</span></span>}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
        </div>

        <div className="prof-picker__foot">
          <span className="prof-muted">
            {selected.size ? <><strong className="prof-mono">{selected.size}</strong>개 선택됨 · 확정된 정답도 함께 가져옵니다.</> : '가져올 도말을 선택하세요. 원본 과제와 학생 기록은 바뀌지 않습니다.'}
          </span>
          <div className="prof-actions">
            <button type="button" className="prof-btn" onClick={onClose}>취소</button>
            <button type="button" className="prof-btn prof-btn--primary" disabled={!selected.size} onClick={add}>
              {selected.size ? `도말 ${selected.size}개 추가` : '도말 추가'}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
