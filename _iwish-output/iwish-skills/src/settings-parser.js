const fs = require('fs');
const path = require('path');

/**
 * Parses and sanitizes the workspace settings file .agent/settings.json.
 * Gracefully handles missing files, malformed JSON, and unexpected layouts.
 * 
 * @param {string} settingsPath - Absolute path to the settings file
 * @returns {Object} Cleaned configuration object
 */
function parseSettings(settingsPath) {
  const defaultSettings = { plugins: {} };

  if (!fs.existsSync(settingsPath)) {
    return defaultSettings;
  }

  let content;
  try {
    content = fs.readFileSync(settingsPath, 'utf8');
  } catch (err) {
    console.warn(`[I-Wish Settings Warning] Failed to read settings file at ${settingsPath}: ${err.message}. Using default settings.`);
    return defaultSettings;
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    console.warn(`[I-Wish Settings Warning] Malformed JSON in settings file at ${settingsPath}: ${err.message}. Falling back to default settings.`);
    return defaultSettings;
  }

  // Validate root shape
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    console.warn(`[I-Wish Settings Warning] Settings root at ${settingsPath} is not a valid JSON object. Using defaults.`);
    return defaultSettings;
  }

  const sanitized = { plugins: {} };
  const pluginsRaw = parsed.plugins;

  if (pluginsRaw && typeof pluginsRaw === 'object' && !Array.isArray(pluginsRaw)) {
    for (const [pluginId, pluginConfig] of Object.entries(pluginsRaw)) {
      if (pluginConfig && typeof pluginConfig === 'object' && !Array.isArray(pluginConfig)) {
        const enabled = pluginConfig.enabled === true;
        const rawSkills = pluginConfig.active_skills;
        const activeSkills = Array.isArray(rawSkills)
          ? rawSkills.filter(s => typeof s === 'string')
          : [];

        sanitized.plugins[pluginId] = {
          enabled,
          active_skills: activeSkills
        };
      }
    }
  }

  return sanitized;
}

module.exports = {
  parseSettings
};
