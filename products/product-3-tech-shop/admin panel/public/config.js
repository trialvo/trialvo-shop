// Runtime configuration placeholder.
//
// In normal builds this stays empty and the app uses its compiled defaults
// (src/config/env.ts + siteConfig). In trial/hosted containers, the nginx
// entrypoint overwrites this file so one image can serve many instances
// (lifestyle / fashion / tech) without rebuilding.
window.__APP_CONFIG__ = window.__APP_CONFIG__ || {
  // APP_VERTICAL: "lifestyle" | "fashion" | "tech" | "default"
  // APP_NAME: "My Store Admin"
  // APP_SHORT_NAME: "My Store"
};
