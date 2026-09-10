(function () {
  'use strict';
  // confirm dialogs
  document.querySelectorAll('form[data-confirm]').forEach(function (f) {
    f.addEventListener('submit', function (e) { if (!window.confirm(f.getAttribute('data-confirm'))) e.preventDefault(); });
  });

  // client-side image downscale (max 1600px, JPEG 0.85) before upload
  function shrink(file) {
    return new Promise(function (resolve) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return resolve(null);
      var img = new Image(); var url = URL.createObjectURL(file);
      img.onload = function () {
        var MAX = 1600; var w = img.width, h = img.height;
        if (w <= MAX && h <= MAX && file.size < 900 * 1024) { URL.revokeObjectURL(url); return resolve(file); }
        var s = Math.min(1, MAX / Math.max(w, h)); var c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { URL.revokeObjectURL(url); resolve(b ? new File([b], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file); }, 'image/jpeg', 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }
  document.querySelectorAll('[data-photo-input]').forEach(function (input) {
    var preview = input.closest('form').querySelector('[data-photo-preview]');
    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files);
      Promise.all(files.map(shrink)).then(function (out) {
        var dt = new DataTransfer(); out.forEach(function (f) { if (f) dt.items.add(f); });
        input.files = dt.files;
        if (preview) { preview.innerHTML = ''; out.forEach(function (f) { if (!f) return; var im = document.createElement('img'); im.src = URL.createObjectURL(f); preview.appendChild(im); }); }
      });
    });
  });

  // existing photos: remove + drag reorder
  var photos = document.querySelector('[data-photos]');
  if (photos) {
    var removeList = document.querySelector('[data-remove-list]'); var dragging = null;
    photos.addEventListener('click', function (e) {
      var b = e.target.closest('[data-remove-image]'); if (!b) return;
      var p = b.closest('.photo'); removeList.value = (removeList.value ? removeList.value + ',' : '') + p.getAttribute('data-image'); p.remove();
    });
    photos.addEventListener('dragstart', function (e) { dragging = e.target.closest('.photo'); if (dragging) dragging.classList.add('dragging'); });
    photos.addEventListener('dragend', function () { if (dragging) dragging.classList.remove('dragging'); dragging = null; });
    photos.addEventListener('dragover', function (e) {
      e.preventDefault(); var over = e.target.closest('.photo'); if (!over || over === dragging) return;
      var r = over.getBoundingClientRect(); var after = (e.clientX - r.left) > r.width / 2;
      photos.insertBefore(dragging, after ? over.nextSibling : over);
    });
  }
})();
