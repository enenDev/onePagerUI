/**
 * Copy for the adoption dashboard "i" tooltips.
 * Press Enter inside the backticks to start a new line in the tooltip.
 */
export const DASHBOARD_TOOLTIPS = {
  funnel: {
    onboarding: `
      Percentage of provisioned CSP and CBD users who logged into the application at least once during the selected period.
      
      Formula:
      ((Number of CSP + CBD Users Who Logged In) ÷ (Total Provisioned CSP + CBD Users)) × 100
    `,
    engagement: `
      Percentage of provisioned CSP and CBD users who created at least one draft during the selected period.

      Formula:
      ((Number of CSP + CBD Users Who Created a Draft) ÷ (Total Provisioned CSP + CBD Users)) × 100
    `,
    adoption: `
      Percentage of provisioned CSP and CBD users who published at least one One-Pager during the selected period.

      Formula:
      ((Number of CSP + CBD Users Who Published a One-Pager) ÷ (Total Provisioned CSP + CBD Users)) × 100
    `,
  },
  onboarding: {
    chart: `
      Onboarding rate by market for CSP and CBD Users.
    `,
    onboardedUsers: `
      Total distinct CSP, CBD and General users who logged into the application at least once during the selected period.

      Formula:
      Count(Distinct CSP + CBD + General Users Who Logged In) 
    `,
    onboardedUsersGrowthRate: `
      Percentage change in onboarded CSP and CBD users compared to the previous period.

      Formula:
      ((Current Period Onboarded CSP + CBD Users − Previous Period Onboarded CSP + CBD Users) ÷ Previous Period Onboarded CSP + CBD Users) × 100
    `,
    totalOnePagerViews: `
      Total number of One-Pager views across all user types, including CSP, CBD, and General Users.

      Formula: 
      Count(All One-Pager Views)
    `,
  },
  engagement: {
    chart: `
      Engagement rate by market for CSP and CBD Users.
    `,
    engagedUsers: `
      Total distinct CSP and CBD users who created at least one draft during the selected period.

      Formula: 
      Count(Distinct CSP + CBD Users Who Created a Draft)
    `,
    trackToPublish: `
      Percentage of published One-Pagers that were subsequently tracked.

      Formula:
      ((Number of Tracked One-Pagers) ÷ (Number of Published One-Pagers)) × 100
    `,
    totalExports: `
      Total number of One-Pager export actions performed across all user types, including CSP, CBD, and General Users.

      Formula:
      Count(All One-Pager Export Actions)
    `,
  },
  adoption: {
    chart: `
      Adoption rate by market for CSP and CBD Users.
    `,
    adoptedUsers: `
      Total distinct CSP and CBD users who published at least one One-Pager during the selected period.

      Formula:
      Count(Distinct CSP + CBD Users Who Published a One-Pager)
    `,
    adoptedUsersGrowthRate: `
      Percentage change in CSP and CBD users who published One-Pagers compared to the previous period.

      Formula: 
      ((Current Period CSP + CBD Publishing Users − Previous Period CSP + CBD Publishing Users) ÷ Previous Period CSP + CBD Publishing Users) × 100
    `,
    draftToPublish: `
      Comparison of the total drafted One-Pagers against the total published One-Pagers created by CSP and CBD users.

      Formula:
      ((Total Drafted One-Pagers Created by CSP + CBD Users) ÷ (Total Published One-Pagers Created by CSP + CBD Users)) × 100
    `,
    totalOnePagersPublished: `
      Total number of One-Pagers published by CSP and CBD users during the selected period.

      Formula:
      Count(Published One-Pagers Created by CSP + CBD Users)
    `,
  },
} as const;
