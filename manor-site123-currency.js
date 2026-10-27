(() => {
  'use strict';

  if (window.__MANOR_SITE123_CURRENCY_V1__) return;
  window.__MANOR_SITE123_CURRENCY_V1__ = true;

  const STATE = {
    nativeBusy: false,
    lastPath: location.pathname,
    observerTimer: null,
    interval: null
  };

  function isHebrew() {
    const p = String(location.pathname || '').toLowerCase();
    return p === '/t-he' || p === '/t-he/' || p.startsWith('/t-he/');
  }

  function wantedCurrency() {
    return isHebrew() ? 'ILS' : 'USD';
  }

  function normalize(v) {
    return String(v || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  function codeFromText(v) {
    const t = normalize(v);
    const hasUSD = /(^|[^A-Z])USD([^A-Z]|$)/.test(t);
    const hasILS = /(^|[^A-Z])ILS([^A-Z]|$)/.test(t);
    if (hasUSD && !hasILS) return 'USD';
    if (hasILS && !hasUSD) return 'ILS';
    return null;
  }

  function readCurrencyConfig() {
    const inputs = document.querySelectorAll('input[type="hidden"]');
    for (const input of inputs) {
      const raw = String(input.value || '');
      if (!raw.includes('"currencies"') || !raw.includes('"defaultCurrency"')) continue;
      try {
        const cfg = JSON.parse(raw);
        if (cfg && cfg.currencies && cfg.defaultCurrency) return cfg;
      } catch (_) {}
    }
    return null;
  }

  function usdRate() {
    const cfg = readCurrencyConfig();
    const n = Number(cfg && cfg.currencies && cfg.currencies.USD && cfg.currencies.USD.rate);
    return Number.isFinite(n) && n > 0 ? n : 0.44;
  }

  function controller() {
    return document.querySelector('.header-m-c-wrapper .multi-currencies-controller')
      || document.querySelector('.multi-currencies-controller');
  }

  function wrapper() {
    const c = controller();
    return document.querySelector('.header-m-c-wrapper')
      || (c && c.closest ? c.closest('.header-m-c-wrapper') : null);
  }

  function currentNativeCurrency() {
    const c = controller();
    if (!c) return null;

    const attrs = [
      c.getAttribute('data-currency'),
      c.getAttribute('data-value'),
      c.getAttribute('data-code'),
      c.getAttribute('aria-label'),
      c.getAttribute('title')
    ];
    for (const a of attrs) {
      const code = codeFromText(a);
      if (code) return code;
    }

    let direct = '';
    for (const node of c.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) direct += ' ' + node.nodeValue;
    }
    let code = codeFromText(direct);
    if (code) return code;

    try {
      const clone = c.cloneNode(true);
      clone.querySelectorAll('.dropdown-menu,[role="menu"],ul').forEach(x => x.remove());
      code = codeFromText(clone.textContent);
      if (code) return code;
    } catch (_) {}

    const w = wrapper();
    if (w) {
      const text = normalize(w.textContent);
      if (text.startsWith('USD')) return 'USD';
      if (text.startsWith('ILS')) return 'ILS';
    }

    return null;
  }

  function makeCurrencyControlOperational() {
    const w = wrapper();
    if (!w) return;
    w.style.setProperty('display', 'block', 'important');
    w.style.setProperty('visibility', 'visible', 'important');
    w.style.setProperty('position', 'fixed', 'important');
    w.style.setProperty('left', '-10000px', 'important');
    w.style.setProperty('top', '0', 'important');
    w.style.setProperty('width', 'auto', 'important');
    w.style.setProperty('height', 'auto', 'important');
    w.style.setProperty('opacity', '0.01', 'important');
    w.style.setProperty('pointer-events', 'auto', 'important');
    w.style.setProperty('overflow', 'visible', 'important');
    w.style.setProperty('z-index', '2147483647', 'important');
  }

  function hideCurrencyControl() {
    const w = wrapper();
    if (!w) return;
    w.style.setProperty('display', 'none', 'important');
  }

  function clickable(el) {
    if (!el) return null;
    if (el.matches && el.matches('a,button,[role="button"]')) return el;
    return (el.querySelector && el.querySelector('a,button,[role="button"]')) || el;
  }

  function findCurrencyOption(code) {
    const c = controller();
    const scopes = [];
    const w = wrapper();
    if (w) scopes.push(w);
    scopes.push(document);

    let best = null;
    let bestScore = Infinity;

    for (const scope of scopes) {
      const els = scope.querySelectorAll(
        'a,button,li,[role="menuitem"],[data-currency],[data-value],[data-code]'
      );

      for (const el of els) {
        if (el === c) continue;

        const explicit = [
          el.getAttribute && el.getAttribute('data-currency'),
          el.getAttribute && el.getAttribute('data-value'),
          el.getAttribute && el.getAttribute('data-code')
        ].map(normalize);

        if (explicit.includes(code)) return clickable(el);

        const text = normalize(el.textContent);
        if (!text || text.length > 35) continue;

        const detected = codeFromText(text);
        if (detected !== code) continue;

        const score = text.length + ((el.children && el.children.length) || 0) * 5;
        if (score < bestScore) {
          best = clickable(el);
          bestScore = score;
        }
      }

      if (best) return best;
    }

    return best;
  }

  function clickNative(el) {
    if (!el) return false;
    try {
      el.click();
      return true;
    } catch (_) {}
    try {
      el.dispatchEvent(new MouseEvent('mousedown', {bubbles:true,cancelable:true,view:window}));
      el.dispatchEvent(new MouseEvent('mouseup', {bubbles:true,cancelable:true,view:window}));
      el.dispatchEvent(new MouseEvent('click', {bubbles:true,cancelable:true,view:window}));
      return true;
    } catch (_) {}
    try {
      if (window.jQuery) {
        window.jQuery(el).trigger('click');
        return true;
      }
    } catch (_) {}
    return false;
  }

  function syncNativeCurrency() {
    if (STATE.nativeBusy) return;

    const wanted = wantedCurrency();
    const current = currentNativeCurrency();

    if (current === wanted) {
      hideCurrencyControl();
      return;
    }

    const c = controller();
    if (!c) return;

    STATE.nativeBusy = true;
    makeCurrencyControlOperational();

    const directOption = findCurrencyOption(wanted);
    if (directOption) {
      clickNative(directOption);
      setTimeout(() => {
        STATE.nativeBusy = false;
        hideCurrencyControl();
        renderPrices();
      }, 600);
      return;
    }

    clickNative(c);

    setTimeout(() => {
      const option = findCurrencyOption(wanted);
      if (option) clickNative(option);

      setTimeout(() => {
        STATE.nativeBusy = false;
        hideCurrencyControl();
        renderPrices();
      }, 600);
    }, 250);
  }

  function parseAmount(v) {
    const n = Number(String(v || '').replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : null;
  }

  function pretty(n) {
    return Math.round(n).toLocaleString('en-US', {
      useGrouping: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  function parsePriceText(text) {
    const s = String(text || '').replace(/\u00a0/g, ' ').trim();
    let m = s.match(/^₪\s*([0-9][0-9,]*(?:\.[0-9]+)?)$/);
    if (m) return {currency:'ILS', amount:parseAmount(m[1])};

    m = s.match(/^\$\s*([0-9][0-9,]*(?:\.[0-9]+)?)$/);
    if (m) return {currency:'USD', amount:parseAmount(m[1])};

    m = s.match(/^([0-9][0-9,]*(?:\.[0-9]+)?)\s*₪$/);
    if (m) return {currency:'ILS', amount:parseAmount(m[1])};

    m = s.match(/^([0-9][0-9,]*(?:\.[0-9]+)?)\s*\$$/);
    if (m) return {currency:'USD', amount:parseAmount(m[1])};

    return null;
  }

  function renderLeafPrice(el, rate) {
    if (!el || el.childElementCount !== 0) return;
    if (el.closest && el.closest('.header-m-c-wrapper')) return;
    if (/^(SCRIPT|STYLE|INPUT|TEXTAREA|OPTION)$/i.test(el.tagName)) return;

    const currentText = String(el.textContent || '').replace(/\u00a0/g, ' ').trim();
    const info = parsePriceText(currentText);
    if (!info || info.amount === null) return;

    const previousRendered = el.getAttribute('data-manor-rendered');
    let baseILS = Number(el.getAttribute('data-manor-base-ils'));

    if (!Number.isFinite(baseILS) || currentText !== previousRendered) {
      baseILS = info.currency === 'ILS' ? info.amount : info.amount / rate;
      el.setAttribute('data-manor-base-ils', String(baseILS));
    }

    const desired = isHebrew()
      ? '₪' + pretty(baseILS)
      : '$' + pretty(baseILS * rate);

    if (currentText !== desired) el.textContent = desired;
    el.setAttribute('data-manor-rendered', desired);
  }

  function renderPrices() {
    if (!document.body) return;
    const rate = usdRate();
    const els = document.body.querySelectorAll('a,span,div,p,strong,b,small');
    for (const el of els) renderLeafPrice(el, rate);
  }

  function run() {
    syncNativeCurrency();
    renderPrices();
  }

  function start() {
    run();
    setTimeout(run, 250);
    setTimeout(run, 800);
    setTimeout(run, 1600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once:true});
  } else {
    start();
  }

  window.addEventListener('load', start);
  window.addEventListener('pageshow', start);

  STATE.interval = setInterval(() => {
    if (location.pathname !== STATE.lastPath) {
      STATE.lastPath = location.pathname;
      STATE.nativeBusy = false;
    }
    run();
  }, 900);

  if (document.documentElement) {
    new MutationObserver(() => {
      clearTimeout(STATE.observerTimer);
      STATE.observerTimer = setTimeout(() => {
        renderPrices();
        syncNativeCurrency();
      }, 100);
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
})();