// ─── PayVault Payment Page JS ──────────────────────────────────────────────

// Countdown timer
(function initExpiry() {
  const el = document.getElementById('expires-at');
  if (!el) return;
  const expires = new Date(el.dataset.expires);
  function update() {
    const diff = Math.max(0, Math.floor((expires - Date.now()) / 1000));
    if (diff === 0) {
      el.textContent = 'Expired';
      const btn = document.getElementById('pay-btn');
      if (btn) btn.disabled = true;
      return;
    }
    const m = Math.floor(diff / 60), s = diff % 60;
    el.textContent = m > 0 ? `${m}m ${s}s` : `${s}s`;
    setTimeout(update, 1000);
  }
  update();
})();

// Initiate payment
async function initPayment(billToken, baseUrl) {
  const btn = document.getElementById('pay-btn');
  const btnText = document.getElementById('btn-text');
  const spinner = document.getElementById('btn-spinner');

  btn.disabled = true;
  btnText.textContent = 'Initiating payment...';
  spinner.classList.remove('hidden');

  try {
    const res = await fetch(`${baseUrl}/pay/${billToken}/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();

    if (res.ok && data.redirect_url) {
      btnText.textContent = 'Redirecting to EPS...';
      window.location.href = data.redirect_url;
    } else {
      throw new Error(data.error || 'Payment initiation failed');
    }
  } catch (err) {
    btn.disabled = false;
    btnText.textContent = `Pay Now`;
    spinner.classList.add('hidden');
    showError(err.message);
  }
}

function showError(msg) {
  let existing = document.getElementById('pay-error');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.id = 'pay-error';
  div.style.cssText = 'background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:12px 16px;margin-top:12px;color:#fca5a5;font-size:0.875rem;text-align:center;';
  div.textContent = msg;
  document.querySelector('.pay-card').appendChild(div);
  setTimeout(() => div.remove(), 5000);
}
