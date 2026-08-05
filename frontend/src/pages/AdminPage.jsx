import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { adminApi, taskApi, statsApi, cropApi, diagnosticApi, reportApi, labelingApi } from '../api';
import { CELL_KEYS, REPORT_REASONS, imageUrl } from '../constants';
import AuthImage from '../components/AuthImage';
import { fetchAuthImage } from '../utils/fetchAuthImage';

/* ──────────────── 정답률 → 색상 ──────────────── */
function getAccuracyColor(accuracy, totalAnswers = 1) {
  if (totalAnswers === 0) return '#adb5bd';
  if (accuracy >= 80) return '#28a745';
  if (accuracy >= 60) return '#7cb342';
  if (accuracy >= 40) return '#ffc107';
  if (accuracy >= 20) return '#fd7e14';
  return '#dc3545';
}

/* ──────────────── 투표 분포 바 ──────────────── */
function VoteBar({ voteDistribution, totalAnswers }) {
  if (totalAnswers === 0) {
    return <div style={{ color: '#6c757d', fontSize: '14px' }}>No student responses yet</div>;
  }
  return (
    <div style={{ marginTop: '10px' }}>
      {CELL_KEYS.map(label => {
        const count = voteDistribution?.[label] || 0;
        const pct = (count / totalAnswers) * 100;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ width: '90px', fontSize: '13px', color: '#495057', fontWeight: '500' }}>{label}</div>
            <div style={{ flex: 1, height: '20px', background: '#e9ecef', borderRadius: '4px', overflow: 'hidden', marginRight: '10px' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: pct > 0 ? '#4dabf7' : 'transparent', transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ width: '60px', fontSize: '13px', color: '#495057', textAlign: 'right' }}>
              {count} ({Math.round(pct)}%)
            </div>
          </div>
        );
      })}
    </div>
  );
}

function isDiagnosticTask(task) {
  return !task?.originalFilename || (task?.uploadedFilename || '').startsWith('diagnostic-');
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getMatrixCellStyle(count, rowTotal, isCorrect) {
  if (!rowTotal || count === 0) {
    return { background: '#fff', color: '#adb5bd', fontWeight: 'normal' };
  }

  const pct = count / rowTotal;
  const alpha = clamp(0.15 + pct * 0.85, 0.15, 0.95);
  const base = isCorrect ? '40, 167, 69' : '220, 53, 69';
  const textColor = isCorrect ? '#155724' : '#721c24';

  return {
    background: `rgba(${base}, ${alpha})`,
    color: textColor,
    fontWeight: '600',
  };
}

function getReportCategory(reason) {
  const normalized = (reason || '').trim();
  if (REPORT_REASONS.includes(normalized)) return normalized;
  return '기타';
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState(1);
  const [tasks, setTasks] = useState([]);

  /* ── Tab 4: User Management ── */
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', name: '', password: '', role: 'EXPERT' });
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterInput, setRosterInput] = useState('');

  const fetchUsers = useCallback(() => {
    setUserLoading(true);
    adminApi.getUsers()
      .then(({ data }) => setUsers(data || []))
      .catch(() => setUsers([]))
      .finally(() => setUserLoading(false));
  }, []);

  const fetchRoster = useCallback(() => {
    setRosterLoading(true);
    adminApi.getStudentRoster()
      .then(({ data }) => setRoster(data || []))
      .catch(() => setRoster([]))
      .finally(() => setRosterLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== 4) return;
    fetchUsers();
    fetchRoster();
  }, [activeTab, fetchUsers, fetchRoster]);

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) return alert('아이디와 비밀번호를 입력하세요.');
    try {
      await adminApi.createUser(newUser);
      setNewUser({ username: '', name: '', password: '', role: 'EXPERT' });
      fetchUsers();
    } catch (e) {
      alert(e?.response?.data?.message || '계정 생성에 실패했습니다.');
    }
  };

  const handleDeleteUser = async (username) => {
    if (!window.confirm(`'${username}' 계정을 삭제하시겠습니까?`)) return;
    try {
      await adminApi.deleteUser(username);
      fetchUsers();
    } catch {
      alert('계정 삭제에 실패했습니다.');
    }
  };

  const handleUpdateUserStatus = async (user, status) => {
    const labels = { ACTIVE: '승인', REJECTED: '거절', PENDING: '대기로 변경', INACTIVE: '비활성화' };
    if (!window.confirm(`'${user.username}' 계정을 ${labels[status] || status} 처리하시겠습니까?`)) return;
    try {
      await adminApi.updateUserStatus(user.id, status);
      fetchUsers();
    } catch (e) {
      alert(e?.response?.data?.message || '상태 변경에 실패했습니다.');
    }
  };

  const handleAddRoster = async () => {
    const studentIds = rosterInput
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (studentIds.length === 0) return alert('등록할 학번을 입력하세요.');
    try {
      const { data } = await adminApi.addStudentRoster(studentIds);
      alert(`${data.added}건 추가, ${data.skipped}건 중복/무시되었습니다.`);
      setRosterInput('');
      fetchRoster();
    } catch (e) {
      alert(e?.response?.data?.message || '학번 등록에 실패했습니다.');
    }
  };

  /* ── Tab 1: Smear List ── */
  const [smears, setSmears] = useState([]);
  const [smearLoading, setSmearLoading] = useState(false);
  const [smearFilter, setSmearFilter] = useState('all');
  const [smearQuery, setSmearQuery] = useState('');

  useEffect(() => {
    if (activeTab !== 1) return;
    setSmearLoading(true);
    adminApi.getSmears()
      .then(({ data }) => setSmears(data || []))
      .catch(() => setSmears([]))
      .finally(() => setSmearLoading(false));
  }, [activeTab]);

  const filteredSmears = useMemo(() => {
    const query = smearQuery.trim().toLowerCase();
    return smears.filter((item) => {
      const labelMatch = smearFilter === 'all'
        || (smearFilter === 'labeled' && item.hasLabel)
        || (smearFilter === 'unlabeled' && !item.hasLabel);
      if (!labelMatch) return false;
      if (!query) return true;
      const original = String(item.originalFilename || '').toLowerCase();
      const uploaded = String(item.uploadedFilename || '').toLowerCase();
      return original.includes(query) || uploaded.includes(query);
    });
  }, [smears, smearFilter, smearQuery]);

  /* ── Tab 2: Crop List ── */
  const [crops, setCrops] = useState([]);
  const [cropLoading, setCropLoading] = useState(false);
  const [cropFilter, setCropFilter] = useState('all');
  const [cropQuery, setCropQuery] = useState('');

  useEffect(() => {
    if (activeTab !== 2) return;
    setCropLoading(true);
    Promise.all([adminApi.getCrops(), taskApi.getAll()])
      .then(([cropResponse, taskResponse]) => {
        setCrops(cropResponse.data || []);
        setTasks(taskResponse.data || []);
      })
      .catch(() => setCrops([]))
      .finally(() => setCropLoading(false));
  }, [activeTab]);

  const taskFilenameById = useMemo(
    () => new Map(tasks.map(task => [task.id, task.uploadedFilename || task.originalFilename])),
    [tasks]
  );

  const displaySmearFilename = (item) =>
    taskFilenameById.get(item.taskId) || item.originalSmearFilename || '-';

  const filteredCrops = useMemo(() => {
    const query = cropQuery.trim().toLowerCase();
    return crops.filter((item) => {
      const labelMatch = cropFilter === 'all'
        || (cropFilter === 'labeled' && item.hasLabel)
        || (cropFilter === 'unlabeled' && !item.hasLabel);
      if (!labelMatch) return false;
      if (!query) return true;
      const cropName = String(item.cropFilename || '').toLowerCase();
      const smearName = String(taskFilenameById.get(item.taskId) || item.originalSmearFilename || '').toLowerCase();
      return cropName.includes(query) || smearName.includes(query);
    });
  }, [crops, cropFilter, cropQuery, taskFilenameById]);

  /* ── Tab 3: Analytics ── */
  const [analyticsSubTab, setAnalyticsSubTab] = useState('tasks');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [stats, setStats] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [allCellStats, setAllCellStats] = useState([]);
  const [reportItems, setReportItems] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFilters, setReportFilters] = useState(
    () => Object.fromEntries(REPORT_REASONS.map((reason) => [reason, true]))
  );

  const [studentMatrices, setStudentMatrices] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const canvasRef = useRef(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const diagnosticTaskOrder = [...tasks]
    .filter(isDiagnosticTask)
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (aTime !== bTime) return aTime - bTime;
      return (a.id || 0) - (b.id || 0);
    })
    .reduce((acc, task, index) => {
      acc.set(task.id, index + 1);
      return acc;
    }, new Map());
  const selectedAnalyticsTask = tasks.find(task => task.id === selectedTaskId);

  const { assignmentGroups, individualTasks } = useMemo(() => {
    const assignmentMap = {};
    const individual = [];
    tasks.filter(t => !isDiagnosticTask(t)).forEach(task => {
      if (task.assignmentId) {
        if (!assignmentMap[task.assignmentId]) {
          assignmentMap[task.assignmentId] = {
            id: task.assignmentId,
            title: task.title || `Assignment #${task.assignmentId}`,
            tasks: [],
          };
        }
        assignmentMap[task.assignmentId].tasks.push(task);
      } else {
        individual.push(task);
      }
    });
    return { assignmentGroups: Object.values(assignmentMap), individualTasks: individual };
  }, [tasks]);

  const fetchStudentMatrices = useCallback(async () => {
    setSelectedStudent(null);
    try {
      const { data } = await diagnosticApi.getStudentMatrices();
      setStudentMatrices(data.studentMatrices || []);
      if (data.studentMatrices && data.studentMatrices.length > 0) {
        setSelectedStudent(data.studentMatrices[0]);
      }
    } catch (error) {
      console.error('학생 누적 혼동행렬 조회 실패:', error);
      alert('혼동행렬 데이터를 불러오는데 실패했습니다.');
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 3) return;
    taskApi.getAll().then(({ data }) => setTasks(data)).catch(console.error);
    statsApi.getAll().then(({ data }) => setAllCellStats(data)).catch(console.error);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 3 || analyticsSubTab !== 'students') return;
    fetchStudentMatrices();
  }, [activeTab, analyticsSubTab, fetchStudentMatrices]);

  useEffect(() => {
    if (activeTab !== 3 || analyticsSubTab !== 'reports') return;
    setReportLoading(true);
    reportApi.getAll()
      .then(({ data }) => setReportItems(data || []))
      .catch(() => setReportItems([]))
      .finally(() => setReportLoading(false));
  }, [activeTab, analyticsSubTab]);

  const fetchTaskStats = useCallback(async (taskId) => {
    setSelectedTaskId(taskId);
    setSelectedCrop(null);
    const { data } = await statsApi.getByTaskId(taskId);
    setStats(data);

    const task = tasks.find(t => t.id === taskId) || (await taskApi.getAll()).data.find(t => t.id === taskId);
    if (task?.originalFilename) {
      setImageLoaded(false);
      fetchAuthImage(imageUrl.original(task.originalFilename))
        .then(url => {
          const img = new Image();
          img.onload = () => { URL.revokeObjectURL(url); setOriginalImage(img); setImageLoaded(true); };
          img.onerror = () => URL.revokeObjectURL(url);
          img.src = url;
        })
        .catch(() => {});
    }
  }, [tasks]);

  useEffect(() => {
    if (!canvasRef.current || !originalImage || !imageLoaded) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const maxWidth = 700;
    const scale = maxWidth / originalImage.width;
    canvas.width = maxWidth;
    canvas.height = originalImage.height * scale;

    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    stats.forEach((crop, index) => {
      if (!crop.bbox) return;
      const bbox = JSON.parse(crop.bbox.replace(/'/g, '"'));
      const [x1, y1, x2, y2] = bbox;
      const color = getAccuracyColor(crop.accuracyRate, crop.totalAnswers);

      ctx.strokeStyle = color;
      ctx.lineWidth = selectedCrop?.cropId === crop.cropId ? 4 : 2;
      ctx.strokeRect(x1 * scale, y1 * scale, (x2 - x1) * scale, (y2 - y1) * scale);

      ctx.fillStyle = color;
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`${index + 1}`, x1 * scale + 2, y1 * scale - 4);
    });
  }, [originalImage, imageLoaded, stats, selectedCrop]);

  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !originalImage) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const imgScale = canvas.width / originalImage.width;

    for (const crop of stats) {
      if (!crop.bbox) continue;
      const bbox = JSON.parse(crop.bbox.replace(/'/g, '"'));
      const [x1, y1, x2, y2] = bbox;
      if (x >= x1 * imgScale && x <= x2 * imgScale && y >= y1 * imgScale && y <= y2 * imgScale) {
        setSelectedCrop(crop);
        return;
      }
    }
  };

  const handleConfirmLabel = async (cropId, finalLabel) => {
    try {
      await cropApi.confirm(cropId, finalLabel);
      fetchTaskStats(selectedTaskId);
    } catch { alert('Confirmation failed.'); }
  };

  const handleLabelingExport = async (taskId) => {
    try {
      const { data } = await labelingApi.exportTask(taskId);
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `task_${taskId}_labeling.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('라벨링 ZIP을 생성하지 못했습니다.');
    }
  };

  const handleLabelingImport = async (taskId, file) => {
    if (!file) return;
    try {
      const manifest = JSON.parse(await file.text());
      const { data } = await labelingApi.importTask(taskId, manifest);
      const [smearResponse, cropResponse] = await Promise.all([adminApi.getSmears(), adminApi.getCrops()]);
      setSmears(smearResponse.data || []);
      setCrops(cropResponse.data || []);
      if (selectedTaskId === taskId) {
        await fetchTaskStats(taskId);
      }
      alert(`${data.updated}개 세포의 GT 라벨을 반영했습니다.`);
    } catch {
      alert('annotations.json 형식 또는 라벨 값을 확인해 주세요.');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={{ ...tabBar, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex' }}>
          <button onClick={() => setActiveTab(1)} style={activeTab === 1 ? tabActive : tabInactive}>1. Smear Images</button>
          <button onClick={() => setActiveTab(2)} style={activeTab === 2 ? tabActive : tabInactive}>2. Cell (Crop) Images</button>
          <button onClick={() => setActiveTab(3)} style={activeTab === 3 ? tabActive : tabInactive}>3. Analytics &amp; Feedback</button>
          <button onClick={() => setActiveTab(4)} style={activeTab === 4 ? tabActive : tabInactive}>4. User Management</button>
        </div>
        <a href="/game" target="_blank" rel="noopener noreferrer" title="관리자 전용 게임" style={{ fontSize: '18px', opacity: 0.25, textDecoration: 'none', paddingBottom: '4px', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.25}>🎮</a>
      </div>

      {activeTab === 1 && (
        <div style={boxStyle}>
          <h2 style={sectionHeader}>도말 이미지 목록</h2>
          <div style={filterBar}>
            <select value={smearFilter} onChange={(e) => setSmearFilter(e.target.value)} style={filterSelect}>
              <option value="all">전체</option>
              <option value="labeled">라벨 있음</option>
              <option value="unlabeled">라벨 없음</option>
            </select>
            <input
              value={smearQuery}
              onChange={(e) => setSmearQuery(e.target.value)}
              placeholder="파일명 검색"
              style={filterInput}
            />
          </div>

          {smearLoading ? (
            <div style={{ color: '#6c757d' }}>불러오는 중...</div>
          ) : filteredSmears.length === 0 ? (
            <div style={{ color: '#adb5bd' }}>도말 이미지가 없습니다.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={tableHeadStyle}>Preview</th>
                    <th style={tableHeadStyle}>Task</th>
                    <th style={tableHeadStyle}>File Name</th>
                    <th style={tableHeadStyle}>Created At</th>
                    <th style={tableHeadStyle}>Total Crops</th>
                    <th style={tableHeadStyle}>Labeled Crops</th>
                    <th style={tableHeadStyle}>라벨 상태</th>
                    <th style={tableHeadStyle}>JSON Labeling</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSmears.map((item) => (
                    <tr key={item.taskId}>
                      <td style={tableCellStyle}>
                        <AuthImage
                          src={imageUrl.thumbnail(item.originalFilename)}
                          fallbackSrc={imageUrl.original(item.originalFilename)}
                          alt={`Smear ${item.taskId}`}
                          style={inventorySmearThumbStyle}
                        />
                      </td>
                      <td style={tableCellStyle}>#{item.taskId}</td>
                      <td style={{ ...tableCellStyle, wordBreak: 'break-all' }} title={item.originalFilename}>{item.uploadedFilename || item.originalFilename}</td>
                      <td style={tableCellStyle}>{item.createdAt || '-'}</td>
                      <td style={tableCellStyle}>{item.totalCrops}</td>
                      <td style={tableCellStyle}>{item.labeledCrops}</td>
                      <td style={tableCellStyle}>{item.hasLabel ? '라벨 있음' : '라벨 없음'}</td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', gap: '6px', whiteSpace: 'nowrap' }}>
                          <button onClick={() => handleLabelingExport(item.taskId)} style={tableActionStyle}>Export</button>
                          <label style={tableActionStyle}>
                            Import
                            <input
                              type="file"
                              accept="application/json,.json"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                handleLabelingImport(item.taskId, e.target.files?.[0]);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 2 && (
        <div style={boxStyle}>
          <h2 style={sectionHeader}>세포(크롭) 이미지 목록</h2>
          <div style={filterBar}>
            <select value={cropFilter} onChange={(e) => setCropFilter(e.target.value)} style={filterSelect}>
              <option value="all">전체</option>
              <option value="labeled">라벨 있음</option>
              <option value="unlabeled">라벨 없음</option>
            </select>
            <input
              value={cropQuery}
              onChange={(e) => setCropQuery(e.target.value)}
              placeholder="파일명 검색"
              style={filterInput}
            />
          </div>

          {cropLoading ? (
            <div style={{ color: '#6c757d' }}>불러오는 중...</div>
          ) : filteredCrops.length === 0 ? (
            <div style={{ color: '#adb5bd' }}>크롭 이미지가 없습니다.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={tableHeadStyle}>Preview</th>
                    <th style={tableHeadStyle}>Crop</th>
                    <th style={tableHeadStyle}>Labeling Filename</th>
                    <th style={tableHeadStyle}>Smear File</th>
                    <th style={tableHeadStyle}>Task</th>
                    <th style={tableHeadStyle}>GT Label</th>
                    <th style={tableHeadStyle}>Pseudo Label</th>
                    <th style={tableHeadStyle}>Final Label</th>
                    <th style={tableHeadStyle}>라벨 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCrops.map((item) => (
                    <tr key={item.cropId}>
                      <td style={tableCellStyle}>
                        <AuthImage
                          src={imageUrl.crop(item.cropFilename)}
                          alt={`Crop ${item.cropId}`}
                          style={inventoryCropThumbStyle}
                        />
                      </td>
                      <td style={tableCellStyle}>#{item.cropId}</td>
                      <td style={{ ...tableCellStyle, wordBreak: 'break-all' }} title={item.cropFilename}>{`task_${item.taskId}_cell_${item.cropId}.jpg`}</td>
                      <td style={{ ...tableCellStyle, wordBreak: 'break-all' }} title={item.originalSmearFilename || ''}>{displaySmearFilename(item)}</td>
                      <td style={tableCellStyle}>#{item.taskId}</td>
                      <td style={tableCellStyle}>{item.gtLabel || '-'}</td>
                      <td style={tableCellStyle}>{item.pseudoLabel || '-'}</td>
                      <td style={tableCellStyle}>{item.finalLabel || '-'}</td>
                      <td style={tableCellStyle}>{item.hasLabel ? '라벨 있음' : '라벨 없음'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 3 && (
        <div style={boxStyle}>
          <div style={subTabBar}>
            <button onClick={() => setAnalyticsSubTab('tasks')} style={analyticsSubTab === 'tasks' ? subTabActive : subTabInactive}>📋 Tasks</button>
            <button onClick={() => setAnalyticsSubTab('cells')} style={analyticsSubTab === 'cells' ? subTabActive : subTabInactive}>🔬 Cells</button>
            <button onClick={() => setAnalyticsSubTab('students')} style={analyticsSubTab === 'students' ? subTabActive : subTabInactive}>🧑‍🎓 Student Matrices</button>
            <button onClick={() => setAnalyticsSubTab('reports')} style={analyticsSubTab === 'reports' ? subTabActive : subTabInactive}>Reports</button>
          </div>

          {analyticsSubTab === 'tasks' && (
            <div>
              {/* ── 과제 내부 뷰: 선택된 assignment의 도말 목록 ── */}
              {selectedAssignmentId ? (() => {
                const group = assignmentGroups.find(g => g.id === selectedAssignmentId);
                if (!group) return null;
                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <button
                        onClick={() => { setSelectedAssignmentId(null); setSelectedTaskId(null); setStats([]); setSelectedCrop(null); }}
                        style={{ background: 'none', border: '1px solid #ced4da', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', color: '#495057' }}
                      >← 목록으로</button>
                      <h3 style={{ ...sectionHeader, margin: 0 }}>{group.title}</h3>
                      <span style={{ fontSize: '13px', color: '#6c757d' }}>({group.tasks.length}개 도말)</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '25px' }}>
                      {group.tasks.map((task, idx) => (
                        <button key={task.id} onClick={() => fetchTaskStats(task.id)} style={{
                          ...taskBtnStyle,
                          ...(selectedTaskId === task.id ? { background: '#495057', color: '#fff', borderColor: '#495057' } : {}),
                          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', minWidth: '180px',
                        }}>
                          <AuthImage src={imageUrl.thumbnail(task.originalFilename)} fallbackSrc={imageUrl.original(task.originalFilename)} alt={`Smear ${idx + 1}`} style={{ width: '160px', height: '120px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px', border: '1px solid #dee2e6' }} />
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>도말 #{idx + 1}</div>
                          <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px', wordBreak: 'break-all', textAlign: 'center' }}>
                            {task.uploadedFilename || task.originalFilename}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })() : (
                /* ── 과제 목록 뷰 ── */
                <div>
                  <h3 style={sectionHeader}>Select a Task</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
                    {/* 과제 그룹 카드 */}
                    {assignmentGroups.map(group => (
                      <div key={group.id} style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '14px 16px', background: '#fff', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                        onClick={() => { setSelectedAssignmentId(group.id); setSelectedTaskId(null); setStats([]); setSelectedCrop(null); }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                      >
                        <AuthImage src={imageUrl.thumbnail(group.tasks[0]?.originalFilename)} fallbackSrc={imageUrl.original(group.tasks[0]?.originalFilename)} alt={group.title} style={{ width: '72px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #dee2e6', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '15px', color: '#212529' }}>{group.title}</div>
                          <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '3px' }}>도말 {group.tasks.length}개</div>
                        </div>
                        <span style={{ fontSize: '13px', color: '#adb5bd' }}>▶</span>
                      </div>
                    ))}

                    {/* 개별 과제 (assignment 없는 것) */}
                    {individualTasks.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {individualTasks.map(task => (
                          <button key={task.id} onClick={() => fetchTaskStats(task.id)} style={{
                            ...taskBtnStyle,
                            ...(selectedTaskId === task.id ? { background: '#495057', color: '#fff', borderColor: '#495057' } : {}),
                            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', minWidth: '180px',
                          }}>
                            <AuthImage src={imageUrl.thumbnail(task.originalFilename)} fallbackSrc={imageUrl.original(task.originalFilename)} alt={`Task ${task.id}`} style={{ width: '160px', height: '120px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px', border: '1px solid #dee2e6' }} />
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>Task #{task.id}</div>
                            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px', wordBreak: 'break-all', textAlign: 'center' }}>
                              {task.uploadedFilename || task.originalFilename}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Diagnostic Tasks */}
                    {tasks.filter(isDiagnosticTask).length > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Diagnostic Tasks</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {tasks.filter(isDiagnosticTask).map(task => {
                            const diagnosticNumber = diagnosticTaskOrder.get(task.id);
                            return (
                              <button key={task.id} onClick={() => fetchTaskStats(task.id)} style={{
                                ...taskBtnStyle,
                                ...(selectedTaskId === task.id ? { background: '#495057', color: '#fff', borderColor: '#495057' } : {}),
                                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', minWidth: '180px',
                              }}>
                                <div style={{ width: '160px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e9ecef', borderRadius: '6px', marginBottom: '8px', border: '1px solid #dee2e6', fontSize: '12px', color: '#6c757d', fontWeight: '700' }}>
                                  Diagnostic Task
                                </div>
                                <div style={{ fontWeight: '600', fontSize: '14px' }}>Diagnostic #{diagnosticNumber || task.id}</div>
                                <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px', wordBreak: 'break-all', textAlign: 'center' }}>
                                  {task.uploadedFilename || task.originalFilename}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTaskId && stats.length > 0 && selectedAnalyticsTask && !isDiagnosticTask(selectedAnalyticsTask) && (
                <div style={labelingToolsStyle}>
                  <div>
                    <strong>JSON Labeling</strong>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '3px' }}>
                      읽기 쉬운 파일명의 이미지 묶음과 annotations.json을 내려받아 라벨링할 수 있습니다.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleLabelingExport(selectedTaskId)} style={labelingActionStyle}>Export ZIP</button>
                    <label style={labelingActionStyle}>
                      Import JSON
                      <input
                        type="file"
                        accept="application/json,.json"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          handleLabelingImport(selectedTaskId, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {selectedTaskId && stats.length > 0 && (
                <div style={{ display: 'flex', gap: '25px', marginTop: '20px' }}>
                  <div style={{ flex: '0 0 720px' }}>
                    <h3 style={sectionHeader}>Blood Smear Image</h3>
                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                      <canvas ref={canvasRef} onClick={handleCanvasClick} style={{ width: '100%', cursor: 'pointer', borderRadius: '4px' }} />
                      <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', color: '#495057', fontWeight: '600' }}>Accuracy Legend:</span>
                        {[
                          { color: '#adb5bd', label: 'N/A' },
                          { color: '#dc3545', label: '0-20%' },
                          { color: '#fd7e14', label: '20-40%' },
                          { color: '#ffc107', label: '40-60%' },
                          { color: '#7cb342', label: '60-80%' },
                          { color: '#28a745', label: '80-100%' },
                        ].map(({ color, label }) => (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ width: '16px', height: '16px', background: color, borderRadius: '3px' }} />
                            <span style={{ fontSize: '12px', color: '#6c757d' }}>{label}</span>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: '13px', color: '#6c757d', marginTop: '10px' }}>
                        Click on a bounding box to view cell details. Colors indicate student accuracy rate.
                      </p>
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: '350px' }}>
                    <h3 style={sectionHeader}>Cell Classification Panel</h3>
                    {selectedCrop ? (
                      <div style={cellPanelStyle}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                          <AuthImage src={imageUrl.crop(selectedCrop.filename)} alt="Selected Cell" style={{ width: '150px', height: '150px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #dee2e6', background: '#fff' }} />
                          <div style={{ marginTop: '8px', fontSize: '14px', color: '#495057', fontWeight: '600' }}>
                            Cell #{stats.findIndex(s => s.cropId === selectedCrop.cropId) + 1}
                          </div>
                          {displaySmearFilename(selectedCrop) !== '-' && (
                            <div style={{ marginTop: '6px', fontSize: '12px', color: '#6c757d', wordBreak: 'break-all' }}>
                              Smear: {displaySmearFilename(selectedCrop)}
                            </div>
                          )}
                        </div>

                        {selectedCrop.gtLabel && (
                          <div style={infoBadge}>
                            <span style={{ color: '#6c757d' }}>정답(GT):</span>
                            <span style={{ fontWeight: '700', color: '#0056b3', marginLeft: '10px', fontSize: '16px' }}>{selectedCrop.gtLabel}</span>
                          </div>
                        )}

                        <div style={{ marginTop: '20px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '10px' }}>
                            📊 Student Vote Distribution ({selectedCrop.totalAnswers} responses)
                          </div>
                          <VoteBar voteDistribution={selectedCrop.voteDistribution} totalAnswers={selectedCrop.totalAnswers} />
                        </div>

                        <div style={{ marginTop: '20px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', color: '#495057' }}>Student Accuracy:</span>
                            <span style={{ fontSize: '18px', fontWeight: '700', color: getAccuracyColor(selectedCrop.accuracyRate, selectedCrop.totalAnswers) }}>
                              {selectedCrop.finalLabel && selectedCrop.totalAnswers > 0 ? `${selectedCrop.accuracyRate}%` : 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#856404', marginBottom: '10px' }}>
                            🎯 Set Ground Truth
                          </div>
                          {selectedCrop.finalLabel ? (
                            <div style={{ color: '#155724', background: '#d4edda', padding: '10px', borderRadius: '6px' }}>
                              ✅ Confirmed: <strong>{selectedCrop.finalLabel}</strong>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <select id={`gt_${selectedCrop.cropId}`} defaultValue={selectedCrop.gtLabel || CELL_KEYS[0]} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}>
                                {CELL_KEYS.map(label => <option key={label} value={label}>{label}</option>)}
                              </select>
                              <button onClick={() => handleConfirmLabel(selectedCrop.cropId, document.getElementById(`gt_${selectedCrop.cropId}`).value)} style={confirmBtn}>
                                Confirm
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ ...cellPanelStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: '#6c757d' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔍</div>
                          <div>Click on a cell in the image to view details</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTaskId && stats.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>No cells found for this task.</div>
              )}
            </div>
          )}

          {analyticsSubTab === 'cells' && (
            <div>
              <h3 style={sectionHeader}>All Cells (Sorted by Error Rate)</h3>
              <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
                Total: {allCellStats.length} cells across all tasks
              </p>

              {allCellStats.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px', marginTop: '15px' }}>
                  {allCellStats.map((item) => (
                    <div key={item.cropId} style={{
                      background: '#fff', border: `2px solid ${getAccuracyColor(item.accuracyRate, item.totalAnswers)}`,
                      padding: '15px', borderRadius: '8px', cursor: 'pointer', transition: 'transform 0.2s',
                    }} onClick={() => {
                      setAnalyticsSubTab('tasks');
                      fetchTaskStats(item.taskId || selectedTaskId);
                      setSelectedCrop(item);
                    }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <AuthImage src={imageUrl.crop(item.filename)} alt="cell" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #dee2e6', background: '#f8f9fa' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '5px' }}>
                            Crop #{item.cropId}
                          </div>
                          <div style={{ fontSize: '12px', marginBottom: '3px' }}>
                            {item.finalLabel && item.totalAnswers > 0 ? (
                              <>Error Rate: <strong style={{ color: getAccuracyColor(item.accuracyRate, item.totalAnswers) }}>{item.errorRate}%</strong></>
                            ) : (
                              <span style={{ color: '#adb5bd' }}>Not scored yet</span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>Responses: {item.totalAnswers}</div>
                          {displaySmearFilename(item) !== '-' && (
                            <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px', wordBreak: 'break-all' }}>
                              Smear: {displaySmearFilename(item)}
                            </div>
                          )}
                          {(item.finalLabel || item.gtLabel) && (
                            <div style={{ fontSize: '11px', color: '#155724', marginTop: '5px', background: '#d4edda', padding: '2px 6px', borderRadius: '3px', display: 'inline-block' }}>
                              ✅ {item.finalLabel || item.gtLabel}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>No cells found.</div>
              )}
            </div>
          )}

          {analyticsSubTab === 'students' && (
            <div>
              <h3 style={sectionHeader}>Cumulative Student Matrices</h3>
              <div style={{ display: 'flex', gap: '25px', marginTop: '20px' }}>
                <div style={{ flex: '0 0 250px', background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '15px' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '15px', color: '#495057' }}>학생 목록</h4>
                  {studentMatrices.length === 0 ? (
                    <div style={{ color: '#adb5bd', fontSize: '14px' }}>학생 데이터가 없습니다.</div>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {studentMatrices.map((student, idx) => (
                        <li
                          key={idx}
                          style={{
                            padding: '10px', marginBottom: '8px', borderRadius: '6px', cursor: 'pointer',
                            background: selectedStudent?.studentId === student.studentId ? '#e7f3ff' : '#f8f9fa',
                            border: selectedStudent?.studentId === student.studentId ? '1px solid #74c0fc' : '1px solid #e9ecef',
                          }}
                          onClick={() => setSelectedStudent(student)}
                        >
                          <div style={{ fontWeight: '600', color: selectedStudent?.studentId === student.studentId ? '#0056b3' : '#495057' }}>
                            {student.studentDisplayName || student.studentId}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                            정확도: {student.accuracy}% ({student.totalSolved}문제)
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div style={{ flex: 1, background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' }}>
                  {selectedStudent ? (
                    <div>
                      <h4 style={{ fontWeight: '600', marginBottom: '15px', fontSize: '18px', color: '#495057' }}>
                        [{selectedStudent.studentDisplayName || selectedStudent.studentId}] 학생의 혼동행렬
                      </h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px' }}>
                          <thead>
                            <tr>
                              <th style={{ border: '1px solid #dee2e6', padding: '10px', background: '#f8f9fa', width: '120px' }}>GT \ 응답</th>
                              {CELL_KEYS.map(key => (
                                <th key={key} style={{ border: '1px solid #dee2e6', padding: '10px', background: '#f8f9fa', color: '#495057' }}>
                                  {key.substring(0, 3)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {CELL_KEYS.map(actual => (
                              <tr key={actual}>
                                <td style={{ border: '1px solid #dee2e6', padding: '10px', fontWeight: 'bold', background: '#f8f9fa', color: '#495057' }}>
                                  {actual}
                                </td>
                                {(() => {
                                  const rowTotal = CELL_KEYS.reduce((sum, predicted) => {
                                    const value = selectedStudent.confusionMatrix?.[actual]?.[predicted] || 0;
                                    return sum + value;
                                  }, 0);

                                  return CELL_KEYS.map(predicted => {
                                    const count = selectedStudent.confusionMatrix?.[actual]?.[predicted] || 0;
                                    const isCorrect = actual === predicted;
                                    const cellStyle = getMatrixCellStyle(count, rowTotal, isCorrect);
                                    const pct = rowTotal > 0 ? Math.round((count / rowTotal) * 100) : 0;
                                    const title = rowTotal > 0
                                      ? `${count} (${pct}%)`
                                      : '0 (0%)';

                                    return (
                                      <td
                                        key={predicted}
                                        title={title}
                                        style={{
                                          border: '1px solid #dee2e6',
                                          padding: '10px',
                                          ...cellStyle,
                                        }}
                                      >
                                        {count}
                                      </td>
                                    );
                                  });
                                })()}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#adb5bd' }}>
                      왼쪽에서 학생을 선택하면 혼동행렬이 표시됩니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {analyticsSubTab === 'reports' && (

            <div>
              <h3 style={sectionHeader}>Crop Issue Reports</h3>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '8px' }}>사유 필터</div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {Object.keys(reportFilters).map((key) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#495057' }}>
                      <input
                        type="checkbox"
                        checked={reportFilters[key]}
                        onChange={(e) => setReportFilters(prev => ({ ...prev, [key]: e.target.checked }))}
                      />
                      {key}
                    </label>
                  ))}
                </div>
              </div>
              {reportLoading ? (
                <div style={{ color: '#6c757d' }}>불러오는 중...</div>
              ) : reportItems.length === 0 ? (
                <div style={{ color: '#adb5bd' }}>신고된 항목이 없습니다.</div>
              ) : (
                (() => {
                  const activeFilters = Object.entries(reportFilters)
                    .filter(([, enabled]) => enabled)
                    .map(([key]) => key);
                  const filteredItems = activeFilters.length === 0
                    ? []
                    : reportItems.filter(item => activeFilters.includes(getReportCategory(item.reason)));

                  if (filteredItems.length === 0) {
                    return <div style={{ color: '#adb5bd' }}>해당 사유의 신고가 없습니다.</div>;
                  }

                  return (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr>
                        <th style={reportHeadStyle}>이미지</th>
                        <th style={reportHeadStyle}>시간</th>
                        <th style={reportHeadStyle}>학생</th>
                        <th style={reportHeadStyle}>Task</th>
                        <th style={reportHeadStyle}>Crop</th>
                        <th style={reportHeadStyle}>사유</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr key={item.id}>
                          <td style={reportCellStyle}>
                            {item.cropFilename ? (
                              <AuthImage
                                src={imageUrl.crop(item.cropFilename)}
                                alt={`Crop ${item.cropId}`}
                                style={reportThumbStyle}
                              />
                            ) : (
                              <div style={{ color: '#adb5bd' }}>N/A</div>
                            )}
                          </td>
                          <td style={reportCellStyle}>{item.createdAt || '-'}</td>
                          <td style={reportCellStyle}>{item.studentId}</td>
                          <td style={reportCellStyle}>#{item.taskId}</td>
                          <td style={reportCellStyle}>#{item.cropId}</td>
                          <td style={reportCellStyle}>{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                  );
                })()
              )}
            </div>
          )}
        </div>
      )}
      {activeTab === 4 && (
        <div style={boxStyle}>
          <h2 style={sectionHeader}>사용자 관리</h2>

          <div style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px', marginBottom: '25px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#495057', marginBottom: '15px' }}>새 계정 생성</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <div style={fieldLabel}>아이디 *</div>
                <input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} placeholder="username" style={fieldInput} />
              </div>
              <div>
                <div style={fieldLabel}>이름</div>
                <input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} placeholder="홍길동" style={fieldInput} />
              </div>
              <div>
                <div style={fieldLabel}>비밀번호 *</div>
                <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="password" style={fieldInput} />
              </div>
              <div>
                <div style={fieldLabel}>역할</div>
                <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))} style={{ ...fieldInput, width: '130px' }}>
                  <option value="EXPERT">EXPERT (교수)</option>
                  <option value="STUDENT">STUDENT (학생)</option>
                </select>
              </div>
              <button onClick={handleCreateUser} style={{ padding: '9px 20px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', height: '38px' }}>
                생성
              </button>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px', marginBottom: '25px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#495057', marginBottom: '6px' }}>학생 사전 등록 명단 (Student Roster)</h3>
            <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '12px' }}>
              여기 등록된 학번으로 회원가입하면 즉시 승인(ACTIVE)되고, 명단에 없는 학번은 관리자 승인 대기(PENDING) 상태가 됩니다. 학번을 줄바꿈/쉼표/공백으로 구분해 여러 개 입력할 수 있습니다.
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <textarea
                value={rosterInput}
                onChange={e => setRosterInput(e.target.value)}
                placeholder={'예) 2021123456\n2021123457, 2021123458'}
                rows={3}
                style={{ ...fieldInput, width: 'auto', minWidth: '320px', flex: 1, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <button onClick={handleAddRoster} style={{ padding: '9px 20px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', height: '38px' }}>
                등록
              </button>
            </div>
            {rosterLoading ? (
              <div style={{ color: '#6c757d', marginTop: '12px' }}>불러오는 중...</div>
            ) : roster.length === 0 ? (
              <div style={{ color: '#adb5bd', marginTop: '12px' }}>등록된 학번이 없습니다.</div>
            ) : (
              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {roster.map(item => (
                  <span key={item.id} style={{
                    padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                    background: item.claimedUserId ? '#e7f3ff' : '#f8f9fa',
                    color: item.claimedUserId ? '#0056b3' : '#495057',
                    border: '1px solid #dee2e6'
                  }} title={item.claimedUserId ? '가입 완료' : '미가입'}>
                    {item.studentId}{item.claimedUserId ? ' ✓' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>

          {userLoading ? (
            <div style={{ color: '#6c757d' }}>불러오는 중...</div>
          ) : users.length === 0 ? (
            <div style={{ color: '#adb5bd' }}>등록된 사용자가 없습니다.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={tableHeadStyle}>ID</th>
                    <th style={tableHeadStyle}>아이디</th>
                    <th style={tableHeadStyle}>이름</th>
                    <th style={tableHeadStyle}>역할</th>
                    <th style={tableHeadStyle}>상태</th>
                    <th style={tableHeadStyle}>생성일</th>
                    <th style={tableHeadStyle}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const statusStyle = {
                      ACTIVE: { background: '#e6f7ec', color: '#28a745' },
                      PENDING: { background: '#fff8e6', color: '#d39e00' },
                      REJECTED: { background: '#fbe9eb', color: '#dc3545' },
                      INACTIVE: { background: '#f1f3f5', color: '#6c757d' },
                    }[user.status] || { background: '#f8f9fa', color: '#495057' };
                    return (
                      <tr key={user.id}>
                        <td style={tableCellStyle}>#{user.id}</td>
                        <td style={tableCellStyle}>{user.username}</td>
                        <td style={tableCellStyle}>{user.name || '-'}</td>
                        <td style={tableCellStyle}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', background: user.role === 'EXPERT' ? '#e7f3ff' : '#f8f9fa', color: user.role === 'EXPERT' ? '#0056b3' : '#495057' }}>
                            {user.role}
                          </span>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', ...statusStyle }}>
                            {user.status}
                          </span>
                        </td>
                        <td style={tableCellStyle}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</td>
                        <td style={tableCellStyle}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {user.status === 'PENDING' && (
                              <>
                                <button onClick={() => handleUpdateUserStatus(user, 'ACTIVE')} style={{ padding: '5px 10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                  승인
                                </button>
                                <button onClick={() => handleUpdateUserStatus(user, 'REJECTED')} style={{ padding: '5px 10px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                  거절
                                </button>
                              </>
                            )}
                            {user.status === 'REJECTED' && (
                              <button onClick={() => handleUpdateUserStatus(user, 'ACTIVE')} style={{ padding: '5px 10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                승인
                              </button>
                            )}
                            {user.status === 'ACTIVE' && (
                              <button onClick={() => handleUpdateUserStatus(user, 'INACTIVE')} style={{ padding: '5px 10px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                비활성화
                              </button>
                            )}
                            {user.status === 'INACTIVE' && (
                              <button onClick={() => handleUpdateUserStatus(user, 'ACTIVE')} style={{ padding: '5px 10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                재활성화
                              </button>
                            )}
                            <button onClick={() => handleDeleteUser(user.username)} style={{ padding: '5px 10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────── Styles ──────────────── */
const containerStyle = { maxWidth: '1600px', width: '95%', margin: '0 auto', padding: '20px', fontFamily: 'Inter, sans-serif', color: '#343a40' };

const tabBar = { display: 'flex', borderBottom: '1px solid #dee2e6', marginBottom: '25px' };
const tabActive = { padding: '12px 24px', background: '#343a40', color: '#fff', border: '1px solid #343a40', fontWeight: '600', cursor: 'pointer' };
const tabInactive = { padding: '12px 24px', background: '#f8f9fa', color: '#6c757d', border: '1px solid #dee2e6', borderBottom: 'none', cursor: 'pointer' };

const boxStyle = { background: '#f8f9fa', border: '1px solid #dee2e6', padding: '25px', borderRadius: '4px' };
const sectionHeader = { fontSize: '16px', fontWeight: '600', color: '#495057', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #e9ecef' };
const taskBtnStyle = { padding: '12px 18px', background: '#fff', border: '2px solid #dee2e6', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', minWidth: '100px' };
const cellPanelStyle = { background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '20px' };
const infoBadge = { background: '#e7f3ff', padding: '12px 15px', borderRadius: '8px', fontSize: '14px' };
const confirmBtn = { background: '#495057', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' };
const labelingToolsStyle = { marginBottom: '18px', padding: '14px 16px', border: '1px solid #b6d4fe', borderRadius: '8px', background: '#eef6ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap' };
const labelingActionStyle = { display: 'inline-flex', alignItems: 'center', padding: '9px 13px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' };

const subTabBar = { display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '2px solid #dee2e6', paddingBottom: '15px' };
const subTabActive = { padding: '10px 20px', background: '#495057', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' };
const subTabInactive = { padding: '10px 20px', background: '#e9ecef', color: '#495057', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' };

const filterBar = { display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap' };
const filterSelect = { padding: '8px 10px', border: '1px solid #ced4da', borderRadius: '6px', background: '#fff' };
const filterInput = { padding: '8px 10px', border: '1px solid #ced4da', borderRadius: '6px', minWidth: '220px' };

const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' };
const tableHeadStyle = { borderBottom: '2px solid #dee2e6', padding: '10px', background: '#f8f9fa', fontWeight: '600', color: '#495057' };
const tableCellStyle = { borderBottom: '1px solid #dee2e6', padding: '10px', color: '#495057' };
const tableActionStyle = { display: 'inline-flex', alignItems: 'center', padding: '6px 9px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' };
const inventorySmearThumbStyle = { width: '92px', height: '64px', objectFit: 'cover', display: 'block', borderRadius: '6px', border: '1px solid #dee2e6', background: '#f8f9fa' };
const inventoryCropThumbStyle = { width: '64px', height: '64px', objectFit: 'contain', display: 'block', borderRadius: '6px', border: '1px solid #dee2e6', background: '#f8f9fa' };

const reportHeadStyle = { borderBottom: '2px solid #dee2e6', padding: '10px', background: '#f8f9fa', fontWeight: '600', color: '#495057' };
const reportCellStyle = { borderBottom: '1px solid #dee2e6', padding: '10px', color: '#495057' };
const reportThumbStyle = { width: '48px', height: '48px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #dee2e6', background: '#f8f9fa' };

const fieldLabel = { fontSize: '12px', color: '#6c757d', marginBottom: '4px', fontWeight: '500' };
const fieldInput = { padding: '8px 10px', border: '1px solid #ced4da', borderRadius: '6px', width: '160px', fontSize: '14px' };
