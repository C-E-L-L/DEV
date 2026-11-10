import {isDiagnostic,isPublished} from '../src/utils/coursework.js';

export function createProfessorMock({tasks,cropStats,species,users,roster,students,answersFor,finalized,labels,json,readJson}) {
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
    return fail(res,'지원하지 않는 요청입니다.',404);
  }
  return {handle,activeLabels};
}
