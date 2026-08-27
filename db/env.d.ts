declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    UPLOADS: R2Bucket;
    STEAM_WEB_API_KEY?: string;
  }
}
