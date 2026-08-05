import { api } from "./client";

// ─── Bulk Rules ───────────────────────────────────────────────────────────────

export type BulkRule = {
  id: number;
  name: string;
  product_sku_id: number;
  min_quantity: number;
  /** 0 = flat amount, 1 = percentage */
  discount_type: 0 | 1;
  discount_value: number;
  status: boolean;
  free_delivery: boolean;
  sku?: string; // joined from product_skus
};

export type BulkRulePayload = Omit<BulkRule, "id" | "sku">;

/** Convert frontend shape → backend field names */
function toBackendBulk(body: Partial<BulkRulePayload>) {
  const out: Record<string, unknown> = {};
  if (body.name             !== undefined) out.name           = body.name;
  if (body.product_sku_id   !== undefined) out.product_sku_id = body.product_sku_id;
  if (body.min_quantity     !== undefined) out.min_qty        = body.min_quantity;
  if (body.discount_type    !== undefined) out.discount_type  = body.discount_type;
  if (body.discount_value   !== undefined) out.discount_value = body.discount_value;
  if (body.status           !== undefined) out.status         = body.status;
  if (body.free_delivery    !== undefined) out.free_delivery  = body.free_delivery ? 1 : 0;
  return out;
}

/** Convert backend row → frontend shape */
function fromBackendBulk(row: any): BulkRule {
  return {
    id:             row.id,
    name:           row.name,
    product_sku_id: row.product_sku_id,
    min_quantity:   row.min_qty ?? row.min_quantity ?? 1,
    discount_type:  row.discount_type,
    discount_value: Number(row.discount_value),
    status:         Boolean(row.status),
    free_delivery:  Boolean(row.free_delivery),
    sku:            row.sku,
  };
}

export async function getBulkRules(): Promise<BulkRule[]> {
  const res = await api.get("/admin/discount/bulk-rules");
  return (res.data.data as any[]).map(fromBackendBulk);
}

export async function createBulkRule(body: BulkRulePayload): Promise<{ success: true; id: number }> {
  const res = await api.post("/admin/discount/bulk-rule", toBackendBulk(body));
  return res.data;
}

export async function editBulkRule(id: number, body: Partial<BulkRulePayload>): Promise<{ success: true }> {
  const res = await api.put(`/admin/discount/bulk-rule/${id}`, toBackendBulk(body));
  return res.data;
}

export async function deleteBulkRule(id: number): Promise<{ success: true }> {
  const res = await api.delete(`/admin/discount/bulk-rule/${id}`);
  return res.data;
}

// ─── Combo Rules ──────────────────────────────────────────────────────────────

export type ComboRuleItem = { product_sku_id: number; required_qty: number; product_name?: string };

export type ComboRule = {
  id: number;
  name: string;
  discount_type: 0 | 1;
  discount_value: number;
  status: boolean;
  free_delivery: boolean;
  items: ComboRuleItem[];
};

export type ComboRulePayload = Omit<ComboRule, "id" | "items"> & {
  items: { product_sku_id: number; required_qty: number }[];
};

export async function getComboRules(): Promise<ComboRule[]> {
  const res = await api.get("/admin/discount/combo-rules");
  const raw: any[] = res.data.data ?? [];
  return raw.map(r => ({
    id:             r.id,
    name:           r.name,
    discount_type:  r.tiers?.[0]?.discount_type  ?? 0,
    discount_value: Number(r.tiers?.[0]?.discount_value ?? 0),
    status:         Boolean(r.status),
    free_delivery:  Boolean(r.free_delivery),
    // flatten all tiers' items into a single list
    items: (r.tiers ?? []).flatMap((t: any) =>
      (t.items ?? []).map((i: any) => ({ product_sku_id: i.product_sku_id, required_qty: i.required_qty ?? 1 }))
    ),
  }));
}

/** Convert combo frontend shape → backend field names */
function toBackendCombo(body: Partial<ComboRulePayload>) {
  const out: Record<string, unknown> = { ...body };
  if (body.free_delivery !== undefined) out.free_delivery = body.free_delivery ? 1 : 0;
  return out;
}

export async function createComboRule(body: ComboRulePayload): Promise<{ success: true; id: number }> {
  const res = await api.post("/admin/discount/combo-rule", toBackendCombo(body));
  return res.data;
}

export async function editComboRule(id: number, body: Partial<ComboRulePayload>): Promise<{ success: true }> {
  const res = await api.put(`/admin/discount/combo-rule/${id}`, toBackendCombo(body));
  return res.data;
}

export async function deleteComboRule(id: number): Promise<{ success: true }> {
  const res = await api.delete(`/admin/discount/combo-rule/${id}`);
  return res.data;
}
