import { useState, useEffect } from "react";
import {
  MessageSquare,
  Mail,
  CheckCircle2,
  Info,
  Zap,
  Phone,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import api from "../lib/api";

const TABS = [
  { id: "sms", label: "SMS সার্ভিস", icon: Phone },
  { id: "email", label: "ইমেইল সার্ভিস", icon: Mail },
  { id: "fraud", label: "ফ্রড চেকার", icon: Shield },
];

const SMS_PROVIDERS = [
  {
    id: "green_web",
    name: "Green Web",
    desc: "বাংলাদেশের জনপ্রিয় SMS গেটওয়ে",
    fields: [
      { key: "username", label: "Username", placeholder: "Green Web Username" },
      {
        key: "password",
        label: "Password",
        placeholder: "Password",
        type: "password",
      },
      { key: "sid", label: "Sender ID", placeholder: "e.g. ComboBasket" },
    ],
  },
  {
    id: "smsn",
    name: "SMSN",
    desc: "SMSN.com.bd গেটওয়ে",
    fields: [
      {
        key: "api_key",
        label: "API Key",
        placeholder: "SMSN API Key",
        type: "password",
      },
      { key: "sender_id", label: "Sender ID", placeholder: "Sender ID" },
    ],
  },
  {
    id: "ssl_wireless",
    name: "SSL Wireless",
    desc: "SSL Wireless SMS API",
    fields: [
      {
        key: "token",
        label: "API Token",
        placeholder: "Token",
        type: "password",
      },
      { key: "sid", label: "SID", placeholder: "Sender ID" },
    ],
  },
];

const EMAIL_PROVIDERS = [
  {
    id: "smtp",
    name: "Custom SMTP",
    desc: "নিজের SMTP সার্ভার",
    fields: [
      { key: "host", label: "SMTP Host", placeholder: "smtp.gmail.com" },
      { key: "port", label: "Port", placeholder: "587" },
      { key: "username", label: "Username", placeholder: "your@email.com" },
      {
        key: "password",
        label: "Password",
        placeholder: "App Password",
        type: "password",
      },
      { key: "from_name", label: "From Name", placeholder: "ComboBasket" },
      {
        key: "from_email",
        label: "From Email",
        placeholder: "noreply@combobasket.com",
      },
    ],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    desc: "SendGrid Email API",
    fields: [
      {
        key: "api_key",
        label: "API Key",
        placeholder: "SG.xxx",
        type: "password",
      },
      {
        key: "from_email",
        label: "From Email",
        placeholder: "noreply@combobasket.com",
      },
      { key: "from_name", label: "From Name", placeholder: "ComboBasket" },
    ],
  },
];

function ProviderSection({
  providers,
  activeId,
  onSelect,
  form,
  onFormChange,
  onSave,
  saved,
}) {
  const provider = providers.find((p) => p.id === activeId);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
              activeId === p.id
                ? "border-[#e91e63]/40 bg-pink-50 text-[#e91e63] shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
      {provider && (
        <div className="card space-y-4">
          <div>
            <p className="font-semibold text-[#0f172a]">
              {provider.name} কনফিগারেশন
            </p>
            <p className="text-xs text-slate-400">{provider.desc}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            <Info className="h-3.5 w-3.5 shrink-0" />
            API credentials নিরাপদে এনক্রিপ্ট হয়ে সংরক্ষিত হয়
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {provider.fields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  {f.label}
                </label>
                <input
                  type={f.type || "text"}
                  placeholder={f.placeholder}
                  className="input"
                  value={form[`${provider.id}_${f.key}`] || ""}
                  onChange={(e) =>
                    onFormChange(`${provider.id}_${f.key}`, e.target.value)
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button className="btn-outline text-xs py-2">
              <Zap className="h-3.5 w-3.5" /> টেস্ট করুন
            </button>
            <button
              onClick={() => onSave(provider.id)}
              className={`btn-primary ${saved[provider.id] ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
            >
              {saved[provider.id] ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> সংরক্ষিত!
                </>
              ) : (
                "সংরক্ষণ করুন"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Fraud Checker Tab (DB-backed) ──────────────────────────────────────────
function FraudCheckerConfig() {
  const [fraudEnabled, setFraudEnabled] = useState(false);
  const [fraudKey, setFraudKey] = useState("");
  const [keyIsSet, setKeyIsSet] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fraudSaved, setFraudSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [testPhone, setTestPhone] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState(null);

  // Load from API on mount
  useEffect(() => {
    api
      .get("/config")
      .then(({ data }) => {
        const cfg = data.config;
        setFraudEnabled(!!cfg.fraud_checker_enabled);
        setKeyIsSet(!!cfg.fraud_checker_api_key_set);
        if (cfg.fraud_checker_api_key_masked) {
          setFraudKey(cfg.fraud_checker_api_key_masked);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.put("/config", {
        fraud: {
          enabled: fraudEnabled,
          apiKey: fraudKey,
        },
      });
      setFraudSaved(true);
      setKeyIsSet(!!fraudKey.replace(/•/g, "").trim());
      setTimeout(() => setFraudSaved(false), 2500);
    } catch (e) {
      setSaveError(e.response?.data?.message || "সংরক্ষণ ব্যর্থ হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const testFraud = async () => {
    if (!testPhone) return;
    const rawKey = fraudKey.includes("•") ? null : fraudKey;
    if (!rawKey && !keyIsSet) {
      setTestError("API key নেই");
      return;
    }
    setTestLoading(true);
    setTestError(null);
    setTestResult(null);
    try {
      if (rawKey) {
        const { checkFraud } = await import("../lib/fraudChecker");
        const r = await checkFraud(testPhone, rawKey);
        setTestResult(r);
      } else {
        const { data } = await api.post("/config/fraud-test", {
          phone: testPhone,
        });
        setTestResult(data.result);
      }
    } catch (e) {
      setTestError(e.message || "টেস্ট ব্যর্থ হয়েছে");
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return <div className="card h-32 animate-pulse bg-slate-50" />;
  }

  return (
    <div className="space-y-5">
      <div
        className={`card !p-0 overflow-hidden ${fraudEnabled ? "ring-2 ring-[#e91e63]/30" : ""}`}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 shrink-0">
            <Shield className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#0f172a]">অটো ফ্রড চেকার</p>
            <p className="text-xs text-slate-400 mt-0.5">
              নতুন অর্ডারে backend-এ স্বয়ংক্রিয়ভাবে ফোন নম্বর যাচাই — API key
              ও config DB-তে সংরক্ষিত
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`text-xs font-semibold ${fraudEnabled ? "text-emerald-600" : "text-slate-400"}`}
            >
              {fraudEnabled ? "সক্রিয়" : "নিষ্ক্রিয়"}
            </span>
            <button
              onClick={() => setFraudEnabled((e) => !e)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${fraudEnabled ? "bg-[#e91e63]" : "bg-slate-200"}`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform ${fraudEnabled ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/40 px-6 py-5 space-y-5">
          {/* API Key */}
          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>
                API Key{" "}
                <a
                  href="https://fraudchecker.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#e91e63] hover:underline font-normal ml-1"
                >
                  fraudchecker.link ↗
                </a>
              </span>
              {keyIsSet && (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-normal">
                  <CheckCircle2 className="h-3 w-3" /> DB-তে সেট আছে
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                className="input pr-24 font-mono text-xs"
                placeholder={
                  keyIsSet
                    ? "নতুন key দিতে চাইলে এখানে টাইপ করুন"
                    : "f86a9906c6f42644b1f6d882beb58ac0"
                }
                value={fraudKey}
                onChange={(e) => setFraudKey(e.target.value)}
              />
              <button
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                {showKey ? (
                  <>
                    <EyeOff className="h-3 w-3" /> লুকান
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" /> দেখুন
                  </>
                )}
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-xs text-blue-700 space-y-1.5">
            <p className="font-bold text-blue-800 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" /> কিভাবে কাজ করে?
            </p>
            <ul className="space-y-1 list-disc list-inside text-blue-700/80">
              <li>
                নতুন অর্ডার পাওয়ার পরে backend স্বয়ংক্রিয়ভাবে API-তে পাঠায়
              </li>
              <li>Pathao, Steadfast, Redx সহ সব courier-এর রেকর্ড চেক হয়</li>
              <li>
                Order detail page-এ fraud status badge ও full report দেখা যায়
              </li>
              <li>API key ও enabled flag সম্পূর্ণ database-এ — .env-তে নেই</li>
            </ul>
          </div>

          {/* Risk legend */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">
              রিস্ক স্তর নির্ধারণ
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "✅ নিরাপদ",
                  range: "ডেলিভারি ≥ 70%",
                  bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
                },
                {
                  label: "⚠️ সতর্ক",
                  range: "ডেলিভারি 40–69%",
                  bg: "bg-amber-50 text-amber-700 border-amber-200",
                },
                {
                  label: "🚨 ঝুঁকিপূর্ণ",
                  range: "ডেলিভারি < 40%",
                  bg: "bg-red-50 text-red-700 border-red-200",
                },
              ].map((r) => (
                <div
                  key={r.label}
                  className={`rounded-xl border px-3 py-2.5 text-xs ${r.bg}`}
                >
                  <p className="font-bold">{r.label}</p>
                  <p className="opacity-70 mt-0.5">{r.range}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Test section */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              🧪 লাইভ API টেস্ট
            </p>
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm"
                placeholder="01XXXXXXXXX"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && testFraud()}
              />
              <button
                onClick={testFraud}
                disabled={testLoading || (!fraudKey && !keyIsSet) || !testPhone}
                className="btn-outline shrink-0 text-xs px-5 disabled:opacity-40"
              >
                {testLoading ? "চেক হচ্ছে..." : "টেস্ট করুন"}
              </button>
            </div>
            {testError && (
              <div className="mt-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {testError}
              </div>
            )}
            {testResult && (
              <div className="mt-2 rounded-xl bg-slate-900 p-4 text-xs font-mono space-y-1">
                <p className="text-emerald-400 font-bold">
                  ✅ সফলভাবে চেক হয়েছে
                </p>
                <div className="text-slate-300 space-y-0.5 mt-2">
                  <p>
                    📱 Phone:{" "}
                    <span className="text-white">
                      {testResult.mobile_number}
                    </span>
                  </p>
                  <p>
                    📦 মোট পার্সেল:{" "}
                    <span className="text-white">
                      {testResult.total_parcels}
                    </span>
                  </p>
                  <p>
                    ✅ ডেলিভারি:{" "}
                    <span className="text-emerald-400">
                      {testResult.total_delivered}
                    </span>
                  </p>
                  <p>
                    ❌ বাতিল:{" "}
                    <span className="text-red-400">
                      {testResult.total_cancel}
                    </span>
                  </p>
                  <p>
                    📊 ডেলিভারি রেট:{" "}
                    <span
                      className={
                        testResult.deliveryRate >= 70
                          ? "text-emerald-400 font-bold"
                          : testResult.deliveryRate >= 40
                            ? "text-amber-400 font-bold"
                            : "text-red-400 font-bold"
                      }
                    >
                      {testResult.deliveryRate}%
                    </span>
                  </p>
                  <p>
                    🔍 রিস্ক:{" "}
                    <span
                      className={
                        testResult.riskLevel === "safe"
                          ? "text-emerald-400 font-bold"
                          : testResult.riskLevel === "high"
                            ? "text-red-400 font-bold"
                            : "text-amber-400 font-bold"
                      }
                    >
                      {(testResult.riskLevel || "").toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          {saveError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {saveError}
            </p>
          )}
          <div className="flex justify-end pt-1">
            <button
              onClick={save}
              disabled={saving}
              className={`btn-primary disabled:opacity-60 ${fraudSaved ? "!bg-emerald-500 hover:!bg-emerald-600" : ""} px-6`}
            >
              {fraudSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> সংরক্ষিত!
                </>
              ) : saving ? (
                "সংরক্ষণ হচ্ছে..."
              ) : (
                "সেটিং সংরক্ষণ করুন"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Services() {
  const [tab, setTab] = useState("sms");
  const [smsProvider, setSmsProvider] = useState("green_web");
  const [emailProvider, setEmailProvider] = useState("smtp");
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState({});

  const handleFormChange = (key, value) =>
    setForm((p) => ({ ...p, [key]: value }));
  const handleSave = (id) => {
    setSaved((p) => ({ ...p, [id]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [id]: false })), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0f172a]">সার্ভিস কনফিগারেশন</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          SMS, ইমেইল এবং ফ্রড চেকার সার্ভিস কনফিগার করুন
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-white text-[#0f172a] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sms" && (
        <ProviderSection
          providers={SMS_PROVIDERS}
          activeId={smsProvider}
          onSelect={setSmsProvider}
          form={form}
          onFormChange={handleFormChange}
          onSave={handleSave}
          saved={saved}
        />
      )}
      {tab === "email" && (
        <ProviderSection
          providers={EMAIL_PROVIDERS}
          activeId={emailProvider}
          onSelect={setEmailProvider}
          form={form}
          onFormChange={handleFormChange}
          onSave={handleSave}
          saved={saved}
        />
      )}
      {tab === "fraud" && <FraudCheckerConfig />}
    </div>
  );
}
