(()=>{
  'use strict';

  const SERVER_ORIGIN='https://shaka-server.onrender.com';
  const INSTANCE_ID='AI-D4-BB-SeaWaterPump';
  const assemblyScreen=document.getElementById('assemblyScreen');
  const infoBody=assemblyScreen?.querySelector('.assemblyInfoBody');
  if(!assemblyScreen||!infoBody)return;

  const style=document.createElement('style');
  style.textContent=`
    .kaiInfo{margin:12px 0 0;padding:11px;border:1px solid #dfe6ec;border-radius:10px;background:#f8fafb;color:#4e5b65}
    .kaiInfoHead{display:flex;align-items:center;gap:8px}.kaiInfoHead strong{font-size:10px;color:#14212b;letter-spacing:.04em}.kaiInfoState{margin-left:auto;font-size:9px;color:#73808b}
    .kaiInfoText{margin:9px 0 0;font-size:10px;line-height:1.5;white-space:pre-line}.kaiInfoEvidence{margin:7px 0 0;color:#73808b;font-size:8.5px;line-height:1.4}
    .kaiInfoButton{margin-top:9px;width:100%;min-height:34px;border:0;border-radius:8px;background:#0867ff;color:#fff;font-size:10px;font-weight:700;cursor:pointer}.kaiInfoButton:disabled{opacity:.55;cursor:default}
  `;
  document.head.appendChild(style);

  const panel=document.createElement('section');
  panel.className='kaiInfo';
  panel.setAttribute('aria-label','KAI forklaring');
  panel.innerHTML='<div class="kaiInfoHead"><strong>KAI · GROUNDED READ-ONLY</strong><span class="kaiInfoState">Klar</span></div><p class="kaiInfoText">KAI kan forklare den valgte Core-kontekst gennem Server-kontrollerede read-only tools.</p><p class="kaiInfoEvidence"></p><button class="kaiInfoButton" type="button">Forklar denne kontekst</button>';
  infoBody.appendChild(panel);

  const stateEl=panel.querySelector('.kaiInfoState');
  const textEl=panel.querySelector('.kaiInfoText');
  const evidenceEl=panel.querySelector('.kaiInfoEvidence');
  const buttonEl=panel.querySelector('.kaiInfoButton');

  function setText(element,value){element.textContent=value}

  async function explain(){
    buttonEl.disabled=true;
    setText(stateEl,'Forbinder…');
    setText(textEl,'Henter en grounded forklaring via Shaka Server…');
    setText(evidenceEl,'');
    try{
      const response=await fetch(`${SERVER_ORIGIN}/api/v1/kai/explain`,{
        method:'POST',
        headers:{'Accept':'application/json','Content-Type':'application/json'},
        cache:'no-store',
        body:JSON.stringify({contextInstanceId:INSTANCE_ID,intent:'explain_selected_context'})
      });
      let payload={};
      try{payload=await response.json()}catch(_){throw new Error(`Shaka Server HTTP ${response.status}`)}
      if(!response.ok){
        const code=payload?.error?.code||`http_${response.status}`;
        const message=payload?.error?.message||`Shaka Server HTTP ${response.status}`;
        const error=new Error(message);error.code=code;throw error;
      }
      if(payload?.meta?.schemaVersion!=='1.0'||payload?.meta?.toolGrounded!==true||typeof payload?.data?.explanation!=='string')throw new Error('Ugyldigt KAI-svar');
      const trace=Array.isArray(payload.data.toolTrace)?payload.data.toolTrace:[];
      setText(stateEl,'Grounded');
      setText(textEl,payload.data.explanation);
      setText(evidenceEl,`${trace.length} Server-kontrollerede tool-kald · Core-fakta · read-only`);
    }catch(error){
      const code=error?.code||'';
      setText(stateEl,'Utilgængelig');
      if(code==='kai_unavailable'){
        setText(textEl,'KAI er midlertidigt utilgængelig. Atlas-navigation og Core-visualisering virker fortsat uden KAI.');
      }else{
        setText(textEl,`KAI-forklaring kunne ikke hentes · ${error?.message||'ukendt fejl'}`);
      }
      setText(evidenceEl,'Ingen forklaring vises uden et gyldigt grounded Server-svar.');
    }finally{
      buttonEl.disabled=false;
    }
  }

  buttonEl.addEventListener('click',explain);
})();
