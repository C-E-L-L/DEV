import { REPORT_REASONS } from '../constants.js';

export function parseQuestion(reason) {
  const text = String(reason || '').trim();
  const category = REPORT_REASONS.find(value => text === value || text.startsWith(`${value}:`));
  return {
    category: category || '기타',
    body: category ? text.slice(category.length).replace(/^:\s*/, '').trim() || category : text || '질문 내용이 없습니다.',
  };
}

export function questionCoursework(items) {
  return new Map(items.flatMap(item => item.tasks.map(task => [String(task.id), { title: item.title, path: item.path }])));
}

export function matchesQuestion(item, { status = 'all', category = 'all', search = '' } = {}, courseTitle = '') {
  const answered = Boolean(item.replies?.length);
  const text = [courseTitle, item.reason, ...(item.replies || []).map(reply => reply.message)].join(' ').toLocaleLowerCase();
  return (status === 'all' || (status === 'answered' ? answered : !answered))
    && (category === 'all' || category === parseQuestion(item.reason).category)
    && text.includes(search.trim().toLocaleLowerCase());
}
