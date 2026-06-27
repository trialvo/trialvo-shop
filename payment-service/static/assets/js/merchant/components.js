// PayVault Merchant Portal — Reusable UI Components
// Wraps shared UI library (ui.js) for backward compatibility
window.MUI = {
    toast(message, type = 'info') {
        UI.toast(message, type, 4000);
    },

    badge(status) {
        return UI.statusBadge(status);
    },

    copyToClipboard(text) {
        UI.copyToClipboard(text);
    },

    formatDate(d) {
        return UI.formatDate(d);
    },

    formatAmount(a) {
        return new Intl.NumberFormat('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(a || 0));
    },

    loading() {
        return UI.skeleton(3);
    },

    emptyState(icon, title, desc) {
        return UI.emptyState(icon, title, desc);
    },

    modal(title, content, footer = '') {
        UI.modal(title, content, footer ? [footer] : []);
        // Return empty string for backward compat (old code injected HTML)
        return '';
    },

    closeModal() {
        UI.closeModal();
    },

    table(headers, rows) {
        if (!rows.length) return UI.emptyState('inbox', 'No data', 'Nothing to show yet.');
        return `<div class="ui-table-wrapper"><table class="ui-table">
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${rows.join('')}</tbody>
        </table></div>`;
    },

    // Lucide icon helper
    icon(name, size = 16, extraClass = '') {
        return UI.icon(name, size);
    },

    // Copy button component
    copyBtn(text, label = 'Copy') {
        return UI.copyButton(text, label);
    },

    // Form input
    input(id, label, opts = {}) {
        return UI.input(id, label, opts);
    },

    select(id, label, options, opts = {}) {
        return UI.select(id, label, options, opts);
    },

    // Page header
    pageHeader(title, subtitle, actions) {
        return UI.pageHeader(title, subtitle, actions);
    },

    // Filter bar
    filterBar(filters) {
        return UI.filterBar(filters);
    },
};
