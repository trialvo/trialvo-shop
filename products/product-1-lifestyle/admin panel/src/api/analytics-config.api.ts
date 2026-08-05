// src/api/analytics-config.api.ts

import { api } from "./client";

export type AnalyticsConfigResponse = {
  success: boolean;
  data: {
    meta: {
      currency: string;
      site_name: string;
      environment: string;
    };
    tracking: {
      track_scroll: boolean;
      track_search: boolean;
      auto_page_view: boolean;
      track_button_clicks: boolean;
    };
    analytics: {
      facebook_pixel: {
        enabled: boolean;
        pixel_id: string;
        track_events: {
          lead: boolean;
          search: boolean;
          purchase: boolean;
          page_view: boolean;
          add_to_cart: boolean;
          view_content: boolean;
          initiate_checkout: boolean;
          complete_registration: boolean;
        };
        conversion_api: {
          enabled: boolean;
          access_token: string;
          test_event_code: string;
        };
        advanced_matching: {
          email: boolean;
          phone: boolean;
          enabled: boolean;
          last_name: boolean;
          first_name: boolean;
          external_id: boolean;
        };
      };
      google_analytics: {
        config: {
          debug_mode: boolean;
          anonymize_ip: boolean;
          send_page_view: boolean;
        };
        enabled: boolean;
        measurement_id: string;
      };
      google_tag_manager: {
        auth: string;
        gtm_id: string;
        enabled: boolean;
        preview: string;
      };
      microsoft_clarity: {
        enabled: boolean;
        project_id: string;
      };
    };
  };
};

export type AnalyticsConfigPayload = {
  config: {
    analytics: AnalyticsConfigResponse["data"]["analytics"];
    tracking: AnalyticsConfigResponse["data"]["tracking"];
    meta: AnalyticsConfigResponse["data"]["meta"];
  };
};

export async function getAnalyticsConfig() {
  const res = await api.get(`/config/analytics`);
  return res.data as AnalyticsConfigResponse;
}

export async function updateAnalyticsConfig(payload: AnalyticsConfigPayload) {
  const res = await api.put(`/config/analytics`, payload);
  return res.data;
}
