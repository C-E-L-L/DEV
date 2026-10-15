import { useMemo, useState } from 'react';
import { CELL_TYPES, imageUrl } from '../constants';
import { summarizeStudentResponses } from '../utils/studentResponses';
import AuthImage from './AuthImage';
import SpeciesBadge from './SpeciesBadge';

const cardStyle = { padding: '20px', border: '1px solid #dee2e6', borderRadius: '8px', background: '#fff' };
const buttonStyle = { border: '1px solid #ced4da', borderRadius: '6px', padding: '8px 12px', background: '#fff', color: '#495057', cursor: 'pointer', font: 'inherit' };

export default function StudentResponsesPanel({ crops, selectedCrop, onSelectCrop, imageFilter, smearFilename }) {
  const [studentId, setStudentId] = useState(null);
  const { students, gradingComplete, responsesAvailable } = useMemo(() => summarizeStudentResponses(crops), [crops]);
  const student = students.find(item => item.studentId === studentId);
  const cropIndex = crops.findIndex(crop => crop.cropId === selectedCrop?.cropId);
  const answer = student?.answers.get(selectedCrop?.cropId);
  const score = (item) => `${item.correctCount} / ${crops.length} (${item.accuracy.toFixed(1)}%)`;

  if (!responsesAvailable) {
    return <div style={cardStyle} role="status">학생별 응답 정보를 확인할 수 없습니다. 도말을 다시 선택해 주세요.</div>;
  }

  return (
    <div style={cardStyle}>
      {!student ? (
        <>
          <h4 style={{ margin: '0 0 8px', color: '#343a40' }}>응답한 학생 ({students.length}명)</h4>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6c757d', lineHeight: 1.6 }}>
            {gradingComplete
              ? '정답 수 / 전체 세포 수 (정답률) · 미응답 세포도 전체 세포 수에 포함됩니다.'
              : `교수 라벨링 완료 후 정답률이 표시됩니다. (현재 ${crops.filter(crop => crop.finalLabel).length} / ${crops.length})`}
          </p>
          {students.length === 0 ? (
            <p role="status" style={{ padding: '24px 0', textAlign: 'center', color: '#6c757d' }}>아직 이 도말에 응답한 학생이 없습니다.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '65vh', overflowY: 'auto' }}>
              {students.map(item => (
                <button key={item.studentId} type="button" onClick={() => {
                  setStudentId(item.studentId);
                  onSelectCrop(crops[0]);
                }} style={{ ...buttonStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '14px', textAlign: 'left' }}>
                  <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                    <strong>{item.displayName}</strong>
                    <span style={{ display: 'block', marginTop: '5px', color: '#6c757d', fontSize: '12px' }}>응답 {item.answeredCount} / {crops.length}개</span>
                  </span>
                  <span style={{ fontSize: '13px', color: gradingComplete ? '#1864ab' : '#6c757d' }}>
                    {gradingComplete ? score(item) : '채점 대기'} <span aria-hidden="true">›</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button type="button" onClick={() => setStudentId(null)} style={{ ...buttonStyle, marginBottom: '16px' }}>← 학생 목록</button>
          <h4 style={{ margin: '0 0 6px', color: '#343a40', overflowWrap: 'anywhere' }}>{student.displayName}</h4>
          <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '20px' }}>
            응답 {student.answeredCount} / {crops.length}개 · {gradingComplete ? `정답 ${score(student)}` : '교수 라벨링 완료 후 정답률 표시'}
          </div>
          {selectedCrop && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px' }}>
                  <button type="button" aria-label="이전 세포" disabled={cropIndex <= 0} onClick={() => onSelectCrop(crops[cropIndex - 1])} style={{ ...buttonStyle, opacity: cropIndex <= 0 ? 0.3 : 1 }}>◀</button>
                  <AuthImage src={imageUrl.crop(selectedCrop.filename)} alt={`Cell ${cropIndex + 1}`} style={{ width: '150px', height: '150px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #dee2e6', filter: imageFilter }} />
                  <button type="button" aria-label="다음 세포" disabled={cropIndex < 0 || cropIndex >= crops.length - 1} onClick={() => onSelectCrop(crops[cropIndex + 1])} style={{ ...buttonStyle, opacity: cropIndex >= crops.length - 1 ? 0.3 : 1 }}>▶</button>
                </div>
                <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: '600', color: '#495057' }}>Cell #{cropIndex + 1} / {crops.length}</div>
                <SpeciesBadge name={selectedCrop.speciesName} code={selectedCrop.speciesCode} compact style={{ marginTop: '6px' }} />
                {smearFilename !== '-' && <div style={{ marginTop: '6px', color: '#6c757d', fontSize: '12px', overflowWrap: 'anywhere' }}>Smear: {smearFilename}</div>}
              </div>
              <h4 style={{ margin: '0 0 12px', color: '#495057' }}>학생 응답 <span style={{ fontSize: '12px', fontWeight: 'normal' }}>(조회 전용)</span></h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {CELL_TYPES.map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px', borderRadius: '6px', border: `1px solid ${answer === key ? '#339af0' : '#e9ecef'}`, background: answer === key ? '#e7f5ff' : '#f8f9fa', color: answer === key ? '#1864ab' : '#495057', fontWeight: answer === key ? '700' : '400' }}>
                    <span aria-hidden="true">{answer === key ? '☑' : '☐'}</span>
                    <span style={{ flex: 1 }}>{label}</span>
                    {answer === key && <span style={{ fontSize: '12px' }}>학생 선택</span>}
                  </div>
                ))}
              </div>
              {!answer && <p role="status" style={{ color: '#6c757d', fontSize: '13px' }}>이 세포에는 아직 응답하지 않았습니다.</p>}
              {gradingComplete && (
                <div style={{ marginTop: '16px', padding: '12px', borderRadius: '6px', background: !answer ? '#f1f3f5' : answer === selectedCrop.finalLabel ? '#d4edda' : '#fff3cd', color: '#495057', fontSize: '13px' }}>
                  <strong>{!answer ? '미응답' : answer === selectedCrop.finalLabel ? '정답' : '오답'}</strong> · 교수 정답: {selectedCrop.finalLabel}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
