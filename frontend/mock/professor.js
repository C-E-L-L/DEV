import {isDiagnostic,isPublished} from '../src/utils/coursework.js';

export function createProfessorMock({tasks,cropStats,species,users,roster,students,answersFor,finalized,labels,json,readJson,reports=()=>[]}) {
  const catalogs=new Map();
  const classes=id=>{id=Number(id);if(!catalogs.has(id))catalogs.set(id,labels.map((code,i)=>({id:id*1000+i+1,speciesId:id,code,name:code,active:true})));return catalogs.get(id);};
  const activeLabels=id=>Object.fromEntries(classes(id).filter(c=>c.active).map(c=>[c.code,c.name]));
  const schema=t=>Object.keys(t.classLabels||Object.fromEntries(labels.map(l=>[l,l]))).sort().join('|');
  const fail=(res,message,status=400)=>{json(res,{message},status);return true;};
  async function handle(req,res,url,user){
    const path=url.pathname, classMatch=path.match(/^\/api\/species\/(\d+)\/classes(?:\/(\d+))?$/), activeMatch=path.match(/^\/api\/species\/(\d+)\/active$/);
    if(!path.startsWith('/api/professor/')&&!classMatch&&!activeMatch)return false;
    if(!user||!['EXPERT','ADMIN'].includes(user.role))return fail(res,'교수 계정이 필요합니다.',403);
    if(activeMatch&&req.method==='PUT'){const animal=species().find(s=>s.id===Number(activeMatch[1]));if(!animal)return fail(res,'종을 찾을 수 없습니다.',404);animal.active=Boolean((await readJson(req)).active);json(res,animal);return true;}
    if(classMatch){
      const id=Number(classMatch[1]);if(!species().some(s=>s.id===id))return fail(res,'종을 찾을 수 없습니다.',404);
      if(req.method==='GET'){json(res,classes(id));return true;}
      const body=await readJson(req);if(!body.name?.trim()||body.name.length>100)return fail(res,'클래스 이름을 확인해주세요.');
      if(req.method==='POST'){
        if(!/^[A-Za-z][A-Za-z0-9_]{0,59}$/.test(body.code)||body.code==='UNKNOWN'||classes(id).some(c=>c.code===body.code))return fail(res,'유효하지 않거나 중복된 코드입니다.');
        const item={id:id*1000+classes(id).length+1,speciesId:id,code:body.code,name:body.name.trim(),active:true};classes(id).push(item);json(res,item);return true;
      }
      const item=classes(id).find(c=>c.id===Number(classMatch[2]));if(!item)return fail(res,'클래스를 찾을 수 없습니다.',404);
      Object.assign(item,{name:body.name.trim(),active:Boolean(body.active)});json(res,item);return true;
    }
    if(path==='/api/professor/students/roster'){
      if(req.method==='GET'){json(res,roster());return true;}
      let added=0,skipped=0;for(const raw of (await readJson(req)).studentIds||[]){const studentId=raw.trim();if(!studentId||roster().some(s=>s.studentId===studentId)){skipped++;continue;}roster().push({id:Math.max(...roster().map(s=>s.id),0)+1,studentId,registeredBy:user.username,claimedUserId:null,createdAt:new Date().toISOString()});added++;}json(res,{added,skipped});return true;
    }
    if(path==='/api/professor/students'){
      if(req.method==='GET'){json(res,users().filter(u=>u.role==='STUDENT'));return true;}
      const body=await readJson(req);if(!body.username?.trim()||!body.name?.trim()||body.password?.length<8||users().some(u=>u.username===body.username))return fail(res,'계정 정보를 확인해주세요.');
      users().push({id:Math.max(...users().map(u=>u.id),0)+1,username:body.username.trim(),name:body.name.trim(),role:'STUDENT',status:'ACTIVE',createdAt:new Date().toISOString()});json(res,{success:true});return true;
    }
    if(path==='/api/professor/calibration'){
      const animal=species().find(s=>s.id===Number(url.searchParams.get('speciesId')))||species()[0],source=url.searchParams.get('source')||'INITIAL';
      const eligible=tasks.filter(t=>isPublished(t)&&t.speciesId===animal.id&&(source==='ALL'||isDiagnostic(t))).sort((a,b)=>b.id-a.id);
      const schemas=[...new Set(eligible.map(schema))],selected=url.searchParams.get('schema')||schemas[0]||Object.keys(activeLabels(animal.id)).sort().join('|'),codes=selected.split('|');
      const studentMatrices=students().map(student=>{
        let chosen=eligible.filter(t=>schema(t)===selected&&finalized([t],student.studentId)).sort((a,b)=>a.id-b.id);if(source==='INITIAL')chosen=chosen.slice(0,1);
        const confusionMatrix=Object.fromEntries(codes.map(c=>[c,Object.fromEntries(codes.map(p=>[p,0]))])),sampleCounts=Object.fromEntries(codes.map(c=>[c,0]));let totalSolved=0,correct=0,unknownCount=0;
        for(const task of chosen)for(const cell of cropStats.get(task.id)||[]){const answer=answersFor(student.studentId)[cell.cropId];if(cell.excluded||!cell.finalLabel||!answer)continue;if(answer==='UNKNOWN'){unknownCount++;continue;}if(!confusionMatrix[cell.finalLabel]||!codes.includes(answer))continue;confusionMatrix[cell.finalLabel][answer]++;sampleCounts[cell.finalLabel]++;totalSolved++;if(answer===cell.finalLabel)correct++;}
        return {...student,confusionMatrix,sampleCounts,totalSolved,accuracy:totalSolved?Math.floor(correct*100/totalSolved):0,unknownCount,sourceTaskIds:chosen.map(t=>t.id),missingClasses:codes.filter(c=>!sampleCounts[c])};
      });json(res,{speciesId:animal.id,speciesName:animal.name,source,schema:selected,schemas,labels:codes,studentMatrices});return true;
    }
    // Professor console: class list import, submission progress, activity feed (same shapes as the backend).
    if(path==='/api/professor/students/roster/import'&&req.method==='POST'){
      let added=0,updated=0,skipped=0;const seen=new Set();
      for(const row of (await readJson(req)).rows||[]){
        const studentId=String(row?.studentId||'').trim(),name=row?.name?.trim()||null,section=row?.section?.trim()||null;
        if(!studentId||seen.has(studentId)){skipped++;continue;}seen.add(studentId);
        const existing=roster().find(s=>s.studentId===studentId);
        if(!existing){roster().push({id:Math.max(...roster().map(s=>s.id),0)+1,studentId,name,section,registeredBy:user.username,claimedUserId:null,createdAt:new Date().toISOString()});added++;}
        else if((name&&name!==existing.name)||(section&&section!==existing.section)){Object.assign(existing,{name:name||existing.name,section:section||existing.section});updated++;}
        else skipped++;
      }
      json(res,{added,updated,skipped});return true;
    }
    const scopes=()=>{const groups=new Map();for(const t of [...tasks].sort((a,b)=>b.id-a.id)){if(!isPublished(t))continue;const key=t.assignmentId?`A${t.assignmentId}`:`T${t.id}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(t);}return [...groups.values()];};
    const title=t=>t.title||(isDiagnostic(t)?'진단평가':t.uploadedFilename||`Task #${t.id}`);
    const deadline=group=>group.map(t=>t.deadlineAt).filter(Boolean).sort()[0]||null;
    if(path==='/api/professor/progress'){
      const section=id=>roster().find(s=>s.studentId===id)?.section||null;
      const list=students().map(s=>({studentId:s.studentId,name:s.studentName||null,section:section(s.studentId),registered:true}));
      for(const entry of roster())if(!list.some(s=>s.studentId===entry.studentId))list.push({studentId:entry.studentId,name:entry.name||null,section:entry.section||null,registered:false});
      list.sort((a,b)=>a.studentId.localeCompare(b.studentId));
      // The mock keeps no submission time, so finalizedAt is null.
      const items=scopes().map(group=>({id:group[0].id,assignmentId:group[0].assignmentId||null,taskIds:group.map(t=>t.id),title:title(group[0]),kind:isDiagnostic(group[0])?'DIAGNOSTIC':'PRACTICE',deadlineAt:deadline(group),
        submitted:list.filter(s=>s.registered&&finalized(group,s.studentId)).map(s=>({studentId:s.studentId,finalizedAt:null}))}));
      json(res,{students:list,items});return true;
    }
    if(path==='/api/professor/gradebook'){
      const section=id=>roster().find(s=>s.studentId===id)?.section||null;
      const list=students().map(s=>({studentId:s.studentId,name:s.studentName||null,section:section(s.studentId),registered:true}));
      for(const entry of roster())if(!list.some(s=>s.studentId===entry.studentId))list.push({studentId:entry.studentId,name:entry.name||null,section:entry.section||null,registered:false});
      list.sort((a,b)=>a.studentId.localeCompare(b.studentId));
      const items=[],results=[];
      for(const group of scopes()){
        const cells=group.flatMap(t=>cropStats.get(t.id)||[]).filter(c=>!c.excluded);
        items.push({id:group[0].id,taskIds:group.map(t=>t.id),title:title(group[0]),kind:isDiagnostic(group[0])?'DIAGNOSTIC':'PRACTICE',deadlineAt:deadline(group),questions:cells.length});
        // The mock keeps no per-student answers here: a final submission counts as every cell answered.
        for(const s of list)if(s.registered&&finalized(group,s.studentId)){const graded=cells.filter(c=>c.finalLabel).length;results.push({studentId:s.studentId,itemId:group[0].id,answered:cells.length,graded,correct:graded,finalizedAt:null});}
      }
      json(res,{students:list,items,results});return true;
    }
    if(path==='/api/professor/activity'){
      const name=id=>students().find(s=>s.studentId===id)?.studentName||null,events=[];
      for(const group of scopes()){const due=deadline(group);if(!due||new Date(due)>new Date())continue;
        const pendingLabels=group.flatMap(t=>cropStats.get(t.id)||[]).filter(c=>!c.excluded&&!c.finalLabel).length;
        events.push({id:`D-${group[0].id}-${due}`,type:'DEADLINE_PASSED',at:due,taskId:group[0].id,title:title(group[0]),pendingLabels});}
      for(const report of reports()){const task=tasks.find(t=>t.id===report.taskId);
        events.push({id:`Q-${report.id}`,type:'QUESTION',at:report.createdAt,taskId:report.taskId,title:task?title(task):null,studentId:report.studentId,studentName:name(report.studentId),reportId:report.id,detail:report.reason.slice(0,80),answered:Boolean(report.replies?.length)});}
      events.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
      const limit=Math.max(1,Math.min(Number(url.searchParams.get('limit'))||30,100));
      json(res,{events:events.slice(0,limit),unansweredReports:reports().filter(r=>!r.replies?.length).length});return true;
    }
    return fail(res,'지원하지 않는 요청입니다.',404);
  }
  return {handle,activeLabels};
}
