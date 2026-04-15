/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PART_ID?: string;
  readonly VITE_APP_ID?: string;
  readonly VITE_SAVE_SLOT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
