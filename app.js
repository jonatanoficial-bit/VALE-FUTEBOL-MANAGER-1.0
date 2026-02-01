// Bootstrap loader to avoid stale cache
(function(){
  var s=document.createElement('script');
  s.src='app_v1.11.0.js?t=' + Date.now();
  document.head.appendChild(s);
})();
