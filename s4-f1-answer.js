(()=>{
  'use strict';

  const assemblyScreen=document.getElementById('assemblyScreen');
  const assemblyInfo=assemblyScreen?.querySelector('.assemblyInfo');
  const infoBody=assemblyScreen?.querySelector('.assemblyInfoBody');
  if(!assemblyScreen||!assemblyInfo||!infoBody)return;

  const style=document.createElement('style');
  style.textContent=`
    .f1Answer{margin:12px 0 0;padding:11px;border:1px solid #dfe6ec;border-radius:10px;background:#f4f8fb;color:#4e5b65}
    .assemblyInfo>.f1Answer{margin:8px 12px 10px}
    .f1AnswerHead{display:flex;align-items:center;gap:8px}.f1AnswerHead strong{font-size:10px;color:#14212b;letter-spacing:.04em}.f1AnswerState{margin-left:auto;font-size:9px;color:#73808b}
    .f1AnswerHint{margin:8px 0 0;font-size:9px;line-height:1.45;color:#73808b}
    .f1AnswerInput{margin-top:8px;width:100%;min-height:54px;box-sizing:border-box;border:1px solid #d0dae3;border-radius:8px;padding:8px 9px;font:inherit;font-size:11px;line-height:1.4;resize:vertical;background:#fff;color:#14212b}
    .f1AnswerButton{margin-top:8px;width:100%;min-height:36px;border:0;border-radius:8px;background:#0d5cab;color:#fff;font-size:10px;font-weight:700;cursor:pointer}.f1AnswerButton:disabled{opacity:.55;cursor:default}
    .f1AnswerResult{margin-top:10px;display:grid;gap:8px}
    .f1AnswerBlock{border:1px solid #e2e8ee;border-radius:8px;background:#fff;padding:8px 9px}
    .f1AnswerBlock dt{font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:#73808b}.f1AnswerBlock dd{margin:4px 0 0;font-size:10px;line-height:1.45;color:#14212b;white-space:pre-line;overflow-wrap:anywhere}
    .f1AnswerList{margin:4px 0 0;padding-left:16px;font-size:10px;line-height:1.45;color:#14212b}.f1AnswerList li{margin:0 0 3px}
    .f1AnswerMeta{margin-top:6px;font-size:8.5px;color:#73808b;line-height:1.4}
  `;
  document.head.appendChild(style);

  const panel=document.createElement('section');
  panel.className='f1Answer';
  panel.setAttribute('aria-label','F1 kanonisk svar');
  panel.innerHTML=[
    '<div class="f1AnswerHead"><strong>F1 · CANONICAL READ</strong><span class="f1AnswerState">Klar</span></div>',
    '<p class="f1AnswerHint">Stil et spørgsmål til F1 Canonical Read Core via Shaka Server (ingen LLM). Visningen er fail-closed.</p>',
    '<textarea class="f1AnswerInput" rows="2" placeholder="Fx: Hvornår blev impellerne sidst skiftet?" aria-label="F1 spørgsmål"></textarea>',
    '<button class="f1AnswerButton" type="button">Spørg F1</button>',
    '<div class="f1AnswerResult" hidden></div>',
    '<p class="f1AnswerMeta"></p>'
  ].join('');

  function placePanel(){
    const bodyHidden=getComputedStyle(infoBody).display==='none';
    const kai=assemblyInfo.querySelector('.kaiInfo')||infoBody.querySelector('.kaiInfo');
    if(bodyHidden){
      if(panel.parentElement!==assemblyInfo){
        if(kai&&kai.parentElement===assemblyInfo)assemblyInfo.insertBefore(panel,kai.nextSibling);
        else assemblyInfo.insertBefore(panel,infoBody);
      }
    }else if(panel.parentElement!==infoBody){
      if(kai&&kai.parentElement===infoBody)infoBody.insertBefore(panel,kai.nextSibling);
      else infoBody.appendChild(panel);
    }
  }
  placePanel();

  const stateEl=panel.querySelector('.f1AnswerState');
  const inputEl=panel.querySelector('.f1AnswerInput');
  const buttonEl=panel.querySelector('.f1AnswerButton');
  const resultEl=panel.querySelector('.f1AnswerResult');
  const metaEl=panel.querySelector('.f1AnswerMeta');

  function setText(element,value){element.textContent=value==null?'':String(value)}

  function serverOrigin(){
    if(window.AtlasServer?.resolveServerOrigin)return window.AtlasServer.resolveServerOrigin();
    return 'https://shaka-server.onrender.com';
  }

  function addBlock(label,valueNode){
    const block=document.createElement('div');
    block.className='f1AnswerBlock';
    const dt=document.createElement('dt');
    setText(dt,label);
    const dd=document.createElement('dd');
    if(typeof valueNode==='string')setText(dd,valueNode);
    else dd.appendChild(valueNode);
    block.append(dt,dd);
    resultEl.appendChild(block);
  }

  function listNode(items){
    const ul=document.createElement('ul');
    ul.className='f1AnswerList';
    const values=Array.isArray(items)?items:[];
    if(!values.length){
      const li=document.createElement('li');
      setText(li,'—');
      ul.appendChild(li);
      return ul;
    }
    values.forEach(item=>{
      const li=document.createElement('li');
      if(item&&typeof item==='object'){
        const code=item.code||item.verdict||'';
        const message=item.message||JSON.stringify(item);
        setText(li,code?`${code}: ${message}`:message);
      }else setText(li,item);
      ul.appendChild(li);
    });
    return ul;
  }

  function renderAnswer(payload){
    resultEl.hidden=false;
    resultEl.replaceChildren();
    addBlock('Konklusion',payload.conclusion||'—');
    addBlock('Basis',listNode(payload.basis));
    addBlock('Epistemisk status',payload.epistemic_status||'—');
    addBlock('Kilder',listNode(payload.sources));
    if(Array.isArray(payload.uncertainty_conflict)&&payload.uncertainty_conflict.length){
      addBlock('Usikkerhed / konflikt',listNode(payload.uncertainty_conflict));
    }
    if(Array.isArray(payload.policy_results)&&payload.policy_results.length){
      addBlock('Policy',listNode(payload.policy_results));
    }
    const bits=[];
    if(payload.snapshot_id)bits.push(`Snapshot ${payload.snapshot_id}`);
    if(payload.rejected)bits.push('Afvist af policy');
    setText(metaEl,bits.length?bits.join(' · '):'F1-svar via POST /api/v1/f1/answer · read-only');
  }

  async function ask(){
    const query=String(inputEl.value||'').trim();
    if(!query){
      setText(stateEl,'Mangler spørgsmål');
      setText(metaEl,'Indtast et ikke-tomt spørgsmål før F1 kaldes.');
      resultEl.hidden=true;
      resultEl.replaceChildren();
      return;
    }
    buttonEl.disabled=true;
    setText(stateEl,'Forbinder…');
    setText(metaEl,`Kalder ${serverOrigin()}/api/v1/f1/answer …`);
    resultEl.hidden=true;
    resultEl.replaceChildren();
    try{
      let payload;
      if(window.ShakaCore?.postF1Answer){
        payload=await window.ShakaCore.postF1Answer(query,{baseUrl:serverOrigin()});
      }else{
        const response=await fetch(`${serverOrigin()}/api/v1/f1/answer`,{
          method:'POST',
          headers:{'Accept':'application/json','Content-Type':'application/json'},
          cache:'no-store',
          body:JSON.stringify({query})
        });
        let body={};
        try{body=await response.json()}catch(_){throw new Error(`Shaka Server HTTP ${response.status}`)}
        if(!response.ok){
          const err=new Error(body?.error?.message||`Shaka Server HTTP ${response.status}`);
          err.code=body?.error?.code||`http_${response.status}`;
          throw err;
        }
        payload=body;
      }
      if(typeof payload?.conclusion!=='string'||!('epistemic_status' in payload)||!Array.isArray(payload?.basis)||!Array.isArray(payload?.sources)){
        throw new Error('Ugyldigt F1-svar');
      }
      setText(stateEl,'Svar klar');
      renderAnswer(payload);
    }catch(error){
      const code=error?.code||'';
      setText(stateEl,'Utilgængelig');
      resultEl.hidden=false;
      resultEl.replaceChildren();
      addBlock('Konklusion','F1-svar kunne ikke hentes.');
      addBlock('Epistemisk status','unknown');
      addBlock('Basis',listNode([error?.message||'ukendt fejl']));
      addBlock('Kilder',listNode([]));
      if(code==='invalid_request'){
        setText(metaEl,'Server afviste forespørgslen. Atlas-navigation og KAI-forklaring påvirkes ikke.');
      }else{
        setText(metaEl,'F1/evidens utilgængelig. Atlas-navigation og KAI-forklaring kan fortsat bruges med graceful degrade.');
      }
    }finally{
      buttonEl.disabled=false;
      placePanel();
    }
  }

  buttonEl.addEventListener('click',ask);
  inputEl.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&(event.metaKey||event.ctrlKey)){
      event.preventDefault();
      ask();
    }
  });
  window.addEventListener('resize',placePanel);
  window.addEventListener('orientationchange',()=>setTimeout(placePanel,0));
})();
