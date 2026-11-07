/* Nexus Core AI gateway: local, deterministic demonstration; no network or real models. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const prices = { cheap: { input: .10, output: .20 }, strong: { input: 1, output: 2 } };
  const modelName = model => model === 'cheap' ? 'Mock cheap' : 'Mock strong';
  const policyName = policy => ({router:'Smart router',cheap:'Always cheap',strong:'Always strong'}[policy]);
  const dollars = n => '$' + n.toFixed(6);
  const tokens = s => Math.max(1, Math.ceil(s.length / 4));
  const costOf = (model, input, output) => (input * prices[model].input + output * prices[model].output) / 1000000;
  const route = (prompt, policy) => {
    if (policy !== 'router') return {model:policy, reason:'Fixed policy'};
    const reasons = [];
    if (prompt.length > 240) reasons.push('long prompt');
    if (/```|\b(function|class|const|def |sql|code|debug)\b/i.test(prompt)) reasons.push('code / debugging');
    if (/\b(complex|analyze|analyse|reason|compare|architecture|multi-step|derive)\b/i.test(prompt)) reasons.push('complexity keyword');
    return reasons.length ? {model:'strong', reason:reasons.join(' + ')} : {model:'cheap', reason:'No complexity signals'};
  };
  let logs = [];
  let cache = new Map();
  let lastEval = null;
  const logRow = row => {
    logs.unshift(row);
    if (logs.length > 500) logs.pop();
    renderLogs();
  };
  function renderLogs() {
    $('#gwRequests').textContent = logs.length;
    $('#gwCost').textContent = dollars(logs.reduce((n,r) => n + r.cost, 0));
    $('#gwHits').textContent = logs.filter(r => r.status === 'Cache hit').length;
    $('#gwFallbacks').textContent = logs.filter(r => r.status === 'Fallback').length;
    $('#gwLog').innerHTML = logs.length ? logs.map(r => `<tr><td>${esc(r.time)}</td><td>${esc(policyName(r.policy))}<small>${esc(r.reason)}</small></td><td>${esc(modelName(r.model))}</td><td>${r.input} / ${r.output}</td><td>${r.latency} ms</td><td>${dollars(r.cost)}</td><td><span class="pill ${r.status === 'Error' ? 'warn' : 'ok'} tiny">${esc(r.status)}</span></td></tr>`).join('') : '<tr><td colspan="7" class="gateway-empty">No requests yet. Send one from the playground.</td></tr>';
  }
  $('#gwForm').addEventListener('submit', e => {
    e.preventDefault();
    const start = performance.now();
    const prompt = $('#gwPrompt').value.trim();
    if (!prompt) return;
    const policy = $('#gwPolicy').value, failure = $('#gwFailure').value;
    const chosen = route(prompt, policy);
    const key = JSON.stringify([policy, prompt]);
    let model = chosen.model, status = 'Success', output = 0, input = 0, cost = 0, trace = '', response = '';
    if ($('#gwCache').checked && failure === 'none' && cache.has(key)) {
      const hit = cache.get(key);
      model = hit.model; response = hit.response; status = 'Cache hit';
      trace = 'Exact prompt and policy matched the in-memory cache. No simulated provider call.';
    } else {
      input = tokens(prompt);
      if (failure === 'recover') trace = `${modelName(model)}: first attempt failed; retry succeeded. `;
      if (failure === 'fallback') { const original = model; model = model === 'cheap' ? 'strong' : 'cheap'; status = 'Fallback'; trace = `${modelName(original)}: first attempt and retry failed; switched to ${modelName(model)}. `; }
      if (failure === 'all') { status = 'Error'; trace = 'First attempt and retry failed; alternate mock provider also failed.'; response = 'No response: all simulated providers failed.'; }
      else {
        response = `Simulated response from ${modelName(model)}. Connect a real backend and model provider to generate an answer.`;
        output = tokens(response);
        cost = costOf(model,input,output);
        if ($('#gwCache').checked && failure === 'none') cache.set(key, {model,response});
      }
    }
    const latency = Math.max(0, Math.round(performance.now() - start));
    logRow({time:new Date().toLocaleTimeString(), policy, reason:chosen.reason, model, input, output, latency, cost, status});
    $('#gwResponse').innerHTML = `<div class="gateway-eyebrow">${esc(status.toUpperCase())} · ${esc(modelName(model))}</div><strong>${esc(response)}</strong><br><span>Route: ${esc(chosen.reason)}. ${esc(trace)}</span><br><span>${input} input / ${output} output estimated tokens · ${latency} ms local processing · ${dollars(cost)} estimated cost</span>`;
  });
  $('#gwClear').addEventListener('click', () => { logs = []; cache.clear(); renderLogs(); $('#gwResponse').textContent = 'Log and cache cleared. Response & route details will appear here.'; });
  $('#gwExport').addEventListener('click', () => {
    const rows = [['time','policy','route_reason','model','input_tokens','output_tokens','local_latency_ms','illustrative_cost_usd','status'], ...logs.map(r => [r.time, policyName(r.policy), r.reason, modelName(r.model),r.input,r.output,r.latency,r.cost.toFixed(8),r.status])];
    const csv = rows.map(row => row.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = 'nexus-gateway-session.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  // These cases are intentionally small and known-answer: no external tools or model calls.
  const calc = [
    [3,5,'+'],[18,7,'-'],[6,9,'*'],[42,6,'/'],[12,13,'+'],
    [17,8,'*'],[144,12,'/'],[91,37,'-'],[24,15,'+'],[11,11,'*']
  ];
  const lookup = [
    ['GCP','Google Cloud'],['Azure','Microsoft Azure'],['AWS','Amazon Web Services'],['SQL','Structured Query Language'],['HTTP','Hypertext Transfer Protocol'],
    ['DNS','Domain Name System'],['API','Application Programming Interface'],['CPU','Central Processing Unit'],['RAM','Random Access Memory'],['TLS','Transport Layer Security']
  ];
  const calculate = (a,b,op) => ({'+':() => a+b,'-':() => a-b,'*':() => a*b,'/':() => a/b}[op]());
  const tasks = [
    ...calc.map(([a,b,op],i) => ({id:`C${i+1}`, prompt:`${i >= 5 ? 'Analyze this complex multi-step task: ' : ''}Calculate ${a} ${op} ${b}`, tool:'calculator', expected:String(calculate(a,b,op)), run:() => String(calculate(a,b,op)), hard:i>=5})),
    ...lookup.map(([key,value],i) => ({id:`L${i+1}`, prompt:`${i >= 5 ? 'Analyze this complex terminology: ' : ''}Look up ${key}`, tool:'lookup', expected:value, run:() => value, hard:i>=5}))
  ];
  function runExam(policy) {
    let total = 0;
    const cases = tasks.map(task => {
      const choice = route(task.prompt, policy);
      // Deterministic failure injection demonstrates why evaluation should compare behavior.
      const mockFailure = choice.model === 'cheap' && task.hard;
      const usedTool = mockFailure ? 'none' : task.tool;
      const steps = mockFailure ? ['read request','guess'] : ['read request',`call ${task.tool}`,'return answer'];
      const answer = mockFailure ? 'Unknown' : task.run();
      const answerPass = answer === task.expected;
      const toolPass = usedTool === task.tool;
      const stepPass = steps.length === 3 && steps[1] === `call ${task.tool}`;
      const pass = answerPass && toolPass && stepPass;
      const input = tokens(task.prompt), output = tokens(answer);
      const cost = costOf(choice.model,input,output); total += cost;
      return { ...task, model:choice.model, answer, usedTool, steps, answerPass, toolPass, stepPass, pass, cost };
    });
    return {policy,cases,total,passed:cases.filter(c => c.pass).length};
  }
  $('#gwRunEval').addEventListener('click', () => {
    const results = ['cheap','strong','router'].map(runExam); lastEval = results;
    const strong = results[1], router = results[2];
    const saving = strong.total ? (1 - router.total / strong.total) * 100 : 0;
    const diff = (strong.passed - router.passed) / tasks.length * 100;
    $('#gwEvalResults').className = '';
    $('#gwEvalResults').innerHTML = `<div class="gateway-eval-grid">${results.map(r => `<article class="gateway-eval-card"><h3>${esc(policyName(r.policy))}</h3><strong>${Math.round(r.passed/tasks.length*100)}%</strong><p>${r.passed} / ${tasks.length} tasks passed</p><p>Illustrative cost: ${dollars(r.total)}</p></article>`).join('')}</div><div class="gateway-comparison">In this mock exam, the router costs <strong>${saving.toFixed(1)}% less</strong> than always-strong and scores <strong>${diff.toFixed(0)} percentage points ${diff >= 0 ? 'lower' : 'higher'}</strong>. These are not real-world results.</div>`;
    $('#gwEvalDetails').innerHTML = `<details class="gateway-eval-details"><summary>Inspect all 60 task traces ↓</summary><div class="gateway-table-wrap"><table class="gateway-table"><thead><tr><th>POLICY / TASK</th><th>REQUEST</th><th>MODEL</th><th>ANSWER / EXPECTED</th><th>TOOL &amp; STEPS</th><th>CHECKS</th></tr></thead><tbody>${results.flatMap(r => r.cases.map(c => `<tr><td>${esc(policyName(r.policy))}<small>${c.id}</small></td><td>${esc(c.prompt)}</td><td>${esc(modelName(c.model))}</td><td>${esc(c.answer)}<small>Expected: ${esc(c.expected)}</small></td><td>${esc(c.usedTool)}<small>${esc(c.steps.join(' → '))}</small></td><td>${c.pass?'PASS':'FAIL'}<small>Answer ${c.answerPass?'✓':'✕'} · tool ${c.toolPass?'✓':'✕'} · steps ${c.stepPass?'✓':'✕'}</small></td></tr>`)).join('')}</tbody></table></div></details>`;
  });
})();
