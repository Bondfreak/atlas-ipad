(()=>{
  'use strict';

  const SCENARIO_ID='EVC-BB-NO-WAKE';
  const evcScreen=document.getElementById('evcScreen');
  if(!evcScreen)return;

  const canvas=evcScreen.querySelector('.evcCanvas');
  const evcBack=evcScreen.querySelector('#evcBack');
  if(!canvas||!evcBack)return;

  const launch=document.createElement('button');
  launch.type='button';
  launch.className='evcRetry';
  launch.id='evcDiagnosticOpen';
  launch.textContent='Åbn diagnostik';
  launch.style.marginLeft='0';
  launch.style.alignSelf='flex-start';
  const boundary=evcScreen.querySelector('#evcBoundary');
  if(boundary)boundary.insertAdjacentElement('afterend',launch);else canvas.appendChild(launch);

  const style=document.createElement('style');
  style.textContent=`
    .diagWorkspace{min-height:0;display:grid;grid-template-columns:260px minmax(0,1fr);background:#fff}
    .diagInfo{border-right:1px solid #dfe6ec;display:flex;flex-direction:column;min-height:0}
    .diagInfoTop{padding:22px;background:#0d2130;color:#fff}.diagInfoTop small{font-size:9px;letter-spacing:.15em;text-transform:uppercase;opacity:.68}.diagInfoTop h1{font-size:22px;margin:8px 0 0}
    .diagInfoBody{padding:18px;font-size:11px;line-height:1.5;color:#4e5b65;overflow:auto}.diagInfoBody p{margin:10px 0}.diagMeta{margin-top:14px}.diagMeta div{padding:9px 0;border-top:1px solid #dfe6ec}.diagMeta dt{font-size:8px;color:#73808b;text-transform:uppercase;letter-spacing:.1em}.diagMeta dd{margin:3px 0 0;color:#14212b;font-size:10px;overflow-wrap:anywhere}
    .diagCanvas{min-width:0;min-height:0;display:flex;flex-direction:column;padding:18px 22px;overflow:auto;background:#fbfcfd}.diagHead{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px}.diagHead h2{font-size:16px;margin:0}.diagHead p{margin:4px 0 0;color:#73808b;font-size:10px}.diagStatus{margin-left:auto;font-size:9px;color:#73808b;white-space:nowrap}.diagStatus.ok{color:#228653}.diagStatus.error{color:#9b3425}
    .diagSummary{border:1px solid #dfe6ec;background:#fff;border-radius:11px;padding:12px;margin-bottom:13px}.diagSummary strong{display:block;font-size:11px;color:#14212b}.diagSummary span{display:block;margin-top:4px;font-size:9px;color:#65727c;line-height:1.45}
    .diagGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.diagGroup{border:1px solid #dfe6ec;border-radius:11px;background:#fff;padding:12px}.diagGroup h3{margin:0 0 9px;font-size:10px;letter-spacing:.05em}.diagList{display:grid;gap:8px}.diagCard{border-radius:9px;padding:9px;font-size:9px;line-height:1.4}.diagCard.verified{border:1px solid #cfe9d9;background:#f3fbf6}.diagCard.candidate{border:1px dashed #d9b86b;background:#fffaf0}.diagCard b{display:block;color:#14212b;font-size:10px}.diagCard span{display:block;margin-top:3px;color:#65727c}.diagCard em{display:block;margin-top:5px;color:#36454f;font-style:normal}.diagBoundary{margin-top:14px;padding:10px 12px;border-radius:9px;background:#fff5db;color:#815d13;font-size:9px;line-height:1.45}.diagRetry{margin-top:12px;border:0;border-radius:8px;background:#0867ff;color:#fff;padding:8px 12px;font:inherit;font-size:10px;font-weight:700;cursor:pointer}.diagRetry[hidden]{display:none}
    @media(orientation:portrait){.diagWorkspace{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}.diagInfo{border-right:0;border-bottom:1px solid #dfe6ec}.diagInfoTop{padding:13px 18px}.diagInfoTop h1{font-size:18px;margin-top:4px}.diagInfoBody{padding:10px 18px;display:grid;grid-template-columns:1fr auto;gap:8px 16px}.diagInfoBody p{margin:0}.diagMeta{display:none}.diagCanvas{padding:14px}.diagGrid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const screen=document.createElement('section');
  screen.className='levelScreen';
  screen.id='evcDiagnosticScreen';
  screen.hidden=true;
  screen.innerHTML=`
    <header class="topbar"><div class="brand">ATLAS</div><div class="crumb">Shaka / Motor / Betjening · EVC / <b>Diagnostik</b></div><div class="status">System online · Atlas v0.3.36</div></header>
    <div class="diagWorkspace">
      <aside class="diagInfo"><div class="diagInfoTop"><small>Informationszone · diagnostic projection</small><h1>EVC Diagnostik</h1></div><div class="diagInfoBody"><div><span class="badge">Bounded · ingen root cause</span><p>Visningen prioriterer kun verificerede diagnostic anchors og holder candidates eksplicit adskilt.</p></div><dl class="diagMeta"><div><dt>Scenario</dt><dd>${SCENARIO_ID}</dd></div><div><dt>Princip</dt><dd>Wake/power før downstream kommunikation</dd></div><div><dt>Root cause</dt><dd>Ikke fastslået</dd></div></dl></div></aside>
      <section class="diagCanvas" aria-label="EVC bounded diagnostic projection">
        <div class="diagHead"><div><h2>EVC · DIAGNOSTIK</h2><p>Scenario-template for total no-wake på bagbord EVC-domæne.</p></div><span class="diagStatus" id="diagStatus">Klar</span></div>
        <div class="diagSummary" id="diagSummary"><strong>Ingen diagnose hentet endnu</strong><span>Åbn visningen for at hente den bounded diagnostic projection.</span></div>
        <div class="diagGrid"><section class="diagGroup"><h3>VERIFIED · CHECK FØRST</h3><div class="diagList" id="diagVerified"></div></section><section class="diagGroup"><h3>DEFERRED · UNDERSØG SENERE</h3><div class="diagList" id="diagDeferred"></div></section></div>
        <div class="diagBoundary" id="diagBoundary">Dette er en scenario-template, ikke en fastslået fejlårsag. Candidates må ikke læses som verificerede fejlveje eller fysisk kabelrouting.</div>
        <button class="diagRetry" id="diagRetry" hidden type="button">Prøv igen</button>
      </section>
    </div>
    <footer class="levelFooter motorMenu"><button class="back" id="diagBack" type="button">BACK</button><div class="menuCurrent">Menu · Niveau 4 <strong>EVC / Diagnostik</strong></div><div class="identity"><span class="identityIcon">4</span><div><small>AKTUELT NIVEAU</small><strong>No-wake diagnostic</strong></div></div></footer>`;
  document.body.insertBefore(screen,document.getElementById('detail'));

  const statusEl=screen.querySelector('#diagStatus');
  const summaryEl=screen.querySelector('#diagSummary');
  const verifiedEl=screen.querySelector('#diagVerified');
  const deferredEl=screen.querySelector('#diagDeferred');
  const retryEl=screen.querySelector('#diagRetry');
  let loaded=false,loading=false;

  function hideAll(){
    document.querySelectorAll('.levelScreen').forEach(el=>{el.hidden=true});
  }

  function openDiagnostic(){
    hideAll();screen.hidden=false;
    if(!loaded)loadDiagnostic();
  }

  function showEvc(){
    screen.hidden=true;evcScreen.hidden=false;
  }

  function renderCard(item,kind){
    const card=document.createElement('div');card.className=`diagCard ${kind}`;
    const title=document.createElement('b');
    title.textContent=kind==='verified'?`Trin ${item.step}: ${item.from} → ${item.to}`:`Prioritet ${item.priority}: ${item.from} → ${item.to}`;
    const relation=document.createElement('span');relation.textContent=`${item.type} · ${kind==='verified'?'verified':'candidate'}`;
    const meaning=document.createElement('em');meaning.textContent=item.meaning||'';
    card.append(title,relation,meaning);
    if(kind==='verified'&&item.check){const check=document.createElement('em');check.textContent=`Check: ${item.check}`;card.appendChild(check)}
    return card;
  }

  function render(diagnostic,meta){
    const verified=diagnostic.verifiedAnchors||[];
    const deferred=diagnostic.deferredInvestigation||[];
    summaryEl.replaceChildren();
    const title=document.createElement('strong');title.textContent=diagnostic.symptom?.label||SCENARIO_ID;
    const detail=document.createElement('span');detail.textContent=`Root cause fastslået: nej · ${verified.length} verified anchors · ${deferred.length} deferred candidates`;
    summaryEl.append(title,detail);
    verifiedEl.replaceChildren();deferredEl.replaceChildren();
    verified.forEach(item=>verifiedEl.appendChild(renderCard(item,'verified')));
    deferred.forEach(item=>deferredEl.appendChild(renderCard(item,'candidate')));
    statusEl.className='diagStatus ok';statusEl.textContent='Bounded · fail-closed';
    screen.querySelector('.badge').textContent='Bounded · ingen root cause';
    screen.querySelector('#diagBoundary').textContent=meta?.physicalCableRoutingVerified===false&&meta?.candidateRelationsPromoted===false
      ?'Ingen root cause er fastslået. Candidate relationer er ikke promoveret, og fysisk kabelrouting er ikke verificeret. Wake/power kontrolleres derfor før downstream kommunikationshypoteser.'
      :'Diagnostic confidence contract kunne ikke verificeres.';
  }

  async function loadDiagnostic(){
    if(loading)return;loading=true;retryEl.hidden=true;statusEl.className='diagStatus';statusEl.textContent='Forbinder…';
    try{
      if(!window.ShakaCore?.loadCanonicalDiagnostic)throw new Error('Diagnostic klient mangler');
      const result=await window.ShakaCore.loadCanonicalDiagnostic(SCENARIO_ID);
      render(result.diagnostic,result.meta);loaded=true;
    }catch(error){
      console.error('Navigator EVC diagnostic unavailable',error);
      statusEl.className='diagStatus error';statusEl.textContent='Diagnostik utilgængelig';
      summaryEl.innerHTML='<strong>Diagnostic projection kunne ikke hentes</strong><span>Core/Server skal være deployet med P17 diagnostic-endpoint.</span>';
      verifiedEl.textContent='—';deferredEl.textContent='—';retryEl.hidden=false;
    }finally{loading=false}
  }

  launch.addEventListener('click',openDiagnostic);
  screen.querySelector('#diagBack').addEventListener('click',showEvc);
  retryEl.addEventListener('click',loadDiagnostic);
})();
