export function imageFallbackSvgDataUri(title: string): string {
  const safe = title.replace(/</g, "").replace(/>/g, "").slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
    <rect width="100%" height="100%" rx="16" ry="16" fill="#E5E7EB"/>
    <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle"
      font-family="Arial" font-size="28" font-weight="700" fill="#6B7280">${safe}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
