(()=>{
  'use strict';

  const ROOT_INSTANCE_ID='AI-D4-BB-SeaWaterPump';
  const FLOW_RELATION='FLOW_TO';
  const ACCEPTANCE_MODE=new URLSearchParams(window.location.search).get('m07Acceptance');
  const assemblyScreen=document.getElementById('assemblyScreen');
  const assemblyInfo=assemblyScreen?.querySelector('.assemblyInfo');
  if(!assemblyScreen||!assemblyInfo)return;

  const style=document.createElement('style');
  style.textContent=`
    .m07Flow{margin:8px 12px 10px;padding:11px;border:1px solid #dfe6ec;border-radius:10px;background:#fff;color:#14212b}
    .m07FlowHead{display:flex;align-items:center;gap:8px;margin-bottom:8px}.m07FlowHead strong{font-size:10px;letter-spacing:.04em}.m07FlowState{margin-left:auto;font-size:8.5px;color:#73808b}
    .m07FlowTrack{display:flex;align-items:stretch;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding:3px 0 5px}
    .m07FlowNode{min-width:112px;max-width:150px;flex:1;border:1px solid #d8e2e9;border-radius:8px;background:#f8fafb;padding:8px;text-align:left;font:inherit;cursor:pointer;color:#14212b}
    .m07FlowNode:active{background:#eef4f8}.m07FlowNode b{display:block;font-size:9px;line-height:1.3;overflow-wrap:anywhere}.m07FlowNode span{display:block;margin-top:3px;color:#73808b;font-size:8px;overflow-wrap:anywhere}
    .m07FlowArrow{display:flex;min-width:46px;align-items:center;justify-content:center;color:#0867ff;font-size:14px;font-weight:700}.m07FlowArrow span{display:block;text-align:center;font-size:7px;color:#5f6d77;font-weight:600;line-height:1.2}
    .m07FlowEmpty{font-size:9px;color:#73808b;line-height:1.4}
    .m07FlowDetail{margin-top:8px;padding:8px;border-top:1px solid #e7ecef;font-size:8.5px;line-height:1.45;white-space:pre-line;overflow-wrap:anywhere}.m07FlowDetail[hidden]{display:none}
  `;
  document.head.appendChild(style);

  const panel=document.createElement('section');
  panel.className='m07Flow';
  panel.setAttribute('aria-label','Deterministisk kølesystemsflow');
  panel.innerHTML='<div class="m07FlowHead"><strong>KØLESYSTEM · AUTORITATIVT FLOW</strong><span class="m07FlowState">Ikke indlæst</span></div><div class="m07FlowTrack"></div><div class="m07FlowDetail" hidden></div>';
  assemblyInfo.appendChild(panel);

  const stateEl=panel.querySelector('.m07FlowState');
  const trackEl=panel.querySelector('.m07FlowTrack');
  const detailEl=panel.querySelector('.m07FlowDetail');
  let loading=false,loaded=false;

  const endpointKind=id=>{
    if(id?.startsWith('ASSET-'))return 'asset';
    if(id?.startsWith('AI-'))return 'instance';
    return 'unsupported';
  };

  function flowEdges(graph,rootId){
    return (graph.edges||[]).filter(edge=>edge?.type===FLOW_RELATION&&(edge.from===rootId||edge.to===rootId));
  }

  function acceptanceGraph(graph,rootId){
    if(ACCEPTANCE_MODE!=='missing-flow')return graph;
    return {
      ...graph,
      edges:(graph.edges||[]).filter(edge=>!(edge?.type===FLOW_RELATION&&edge.from===rootId))
    };
  }

  async function resolveEndpoint(id,rootId,rootDetail){
    if(id===rootId)return {id:rootDetail.id||rootId,detail:rootDetail};
    const kind=endpointKind(id);
    if(kind==='asset'){
      const resolved=await window.ShakaCore.resolveAssetInstance(rootId,id);
      const detail=resolved.detail||{};
      if(!detail.id)throw new Error(`Uafklaret Asset Instance for ${id}`);
      return {id:detail.id,detail};
    }
    if(kind==='instance'){
      const loadedInstance=await window.ShakaCore.loadAssetInstance(id);
      const detail=loadedInstance.detail||{};
      if(!detail.id)throw new Error(`Uafklaret Asset Instance for ${id}`);
      return {id:detail.id,detail};
    }
    throw new Error(`Ikke-understøttet flow-endpoint ${id||'—'}`);
  }

  function showDetail(node){
    const data=node.detail||{};
    const lines=[
      data.id||node.id,
      `Asset: ${data.asset?.id||'—'}`,
      `System: ${data.host?.id||'—'}`,
      `Slot / state: ${[data.slot,data.state].filter(Boolean).join(' · ')||'—'}`,
      `Provenance: ${Array.isArray(data.provenance)?data.provenance.length:'—'}`
    ];
    detailEl.textContent=lines.join('\n');
    detailEl.hidden=false;
  }

  function appendNode(node){
    const button=document.createElement('button');
    button.type='button';
    button.className='m07FlowNode';
    const title=document.createElement('b');
    title.textContent=node.id;
    const meta=document.createElement('span');
    meta.textContent=[node.detail?.slot,node.detail?.state].filter(Boolean).join(' · ')||node.detail?.asset?.id||'Asset Instance';
    button.append(title,meta);
    button.addEventListener('click',()=>showDetail(node));
    trackEl.appendChild(button);
  }

  function appendArrow(type){
    const arrow=document.createElement('div');
    arrow.className='m07FlowArrow';
    arrow.setAttribute('aria-label',type);
    const label=document.createElement('span');
    label.textContent=`→\n${type}`;
    arrow.appendChild(label);
    trackEl.appendChild(arrow);
  }

  async function buildFlow(){
    if(loading||loaded)return;
    loading=true;
    stateEl.textContent='Henter…';
    trackEl.replaceChildren();
    detailEl.hidden=true;
    try{
      if(!window.ShakaCore?.loadAssetInstance||!window.ShakaCore?.resolveAssetInstance)throw new Error('Shaka Server-klienten mangler');
      const result=await window.ShakaCore.loadAssetInstance(ROOT_INSTANCE_ID);
      const rootDetail=result.detail||{};
      const rootId=result.graph?.rootId||rootDetail.id||ROOT_INSTANCE_ID;
      if(rootId!==ROOT_INSTANCE_ID||rootDetail.id!==ROOT_INSTANCE_ID)throw new Error('Uventet flow-root');

      const graph=acceptanceGraph(result.graph||{},rootId);
      const edges=flowEdges(graph,rootId);
      const incoming=edges.filter(edge=>edge.to===rootId);
      const outgoing=edges.filter(edge=>edge.from===rootId);
      if(incoming.length!==1||outgoing.length!==1)throw new Error(`Flow kræver præcis én indgående og én udgående ${FLOW_RELATION}-relation`);

      const before=await resolveEndpoint(incoming[0].from,rootId,rootDetail);
      const root={id:rootId,detail:rootDetail};
      const after=await resolveEndpoint(outgoing[0].to,rootId,rootDetail);

      appendNode(before);
      appendArrow(incoming[0].type);
      appendNode(root);
      appendArrow(outgoing[0].type);
      appendNode(after);
      stateEl.textContent='Live · data-derived';
      loaded=true;
    }catch(error){
      console.error('M07 deterministic flow unavailable',error);
      stateEl.textContent=ACCEPTANCE_MODE==='missing-flow'?'Ikke understøttet · acceptance test':'Ikke understøttet';
      const message=document.createElement('div');
      message.className='m07FlowEmpty';
      message.textContent=`Flow kan ikke vises uden autoritative data · ${error instanceof Error?error.message:'ukendt fejl'}`;
      trackEl.replaceChildren(message);
    }finally{
      loading=false;
    }
  }

  function maybeLoad(){
    if(!assemblyScreen.hidden)buildFlow();
  }

  new MutationObserver(maybeLoad).observe(assemblyScreen,{attributes:true,attributeFilter:['hidden']});
  maybeLoad();
})();
