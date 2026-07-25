/* EVA split-file navigation — smooth cross-page fade (CORE ↔ HVAC etc.) */
(function (global) {
  var NAV_KEY = 'eva_nav_fade';
  var BG = '#050507';

  global.evaMarkNavFade = function () {
    try { sessionStorage.setItem(NAV_KEY, '1'); } catch (e) {}
  };

  function ensureOverlay() {
    var ov = document.getElementById('eva-nav-overlay');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'eva-nav-overlay';
    ov.setAttribute('aria-hidden', 'true');
    ov.style.cssText =
      'position:fixed;inset:0;z-index:999999;background:' + BG +
      ';opacity:0;pointer-events:none;transition:opacity 0.48s ease;';
    document.body.appendChild(ov);
    return ov;
  }

  global.evaCrossFileGo = function (url) {
    if (global.__evaCrossNavigating) return;
    global.__evaCrossNavigating = true;
    global.evaMarkNavFade();
    var go = function () { global.location.href = url; };
    if (!document.body) { go(); return; }
    var ov = ensureOverlay();
    ov.style.pointerEvents = 'all';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        ov.style.opacity = '1';
        setTimeout(go, 460);
      });
    });
  };

  global.evaSyncBootFinish = function (onReady) {
    try { if (typeof onReady === 'function') onReady(); } catch (e) {}
    var shouldFade = false;
    try {
      shouldFade = sessionStorage.getItem(NAV_KEY) === '1';
      if (shouldFade) sessionStorage.removeItem(NAV_KEY);
    } catch (e) {}
    var arriving = document.documentElement.classList.contains('eva-nav-arriving');
    if (shouldFade || arriving) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          document.documentElement.classList.remove('eva-preboot');
          document.documentElement.classList.add('eva-nav-revealed');
          setTimeout(function () {
            document.documentElement.classList.remove('eva-nav-arriving', 'eva-nav-revealed');
            var ov = document.getElementById('eva-nav-overlay');
            if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
          }, 520);
        });
      });
      return;
    }
    document.documentElement.classList.remove('eva-preboot');
  };

  try {
    if (sessionStorage.getItem(NAV_KEY) === '1') {
      document.documentElement.classList.add('eva-nav-arriving');
    }
  } catch (e) {}
})(window);
