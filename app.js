// Redirect loader to bust cache safely
// This file is kept for backwards compatibility.
(function(){
  if (document.querySelector('script[src*="app_v1.11.1.js"]')) return;
  var s=document.createElement('script');
  s.src='./app_v1.11.1.js?v=1.11.1';
  s.defer=true;
  document.head.appendChild(s);
})();
