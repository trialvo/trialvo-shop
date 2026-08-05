// ── Layout ─────────────────────────────────────────────
export { default as PageHeader } from "./layout/PageHeader";
export { default as SectionCard } from "./layout/SectionCard";
export { default as FieldGroup } from "./layout/FieldGroup";

// ── Badges ─────────────────────────────────────────────
export { StatusBadge, PriorityBadge, FeaturedBadge } from "./badge/Badges";
// Re-export legacy Badge so existing imports still work
export { default as Badge } from "./badge/Badge";

// ── Feedback ───────────────────────────────────────────
export { Skeleton, SkeletonRows } from "./feedback/Skeleton";
export { default as EmptyState } from "./feedback/EmptyState";

// ── Table ──────────────────────────────────────────────
export { default as DataTable } from "./table/DataTable";

// ── Pagination ─────────────────────────────────────────
// Use the richer page-based Pagination from common (supports i18n, page-size select, mobile)
export { default as Pagination } from "../common/Pagination";
export type { PaginationProps } from "../common/Pagination";

// ── Tabs ───────────────────────────────────────────────
export { default as Tabs } from "./tabs/Tabs";

// ── Dropdown ───────────────────────────────────────────
export { default as ActionMenu } from "./dropdown/ActionMenu";

// ── Images ─────────────────────────────────────────────
export { default as ImageThumb } from "./images/ImageThumb";

// ── Modal ──────────────────────────────────────────────
export { default as Modal } from "./modal/Modal";
export { default as ConfirmModal } from "./modal/ConfirmModal";

// ── Button ─────────────────────────────────────────────
export { default as Button } from "./button/Button";

// ── Alert ──────────────────────────────────────────────
export { default as Alert } from "./alert/Alert";
