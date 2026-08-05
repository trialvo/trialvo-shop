/**
 * Friendly marketplace palette (Fiverr-inspired):
 * soft gray canvas, white cards, readable ink, green action.
 */
export const MARKETPLACE_COLORS = {
  ink: "#222325",
  inkMuted: "#62646A",
  inkSoft: "#74767E",
  border: "#E4E5E7",
  canvas: "#F5F5F5",
  card: "#FFFFFF",
  green: "#1DBF73",
  greenDark: "#19A463",
  greenSoft: "#E8FAF1",
  star: "#FFB33E",
} as const;

export type MarketplaceColorToken = keyof typeof MARKETPLACE_COLORS;
