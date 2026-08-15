(()=>{
  'use strict';

  const INSTANCE_ID='AI-D4-BB-SeaWaterPump';
  const VERSION='v0.3.19';
  const assemblyScreen=document.getElementById('assemblyScreen');
  const infoBody=assemblyScreen?.querySelector('.assemblyInfoBody');
  if(!assemblyScreen||!infoBody)return;

  document.querySelectorAll('.topbar .status').forEach(el=>{
    el.textContent=el.textContent.replace(/Atlas v0\.3\.18/g,`Atlas ${VERSION}`);
  });

  const style=document.createElement('style');
  style.textContent=`
    .coreLive{margin:0 0 12px;padding:11px;border:1px solid #dfe6ec;border-radius:10px;background:#f8fafb;color:#4e5b65}
    .coreLiveHead{display:flex;align-items:center;gap:8px;margin-bottom:8px}
    .coreLiveHead strong{font-size:10px;color:#14212b;letter-spacing:.04em}
    .coreLiveStatus{margin-left:auto;font-size:9px;color:#73808b;white-space:nowrap}
    .coreLiveStatus::before{content:"";display:inline-block;width:6px;height:6px;margin-right:5px;border-radius:50%;background:#8d99a2;vertical-align:1px}
    .coreLiveStatus.ok{color:#228653}.coreLiveStatus.ok::before{background:#33b56c}
    .coreLiveStatus.error{color:#9b3425}.coreLiveStatus.error::before{background:#d9513f}
    .coreLiveGrid{display:grid;grid-template-columns:1fr 1fr;gap:0 10px;margin:0}
    .coreLiveGrid div{padding:6px 0;border-top:1px solid #e7ecef;min-width:0}
    .coreLiveGrid dt{font-size:8px;color:#73808b;text-transform:uppercase;letter-spacing:.08em}
    .coreLiveGrid dd{margin:2px 0 0;font-size:9.5px;color:#14212b;overflow-wrap:anywhere}
    .coreLiveRelations{margin-top:7px;padding-top:7px;border-top:1px solid #e7ecef;font-size:9px;line-height:1.4}
    .coreLiveRelations b{display:block;margin-bottom:3px;color:#14212b;font-size:9px}
    .coreLiveRelations ul{margin:0;padding-left:14px}.coreLiveRelations li{margin:2px 0}
    .coreLiveRetry{margin-top:8px;border:0;border-radius:7px;background:#0867ff;color:#fff;padding:6px 9px;font:inherit;font-size:9px;font-weight:700;cursor:pointer}
    .coreLiveRetry[hidden]{display:none}
  `;
  document.head.appendChild(style);

  const panel=document.createElement('section');
  panel.className='coreLive';
  panel.setAttribute('aria-label','Live data fra Shaka Core');
  panel.innerHTML=`
    <div class="coreLiveHead"><strong>SHAKA CORE · LIVE READ-ONLY</strong><span class="coreLiveStatus" id="coreLiveStatus">Klar</span></div>
    <dl class="coreLiveGrid">
      <div><dt>Asset Instance</dt><dd id="coreLiveInstance">—</dd></div>
      <div><dt>Asset</dt><dd id="coreLiveAsset">—</dd></div>
      <div><dt>System</dt><dd id="coreLiveHost">—</dd></div>
      <div><dt>Slot / state</dt><dd id="coreLiveState">—</dd></div>
      <div><dt>Provenance</dt><dd id="coreLiveProvenance">—</dd></div>
      <div><dt>API</dt><dd>HTTPS · no-store</dd></div>
    </dl>
    <div class="coreLiveRelations"><b>Direkte relationer · depth 1</b><ul id="coreLiveRelations"><li>Åbn Niveau 4 for at hente live data.</li></ul></div>
    <button class="coreLiveRetry" id="coreLiveRetry" hidden>Prøv igen</button>`;

  const badge=infoBody.querySelector('.badge');
  if(badge?.nextSibling)infoBody.insertBefore(panel,badge.nextSibling);else infoBody.prepend(panel);

  const statusEl=panel.querySelector('#coreLiveStatus');
  const retryEl=panel.querySelector('#coreLiveRetry');
  const relationsEl=panel.querySelector('#coreLiveRelations');
  let loaded=false;
  let loading=false;

  const setText=(id,value)=>{const el=panel.querySelector(`#${id}`);if(el)el.textContent=value??'—'};
  const setStatus=(kind,label)=>{statusEl.className=`coreLiveStatus ${kind||''}`.trim();statusEl.textContent=label};
  function renderRelations(edges){
    relationsEl.replaceChildren();
    if(!edges.length){const li=document.createElement('li');li.textContent='Ingen direkte relationer.';relationsEl.appendChild(li);return}
    for(const edge of edges){const li=document.createElement('li');li.textContent=`${edge.type}: ${edge.from} → ${edge.to}`;relationsEl.appendChild(li)}
  }
  async function loadCore(){
    if(loading)return;
    loading=true;retryEl.hidden=true;setStatus('','Forbinder…');relationsEl.innerHTML='<li>Indlæser…</li>';
    try{
      if(!window.ShakaCore)throw new Error('Shaka Core client unavailable');
      const result=await window.ShakaCore.loadAssetInstance(INSTANCE_ID);
      const data=result.detail;
      setText('coreLiveInstance',data.id);
      setText('coreLiveAsset',data.asset?.id);
      setText('coreLiveHost',data.host?.id);
      setText('coreLiveState',[data.slot,data.state].filter(Boolean).join(' · '));
      setText('coreLiveProvenance',Array.isArray(data.provenance)?`${data.provenance.length} records · ${new Set(data.provenance.map(item=>item.source)).size} kilder`:'—');
      renderRelations(result.graph.edges||[]);
      setStatus('ok','Live');
      loaded=true;
    }catch(error){
      console.error('Shaka Core unavailable',error);
      setStatus('error','Core utilgængelig');
      relationsEl.innerHTML='<li>Live data kunne ikke hentes. Atlas fortsætter med statisk indhold.</li>';
      retryEl.hidden=false;
    }finally{loading=false}
  }

  function maybeLoad(){if(!assemblyScreen.hidden&&!loaded)loadCore()}
  retryEl.addEventListener('click',loadCore);
  new MutationObserver(maybeLoad).observe(assemblyScreen,{attributes:true,attributeFilter:['hidden']});
  maybeLoad();
})();
