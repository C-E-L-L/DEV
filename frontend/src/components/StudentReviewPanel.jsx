import { useEffect, useMemo, useState } from 'react';
import { submissionApi } from '../api';
import { imageUrl } from '../constants';
import { answerLabel } from '../utils/cellClasses';
import AuthImage from './AuthImage';
import ImageDisplayControls, { useImageDisplaySettings } from './ImageDisplayControls';
import SpeciesBadge from './SpeciesBadge';

const STATUS_META = {
  GRADED: { label: '채점 완료', background: '#d4edda', color: '#155724' },
  DEADLINE_PASSED: { label: '마감', background: '#f8d7da', color: '#842029' },
  DIAGNOSTIC_COMPLETED: { label: '진단평가 완료', background: '#dbeafe', color: '#1e40af' },
};

function resultMeta(cell) {
  if (cell.isCorrect === true) return { label: '정답', color: '#155724', border: '#28a745', background: '#f1f9f3', order: 2 };
  if (cell.isCorrect === false) return { label: '오답', color: '#842029', border: '#dc3545', background: '#fff5f5', order: 0 };
  return { label: '채점 대기', color: '#856404', border: '#ffc107', background: '#fffbeb', order: 1 };
}

function ReviewSummary({ review }) {
  const values = [
    ['정확도', review.accuracy == null ? 'N/A' : `${review.accuracy}%`, '#4f46e5'],
    ['정답', review.correct, '#28a745'],
    ['오답', review.wrong, '#dc3545'],
    ['채점 대기', review.pendingAnswers, '#856404'],
    ['미제출', review.unsubmittedCells, '#64748b'],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginBottom: '18px' }}>
      {values.map(([label, value, color]) => (
        <div key={label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '13px', textAlign: 'center' }}>
          <div style={{ color, fontSize: '22px', fontWeight: '800' }}>{value}</div>
          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '3px' }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function ReviewDetail({ review, selectedIndex, onSelectIndex, onBack }) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });
  const cell = review.cells[selectedIndex] || review.cells[0];
  const meta = cell ? resultMeta(cell) : null;
  const smearGroups = useMemo(() => {
    const groups = new Map();
    review.cells.forEach((item, index) => {
      const name = item.originalSmearFilename || '진단평가';
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push({ item, index });
    });
    return [...groups.entries()];
  }, [review]);
  const activeSmearFilename = review.scopeType === 'DIAGNOSTIC' ? null : cell?.originalSmearFilename;
  const imageDisplay = useImageDisplaySettings(activeSmearFilename || `${review.scopeType}-${review.scopeId}`);
  const activeSmearIndex = Math.max(0, smearGroups.findIndex(([name]) => name === activeSmearFilename));
  const activeSmearCells = smearGroups[activeSmearIndex]?.[1] || [];

  useEffect(() => {
    setImageSize({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });
  }, [activeSmearFilename]);

  const selectSmear = (index) => {
    const target = smearGroups[index]?.[1]?.[0];
    if (target) onSelectIndex(target.index);
  };

  const getScaledBbox = (bboxValue) => {
    try {
      const values = Array.isArray(bboxValue) ? bboxValue : JSON.parse(String(bboxValue).replace(/'/g, '"'));
      const [x1, y1, x2, y2] = values.map(Number);
      if (!imageSize.naturalWidth || !imageSize.naturalHeight) return { left: 0, top: 0, width: 0, height: 0 };
      const scaleX = imageSize.width / imageSize.naturalWidth;
      const scaleY = imageSize.height / imageSize.naturalHeight;
      return { left: x1 * scaleX, top: y1 * scaleY, width: (x2 - x1) * scaleX, height: (y2 - y1) * scaleY };
    } catch {
      return { left: 0, top: 0, width: 0, height: 0 };
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
        <div>
          <button type="button" onClick={onBack} style={backButtonStyle}>← 목록으로</button>
          <h3 style={{ display: 'inline', marginLeft: '12px' }}>{review.title}</h3>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          제출 {review.answeredCells}/{review.totalCells}
          {review.deadlineAt && ` · 마감 ${new Date(review.deadlineAt).toLocaleString('ko-KR')}`}
        </div>
      </div>
      <ReviewSummary review={review} />
      <div style={{ display: 'flex', gap: '20px', minHeight: '65vh', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {review.scopeType !== 'DIAGNOSTIC' && (
          <div style={{ flex: '2 1 720px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ ...darkHeaderStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <span>혈액 도말 이미지</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {smearGroups.length > 1 && (
                  <>
                  <button type="button" onClick={() => selectSmear(activeSmearIndex - 1)} disabled={activeSmearIndex <= 0} style={{ ...smearNavButtonStyle, opacity: activeSmearIndex <= 0 ? 0.4 : 1 }}>◀ 이전 도말</button>
                  <span style={{ fontSize: '12px' }}>도말 {activeSmearIndex + 1} / {smearGroups.length}</span>
                  <button type="button" onClick={() => selectSmear(activeSmearIndex + 1)} disabled={activeSmearIndex >= smearGroups.length - 1} style={{ ...smearNavButtonStyle, opacity: activeSmearIndex >= smearGroups.length - 1 ? 0.4 : 1 }}>다음 도말 ▶</button>
                  </>
                )}
                <ImageDisplayControls settings={imageDisplay.settings} onChange={imageDisplay.updateSetting} onReset={imageDisplay.resetSettings} />
              </span>
            </div>
            <div style={{ padding: '15px', overflow: 'auto', maxHeight: 'calc(100vh - 280px)', background: '#f8fafc' }}>
              <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                {activeSmearFilename && (
                  <AuthImage
                    key={activeSmearFilename}
                    src={imageUrl.original(activeSmearFilename)}
                    alt="Blood Smear"
                    onLoad={(event) => setImageSize({ width: event.target.clientWidth, height: event.target.clientHeight, naturalWidth: event.target.naturalWidth, naturalHeight: event.target.naturalHeight })}
                    style={{ width: '100%', maxWidth: '100%', maxHeight: 'calc(100vh - 320px)', height: 'auto', objectFit: 'contain', display: 'block', filter: imageDisplay.filter }}
                    loadingText="도말 이미지를 불러오는 중..."
                    errorText="도말 이미지를 불러오지 못했습니다."
                    placeholderStyle={{ minWidth: '620px', minHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontSize: '14px', fontWeight: '600' }}
                  />
                )}
                {activeSmearCells.map(({ item, index }) => {
                  const bbox = getScaledBbox(item.bbox);
                  const itemMeta = resultMeta(item);
                  const selected = index === selectedIndex;
                  return (
                    <button
                      key={item.cropId}
                      type="button"
                      title={`Cell #${index + 1} · 내 답 ${answerLabel(item.studentLabel)} · 실제 정답 ${item.correctLabel || '채점 대기'}`}
                      onClick={() => onSelectIndex(index)}
                      style={{
                        position: 'absolute', left: bbox.left, top: bbox.top, width: bbox.width, height: bbox.height,
                        padding: 0, border: selected ? '3px solid #4f46e5' : `2px solid ${itemMeta.border}`,
                        background: selected ? 'rgba(79,70,229,0.14)' : 'transparent', cursor: 'pointer', boxSizing: 'border-box',
                      }}
                    >
                      <span style={{ position: 'absolute', top: '-18px', left: 0, padding: '1px 4px', borderRadius: '2px', background: selected ? '#4f46e5' : itemMeta.border, color: '#fff', fontSize: '10px', fontWeight: '800' }}>#{index + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div style={{ flex: review.scopeType === 'DIAGNOSTIC' ? '1 1 100%' : '1 1 380px', minWidth: '340px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', maxHeight: '330px' }}>
            <div style={darkHeaderStyle}>감지된 세포 목록</div>
            <div style={{ padding: '10px', overflowY: 'auto', maxHeight: '275px' }}>
              {smearGroups.map(([name, items], groupIndex) => (
                <div key={name} style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', margin: '2px 0 6px' }}>
                    {review.scopeType === 'DIAGNOSTIC' ? '진단평가' : `도말 #${groupIndex + 1}`} · {name}{' '}
                    <SpeciesBadge name={items[0]?.item?.speciesName} code={items[0]?.item?.speciesCode} compact />
                  </div>
                  {items.map(({ item, index }) => {
                    const itemMeta = resultMeta(item);
                    return (
                      <button key={item.cropId} type="button" onClick={() => onSelectIndex(index)} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '7px', marginBottom: '5px',
                        border: `1px solid ${index === selectedIndex ? '#4f46e5' : '#e2e8f0'}`, borderLeft: `4px solid ${index === selectedIndex ? '#4f46e5' : 'transparent'}`,
                        borderRadius: '6px', background: index === selectedIndex ? '#eef2ff' : '#fff', cursor: 'pointer', textAlign: 'left',
                      }}>
                        <AuthImage src={imageUrl.crop(item.cropFilename)} alt={`Cell ${index + 1}`} style={{ width: '46px', height: '46px', objectFit: 'contain', borderRadius: '4px', background: '#f8fafc', flexShrink: 0, filter: review.scopeType === 'DIAGNOSTIC' || item.originalSmearFilename === activeSmearFilename ? imageDisplay.filter : 'none' }} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ display: 'block', fontSize: '13px' }}>Cell #{index + 1}</strong>
                          <span style={{ display: 'block', marginTop: '3px', fontSize: '11px', color: '#334155' }}>내 답: <strong>{answerLabel(item.studentLabel)}</strong></span>
                          <span style={{ display: 'block', marginTop: '1px', fontSize: '11px', color: itemMeta.color }}>실제 정답: <strong>{item.correctLabel || '채점 대기'}</strong></span>
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: itemMeta.color }}>{itemMeta.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {cell && (
            <div style={{ background: '#fff', border: `2px solid ${meta.border}`, borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ ...darkHeaderStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span>세포 분류 결과</span>
                {review.scopeType === 'DIAGNOSTIC' && <ImageDisplayControls settings={imageDisplay.settings} onChange={imageDisplay.updateSetting} onReset={imageDisplay.resetSettings} />}
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <SpeciesBadge name={cell.speciesName} code={cell.speciesCode} compact />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                  <button type="button" disabled={selectedIndex <= 0} onClick={() => onSelectIndex(selectedIndex - 1)} style={{ ...circleButtonStyle, opacity: selectedIndex <= 0 ? 0.35 : 1 }}>◀</button>
                  <AuthImage
                    src={imageUrl.crop(cell.cropFilename)}
                    alt="selected cell"
                    style={{ width: '180px', height: '180px', objectFit: 'contain', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', filter: imageDisplay.filter }}
                    loadingText="세포 이미지 로딩 중..."
                    errorText="세포 이미지를 불러오지 못했습니다."
                    placeholderStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '10px', boxSizing: 'border-box' }}
                  />
                  <button type="button" disabled={selectedIndex >= review.cells.length - 1} onClick={() => onSelectIndex(selectedIndex + 1)} style={{ ...circleButtonStyle, opacity: selectedIndex >= review.cells.length - 1 ? 0.35 : 1 }}>▶</button>
                </div>
                <div style={{ textAlign: 'center', marginBottom: '13px' }}>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>Cell #{selectedIndex + 1} / {review.cells.length}</div>
                  <span style={{ display: 'inline-block', marginTop: '7px', padding: '4px 9px', borderRadius: '999px', background: meta.background, color: meta.color, fontWeight: '800', fontSize: '12px' }}>{meta.label}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'stretch' }}>
                  <div style={{ ...answerBoxStyle, background: '#eef2ff', borderColor: '#c7d2fe' }}>
                    <span style={answerLabelStyle}>내가 고른 답</span><strong>{answerLabel(cell.studentLabel)}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: '20px' }}>→</div>
                  <div style={{ ...answerBoxStyle, background: cell.correctLabel ? '#f1f9f3' : '#fffbeb', borderColor: cell.correctLabel ? '#8fd19e' : '#ffc107' }}>
                    <span style={answerLabelStyle}>실제 정답 (GT)</span><strong>{cell.correctLabel || '채점 대기'}</strong>
                  </div>
                </div>
                <div style={{ marginTop: '11px', padding: '8px', borderRadius: '6px', background: '#f8fafc', color: '#64748b', textAlign: 'center', fontSize: '11px' }}>
                  제출이 잠긴 학습 결과로 답변을 수정할 수 없습니다.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Published results of the student.
 * Optional deep link (from the dashboard): `initialReview` ("ASSIGNMENT-2") opens that coursework,
 * `initialCropId` selects a cell in it, `initialFocus="wrong"` starts at its first wrong answer and
 * `initialView="wrong"` opens the cell list filtered to wrong answers.
 */
export default function StudentReviewPanel({ initialReview, initialCropId, initialFocus, initialView }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subTab, setSubTab] = useState('tasks');
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedCellIndex, setSelectedCellIndex] = useState(0);
  const [cellFilter, setCellFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    submissionApi.getMyReviews()
      .then(({ data }) => setReviews(data.reviews || []))
      .catch(() => setError('학습 결과를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const [linkApplied, setLinkApplied] = useState(false);
  useEffect(() => {
    if (loading || linkApplied) return;
    setLinkApplied(true);
    if (initialView === 'wrong') { setSubTab('cells'); setCellFilter('wrong'); return; }
    const review = reviews.find(item => `${item.scopeType}-${item.scopeId}` === initialReview);
    if (!review) return;
    const find = test => Math.max(0, review.cells.findIndex(test));
    const index = initialCropId != null ? find(cell => String(cell.cropId) === String(initialCropId))
      : initialFocus === 'wrong' ? find(cell => cell.isCorrect === false) : 0;
    setSubTab('tasks');
    setSelectedReview(review);
    setSelectedCellIndex(index);
  }, [loading, linkApplied, reviews, initialReview, initialCropId, initialFocus, initialView]);

  const allCells = useMemo(() => reviews.flatMap((review) =>
    review.cells.map((cell, index) => ({ review, cell, index, meta: resultMeta(cell) }))
  ).sort((a, b) => a.meta.order - b.meta.order), [reviews]);
  const filteredCells = allCells.filter(({ cell }) =>
    cellFilter === 'all'
      || (cellFilter === 'correct' && cell.isCorrect === true)
      || (cellFilter === 'wrong' && cell.isCorrect === false)
      || (cellFilter === 'pending' && cell.isCorrect == null)
  );

  const openCell = (review, index) => {
    setSelectedReview(review);
    setSelectedCellIndex(index);
    setSubTab('tasks');
  };

  if (loading) return <div style={emptyStyle}>학습 결과를 불러오는 중입니다...</div>;
  if (error) return <div style={{ ...emptyStyle, color: '#dc3545' }}>{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <button type="button" onClick={() => { setSubTab('tasks'); setSelectedReview(null); }} style={subTab === 'tasks' ? activeTabStyle : inactiveTabStyle}>과제별</button>
        <button type="button" onClick={() => { setSubTab('cells'); setSelectedReview(null); }} style={subTab === 'cells' ? activeTabStyle : inactiveTabStyle}>세포별</button>
      </div>

      {subTab === 'tasks' && selectedReview && (
        <ReviewDetail review={selectedReview} selectedIndex={selectedCellIndex} onSelectIndex={setSelectedCellIndex} onBack={() => setSelectedReview(null)} />
      )}

      {subTab === 'tasks' && !selectedReview && (
        reviews.length === 0 ? <div style={emptyStyle}>아직 확인할 수 있는 학습 결과가 없습니다.</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reviews.map((review) => {
              const status = STATUS_META[review.availabilityReason] || STATUS_META.GRADED;
              return (
                <button key={`${review.scopeType}-${review.scopeId}`} type="button" onClick={() => { setSelectedReview(review); setSelectedCellIndex(0); }} style={reviewCardStyle}>
                  <AuthImage
                    src={review.scopeType === 'DIAGNOSTIC' ? imageUrl.crop(review.thumbnailFilename) : imageUrl.thumbnail(review.thumbnailFilename)}
                    fallbackSrc={review.scopeType === 'DIAGNOSTIC' ? undefined : imageUrl.original(review.thumbnailFilename)}
                    alt={review.title}
                    style={{ width: '88px', height: '68px', objectFit: review.scopeType === 'DIAGNOSTIC' ? 'contain' : 'cover', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}
                  />
                  <span style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                    <span style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>{review.title}</strong>
                      <SpeciesBadge name={review.cells?.[0]?.speciesName} code={review.cells?.[0]?.speciesCode} compact />
                      <span style={{ padding: '4px 7px', borderRadius: '999px', background: status.background, color: status.color, fontSize: '10px', fontWeight: '800' }}>{status.label}</span>
                    </span>
                    <span style={{ display: 'block', marginTop: '7px', color: '#64748b', fontSize: '12px' }}>
                      제출 {review.answeredCells}/{review.totalCells} · 정답 {review.correct} · 오답 {review.wrong}
                    </span>
                    {(review.pendingAnswers > 0 || review.unsubmittedCells > 0) && <span style={{ display: 'block', marginTop: '6px', color: '#856404', fontSize: '11px' }}>채점 대기 {review.pendingAnswers} · 미제출 {review.unsubmittedCells}</span>}
                    {review.deadlineAt && <span style={{ display: 'block', marginTop: '5px', color: '#64748b', fontSize: '11px' }}>마감 {new Date(review.deadlineAt).toLocaleString('ko-KR')}</span>}
                  </span>
                  <span style={{ minWidth: '82px', textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ display: 'block', color: '#64748b', fontSize: '11px', marginBottom: '3px' }}>정확도</span>
                    <strong style={{ display: 'block', color: review.accuracy == null ? '#64748b' : '#4f46e5', fontSize: '20px' }}>{review.accuracy == null ? 'N/A' : `${review.accuracy}%`}</strong>
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '13px', flexShrink: 0 }}>▶</span>
                </button>
              );
            })}
          </div>
        )
      )}

      {subTab === 'cells' && (
        <div>
          <div style={{ display: 'flex', gap: '7px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {[['all', '전체'], ['wrong', '오답'], ['correct', '정답'], ['pending', '채점 대기']].map(([key, label]) => (
              <button key={key} type="button" onClick={() => setCellFilter(key)} style={cellFilter === key ? filterActiveStyle : filterStyle}>{label}</button>
            ))}
          </div>
          {filteredCells.length === 0 ? <div style={emptyStyle}>조건에 맞는 세포가 없습니다.</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
              {filteredCells.map(({ review, cell, index, meta }) => (
                <button key={`${review.scopeType}-${review.scopeId}-${cell.cropId}`} type="button" onClick={() => openCell(review, index)} style={{ ...cellCardStyle, borderColor: meta.border }}>
                  <AuthImage src={imageUrl.crop(cell.cropFilename)} alt="cell" style={{ width: '76px', height: '76px', objectFit: 'contain', borderRadius: '6px', background: '#f8fafc', flexShrink: 0 }} />
                  <span style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                    <strong style={{ display: 'block', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.title}</strong>
                    <SpeciesBadge name={cell.speciesName} code={cell.speciesCode} compact style={{ marginTop: '5px' }} />
                    <span style={{ display: 'block', marginTop: '7px', fontSize: '12px', color: '#334155' }}>내 답: <strong>{answerLabel(cell.studentLabel)}</strong></span>
                    <span style={{ display: 'block', marginTop: '2px', fontSize: '12px', color: meta.color }}>GT: <strong>{cell.correctLabel || '채점 대기'}</strong></span>
                    <span style={{ display: 'block', marginTop: '5px', fontSize: '11px', fontWeight: '800', color: meta.color }}>{meta.label}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const darkHeaderStyle = { background: '#f8fafc', color: '#0f172a', borderBottom: '1px solid #e2e8f0', padding: '10px 14px', fontSize: '13px', fontWeight: '700' };
const backButtonStyle = { padding: '7px 11px', border: '1px solid #e2e8f0', borderRadius: '5px', background: '#fff', color: '#334155', cursor: 'pointer', fontWeight: '600' };
const circleButtonStyle = { width: '38px', height: '38px', borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' };
const smearNavButtonStyle = { padding: '5px 9px', border: '1px solid #e2e8f0', borderRadius: '5px', background: '#fff', color: '#334155', cursor: 'pointer', fontSize: '11px', fontWeight: '700' };
const answerBoxStyle = { padding: '15px', border: '1px solid', borderRadius: '8px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' };
const answerLabelStyle = { color: '#64748b', fontSize: '12px' };
const activeTabStyle = { padding: '7px 14px', border: '1px solid #4338ca', borderRadius: '8px', background: '#4f46e5', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const inactiveTabStyle = { ...activeTabStyle, border: '1px solid #e2e8f0', background: '#fff', color: '#334155' };
const reviewCardStyle = { width: '100%', padding: '13px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', cursor: 'pointer', boxShadow: '0 1px 2px rgba(15,23,42,0.03)', display: 'flex', alignItems: 'center', gap: '14px' };
const cellCardStyle = { display: 'flex', gap: '11px', alignItems: 'center', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer' };
const filterStyle = { padding: '6px 11px', border: '1px solid #e2e8f0', borderRadius: '999px', background: '#fff', color: '#334155', cursor: 'pointer', fontSize: '12px', fontWeight: '600' };
const filterActiveStyle = { ...filterStyle, background: '#eef2ff', borderColor: '#c7d2fe', color: '#4338ca' };
const emptyStyle = { padding: '55px 20px', textAlign: 'center', color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' };
