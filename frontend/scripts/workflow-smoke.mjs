import assert from 'node:assert/strict';
import {createServer} from 'vite';

// Isolated, in-memory mock process. Does not connect to the application database or AI server.
const server=await createServer({mode:'mock',server:{host:'127.0.0.1',port:0,strictPort:true},logLevel:'error'});
await server.listen();
const base=`http://127.0.0.1:${server.httpServer.address().port}`;
async function call(path,{token,method='GET',body,status=200}={}) {
  const response=await fetch(`${base}/api${path}`,{method,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body && !(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body?body instanceof FormData?body:JSON.stringify(body):undefined});
  const data=await response.json();assert.equal(response.status,status,`${method} ${path}: ${JSON.stringify(data)}`);return data;
}
try {
  const teacher=(await call('/auth/login',{method:'POST',body:{username:'professor',password:'mock'}})).accessToken;
  const student=(await call('/auth/login',{method:'POST',body:{username:'student',password:'mock'}})).accessToken;
  const pool=await call('/tasks/diagnostic/pool-stats?speciesId=1',{token:teacher});assert.ok(pool.totalAvailable>0);
  const made=await call('/tasks/diagnostic/create',{token:teacher,method:'POST',body:{speciesId:1,title:'Smoke diagnostic',totalQuestions:2,classDistribution:{Band:2}}});
  const id=made.taskId;
  assert.ok(!(await call('/tasks',{token:student})).some(t=>t.id===id));
  let workspace=await call(`/coursework/${id}`,{token:teacher});
  const payload=()=>({title:'Smoke diagnostic',requireLabels:true,resultsAfterDeadline:false,revisions:Object.fromEntries(workspace.tasks.map(p=>[p.task.id,p.task.revision])),cells:workspace.tasks.flatMap(p=>p.crops).map((c,index)=>({cropId:c.id,label:c.finalLabel,excluded:index===1,exclusionReason:index===1?'false detection':null}))});
  workspace=await call(`/coursework/${id}`,{token:teacher,method:'PUT',body:payload()});
  assert.equal(workspace.tasks[0].task.status,'DRAFT');
  await call(`/coursework/${id}/publish`,{token:teacher,method:'POST',body:payload()});
  const questions=await call(`/tasks/${id}/crops`,{token:student});assert.equal(questions.length,1);assert.equal(questions[0].finalLabel,null);
  await call('/submit',{token:student,method:'POST',body:{cropId:questions[0].id,studentLabel:'UNKNOWN'}});
  assert.equal((await call(`/student/tasks/${id}/attempt`,{token:student})).submitted,false);
  assert.equal((await call(`/student/tasks/${id}/finalize`,{token:student,method:'POST',body:{}})).submitted,true);
  await call('/submit',{token:student,method:'POST',body:{cropId:questions[0].id,studentLabel:'Band'},status:400});
  const result=await call(`/tasks/${id}/my-results/student`,{token:student});assert.equal(result.details.length,1);
  const stats=await call(`/tasks/${id}/stats`,{token:teacher});assert.equal(stats.length,1);assert.equal(stats[0].voteDistribution.UNKNOWN,1);
  const form=new FormData();form.append('title','Smoke smear');form.append('speciesIds','1');form.append('files',new Blob(['mock'],{type:'image/png'}),'smear.png');
  const upload=await call('/assignments',{token:teacher,method:'POST',body:form});
  const smearId=upload.tasks[0].taskId, draft=await call(`/coursework/${smearId}`,{token:teacher});
  assert.equal(draft.tasks[0].task.status,'DRAFT');
  await call(`/labeling/tasks/${smearId}/import`,{token:teacher,method:'POST',body:{annotations:[{cropId:draft.tasks[0].crops[0].id,label:'Band'}]}});
  const data=await call('/coursework/data',{token:teacher});assert.ok(data.some(t=>t.id===smearId&&t.labeledCount===1));
  await call('/professor/calibration?speciesId=1&source=INITIAL',{token:teacher});
  await call('/species/1/classes',{token:teacher});
  await call('/professor/students/roster',{token:teacher});
  console.log('PASS: mock HTTP workflow (diagnostic, private draft, publication, exclusion, unknown, finalization, smear upload, JSON labels, data, settings, calibration).');
} finally { await server.close(); }
