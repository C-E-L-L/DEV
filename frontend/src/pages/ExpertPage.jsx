import { useState, useEffect, useRef, useCallback } from 'react';
import { taskApi, diagnosticApi, speciesApi } from '../api';
import { CELL_KEYS, imageUrl } from '../constants';
import { fetchAuthImage } from '../utils/fetchAuthImage';
import SpeciesBadge from '../components/SpeciesBadge';
import SpeciesSelector from '../components/SpeciesSelector';
import SpeciesDataSettings from '../components/SpeciesDataSettings';
import AnalyticsFeedback from '../components/AnalyticsFeedback';

/* ──────────────── 과제 마감 시간 기본값 ──────────────── */
function getMinimumDeadlineValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const CLASS_COLORS = {
  Segment:     '#4dabf7',
  Band:        '#ff922b',
  Lymphocyte:  '#51cf66',
  Monocyte:    '#cc5de8',
  Eosinophil:  '#ff6b6b',
  NucleatedRBC:'#20c997',
};

function emptyDistribution() {
  return CELL_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
}

function autoDistributeByTotal(total, availableByClass) {
  const target = Math.max(0, Number(total) || 0);
  const result = emptyDistribution();
  if (target === 0) return result;

  let assigned = 0;
  while (assigned < target) {
    let progressed = false;
    for (const key of CELL_KEYS) {
      const max = Number(availableByClass?.[key] || 0);
      if (result[key] < max) {
        result[key] += 1;
        assigned += 1;
        progressed = true;
        if (assigned >= target) break;
      }
    }
    if (!progressed) break;
  }
  return result;
}

export default function ExpertPage() {
  const [activeTab, setActiveTab] = useState(2);

  /* ── Tab 1: Assignment Creation ── */
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [uploadingImageIndex, setUploadingImageIndex] = useState(0);
  const [formErrors, setFormErrors] = useState({ title: false, files: false });
  const [species, setSpecies] = useState([]);
  const [fileSpeciesIds, setFileSpeciesIds] = useState([]);
  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const [selectedResultTaskIndex, setSelectedResultTaskIndex] = useState(0);

  const loadSpecies = useCallback(async () => {
    try {
      const { data } = await speciesApi.getAll();
      setSpecies(data || []);
      const defaultSpeciesId = data?.find(item => item.code === 'DOG')?.id || data?.[0]?.id || null;
      setFileSpeciesIds(current => current.map(id => id || defaultSpeciesId));
    } catch (error) {
      console.error('동물 종 목록 조회 실패:', error);
    }
  }, []);

  const handleSpeciesSaved = useCallback((savedSpecies) => {
    setSpecies(current => {
      const exists = current.some(item => item.id === savedSpecies.id);
      const next = exists
        ? current.map(item => item.id === savedSpecies.id ? savedSpecies : item)
        : [...current, savedSpecies];
      return next.sort((a, b) => Number(b.builtIn) - Number(a.builtIn)
        || a.name.localeCompare(b.name, 'ko'));
    });
  }, []);

  useEffect(() => { loadSpecies(); }, [loadSpecies]);

  useEffect(() => {
    if (activeTab === 4) loadSpecies();
  }, [activeTab, loadSpecies]);

  /* 다른 탭에 갔다 오면 이전 분석 결과는 지우고 초기 화면으로 되돌린다 */
  useEffect(() => {
    if (activeTab === 1) return;
    setUploadResult(null);
    setSelectedResultTaskIndex(0);
    setAssignmentDeadline('');
    setFormErrors({ title: false, files: false });
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 1) return;
    if (!uploadResult || !resultCanvasRef.current) return;
    const tasks = uploadResult.tasks || [];
    if (tasks.length === 0) return;
    const taskResult = tasks[selectedResultTaskIndex] || tasks[0];
    const canvas = resultCanvasRef.current;
    const ctx = canvas.getContext('2d');
    let cancelled = false;

    fetchAuthImage(imageUrl.original(taskResult.originalImage))
      .then(url => {
        if (cancelled) { URL.revokeObjectURL(url); return; }
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          if (cancelled) return;
          const maxWidth = 860;
          const scale = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scale;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          (taskResult.crops || []).forEach((crop) => {
            if (!crop.bbox) return;
            const bbox = JSON.parse(crop.bbox.replace(/'/g, '"'));
            const [x1, y1, x2, y2] = bbox;
            const color = CLASS_COLORS[crop.pseudoLabel] || '#adb5bd';
            const sx = x1 * scale, sy = y1 * scale;
            const sw = (x2 - x1) * scale, sh = (y2 - y1) * scale;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(sx, sy, sw, sh);
            const label = crop.pseudoLabel || '?';
            const conf = crop.aiClassificationConfidence != null
              ? ` ${Math.round(crop.aiClassificationConfidence * 100)}%` : '';
            const text = label + conf;
            ctx.font = 'bold 12px Arial';
            const tw = ctx.measureText(text).width;
            ctx.fillStyle = color;
            ctx.fillRect(sx, sy - 17, tw + 8, 17);
            ctx.fillStyle = '#fff';
            ctx.fillText(text, sx + 4, sy - 4);
          });
        };
        img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [activeTab, uploadResult, selectedResultTaskIndex]);

  const UPLOAD_STEPS = [
    { icon: '📤', label: '이미지 서버에 전송 중...' },
    { icon: '🔍', label: 'YOLO: 세포 영역 탐지 중...' },
    { icon: '🧬', label: 'DenseNet: 세포 분류 중...' },
    { icon: '💾', label: '과제 데이터 저장 중...' },
  ];

  useEffect(() => {
    if (!uploading) { setUploadStep(0); return; }
    setUploadStep(1);
    const t1 = setTimeout(() => setUploadStep(2), 1500);
    const t2 = setTimeout(() => setUploadStep(3), 4000);
    const t3 = setTimeout(() => setUploadStep(4), 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [uploading]);

  /* ── Diagnostic Evaluation ── */
  const [poolStats, setPoolStats] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [classDistribution, setClassDistribution] = useState(emptyDistribution);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticCreating, setDiagnosticCreating] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [diagnosticError, setDiagnosticError] = useState('');

  /* ── Canvas ── */
  const resultCanvasRef = useRef(null);

  useEffect(() => {
    if (activeTab !== 3) return;
    setDiagnosticLoading(true);
    diagnosticApi.getPoolStats()
      .then(({ data }) => {
        setPoolStats(data);
        const initialTotal = Math.min(20, data.totalAvailable || 0);
        setTotalQuestions(initialTotal);
        setClassDistribution(autoDistributeByTotal(initialTotal, data.availableByClass || {}));
      })
      .catch(() => setDiagnosticError('진단 데이터셋 정보를 불러오지 못했습니다.'))
      .finally(() => setDiagnosticLoading(false));
  }, [activeTab]);

  /* ── Assignment Upload ── */
  const addSmearFiles = (newFiles) => {
    if (newFiles.length === 0) return;
    const defaultSpeciesId = species.find(item => item.code === 'DOG')?.id || species[0]?.id || null;
    setFiles(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
    setFileSpeciesIds(prev => [...prev, ...newFiles.map(() => defaultSpeciesId)]);
    setUploadResult(null);
    setFormErrors(prev => ({ ...prev, files: false }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    addSmearFiles(newFiles);
  };
  const handleRemoveFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
    setFileSpeciesIds(prev => prev.filter((_, i) => i !== idx));
  };
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    addSmearFiles(dropped);
  };
  const handleUpload = async () => {
    /* 필수 항목 검증 — 버튼을 막는 대신 어디를 채워야 하는지 표시한다 */
    const nextErrors = {
      title: !assignmentTitle.trim(),
      files: files.length === 0,
      species: files.length > 0 && files.some((_, index) => !fileSpeciesIds[index]),
    };
    if (nextErrors.title || nextErrors.files || nextErrors.species) {
      setFormErrors(nextErrors);
      const target = nextErrors.title ? titleInputRef.current : dropZoneRef.current;
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (nextErrors.title) titleInputRef.current?.focus();
      return;
    }
    setFormErrors({ title: false, files: false });
    setUploading(true);
    setUploadingImageIndex(0);
    try {
      const formData = new FormData();
      formData.append('title', assignmentTitle.trim());
      if (assignmentDeadline) formData.append('deadlineAt', `${assignmentDeadline}:00`);
      files.forEach((file, index) => {
        formData.append('files', file);
        formData.append('speciesIds', String(fileSpeciesIds[index]));
      });
      const { data } = await taskApi.createAssignment(formData);
      setUploadResult(data);
      setSelectedResultTaskIndex(0);
      setFiles([]); setPreviews([]); setFileSpeciesIds([]); setAssignmentTitle(''); setAssignmentDeadline('');
    } catch { alert('업로드에 실패했습니다.'); }
    finally { setUploading(false); }
  };

  const handleAutoDistribute = useCallback(() => {
    if (!poolStats) return;
    setClassDistribution(autoDistributeByTotal(totalQuestions, poolStats.availableByClass || {}));
  }, [poolStats, totalQuestions]);

  const handleDistributionChange = (label, value) => {
    const max = Number(poolStats?.availableByClass?.[label] || 0);
    const parsed = Number(value);
    const safe = Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, max)) : 0;
    setClassDistribution(prev => ({ ...prev, [label]: safe }));
  };

  const handleCreateDiagnosticTask = async () => {
    setDiagnosticError('');
    setDiagnosticResult(null);
    setDiagnosticCreating(true);
    try {
      const payload = {
        totalQuestions: Number(totalQuestions),
        classDistribution: classDistribution,
      };
      const { data } = await diagnosticApi.createTask(payload);
      setDiagnosticResult(data);
    } catch (err) {
      const message = err?.response?.data?.message || '진단평가 과제 생성에 실패했습니다.';
      setDiagnosticError(message);
    } finally {
      setDiagnosticCreating(false);
    }
  };

  const availableByClass = poolStats?.availableByClass || {};
  const maxTotalQuestions = Number(poolStats?.totalAvailable || 0);
  const distributionTotal = CELL_KEYS.reduce((sum, key) => sum + Number(classDistribution[key] || 0), 0);
  const isDistributionValid = distributionTotal === Number(totalQuestions);
  const isTotalWithinRange = Number(totalQuestions) > 0 && Number(totalQuestions) <= maxTotalQuestions;
  const canCreateDiagnostic = !diagnosticLoading && !diagnosticCreating && isDistributionValid && isTotalWithinRange;

  /* ────────────────────────────────────────── */
  /* ──────────────── RENDER ──────────────── */
  /* ────────────────────────────────────────── */

  return (
    <div style={containerStyle}>
      {/* ── 탭 ── */}
      <div style={tabBar}>
        <button onClick={() => setActiveTab(2)} style={activeTab === 2 ? tabActive : tabInactive}>1. Analytics &amp; Feedback</button>
        <button onClick={() => setActiveTab(1)} style={activeTab === 1 ? tabActive : tabInactive}>2. Task Management</button>
        <button onClick={() => setActiveTab(3)} style={activeTab === 3 ? tabActive : tabInactive}>3. Diagnostic Evaluation</button>
        <button onClick={() => setActiveTab(4)} style={activeTab === 4 ? tabActive : tabInactive}>4. Data Settings</button>
      </div>

      {/* ============= Tab 1: Task Management ============= */}
      {activeTab === 1 && (
        <div style={boxStyle}>
          <h2 style={{ borderBottom: '1px solid #dee2e6', paddingBottom: '10px' }}>Create New Assignment</h2>

          {/* 과제 이름 입력 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', color: '#495057', marginBottom: '6px' }}>
              과제 이름 *
            </label>
            <input
              ref={titleInputRef}
              value={assignmentTitle}
              onChange={e => {
                setAssignmentTitle(e.target.value);
                if (e.target.value.trim()) setFormErrors(prev => ({ ...prev, title: false }));
              }}
              placeholder="예: Week 3 혈액도말 분류 과제"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '6px', fontSize: '15px', boxSizing: 'border-box',
                border: `1px solid ${formErrors.title ? '#dc3545' : '#ced4da'}`,
                background: formErrors.title ? '#fff5f5' : '#fff',
                outline: 'none',
                boxShadow: formErrors.title ? '0 0 0 3px rgba(220,53,69,0.15)' : 'none',
              }}
            />
            {formErrors.title && (
              <div style={fieldErrorStyle}>⚠️ 과제 이름을 입력해 주세요.</div>
            )}
          </div>

          {/* 드래그 앤 드롭 — 다중 파일 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', color: '#495057', marginBottom: '6px' }}>
              마감일 (선택)
            </label>
            <input
              type="datetime-local"
              min={getMinimumDeadlineValue()}
              value={assignmentDeadline}
              onChange={(event) => setAssignmentDeadline(event.target.value)}
              style={{ width: '100%', maxWidth: '360px', padding: '10px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <div style={{ marginTop: '5px', fontSize: '12px', color: '#6c757d' }}>
              마감일이 지나면 제출이 잠기고 학생의 제출 결과가 공개됩니다.
            </div>
          </div>

          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              ...dropZoneStyle,
              borderColor: isDragging ? '#0056b3' : formErrors.files ? '#dc3545' : '#ced4da',
              background: isDragging ? '#e7f3ff' : formErrors.files ? '#fff5f5' : '#fff',
            }}
          >
            <input type="file" ref={fileInputRef} accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
              <div style={{ fontSize: '16px', color: '#495057', marginBottom: '5px' }}><strong>Drag &amp; Drop</strong> 혈액도말 이미지 (여러 장 가능)</div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>or click to browse</div>
            </div>
          </div>
          {formErrors.files && (
            <div style={fieldErrorStyle}>⚠️ 도말 이미지를 최소 1장 선택해 주세요.</div>
          )}

          {/* 선택된 파일 목록 */}
          {previews.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontWeight: '600', color: '#495057', marginBottom: '10px' }}>
                선택된 도말 이미지 ({previews.length}장)
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {previews.map((src, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '280px', padding: '12px', border: `1px solid ${formErrors.species && !fileSpeciesIds[idx] ? '#dc3545' : '#dee2e6'}`, borderRadius: '8px', background: '#fff' }}>
                    <img src={src} alt={`preview-${idx}`} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #dee2e6' }} />
                    <button
                      onClick={() => handleRemoveFile(idx)}
                      style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', lineHeight: '20px', textAlign: 'center', padding: 0 }}
                    >✕</button>
                    <div style={{ fontSize: '11px', color: '#6c757d', textAlign: 'center', margin: '5px 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {files[idx]?.name}
                    </div>
                    <SpeciesSelector
                      species={species}
                      selectedId={fileSpeciesIds[idx]}
                      onSelect={(id) => {
                        setFileSpeciesIds(prev => prev.map((value, index) => index === idx ? id : value));
                        setFormErrors(prev => ({ ...prev, species: false }));
                      }}
                      disabled={uploading}
                      label={`도말 ${idx + 1}의 동물 종 *`}
                      helperText="이 종은 해당 도말과 여기서 생성된 모든 세포에 적용됩니다."
                    />
                  </div>
                ))}
              </div>
              {formErrors.species && <div style={fieldErrorStyle}>⚠️ 각 도말 이미지의 동물 종을 선택해 주세요.</div>}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleUpload} disabled={uploading} style={uploading ? btnDisabled : btnActive}>
              {uploading ? `분석 중 (${uploadingImageIndex}/${files.length})...` : `🔬 Analyze & Create Assignment (${files.length}장)`}
            </button>
            {!uploading && (!assignmentTitle.trim() || files.length === 0) && (
              <span style={{ fontSize: '13px', color: formErrors.title || formErrors.files ? '#dc3545' : '#6c757d' }}>
                {[!assignmentTitle.trim() && '과제 이름', files.length === 0 && '도말 이미지'].filter(Boolean).join(', ')}
                {' '}입력이 필요합니다
              </span>
            )}
          </div>

          {uploading && (
            <div style={{ marginTop: '20px', background: '#fff', border: '1px solid #dee2e6', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontWeight: '600', color: '#495057', marginBottom: '16px', fontSize: '14px' }}>AI 분석 진행 중</div>
              {UPLOAD_STEPS.map((step, i) => {
                const stepNum = i + 1;
                const isDone = uploadStep > stepNum;
                const isActive = uploadStep === stepNum;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', opacity: uploadStep >= stepNum ? 1 : 0.3 }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                      background: isDone ? '#d4edda' : isActive ? '#cce5ff' : '#f8f9fa',
                      border: `2px solid ${isDone ? '#28a745' : isActive ? '#0056b3' : '#dee2e6'}`,
                    }}>
                      {isDone ? '✓' : step.icon}
                    </div>
                    <span style={{ fontSize: '14px', color: isDone ? '#28a745' : isActive ? '#0056b3' : '#adb5bd', fontWeight: isActive ? '600' : 'normal' }}>
                      {step.label}
                      {isActive && <span style={{ marginLeft: '6px', animation: 'none' }}>⏳</span>}
                    </span>
                  </div>
                );
              })}
              <div style={{ marginTop: '14px', height: '6px', background: '#e9ecef', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(uploadStep / UPLOAD_STEPS.length) * 100}%`, background: '#0056b3', borderRadius: '3px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          )}

          {uploadResult && (
            <>
              <div style={successBox}>
                ✅ <strong>"{uploadResult.title}"</strong> 과제 생성 완료 —{' '}
                <strong>{uploadResult.tasks?.length}</strong>장 도말, 총{' '}
                <strong>{uploadResult.totalCrops}</strong>개 세포
              </div>

              <div style={{ marginTop: '20px', background: '#fff', border: '1px solid #dee2e6', borderRadius: '10px', padding: '20px' }}>
                <div style={{ fontWeight: '600', color: '#495057', marginBottom: '14px', fontSize: '15px' }}>
                  탐지 결과 — 도말 이미지 선택
                </div>

                {/* 도말 선택 탭 */}
                {uploadResult.tasks?.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    {uploadResult.tasks.map((t, idx) => (
                      <button key={idx} onClick={() => setSelectedResultTaskIndex(idx)} style={{
                        padding: '6px 12px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #dee2e6',
                        background: selectedResultTaskIndex === idx ? '#495057' : '#f8f9fa',
                        color: selectedResultTaskIndex === idx ? '#fff' : '#495057', fontWeight: selectedResultTaskIndex === idx ? '600' : 'normal',
                      }}>
                        이미지 {idx + 1} · {t.speciesName || '개 (Dog)'} ({t.totalDetected}개)
                      </button>
                    ))}
                  </div>
                )}

                {/* 범례 */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {Object.entries(CLASS_COLORS).map(([cls, color]) => (
                    <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#495057' }}>
                      <div style={{ width: '14px', height: '14px', background: color, borderRadius: '3px' }} />
                      {cls}
                    </div>
                  ))}
                </div>

                <canvas ref={resultCanvasRef} style={{ width: '100%', borderRadius: '6px', border: '1px solid #dee2e6' }} />
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
                  바운딩 박스 위: 예측 클래스 + 분류 신뢰도(%)
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============= Tab 2: Analytics ============= */}
      {activeTab === 2 && <AnalyticsFeedback />}

      {/* ============= Tab 3: Diagnostic Evaluation ============= */}
      {activeTab === 3 && (
        <div style={boxStyle}>
          <h2 style={{ borderBottom: '1px solid #dee2e6', paddingBottom: '10px' }}>Create Diagnostic Evaluation</h2>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            GT 셀 데이터셋에서 원하는 문제 수와 클래스 분포를 지정해 진단평가 과제를 생성합니다.
          </p>

          {diagnosticLoading && <div style={{ color: '#6c757d' }}>데이터셋 통계를 불러오는 중...</div>}

          {!diagnosticLoading && poolStats && (
            <div>
              <div style={{ marginBottom: '15px', padding: '12px', background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px' }}>
                <strong>총 사용 가능 셀:</strong> {maxTotalQuestions}{' '}
                <SpeciesBadge name={poolStats.speciesName} code={poolStats.speciesCode} style={{ marginLeft: '10px' }} />
                <div style={{ marginTop: '7px', fontSize: '12px', color: '#6c757d' }}>현재 진단평가 데이터셋은 모두 Dog 도말입니다.</div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
                <label style={{ fontWeight: '600' }}>전체 문제 수</label>
                <input
                  type="number"
                  min={1}
                  max={maxTotalQuestions}
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Math.max(0, Number(e.target.value) || 0))}
                  style={{ width: '140px', padding: '8px', border: '1px solid #ced4da', borderRadius: '6px' }}
                />
                <button onClick={handleAutoDistribute} style={confirmBtn}>자동 분배</button>
                <span style={{ color: isDistributionValid ? '#28a745' : '#dc3545', fontSize: '13px' }}>
                  분포 합계: {distributionTotal} / 목표: {Number(totalQuestions) || 0}
                </span>
              </div>

              <div style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
                {CELL_KEYS.map((label) => {
                  const max = Number(availableByClass[label] || 0);
                  return (
                    <div key={label} style={{ display: 'grid', gridTemplateColumns: '170px 130px 1fr', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ fontWeight: '600' }}>{label}</div>
                      <input
                        type="number"
                        min={0}
                        max={max}
                        value={classDistribution[label] || 0}
                        onChange={(e) => handleDistributionChange(label, e.target.value)}
                        style={{ padding: '8px', border: '1px solid #ced4da', borderRadius: '6px' }}
                      />
                      <div style={{ color: '#6c757d', fontSize: '13px' }}>최대 {max}개</div>
                    </div>
                  );
                })}
              </div>

              {diagnosticError && (
                <div style={{ background: '#f8d7da', color: '#842029', border: '1px solid #f5c2c7', borderRadius: '8px', padding: '10px', marginBottom: '15px' }}>
                  {diagnosticError}
                </div>
              )}

              {diagnosticResult && (
                <div style={successBox}>
                  ✅ <strong>Success!</strong> Diagnostic Task #{diagnosticResult.taskId} created with <strong>{diagnosticResult.totalDetected}</strong> cells.{' '}
                  <SpeciesBadge name={diagnosticResult.speciesName} code={diagnosticResult.speciesCode} />
                </div>
              )}

              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={handleCreateDiagnosticTask}
                  disabled={!canCreateDiagnostic}
                  style={canCreateDiagnostic ? btnActive : btnDisabled}
                >
                  {diagnosticCreating ? 'Creating...' : '🧪 Create Diagnostic Task'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============= Tab 4: Data Settings ============= */}
      {activeTab === 4 && (
        <div style={boxStyle}>
          <h2 style={{ borderBottom: '1px solid #dee2e6', paddingBottom: '10px' }}>Data Settings</h2>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            도말 데이터에 사용하는 동물 종을 추가하고 표시 이름을 관리합니다.
          </p>
          <SpeciesDataSettings species={species} onSaved={handleSpeciesSaved} />
        </div>
      )}
    </div>
  );
}

/* ──────────────── Styles ──────────────── */
const containerStyle = { maxWidth: '1600px', width: '95%', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif', color: '#343a40' };

const tabBar = { display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid #dee2e6', marginBottom: '25px' };
const tabActive = { padding: '12px 24px', background: '#343a40', color: '#fff', border: '1px solid #343a40', fontWeight: '600', cursor: 'pointer' };
const tabInactive = { padding: '12px 24px', background: '#f8f9fa', color: '#6c757d', border: '1px solid #dee2e6', borderBottom: 'none', cursor: 'pointer' };

const boxStyle = { background: '#f8f9fa', border: '1px solid #dee2e6', padding: '25px', borderRadius: '4px' };
const successBox = { background: '#d4edda', color: '#155724', padding: '10px', marginTop: '15px', border: '1px solid #c3e6cb', fontSize: '14px' };
const btnActive = { padding: '8px 16px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' };
const btnDisabled = { padding: '8px 16px', background: '#adb5bd', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'not-allowed', fontWeight: '600' };
const fieldErrorStyle = { marginTop: '6px', fontSize: '13px', color: '#dc3545', fontWeight: '500' };

const confirmBtn = { background: '#495057', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' };

const dropZoneStyle = { border: '3px dashed #ced4da', borderRadius: '12px', padding: '40px 20px', cursor: 'pointer', transition: 'all 0.3s ease', marginTop: '20px' };
