declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URL: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      /** GetStream server API key (keep server-only). */
      STREAM_API_KEY?: string
      /** GetStream server secret (keep server-only). */
      STREAM_API_SECRET?: string
      /** Optional override for Stream user JWT TTL (seconds). */
      STREAM_TOKEN_VALIDITY_SECONDS?: string
      /** Public Stream API key for browser SDK (Phases 4–5); not a secret per Stream. */
      NEXT_PUBLIC_STREAM_API_KEY?: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
