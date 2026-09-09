export type PageTitle = [title: string, subtitle: string];

export const PAGE_TITLES: Record<string, PageTitle> = {
  overview: ["Good morning, Maya.", "Here’s what’s happening across Apex Fulfillment Center."],
  analytics: ["Operational analytics", "Compare live output with shift-level performance."],
  alerts: ["Alerts & events", "Review and resolve warehouse exceptions."],
  inventory: ["Inventory flow", "Health and movement across active storage zones."],
  settings: ["Workspace settings", "Tune your real-time monitoring preferences."],
  profile: ["Your operator profile", "Session details and access controls."],
};
