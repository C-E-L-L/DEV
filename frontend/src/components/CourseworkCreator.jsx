import { useEffect, useRef, useState } from 'react';
import { taskApi, diagnosticApi, labelingApi } from '../api';
import { imageUrl } from '../constants';
import { distributeQuestions } from '../utils/coursework';
import AuthImage from './AuthImage';
import Icon from './login/icons';
import SmearPicker from './SmearPicker';

const errorMessage = error => error?.response?.data?.message || error.message || '요청을 처리하지 못했습니다. 다시 시도해주세요.';
const KINDS = [
  ['DIAGNOSTIC', '진단평가', '정답이 있는 세포 크롭으로 학생 수준을 확인합니다.'],
  ['PRACTICE', '분류 실습', '도말을 탐지·검토하고 학생에게 세포 분류를 배정합니다.'],
];
const STEPS = ['자료 준비', '라벨 검토', '게시'];
const fileSize = bytes => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
const clamp = (value, max) => Math.min(Math.max(0, Number(value) || 0), max);
let nextKey = 0;

/**
 * New coursework form: a diagnostic from the answer pool, or a practice from smears
 * (newly uploaded, already on the server, or both). Creates a draft.
 */
export default function CourseworkCreator({ species, onCancel, onCreated, initialKind = 'DIAGNOSTIC' }) {
  const [kind, setKind] = useState(initialKind);
  const [title, setTitle] = useState('');
  const [speciesId, setSpeciesId] = useState(species.find(s => s.code === 'DOG')?.id || species[0]?.id || '');
  const [pool, setPool] = useState(null);
  const [total, setTotal] = useState(20);
  const [distribution, setDistribution] = useState({});
  // Smears of a practice: { key, source: 'upload', file, speciesId, labels, preview } or { key, source: 'server', smear }.
  const [items, setItems] = useState([]);
  const [labelMode, setLabelMode] = useState('NONE');
  const [picking, setPicking] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState(null);
  const [error, setError] = useState('');
  const previews = useRef(new Set());

  useEffect(() => {
    if (kind !== 'DIAGNOSTIC' || !speciesId) return;
    let active = true; setPool(null); setError('');
    diagnosticApi.getPoolStats(speciesId).then(({ data }) => {
      if (!active) return;
      setPool(data); const count = Math.min(20, data.totalAvailable); setTotal(count); setDistribution(distributeQuestions(count, data.availableByClass));
    }).catch(e => active && setError(errorMessage(e)));
    return () => { active = false; };
  }, [speciesId, kind]);
  useEffect(() => () => previews.current.forEach(url => URL.revokeObjectURL(url)), []);

  const uploads = items.filter(item => item.source === 'upload');
  const reused = items.filter(item => item.source === 'server');
  const addFiles = list => {
    const images = Array.from(list).filter(file => file.type.startsWith('image/'));
    if (images.length !== list.length) setError('이미지 파일만 추가할 수 있습니다.'); else setError('');
    setItems(current => [...current, ...images.map(file => {
      const preview = URL.createObjectURL(file); previews.current.add(preview);
      return { key: `upload-${nextKey++}`, source: 'upload', file, speciesId, labels: null, preview };
    })]);
  };
  const addSmears = smears => { setError(''); setItems(current => [...current, ...smears.map(smear => ({ key: `server-${smear.key}`, source: 'server', smear }))]); };
  const update = (key, patch) => setItems(current => current.map(item => (item.key === key ? { ...item, ...patch } : item)));
  const remove = target => {
    if (target.preview) { URL.revokeObjectURL(target.preview); previews.current.delete(target.preview); }
    setItems(current => current.filter(item => item.key !== target.key));
  };
  const onDrop = event => { event.preventDefault(); setDragging(false); if (!busy && event.dataTransfer.files.length) addFiles(event.dataTransfer.files); };

  const create = async event => {
    event.preventDefault(); setError(''); setBusy(true);
    let draftId = null;
    try {
      if (kind === 'DIAGNOSTIC') {
        const { data } = await diagnosticApi.createTask({ title, speciesId: Number(speciesId), totalQuestions: Number(total), classDistribution: distribution });
        draftId = data.taskId;
      } else {
        if (!items.length) throw new Error('도말 이미지를 한 장 이상 선택해주세요.');
        if (labelMode === 'FILE' && uploads.some(item => !item.labels)) throw new Error('새로 올린 각 도말의 라벨 파일을 선택해주세요.');
        // Validate every JSON file before uploading any image.
        const manifests = labelMode === 'FILE' ? await Promise.all(uploads.map(async item => JSON.parse(await item.labels.text()))) : [];
        const form = new FormData(); form.append('title', title);
        uploads.forEach(item => { form.append('files', item.file); form.append('speciesIds', item.speciesId); });
        reused.forEach(item => form.append('sourceTaskIds', item.smear.task.id));
        const { data } = await taskApi.createAssignment(form);
        draftId = data.tasks[0].taskId;
        // The server answers with the uploaded smears first, in the order they were sent.
        for (let i = 0; i < manifests.length; i++) await labelingApi.importTask(data.tasks[i].taskId, manifests[i]);
      }
      onCreated(draftId);
    } catch (e) {
      if (draftId) setSavedDraftId(draftId);
      setError(draftId ? `${errorMessage(e)} 이미지는 작성 중 과제로 저장되었습니다. 목록에서 이어서 라벨을 가져올 수 있습니다.` : errorMessage(e));
    } finally { setBusy(false); }
  };

  const diagnostic = kind === 'DIAGNOSTIC';
  const sum = Object.values(distribution).reduce((a, b) => a + b, 0);
  const validDistribution = Number(total) > 0 && sum === Number(total);
  const usedClasses = Object.values(distribution).filter(count => count > 0).length;
  const speciesName = id => species.find(s => s.id === Number(id))?.name || '—';
  const uploadBytes = uploads.reduce((bytes, item) => bytes + item.file.size, 0);
  const linked = uploads.filter(item => item.labels).length;
  const canSubmit = !busy && !savedDraftId && speciesId && (!diagnostic || (pool?.totalAvailable > 0 && validDistribution));

  return (
    <>
    <form className="prof-create" onSubmit={create}>
      <div className="prof-page-head">
        <div>
          <h1>과제 만들기</h1>
          <p>자료를 준비한 다음, 검토 화면에서 게시 여부를 결정합니다.</p>
        </div>
        <button type="button" className="prof-btn" onClick={onCancel} disabled={busy}>취소</button>
      </div>

      <ol className="prof-steps" aria-label="과제 준비 단계">
        {STEPS.map((label, index) => (
          <li key={label} className={index === 0 ? 'is-current' : ''} aria-current={index === 0 ? 'step' : undefined}>
            <span className="prof-steps__no prof-mono">{index + 1}</span>{label}
            {index === 0 && <span className="prof-badge is-indigo">진행 중</span>}
          </li>
        ))}
      </ol>

      <div className="prof-create__layout">
        <div className="prof-create__main">
          {error && (
            <div role="alert" className="prof-alert">
              <span><Icon name="info" size={15} />{error}</span>
              <button type="button" className="prof-icon-btn prof-icon-btn--sm" aria-label="알림 닫기" onClick={() => setError('')}><Icon name="close" size={15} /></button>
            </div>
          )}
          {savedDraftId && <button type="button" className="prof-btn prof-btn--primary" onClick={() => onCreated(savedDraftId)}>저장된 과제에서 라벨 가져오기 계속</button>}

          <section className="prof-card">
            <div className="prof-card__head"><h2><span className="prof-create__no prof-mono">1</span>과제 종류</h2></div>
            <fieldset className="prof-card__body prof-create__kinds" disabled={busy}>
              <legend className="prof-sr">과제 종류</legend>
              {KINDS.map(([key, label, text]) => (
                <label key={key} className={`prof-create__kind${kind === key ? ' is-selected' : ''}`}>
                  <input type="radio" name="kind" checked={kind === key} onChange={() => { setKind(key); setError(''); }} />
                  <span className="prof-create__kind-top"><strong>{label}</strong>{kind === key && <span className="prof-badge is-indigo">선택됨</span>}</span>
                  <span className="prof-create__kind-text">{text}</span>
                </label>
              ))}
            </fieldset>
          </section>

          <section className="prof-card">
            <div className="prof-card__head"><h2><span className="prof-create__no prof-mono">2</span>기본 정보</h2></div>
            <div className="prof-card__body prof-create__basics">
              <label className="prof-field">
                <span>과제 제목 <em aria-hidden="true">*</em></span>
                <input required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} disabled={busy}
                  placeholder={diagnostic ? '예: 1주차 개 혈액세포 진단평가' : '예: 2주차 고양이 말초혈액 세포 분류 실습'} />
              </label>
              <label className="prof-field">
                <span>동물 종</span>
                <select value={speciesId} onChange={e => setSpeciesId(Number(e.target.value))} disabled={busy}>
                  {species.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {!diagnostic && <small>새로 올리는 도말의 기본값입니다. 도말마다 바꿀 수 있습니다.</small>}
              </label>
            </div>
          </section>

          {diagnostic ? (
            <section className="prof-card">
              <div className="prof-card__head">
                <h2><span className="prof-create__no prof-mono">3</span>진단 문항 구성</h2>
                {pool && <span className="prof-chip-sm prof-mono">정답 크롭 {pool.totalAvailable}개</span>}
              </div>
              <fieldset className="prof-card__body" disabled={busy || !pool}>
                <legend className="prof-sr">진단 문항 구성</legend>
                {!pool ? <p role="status" className="prof-muted">서버의 정답 크롭 데이터를 확인하는 중…</p>
                  : pool.totalAvailable === 0 ? <p className="prof-create__hint is-warn"><Icon name="info" size={15} />이 동물 종에 등록된 정답 크롭 데이터가 없습니다. 서버에 데이터를 등록한 뒤 진단평가를 만들 수 있습니다.</p>
                    : <>
                      <p className="prof-create__hint"><Icon name="info" size={15} /><span><strong>사용 가능한 정답 크롭 {pool.totalAvailable}개.</strong> 클래스별 문항 수는 아래에서 직접 조정하거나 균등 배분할 수 있습니다.</span></p>
                      <div className="prof-create__total">
                        <label>전체 문항 수
                          <input className="prof-mono" aria-label="전체 문항 수" type="number" min="1" max={pool.totalAvailable} value={total} onChange={e => setTotal(e.target.value)} />
                          문항
                        </label>
                        <button type="button" className="prof-btn prof-btn--sm" onClick={() => setDistribution(distributeQuestions(total, pool.availableByClass))}>균등 배분</button>
                      </div>
                      <div className="prof-create__classes">
                        {Object.entries(pool.availableByClass).map(([label, available]) => {
                          const count = distribution[label] || 0;
                          const set = value => setDistribution(d => ({ ...d, [label]: clamp(value, available) }));
                          return (
                            <div key={label} className="prof-create__class">
                              <strong>{label}</strong>
                              <small className="prof-mono">보유 {available}개</small>
                              <div className="prof-stepper">
                                <button type="button" aria-label={`${label} 문항 줄이기`} disabled={count <= 0} onClick={() => set(count - 1)}>−</button>
                                <input className="prof-mono" aria-label={`${label} 문항 수`} type="number" min="0" max={available} value={count} onChange={e => set(e.target.value)} />
                                <button type="button" aria-label={`${label} 문항 늘리기`} disabled={count >= available} onClick={() => set(count + 1)}>+</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className={`prof-create__check${validDistribution ? ' is-ok' : ' is-warn'}`} role="status">
                        <span><Icon name={validDistribution ? 'checkCircle' : 'info'} size={15} />문항 수 확인</span>
                        <strong className="prof-mono">선택 합계 {sum} / {Number(total) || 0}문항 · {validDistribution ? '일치' : sum < Number(total) ? `${Number(total) - sum}문항 부족` : `${sum - Number(total)}문항 초과`}</strong>
                      </p>
                      <p className="prof-muted">클래스별 응답이 적으면 혼동행렬의 신뢰도가 낮을 수 있습니다. 진단 이후 분류 실습으로 보완하세요.</p>
                    </>}
              </fieldset>
            </section>
          ) : (
            <section className="prof-card">
              <div className="prof-card__head">
                <h2><span className="prof-create__no prof-mono">3</span>도말 자료 준비</h2>
                {items.length > 0 && <span className="prof-chip-sm prof-mono">도말 {items.length}장</span>}
              </div>
              <fieldset className="prof-card__body" disabled={busy}>
                <legend className="prof-sr">도말 자료 준비</legend>
                <div className="prof-create__sources">
                  <label className={`prof-create__source${dragging ? ' is-dragging' : ''}`}
                    onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
                    <input className="prof-sr" type="file" accept="image/*" multiple aria-label="도말 이미지"
                      onChange={event => { addFiles(event.target.files); event.target.value = ''; }} />
                    <span className="prof-create__source-icon"><Icon name="upload" size={20} /></span>
                    <strong>새 도말 업로드</strong>
                    <span>이미지를 끌어다 놓거나 클릭해서 선택 (여러 장 가능)</span>
                  </label>
                  <button type="button" className="prof-create__source" onClick={() => setPicking(true)}>
                    <span className="prof-create__source-icon"><Icon name="database" size={20} /></span>
                    <strong>서버 도말에서 선택</strong>
                    <span>데이터 메뉴에 있는 도말을 확정된 정답과 함께 가져옵니다.</span>
                  </button>
                </div>

                {uploads.length > 0 && (
                  <div className="prof-create__labelmode">
                    <div><strong>라벨 방식</strong><span className="prof-muted">새로 올린 도말에 정답 라벨 파일(.json)이 있는지 지정합니다.</span></div>
                    <div className="prof-tabs" role="group" aria-label="라벨 방식">
                      <button type="button" aria-pressed={labelMode === 'NONE'} onClick={() => setLabelMode('NONE')}>라벨 없음</button>
                      <button type="button" aria-pressed={labelMode === 'FILE'} onClick={() => setLabelMode('FILE')}>라벨 파일 있음</button>
                    </div>
                  </div>
                )}

                {items.length > 0 && (
                  <div className="prof-table-wrap">
                    <table className="prof-table prof-create__files">
                      <thead><tr><th scope="col">도말</th><th scope="col">출처</th><th scope="col">동물 종</th><th scope="col">라벨</th><th scope="col" className="is-right">관리</th></tr></thead>
                      <tbody>
                        {items.map(item => (item.source === 'upload' ? (
                          <tr key={item.key}>
                            <td><div className="prof-data__row-name">
                              <span className="prof-data__row-thumb"><img src={item.preview} alt="" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} /></span>
                              <span className="prof-create__file"><strong className="prof-mono" title={item.file.name}>{item.file.name}</strong><small className="prof-mono">{fileSize(item.file.size)}</small></span>
                            </div></td>
                            <td><span className="prof-badge">새 업로드</span></td>
                            <td><select aria-label={`${item.file.name} 동물 종`} value={item.speciesId} onChange={e => update(item.key, { speciesId: Number(e.target.value) })}>{species.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
                            <td>{labelMode === 'FILE'
                              ? <label className={`prof-create__json${item.labels ? ' is-set' : ''}`}>
                                <input className="prof-sr" aria-label={`${item.file.name} 라벨 파일`} type="file" accept=".json,application/json" onChange={e => { update(item.key, { labels: e.target.files[0] || null }); setError(''); }} />
                                <Icon name={item.labels ? 'checkCircle' : 'fileText'} size={14} /><span title={item.labels?.name}>{item.labels ? item.labels.name : '라벨 파일 선택'}</span>
                              </label>
                              : <span className="prof-muted">다음 화면에서 라벨링</span>}</td>
                            <td className="is-right"><button type="button" className="prof-link-btn is-danger" onClick={() => remove(item)}><Icon name="trash" size={14} />제거</button></td>
                          </tr>
                        ) : (
                          <tr key={item.key}>
                            <td><div className="prof-data__row-name">
                              <span className="prof-data__row-thumb"><AuthImage src={imageUrl.thumbnail(item.smear.key)} fallbackSrc={imageUrl.original(item.smear.key)} alt="" /></span>
                              <span className="prof-create__file"><strong className="prof-mono" title={item.smear.name}>{item.smear.name}</strong>
                                <small>{item.smear.usedCount ? `분류 실습 ${item.smear.usedCount}회 사용` : '실습에 사용한 적 없음'}</small></span>
                            </div></td>
                            <td><span className="prof-badge is-indigo">서버 자료</span></td>
                            <td>{item.smear.speciesName || '—'}</td>
                            <td><span className="prof-muted">정답 확정 <span className="prof-mono">{item.smear.labeledCount}/{item.smear.cropCount}</span> 포함</span></td>
                            <td className="is-right"><button type="button" className="prof-link-btn is-danger" onClick={() => remove(item)}><Icon name="trash" size={14} />제거</button></td>
                          </tr>
                        )))}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="prof-create__hint"><Icon name="info" size={15} />라벨이 없어도 다음 화면에서 직접 라벨링하거나, 정답 없이 게시할 수 있습니다.</p>
                <details className="prof-create__details">
                  <summary>지원 라벨 JSON 예시</summary>
                  <pre>{JSON.stringify({ annotations: [{ bbox: [90, 110, 205, 235], label: 'Segment' }] }, null, 2)}</pre>
                  <p className="prof-muted">좌표는 원본 이미지 기준 [왼쪽, 위, 오른쪽, 아래]입니다. JSON은 세포 ID 또는 바운딩박스와 라벨을 연결해야 하며, 탐지 세포와 명확하게 연결되지 않는 항목은 오류로 안내합니다.</p>
                </details>
              </fieldset>
            </section>
          )}
        </div>

        <aside className="prof-card prof-create__side" aria-label="요약">
          <div className="prof-card__head"><h2><Icon name="clipboard" size={16} />요약</h2><span className="prof-badge">임시 저장으로 생성</span></div>
          <dl className="prof-create__summary">
            <div><dt>종류</dt><dd><span className="prof-badge is-indigo">{diagnostic ? '진단평가' : '분류 실습'}</span></dd></div>
            <div className="is-stacked"><dt>과제 제목</dt><dd className={title.trim() ? '' : 'is-empty'}>{title.trim() || '제목을 입력해주세요'}</dd></div>
            {diagnostic ? <>
              <div><dt>동물 종</dt><dd>{speciesName(speciesId)}</dd></div>
              <div><dt>문항 수</dt><dd>{pool?.totalAvailable ? `${Number(total) || 0}문항 (${usedClasses}개 클래스)` : '—'}</dd></div>
              <div><dt>정답 크롭</dt><dd>{pool ? `보유 ${pool.totalAvailable}개` : '확인 중…'}</dd></div>
            </> : <>
              <div><dt>도말 수</dt><dd>{items.length ? `${items.length}장` : '선택 안 함'}</dd></div>
              {items.length > 0 && <div><dt>구성</dt><dd>새 업로드 {uploads.length} · 서버 자료 {reused.length}</dd></div>}
              {uploads.length > 0 && <div><dt>업로드 용량</dt><dd>{fileSize(uploadBytes)}</dd></div>}
              {uploads.length > 0 && labelMode === 'FILE' && <div><dt>라벨 파일</dt><dd className={linked < uploads.length ? 'is-warn' : ''}>{linked}/{uploads.length} 연결</dd></div>}
            </>}
          </dl>
          <div className="prof-create__submit">
            <button className="prof-btn prof-btn--primary" disabled={!canSubmit}>
              {busy ? '자료를 준비하고 있습니다…' : <>자료 준비 시작 <Icon name="arrowRight" size={16} /></>}
            </button>
            <p className="prof-muted">이 단계에서는 학생에게 공개되지 않습니다.</p>
          </div>
        </aside>
      </div>

    </form>
    {/* Outside the form, so Enter in the dialog's search box does not submit the coursework. */}
    {picking && <SmearPicker addedKeys={new Set(reused.map(item => item.smear.key))} onAdd={addSmears} onClose={() => setPicking(false)} />}
    </>
  );
}
