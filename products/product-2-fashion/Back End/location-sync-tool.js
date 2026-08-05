// location-sync-tool.js
// All event listeners attached via addEventListener (no inline onclick — Helmet CSP compliant)

(function () {
  'use strict';

  // ── Token persistence ───────────────────────────────────────────────────────
  function initToken() {
    const input = document.getElementById('token');
    const saved = localStorage.getItem('gcp_jwt');
    if (saved) input.value = saved;
    input.addEventListener('input', function () {
      localStorage.setItem('gcp_jwt', input.value);
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function getToken() {
    var raw = document.getElementById('token').value.trim();
    if (!raw) { alert('Please enter your JWT token first.'); return null; }
    return raw.startsWith('Bearer ') ? raw : 'Bearer ' + raw;
  }

  function setLoading(btnId, on) {
    var btn = document.getElementById(btnId);
    btn.disabled = on;
    if (on) btn.classList.add('loading');
    else    btn.classList.remove('loading');
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function colorize(text) {
    return esc(text)
      .replace(/\[merge\]\[WARN\]/g, '<span class="log-warn">[merge][WARN]</span>')
      .replace(/\[merge\]/g,         '<span class="log-info">[merge]</span>')
      .replace(/Fatal:/g,            '<span class="log-err">Fatal:</span>')
      .replace(/\bfailed\b/gi,       '<span class="log-err">failed</span>')
      .replace(/\berror\b/gi,        '<span class="log-err">error</span>')
      .replace(/\binserted:/gi,      '<span class="log-ok">inserted:</span>')
      .replace(/\bDone\.\b/gi,       '<span class="log-ok">Done.</span>')
      .replace(/\bupserted:/gi,      '<span class="log-ok">upserted:</span>')
      .replace(/\bcomplete\b/gi,     '<span class="log-ok">complete</span>')
      .replace(/DRY-RUN/g,           '<span class="log-warn">DRY-RUN</span>');
  }

  function showLog(logId, labelId, badgeId, data, elapsed) {
    var box   = document.getElementById(logId);
    var label = document.getElementById(labelId);
    var badge = document.getElementById(badgeId);
    var ok    = data.success !== false && !data.error;

    label.textContent = 'Response \u00b7 ' + elapsed + 'ms';
    badge.textContent = ok ? '\u2713 Success' : '\u2717 Error';
    badge.className   = 'status-badge ' + (ok ? 'ok' : 'err');

    var content = '';
    if (data.output) {
      content = colorize(data.output);
    } else if (data.stats) {
      var s = data.stats;
      content  = '<span class="log-ok">\u2713 ' + esc(data.message || '') + '</span>\n';
      content += '  inserted : <span class="log-ok">' + s.inserted + '</span>\n';
      if (s.errors && s.errors.length) {
        content += '  errors   : <span class="log-err">' + s.errors.length + '</span>\n';
        s.errors.forEach(function (e) { content += '    <span class="log-err">\u2022 ' + esc(e) + '</span>\n'; });
      } else {
        content += '  errors   : <span class="log-ok">0</span>\n';
      }
    } else {
      content = colorize(JSON.stringify(data, null, 2));
    }

    box.innerHTML = content;
    box.classList.add('visible');
    box.scrollTop = box.scrollHeight;
  }

  // ── API calls ────────────────────────────────────────────────────────────────
  function runSync(courier) {
    var token = getToken(); if (!token) return;
    var btnId    = 'btn-' + courier;
    var endpoint = '/api/v1/config/sync-' + courier + '-locations';

    setLoading(btnId, true);
    var t0 = Date.now();
    fetch(endpoint, { method: 'POST', headers: { 'Authorization': token } })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        showLog('log-' + courier, 'label-' + courier, 'badge-' + courier, data, Date.now() - t0);
      })
      .catch(function (e) {
        showLog('log-' + courier, 'label-' + courier, 'badge-' + courier,
          { success: false, output: 'Fetch error: ' + e.message }, Date.now() - t0);
      })
      .finally(function () { setLoading(btnId, false); });
  }

  function runMerge(dryRun) {
    var token = getToken(); if (!token) return;
    var btnId    = dryRun ? 'btn-dryrun' : 'btn-merge';
    var endpoint = '/api/v1/config/merge-location-mappings' + (dryRun ? '?dry_run=true' : '');

    setLoading(btnId, true);
    var t0 = Date.now();
    fetch(endpoint, { method: 'POST', headers: { 'Authorization': token } })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        showLog('log-merge', 'label-merge', 'badge-merge', data, Date.now() - t0);
      })
      .catch(function (e) {
        showLog('log-merge', 'label-merge', 'badge-merge',
          { success: false, output: 'Fetch error: ' + e.message }, Date.now() - t0);
      })
      .finally(function () { setLoading(btnId, false); });
  }

  // ── Wire up buttons via addEventListener (CSP-safe, no onclick attrs) ────────
  document.addEventListener('DOMContentLoaded', function () {
    initToken();
    document.getElementById('btn-pathao')  .addEventListener('click', function () { runSync('pathao'); });
    document.getElementById('btn-steadfast').addEventListener('click', function () { runSync('steadfast'); });
    document.getElementById('btn-dryrun')  .addEventListener('click', function () { runMerge(true); });
    document.getElementById('btn-merge')   .addEventListener('click', function () { runMerge(false); });
  });

}());
