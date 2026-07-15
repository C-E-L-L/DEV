import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taskApi, cropApi, submissionApi, reportApi } from '../api';
import { CELL_TYPES, REPORT_REASONS, imageUrl } from '../constants';
import AuthImage from '../components/AuthImage';

function isDiagnosticTask(task) {
  return !task?.originalFilename || (task?.uploadedFilename || '').startsWith('diagnostic-');
}

/* ──────────────── Task Card (과제 목록용) ──────────────── */
function TaskCardItem({ task, username, onClick, diagnostic = false, displayNumber = null }) {
  const [total, setTotal] = useState(0);
  const [solved, setSolved] = useState(0);
  const [accuracy, setAccuracy] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cropsRes = await cropApi.getByTaskId(task.id);
        setTotal(cropsRes.data.length);
        const solvedRes = await submissionApi.getSolvedCrops(task.id, username);
        setSolved(solvedRes.data.length);
        if (cropsRes.data.length > 0 && solvedRes.data.length === cropsRes.data.length) {
          const statsRes = await submissionApi.getMyResults(task.id, username);
          if (statsRes.data?.accuracy !== undefined) setAccuracy(statsRes.data.accuracy);
        }
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [task.id, username]);

  const percent = total === 0 ? 0 : Math.round((solved / total) * 100);
  const isCompleted = total > 0 && solved === total;

  return (
    <div style={taskCardStyle} onClick={onClick}>
      {task.originalFilename ? (
        <AuthImage src={imageUrl.thumbnail(task.originalFilename)} fallbackSrc={imageUrl.original(task.originalFilename)} alt={`Task ${task.id}`} style={thumbnailStyle} />
      ) : diagnostic ? (
        <div style={noImageStyle}>Diagnostic Task</div>
      ) : (
        <div style={noImageStyle}>No Image</div>
      )}
      <div style={{ padding: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', columnGap: '10px', rowGap: '6px' }}>
          <span style={{ fontWeight: '700', fontSize: '16px', lineHeight: 1.2, color: '#343a40', marginRight: '8px' }}>
            {diagnostic ? `Diagnostic #${displayNumber || task.id}` : `Task #${task.id}`}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {diagnostic && (
              <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: '#fff3cd', color: '#856404' }}>
                DIAGNOSTIC
              </span>
            )}
            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', background: isCompleted ? '#d4edda' : '#e9ecef', color: isCompleted ? '#155724' : '#495057' }}>
              {isCompleted ? 'COMPLETED' : 'IN_PROGRESS'}
            </span>
          </div>
        </div>
        <div style={{ color: '#6c757d', fontSize: '13px', marginBottom: '15px' }}>
          {task.uploadedFilename && <div style={{ fontSize: '11px', wordBreak: 'break-all' }}>{task.uploadedFilename}</div>}
        </div>
        <div style={{ background: '#e9ecef', borderRadius: '4px', height: '8px', width: '100%', overflow: 'hidden', marginBottom: '6px' }}>
          <div style={{ background: isCompleted ? '#28a745' : '#0056b3', height: '100%', width: `${percent}%`, transition: 'width 0.5s ease-in-out' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6c757d', fontWeight: '600' }}>
          <span>{solved} / {total}</span>
          <span style={{ color: isCompleted ? '#28a745' : '#0056b3' }}>{percent}%</span>
        </div>
        {isCompleted && accuracy !== null && (
          <div style={{ marginTop: '12px', padding: '10px', background: '#f8f9fa', borderRadius: '4px', textAlign: 'center', fontSize: '14px', border: '1px solid #dee2e6' }}>
            <span>🎯 정답률: </span>
            <span style={{ color: accuracy >= 80 ? '#28a745' : accuracy >= 50 ? '#ffc107' : '#dc3545', fontWeight: 'bold' }}>{accuracy}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────── Assignment Card ──────────────── */
function AssignmentCard({ assignment, username, onClick }) {
  const [progress, setProgress] = useState({ total: 0, solved: 0 });

  useEffect(() => {
    const total = assignment.tasks.reduce((sum, t) => sum + (t.cropCount || 0), 0);
    if (total === 0) { setProgress({ total: 0, solved: 0 }); return; }
    submissionApi.getSolvedCropsForAssignment(assignment.id, username)
      .then(({ data }) => setProgress({ total, solved: data.length }))
      .catch(() => setProgress({ total, solved: 0 }));
  }, [assignment, username]);

  const percent = progress.total === 0 ? 0 : Math.round((progress.solved / progress.total) * 100);
  const isCompleted = progress.total > 0 && progress.solved >= progress.total;

  return (
    <div style={taskCardStyle} onClick={onClick}>
      {assignment.tasks[0]?.originalFilename ? (
        <AuthImage src={imageUrl.thumbnail(assignment.tasks[0].originalFilename)} fallbackSrc={imageUrl.original(assignment.tasks[0].originalFilename)} alt="smear" style={thumbnailStyle} />
      ) : (
        <div style={noImageStyle}>No Image</div>
      )}
      <div style={{ padding: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: '700', fontSize: '16px', color: '#343a40' }}>{assignment.title}</span>
          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', background: isCompleted ? '#d4edda' : '#e9ecef', color: isCompleted ? '#155724' : '#495057' }}>
            {isCompleted ? 'COMPLETED' : 'IN_PROGRESS'}
          </span>
        </div>
        <div style={{ color: '#6c757d', fontSize: '12px', marginBottom: '12px' }}>
          도말 {assignment.tasks.length}장 · 총 {progress.total}개 세포
        </div>
        <div style={{ background: '#e9ecef', borderRadius: '4px', height: '8px', overflow: 'hidden', marginBottom: '6px' }}>
          <div style={{ background: isCompleted ? '#28a745' : '#0056b3', height: '100%', width: `${percent}%`, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6c757d', fontWeight: '600' }}>
          <span>{progress.solved} / {progress.total}</span>
          <span style={{ color: isCompleted ? '#28a745' : '#0056b3' }}>{percent}%</span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Main StudentPage ──────────────── */
export default function StudentPage() {
  const { user } = useAuth();
  const username = user?.username;
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [taskTab, setTaskTab] = useState('practice');
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [crops, setCrops] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [solvedCrops, setSolvedCrops] = useState(new Set());
  const [solvedLabels, setSolvedLabels] = useState({});
  const [imageSize, setImageSize] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    taskApi.getAll().then(({ data }) => setTasks(data)).catch(console.error);
  }, []);

  // 브라우저 뒤로가기 방지
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      navigate('/student', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  const handleSelectTask = async (task) => {
    setShowResult(false);
    setResultData(null);
    setCrops([]);
    setSolvedLabels({});
    setSolvedCrops(new Set());
    setCurrentCropIndex(0);
    setSelectedAssignment(null);
    setSelectedTask(task);
    setImageSize({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });
    try {
      const [cropsRes, labelsRes] = await Promise.all([
        cropApi.getByTaskId(task.id),
        submissionApi.getSolvedCropLabels(task.id, username),
      ]);
      const cropsData = cropsRes.data;
      const labels = labelsRes.data;
      const solvedSet = new Set(Object.keys(labels).map(Number));
      setCrops(cropsData);
      setSolvedLabels(labels);
      setSolvedCrops(solvedSet);
      const firstUnsolved = cropsData.findIndex(c => !labels[c.id]);
      setCurrentCropIndex(firstUnsolved !== -1 ? firstUnsolved : Math.max(0, cropsData.length - 1));
      const allSolved = cropsData.length > 0 && cropsData.every(c => labels[c.id]);
      if (isDiagnosticTask(task) && allSolved) {
        const statsRes = await submissionApi.getMyResults(task.id, username);
        setResultData(statsRes.data);
        setShowResult(true);
      }
    } catch (e) {
      console.error('과제 로드 실패:', e);
      setSelectedTask(null);
      alert('과제를 불러오는데 실패했습니다.');
    }
  };

  const handleSelectAssignment = async (assignment) => {
    setShowResult(false);
    setResultData(null);
    setCrops([]);
    setSolvedLabels({});
    setSolvedCrops(new Set());
    setCurrentCropIndex(0);
    setSelectedAssignment(assignment);
    setSelectedTask({ id: null, assignmentId: assignment.id, title: assignment.title });
    setImageSize({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });
    try {
      const [cropsRes, labelsRes] = await Promise.all([
        cropApi.getByAssignmentId(assignment.id),
        submissionApi.getSolvedCropLabelsForAssignment(assignment.id, username),
      ]);
      const cropsData = cropsRes.data;
      const labels = labelsRes.data;
      setCrops(cropsData);
      setSolvedLabels(labels);
      setSolvedCrops(new Set(Object.keys(labels).map(Number)));
      const firstUnsolved = cropsData.findIndex(c => !labels[c.id]);
      setCurrentCropIndex(firstUnsolved !== -1 ? firstUnsolved : Math.max(0, cropsData.length - 1));
    } catch (e) {
      console.error('과제 로드 실패:', e);
      setSelectedAssignment(null);
      setSelectedTask(null);
      alert('과제를 불러오는데 실패했습니다.');
    }
  };

  const handleImageLoad = (e) => {
    setImageSize({ width: e.target.clientWidth, height: e.target.clientHeight, naturalWidth: e.target.naturalWidth, naturalHeight: e.target.naturalHeight });
  };

  const parseBbox = (bboxStr) => {
    try { return JSON.parse(bboxStr.replace(/'/g, '"')); } catch { return [0, 0, 0, 0]; }
  };

  const getScaledBbox = (bboxStr) => {
    const [x1, y1, x2, y2] = parseBbox(bboxStr);
    if (!imageSize.naturalWidth) return { left: 0, top: 0, width: 0, height: 0 };
    const scaleX = imageSize.width / imageSize.naturalWidth;
    const scaleY = imageSize.height / imageSize.naturalHeight;
    return { left: x1 * scaleX, top: y1 * scaleY, width: (x2 - x1) * scaleX, height: (y2 - y1) * scaleY };
  };

  const handleStudentSubmit = async (label) => {
    const currentCrop = crops[currentCropIndex];
    if (!currentCrop) return;
    const wasAlreadySolved = solvedCrops.has(currentCrop.id);
    try {
      await submissionApi.submit(currentCrop.id, username, label);
      setSolvedCrops(prev => new Set(prev).add(currentCrop.id));
      setSolvedLabels(prev => ({ ...prev, [currentCrop.id]: label }));
      if (!wasAlreadySolved) {
        const nextIdx = crops.findIndex((c, i) => i > currentCropIndex && !solvedCrops.has(c.id) && c.id !== currentCrop.id);
        if (nextIdx !== -1) setCurrentCropIndex(nextIdx);
      }
    } catch { alert("제출에 실패했습니다."); }
  };

  const handleFinalSubmit = async () => {
    try {
      let data;
      if (selectedAssignment) {
        ({ data } = await submissionApi.getMyResultsForAssignment(selectedAssignment.id, username));
      } else {
        ({ data } = await submissionApi.getMyResults(selectedTask.id, username));
      }
      setResultData(data);
      setShowResult(true);
    } catch { alert("결과를 불러오는데 실패했습니다."); }
  };

  const [reportReason, setReportReason] = useState('이미지 잘림');
  const [reportOtherReason, setReportOtherReason] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);

  const handleReportCrop = () => {
    if (!currentCrop || !selectedTask) return;
    const reason = reportReason === '기타'
      ? reportOtherReason.trim()
      : reportReason;
    if (!reason) {
      alert('기타 사유를 입력해주세요.');
      return;
    }

    reportApi.create({
      taskId: currentCrop.taskId,
      cropId: currentCrop.id,
      studentId: username,
      reason,
    })
      .then(() => {
        alert('신고가 접수되었습니다.');
        setReportOtherReason('');
        setShowReportForm(false);
      })
      .catch(() => alert('신고 접수에 실패했습니다.'));
  };

  const currentCrop = crops[currentCropIndex];
  const allCompleted = crops.length > 0 && solvedCrops.size >= crops.length;
  const isDiagnosticMode = !selectedAssignment && isDiagnosticTask(selectedTask);
  const activeSmearFilename = currentCrop?.originalSmearFilename || selectedTask?.originalFilename;

  // 과제(assignment) 내 도말 이미지별로 세포를 그룹화 (도말 간 이동 내비게이션용)
  const smearGroups = useMemo(() => {
    const order = [];
    const map = {};
    crops.forEach((crop, idx) => {
      const filename = crop.originalSmearFilename || selectedTask?.originalFilename;
      if (!map[filename]) {
        map[filename] = { filename, indices: [] };
        order.push(filename);
      }
      map[filename].indices.push(idx);
    });
    return order.map((filename) => map[filename]);
  }, [crops, selectedTask]);

  const currentSmearGroupIndex = smearGroups.findIndex((g) => g.filename === activeSmearFilename);

  const goToSmearGroup = (groupIndex) => {
    if (groupIndex < 0 || groupIndex >= smearGroups.length) return;
    const group = smearGroups[groupIndex];
    const targetIdx = group.indices.find((i) => !solvedCrops.has(crops[i].id));
    setCurrentCropIndex(targetIdx !== undefined ? targetIdx : group.indices[0]);
  };
  const diagnosticTasks = tasks.filter((task) => isDiagnosticTask(task));
  const diagnosticTasksOrdered = [...diagnosticTasks].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (aTime !== bTime) return aTime - bTime;
    return (a.id || 0) - (b.id || 0);
  });

  // 일반 과제를 assignment별로 그룹화
  const { assignments, individualTasks } = useMemo(() => {
    const assignmentMap = {};
    const individual = [];
    tasks.filter(t => !isDiagnosticTask(t)).forEach(task => {
      if (task.assignmentId) {
        if (!assignmentMap[task.assignmentId]) {
          assignmentMap[task.assignmentId] = { id: task.assignmentId, title: task.title || `Assignment #${task.assignmentId}`, tasks: [] };
        }
        assignmentMap[task.assignmentId].tasks.push(task);
      } else {
        individual.push(task);
      }
    });
    return { assignments: Object.values(assignmentMap), individualTasks: individual };
  }, [tasks]);

  /* ====== 화면 1: 과제 목록 ====== */
  if (!selectedTask) {
    return (
      <div style={containerStyle}>
        <div style={{ borderBottom: '2px solid #dee2e6', paddingBottom: '15px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Task Dashboard (Student)</h2>
          <span style={{ color: '#6c757d' }}>
            {taskTab === 'diagnostic'
              ? '진단평가 과제를 선택해 GT 기반으로 채점받으세요.'
              : '일반 과제를 선택해 분류 연습을 진행하세요.'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setTaskTab('practice')} style={taskTab === 'practice' ? tabActive : tabInactive}>일반 과제</button>
          <button onClick={() => setTaskTab('diagnostic')} style={taskTab === 'diagnostic' ? tabActive : tabInactive}>진단평가</button>
        </div>

        {taskTab === 'practice' ? (
          <>
            {assignments.length === 0 && individualTasks.length === 0 && (
              <p style={{ textAlign: 'center', color: '#6c757d', marginTop: '50px' }}>No practice tasks available.</p>
            )}
            {assignments.length > 0 && (
              <>
                <div style={{ fontWeight: '600', color: '#495057', marginBottom: '12px', fontSize: '14px' }}>과제 목록</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  {assignments.map(assignment => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      username={username}
                      onClick={() => handleSelectAssignment(assignment)}
                    />
                  ))}
                </div>
              </>
            )}
            {individualTasks.length > 0 && (
              <>
                <div style={{ fontWeight: '600', color: '#495057', marginBottom: '12px', fontSize: '14px' }}>개별 과제</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {individualTasks.map(task => (
                    <TaskCardItem key={task.id} task={task} username={username} diagnostic={false} onClick={() => handleSelectTask(task)} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {diagnosticTasksOrdered.map((task, index) => (
                <TaskCardItem key={task.id} task={task} username={username} diagnostic displayNumber={index + 1} onClick={() => handleSelectTask(task)} />
              ))}
            </div>
            {diagnosticTasksOrdered.length === 0 && (
              <p style={{ textAlign: 'center', color: '#6c757d', marginTop: '50px' }}>No diagnostic tasks available.</p>
            )}
          </>
        )}
      </div>
    );
  }

  /* ====== 화면 3: 채점 결과 ====== */
  if (showResult && resultData) {
    return (
      <div style={containerStyle}>
        <div style={{ maxWidth: '900px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #dee2e6' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
            📊 {isDiagnosticMode ? '진단평가 채점 결과' : 'AI 채점 결과'}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '30px 0', background: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={resultStatStyle}>
              <span style={{ fontSize: '48px', fontWeight: 'bold', color: resultData.total > 0 && resultData.accuracy >= 80 ? '#28a745' : resultData.total > 0 && resultData.accuracy >= 50 ? '#ffc107' : '#dc3545' }}>
                {resultData.total > 0 ? `${resultData.accuracy}%` : 'N/A'}
              </span>
              <span style={{ color: '#6c757d', marginTop: '10px' }}>정답률</span>
            </div>
            <div style={resultStatStyle}>
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#28a745' }}>{resultData.correct}</span>
              <span style={{ color: '#6c757d', marginTop: '10px' }}>정답</span>
            </div>
            <div style={resultStatStyle}>
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc3545' }}>{resultData.wrong}</span>
              <span style={{ color: '#6c757d', marginTop: '10px' }}>오답</span>
            </div>
            <div style={resultStatStyle}>
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#495057' }}>{resultData.total}</span>
              <span style={{ color: '#6c757d', marginTop: '10px' }}>전체</span>
            </div>
          </div>
          {resultData.details?.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ borderBottom: '1px solid #dee2e6', paddingBottom: '10px' }}>상세 결과</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', marginTop: '15px' }}>
                {resultData.details.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '10px', border: `2px solid ${item.isCorrect === null ? '#adb5bd' : item.isCorrect ? '#28a745' : '#dc3545'}`, borderRadius: '8px', background: '#fff' }}>
                    <AuthImage src={imageUrl.crop(item.cropFilename)} alt="cell" style={{ width: '60px', height: '60px', objectFit: 'contain', background: '#f8f9fa', borderRadius: '4px' }} />
                    <div style={{ flex: 1, marginLeft: '10px' }}>
                      <div style={{ fontSize: '13px' }}><span style={{ color: '#6c757d' }}>내 답: </span><strong>{item.studentLabel}</strong></div>
                      <div style={{ fontSize: '13px' }}>
                        <span style={{ color: '#6c757d' }}>정답: </span>
                        <strong style={{ color: item.isCorrect === null ? '#6c757d' : item.isCorrect ? '#28a745' : '#dc3545' }}>
                          {item.correctLabel || '채점 대기'}
                        </strong>
                      </div>
                    </div>
                    <span style={{ fontSize: '24px' }}>{item.isCorrect === null ? '⏳' : item.isCorrect ? '✅' : '❌'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => { setSelectedTask(null); setShowResult(false); }} style={{ display: 'block', width: '300px', margin: '30px auto 0', padding: '15px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  /* ====== 화면 2: 세포 분류 ====== */
  return (
    <>
    <div style={containerStyle}>
      {/* 상단 바 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #dee2e6', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>
          {selectedAssignment ? selectedAssignment.title : `Task #${selectedTask.id}`} - {isDiagnosticMode ? '진단평가' : '세포 분류'}
          {isDiagnosticMode && <span style={{ marginLeft: '10px', fontSize: '14px', color: '#856404', background: '#fff3cd', padding: '3px 8px', borderRadius: '5px' }}>GT Scoring</span>}
        </h2>
        <button onClick={() => setSelectedTask(null)} style={{ padding: '8px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>← 목록으로 돌아가기</button>
      </div>

      {/* 메인 레이아웃 */}
      <div style={{ display: 'flex', gap: '20px', minHeight: '70vh', flexWrap: 'wrap' }}>
        {/* 왼쪽: 혈액 도말 이미지 + 바운딩 박스 */}
        {!isDiagnosticMode && (
        <div style={{ flex: '2 1 720px', background: '#fff', borderRadius: '8px', border: '1px solid #dee2e6', overflow: 'hidden' }}>
          <div style={{ ...sectionHeaderStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>🔬 혈액 도말 이미지</span>
            {smearGroups.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => goToSmearGroup(currentSmearGroupIndex - 1)}
                  disabled={currentSmearGroupIndex <= 0}
                  style={{ ...smearNavBtnStyle, opacity: currentSmearGroupIndex <= 0 ? 0.4 : 1 }}
                >◀ 이전 도말</button>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#495057' }}>
                  도말 {currentSmearGroupIndex + 1} / {smearGroups.length}
                </span>
                <button
                  onClick={() => goToSmearGroup(currentSmearGroupIndex + 1)}
                  disabled={currentSmearGroupIndex >= smearGroups.length - 1}
                  style={{ ...smearNavBtnStyle, opacity: currentSmearGroupIndex >= smearGroups.length - 1 ? 0.4 : 1 }}
                >다음 도말 ▶</button>
              </div>
            )}
          </div>
          <div style={{ padding: '15px', overflow: 'auto', maxHeight: 'calc(100vh - 260px)', background: '#f8f9fa' }}>
            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
              <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(220,53,69,0.9)', color: '#fff', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', zIndex: 10 }}>x40</span>
              {activeSmearFilename && (
                <AuthImage
                  key={activeSmearFilename}
                  src={imageUrl.original(activeSmearFilename)}
                  alt="Blood Smear"
                  onLoad={handleImageLoad}
                  style={{ width: '100%', maxWidth: '100%', maxHeight: 'calc(100vh - 300px)', height: 'auto', objectFit: 'contain', display: 'block' }}
                />
              )}
              {/* 바운딩 박스 오버레이 (현재 표시 중인 도말의 세포만) */}
              {crops.map((crop, idx) => {
                if ((crop.originalSmearFilename || selectedTask?.originalFilename) !== activeSmearFilename) return null;
                const bbox = getScaledBbox(crop.bbox);
                const isSelected = idx === currentCropIndex;
                const isSolved = solvedCrops.has(crop.id);
                return (
                  <div key={crop.id} onClick={() => setCurrentCropIndex(idx)} style={{
                    position: 'absolute', left: bbox.left, top: bbox.top, width: bbox.width, height: bbox.height,
                    border: isSelected ? '3px solid #ffc107' : isSolved ? '2px solid #28a745' : '2px solid #00ff00',
                    background: isSelected ? 'rgba(255,193,7,0.2)' : 'transparent', cursor: 'pointer', boxSizing: 'border-box',
                  }}>
                    <span style={{
                      position: 'absolute', top: '-18px', left: '0',
                      background: isSelected ? '#ffc107' : isSolved ? '#28a745' : '#333',
                      color: isSelected ? '#000' : '#fff', fontSize: '10px', padding: '1px 4px', borderRadius: '2px', fontWeight: 'bold',
                    }}>#{idx + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}

        {/* 오른쪽: 세포 목록 + 분류 패널 */}
        <div style={{ flex: isDiagnosticMode ? '1 1 100%' : '1 1 360px', display: 'flex', flexDirection: 'column', gap: '15px', minWidth: '320px' }}>
          {/* 감지된 세포 목록 */}
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #dee2e6', overflow: 'hidden', flex: '1', maxHeight: '300px' }}>
            <div style={sectionHeaderStyle}>🔍 감지된 세포 목록</div>
            <div style={{ padding: '10px', overflowY: 'auto', maxHeight: '250px' }}>
              {crops.map((crop, idx) => {
                const isSolved = solvedCrops.has(crop.id);
                const isSelected = idx === currentCropIndex;
                const label = solvedLabels[crop.id];
                return (
                  <div key={crop.id} onClick={() => setCurrentCropIndex(idx)} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '4px', cursor: 'pointer',
                    marginBottom: '5px', border: '1px solid #eee', background: isSelected ? '#f0f4f8' : '#fff',
                    borderLeft: isSelected ? '4px solid #495057' : '4px solid transparent',
                  }}>
                    <AuthImage src={imageUrl.crop(crop.cropFilename)} alt={`Cell ${idx + 1}`} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', background: '#f8f9fa' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>#{idx + 1}</div>
                      <div style={{ fontSize: '12px', color: isSolved ? '#28a745' : '#6c757d' }}>{isSolved ? (label || '분류완료') : '미분류'}</div>
                    </div>
                    {isSolved && <span style={{ color: '#28a745', fontSize: '18px' }}>●</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 세포 분류 패널 */}
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #dee2e6', overflow: 'hidden' }}>
            <div style={sectionHeaderStyle}>🏷️ 세포 분류</div>
            {currentCrop && (
              <div style={{ padding: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '10px' }}>
                  <button onClick={() => currentCropIndex > 0 && setCurrentCropIndex(currentCropIndex - 1)} disabled={currentCropIndex === 0} style={{ ...navBtnStyle, opacity: currentCropIndex === 0 ? 0.3 : 1 }}>◀</button>
                  <div style={{ width: '180px', height: '180px', border: '2px solid #dee2e6', borderRadius: '8px', overflow: 'hidden', background: '#f8f9fa' }}>
                    <AuthImage src={imageUrl.crop(currentCrop.cropFilename)} alt="Current Cell" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <button onClick={() => currentCropIndex < crops.length - 1 && setCurrentCropIndex(currentCropIndex + 1)} disabled={currentCropIndex === crops.length - 1} style={{ ...navBtnStyle, opacity: currentCropIndex === crops.length - 1 ? 0.3 : 1 }}>▶</button>
                </div>
                <div style={{ textAlign: 'center', marginBottom: '15px', color: '#6c757d', fontSize: '13px' }}>
                  세포 #{currentCropIndex + 1} / {crops.length}
                  {solvedCrops.has(currentCrop.id) && <span style={{ color: '#28a745', marginLeft: '10px' }}>✓ 분류완료</span>}
                </div>
                <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: '600' }}>👆 클래스를 선택하세요</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {CELL_TYPES.map((cls) => {
                    const isSelected = solvedLabels[currentCrop.id] === cls.key;
                    return (
                      <button key={cls.key} onClick={() => handleStudentSubmit(cls.key)} style={{
                        padding: '12px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                        background: isSelected ? '#0d6efd' : '#f8f9fa',
                        color: isSelected ? '#fff' : 'inherit',
                        border: isSelected ? '2px solid #0d6efd' : '1px solid #dee2e6',
                      }}>
                        {cls.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: '12px' }}>
                  <button onClick={() => setShowReportForm(true)} style={reportBtnStyle}>
                    잘 모르겠어요
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 진행률 + 제출 */}
      <div style={{ marginTop: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <span style={{ fontWeight: '600' }}>진행률: </span>
            <span>{solvedCrops.size} / {crops.length} 완료 ({crops.length > 0 ? Math.round((solvedCrops.size / crops.length) * 100) : 0}%)</span>
          </div>
          <button onClick={handleFinalSubmit} disabled={!allCompleted} style={{
            padding: '10px 24px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600',
            opacity: allCompleted ? 1 : 0.5, cursor: allCompleted ? 'pointer' : 'not-allowed',
          }}>
            {allCompleted ? '🎯 제출하고 채점 받기' : `⏳ ${crops.length - solvedCrops.size}개 남음`}
          </button>
        </div>
        <div style={{ background: '#e9ecef', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ background: '#28a745', height: '100%', width: `${crops.length > 0 ? (solvedCrops.size / crops.length) * 100 : 0}%`, transition: 'width 0.3s' }} />
        </div>
      </div>
    </div>

    {showReportForm && (
      <div style={reportModalOverlayStyle}>
        <div style={reportModalStyle}>
          <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px', color: '#343a40' }}>
            신고 사유 선택
          </div>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            style={reportSelectStyle}
          >
            {REPORT_REASONS.map((reason) => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
          {reportReason === '기타' && (
            <input
              value={reportOtherReason}
              onChange={(e) => setReportOtherReason(e.target.value)}
              placeholder="기타 사유 입력"
              style={reportInputStyle}
            />
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button onClick={handleReportCrop} style={reportBtnStyle}>
              신고하기
            </button>
            <button onClick={() => setShowReportForm(false)} style={reportCancelBtnStyle}>
              취소
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

const containerStyle = { maxWidth: '1800px', width: '98%', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif', color: '#343a40' };
const sectionHeaderStyle = { background: '#495057', color: '#fff', padding: '12px 20px', fontSize: '15px', fontWeight: '600' };
const navBtnStyle = { width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #dee2e6', background: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const smearNavBtnStyle = { padding: '6px 12px', borderRadius: '6px', border: '1px solid #ced4da', background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#495057' };
const resultStatStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center' };
const taskCardStyle = { background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'transform 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const thumbnailStyle = { width: '100%', height: '180px', objectFit: 'cover', borderBottom: '1px solid #dee2e6' };
const noImageStyle = { width: '100%', height: '180px', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#adb5bd', fontWeight: 'bold', borderBottom: '1px solid #dee2e6' };
const tabActive = { padding: '8px 14px', background: '#343a40', color: '#fff', border: '1px solid #343a40', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' };
const tabInactive = { padding: '8px 14px', background: '#fff', color: '#495057', border: '1px solid #ced4da', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' };
const cmHeadStyle = { border: '1px solid #dee2e6', padding: '8px', background: '#f8f9fa', fontSize: '12px', whiteSpace: 'nowrap' };
const cmRowHeaderStyle = { border: '1px solid #dee2e6', padding: '8px', background: '#f8f9fa', fontWeight: '700', fontSize: '12px' };
const cmCellStyle = { border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', fontSize: '12px' };
const reportBtnStyle = { width: '100%', padding: '10px 12px', background: '#fff3cd', border: '1px solid #ffecb5', borderRadius: '6px', color: '#856404', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const reportSelectStyle = { width: '100%', padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: '6px', background: '#fff', fontSize: '13px', color: '#495057' };
const reportInputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #dee2e6', borderRadius: '6px', background: '#fff', fontSize: '13px', color: '#495057' };
const reportCancelBtnStyle = { width: '100%', padding: '10px 12px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '6px', color: '#6c757d', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const reportModalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const reportModalStyle = { width: '320px', background: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #dee2e6', display: 'grid', gap: '10px' };
