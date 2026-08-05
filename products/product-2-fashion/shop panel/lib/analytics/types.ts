/* ── Analytics Config Types ─────────────────────────────────── */

export type FacebookPixelTrackEvents = {
  page_view: boolean;
  view_content: boolean;
  add_to_cart: boolean;
  initiate_checkout: boolean;
  purchase: boolean;
  search: boolean;
  lead: boolean;
  complete_registration: boolean;
};

export type FacebookAdvancedMatching = {
  enabled: boolean;
  email: boolean;
  phone: boolean;
  first_name: boolean;
  last_name: boolean;
  external_id: boolean;
};

export type FacebookConversionApi = {
  enabled: boolean;
  access_token: string;
  test_event_code: string;
};

export type FacebookPixelConfig = {
  enabled: boolean;
  pixel_id: string;
  track_events: FacebookPixelTrackEvents;
  conversion_api: FacebookConversionApi;
  advanced_matching: FacebookAdvancedMatching;
};

export type GoogleAnalyticsConfig = {
  enabled: boolean;
  measurement_id: string;
  config: {
    debug_mode: boolean;
    anonymize_ip: boolean;
    send_page_view: boolean;
  };
};

export type GoogleTagManagerConfig = {
  enabled: boolean;
  gtm_id: string;
};

export type MicrosoftClarityConfig = {
  enabled: boolean;
  project_id: string;
};

export type TrackingConfig = {
  auto_page_view: boolean;
  track_search: boolean;
  track_scroll: boolean;
  track_button_clicks: boolean;
};

export type AnalyticsMeta = {
  currency: string;
  site_name: string;
  environment: string;
};

export type AnalyticsConfig = {
  meta: AnalyticsMeta;
  tracking: TrackingConfig;
  analytics: {
    facebook_pixel: FacebookPixelConfig;
    google_analytics: GoogleAnalyticsConfig;
    google_tag_manager: GoogleTagManagerConfig;
    microsoft_clarity: MicrosoftClarityConfig;
  };
};

export type AnalyticsConfigResponse = {
  success: boolean;
  config: AnalyticsConfig;
};

/* ── Data Layer Schema ──────────────────────────────────────── */

/**
 * GA4-compliant ecommerce item structure.
 * Used in every ecommerce dataLayer push.
 */
export type DataLayerItem = {
  item_id: string;         // Product SKU ID
  item_name: string;       // Product name
  item_category?: string;  // Category name
  item_brand?: string;
  price?: number;
  quantity?: number;
};

/**
 * Strict schema for all dataLayer.push() calls.
 * GTM reads these properties to fire tags.
 */
export type DataLayerEvent = {
  /** GTM trigger name — e.g. 'purchase', 'add_to_cart', 'view_item' */
  event: string;
  /** UUID shared with server for FB CAPI deduplication */
  event_id?: string;
  ecommerce?: {
    currency: string;
    value: number;
    /** Order ID — required for 'purchase' event */
    transaction_id?: string | number;
    items: DataLayerItem[];
  };
  /** Hashed user data for FB Advanced Matching via GTM */
  user_data?: {
    em?: string;           // SHA-256 hashed email
    ph?: string;           // SHA-256 hashed phone
    external_id?: string;  // SHA-256 hashed user ID
  };
  /** Custom dimensions available to all GTM tags */
  user_logged_in?: boolean;
  page_type?: 'home' | 'product' | 'category' | 'checkout' | 'account' | 'other';
  search_term?: string;    // For search events
};

/* ── Cookie IDs Type ────────────────────────────────────────── */

/**
 * Browser cookie IDs read by useCookieIds hook and passed to the
 * API on order creation for Facebook CAPI deduplication.
 */
export type CookieIds = {
  fbp: string | null;          // _fbp cookie set by FB Pixel
  fbc: string | null;          // _fbc cookie set when user clicks a FB ad
  ga_client_id: string | null; // GA4 client ID from _ga cookie
};

/* ── Event Payloads ─────────────────────────────────────────── */

export type ViewContentPayload = {
  content_ids: string[];
  content_name: string;
  content_type?: string;
  value?: number;
  currency?: string;
  items?: DataLayerItem[];
};

export type AddToCartPayload = {
  content_ids: string[];
  content_name: string;
  content_type?: string;
  value: number;
  currency?: string;
  quantity?: number;
  items?: DataLayerItem[];
};

export type InitiateCheckoutPayload = {
  value: number;
  currency?: string;
  num_items: number;
  content_ids?: string[];
  items?: DataLayerItem[];
};

export type PurchasePayload = {
  value: number;
  currency?: string;
  content_ids?: string[];
  num_items?: number;
  /** Order ID — used as transaction_id in GA4 and order_id in FB Pixel */
  order_id?: string | number;
  items?: DataLayerItem[];
  /** Deduplication event ID — must match what was sent to the API */
  event_id?: string;
};

export type SearchPayload = {
  search_string: string;
};

export type ViewCartPayload = {
  value: number;
  currency?: string;
  content_ids: string[];
  num_items: number;
};

export type RemoveFromCartPayload = {
  content_ids: string[];
  content_name: string;
  value: number;
  currency?: string;
  quantity?: number;
};
