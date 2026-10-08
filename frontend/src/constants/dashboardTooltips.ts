/**
 * Copy for the adoption dashboard "i" tooltips.
 * Press Enter inside the backticks to start a new line in the tooltip.
 */
export const DASHBOARD_TOOLTIPS = {
  funnel: {
    onboarding: `
      Distinct logged-in users divided by provisioned users.
    `,
    engagement: `
      Distinct users who created a draft, divided by provisioned users.
    `,
    adoption: `
      Distinct users who published a one-pager, divided by provisioned users.
    `,
  },
  onboarding: {
    chart: `
      Onboarding rate by market for CSP and CBD.
    `,
    onboardedUsers: `
      Distinct users who logged in during the selected period.
    `,
    onboardedUsersGrowthRate: `
      Change versus the previous period: (current − previous) / previous.
    `,
    totalOnePagerViews: `
      One-pager views during the selected period.
    `,
  },
  engagement: {
    chart: `
      Engagement rate by market for CSP and CBD.
    `,
    engagedUsers: `
      Distinct users who created at least one draft.
    `,
    trackToPublish: `
      Published one-pagers that were tracked, divided by published one-pagers.
    `,
    totalExports: `
      One-pager exports during the selected period.
    `,
  },
  adoption: {
    chart: `
      Adoption rate by market for CSP and CBD.
    `,
    adoptedUsers: `
      Distinct users who published at least one one-pager.
    `,
    adoptedUsersGrowthRate: `
      Change versus the previous period: (current − previous) / previous.
    `,
    draftToPublish: `
      Published one-pagers divided by active drafts plus published one-pagers.
    `,
    totalOnePagersPublished: `
      One-pagers published during the selected period.
    `,
  },
} as const;
