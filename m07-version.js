(()=>{
  'use strict';
  const VERSION='v0.3.33';
  document.querySelectorAll('.topbar .status').forEach(el=>{
    el.textContent=el.textContent.replace(/Atlas v0\.3\.\d+/g,`Atlas ${VERSION}`);
  });
})();
