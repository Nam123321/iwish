const { parseSettings } = require('./settings-parser');
const { initializeCache } = require('./cache-initializer');

/**
 * Synchronizes workspace dependencies declared in .agent/settings.json at startup.
 * Automatically provisions missing reference cache plugins and catches exceptions to prevent boot failures.
 * 
 * @param {string} settingsPath - Path to .agent/settings.json
 * @param {Object} [options]
 * @param {string} [options.cacheDir] - Cache target path override
 * @param {string} [options.repoUrl] - Git repository URL override
 * @returns {Object} Sync status result
 */
function syncWorkspace(settingsPath, options = {}) {
  const settings = parseSettings(settingsPath);
  const awesomeConfig = settings.plugins['antigravity-awesome-skills'];

  // Check if awesome-skills integration is requested and enabled
  if (awesomeConfig && awesomeConfig.enabled) {
    try {
      const initResult = initializeCache({
        cacheDir: options.cacheDir,
        repoUrl: options.repoUrl
      });
      
      return {
        synced: true,
        alreadyCached: initResult.alreadyExists,
        path: initResult.path,
        error: null
      };
    } catch (err) {
      // Isolate boot errors: log warning and proceed
      console.warn(`[I-Wish Startup Warning] Failed to synchronize workspace dependencies: ${err.message}. Running in offline fallback mode.`);
      return {
        synced: false,
        alreadyCached: false,
        path: null,
        error: err.message
      };
    }
  }

  // Default: no dependencies synced
  return {
    synced: false,
    alreadyCached: false,
    path: null,
    error: null
  };
}

module.exports = {
  syncWorkspace
};
