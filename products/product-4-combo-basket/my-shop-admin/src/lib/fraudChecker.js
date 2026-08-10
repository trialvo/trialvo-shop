/**
 * Fraud Checker API — https://fraudchecker.link
 * Checks a BD phone number against courier delivery history to detect potential fraud.
 */

const FRAUD_API_URL = "https://fraudchecker.link/api/v1/qc/";

/**
 * Get the fraud checker API key from localStorage (set in Business Settings).
 */
export function getFraudApiKey() {
  return localStorage.getItem("fraud_checker_api_key") || "";
}

export function setFraudApiKey(key) {
  localStorage.setItem("fraud_checker_api_key", key);
}

export function isFraudCheckerEnabled() {
  return localStorage.getItem("fraud_checker_enabled") === "true";
}

export function setFraudCheckerEnabled(val) {
  localStorage.setItem("fraud_checker_enabled", val ? "true" : "false");
}

/**
 * Check a phone number for fraud risk.
 * Calls the backend proxy (/api/admin/config/fraud-test) to avoid CORS issues.
 * @param {string} phone - BD phone number
 * @returns {Promise<object>} Fraud check result with riskLevel, deliveryRate, etc.
 */
export async function checkFraud(phone) {
  if (!phone) throw new Error("Phone number required");

  const token = localStorage.getItem("admin_token") || "";
  const res = await fetch(`/api/admin/config/fraud-test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ phone }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || `HTTP ${res.status}`);
  }

  const result = data.result || data;

  // Compute derived fields if not already present
  const deliveryRate = result.deliveryRate ??
    (result.total_parcels > 0
      ? ((result.total_delivered / result.total_parcels) * 100).toFixed(1)
      : "0.0");

  let riskLevel = result.riskLevel;
  if (!riskLevel) {
    const pct = parseFloat(deliveryRate);
    if (result.total_parcels === 0) riskLevel = "unknown";
    else if (pct < 40) riskLevel = "high";
    else if (pct < 70) riskLevel = "medium";
    else riskLevel = "safe";
  }

  return { ...result, deliveryRate, riskLevel, checkedAt: result.checkedAt || new Date().toISOString() };
}

/**
 * Risk level metadata
 */
export const RISK_META = {
  safe: { label: "নিরাপদ", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400", icon: "✅" },
  medium: { label: "সতর্ক", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-400", icon: "⚠️" },
  high: { label: "ঝুঁকিপূর্ণ", color: "text-red-600", bg: "bg-red-50 border-red-200", dot: "bg-red-400", icon: "🚨" },
  unknown: { label: "অজানা", color: "text-slate-500", bg: "bg-slate-50 border-slate-200", dot: "bg-slate-400", icon: "❓" },
};
