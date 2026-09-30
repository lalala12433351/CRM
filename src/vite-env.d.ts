/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute API origin for the bundled mobile app (e.g. https://crm.pixbe.in). Empty on the web. */
  readonly VITE_API_BASE_URL?: string;
}
