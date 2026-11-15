import test from 'node:test';
import assert from 'node:assert/strict';
import {createCourseworkMock} from './coursework.js';
import {createProfessorMock} from './professor.js';
import {groupCoursework,distributeQuestions,savePayload} from '../src/utils/coursework.js';

function setup() {
  const tasks=[{id:1,status:'DRAFT',kind:'PRACTICE',revision:0,originalFilename:'a.png',title:'Draft',speciesId:1,classLabels:{Band:'Band'}}];
  const cells=[{cropId:11,taskId:1,filename:'1.png',bbox:'[0,0,10,10]'}, {cropId:12,taskId:1,filename:'2.png',bbox:'[10,10,20,20]'}];
  const cropStats=new Map([[1,cells]]), answers={}, animals=[{id:1,code:'DOG',name:'Dog'},{id:2,code:'CAT',name:'Cat'}];
  const users=[],roster=[];
  const context={tasks,cropStats,species:()=>animals,labels:['Band'],makeCrop:()=>({}),cropDto:c=>({...c,id:c.cropId}),answersFor:id=>answers[id]||={},json:(res,data,status=200)=>Object.assign(res,{data,status}),readJson:async req=>req.body,reviewFor:()=>null};
  const workflow=createCourseworkMock(context);
  const professor=createProfessorMock({...context,users:()=>users,roster:()=>roster,students:()=>users.map(u=>({studentId:u.username})),finalized:workflow.finalized});
  async function call(path,method='GET',body=null,role='EXPERT') {
    const req={method,body},res={},url=new URL(path,'http://test');
    const user={role,username:'s1'};
    if(!await professor.handle(req,res,url,user))await workflow.handle(req,res,url,user);
    return res;
  }
  const payload=()=>({title:'Class',revisions:{1:tasks[0].revision},cells:cells.map(c=>({cropId:c.cropId,label:c.finalLabel||null,excluded:Boolean(c.excluded),exclusionReason:c.exclusionReason||null})),requireLabels:false});
  return {tasks,cells,answers,call,payload};
}

test('labeled draft is private until explicit publish; exclusion is persisted; stale save is rejected',async()=>{
  const f=setup(),body=f.payload();body.requireLabels=true;body.cells[0].label='Band';body.cells[1].excluded=true;body.cells[1].exclusionReason='false detection';
  assert.equal((await f.call('/api/coursework/1','PUT',body)).status,200);
  assert.equal(f.tasks[0].status,'DRAFT');
  assert.equal((await f.call('/api/coursework/1','GET',null,'STUDENT')).status,403);
  assert.equal((await f.call('/api/coursework/1','PUT',body)).status,409);
  const saved=await f.call('/api/coursework/1');assert.equal(saved.data.tasks[0].task.cropCount,1);
  assert.equal((await f.call('/api/coursework/1/publish','POST',f.payload())).status,200);
  assert.equal(f.tasks[0].status,'IN_PROGRESS');
});
test('unlabeled publishing and unknown final response; file import later; copied identities are separate',async()=>{
  const f=setup();assert.equal((await f.call('/api/coursework/1/publish','POST',f.payload())).status,200);
  f.answers.s1={11:'UNKNOWN',12:'Band'};
  const result=await f.call('/api/student/tasks/1/finalize','POST',{},'STUDENT');assert.equal(result.data.submitted,true);assert.equal(result.data.reviewAvailable,false);
  assert.equal((await f.call('/api/labeling/tasks/1/import','POST',{annotations:[{cropId:11,label:'Band'},{cropId:12,label:'Band'}]})).data.updated,2);
  const copy=(await f.call('/api/coursework/1/copy','POST')).data;assert.notEqual(copy.tasks[0].crops[0].id,11);assert.equal(copy.tasks[0].task.status,'DRAFT');
});
test('label-required publishing rejects incomplete truth and cross-task labels',async()=>{
  const f=setup();assert.equal((await f.call('/api/coursework/1/publish','POST',{...f.payload(),requireLabels:true})).status,400);
  assert.equal((await f.call('/api/labeling/tasks/1/import','POST',{annotations:[{cropId:99,label:'Band'}]})).status,400);
  assert.equal(f.tasks[0].status,'DRAFT');
});
test('class settings do not rewrite old task snapshots; professor account API always creates students',async()=>{
  const f=setup();const added=await f.call('/api/species/1/classes','POST',{code:'Basophil',name:'Basophil'});assert.equal(added.status,200);
  await f.call(`/api/species/1/classes/${added.data.id}`,'PUT',{name:'Basophil renamed',active:false});
  assert.deepEqual(f.tasks[0].classLabels,{Band:'Band'});
  assert.equal((await f.call('/api/professor/students','POST',{username:'new',name:'Student',password:'password123',role:'ADMIN'})).status,200);
  assert.equal((await f.call('/api/professor/students')).data[0].role,'STUDENT');
  assert.equal((await f.call('/api/species/1/classes','GET',null,'STUDENT')).status,403);
});
test('unified list orders diagnostics first, groups smears and allocates only available questions',()=>{
  const groups=groupCoursework([{id:4,kind:'PRACTICE',assignmentId:5,cropCount:2},{id:3,kind:'DIAGNOSTIC',cropCount:3},{id:2,kind:'PRACTICE',assignmentId:5,cropCount:4}]);
  assert.equal(groups[0].kind,'DIAGNOSTIC');assert.equal(groups[1].cropCount,6);
  assert.deepEqual(distributeQuestions(7,{Band:2,Segment:8}),{Band:2,Segment:5});
  const saved=savePayload({tasks:[{task:{id:1,revision:2},crops:[{id:3}]}]},{title:' Example ',deadlineAt:'',requireLabels:false,resultsAfterDeadline:false},{3:{excluded:true,exclusionReason:'bad location'}});
  assert.equal(saved.title,'Example');assert.equal(saved.cells[0].excluded,true);assert.deepEqual(saved.revisions,{1:2});
});
