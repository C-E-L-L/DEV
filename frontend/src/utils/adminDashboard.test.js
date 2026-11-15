import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateMatrix, weeklySubmissions } from './adminDashboard.js';
test('matrix sums student counts, excludes ALL and retains missing-class rows',()=>{
  const matrix=aggregateMatrix({labels:['Band','Custom'],studentMatrices:[{studentId:'s1',unknownCount:1,confusionMatrix:{Band:{Band:2,Custom:1}}},{studentId:'s2',confusionMatrix:{Band:{Custom:1}}},{studentId:'ALL',confusionMatrix:{Band:{Band:100}}}]});
  assert.equal(matrix.total,4);assert.equal(matrix.accuracy,50);assert.equal(matrix.unknown,1);assert.equal(matrix.counts.Custom.Custom,0);
});
test('weekly finalizations respect Monday boundaries and ignore future/old events',()=>{
  const progress={items:[{submitted:[{studentId:'s1',finalizedAt:'2026-11-15T20:00:00'},{studentId:'s2',finalizedAt:'2026-11-16T01:00:00'},{studentId:'s3',finalizedAt:'2026-11-17T01:00:00'},{studentId:'s4',finalizedAt:'2025-01-01T00:00:00'}]}]};
  const result=weeklySubmissions(progress,new Date('2026-11-16T05:00:00'));
  assert.equal(result.length,8);assert.equal(result.at(-2).count,1);assert.equal(result.at(-1).count,1);assert.equal(result.reduce((sum,w)=>sum+w.count,0),2);
});
