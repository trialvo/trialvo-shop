/**
 * Public base URLs for emails, installer links, and agent CONTROL_PLANE_URL.
 * Default Control Plane listens on PORT (5000) — never invent :8092 from frontend :8000.
 */
function stripSlash(url) {
  return String(url || '').replace(/\/$/, '');
}

function getFrontendUrl() {
  return stripSlash(process.env.FRONTEND_URL || 'http://localhost:8000');
}

function getPublicApiUrl() {
  if (process.env.PUBLIC_API_URL) return stripSlash(process.env.PUBLIC_API_URL);
  if (process.env.CONTROL_PLANE_PUBLIC_URL) return stripSlash(process.env.CONTROL_PLANE_PUBLIC_URL);
  const port = process.env.PORT || '5000';
  return stripSlash(`http://localhost:${port}`);
}

module.exports = {
  getFrontendUrl,
  getPublicApiUrl,
};
