// Copyright 2026 Gionames, Apache-2.0. Tab icon (white house) for the device page.
(function () {
  var icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M12 3 2 12h3v8h5v-6h4v6h5v-8h3z'/%3E%3C/svg%3E";
  document.querySelectorAll("link[rel~=icon]").forEach(function (l) { l.remove(); });
  var l = document.createElement("link");
  l.rel = "icon";
  l.href = icon;
  document.head.appendChild(l);
})();
