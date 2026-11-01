/* Pagina web del Mini: capitoli (gruppi) chiudibili e spostabili (trascinando l'intestazione), Debug Log chiudibile.
   js_url sostituisce lo script principale della pagina: lo carico io (stesso indirizzo di default) e poi aggiungo le funzioni. */
(function () {
  var OPEN = ['O1:', 'Power-on brightness values', 'Long press'];
  var ORDER = ['O1:', 'Failsafe', 'Long press and dimmer', 'Input and button', 'Relay and coil-pwm settings', 'Versions', 'Power-on brightness values', 'Brightness limits', 'Timer', 'Bluetooth', 'System', 'Diagnostic', 'Measurements', 'Wi-Fi', 'Protections'];   // ordine di default dei capitoli; gruppi non elencati: in cima
  var RENAME = { 'Configuration': 'Bluetooth, Restart and Factory reset' };   // titolo dei capitoli creati in automatico da ESPHome   // capitoli aperti di default; gli altri partono chiusi
  if (!window.__esphomeNoLoad) {
    var s = document.createElement('script');
    s.src = 'https://oi.esphome.io/v3/www.js';
    document.head.appendChild(s);
  }

  function ls(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {}
    return null;
  }
  function keyOf(h) { return 'esphome-grp:' + h.textContent.trim(); }

  var drag = null;

  function order(r) {
    var p = r.querySelector('.tab-header').parentElement;
    var hs = [].slice.call(p.querySelectorAll(':scope > .tab-header'));
    var saved = [];
    try { saved = JSON.parse(ls('esphome-order3') || '[]'); } catch (e) {}
    var titles = hs.map(function (h) { return h.textContent.trim(); });
    var list = saved.filter(function (t) { return titles.indexOf(t) >= 0; });
    function rank(t) { for (var i = 0; i < ORDER.length; i++) if (t.indexOf(ORDER[i]) === 0) return i; return -1; }
    var def = titles.map(function (t, i) { return { t: t, k: rank(t), i: i }; })
      .sort(function (a, b) { return a.k - b.k || a.i - b.i; }).map(function (x) { return x.t; });
    def.forEach(function (t) { if (list.indexOf(t) < 0) list.push(t); });
    hs.forEach(function (h) {
      var o = list.indexOf(h.textContent.trim()) * 2 + 1;
      if (h.style.order !== String(o)) h.style.order = o;
      var c = h.nextElementSibling;
      if (c && c.style.order !== String(o + 1)) c.style.order = o + 1;
    });
    return list;
  }

  function apply(r) {
    r.querySelectorAll('.tab-header').forEach(function (h) {
      if (h.hasAttribute('data-done')) return;
      h.setAttribute('data-done', '1');
      h.setAttribute('draggable', 'true');
      var tn = [].slice.call(h.childNodes).filter(function (n) { return n.nodeType === 3 && n.nodeValue.trim(); })[0];
      if (tn && RENAME[tn.nodeValue.trim()]) tn.nodeValue = RENAME[tn.nodeValue.trim()];
      var title = h.textContent.trim(), st = ls(keyOf(h)), collapsed;
      if (st === null) collapsed = !OPEN.some(function (o) { return title.indexOf(o) >= 0; });
      else collapsed = st === '1';
      h.setAttribute('data-c', collapsed ? '1' : '0');
    });
    order(r);
  }

  function setup(r) {
    var p = r.querySelector('.tab-header').parentElement;
    p.style.display = 'flex';
    p.style.flexDirection = 'column';
    var st = document.createElement('style');
    st.textContent =
      '.tab-header{display:flex!important;align-items:center;width:100%!important;max-width:none!important;box-sizing:border-box!important;' +
      'margin:8px 0 2px!important;padding:9px 12px!important;font-weight:600;border-radius:6px!important;' +
      'background:rgba(127,127,127,.18);cursor:grab;user-select:none}' +
      '.tab-header:hover{background:rgba(127,127,127,.3)}' +
      '.tab-header::before{content:"\\25BE\\00a0\\00a0"}' +
      '.tab-header[data-c="1"]::before{content:"\\25B8\\00a0\\00a0"}' +
      '.tab-header[data-c="1"]+.tab-container{display:none}' +
      '.tab-header.dg-over{outline:2px solid #03a9f4}' +
      '.tab-header.dg-src{opacity:.4}';
    r.appendChild(st);
    apply(r);
    r.addEventListener('click', function (e) {
      var h = e.target && e.target.closest && e.target.closest('.tab-header');
      if (!h) return;
      var c = h.getAttribute('data-c') === '1' ? '0' : '1';
      h.setAttribute('data-c', c);
      ls(keyOf(h), c);
    });
    r.addEventListener('dragstart', function (e) {
      var h = e.target && e.target.closest && e.target.closest('.tab-header');
      if (!h) return;
      drag = h; h.classList.add('dg-src');
      try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', h.textContent.trim()); } catch (x) {}
    });
    r.addEventListener('dragover', function (e) {
      var h = e.target && e.target.closest && e.target.closest('.tab-header');
      if (!drag || !h || h === drag) return;
      e.preventDefault();
      r.querySelectorAll('.dg-over').forEach(function (x) { x.classList.remove('dg-over'); });
      h.classList.add('dg-over');
    });
    r.addEventListener('drop', function (e) {
      var h = e.target && e.target.closest && e.target.closest('.tab-header');
      if (!drag || !h || h === drag) return;
      e.preventDefault();
      var list = order(r), a = drag.textContent.trim(), b = h.textContent.trim();
      var ia = list.indexOf(a), ib = list.indexOf(b);
      list.splice(ia, 1);
      list.splice(ib, 0, a);   // il gruppo trascinato prende il posto di quello su cui lo lascio
      ls('esphome-order3', JSON.stringify(list));
      order(r);
    });
    r.addEventListener('dragend', function () {
      r.querySelectorAll('.dg-over,.dg-src').forEach(function (x) { x.classList.remove('dg-over'); x.classList.remove('dg-src'); });
      drag = null;
    });
    new MutationObserver(function () { apply(r); }).observe(r, { childList: true, subtree: true });
  }

  // Debug Log chiudibile: nascondo solo l'elemento, non tocco la connessione agli eventi
  function logToggle(app) {
    var lg = app.shadowRoot.querySelector('esp-log');
    if (!lg || lg.hasAttribute('data-done')) return !!lg;
    lg.setAttribute('data-done', '1');
    var bar = document.createElement('div');
    bar.textContent = 'Debug Log';
    bar.style.cssText = 'cursor:pointer;user-select:none;font-weight:600;padding:9px 12px;margin:8px 0 2px;border-radius:6px;background:rgba(127,127,127,.18)';
    function set(c) {
      lg.style.display = c ? 'none' : '';
      bar.textContent = (c ? '▸  ' : '▾  ') + 'Debug Log';
      bar.setAttribute('data-c', c ? '1' : '0');
    }
    var st = ls('esphome-log');
    set(st === null ? true : st === '1');
    bar.addEventListener('click', function () {
      var c = bar.getAttribute('data-c') !== '1';
      set(c); ls('esphome-log', c ? '1' : '0');
    });
    lg.parentElement.insertBefore(bar, lg);
    return true;
  }

  var tries = 0, doneT = false, doneL = false;
  var iv = setInterval(function () {
    var app = document.querySelector('esp-app');
    if (app && app.shadowRoot) {
      if (!doneL) doneL = logToggle(app);
      var t = app.shadowRoot.querySelector('esp-entity-table');
      var r = t && t.shadowRoot;
      if (!doneT && r && r.querySelector('.tab-header')) { setup(r); doneT = true; }
    }
    if ((doneT && doneL) || ++tries > 400) clearInterval(iv);
  }, 300);
})();
