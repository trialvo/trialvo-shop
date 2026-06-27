/**
 * Trialvo Pay — Shared UI Component Library
 * Reusable components for Admin Panel & Merchant Portal
 * Version 1.0
 */

const UI = {

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM COMPONENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Render a form input field
   * @param {string} id - Element ID
   * @param {string} label - Label text
   * @param {object} opts - { type, placeholder, value, required, icon, disabled, hint }
   */
  input(id, label, opts = {}) {
    const { type = 'text', placeholder = '', value = '', required = false, icon = '', disabled = false, hint = '' } = opts;
    const reqMark = required ? ' <span class="ui-required">*</span>' : '';
    const iconHtml = icon ? `<i data-lucide="${icon}" class="ui-input-icon"></i>` : '';
    const wrapClass = icon ? 'ui-input-icon-wrap' : '';
    return `
      <div class="ui-form-group">
        <label class="ui-label" for="${id}">${label}${reqMark}</label>
        ${hint ? `<div class="ui-hint">${hint}</div>` : ''}
        <div class="${wrapClass}">
          ${iconHtml}
          <input class="ui-input" id="${id}" name="${id}" type="${type}"
            placeholder="${placeholder}" value="${this._esc(value)}"
            ${required ? 'required' : ''} ${disabled ? 'disabled' : ''}>
        </div>
      </div>`;
  },

  /**
   * Render a select dropdown
   * @param {string} id - Element ID
   * @param {string} label - Label text
   * @param {Array<{value,label}>} options
   * @param {object} opts - { value, required, hint }
   */
  select(id, label, options = [], opts = {}) {
    const { value = '', required = false, hint = '' } = opts;
    return `
      <div class="ui-form-group">
        <label class="ui-label" for="${id}">${label}${required ? ' <span class="ui-required">*</span>' : ''}</label>
        ${hint ? `<div class="ui-hint">${hint}</div>` : ''}
        <select class="ui-select" id="${id}" name="${id}" ${required ? 'required' : ''}>
          ${options.map(o => `<option value="${o.value}" ${o.value == value ? 'selected' : ''}>${o.label}</option>`).join('')}
        </select>
      </div>`;
  },

  /**
   * Render a textarea
   * @param {string} id
   * @param {string} label
   * @param {object} opts - { placeholder, value, rows, hint }
   */
  textarea(id, label, opts = {}) {
    const { placeholder = '', value = '', rows = 3, hint = '' } = opts;
    return `
      <div class="ui-form-group">
        <label class="ui-label" for="${id}">${label}</label>
        ${hint ? `<div class="ui-hint">${hint}</div>` : ''}
        <textarea class="ui-textarea" id="${id}" name="${id}" rows="${rows}" placeholder="${placeholder}">${this._esc(value)}</textarea>
      </div>`;
  },

  /**
   * Render a checkbox
   * @param {string} id
   * @param {string} label
   * @param {object} opts - { checked }
   */
  checkbox(id, label, opts = {}) {
    const { checked = false } = opts;
    return `
      <div class="ui-form-group">
        <label class="ui-checkbox">
          <input type="checkbox" id="${id}" name="${id}" ${checked ? 'checked' : ''}>
          <span class="ui-checkbox-mark"></span>
          <span class="ui-checkbox-label">${label}</span>
        </label>
      </div>`;
  },

  /**
   * Render a checkbox group (multi-select)
   * @param {string} name - Shared input name
   * @param {string} label - Group label
   * @param {Array<{value,label,checked}>} items
   */
  checkboxGroup(name, label, items = []) {
    return `
      <div class="ui-form-group">
        <label class="ui-label">${label}</label>
        <div class="ui-checkbox-group">
          ${items.map(item => `
            <label class="ui-checkbox">
              <input type="checkbox" name="${name}" value="${item.value}" ${item.checked ? 'checked' : ''}>
              <span class="ui-checkbox-mark"></span>
              <span class="ui-checkbox-label">${item.label}</span>
            </label>
          `).join('')}
        </div>
      </div>`;
  },

  /**
   * Render a form error message container
   * @param {string} id
   */
  formError(id) {
    return `<div id="${id}" class="ui-form-error ui-hidden"></div>`;
  },

  /**
   * Render a horizontal divider inside forms
   */
  divider() {
    return '<hr class="ui-divider">';
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYOUT COMPONENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Render a page header with title, subtitle, and actions
   */
  pageHeader(title, subtitle = '', actions = '') {
    return `
      <div class="ui-page-header">
        <div class="ui-page-header-text">
          <h1 class="ui-page-title">${title}</h1>
          ${subtitle ? `<p class="ui-page-subtitle">${subtitle}</p>` : ''}
        </div>
        ${actions ? `<div class="ui-page-actions">${actions}</div>` : ''}
      </div>`;
  },

  /**
   * Render a card container
   * @param {string} content - Inner HTML
   * @param {object} opts - { title, icon, actions, noPadding, className }
   */
  card(content, opts = {}) {
    const { title = '', icon = '', actions = '', noPadding = false, className = '' } = opts;
    const headerHtml = title ? `
      <div class="ui-card-header">
        <h3 class="ui-card-title">${icon ? `<i data-lucide="${icon}"></i> ` : ''}${title}</h3>
        ${actions ? `<div class="ui-card-actions">${actions}</div>` : ''}
      </div>` : '';
    return `
      <div class="ui-card ${className}">
        ${headerHtml}
        <div class="ui-card-body${noPadding ? ' no-padding' : ''}">${content}</div>
      </div>`;
  },

  /**
   * Render a stat card
   */
  statCard(title, value, icon, color = 'primary', trend = null) {
    const trendHtml = trend !== null ? `
      <div class="ui-stat-trend ${trend >= 0 ? 'up' : 'down'}">
        <i data-lucide="${trend >= 0 ? 'trending-up' : 'trending-down'}"></i>
        ${Math.abs(trend)}%
      </div>` : '';
    return `
      <div class="ui-stat-card">
        <div class="ui-stat-icon ui-stat-icon-${color}">
          <i data-lucide="${icon}"></i>
        </div>
        <div class="ui-stat-body">
          <div class="ui-stat-value">${value}</div>
          <div class="ui-stat-title">${title}</div>
          ${trendHtml}
        </div>
      </div>`;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA DISPLAY
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Render a data table
   * @param {Array<{label,key}>} columns
   * @param {Array<Object>} rows - Each row is an object with keys matching column keys
   * @param {object} opts - { emptyMessage, emptyIcon }
   */
  table(columns, rows, opts = {}) {
    const { emptyMessage = 'No data found', emptyIcon = 'inbox' } = opts;
    if (!rows || rows.length === 0) {
      return this.emptyState(emptyIcon, emptyMessage);
    }
    return `
      <div class="ui-table-wrapper">
        <table class="ui-table">
          <thead>
            <tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr class="ui-table-row" ${row._onclick ? `onclick="${row._onclick}" style="cursor:pointer"` : ''}>
                ${columns.map(c => `<td>${row[c.key] ?? '—'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  },

  /**
   * Render a detail grid (label-value pairs)
   * @param {Array<{label,value}>} rows
   */
  detailGrid(rows) {
    return `<div class="ui-detail-grid">${rows.map(r =>
      `<div class="ui-detail-row">
        <span class="ui-detail-label">${r.label}</span>
        <span class="ui-detail-value">${r.value ?? '—'}</span>
      </div>`
    ).join('')}</div>`;
  },

  /**
   * Render a single detail row (backward compat)
   */
  detailRow(label, value) {
    return `<div class="ui-detail-row"><span class="ui-detail-label">${label}</span><span class="ui-detail-value">${value ?? '—'}</span></div>`;
  },

  /**
   * Render a status badge
   */
  badge(text, type = 'neutral') {
    return `<span class="ui-badge ui-badge-${type}">${text}</span>`;
  },

  /**
   * Auto-color status badge based on status text
   */
  statusBadge(status) {
    const map = {
      success: 'success', paid: 'success', delivered: 'success', active: 'success', approved: 'success', completed: 'success',
      pending: 'warning', requested: 'warning', queued: 'warning', processing: 'info',
      failed: 'danger', rejected: 'danger', expired: 'danger', exhausted: 'danger', revoked: 'danger',
      cancelled: 'neutral', inactive: 'neutral', sent: 'info', initiated: 'info',
    };
    const type = map[status?.toLowerCase()] || 'neutral';
    return `<span class="ui-badge ui-badge-${type}">${status || '—'}</span>`;
  },

  /**
   * Render a code tag
   */
  code(text, opts = {}) {
    const { small = false, copyable = false } = opts;
    const cls = small ? 'ui-code sm' : 'ui-code';
    if (copyable) {
      return `<span class="${cls}">${this._esc(text)}</span> <button class="ui-copy-btn" onclick="navigator.clipboard.writeText('${this._esc(text)}')"><i data-lucide="copy"></i></button>`;
    }
    return `<span class="${cls}">${this._esc(text)}</span>`;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FEEDBACK
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Show a toast notification
   */
  toast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'ui-toast-container';
      document.body.appendChild(container);
    }
    const id = `toast-${Date.now()}`;
    const icons = { success: 'check-circle', error: 'x-circle', info: 'info', warning: 'alert-triangle' };
    const toast = document.createElement('div');
    toast.className = `ui-toast ui-toast-${type}`;
    toast.id = id;
    toast.innerHTML = `
      <i data-lucide="${icons[type] || 'info'}" class="ui-toast-icon"></i>
      <span class="ui-toast-message">${message}</span>
      <button class="ui-toast-close" onclick="document.getElementById('${id}').remove()">
        <i data-lucide="x"></i>
      </button>`;
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons({ nodes: [toast] });
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Show a modal dialog
   * @param {string} title
   * @param {string} content - Inner HTML
   * @param {Array<string>} actions - Array of button HTML strings
   */
  modal(title, content, actions = []) {
    const backdrop = document.getElementById('modal-backdrop');
    const container = document.getElementById('modal-container');
    if (!backdrop || !container) return;
    container.innerHTML = `
      <div class="ui-modal">
        <div class="ui-modal-header">
          <h3 class="ui-modal-title">${title}</h3>
          <button class="ui-btn-icon" onclick="UI.closeModal()"><i data-lucide="x"></i></button>
        </div>
        <div class="ui-modal-body">${content}</div>
        ${actions.length ? `<div class="ui-modal-footer">${actions.join('')}</div>` : ''}
      </div>`;
    backdrop.classList.remove('hidden');
    if (window.lucide) lucide.createIcons({ nodes: [container] });
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) UI.closeModal(); });
  },

  closeModal() {
    document.getElementById('modal-backdrop')?.classList.add('hidden');
  },

  /**
   * Show a confirmation dialog
   */
  confirm(title, message, onConfirmFn) {
    this.modal(title, `
      <p class="ui-confirm-message">${message}</p>
    `, [
      `<button class="ui-btn ui-btn-ghost" onclick="UI.closeModal()">Cancel</button>`,
      `<button class="ui-btn ui-btn-danger" onclick="(${onConfirmFn})(); UI.closeModal()">Confirm</button>`,
    ]);
  },

  /**
   * Render an empty state
   */
  emptyState(icon, title, desc = '') {
    return `
      <div class="ui-empty-state">
        <i data-lucide="${icon}" class="ui-empty-icon"></i>
        ${title ? `<h3 class="ui-empty-title">${title}</h3>` : ''}
        ${desc ? `<p class="ui-empty-desc">${desc}</p>` : ''}
      </div>`;
  },

  /**
   * Render a loading skeleton
   */
  skeleton(rows = 5) {
    return `
      <div class="ui-skeleton-wrapper">
        ${Array(rows).fill(`
          <div class="ui-skeleton-row">
            <div class="ui-skeleton w-20"></div>
            <div class="ui-skeleton w-40"></div>
            <div class="ui-skeleton w-30"></div>
            <div class="ui-skeleton w-20"></div>
          </div>
        `).join('')}
      </div>`;
  },

  /**
   * Render an error state with retry
   */
  errorState(message, retryFn = '') {
    return `
      <div class="ui-empty-state">
        <i data-lucide="alert-circle" class="ui-empty-icon ui-text-danger"></i>
        <h3 class="ui-empty-title">Something went wrong</h3>
        <p class="ui-empty-desc">${message || 'An unexpected error occurred.'}</p>
        ${retryFn ? `<button class="ui-btn ui-btn-primary" onclick="${retryFn}"><i data-lucide="refresh-cw"></i> Retry</button>` : ''}
      </div>`;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Render a filter bar with dropdowns and search inputs
   * @param {Array} filters - { id, type:'select'|'search', options, onChange, placeholder }
   */
  filterBar(filters) {
    return `
      <div class="ui-filter-bar">
        ${filters.map(f => {
          if (f.type === 'select') {
            return `<select class="ui-select sm" id="filter-${f.id}" onchange="${f.onChange}">
              ${f.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
            </select>`;
          } else {
            return `<div class="ui-search-wrap">
              <i data-lucide="search" class="ui-search-icon"></i>
              <input class="ui-input sm" id="filter-${f.id}" type="text" placeholder="${f.placeholder || 'Search…'}" oninput="${f.onChange}">
            </div>`;
          }
        }).join('')}
      </div>`;
  },

  /**
   * Render pagination controls
   */
  pagination(page, total, limit, onPageFn) {
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) return '';
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    let btns = '';
    if (start > 1) btns += `<button class="ui-page-btn" onclick="(${onPageFn})(1)">1</button>${start > 2 ? '<span class="ui-page-dots">…</span>' : ''}`;
    for (let i = start; i <= end; i++) {
      btns += `<button class="ui-page-btn ${i === page ? 'active' : ''}" onclick="(${onPageFn})(${i})">${i}</button>`;
    }
    if (end < totalPages) btns += `${end < totalPages - 1 ? '<span class="ui-page-dots">…</span>' : ''}<button class="ui-page-btn" onclick="(${onPageFn})(${totalPages})">${totalPages}</button>`;
    return `<div class="ui-pagination">${btns}</div>`;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Render a Lucide icon placeholder
   */
  icon(name, size = 16) {
    return `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
  },

  /**
   * Format currency (BDT)
   */
  formatCurrency(amount) {
    return `৳ ${parseFloat(amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  },

  /**
   * Format date
   */
  formatDate(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' });
  },

  /**
   * Copy text to clipboard with toast feedback
   */
  copyToClipboard(text) {
    navigator.clipboard.writeText(text)
      .then(() => UI.toast('Copied to clipboard!', 'success', 2000))
      .catch(() => UI.toast('Copy failed', 'error'));
  },

  /**
   * Render a copy button
   */
  copyButton(text, label = 'Copy') {
    const escaped = text.replace(/'/g, "\\'");
    return `<button class="ui-btn ui-btn-ghost sm" onclick="UI.copyToClipboard('${escaped}')"><i data-lucide="copy"></i> ${label}</button>`;
  },

  /** Escape HTML */
  _esc(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

};

// Shortcut helpers
UI.toastSuccess = (msg) => UI.toast(msg, 'success');
UI.toastError = (msg) => UI.toast(msg, 'error');
UI.toastInfo = (msg) => UI.toast(msg, 'info');
UI.toastWarning = (msg) => UI.toast(msg, 'warning');
