import type { AnalyticsConfigResponse } from "@/lib/analytics/types";
import { api } from "../client";

class AnalyticsConfigService {
  async getConfig(): Promise<AnalyticsConfigResponse> {
    try {
      const response =
        await api.get<AnalyticsConfigResponse>("/user/analytics/");
      return response.data;
    } catch {
      // Return a fully disabled config on failure so the app never breaks
      return {
        success: false,
        config: {
          meta: { currency: "BDT", site_name: "", environment: "production" },
          tracking: {
            auto_page_view: false,
            track_search: false,
            track_scroll: false,
            track_button_clicks: false,
          },
          analytics: {
            facebook_pixel: {
              enabled: false,
              pixel_id: "",
              track_events: {
                page_view: false,
                view_content: false,
                add_to_cart: false,
                initiate_checkout: false,
                purchase: false,
                search: false,
                lead: false,
                complete_registration: false,
              },
              conversion_api: {
                enabled: false,
                access_token: "",
                test_event_code: "",
              },
              advanced_matching: {
                enabled: false,
                email: false,
                phone: false,
                first_name: false,
                last_name: false,
                external_id: false,
              },
            },
            google_analytics: {
              enabled: false,
              measurement_id: "",
              config: {
                debug_mode: false,
                anonymize_ip: true,
                send_page_view: false,
              },
            },
            google_tag_manager: {
              enabled: false,
              gtm_id: "",
            },
            microsoft_clarity: {
              enabled: false,
              project_id: "",
            },
          },
        },
      };
    }
  }
}

export const analyticsConfigService = new AnalyticsConfigService();
