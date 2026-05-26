// Cleanup utilities - production builds should disable console output via Vite configuration
// Use tree-shaking and minification to remove unused code in production

/**
 * Enable production-safe logging
 * Console output should be handled by the build configuration
 */
export const setupProductionMode = () => {
  if (import.meta.env.MODE === 'production') {
    globalThis.DEBUG = false;
  }
};
