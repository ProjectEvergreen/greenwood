import type { Plugin } from "@greenwood/cli";

export type GoogleAnalyticsPlugin = () => Array<Plugin>;

declare module "@greenwood/plugin-google-analytics" {
  export const greenwoodPluginGoogleAnalytics: GoogleAnalyticsPlugin;
}
