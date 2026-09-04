/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_ACCESS_INSTRUCTIONS_URL?: string;
  readonly VITE_REACT_APP_FIREBASE_API_KEY?: string;
  readonly VITE_REACT_APP_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_REACT_APP_FIREBASE_PROJECT_ID?: string;
  readonly VITE_REACT_APP_FIREBASE_APP_ID?: string;
  readonly VITE_REACT_APP_FIREBASE_SAML_PROVIDER_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
