import type { ResourcePlugin } from "@greenwood/cli";

export type GoogleAnalyticsPluginOptions = {
  analyticsId: string;
  anonymous?: boolean;
};

export type GoogleAnalyticsPlugin = (options: GoogleAnalyticsPluginOptions) => [ResourcePlugin];

declare module "@greenwood/plugin-google-analytics" {
  export const greenwoodPluginGoogleAnalytics: GoogleAnalyticsPlugin;
}
