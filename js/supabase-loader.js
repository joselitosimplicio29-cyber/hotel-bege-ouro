(function () {
  window.__supabaseReady = new Promise(function (resolve) {
    if (window.supabase && window.supabase.createClient) {
      resolve(true);
      return;
    }

    var done = false;
    var currentScript = document.currentScript;
    var localSrc = currentScript && currentScript.src
      ? new URL('supabase.min.js', currentScript.src).href
      : 'js/supabase.min.js';
    var cdnSrc = 'https://unpkg.com/@supabase/supabase-js@2';

    function finish(ok) {
      try {
        if (!window.supabase && typeof supabase !== 'undefined') {
          window.supabase = supabase;
        }
      } catch (_) {}
      if (done) return;
      done = true;
      resolve(!!(ok && window.supabase && window.supabase.createClient));
    }

    function load(src, fallback) {
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = function () { finish(true); };
      script.onerror = function () {
        if (fallback) load(fallback);
        else finish(false);
      };
      document.head.appendChild(script);
    }

    load(localSrc, cdnSrc);

    setTimeout(function () { finish(false); }, 2500);
  });
})();
