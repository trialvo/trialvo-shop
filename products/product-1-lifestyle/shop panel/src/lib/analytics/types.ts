/**
 * lib/analytics/types.ts — Analytics configuration types
 *
 * Defines the API response shape for the analytics configuration endpoint.
 */

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

export type FacebookConversionApi = {
  enabled: boolean;
  access_token: string;
  test_event_code: string;
};

export type FacebookAdvancedMatching = {
  enabled: boolean;
  email: boolean;
  phone: boolean;
  first_name: boolean;
  last_name: boolean;
  external_id: boolean;
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

export type AnalyticsMetaConfig = {
  currency: string;
  site_name: string;
  environment: string;
};

export type TrackingConfig = {
  auto_page_view: boolean;
  track_search: boolean;
  track_scroll: boolean;
  track_button_clicks: boolean;
};

export type AnalyticsConfig = {
  meta: AnalyticsMetaConfig;
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
