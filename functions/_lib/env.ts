/** Bindings and variables available to Pages Functions (wrangler.toml + secrets). */
export interface Env {
  DB: D1Database;
  RUG_STATUS: KVNamespace;
  UPLOADS: R2Bucket;
  ASSETS: Fetcher;
  // vars
  PUBLIC_SITE_URL: string;
  PUBLIC_BRAND_NAME: string;
  PUBLIC_DEALER_NAME: string;
  PUBLIC_PHONE: string;
  PUBLIC_EMAIL: string;
  LAUNCH_MODE: 'waitlist' | 'live';
  EMAIL_PROVIDER: 'kit' | 'klaviyo' | 'none';
  ADMIN_EMAIL_PROVIDER: 'resend' | 'postmark' | 'mailchannels' | 'none';
  RATE_LIMIT_PER_MINUTE?: string;
  CF_IMAGES_HASH?: string;
  // secrets
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  TURNSTILE_SECRET: string;
  META_PIXEL_ID?: string;
  META_CAPI_TOKEN?: string;
  EMAIL_API_KEY?: string;
  EMAIL_LIST_ID?: string;
  ADMIN_EMAIL: string;
  ADMIN_EMAIL_API_KEY?: string;
  ADMIN_EMAIL_FROM?: string;
  DEPLOY_HOOK_URL?: string;
  ADMIN_ACCESS_AUD?: string;
  ADMIN_ACCESS_TEAM_DOMAIN?: string;
  TRADE_PROMO_CODE?: string;
  REVIEW_TOKEN_SECRET?: string;
  // Jev advisory decisions (docs/JEV.md). Key unset or JEV_DISABLED=true → feature off.
  JEV_API_KEY?: string;
  JEV_MODEL?: string;
  JEV_DISABLED?: string;
}
