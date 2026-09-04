/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY?: string;
  readonly GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// For process.env defined by Vite config
declare const process: {
  env: {
    API_KEY: string;
    GEMINI_API_KEY: string;
  };
};