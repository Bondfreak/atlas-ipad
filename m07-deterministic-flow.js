(()=>{
  'use strict';

  const CIRCUIT_ID='SYS-D4-BB-Seawater';
  const assemblyScreen=document.getElementById('assemblyScreen');
  const assemblyInfo=assemblyScreen?.querySelector('.assemblyInfo');
  if(!assemblyScreen||!assemblyInfo)return;

  const style=document.createElement('style');
  style.textContent=`
    .m07Flow{margin:8px 12px 10px;padding:11px;border:1px solid #dfe6ec;border-radius:10px;background:#fff;color:#14212b}
    .m07FlowHead{display:flex;align-items:center;gap:8px;margin-bottom:8px}.m07FlowHead strong{font-size:10px;letter-spacing:.04em}.m07FlowState{margin-left:auto;font-size:8.5px;color:#73808b}
    .m07FlowTrack{display:flex;align-items:stretch;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding:3px 0 5px}
    .m07FlowNode{min-width:112px;max-width:150px;flex:1;border:1px solid #d8e2e9;border-radius:8px;background:#f8fafb;padding:8px;text-align:left;font:inherit;cursor:pointer;color:#14212b}
    .m07FlowNode b{display:block;font-size:9px;line-height:1.3;overflow-wrap:anywhere}.m07FlowNode span{display:block;margin-top:3px;color:#73808b;font-size:8px;overflow-wrap:anywhere}
    .m07FlowArrow{display:flex;min-width:46px;align-items:center;justify-content:center;color:#0867ff;font-size:14px;font-weight:700}.m07FlowArrow span{display:block;text-align:center;font-size:7px;color:#5f6d77;font-weight:600;line-height:1.2}
    .m07FlowEmpty{font-size:9px;color:#73808b;line-height:1.4}.m07FlowNote{margin-top:6px;font-size:8px;color:#73808b;line-height:1.35}
    .m07FlowDetail{margin-top:8px;padding:8px;border-top:1px solid #e7ecef;font-size:8.5px;line-height:1.45;white-space:pre-line;overflow-wrap:anywhere}.m07FlowDetail[hidden]{display:none}
  `;
  document.head.appendChild(style);

  const panel=document.createElement('section');
  panel.className='m07Flow';
  panel.setAttribute('aria-label','Canonical kølesystemsflow');
  panel.innerHTML='<div class="m07FlowHead"><strong>KØLESYSTEM · COG FLOW</strong><span class="m07FlowState">Ikke indlæst</span></div><div class="m07FlowTrack"></div><div class="m07FlowNote"></div><div class="m07FlowDetail" hidden></div>';
  assemblyInfo.appendChild(panel);

  const stateEl=panel.querySelector('.m07FlowState');
  const trackEl=panel.querySelector('.m07FlowTrack');
  const noteEl=panel.querySelector('.m07FlowNote');
  const detailEl=panel.querySelector('.m07FlowDetail');
  let loading=false,loaded=false;

  function showDetail(node,flow){
    detailEl.textContent=[
      node.label||node.id,
      `ID: ${node.id||'—'}`,
      `Type: ${node.type||'—'}`,
      `Circuit: ${flow.circuitId||CIRCUIT_ID}`,
      `Graph: ${flow.graphId||'—'}`,
      `Status: ${flow.status||'—'}`
    ].join('\n');
    detailEl.hidden=false;
  }

  function appendNode(node,flow){
    const button=document.createElement('button');
    button.type='button';
    button.className='m07FlowNode';
    const title=document.createElement('b');
    title.textContent=node.label||node.id||'Canonical object';
    const meta=document.createElement('span');
    meta.textContent=`${node.type||'Object'} · ${node.id||'—'}`;
    button.append(title,meta);
    button.addEventListener('click',()=>showDetail(node,flow));
    trackEl.appendChild(button);
  }

  function appendArrow(){
    const arrow=document.createElement('div');
    arrow.className='m07FlowArrow';
    arrow.setAttribute('aria-label','supplies');
    const label=document.createElement('span');
    label.textContent='→\nsupplies';
    arrow.appendChild(label);
    trackEl.appendChild(arrow);
  }

  function orderedNodes(flow){
    const nodes=Array.isArray(flow.nodes)?flow.nodes:[];
    const edges=Array.isArray(flow.edges)?flow.edges:[];
    const byId=new Map(nodes.map(node=>[node.id,node]));
    if(!edges.length)return nodes;
    const incoming=new Map(nodes.map(node=>[node.id,0]));
    const outgoing=new Map();
    for(const edge of edges){
      incoming.set(edge.to,(incoming.get(edge.to)||0)+1);
      if(outgoing.has(edge.from))throw new Error(`Canonical flow forgrener ved ${edge.from}`);
      outgoing.set(edge.from,edge.to);
    }
    const starts=nodes.filter(node=>(incoming.get(node.id)||0)===0&&outgoing.has(node.id));
    if(starts.length!==1)throw new Error('Canonical flow har ikke præcis ét verificeret startpunkt');
    const ordered=[];
    const seen=new Set();
    let current=starts[0].id;
    while(current){
      if(seen.has(current))throw new Error('Canonical flow indeholder cyklus');
      seen.add(current);
      const node=byId.get(current);
      if(!node)throw new Error(`Canonical flow mangler node ${current}`);
      ordered.push(node);
      current=outgoing.get(current);
    }
    return ordered;
  }

  async function buildFlow(){
    if(loading||loaded)return;
    loading=true;stateEl.textContent='Henter…';trackEl.replaceChildren();noteEl.textContent='';detailEl.hidden=true;
    try{
      if(!window.ShakaCore?.loadCanonicalFlow)throw new Error('Canonical flow-klient mangler');
      const result=await window.ShakaCore.loadCanonicalFlow(CIRCUIT_ID);
      const flow=result.flow||{};
      const ordered=orderedNodes(flow);
      const edges=Array.isArray(flow.edges)?flow.edges:[];
      if(ordered.length<2)throw new Error('Ingen verificeret canonical flow-kæde');
      ordered.forEach((node,index)=>{if(index)appendArrow();appendNode(node,flow)});
      const deferred=Number.isInteger(flow.deferredCandidateCount)?flow.deferredCandidateCount:0;
      stateEl.textContent=flow.complete?'Canonical · komplet':'Canonical · delvis';
      noteEl.textContent=flow.complete?'Kun verified COG-relations bruges.':`${deferred} downstream candidate-relation${deferred===1?'':'er'} er bevidst ikke vist.`;
      loaded=true;
    }catch(error){
      console.error('Canonical COG flow unavailable',error);
      stateEl.textContent='COG flow utilgængelig';
      const message=document.createElement('div');message.className='m07FlowEmpty';message.textContent=`Flow kan ikke vises uden canonical verified data · ${error instanceof Error?error.message:'ukendt fejl'}`;trackEl.replaceChildren(message);
    }finally{loading=false}
  }

  function maybeLoad(){if(!assemblyScreen.hidden)buildFlow()}
  new MutationObserver(maybeLoad).observe(assemblyScreen,{attributes:true,attributeFilter:['hidden']});
  maybeLoad();
})();
