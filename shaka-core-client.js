(function(global){
  'use strict';

  const DEFAULT_BASE='https://shaka-server.onrender.com';
  const DEPTH=1;

  async function requestJson(url){
    const response=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store'});
    if(!response.ok)throw new Error(`Shaka Server HTTP ${response.status}`);
    return response.json();
  }

  function baseUrl(options={}){
    return (options.baseUrl||DEFAULT_BASE).replace(/\/$/,'');
  }

  async function loadAssetInstance(instanceId,options={}){
    if(!instanceId)throw new Error('instanceId is required');
    const base=baseUrl(options);
    const encoded=encodeURIComponent(instanceId);
    const detail=await requestJson(`${base}/api/v1/asset-instances/${encoded}`);
    const graph=await requestJson(`${base}/api/v1/asset-instances/${encoded}/graph?depth=${DEPTH}`);
    if(graph.meta?.depth!==undefined&&graph.meta.depth!==DEPTH)throw new Error('Unexpected Shaka Server graph depth');
    return {detail:detail.data||{},graph:graph.data||{rootId:instanceId,nodes:[],edges:[]},meta:{detail:detail.meta||{},graph:graph.meta||{}}};
  }

  async function resolveAssetInstance(contextInstanceId,assetId,options={}){
    if(!contextInstanceId)throw new Error('contextInstanceId is required');
    if(!assetId)throw new Error('assetId is required');
    const base=baseUrl(options);
    const payload=await requestJson(`${base}/api/v1/asset-instances/${encodeURIComponent(contextInstanceId)}/resolve-asset/${encodeURIComponent(assetId)}`);
    return {detail:payload.data||{},meta:payload.meta||{}};
  }

  async function loadObjectDetail(publicId,options={}){
    if(!publicId)throw new Error('publicId is required');
    const payload=await requestJson(`${baseUrl(options)}/api/v1/objects/${encodeURIComponent(publicId)}`);
    return {detail:payload.data||{},meta:payload.meta||{}};
  }

  async function loadCanonicalGraph(graphId,options={}){
    if(!graphId)throw new Error('graphId is required');
    const payload=await requestJson(`${baseUrl(options)}/api/v1/cog/graphs/${encodeURIComponent(graphId)}`);
    if(payload.data?.status!=='canonical')throw new Error('Unexpected non-canonical graph response');
    return {graph:payload.data||{},meta:payload.meta||{}};
  }

  async function loadCanonicalObject(publicId,options={}){
    if(!publicId)throw new Error('publicId is required');
    const payload=await requestJson(`${baseUrl(options)}/api/v1/cog/objects/${encodeURIComponent(publicId)}`);
    const detail=payload.data||{};
    const relations=Array.isArray(detail.relations)?detail.relations:[];
    if(relations.some(edge=>edge?.status!=='verified'))throw new Error('Canonical response contains non-verified relation');
    return {detail,meta:payload.meta||{}};
  }

  async function loadCanonicalFlow(circuitId,options={}){
    if(!circuitId)throw new Error('circuitId is required');
    const payload=await requestJson(`${baseUrl(options)}/api/v1/cog/flows/${encodeURIComponent(circuitId)}`);
    const flow=payload.data||{};
    const nodes=Array.isArray(flow.nodes)?flow.nodes:[];
    const edges=Array.isArray(flow.edges)?flow.edges:[];
    const nodeIds=new Set(nodes.map(node=>node?.id).filter(Boolean));
    if(!['canonical_partial','canonical_complete'].includes(flow.status))throw new Error('Unexpected canonical flow status');
    if(edges.some(edge=>edge?.status!=='verified'||edge?.type!=='supplies'||!nodeIds.has(edge.from)||!nodeIds.has(edge.to)))throw new Error('Canonical flow contains invalid edge');
    return {flow:{...flow,nodes,edges},meta:payload.meta||{}};
  }

  async function loadCanonicalTopology(systemId,options={}){
    if(!systemId)throw new Error('systemId is required');
    const payload=await requestJson(`${baseUrl(options)}/api/v1/cog/topologies/${encodeURIComponent(systemId)}`);
    const topology=payload.data||{};
    const nodes=Array.isArray(topology.nodes)?topology.nodes:[];
    const edges=Array.isArray(topology.edges)?topology.edges:[];
    const deferredCandidates=Array.isArray(topology.deferredCandidates)?topology.deferredCandidates:[];
    const nodeIds=new Set(nodes.map(node=>node?.id).filter(Boolean));
    if(!['canonical_partial','canonical_complete'].includes(topology.status))throw new Error('Unexpected canonical topology status');
    if(edges.some(edge=>edge?.status!=='verified'||!nodeIds.has(edge.from)||!nodeIds.has(edge.to)))throw new Error('Canonical topology contains invalid verified edge');
    if(deferredCandidates.some(edge=>edge?.status!=='candidate'||!nodeIds.has(edge.from)||!nodeIds.has(edge.to)))throw new Error('Canonical topology contains invalid deferred candidate');
    if(payload.meta?.physicalCableRoutingVerified!==false)throw new Error('Unexpected physical routing claim');
    return {topology:{...topology,nodes,edges,deferredCandidates},meta:payload.meta||{}};
  }

  async function loadCanonicalDiagnostic(scenarioId,options={}){
    if(!scenarioId)throw new Error('scenarioId is required');
    const payload=await requestJson(`${baseUrl(options)}/api/v1/cog/diagnostics/${encodeURIComponent(scenarioId)}`);
    const diagnostic=payload.data||{};
    const verifiedAnchors=Array.isArray(diagnostic.verifiedAnchors)?diagnostic.verifiedAnchors:[];
    const deferredInvestigation=Array.isArray(diagnostic.deferredInvestigation)?diagnostic.deferredInvestigation:[];
    const meta=payload.meta||{};
    if(diagnostic.scenarioId!==scenarioId||diagnostic.status!=='diagnostic_bounded_partial')throw new Error('Unexpected diagnostic scenario response');
    if(diagnostic.rootCauseDetermined!==false)throw new Error('Unexpected diagnostic root-cause claim');
    if(verifiedAnchors.some(item=>item?.status!=='verified'))throw new Error('Diagnostic anchor is not verified');
    if(deferredInvestigation.some(item=>item?.status!=='candidate'))throw new Error('Diagnostic candidate was promoted');
    if(meta.projection!=='verified_diagnostic_anchors_with_explicit_candidate_investigation')throw new Error('Unexpected diagnostic projection');
    if(meta.candidateRelationsPromoted!==false||meta.physicalCableRoutingVerified!==false)throw new Error('Unexpected diagnostic confidence claim');
    if(meta.diagnosticNature!=='scenario_template_not_root_cause_determination')throw new Error('Unexpected diagnostic nature');
    return {diagnostic:{...diagnostic,verifiedAnchors,deferredInvestigation},meta};
  }

  global.ShakaCore=Object.freeze({
    baseUrl:DEFAULT_BASE,
    depth:DEPTH,
    loadAssetInstance,
    resolveAssetInstance,
    loadObjectDetail,
    loadCanonicalGraph,
    loadCanonicalObject,
    loadCanonicalFlow,
    loadCanonicalTopology,
    loadCanonicalDiagnostic
  });
})(window);
