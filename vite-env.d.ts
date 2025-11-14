// FIX: The line `/// <reference types="vite/client" />` was removed to resolve a "Cannot find type definition file" error.
// This project uses `process.env` (exposed via Vite's `define` config) rather than `import.meta.env`,
// so the Vite-specific client types are not necessary for this project to compile correctly.
