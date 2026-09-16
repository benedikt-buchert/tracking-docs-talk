/*
 * Live dataLayer validator.
 * Every push that carries a "$schema" URL is checked against that schema.
 * The docs ARE the contract: the browser fetches them and checks the event.
 *
 * Works as a <script> on the page, or pasted into the DevTools console
 * (then load vendor/ajv2020.min.js first, or use the CDN line below).
 */
(function () {
  // Events point at the docs site (http://localhost:3000/schemas/...).
  // The shop server (serve.mjs) serves the same files from ../docs/static/schemas
  // under /schemas/, so we map to it and avoid cross-origin requests.
  // In production, drop the mapping and fetch straight from the docs URL.
  var SCHEMA_MAP = {
    'http://localhost:3000/schemas/': new URL('/schemas/', document.baseURI).href,
  };
  var AJV_CDN = 'https://cdn.jsdelivr.net/npm/ajv-dist@8/dist/ajv2020.min.js';

  function resolve(uri) {
    for (var prefix in SCHEMA_MAP) {
      if (uri.indexOf(prefix) === 0) return SCHEMA_MAP[prefix] + uri.slice(prefix.length);
    }
    return uri;
  }

  function loadAjv() {
    if (window.ajv2020) return Promise.resolve();
    return new Promise(function (ok, fail) {
      var s = document.createElement('script');
      s.src = AJV_CDN;
      s.onload = ok;
      s.onerror = fail;
      document.head.appendChild(s);
    });
  }

  function panel() {
    var el = document.getElementById('dl-validator');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'dl-validator';
    el.innerHTML = '<div class="dlv-head">dataLayer validator</div><ol class="dlv-log"></ol>';
    var css = document.createElement('style');
    css.textContent =
      '#dl-validator{position:fixed;right:16px;bottom:16px;width:min(440px,calc(100vw - 32px));max-height:60vh;overflow:auto;' +
      'background:#111827;color:#f9fafb;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.35);font:14px/1.45 ui-monospace,Menlo,Consolas,monospace;z-index:9999}' +
      '#dl-validator .dlv-head{padding:10px 14px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:12px;color:#9ca3af;border-bottom:1px solid #374151}' +
      '#dl-validator ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column-reverse}' +
      '#dl-validator li{padding:10px 14px;border-bottom:1px solid #1f2937;animation:dlvin .25s ease-out}' +
      '#dl-validator .ok{color:#34d399}#dl-validator .bad{color:#f87171}#dl-validator .warn{color:#fbbf24}' +
      '#dl-validator .err{color:#fecaca;margin:4px 0 0 1.4em;white-space:pre-wrap}' +
      '@keyframes dlvin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
    document.head.appendChild(css);
    document.body.appendChild(el);
    return el;
  }

  function show(kind, title, errors) {
    var li = document.createElement('li');
    var icon = kind === 'ok' ? '✅' : kind === 'bad' ? '❌' : '⚠️';
    var head = document.createElement('div');
    head.className = kind;
    head.textContent = icon + ' ' + title;
    li.appendChild(head);
    (errors || []).forEach(function (e) {
      var d = document.createElement('div');
      d.className = 'err';
      d.textContent = e;
      li.appendChild(d);
    });
    panel().querySelector('ol').appendChild(li);
  }

  function describe(err) {
    var where = err.instancePath || '(root)';
    var msg = err.message;
    if (err.params && err.params.allowedValues) msg += ': ' + err.params.allowedValues.join(' | ');
    if (err.params && err.params.additionalProperty) msg += ': "' + err.params.additionalProperty + '"';
    return where + ' ' + msg;
  }

  function start() {
    var Ajv = window.ajv2020.default || window.ajv2020;
    var makeAjv = function () { return new Ajv({
      allErrors: true,
      strict: false,
      loadSchema: function (uri) {
        var name = uri.split('/').pop();
        return fetch(resolve(uri), { cache: 'no-store' }).then(function (r) {
          if (!r.ok) throw new Error('Cannot load schema ' + name + ': HTTP ' + r.status);
          // A typo in the schema lands here, as a JSON parse error. Report it the
          // same way as a missing file, so a broken schema always reads the same.
          return r.json().catch(function (e) {
            throw new Error('Cannot load schema ' + name + ': ' + e.message);
          });
        });
      },
    }); };

    function check(evt) {
      if (!evt || typeof evt !== 'object' || !evt.event) return;
      var name = evt.event;
      if (!evt.$schema) {
        show('warn', name + ': no $schema, nobody knows what this should look like');
        console.warn('[dl-validator] ⚠️ ' + name + ' has no $schema', evt);
        return;
      }
      // Fresh instance per check, so schema edits show up without reloading.
      var fresh = makeAjv();
      fresh.compileAsync({ $ref: evt.$schema })
        .then(function (validate) {
          if (validate(evt)) {
            show('ok', name);
            console.log('%c[dl-validator] ✅ ' + name, 'color:#059669;font-weight:bold', evt);
          } else {
            var errs = validate.errors.map(describe);
            show('bad', name, errs);
            console.log('%c[dl-validator] ❌ ' + name, 'color:#dc2626;font-weight:bold', evt);
            errs.forEach(function (e) { console.log('   ' + e); });
          }
        })
        .catch(function (e) {
          show('warn', name + ': ' + e.message);
          console.warn('[dl-validator]', e);
        });
    }

    window.dataLayer = window.dataLayer || [];
    var dl = window.dataLayer;
    var original = dl.push.bind(dl);
    dl.push = function () {
      for (var i = 0; i < arguments.length; i++) check(arguments[i]);
      return original.apply(null, arguments);
    };
    panel();
    console.log('%c[dl-validator] watching dataLayer', 'color:#6366f1;font-weight:bold');
  }

  var go = function () { loadAjv().then(start); };
  if (document.body) go();
  else document.addEventListener('DOMContentLoaded', go);
})();
