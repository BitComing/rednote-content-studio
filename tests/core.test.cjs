require('../scripts/register-ts.cjs');
const { test } = require('node:test'); const assert = require('node:assert/strict'); const path = require('node:path');
const { chooseRevisionRoute } = require('../src/lib/campus.ts');
const { parseJudge, aggregateJudges, evaluateOutput } = require('../src/lib/evaluation.ts');
const { splitPlatformContent, parseOutputs, runDifyWorkflow, reviseDifyWorkflow } = require('../src/lib/dify.ts');
const { createMockRun, createMockRevision } = require('../src/lib/mock.ts');
const { retrieveKnowledge } = require('../src/lib/knowledge.ts');
const { validateBrief } = require('../src/lib/validation.ts');
const input = { brief: '校园咖啡店：美式18元。', tone: '自然友好 Natural and friendly', language: '简体中文', platforms: ['小红书'], toneDetails: '', bannedWords: '保过', files: [], scenario: 'exam' };
function request(patch={}) { return { run: createMockRun(input), feedback: '', scoreFeedback: '', verifiedCorrections: '', toneChoice: '保持原 tone', trend: '不附加热点', revisionMode: 'auto', ...patch }; }
function judge(value=4, blocks=[]) { return JSON.stringify({ dimensions: { factuality:value,safety:value,campusFit:value,tone:value,clarity:value }, reasons: { factuality:'原文支持',safety:'无保证',campusFit:'自习场景',tone:'符合',clarity:'清楚' }, blocks }); }
const review = JSON.stringify({score:85,verdict:'pass',issues:[],claims:[{platform:'小红书',claim:'美式18元',source_quote:'美式18元',status:'supported'}]});
const outputs = { content:'## 小红书\n美式18元', review:'通过规则检查', review_json:review, score:85, status:'yes', documents_text:'商家确认美式18元' };
test('tone-only routes without content or fact regeneration',()=>assert.equal(chooseRevisionRoute(request({toneChoice:'专业可信 Professional'})),'tone'));
test('verified corrections take precedence over a tone request',()=>assert.equal(chooseRevisionRoute(request({revisionMode:'tone',verifiedCorrections:'美式改为20元，商家确认'})),'facts'));
test('score-only disagreement bypasses generation',()=>assert.equal(chooseRevisionRoute(request({scoreFeedback:'适配性评分理由不足'})),'reevaluate'));
test('mixed feedback uses general content route',()=>assert.equal(chooseRevisionRoute(request({feedback:'简短一点并删去第二段',toneChoice:'专业可信 Professional'})),'content'));
test('trend change cannot silently pass through tone or score branch',()=>{assert.throws(()=>chooseRevisionRoute(request({revisionMode:'tone',trend:'校园市集'})));assert.throws(()=>chooseRevisionRoute(request({revisionMode:'reevaluate',feedback:'改标题'})));});
test('facts require explicit verified material',()=>assert.throws(()=>chooseRevisionRoute(request({revisionMode:'facts'}))));
test('regenerate explicitly selects reusable first workflow',()=>assert.equal(chooseRevisionRoute(request({revisionMode:'regenerate'})),'regenerate'));
test('headings inside a post are not lost or split into platforms',()=>{const d=splitPlatformContent('## 小红书\n开头\n## 活动详情\n18元\n## 朋友圈\n另一段',['小红书','朋友圈']);assert.match(d[0].content,/活动详情\n18元/);assert.equal(d[1].content,'另一段');});
test('invalid reviews and blocked workflow outputs fail closed',()=>{assert.equal(parseOutputs({...outputs,review_json:'bad'},['小红书']).canApprove,false);assert.equal(parseOutputs({...outputs,status:'blocked'},['小红书']).canApprove,false);});
test('missing platform remains empty and blocking instead of duplicating another post',()=>{const x=parseOutputs(outputs,['小红书','朋友圈']);assert.equal(x.drafts[1].firstRound,'');assert.equal(x.canApprove,false);});
test('server calculates weighted totals from all dimensions',()=>assert.equal(parseJudge(judge(),'a',10).score,80));
test('malformed and out-of-range dimensions rejected',()=>{assert.throws(()=>parseJudge(judge(6),'a',1));assert.throws(()=>parseJudge('{"dimensions":{},"blocks":[]}','a',1));});
test('high averages never cancel a blocking risk',()=>{const a=aggregateJudges([parseJudge(judge(5,['价格无依据']),'a',2),parseJudge(judge(5),'b',2)],3);assert.equal(a.mean,100);assert.equal(a.requiresReview,true);});
test('judge failures and large disagreement require review',()=>{assert.equal(aggregateJudges([parseJudge(judge(5),'a',1),parseJudge(judge(3),'b',1)],2).requiresReview,true);assert.equal(aggregateJudges([parseJudge(judge(),'a',1),{model:'b',status:'error',blocks:[],elapsedMs:1}],2).status,'partial');});
test('one model cannot be labelled a completed multi-model evaluation',()=>assert.equal(aggregateJudges([parseJudge(judge(),'a',1)],1).status,'partial'));
test('knowledge retrieval does not fabricate merchant facts',()=>assert.equal(retrieveKnowledge('unknown','club').filter(k=>k.kind==='fact').length,0));
test('invalid API inputs rejected',()=>{assert.throws(()=>validateBrief({...input,files:null}));assert.throws(()=>validateBrief({...input,tone:'unknown'}));assert.throws(()=>validateBrief({...input,brief:''}));});
test('demo revisions retain version history and never fake increased scores or fact support',()=>{const a=createMockRun(input);const b=createMockRevision(request({run:a,feedback:'改标题'}));const c=createMockRevision(request({run:b,feedback:'再改语气'}));assert.equal(c.history.length,3);assert.ok(c.drafts[0].secondRound.startsWith(b.drafts[0].secondRound));assert.equal(c.score,-1);assert.equal(c.evaluation.mean,null);assert.equal(c.canApprove,false);});
test('real adapter sends latest copy, feedback, tone and cumulative facts to second key; preserves original brief',async()=>{
  const savedFetch=global.fetch; const old={...process.env}; const calls=[];
  Object.assign(process.env,{DIFY_CONFIG_PATH:path.join(__dirname,'nonexistent-config.json'),DIFY_API_BASE_URL:'https://test.invalid/v1',DIFY_API_KEY:'test-first',DIFY_REVISION_API_KEY:'test-second',EVAL_MODELS:'judge-a,judge-b',EVAL_BASE_URL:'https://eval.invalid/v1',EVAL_API_KEY:'test-eval'});
  global.fetch=async(url,init)=>{ const body=JSON.parse(init.body);calls.push({url,body,auth:init.headers.Authorization});return new Response(JSON.stringify(String(url).includes('eval.invalid') ? {choices:[{message:{content:judge()}}]} : {workflow_run_id:'wf-test',data:{status:'succeeded',outputs:{...outputs,content:body.inputs.revision_mode ? '## 小红书\n修订稿，美式18元' : outputs.content,status:body.inputs.revision_mode ? 'ready' : 'yes'}}}),{status:200,headers:{'Content-Type':'application/json'}}); };
  try { const a=await runDifyWorkflow(input); assert.equal(a.canApprove,true);assert.equal(a.history.length,1);
    const b=await reviseDifyWorkflow(request({run:a,toneChoice:'专业可信 Professional'})); const c=await reviseDifyWorkflow(request({run:b,feedback:'再简短'}));
    const wf=calls.filter(c=>c.url.includes('test.invalid'));assert.equal(wf.length,3);assert.equal(wf[0].auth,'Bearer test-first');assert.equal(wf[1].auth,'Bearer test-second');assert.equal(wf[1].body.inputs.revision_mode,'tone');assert.equal(wf[2].body.inputs.round1_content,'## 小红书\n修订稿，美式18元');assert.equal(wf[2].body.inputs.voice_and_tone,'专业可信 Professional');assert.equal(wf[2].body.inputs.draft,input.brief);assert.equal(c.history.length,3);assert.equal(c.history[0].content,'## 小红书\n美式18元');
    delete process.env.DIFY_REVISION_API_KEY; await assert.rejects(()=>reviseDifyWorkflow(request({run:c,feedback:'改稿'})),/改稿工作流 API Key/);
    process.env.EVAL_MODELS='deepseek/deepseek-v4-flash';const same=await evaluateOutput('x','x',{});assert.equal(same.judges[0].status,'error');
  } finally {global.fetch=savedFetch; for(const k of Object.keys(process.env)) if(!(k in old)) delete process.env[k];Object.assign(process.env,old);}
});
