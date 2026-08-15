(function(global){
  'use strict';

  const DEFAULT_BASE='https://shaka-core-app.onrender.com';
  const DEPTH=1;

  async function requestJson(url){
    const response=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store'});
    if(!response.ok)throw new Error(`Shaka Core HTTP ${response.status}`);
    return response.json();
  }

  async function loadAssetInstance(instanceId,options={}){
    if(!instanceId)throw new Error('instanceId is required');
    const base=(options.baseUrl||DEFAULT_BASE).replace(/\/$/,'');
    const encoded=encodeURIComponent(instanceId);
    const detail=await requestJson(`${base}/api/v1/asset-instances/${encoded}`);
    const graph=await requestJson(`${base}/api/v1/asset-instances/${encoded}/graph?depth=${DEPTH}`);
    if(graph.meta?.depth!==undefined&&graph.meta.depth!==DEPTH)throw new Error('Unexpected Shaka Core graph depth');
    return {
      detail:detail.data||{},
      graph:graph.data||{rootId:instanceId,nodes:[],edges:[]},
      meta:{detail:detail.meta||{},graph:graph.meta||{}}
    };
  }

  global.ShakaCore=Object.freeze({
    baseUrl:DEFAULT_BASE,
    depth:DEPTH,
    loadAssetInstance
  });
})(window);
