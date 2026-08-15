(()=>{
  'use strict';

  const INSTANCE_ID='AI-D4-BB-SeaWaterPump';
  const VERSION='v0.3.24';
  const assemblyScreen=document.getElementById('assemblyScreen');
  const assemblyInfo=assemblyScreen?.querySelector('.assemblyInfo');
  const infoTop=assemblyScreen?.querySelector('.assemblyInfoTop');
  const infoBody=assemblyScreen?.querySelector('.assemblyInfoBody');
  if(!assemblyScreen||!assemblyInfo||!infoTop||!infoBody)return;

  document.querySelectorAll('.topbar .status').forEach(el=>{
    el.textContent=el.textContent.replace(/Atlas v0\.3\.(?:18|19|20|21|22|23)/g,`Atlas ${VERSION}`);
  });

  const style=document.createElement('style');
  style.textContent=`
    .coreLive{margin:0 0 12px;padding:11px;border:1px solid #dfe6ec;border-radius:10px;background:#f8fafb;color:#4e5b65}
    .assemblyInfo>.coreLive{margin:8px 12px 10px;max-height:190px;overflow:auto;-webkit-overflow-scrolling:touch}
    .coreLiveHead{display:flex;align-items:center;gap:8px;margin-bottom:8px}.coreLiveHead strong{font-size:10px;color:#14212b;letter-spacing:.04em}
    .coreLiveStatus{margin-left:auto;font-size:9px;color:#73808b;white-space:nowrap}.coreLiveStatus::before{content:"";display:inline-block;width:6px;height:6px;margin-right:5px;border-radius:50%;background:#8d99a2;vertical-align:1px}
    .coreLiveStatus.ok{color:#228653}.coreLiveStatus.ok::before{background:#33b56c}.coreLiveStatus.error{color:#9b3425}.coreLiveStatus.error::before{background:#d9513f}
    .coreLiveGrid{display:grid;grid-template-columns:1fr 1fr;gap:0 10px;margin:0}.coreLiveGrid div{padding:6px 0;border-top:1px solid #e7ecef;min-width:0}
    .coreLiveGrid dt{font-size:8px;color:#73808b;text-transform:uppercase;letter-spacing:.08em}.coreLiveGrid dd{margin:2px 0 0;font-size:9.5px;color:#14212b;overflow-wrap:anywhere}
    .coreLiveRelations{margin-top:7px;padding-top:7px;border-top:1px solid #e7ecef;font-size:9px;line-height:1.4}.coreLiveRelations b{display:block;margin-bottom:5px;color:#14212b;font-size:9px}
    .coreLiveRelations ul{display:grid;gap:4px;margin:0;padding:0;list-style:none}.coreLiveRelations li{margin:0}
    .coreRelationButton{width:100%;border:1px solid #dfe6ec;border-radius:7px;background:#fff;padding:6px 7px;text-align:left;color:#14212b;font:inherit;font-size:9px;cursor:pointer}.coreRelationButton:active{background:#eef4f8}.coreRelationButton span{display:block;margin-top:2px;color:#73808b;font-size:8px;overflow-wrap:anywhere}
    .coreNode{margin-top:7px;padding:8px;border:1px solid #d8e2e9;border-radius:8px;background:#fff}.coreNode[hidden]{display:none}.coreNodeHead{display:flex;gap:8px;align-items:flex-start}.coreNodeHead b{color:#14212b;font-size:9px;line-height:1.35}.coreNodeClose{margin-left:auto;border:0;background:transparent;color:#73808b;font-size:9px;cursor:pointer}.coreNodeMeta{margin-top:5px;color:#5f6d77;font-size:8.5px;line-height:1.45;overflow-wrap:anywhere;white-space:pre-line}.coreLiveRetry{margin-top:8px;border:0;border-radius:7px;background:#0867ff;color:#fff;padding:6px 9px;font:inherit;font-size:9px;font-weight:700;cursor:pointer}.coreLiveRetry[hidden]{display:none}
  `;
  document.head.appendChild(style);

  const panel=document.createElement('section');
  panel.className='coreLive';
  panel.setAttribute('aria-label','Live data fra Shaka Core');
  panel.innerHTML=`<div class="coreLiveHead"><strong>SHAKA CORE · LIVE READ-ONLY</strong><span class="coreLiveStatus" id="coreLiveStatus">Klar</span></div><dl class="coreLiveGrid"><div><dt>Asset Instance</dt><dd id="coreLiveInstance">—</dd></div><div><dt>Asset</dt><dd id="coreLiveAsset">—</dd></div><div><dt>System</dt><dd id="coreLiveHost">—</dd></div><div><dt>Slot / state</dt><dd id="coreLiveState">—</dd></div><div><dt>Provenance</dt><dd id="coreLiveProvenance">—</dd></div><div><dt>API</dt><dd>HTTPS · no-store</dd></div></dl><div class="coreLiveRelations"><b>Direkte relationer · tryk for at navigere</b><ul id="coreLiveRelations"><li>Åbn Niveau 4 for at hente live data.</li></ul></div><div class="coreNode" id="coreNode" hidden><div class="coreNodeHead"><b id="coreNodeTitle">Relation</b><button class="coreNodeClose" id="coreNodeClose" type="button">Luk</button></div><div class="coreNodeMeta" id="coreNodeMeta"></div></div><button class="coreLiveRetry" id="coreLiveRetry" hidden>Prøv igen</button>`;

  function placePanel(){
    const bodyHidden=getComputedStyle(infoBody).display==='none';
    if(bodyHidden){
      if(panel.parentElement!==assemblyInfo)assemblyInfo.insertBefore(panel,infoBody);
    }else if(panel.parentElement!==infoBody){
      const badge=infoBody.querySelector('.badge');
      if(badge?.nextSibling)infoBody.insertBefore(panel,badge.nextSibling);else infoBody.prepend(panel);
    }
  }
  placePanel();

  const statusEl=panel.querySelector('#coreLiveStatus');
  const retryEl=panel.querySelector('#coreLiveRetry');
  const relationsEl=panel.querySelector('#coreLiveRelations');
  const nodeEl=panel.querySelector('#coreNode');
  const nodeTitleEl=panel.querySelector('#coreNodeTitle');
  const nodeMetaEl=panel.querySelector('#coreNodeMeta');
  const nodeCloseEl=panel.querySelector('#coreNodeClose');
  let loaded=false,loading=false;
  const setText=(id,value)=>{const el=panel.querySelector(`#${id}`);if(el)el.textContent=value??'—'};
  const setStatus=(kind,label)=>{statusEl.className=`coreLiveStatus ${kind||''}`.trim();statusEl.textContent=label};

  function relatedId(edge,rootId){
    if(edge.from===rootId)return edge.to;
    if(edge.to===rootId)return edge.from;
    return edge.to||edge.from||'';
  }

  function relationDirection(edge,rootId){
    if(edge.from===rootId)return 'Udgående';
    if(edge.to===rootId)return 'Indgående';
    return 'Relateret';
  }

  function showStaticRelation(edge,rootId){
    const targetId=relatedId(edge,rootId)||'—';
    const direction=relationDirection(edge,rootId);
    nodeTitleEl.textContent=targetId;
    nodeMetaEl.textContent=`${direction} · ${edge.type||'RELATION'} · ${edge.from||'—'} → ${edge.to||'—'}`;
    nodeEl.hidden=false;
  }

  async function showResolvedRelation(edge,rootId){
    const assetId=relatedId(edge,rootId)||'';
    const direction=relationDirection(edge,rootId);
    if(!assetId.startsWith('ASSET-')){showStaticRelation(edge,rootId);return}
    nodeTitleEl.textContent=assetId;
    nodeMetaEl.textContent='Resolver installeret Asset Instance…';
    nodeEl.hidden=false;
    try{
      if(!window.ShakaCore?.resolveAssetInstance)throw new Error('Core resolver-klienten mangler');
      const result=await window.ShakaCore.resolveAssetInstance(rootId,assetId);
      const data=result.detail||{};
      const provenance=Array.isArray(data.provenance)?`${data.provenance.length} provenance records`:'provenance ukendt';
      nodeTitleEl.textContent=data.id||assetId;
      nodeMetaEl.textContent=[
        `${direction} · ${edge.type||'RELATION'}`,
        `Asset: ${data.asset?.id||assetId}`,
        `System: ${data.host?.id||'—'}`,
        `Slot / state: ${[data.slot,data.state].filter(Boolean).join(' · ')||'—'}`,
        provenance
      ].join('\n');
    }catch(error){
      console.error('Shaka Core asset resolution unavailable',error);
      const detail=error instanceof Error&&error.message?error.message:'Ukendt browserfejl';
      nodeTitleEl.textContent=assetId;
      nodeMetaEl.textContent=`Kunne ikke resolve Asset Instance · ${detail}`;
    }
  }

  function renderRelations(edges,rootId){
    relationsEl.replaceChildren();
    if(!edges.length){const li=document.createElement('li');li.textContent='Ingen direkte relationer.';relationsEl.appendChild(li);return}
    for(const edge of edges){
      const targetId=relatedId(edge,rootId)||'—';
      const direction=relationDirection(edge,rootId);
      const li=document.createElement('li');
      const button=document.createElement('button');
      button.type='button';button.className='coreRelationButton';
      button.textContent=`${direction} · ${edge.type||'RELATION'}`;
      const meta=document.createElement('span');meta.textContent=targetId;button.appendChild(meta);
      button.addEventListener('click',()=>showResolvedRelation(edge,rootId));
      li.appendChild(button);relationsEl.appendChild(li);
    }
  }

  async function loadCore(){
    if(loading)return;loading=true;retryEl.hidden=true;setStatus('','Forbinder…');relationsEl.innerHTML='<li>Indlæser…</li>';nodeEl.hidden=true;
    try{
      if(!window.ShakaCore)throw new Error('ShakaCore-klienten mangler');
      const result=await window.ShakaCore.loadAssetInstance(INSTANCE_ID);const data=result.detail;
      setText('coreLiveInstance',data.id);setText('coreLiveAsset',data.asset?.id);setText('coreLiveHost',data.host?.id);setText('coreLiveState',[data.slot,data.state].filter(Boolean).join(' · '));
      setText('coreLiveProvenance',Array.isArray(data.provenance)?`${data.provenance.length} records · ${new Set(data.provenance.map(item=>item.source)).size} kilder`:'—');
      renderRelations(result.graph.edges||[],result.graph.rootId||INSTANCE_ID);setStatus('ok','Live');loaded=true;
    }catch(error){
      console.error('Shaka Core unavailable',error);
      const detail=error instanceof Error&&error.message?error.message:'Ukendt browserfejl';
      setStatus('error','Core utilgængelig');
      relationsEl.innerHTML='';
      const li=document.createElement('li');li.textContent=`Fejl: ${detail}`;relationsEl.appendChild(li);
      retryEl.hidden=false;
    }finally{loading=false}
  }
  function maybeLoad(){placePanel();if(!assemblyScreen.hidden&&!loaded)loadCore()}
  retryEl.addEventListener('click',loadCore);
  nodeCloseEl.addEventListener('click',()=>{nodeEl.hidden=true});
  new MutationObserver(maybeLoad).observe(assemblyScreen,{attributes:true,attributeFilter:['hidden']});window.addEventListener('resize',placePanel);window.addEventListener('orientationchange',()=>setTimeout(placePanel,0));maybeLoad();
})();
