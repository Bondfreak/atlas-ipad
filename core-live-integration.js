(()=>{
  'use strict';

  const INSTANCE_ID='AI-D4-BB-SeaWaterPump';
  const VERSION='v0.3.23';
  const assemblyScreen=document.getElementById('assemblyScreen');
  const assemblyInfo=assemblyScreen?.querySelector('.assemblyInfo');
  const infoTop=assemblyScreen?.querySelector('.assemblyInfoTop');
  const infoBody=assemblyScreen?.querySelector('.assemblyInfoBody');
  if(!assemblyScreen||!assemblyInfo||!infoTop||!infoBody)return;

  document.querySelectorAll('.topbar .status').forEach(el=>{
    el.textContent=el.textContent.replace(/Atlas v0\.3\.(?:18|19|20|21|22)/g,`Atlas ${VERSION}`);
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
    .coreNode{margin-top:7px;padding:8px;border:1px solid #d8e2e9;border-radius:8px;background:#fff}.coreNode[hidden]{display:none}.coreNodeHead{display:flex;gap:8px;align-items:flex-start}.coreNodeHead b{color:#14212b;font-size:9px;line-height:1.35}.coreNodeClose{margin-left:auto;border:0;background:transparent;color:#73808b;font-size:9px;cursor:pointer}.coreNodeMeta{margin-top:5px;color:#5f6d77;font-size:8.5px;line-height:1.45;overflow-wrap:anywhere}.coreNodeActions{display:flex;gap:6px;margin-top:7px}.coreNodeOpen,.coreLiveRetry{border:0;border-radius:7px;background:#0867ff;color:#fff;padding:6px 9px;font:inherit;font-size:9px;font-weight:700;cursor:pointer}.coreNodeOpen[hidden],.coreLiveRetry[hidden]{display:none}.coreNodeRelations{margin:7px 0 0;padding:7px 0 0 14px;border-top:1px solid #edf1f4;color:#4e5b65;font-size:8.5px;line-height:1.45}
  `;
  document.head.appendChild(style);

  const panel=document.createElement('section');
  panel.className='coreLive';
  panel.setAttribute('aria-label','Live data fra Shaka Core');
  panel.innerHTML=`<div class="coreLiveHead"><strong>SHAKA CORE · LIVE READ-ONLY</strong><span class="coreLiveStatus" id="coreLiveStatus">Klar</span></div><dl class="coreLiveGrid"><div><dt>Asset Instance</dt><dd id="coreLiveInstance">—</dd></div><div><dt>Asset</dt><dd id="coreLiveAsset">—</dd></div><div><dt>System</dt><dd id="coreLiveHost">—</dd></div><div><dt>Slot / state</dt><dd id="coreLiveState">—</dd></div><div><dt>Provenance</dt><dd id="coreLiveProvenance">—</dd></div><div><dt>API</dt><dd>HTTPS · no-store</dd></div></dl><div class="coreLiveRelations"><b>Direkte relationer · tryk for at navigere</b><ul id="coreLiveRelations"><li>Åbn Niveau 4 for at hente live data.</li></ul></div><div class="coreNode" id="coreNode" hidden><div class="coreNodeHead"><b id="coreNodeTitle">Relation</b><button class="coreNodeClose" id="coreNodeClose" type="button">Luk</button></div><div class="coreNodeMeta" id="coreNodeMeta"></div><div class="coreNodeActions"><button class="coreNodeOpen" id="coreNodeOpen" type="button" hidden>Åbn live nabo</button></div><ul class="coreNodeRelations" id="coreNodeRelations" hidden></ul></div><button class="coreLiveRetry" id="coreLiveRetry" hidden>Prøv igen</button>`;

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
  const nodeOpenEl=panel.querySelector('#coreNodeOpen');
  const nodeRelationsEl=panel.querySelector('#coreNodeRelations');
  const nodeCloseEl=panel.querySelector('#coreNodeClose');
  let loaded=false,loading=false;
  let selectedNodeId=null;
  const setText=(id,value)=>{const el=panel.querySelector(`#${id}`);if(el)el.textContent=value??'—'};
  const setStatus=(kind,label)=>{statusEl.className=`coreLiveStatus ${kind||''}`.trim();statusEl.textContent=label};
  const idOf=node=>node?.id||node?.public_id||node?.publicId||node?.key||'';
  const labelOf=node=>node?.title||node?.name||node?.label||idOf(node)||'Ukendt objekt';
  const kindOf=node=>node?.kind||node?.type||node?.object_type||node?.objectType||'objekt';

  function relatedId(edge,rootId){
    const from=edge.from||edge.source||'';
    const to=edge.to||edge.target||'';
    if(from===rootId)return to;
    if(to===rootId)return from;
    return to||from;
  }

  function showRelation(edge,node,rootId){
    const relationType=edge.type||edge.relation_type||edge.relationType||'RELATION';
    const from=edge.from||edge.source||'—';
    const to=edge.to||edge.target||'—';
    const targetId=relatedId(edge,rootId);
    selectedNodeId=targetId;
    nodeTitleEl.textContent=labelOf(node)||targetId;
    nodeMetaEl.textContent=`${relationType} · ${from} → ${to} · ${kindOf(node)} · ${targetId}`;
    nodeRelationsEl.hidden=true;
    nodeRelationsEl.replaceChildren();
    nodeOpenEl.hidden=!/^AI-/i.test(targetId||'');
    nodeOpenEl.textContent='Åbn live nabo';
    nodeEl.hidden=false;
  }

  function renderRelations(edges,nodes,rootId){
    relationsEl.replaceChildren();
    const nodeMap=new Map((nodes||[]).map(node=>[idOf(node),node]));
    if(!edges.length){const li=document.createElement('li');li.textContent='Ingen direkte relationer.';relationsEl.appendChild(li);return}
    for(const edge of edges){
      const targetId=relatedId(edge,rootId);
      const node=nodeMap.get(targetId)||{id:targetId};
      const relationType=edge.type||edge.relation_type||edge.relationType||'RELATION';
      const li=document.createElement('li');
      const button=document.createElement('button');
      button.type='button';button.className='coreRelationButton';
      button.textContent=`${relationType} · ${labelOf(node)}`;
      const meta=document.createElement('span');meta.textContent=`${kindOf(node)} · ${targetId}`;button.appendChild(meta);
      button.addEventListener('click',()=>showRelation(edge,node,rootId));
      li.appendChild(button);relationsEl.appendChild(li);
    }
  }

  async function openRelatedNode(){
    if(!selectedNodeId||!/^AI-/i.test(selectedNodeId))return;
    nodeOpenEl.disabled=true;nodeOpenEl.textContent='Henter…';nodeRelationsEl.hidden=true;
    try{
      const result=await window.ShakaCore.loadAssetInstance(selectedNodeId);
      const data=result.detail||{};
      const graph=result.graph||{};
      nodeTitleEl.textContent=data.id||selectedNodeId;
      nodeMetaEl.textContent=`Asset ${data.asset?.id||'—'} · System ${data.host?.id||'—'} · ${[data.slot,data.state].filter(Boolean).join(' · ')||'state ukendt'}`;
      const edges=graph.edges||[];
      nodeRelationsEl.replaceChildren();
      if(!edges.length){const li=document.createElement('li');li.textContent='Ingen direkte relationer.';nodeRelationsEl.appendChild(li)}
      for(const edge of edges){const li=document.createElement('li');li.textContent=`${edge.type||'RELATION'}: ${edge.from||edge.source||'—'} → ${edge.to||edge.target||'—'}`;nodeRelationsEl.appendChild(li)}
      nodeRelationsEl.hidden=false;nodeOpenEl.textContent='Live nabo åbnet';
    }catch(error){
      const detail=error instanceof Error&&error.message?error.message:'Ukendt browserfejl';
      nodeMetaEl.textContent=`Live nabo kunne ikke åbnes: ${detail}`;
      nodeOpenEl.textContent='Prøv igen';nodeOpenEl.disabled=false;
      return;
    }
    nodeOpenEl.disabled=false;
  }

  async function loadCore(){
    if(loading)return;loading=true;retryEl.hidden=true;setStatus('','Forbinder…');relationsEl.innerHTML='<li>Indlæser…</li>';nodeEl.hidden=true;
    try{
      if(!window.ShakaCore)throw new Error('ShakaCore-klienten mangler');
      const result=await window.ShakaCore.loadAssetInstance(INSTANCE_ID);const data=result.detail;
      setText('coreLiveInstance',data.id);setText('coreLiveAsset',data.asset?.id);setText('coreLiveHost',data.host?.id);setText('coreLiveState',[data.slot,data.state].filter(Boolean).join(' · '));
      setText('coreLiveProvenance',Array.isArray(data.provenance)?`${data.provenance.length} records · ${new Set(data.provenance.map(item=>item.source)).size} kilder`:'—');
      renderRelations(result.graph.edges||[],result.graph.nodes||[],result.graph.rootId||INSTANCE_ID);setStatus('ok','Live');loaded=true;
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
  nodeOpenEl.addEventListener('click',openRelatedNode);
  nodeCloseEl.addEventListener('click',()=>{nodeEl.hidden=true;selectedNodeId=null});
  new MutationObserver(maybeLoad).observe(assemblyScreen,{attributes:true,attributeFilter:['hidden']});window.addEventListener('resize',placePanel);window.addEventListener('orientationchange',()=>setTimeout(placePanel,0));maybeLoad();
})();
