const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = new URL(
  productionDomain
    ? `https://${productionDomain}`
    : "https://job-helper-live.vercel.app",
);
