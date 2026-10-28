/* Pagina web del Mini: capitoli (gruppi) chiudibili.
   js_url sostituisce lo script principale della pagina: lo carico io (stesso indirizzo di default) e poi aggiungo la chiusura dei capitoli. */
(function () {
  var OPEN = ['O1:', 'Valori di accensione', 'Pressione lunga'];   // capitoli aperti di default; gli altri partono chiusi
  var s = document.createElement('script');
  s.src = 'https://oi.esphome.io/v3/www.js';
  document.head.appendChild(s);

  function keyOf(h) { return 'esphome-grp:' + h.textContent.trim(); }
  function apply(r) {
    r.querySelectorAll('.tab-header').forEach(function (h) {
      if (h.hasAttribute('data-done')) return;
      h.setAttribute('data-done', '1');
      var title = h.textContent.trim(), st = null, collapsed;
      try { st = localStorage.getItem(keyOf(h)); } catch (e) {}
      if (st === null) collapsed = !OPEN.some(function (o) { return title.indexOf(o) >= 0; });
      else collapsed = st === '1';
      h.setAttribute('data-c', collapsed ? '1' : '0');
    });
  }
  function setup(r) {
    var st = document.createElement('style');
    st.textContent = '.tab-header{cursor:pointer;user-select:none}' +
      '.tab-header::before{content:"\\25BE  "}' +
      '.tab-header[data-c="1"]::before{content:"\\25B8  "}' +
      '.tab-header[data-c="1"]+.tab-container{display:none}';
    r.appendChild(st);
    apply(r);
    r.addEventListener('click', function (e) {
      var h = e.target && e.target.closest && e.target.closest('.tab-header');
      if (!h) return;
      var c = h.getAttribute('data-c') === '1' ? '0' : '1';
      h.setAttribute('data-c', c);
      try { localStorage.setItem(keyOf(h), c); } catch (x) {}
    });
    new MutationObserver(function () { apply(r); }).observe(r, { childList: true, subtree: true });
  }
  var tries = 0;
  var iv = setInterval(function () {
    var app = document.querySelector('esp-app');
    var t = app && app.shadowRoot && app.shadowRoot.querySelector('esp-entity-table');
    var r = t && t.shadowRoot;
    if (!r || !r.querySelector('.tab-header')) { if (++tries > 400) clearInterval(iv); return; }
    clearInterval(iv);
    setup(r);
  }, 300);
})();
