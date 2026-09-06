(function(global){
  'use strict';

  const DEFAULT_SERVER_ORIGIN='https://shaka-server.onrender.com';
  const STORAGE_KEY='ATLAS_SERVER_ORIGIN';

  function normalizeOrigin(value){
    if(value==null)return '';
    const trimmed=String(value).trim();
    if(!trimmed)return '';
    return trimmed.replace(/\/$/,'');
  }

  function resolveServerOrigin(options={}){
    const fromOptions=normalizeOrigin(options.baseUrl||options.serverOrigin||options.SERVER_ORIGIN);
    if(fromOptions)return fromOptions;
    try{
      if(typeof location!=='undefined'&&location.search){
        const params=new URLSearchParams(location.search);
        const fromQuery=normalizeOrigin(params.get('server')||params.get('SERVER_ORIGIN'));
        if(fromQuery)return fromQuery;
      }
      if(typeof localStorage!=='undefined'){
        const fromStorage=normalizeOrigin(localStorage.getItem(STORAGE_KEY));
        if(fromStorage)return fromStorage;
      }
      if(global&&global.__ATLAS_SERVER_ORIGIN__){
        const fromGlobal=normalizeOrigin(global.__ATLAS_SERVER_ORIGIN__);
        if(fromGlobal)return fromGlobal;
      }
    }catch(_){/* ignore storage/location access errors */}
    return DEFAULT_SERVER_ORIGIN;
  }

  global.AtlasServer=Object.freeze({
    DEFAULT_SERVER_ORIGIN,
    STORAGE_KEY,
    resolveServerOrigin,
    normalizeOrigin
  });
})(typeof window!=='undefined'?window:globalThis);
