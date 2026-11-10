import { isDiagnostic, isPublished } from '../src/utils/coursework.js';

export function createCourseworkMock({ tasks, cropStats, species, labels, makeCrop, cropDto, answersFor, json, readJson, reviewFor, classLabelsFor = () => Object.fromEntries(labels.map(l=>[l,l])) }) {
  const attempts = new Set(['student:103', 'student:201']);
  const scope = id => { const task = tasks.find(t => t.id === id); return task ? task.assignmentId ? tasks.filter(t => t.assignmentId === task.assignmentId) : [task] : []; };
  const activeCrops = id => (cropStats.get(id) || []).filter(c => !c.excluded);
  const taskDto = task => ({ ...task, status: task.status || 'IN_PROGRESS', kind: isDiagnostic(task) ? 'DIAGNOSTIC' : 'PRACTICE', revision: task.revision || 0,
    cropCount: activeCrops(task.id).length, excludedCount: (cropStats.get(task.id) || []).filter(c => c.excluded).length,
    labeledCount: activeCrops(task.id).filter(c => c.finalLabel).length });
  const workspace = group => ({ id: group[0].id, tasks: group.map(task => ({ task: taskDto(task), crops: (cropStats.get(task.id) || []).map(c => cropDto(c)) })) });
  const finalized = (group, student) => group.some(t => attempts.has(`${student}:${t.id}`));
  const expired = group => group.some(t => t.deadlineAt && new Date(t.deadlineAt).getTime() <= Date.now());
  const pool = id => {
    const animal = species().find(s => s.id === Number(id)) || species()[0];
    const availableByClass = Object.fromEntries(Object.keys(classLabelsFor(animal.id)).map(label => [label, labels.includes(label) && animal?.code === 'DOG' ? 12 : 0]));
    return { speciesId: animal.id, speciesCode: animal.code, speciesName: animal.name, availableByClass, totalAvailable: Object.values(availableByClass).reduce((a,b) => a+b,0) };
  };
  const fail = (res, text, code = 400) => { json(res, { message: text }, code); return true; };
  async function handle(req, res, url, user) {
    const path = url.pathname;
    const match = path.match(/^\/api\/coursework\/(\d+)(?:\/(publish|copy))?$/);
    const attempt = path.match(/^\/api\/student\/tasks\/(\d+)\/(attempt|finalize)$/);
    const importing = path.match(/^\/api\/labeling\/tasks\/(\d+)\/import$/);
    const diagnostic = path.startsWith('/api/tasks/diagnostic/') && !path.endsWith('student-matrices');
    if (!(path.startsWith('/api/coursework/') || attempt || importing || diagnostic)) return false;
    if (!user) return fail(res, '로그인이 필요합니다.', 401);
    if (!attempt && !['ADMIN','EXPERT'].includes(user.role)) return fail(res, '교수 또는 관리자만 사용할 수 있습니다.', 403);
    if (attempt) {
      if (user.role !== 'STUDENT') return fail(res, '학생 계정으로 제출해주세요.', 403);
      const group = scope(Number(attempt[1]));
      if (!group.length || group.some(t => !isPublished(t))) return fail(res, '게시된 과제를 찾을 수 없습니다.', 404);
      let submitted = finalized(group, user.username);
      if (attempt[2] === 'finalize' && req.method === 'POST' && !submitted) {
        const crops = group.flatMap(t => activeCrops(t.id));
        if (expired(group)) return fail(res, '이미 마감된 과제입니다.');
        if (!crops.length || crops.some(c => !answersFor(user.username)[c.cropId])) return fail(res, '모든 문항에 응답해주세요.');
        group.forEach(t => attempts.add(`${user.username}:${t.id}`)); submitted = true;
      }
      json(res, { submitted, locked: submitted || expired(group), reviewAvailable: Boolean(reviewFor(group,user.username)) }); return true;
    }
    if (path === '/api/tasks/diagnostic/pool-stats' && req.method === 'GET') { json(res, pool(url.searchParams.get('speciesId'))); return true; }
    if (path === '/api/tasks/diagnostic/create' && req.method === 'POST') {
      const body = await readJson(req); const available = pool(body.speciesId);
      const distribution = body.classDistribution || {};
      if (!Number.isInteger(body.totalQuestions) || body.totalQuestions < 1 || Object.values(distribution).reduce((a,b)=>a+b,0) !== body.totalQuestions
        || Object.entries(distribution).some(([label,n]) => !labels.includes(label) || !Number.isInteger(n) || n < 0 || n > available.availableByClass[label])) return fail(res, '문항 수와 클래스별 보유량을 확인해주세요.');
      const id = Math.max(...tasks.map(t=>t.id),0)+1;
      const task = { id, classLabels:classLabelsFor(available.speciesId), kind:'DIAGNOSTIC', status:'DRAFT', revision:0, assignmentId:null, title:body.title || '진단평가', originalFilename:'', uploadedFilename:`diagnostic-${id}`, speciesId:available.speciesId, speciesCode:available.speciesCode, speciesName:available.speciesName, createdAt:new Date().toISOString(), requireLabels:true, deadlineAt:null };
      tasks.push(task);
      const crops=[];
      for (const [label,n] of Object.entries(distribution)) for(let i=0;i<n;i++) {
        const index=crops.length; const crop=makeCrop(id,index%11);
        crops.push({...crop,cropId:id*1000+index+1,filename:`mock-cell-${id}-${index+1}.svg`,gtLabel:label,finalLabel:label,totalAnswers:0,voteDistribution:{},votersByLabel:{}});
      }
      cropStats.set(id,crops); json(res,{taskId:id,crops:crops.map(c=>cropDto(c)),totalDetected:crops.length});return true;
    }
    if (path === '/api/coursework/data' && req.method === 'GET') { json(res,tasks.filter(t=>t.originalFilename).map(taskDto)); return true; }
    if (importing && req.method === 'POST') {
      const id=Number(importing[1]), task=tasks.find(t=>t.id===id), cells=cropStats.get(id)||[];
      if (!task || isDiagnostic(task)) return fail(res,'도말 자료를 찾을 수 없습니다.',404);
      const body=await readJson(req); let entries=body.annotations;
      if (!entries && body._via_img_metadata) entries=Object.values(body._via_img_metadata).flatMap(img=>(img.regions||[]).map(region=>{
        const attrs=region.region_attributes||{}, key=Object.keys(attrs['1']||{}).find(k=>attrs['1'][k]);
        return {cropId:Number(attrs.cropId),label:labels[Number(key)-1]};
      }));
      if (!Array.isArray(entries)) return fail(res,'annotations 배열 또는 VIA JSON을 올려주세요.');
      const changes=[], used=new Set();
      for(const item of entries){
        if(!item.label) continue;
        if(!Object.keys(task.classLabels || Object.fromEntries(labels.map(l=>[l,l]))).includes(item.label)) return fail(res,`지원하지 않는 라벨: ${item.label}`);
        const candidates=cells.filter(c=>item.cropId!=null ? c.cropId===Number(item.cropId) : item.cropFilename ? c.filename===item.cropFilename : JSON.stringify(JSON.parse(c.bbox))===JSON.stringify(item.bbox));
        if(candidates.length!==1 || used.has(candidates[0].cropId)) return fail(res,'라벨과 탐지 세포가 일대일로 연결되지 않습니다. 해당 도말의 JSON 양식을 사용해주세요.');
        used.add(candidates[0].cropId);changes.push([candidates[0],item.label]);
      }
      if(!changes.length) return fail(res,'반영할 라벨이 없습니다.');
      changes.forEach(([cell,label])=>{cell.finalLabel=label;cell.gtLabel=label;});task.revision=(task.revision||0)+1;
      json(res,{updated:changes.length});return true;
    }
    if(match){
      const id=Number(match[1]), action=match[2], group=scope(id);
      if(!group.length)return fail(res,'과제를 찾을 수 없습니다.',404);
      if(req.method==='GET'&&!action){json(res,workspace(group));return true;}
      if(req.method==='POST'&&action==='copy'){
        const source=tasks.find(t=>t.id===id), copyId=Math.max(...tasks.map(t=>t.id))+1;
        const target={...source,id:copyId,assignmentId:null,status:'DRAFT',revision:0,title:`${source.title} (복사)`,publishedAt:null,deadlineAt:null,createdAt:new Date().toISOString()};
        tasks.push(target);cropStats.set(copyId,(cropStats.get(id)||[]).map((c,i)=>({...structuredClone(c),taskId:copyId,cropId:copyId*1000+i+1,totalAnswers:0,voteDistribution:{},votersByLabel:{}})));
        json(res,workspace([target]));return true;
      }
      if(req.method==='PUT'||(req.method==='POST'&&action==='publish')){
        const body=await readJson(req), cells=group.flatMap(t=>cropStats.get(t.id)||[]), byId=new Map(cells.map(c=>[c.cropId,c]));
        if(group.some(t=>t.status!=='DRAFT'))return fail(res,'이미 게시된 과제입니다. 새 과제로 복사해주세요.');
        if(group.some(t=>body.revisions?.[t.id]!== (t.revision||0)))return fail(res,'다른 화면에서 변경된 자료입니다. 최신 내용을 다시 불러와주세요.',409);
        if(!body.title?.trim()||body.title.length>200)return fail(res,'과제 제목을 1~200자로 입력해주세요.');
        const edits=body.cells||[],seen=new Set();
        for(const edit of edits){
          if(!byId.has(edit.cropId)||seen.has(edit.cropId)|| (edit.label&&!Object.keys(tasks.find(t=>t.id===byId.get(edit.cropId)?.taskId)?.classLabels || Object.fromEntries(labels.map(l=>[l,l]))).includes(edit.label)) ||(edit.excluded&&!edit.exclusionReason?.trim()))return fail(res,'문항 라벨과 제외 사유를 확인해주세요.');
          seen.add(edit.cropId);
        }
        const proposed=cells.map(c=>{const e=edits.find(e=>e.cropId===c.cropId);return e?{...c,finalLabel:e.label||null,excluded:e.excluded}:c;});
        const active=proposed.filter(c=>!c.excluded);
        if(action==='publish'){
          if(!active.length)return fail(res,'출제 가능한 세포가 하나 이상 있어야 합니다.');
          if((isDiagnostic(group[0])||body.requireLabels)&&active.some(c=>!c.finalLabel))return fail(res,'정답 미확정 문항이 있습니다.');
          if(body.deadlineAt && new Date(body.deadlineAt).getTime()<=Date.now())return fail(res,'마감일은 현재 시각 이후로 설정해주세요.');
          if(body.resultsAfterDeadline&&!body.deadlineAt)return fail(res,'마감 후 공개에는 마감일이 필요합니다.');
        }
        edits.forEach(e=>Object.assign(byId.get(e.cropId),{finalLabel:e.label||null,excluded:e.excluded,exclusionReason:e.excluded?e.exclusionReason:null}));
        group.forEach(t=>Object.assign(t,{title:body.title.trim(),deadlineAt:body.deadlineAt,requireLabels:isDiagnostic(t)||body.requireLabels,resultsAfterDeadline:body.resultsAfterDeadline,revision:(t.revision||0)+1,...(action==='publish'?{status:'IN_PROGRESS',publishedAt:new Date().toISOString()}:{})}));
        json(res,workspace(group));return true;
      }
    }
    return fail(res,'지원하지 않는 요청입니다.',404);
  }
  return { handle, scope, activeCrops, taskDto, finalized, expired };
}
