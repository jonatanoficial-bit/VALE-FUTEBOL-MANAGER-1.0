/*
  VFM Diagnostics (provisório / removível)

  Objetivo: identificar e relatar problemas de carregamento em produção (mobile, sem console).

  Funcionalidades:
  - Captura window.onerror e unhandledrejection
  - Captura falhas de carregamento de recursos (script, css, img)
  - Monitora fetch() para detectar falhas ao carregar JSON/DLC
  - Persiste logs em LocalStorage
  - Exibe relatório em uma tela do app (#/diagnostics)

  Remoção no final:
  - Apagar este arquivo
  - Remover a tag de script no index.html
  - Remover a rota /diagnostics no app.js (opcional)
*/

(function () {
  'use strict';

  var LS_KEY = 'vfm26_diagnostics';
  var MAX_EVENTS = 400;

  function nowIso() {
    try { return new Date().toISOString(); } catch (e) { return String(Date.now()); }
  }

  function safeJsonParse(str, fallback) {
    try { return JSON.parse(str); } catch (e) { return fallback; }
  }

  function readStore() {
    var raw = null;
    try { raw = localStorage.getItem(LS_KEY); } catch (e) { raw = null; }
    var parsed = safeJsonParse(raw, null);
    if (!parsed || typeof parsed !== 'object') {
      return {
        createdAt: nowIso(),
        userAgent: (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : 'unknown',
        url: (typeof location !== 'undefined' && location.href) ? location.href : 'unknown',
        events: []
      };
    }
    if (!Array.isArray(parsed.events)) parsed.events = [];
    return parsed;
  }

  function writeStore(store) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch (e) {
      // se falhar, não quebra o app
    }
  }

  function pushEvent(type, payload) {
    var store = readStore();
    var evt = {
      at: nowIso(),
      type: String(type || 'unknown'),
      payload: payload || {}
    };
    store.events.push(evt);
    if (store.events.length > MAX_EVENTS) {
      store.events = store.events.slice(store.events.length - MAX_EVENTS);
    }
    writeStore(store);
  }

  function normalizeError(err) {
    if (!err) return { message: 'unknown', stack: null };
    if (typeof err === 'string') return { message: err, stack: null };
    return {
      message: String(err.message || err.reason || err.toString || 'error'),
      stack: err.stack ? String(err.stack) : null
    };
  }

  // API global
  var api = {
    enabled: true,
    capture: pushEvent,
    read: function () { return readStore(); },
    clear: function () {
      try { localStorage.removeItem(LS_KEY); } catch (e) {}
      pushEvent('diag_clear', { ok: true });
    },
    // UI: HTML simples (usado pelo app.js)
    renderHtml: function () {
      var store = readStore();
      var events = Array.isArray(store.events) ? store.events.slice().reverse() : [];
      var rows = events.map(function (e) {
        var p = e.payload || {};
        var s = '';
        try { s = JSON.stringify(p); } catch (_e) { s = String(p); }
        return (
          '<div class="item" style="align-items:flex-start">' +
            '<div class="item-left" style="flex-direction:column; align-items:flex-start; gap:4px">' +
              '<div class="item-title">' + esc(e.type) + '</div>' +
              '<div class="item-sub">' + esc(e.at) + '</div>' +
              '<pre style="margin:6px 0 0; white-space:pre-wrap; word-break:break-word; opacity:.92">' + esc(s) + '</pre>' +
            '</div>' +
          '</div>'
        );
      }).join('');

      var summary = summarize(store);

      return (
        '<div class="card">' +
          '<div class="card-header">' +
            '<div>' +
              '<div class="card-title">Diagnósticos</div>' +
              '<div class="card-subtitle">Relatório completo de carregamento (provisório)</div>' +
            '</div>' +
            '<span class="badge">VFM</span>' +
          '</div>' +
          '<div class="card-body">' +
            '<div class="notice">Se a tela ficar em branco, abra <b>Admin → Diagnósticos</b> e envie este relatório.</div>' +
            '<div class="sep"></div>' +
            '<div class="small" style="line-height:1.6">' +
              '<div><b>URL:</b> ' + esc(summary.url) + '</div>' +
              '<div><b>User-Agent:</b> ' + esc(summary.userAgent) + '</div>' +
              '<div><b>Eventos:</b> ' + esc(summary.count) + '</div>' +
              '<div><b>Último erro:</b> ' + esc(summary.lastError || '-') + '</div>' +
              '<div><b>Última falha de recurso:</b> ' + esc(summary.lastResourceFail || '-') + '</div>' +
              '<div><b>Última falha de fetch:</b> ' + esc(summary.lastFetchFail || '-') + '</div>' +
            '</div>' +
            '<div class="sep"></div>' +
            '<div style="display:flex; gap:10px; flex-wrap:wrap">' +
              '<button class="btn btn-primary" data-action="diagCopy">Copiar relatório</button>' +
              '<button class="btn btn-ghost" data-action="diagClear">Limpar</button>' +
              '<button class="btn btn-ghost" data-go="/home">Menu</button>' +
            '</div>' +
            '<div class="sep"></div>' +
            (rows || '<div class="notice">Nenhum evento registrado.</div>') +
          '</div>' +
        '</div>'
      );
    },
    renderText: function () {
      var store = readStore();
      return JSON.stringify(store, null, 2);
    }
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function summarize(store) {
    var events = Array.isArray(store.events) ? store.events : [];
    var lastError = null;
    var lastResourceFail = null;
    var lastFetchFail = null;

    for (var i = events.length - 1; i >= 0; i--) {
      var ev = events[i];
      if (!lastError && (ev.type === 'error' || ev.type === 'unhandledrejection')) {
        lastError = (ev.payload && (ev.payload.message || ev.payload.reason)) ? (ev.payload.message || ev.payload.reason) : JSON.stringify(ev.payload);
      }
      if (!lastResourceFail && ev.type === 'resource_error') {
        lastResourceFail = (ev.payload && ev.payload.url) ? ev.payload.url : JSON.stringify(ev.payload);
      }
      if (!lastFetchFail && ev.type === 'fetch_error') {
        lastFetchFail = (ev.payload && ev.payload.url) ? ev.payload.url : JSON.stringify(ev.payload);
      }
      if (lastError && lastResourceFail && lastFetchFail) break;
    }

    return {
      url: store.url || (typeof location !== 'undefined' ? location.href : 'unknown'),
      userAgent: store.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'),
      count: events.length,
      lastError: lastError,
      lastResourceFail: lastResourceFail,
      lastFetchFail: lastFetchFail
    };
  }

  // Captura erros globais
  try {
    window.addEventListener('error', function (event) {
      // error de recurso (script/css/img) geralmente vem com target
      var t = event && event.target;
      var isResource = t && (t.tagName === 'SCRIPT' || t.tagName === 'LINK' || t.tagName === 'IMG');
      if (isResource) {
        var url = t.src || t.href || '';
        pushEvent('resource_error', {
          tag: t.tagName,
          url: url,
          id: t.id || null,
          className: t.className || null
        });
        return;
      }

      var err = normalizeError(event && event.error ? event.error : event);
      pushEvent('error', {
        message: err.message,
        filename: event && event.filename ? String(event.filename) : null,
        lineno: event && event.lineno ? Number(event.lineno) : null,
        colno: event && event.colno ? Number(event.colno) : null,
        stack: err.stack
      });
    }, true);
  } catch (e) {
    // ignore
  }

  // Promises rejeitadas
  try {
    window.addEventListener('unhandledrejection', function (event) {
      var err = normalizeError(event && event.reason ? event.reason : event);
      pushEvent('unhandledrejection', { message: err.message, stack: err.stack });
    });
  } catch (e) {
    // ignore
  }

  // Monitorar fetch
  try {
    if (typeof window.fetch === 'function') {
      var _fetch = window.fetch.bind(window);
      window.fetch = function (input, init) {
        var url = '';
        try { url = typeof input === 'string' ? input : (input && input.url ? input.url : String(input)); } catch (e) { url = 'unknown'; }
        pushEvent('fetch_start', { url: url, method: (init && init.method) ? String(init.method) : 'GET' });
        return _fetch(input, init).then(function (resp) {
          if (!resp || !resp.ok) {
            pushEvent('fetch_error', { url: url, status: resp ? resp.status : null, statusText: resp ? resp.statusText : null });
          } else {
            pushEvent('fetch_ok', { url: url, status: resp.status });
          }
          return resp;
        }).catch(function (err) {
          var ne = normalizeError(err);
          pushEvent('fetch_error', { url: url, message: ne.message, stack: ne.stack });
          throw err;
        });
      };
    }
  } catch (e) {
    // ignore
  }

  // Indicador básico de que o diagnóstico está ativo
  pushEvent('diag_boot', {
    href: (typeof location !== 'undefined' ? location.href : 'unknown'),
    ts: nowIso()
  });

  window.VFM_DIAG = api;

  // Utilitário: copia para a área de transferência (usado pelo app.js via bindEvents)
  window.__vfmDiagCopy = function () {
    try {
      var txt = api.renderText();
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt);
        pushEvent('diag_copy', { ok: true, via: 'clipboard' });
        return true;
      }
    } catch (e) {
      // ignore
    }

    // fallback: textarea
    try {
      var ta = document.createElement('textarea');
      ta.value = api.renderText();
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      pushEvent('diag_copy', { ok: !!ok, via: 'execCommand' });
      return !!ok;
    } catch (e) {
      pushEvent('diag_copy', { ok: false, error: String(e) });
      return false;
    }
  };
})();
