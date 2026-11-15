import { useRef, useState } from 'react';
import Icon from '../../components/login/icons';
import StudentRegistration from '../../components/StudentRegistration';
import { professorApi } from '../../api/professor';
import { decodeCsvBytes, MAX_ROSTER_ROWS, parseRosterCsv, ROSTER_CSV_TEMPLATE } from '../../utils/rosterCsv';
import { useProfessorData } from './ProfessorData';

const PREVIEW_ROWS = 8;

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([ROSTER_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = '학생명단_양식.csv';
  link.click();
  URL.revokeObjectURL(url);
}

/** Class list upload: 학번·성명·분반. Students on the list can sign up with their student ID. */
function RosterCsvImport({ onImported }) {
  const input = useRef(null);
  const [file, setFile] = useState(null); // { name, rows, problems }
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  const choose = async event => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;
    setMessage(null);
    try {
      const parsed = parseRosterCsv(decodeCsvBytes(await picked.arrayBuffer()));
      if (!parsed.rows.length) {
        setFile(null);
        setMessage({ type: 'error', text: '등록할 학번을 찾지 못했습니다. 첫 열(또는 "학번" 열)에 학번이 있는 CSV 파일인지 확인해주세요.' });
      } else if (parsed.rows.length > MAX_ROSTER_ROWS) {
        setFile(null);
        setMessage({ type: 'error', text: `한 번에 ${MAX_ROSTER_ROWS}명까지 등록할 수 있습니다. 파일을 나누어 올려주세요.` });
      } else setFile({ name: picked.name, ...parsed });
    } catch {
      setFile(null);
      setMessage({ type: 'error', text: '파일을 읽지 못했습니다. CSV 형식으로 저장한 파일을 선택해주세요.' });
    }
  };

  const submit = async () => {
    setBusy(true); setMessage(null);
    try {
      const { data } = await professorApi.importRoster(file.rows);
      setMessage({ type: 'success', text: `신규 등록 ${data.added}명 · 정보 갱신 ${data.updated}명 · 변경 없음 ${data.skipped}명` });
      setFile(null);
      onImported();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '명단을 등록하지 못했습니다. 다시 시도해주세요.' });
    } finally { setBusy(false); }
  };

  return (
    <section className="prof-card" aria-labelledby="roster-csv">
      <header className="prof-card__head">
        <h2 id="roster-csv"><Icon name="upload" size={17} />CSV 일괄 등록</h2>
        <button type="button" className="prof-btn" onClick={downloadTemplate}><Icon name="download" size={15} />양식 받기</button>
      </header>
      <div className="prof-card__body">
        <p className="prof-muted">
          학번·성명·분반 순서의 CSV 파일을 올리면 가입 허용 명단에 한 번에 등록합니다. 엑셀에서는 “CSV(쉼표로 분리)”로 저장하세요.
          성명과 분반은 비워둘 수 있고, 이미 명단에 있는 학번은 성명·분반만 갱신합니다.
        </p>
        <div className="prof-upload">
          <input ref={input} type="file" accept=".csv,text/csv" className="prof-sr" onChange={choose} aria-label="학생 명단 CSV 파일" />
          <button type="button" className="prof-btn" disabled={busy} onClick={() => input.current?.click()}><Icon name="fileText" size={15} />CSV 파일 선택</button>
          {file && <span className="prof-upload__name">{file.name}</span>}
        </div>

        {file && (
          <>
            <p className="prof-upload__summary">
              등록할 학생 <strong className="prof-mono">{file.rows.length}</strong>명
              {file.problems.length > 0 && <> · 제외된 줄 <strong className="prof-mono">{file.problems.length}</strong>개</>}
              {!file.hasHeader && ' · 머리글 없이 학번, 성명, 분반 순서로 읽었습니다'}
            </p>
            <div className="prof-table-wrap">
              <table className="prof-table prof-table--compact">
                <thead><tr><th scope="col">학번</th><th scope="col">성명</th><th scope="col">분반</th></tr></thead>
                <tbody>
                  {file.rows.slice(0, PREVIEW_ROWS).map(row => (
                    <tr key={row.studentId}><td className="prof-mono">{row.studentId}</td><td>{row.name || '—'}</td><td>{row.section || '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {file.rows.length > PREVIEW_ROWS && <p className="prof-muted">외 {file.rows.length - PREVIEW_ROWS}명</p>}
            {file.problems.length > 0 && (
              <ul className="prof-problems">
                {file.problems.slice(0, 5).map(problem => <li key={problem.line}>{problem.line}번째 줄: {problem.reason}</li>)}
                {file.problems.length > 5 && <li>외 {file.problems.length - 5}개</li>}
              </ul>
            )}
            <div className="prof-actions">
              <button type="button" className="prof-btn prof-btn--primary" disabled={busy} onClick={submit}>{busy ? '등록 중…' : `${file.rows.length}명 명단에 등록`}</button>
              <button type="button" className="prof-btn" disabled={busy} onClick={() => setFile(null)}>취소</button>
            </div>
          </>
        )}
        {message && <p role={message.type === 'error' ? 'alert' : 'status'} className={`prof-note is-${message.type}`}>{message.text}</p>}
      </div>
    </section>
  );
}

export default function StudentRegisterPage() {
  const { reload } = useProfessorData();
  const [version, setVersion] = useState(0); // remounts the roster list after an import
  return (
    <>
      <div className="prof-page-head">
        <div>
          <h1>학생 등록</h1>
          <p>명단에 등록된 학번의 학생만 바로 가입할 수 있습니다.</p>
        </div>
      </div>
      <RosterCsvImport onImported={() => { setVersion(value => value + 1); reload({ silent: true }); }} />
      <div className="professor-workspace prof-embedded prof-stack">
        <StudentRegistration key={version} defaultOpen onChanged={() => reload({ silent: true })} />
      </div>
    </>
  );
}
