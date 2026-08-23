(()=>{
  'use strict';

  const INSTANCE_ID='AI-D4-BB-SeaWaterPump';
  const CANONICAL_GRAPH_ID='NAV-COG-D4-BB-COOLING-v0.1';
  const VERSION='v0.3.27-cog';
  const assemblyScreen=document.getElementById('assemblyScreen');
  const assemblyInfo=assemblyScreen?.querySelector('.assemblyInfo');
  const infoBody=assemblyScreen?.querySelector('.assemblyInfoBody');
  if(!assemblyScreen||!assemblyInfo||!infoBody)return;

  const style=document.createElement('style');
  style.textContent=`
    .coreLive{margin:0 0 12px;padding:11px;border:1px solid #dfe6ec;border-radius:10px;background:#f8fafb;color:#4e5b65}
    .assemblyInfo>.coreLive{margin:8px 12px 10px;max-height:220px;overflow:auto;-webkit-overflow-scrolling:touch}
    .coreLiveHead{display:flex;align-items:center;gap:8px;margin-bottom:8px}.coreLiveHead strong{font-size:10px;color:#14212b;letter-spacing:.04em}
    .coreLiveStatus{margin-left:auto;font-size:9px;color:#73808b;white-space:nowrap}.coreLiveStatus.ok{color:#228653}.coreLiveStatus.error{color:#9b3425}
    .coreLiveGrid{display:grid;grid-template-columns:1fr 1fr;gap:0 10px;margin:0}.coreLiveGrid div{padding:6px 0;border-top:1px solid #e7ecef;min-width:0}
    .coreLiveGrid dt{font-size:8px;color:#73808b;text-transform:uppercase;letter-spacing:.08em}.coreLiveGrid dd{margin:2px 0 0;font-size:9.5px;color:#14212b;overflow-wrap:anywhere}
    .coreLiveRelations{margin-top:7px;padding-top:7px;border-top:1px solid #e7ecef;font-size:9px;line-height:1.4}.coreLiveRelations b{display:block;margin-bottom:5px;color:#14212b;font-size:9px}
    .coreLiveRelations ul{display:grid;gap:4px;margin:0;padding:0;list-style:none}.coreLiveRelations li{margin:0}
    .coreRelationButton{width:100%;border:1px solid #dfe6ec;border-radius:7px;background:#fff;padding:6px 7px;text-align:left;color:#14212b;font:inherit;font-size:9px;cursor:pointer}.coreRelationButton span{display:block;margin-top:2px;color:#73808b;font-size:8px;overflow-wrap:anywhere}
    .coreNode{margin-top:7px;padding:8px;border:1px solid #d8e2e9;border-radius:8px;background:#fff}.coreNode[hidden]{display:none}.coreNodeHead{display:flex;gap:8px;align-items:flex-start}.coreNodeHead b{color:#14212b;font-size:9px;line-height:1.35}.coreNodeClose{margin-left:auto;border:0;background:transparent;color:#73808b;font-size:9px;cursor:pointer}.coreNodeMeta{margin-top:5px;color:#5f6d77;font-size:8.5px;line-height:1.45;overflow-wrap:anywhere;white-space:pre-line}.coreLiveRetry{margin-top:8px;border:0;border-radius:7px;background:#0867ff;color:#fff;padding:6px 9px;font:inherit;font-size:9px;font-weight:700;cursor:pointer}.coreLiveRetry[hidden]{display:none}
  `;
  document.head.appendChild(style);

  const panel=document.createElement('section');
  panel.className='coreLive';
  panel.setAttribute('aria-label','Canonical data fra Navigator');
  panel.innerHTML=`<div class="coreLiveHead"><strong>NAVIGATOR COG · LIVE READ-ONLY</strong><span class="coreLiveStatus" id="coreLiveStatus">Klar</span></div><dl class="coreLiveGrid"><div><dt>Canonical object</dt><dd id="coreLiveCanonicalId">—</dd></div><div><dt>Type</dt><dd id="coreLiveCanonicalType">—</dd></div><div><dt>Graph</dt><dd id="coreLiveGraph">—</dd></div><div><dt>Status</dt><dd id="coreLiveGraphStatus">—</dd></div><div><dt>Runtime instance</dt><dd id="coreLiveInstance">—</dd></div><div><dt>Relationer</dt><dd id="coreLiveRelationCount">—</dd></div></dl><div class="coreLiveRelations"><b>Canonical verified relations · tryk for detail</b><ul id="coreLiveRelations"><li>Åbn Niveau 4 for at hente canonical data.</li></ul></div><div class="coreNode" id="coreNode" hidden><div class="coreNodeHead"><b id="coreNodeTitle">Relation</b><button class="coreNodeClose" id="coreNodeClose" type="button">Luk</button></div><div class="coreNodeMeta" id="coreNodeMeta"></div></div><button class="coreLiveRetry" id="coreLiveRetry" hidden>Prøv igen</button>`;

  function placePanel(){
    const bodyHidden=getComputedStyle(infoBody).display==='none';
    if(bodyHidden){if(panel.parentElement!==assemblyInfo)assemblyInfo.insertBefore(panel,infoBody)}
    else if(panel.parentElement!==infoBody){const badge=infoBody.querySelector('.badge');if(badge?.nextSibling)infoBody.insertBefore(panel,badge.nextSibling);else infoBody.prepend(panel)}
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

  function relatedId(edge,rootId){return edge.from===rootId?edge.to:edge.to===rootId?edge.from:(edge.to||edge.from||'')}
  function relationDirection(edge,rootId){return edge.from===rootId?'Udgående':edge.to===rootId?'Indgående':'Relateret'}

  async function showCanonicalRelation(edge,rootId){
    const targetId=relatedId(edge,rootId)||'—';
    nodeTitleEl.textContent=targetId;
    nodeMetaEl.textContent='Henter canonical detail…';
    nodeEl.hidden=false;
    try{
      const result=await window.ShakaCore.loadCanonicalObject(targetId);
      const data=result.detail||{};
      const rels=Array.isArray(data.relations)?data.relations:[];
      nodeTitleEl.textContent=data.label?`${data.label} · ${data.id}`:(data.id||targetId);
      nodeMetaEl.textContent=[`${relationDirection(edge,rootId)} · ${edge.type}`,`Type: ${data.type||'—'}`,`Verified relations: ${rels.length}`,`Graph: ${result.meta?.graphId||CANONICAL_GRAPH_ID}`].join('\n');
    }catch(error){
      const detail=error instanceof Error&&error.message?error.message:'Ukendt browserfejl';
      nodeMetaEl.textContent=`Canonical detail kunne ikke hentes · ${detail}`;
    }
  }

  function renderRelations(edges,rootId){
    relationsEl.replaceChildren();
    if(!edges.length){const li=document.createElement('li');li.textContent='Ingen canonical direkte relationer.';relationsEl.appendChild(li);return}
    for(const edge of edges){
      if(edge.status!=='verified')continue;
      const li=document.createElement('li');
      const button=document.createElement('button');button.type='button';button.className='coreRelationButton';button.textContent=`${relationDirection(edge,rootId)} · ${edge.type}`;
      const meta=document.createElement('span');meta.textContent=relatedId(edge,rootId)||'—';button.appendChild(meta);
      button.addEventListener('click',()=>showCanonicalRelation(edge,rootId));li.appendChild(button);relationsEl.appendChild(li);
    }
  }

  async function loadCore(){
    if(loading)return;loading=true;retryEl.hidden=true;setStatus('','Forbinder…');relationsEl.innerHTML='<li>Indlæser canonical graph…</li>';nodeEl.hidden=true;
    try{
      if(!window.ShakaCore?.loadCanonicalObject||!window.ShakaCore?.loadCanonicalGraph)throw new Error('Canonical COG-klient mangler');
      const [runtime,canonical,graph]=await Promise.all([
        window.ShakaCore.loadAssetInstance(INSTANCE_ID),
        window.ShakaCore.loadCanonicalObject(INSTANCE_ID),
        window.ShakaCore.loadCanonicalGraph(CANONICAL_GRAPH_ID)
      ]);
      const data=canonical.detail||{};
      const edges=Array.isArray(data.relations)?data.relations:[];
      setText('coreLiveCanonicalId',data.id);setText('coreLiveCanonicalType',data.type);setText('coreLiveGraph',graph.graph?.id||canonical.meta?.graphId);setText('coreLiveGraphStatus',graph.graph?.status);setText('coreLiveInstance',runtime.detail?.id);setText('coreLiveRelationCount',`${edges.length} verified`);
      renderRelations(edges,data.id||INSTANCE_ID);setStatus('ok','Canonical');loaded=true;
    }catch(error){
      console.error('Navigator canonical COG unavailable',error);
      const detail=error instanceof Error&&error.message?error.message:'Ukendt browserfejl';setStatus('error','COG utilgængelig');relationsEl.innerHTML='';const li=document.createElement('li');li.textContent=`Fejl: ${detail}`;relationsEl.appendChild(li);retryEl.hidden=false;
    }finally{loading=false}
  }

  function maybeLoad(){placePanel();if(!assemblyScreen.hidden&&!loaded)loadCore()}
  retryEl.addEventListener('click',loadCore);nodeCloseEl.addEventListener('click',()=>{nodeEl.hidden=true});
  new MutationObserver(maybeLoad).observe(assemblyScreen,{attributes:true,attributeFilter:['hidden']});window.addEventListener('resize',placePanel);window.addEventListener('orientationchange',()=>setTimeout(placePanel,0));maybeLoad();
})();
