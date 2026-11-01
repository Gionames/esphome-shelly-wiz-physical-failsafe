// Copyright 2026 Gionames, Apache-2.0. Tab icon (white house) and firmware version in the title of the device page.
(function () {
  var icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M12 3 2 12h3v8h5v-6h4v6h5v-8h3z'/%3E%3C/svg%3E";
  document.querySelectorAll("link[rel~=icon]").forEach(function (l) { l.remove(); });
  var l = document.createElement("link");
  l.rel = "icon";
  l.href = icon;
  document.head.appendChild(l);

  // the project version is filled in at build time (placeholder replaced by the component)
  var suffix = " \u00b7 v" + "__VERSION__";
  function each(root, fn) {
    root.querySelectorAll("*").forEach(function (e) {
      fn(e);
      if (e.shadowRoot) each(e.shadowRoot, fn);
    });
  }
  var heading = null;
  function apply() {
    // the page sets its title after loading: do nothing until there is one
    var base = document.title.split(suffix).join("").trim();
    if (!base) return;
    if (document.title.indexOf(suffix) < 0) document.title = base + suffix;
    // the page rebuilds its heading when it receives the title: search the DOM only when our copy is gone
    if (heading && heading.isConnected && heading.textContent === base + suffix) return;
    heading = null;
    each(document, function (e) {
      if (!heading && e.children.length === 0 && e.textContent.trim() === base) {
        e.textContent = base + suffix;
        heading = e;
      }
    });
  }
  apply();
  setInterval(apply, 2000);
})();
