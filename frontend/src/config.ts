/**
 * App configuration resolved from Vite environment variables.
 * Set these in frontend/.env (copy from .env.example).
 */

export interface AppConfig {
  /** ICP network host — https://ic0.app for mainnet, http://127.0.0.1:4943 for local replica */
  backend_host: string;
  /** Deployed canister ID (from dfx or Caffeine) */
  backend_canister_id: string;
  /** Caffeine storage gateway URL */
  storage_gateway_url: string;
  /** Blob-storage bucket name */
  bucket_name: string;
  /** Caffeine project ID */
  project_id: string;
}

export async function loadConfig(): Promise<AppConfig> {
  const config: AppConfig = {
    backend_host: import.meta.env.VITE_IC_HOST || 'https://ic0.app',
    backend_canister_id: import.meta.env.VITE_CANISTER_ID || '',
    storage_gateway_url:
      import.meta.env.VITE_STORAGE_GATEWAY_URL || 'https://storage.ic0.app',
    bucket_name: import.meta.env.VITE_BUCKET_NAME || 'default',
    project_id: import.meta.env.VITE_PROJECT_ID || '',
  };

  if (!config.backend_canister_id) {
    console.warn(
      '[config] VITE_CANISTER_ID is not set — canister calls will fail. ' +
      'Copy frontend/.env.example to frontend/.env and fill in your canister ID.',
    );
  }

  return config;
}
