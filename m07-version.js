(()=>{
  'use strict';
  const VERSION='v0.3.27';
  document.querySelectorAll('.topbar .status').forEach(el=>{
    el.textContent=el.textContent.replace(/Atlas v0\.3\.26/g,`Atlas ${VERSION}`);
  });
})();
