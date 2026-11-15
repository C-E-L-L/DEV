import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminApi, taskApi, labelingApi } from '../api';
import { imageUrl } from '../constants';
import AuthImage from '../components/AuthImage';
import SpeciesBadge from '../components/SpeciesBadge';
import AnalyticsFeedback from '../components/AnalyticsFeedback';

/* ──────────────── 정답률 → 색상 ──────────────── */
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState(3);
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
      const speciesName = String(item.speciesName || '').toLowerCase();
      const speciesCode = String(item.speciesCode || '').toLowerCase();
      return original.includes(query) || uploaded.includes(query) || speciesName.includes(query) || speciesCode.includes(query);
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
      const speciesName = String(item.speciesName || '').toLowerCase();
      return cropName.includes(query) || smearName.includes(query) || speciesName.includes(query);
    });
  }, [crops, cropFilter, cropQuery, taskFilenameById]);

  /* ── Inventory JSON labeling ── */
  const handleLabelingExport = async (taskId) => {
    try {
      const { data } = await labelingApi.exportTask(taskId);
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      const metadata = smears.find(item => item.taskId === taskId) || tasks.find(item => item.id === taskId);
      link.download = `task_${taskId}_${(metadata?.speciesCode || 'DOG').toLowerCase()}_labeling.zip`;
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
      alert(`${data.updated}개 세포의 GT 라벨을 반영했습니다.`);
    } catch {
      alert('annotations.json 형식 또는 라벨 값을 확인해 주세요.');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={{ ...tabBar, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex' }}>
          <button onClick={() => setActiveTab(3)} style={activeTab === 3 ? tabActive : tabInactive}>1. Analytics &amp; Feedback</button>
          <button onClick={() => setActiveTab(1)} style={activeTab === 1 ? tabActive : tabInactive}>2. Smear Images</button>
          <button onClick={() => setActiveTab(2)} style={activeTab === 2 ? tabActive : tabInactive}>3. Cell (Crop) Images</button>
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
                    <th style={tableHeadStyle}>동물 종</th>
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
                      <td style={tableCellStyle}><SpeciesBadge name={item.speciesName} code={item.speciesCode} compact /></td>
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
                    <th style={tableHeadStyle}>동물 종</th>
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
                      <td style={{ ...tableCellStyle, wordBreak: 'break-all' }} title={item.cropFilename}>{`task_${item.taskId}_${(item.speciesCode || 'DOG').toLowerCase()}_cell_${item.cropId}.jpg`}</td>
                      <td style={{ ...tableCellStyle, wordBreak: 'break-all' }} title={item.originalSmearFilename || ''}>{displaySmearFilename(item)}</td>
                      <td style={tableCellStyle}>#{item.taskId}</td>
                      <td style={tableCellStyle}><SpeciesBadge name={item.speciesName} code={item.speciesCode} compact /></td>
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

      {activeTab === 3 && <AnalyticsFeedback />}

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

const filterBar = { display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap' };
const filterSelect = { padding: '8px 10px', border: '1px solid #ced4da', borderRadius: '6px', background: '#fff' };
const filterInput = { padding: '8px 10px', border: '1px solid #ced4da', borderRadius: '6px', minWidth: '220px' };

const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' };
const tableHeadStyle = { borderBottom: '2px solid #dee2e6', padding: '10px', background: '#f8f9fa', fontWeight: '600', color: '#495057' };
const tableCellStyle = { borderBottom: '1px solid #dee2e6', padding: '10px', color: '#495057' };
const tableActionStyle = { display: 'inline-flex', alignItems: 'center', padding: '6px 9px', background: '#0056b3', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' };
const inventorySmearThumbStyle = { width: '92px', height: '64px', objectFit: 'cover', display: 'block', borderRadius: '6px', border: '1px solid #dee2e6', background: '#f8f9fa' };
const inventoryCropThumbStyle = { width: '64px', height: '64px', objectFit: 'contain', display: 'block', borderRadius: '6px', border: '1px solid #dee2e6', background: '#f8f9fa' };

const fieldLabel = { fontSize: '12px', color: '#6c757d', marginBottom: '4px', fontWeight: '500' };
const fieldInput = { padding: '8px 10px', border: '1px solid #ced4da', borderRadius: '6px', width: '160px', fontSize: '14px' };
