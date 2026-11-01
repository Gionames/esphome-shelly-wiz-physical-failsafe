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
  var base = document.title;
  function each(root, fn) {
    root.querySelectorAll("*").forEach(function (e) {
      fn(e);
      if (e.shadowRoot) each(e.shadowRoot, fn);
    });
  }
  function apply() {
    if (document.title.indexOf(suffix) < 0) document.title = base + suffix;
    // the visible heading is rebuilt by the page when it receives the title, so keep checking
    each(document, function (e) {
      if (e.children.length === 0 && e.textContent.trim() === base) e.textContent = base + suffix;
    });
  }
  apply();
  setInterval(apply, 1000);
})();
