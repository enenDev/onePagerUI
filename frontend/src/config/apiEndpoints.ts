/** API paths. Change a path here only. */
export const API_ENDPOINTS = {
  userDetails: "api/v1/user-tracking/user-details",
  loginLog: "api/v1/user-tracking/login-log",
  actionLog: "api/v1/user-tracking/action-log",
  metadata: "api/v1/metadata",
  upload: "api/v1/upload",
  campaigns: "api/v1/campaigns",
  updateTrack: "api/v1/update-track",
  pagers: "api/v1/pagers",
  fetchAllPagers: "api/v1/pagers/fetch-all?skip=0&limit=499",
  pagerById: (id: string) => `api/v1/pagers/${id}`,
  pagerStatus: (id: string) => `api/v1/pagers/${id}/status`,
  dashboardFunnel: "api/v1/dashboard/funnel",
  dashboardOnboarding: "api/v1/dashboard/onboarding",
  dashboardEngagement: "api/v1/dashboard/engagement",
  dashboardAdoption: "api/v1/dashboard/adoption",
} as const;
