(function () {
  if (!('serviceWorker' in navigator)) return;
  if (!/^https?:$/.test(location.protocol)) return;

  window.addEventListener('load', function () {
    var scriptSrc = document.currentScript && document.currentScript.src;
    var swUrl = scriptSrc ? new URL('../sw.js', scriptSrc).pathname : '/sw.js';
    navigator.serviceWorker.register(swUrl).catch(function (err) {
      console.warn('Nao foi possivel registrar o service worker.', err);
    });
  });
})();
