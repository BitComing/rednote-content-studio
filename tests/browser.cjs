const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs'); const path = require('node:path'); const assert = require('node:assert/strict');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3186';
const out=path.join(process.cwd(),'test-results');fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1500,height:1000}});const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base);await page.getByRole('button',{name:'运行工作流',exact:true}).click();
    await page.getByRole('button',{name:'提交处理 · 版本 2',exact:true}).waitFor();
    const first=await page.evaluate(async()=>{const id=localStorage.getItem('campus-studio-last-run');return (await fetch('/api/runs/'+id)).json();});
    assert.equal(first.mode,'mock');assert.equal(first.history.length,1);
    await page.getByLabel('本次改稿语气',{exact:true}).selectOption('专业可信 Professional');
    const secondResponse=page.waitForResponse(r=>r.url().endsWith('/api/revise')&&r.request().method()==='POST');
    await page.getByRole('button',{name:'提交处理 · 版本 2',exact:true}).click();const second=await (await secondResponse).json();assert.equal(second.route,'tone');assert.equal(second.history.length,2);
    await page.getByLabel('已核实事实补充',{exact:true}).fill('【合成测试】商家确认营业时间为09:00–18:00。');
    const thirdResponse=page.waitForResponse(r=>r.url().endsWith('/api/revise')&&r.request().method()==='POST');
    await page.getByRole('button',{name:'提交处理 · 版本 3',exact:true}).click();const third=await (await thirdResponse).json();assert.equal(third.route,'facts');assert.equal(third.history.length,3);
    await page.getByLabel('评分异议',{exact:true}).fill('请按固定指标复核校园适配程度，不要因异议加分。');
    const fourthResponse=page.waitForResponse(r=>r.url().endsWith('/api/revise')&&r.request().method()==='POST');
    await page.getByRole('button',{name:'提交处理 · 版本 4',exact:true}).click();const fourth=await (await fourthResponse).json();assert.equal(fourth.route,'reevaluate');assert.equal(fourth.history.length,4);assert.equal(fourth.history[3].content,fourth.history[2].content);
    await page.reload();await page.getByRole('button',{name:'提交处理 · 版本 5',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'通过当前稿',exact:true}).isEnabled(),false);
    await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);assert.equal(overflow,false);
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
    const stale=await page.request.post(`${base}/api/revise`,{data:{runId:first.id,expectedVersion:1,revisionMode:'tone',feedback:'',scoreFeedback:'',verifiedCorrections:'',toneChoice:'专业可信 Professional',trend:'不附加热点'}});assert.equal(stale.status(),409);
    const forged=await page.request.post(`${base}/api/runs/${first.id}`,{data:{expectedVersion:4,status:'approved',canApprove:true}});assert.equal(forged.status(),400);
    const rejected=await page.request.post(`${base}/api/runs/${first.id}`,{data:{expectedVersion:4,status:'rejected'}});assert.equal(rejected.status(),200);
    const archived=await page.request.get(`${base}/api/runs/${first.id}`);assert.equal((await archived.json()).status,'rejected');
    assert.deepEqual(errors,[]);
    const report={passed:true,mode:'demo only; no live Dify/LLM calls',checks:['initial run','tone-only V2','verified facts V3','reevaluate V4 unchanged copy','refresh restoration','desktop no horizontal overflow','mobile no horizontal overflow','approval disabled for unevaluated demo','stale version 409','forged approval 400','server archive persistence','no browser page errors'],runId:first.id};
    fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
