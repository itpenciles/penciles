// FIX: Manually define `import.meta.env` to address errors where TypeScript
// may not automatically recognize Vite's environment variables. This ensures
// that properties like `VITE_GOOGLE_CLIENT_ID` are correctly typed across the
// application, resolving "Property 'env' does not exist on type 'ImportMeta'" errors.
// The original `/// <reference types="vite/client" />` was removed to resolve
// a "Cannot find type definition file" error, likely due to a project setup issue.
interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// FIX: Add types for `process.env` for both client (via Vite's `define`) and server.
// This provides type safety for all environment variables used in the project.
// Using namespace augmentation avoids the "Cannot redeclare block-scoped variable 'process'" error.
declare namespace NodeJS {
  interface ProcessEnv {
    VITE_GOOGLE_CLIENT_ID: string;
    PORT?: string;
    DATABASE_URL?: string;
    JWT_SECRET?: string;
    API_KEY?: string;
  }
}
