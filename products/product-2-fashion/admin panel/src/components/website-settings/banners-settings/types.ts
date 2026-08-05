export type BannerRow = {
  id: number;

  title: string;
  zone: string;
  type: string;

  // ✅ new (from backend)
  path: string | null;

  // Image (for table preview)
  imgPath: string | null;

  featured: boolean;
  status: boolean;

  createdAt: string;
  updatedAt: string;
};

export type Option = { value: string; label: string };

export function safeText(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function nowISO(): string {
  return new Date().toISOString();
}
