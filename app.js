// Redirect loader to bust cache safely
// This file is kept for backwards compatibility.
(function(){
  var s=document.createElement('script');
  s.src='./app_v1.11.0.js?v=1.11.0';
  s.defer=true;
  document.head.appendChild(s);
})();
