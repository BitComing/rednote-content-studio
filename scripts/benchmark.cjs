// Explicit live execution only: each case costs initial + two competing revisions + judges.
require('./register-ts.cjs');
const fs=require('node:fs');const path=require('node:path');
require('@next/env').loadEnvConfig(process.cwd());
const {runDifyWorkflow,reviseDifyWorkflow}=require('../src/lib/dify.ts');
const {getDifyConfig}=require('../src/lib/config.ts');
const cases=require('../data/evaluation-scenarios.json');
if(!process.argv.includes('--live')) {console.log('预设 6 个合成场景；每场景默认重复 3 次；每次使用同一初稿对比局部路径与重新生成。执行付费真实评估：npm run benchmark -- --live。可用 --repeats=1 --case=S1-tone 小范围检查。');process.exit(0);}
if(!getDifyConfig()?.revisionApiKey || !process.env.EVAL_API_KEY || new Set((process.env.EVAL_MODELS||'').split(',').filter(Boolean)).size<2) throw new Error('请先配置两个工作流和至少两个独立评估模型。');
const repeats=Number(process.argv.find(x=>x.startsWith('--repeats='))?.split('=')[1]||3);if(!Number.isInteger(repeats)||repeats<1||repeats>10) throw new Error('repeats 必须在 1–10 之间');
const caseId=process.argv.find(x=>x.startsWith('--case='))?.split('=')[1];const selected=caseId?cases.filter(c=>c.id===caseId):cases;if(!selected.length) throw new Error('场景编号不存在');
const dir=path.join(process.cwd(),'.data','benchmarks',new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(dir,{recursive:true});const rows=[];
function record(value){rows.push(value);fs.appendFileSync(path.join(dir,'runs.jsonl'),JSON.stringify(value)+'\n');}
(async()=>{for(const c of selected)for(let repeat=1;repeat<=repeats;repeat++){
  const input={brief:c.brief,tone:'自然友好 Natural and friendly',toneDetails:'',language:'简体中文',platforms:['小红书'],files:[],bannedWords:'保过,保证提分,全网最低',scenario:c.scenario};
  let base;try{base=await runDifyWorkflow(input);record({case:c.id,repeat,arm:'initial',run:base});}catch(e){record({case:c.id,repeat,arm:'initial',error:e.message});continue;}
  // Counterbalance ordering; both branches receive an immutable copy of the SAME first draft.
  const arms=repeat%2 ? ['targeted','regenerate'] : ['regenerate','targeted'];
  for(const arm of arms){const start=Date.now();try{const run=await reviseDifyWorkflow({run:structuredClone(base),revisionMode:arm==='targeted'?c.mode:'regenerate',feedback:c.feedback,scoreFeedback:c.mode==='reevaluate'?'请依据统一指标独立复评，不能因异议加分':'',verifiedCorrections:c.corrections,toneChoice:c.toneChoice,trend:'不附加热点'});record({case:c.id,repeat,arm,expected:c.expected,run});}catch(e){record({case:c.id,repeat,arm,error:e.message,elapsedMs:Date.now()-start});}}
}
const csv=[['case','repeat','arm','mode','version','elapsed_ms','evaluation_ms','external_mean','spread','evaluation_status','can_approve','error'],...rows.map(r=>[r.case,r.repeat,r.arm,r.run?.mode||'',r.run?.history?.length||'',r.run?.elapsedMs??r.elapsedMs??'',r.run?.evaluation?.elapsedMs??'',r.run?.evaluation?.mean??'',r.run?.evaluation?.spread??'',r.run?.evaluation?.status||'',r.run?.canApprove??'',r.error||''])].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');fs.writeFileSync(path.join(dir,'summary.csv'),'\uFEFF'+csv);
const summary={};for(const arm of ['initial','targeted','regenerate']){const all=rows.filter(r=>r.arm===arm);const times=all.filter(r=>r.run).map(r=>r.run.elapsedMs).sort((a,b)=>a-b);const avg=times.length?times.reduce((a,b)=>a+b,0)/times.length:null;summary[arm]={attempts:all.length,failures:all.filter(r=>r.error).length,completedEvaluations:all.filter(r=>r.run?.evaluation?.status==='complete').length,meanMs:avg,medianMs:times.length?(times[Math.floor((times.length-1)/2)]+times[Math.ceil((times.length-1)/2)])/2:null,stdDevMs:times.length?Math.sqrt(times.reduce((s,t)=>s+(t-avg)**2,0)/times.length):null};}fs.writeFileSync(path.join(dir,'aggregate.json'),JSON.stringify(summary,null,2));console.log('真实运行记录已保存：'+dir);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
