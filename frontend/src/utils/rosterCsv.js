// Class list CSV (학번·성명·분반) parsing for the professor's bulk student registration.

const HEADERS = {
  studentId: /^(학번|학생\s*번호|아이디|student\s*_?id|id|username)$/i,
  name: /^(성명|이름|name)$/i,
  section: /^(분반|반|section|class)$/i,
};
export const ROSTER_CSV_TEMPLATE = '﻿학번,성명,분반\r\n2026001,홍길동,1분반\r\n';
export const MAX_ROSTER_ROWS = 2000;

/** Excel on Korean Windows saves CSV as CP949/EUC-KR, so fall back when the bytes are not valid UTF-8. */
export function decodeCsvBytes(buffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('euc-kr').decode(buffer);
  }
}

/** RFC 4180 style parser: quoted fields, escaped quotes, CRLF/LF. The delimiter is detected per file. */
export function parseCsv(text) {
  const source = String(text || '').replace(/^﻿/, '');
  const firstLine = source.split(/\r?\n/, 1)[0] || '';
  const delimiter = [',', '\t', ';'].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field === '') quoted = true;
    else if (char === delimiter) { row.push(field); field = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += char;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.map(cells => cells.map(cell => cell.trim())).filter(cells => cells.some(Boolean));
}

/**
 * Returns the rows to register plus the lines that were left out and why.
 * With a header row the columns may be in any order; without one they are 학번, 성명, 분반.
 */
export function parseRosterCsv(text) {
  const lines = parseCsv(text);
  if (!lines.length) return { rows: [], problems: [], hasHeader: false };
  const header = lines[0];
  const hasHeader = header.some(cell => HEADERS.studentId.test(cell));
  const column = key => (hasHeader ? header.findIndex(cell => HEADERS[key].test(cell)) : ['studentId', 'name', 'section'].indexOf(key));
  const index = { studentId: column('studentId'), name: column('name'), section: column('section') };
  const rows = [];
  const problems = [];
  const seen = new Set();
  lines.slice(hasHeader ? 1 : 0).forEach((cells, offset) => {
    const line = offset + (hasHeader ? 2 : 1);
    const value = key => (index[key] >= 0 ? cells[index[key]] || '' : '');
    const studentId = value('studentId');
    if (!studentId) problems.push({ line, reason: '학번이 비어 있습니다.' });
    else if (studentId.length > 100) problems.push({ line, reason: '학번이 너무 깁니다.' });
    else if (seen.has(studentId)) problems.push({ line, reason: `학번 ${studentId}이(가) 파일 안에서 중복됩니다.` });
    else {
      seen.add(studentId);
      rows.push({ studentId, name: value('name').slice(0, 100) || null, section: value('section').slice(0, 50) || null });
    }
  });
  return { rows, problems, hasHeader };
}
