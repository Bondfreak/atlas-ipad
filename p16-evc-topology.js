(()=>{
  'use strict';

  const SYSTEM_ID='SYS-EVC';
  const GRAPH_ID='NAV-COG-EVC-v0.1';
  const motorScreen=document.getElementById('motorScreen');
  const systemScreen=document.getElementById('systemScreen');
  const boatScreen=document.getElementById('boatScreen');
  const assemblyScreen=document.getElementById('assemblyScreen');
  const epaButton=document.querySelector('[data-epa="EPA-0006"]');
  if(!motorScreen||!epaButton)return;

  const style=document.createElement('style');
  style.textContent=`
    .evcWorkspace{min-height:0;display:grid;grid-template-columns:260px minmax(0,1fr);background:#fff}
    .evcInfo{border-right:1px solid #dfe6ec;display:flex;flex-direction:column;min-height:0}
    .evcInfoTop{padding:22px;background:#0d2130;color:#fff}.evcInfoTop small{font-size:9px;letter-spacing:.15em;text-transform:uppercase;opacity:.68}.evcInfoTop h1{font-size:22px;margin:8px 0 0}
    .evcInfoBody{padding:18px;font-size:11px;line-height:1.5;color:#4e5b65;overflow:auto}.evcInfoBody p{margin:10px 0}.evcMeta{margin-top:14px}.evcMeta div{padding:9px 0;border-top:1px solid #dfe6ec}.evcMeta dt{font-size:8px;color:#73808b;text-transform:uppercase;letter-spacing:.1em}.evcMeta dd{margin:3px 0 0;color:#14212b;font-size:10px;overflow-wrap:anywhere}
    .evcCanvas{min-width:0;min-height:0;display:flex;flex-direction:column;padding:18px 22px;overflow:auto;background:#fbfcfd}
    .evcHead{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px}.evcHead h2{font-size:16px;margin:0}.evcHead p{margin:4px 0 0;color:#73808b;font-size:10px}.evcStatus{margin-left:auto;font-size:9px;color:#73808b;white-space:nowrap}.evcStatus.ok{color:#228653}.evcStatus.error{color:#9b3425}
    .evcNodes{display:grid;grid-template-columns:repeat(4,minmax(130px,1fr));gap:9px}.evcNode{min-height:74px;border:1px solid #d6e0e7;border-radius:10px;background:#fff;padding:10px}.evcNode b{display:block;font-size:10px;line-height:1.25;color:#14212b}.evcNode span{display:block;margin-top:5px;font-size:8.5px;color:#73808b;overflow-wrap:anywhere}.evcNode[data-pending="true"]{border-style:dashed;background:#fffaf0}
    .evcRelations{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}.evcRelationGroup{border:1px solid #dfe6ec;border-radius:11px;background:#fff;padding:12px}.evcRelationGroup h3{margin:0 0 9px;font-size:10px;letter-spacing:.05em}.evcRelationList{display:grid;gap:7px}.evcEdge{padding:8px;border-radius:8px;font-size:9px;line-height:1.35;overflow-wrap:anywhere}.evcEdge.verified{border:1px solid #cfe9d9;background:#f3fbf6}.evcEdge.candidate{border:1px dashed #d9b86b;background:#fffaf0}.evcEdge strong{display:block;color:#14212b}.evcEdge span{display:block;margin-top:3px;color:#65727c}
    .evcBoundary{margin-top:14px;padding:10px 12px;border-radius:9px;background:#fff5db;color:#815d13;font-size:9px;line-height:1.45}.evcRetry{margin-top:12px;border:0;border-radius:8px;background:#0867ff;color:#fff;padding:8px 12px;font:inherit;font-size:10px;font-weight:700;cursor:pointer}.evcRetry[hidden]{display:none}
    @media(orientation:portrait){.evcWorkspace{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}.evcInfo{border-right:0;border-bottom:1px solid #dfe6ec}.evcInfoTop{padding:13px 18px}.evcInfoTop h1{font-size:18px;margin-top:4px}.evcInfoBody{padding:10px 18px;display:grid;grid-template-columns:1fr auto;gap:8px 16px}.evcInfoBody p{margin:0}.evcMeta{display:none}.evcCanvas{padding:14px}.evcNodes{grid-template-columns:repeat(2,minmax(0,1fr))}.evcRelations{grid-template-columns:1fr 1fr}.evcNode{min-height:64px}}
    @media(max-width:760px){.evcRelations{grid-template-columns:1fr}.evcNodes{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);

  const screen=document.createElement('section');
  screen.className='levelScreen';
  screen.id='evcScreen';
  screen.hidden=true;
  screen.innerHTML=`
    <header class="topbar"><div class="brand">ATLAS</div><div class="crumb">Shaka / Motor / <b>Betjening · EVC</b></div><div class="status">System online · Atlas v0.3.35</div></header>
    <div class="evcWorkspace">
      <aside class="evcInfo"><div class="evcInfoTop"><small>Informationszone · COG topology</small><h1>EVC &amp; Controls</h1></div><div class="evcInfoBody"><div><span class="badge">Canonical · delvis</span><p>EVC vises som en kontrol- og kommunikationstopologi — ikke som et lineært væskeflow.</p></div><dl class="evcMeta"><div><dt>System</dt><dd>${SYSTEM_ID}</dd></div><div><dt>Graph</dt><dd>${GRAPH_ID}</dd></div><div><dt>Scope</dt><dd>Bagbord EVC-domæne + fælles kommunikationsankre</dd></div></dl></div></aside>
      <section class="evcCanvas" aria-label="EVC canonical topology">
        <div class="evcHead"><div><h2>EVC · COG TOPOLOGY</h2><p>Verified relationer og deferred candidates holdes eksplicit adskilt.</p></div><span class="evcStatus" id="evcStatus">Klar</span></div>
        <div class="evcNodes" id="evcNodes"><div class="evcNode"><b>Åbn Betjening for at hente EVC-topologien</b></div></div>
        <div class="evcRelations"><section class="evcRelationGroup"><h3>VERIFIED · CANONICAL</h3><div class="evcRelationList" id="evcVerified"></div></section><section class="evcRelationGroup"><h3>DEFERRED · IKKE VERIFICERET</h3><div class="evcRelationList" id="evcDeferred"></div></section></div>
        <div class="evcBoundary" id="evcBoundary">Funktionel EVC-topologi må ikke læses som et fysisk ledningsdiagram. Kabelruter, HCU-identiteter og flere signalveje er fortsat deferred.</div>
        <button class="evcRetry" id="evcRetry" hidden type="button">Prøv igen</button>
      </section>
    </div>
    <footer class="levelFooter motorMenu"><button class="back" id="evcBack" type="button">BACK</button><div class="menuCurrent">Menu · Niveau 3 <strong>Betjening / EVC</strong></div><div class="identity"><span class="identityIcon">3</span><div><small>AKTUELT NIVEAU</small><strong>EVC topology</strong></div></div></footer>`;
  document.body.insertBefore(screen,document.getElementById('detail'));

  const statusEl=screen.querySelector('#evcStatus');
  const nodesEl=screen.querySelector('#evcNodes');
  const verifiedEl=screen.querySelector('#evcVerified');
  const deferredEl=screen.querySelector('#evcDeferred');
  const retryEl=screen.querySelector('#evcRetry');
  let loaded=false,loading=false;

  function hideBaseScreens(){
    if(boatScreen)boatScreen.hidden=true;
    motorScreen.hidden=true;
    if(systemScreen)systemScreen.hidden=true;
    if(assemblyScreen)assemblyScreen.hidden=true;
  }

  function showMotor(){
    screen.hidden=true;
    if(boatScreen)boatScreen.hidden=true;
    motorScreen.hidden=false;
    if(systemScreen)systemScreen.hidden=true;
    if(assemblyScreen)assemblyScreen.hidden=true;
    document.querySelectorAll('[data-epa]').forEach(el=>el.classList.toggle('active',el.dataset.epa==='EPA-0005'));
  }

  function openEvc(){
    hideBaseScreens();screen.hidden=false;
    document.querySelectorAll('[data-epa]').forEach(el=>el.classList.toggle('active',el.dataset.epa==='EPA-0006'));
    if(!loaded)loadTopology();
  }

  function labelFor(id,map){return map.get(id)?.label||id}
  function renderEdge(edge,map,kind){
    const item=document.createElement('div');item.className=`evcEdge ${kind}`;
    const title=document.createElement('strong');title.textContent=`${labelFor(edge.from,map)} → ${labelFor(edge.to,map)}`;
    const meta=document.createElement('span');meta.textContent=`${edge.type} · ${kind==='verified'?'verified':'candidate'}`;
    item.append(title,meta);return item;
  }

  function render(topology,meta){
    const nodes=Array.isArray(topology.nodes)?topology.nodes:[];
    const verified=Array.isArray(topology.edges)?topology.edges:[];
    const deferred=Array.isArray(topology.deferredCandidates)?topology.deferredCandidates:[];
    const byId=new Map(nodes.map(node=>[node.id,node]));
    const deferredNodeIds=new Set(deferred.flatMap(edge=>[edge.from,edge.to]));

    nodesEl.replaceChildren();
    for(const node of nodes){
      const card=document.createElement('div');card.className='evcNode';card.dataset.pending=deferredNodeIds.has(node.id)&&!verified.some(edge=>edge.from===node.id||edge.to===node.id)?'true':'false';
      const label=document.createElement('b');label.textContent=node.label||node.id;
      const detail=document.createElement('span');detail.textContent=`${node.type||'Object'} · ${node.id}`;
      card.append(label,detail);nodesEl.appendChild(card);
    }

    verifiedEl.replaceChildren();
    if(!verified.length)verifiedEl.textContent='Ingen verified relationer i projectionen.';
    else verified.forEach(edge=>verifiedEl.appendChild(renderEdge(edge,byId,'verified')));

    deferredEl.replaceChildren();
    if(!deferred.length)deferredEl.textContent='Ingen deferred candidates.';
    else deferred.forEach(edge=>deferredEl.appendChild(renderEdge(edge,byId,'candidate')));

    statusEl.className='evcStatus ok';
    statusEl.textContent=topology.status==='canonical_complete'?'Canonical · komplet':'Canonical · delvis';
    screen.querySelector('.badge').textContent=statusEl.textContent;
    const routeVerified=meta?.physicalCableRoutingVerified===true;
    screen.querySelector('#evcBoundary').textContent=routeVerified?'Fysisk kabelrouting er verificeret.':'Funktionel EVC-topologi · fysisk kabelrouting er ikke verificeret. Deferred relationer vises derfor som candidates og må ikke læses som canonical kabelvej.';
  }

  async function loadTopology(){
    if(loading)return;loading=true;retryEl.hidden=true;statusEl.className='evcStatus';statusEl.textContent='Forbinder…';
    try{
      if(!window.ShakaCore?.loadCanonicalTopology)throw new Error('Canonical topology-klient mangler');
      const result=await window.ShakaCore.loadCanonicalTopology(SYSTEM_ID);
      if(result.topology?.graphId!==GRAPH_ID)throw new Error('Uventet EVC graph');
      render(result.topology,result.meta);loaded=true;
    }catch(error){
      console.error('Navigator EVC topology unavailable',error);
      statusEl.className='evcStatus error';statusEl.textContent='COG utilgængelig';
      nodesEl.innerHTML='<div class="evcNode"><b>EVC-topologien kunne ikke hentes</b><span>Core/Server skal være deployet med P16 topology-endpoint.</span></div>';
      verifiedEl.textContent='—';deferredEl.textContent='—';retryEl.hidden=false;
    }finally{loading=false}
  }

  epaButton.addEventListener('click',openEvc);
  epaButton.title='EPA-0006 · Controls · EVC canonical topology';
  screen.querySelector('#evcBack').addEventListener('click',showMotor);
  retryEl.addEventListener('click',loadTopology);
})();
