const fs = require('fs');
const path = require('path');
const { readReferenceSkill } = require('./skill-loader');

/**
 * Searches the reference index for matching skills based on task description keywords.
 * 
 * @param {string} taskDescription 
 * @param {Object} indexContent - The parsed JSON index of reference skills
 * @returns {Array<Object>} Ranked list of matched skill records with scores
 */
function searchIndex(taskDescription, indexContent) {
  if (!taskDescription || !indexContent || !Array.isArray(indexContent.skills)) {
    return [];
  }

  // Tokenize query: lowercase, alphanumeric keywords
  const queryTokens = taskDescription
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(token => token.length > 2); // filter out short noise words

  if (queryTokens.length === 0) {
    return [];
  }

  const results = [];

  for (const skill of indexContent.skills) {
    let score = 0;
    const keywords = skill.keywords || [];
    const skillName = (skill.name || '').toLowerCase();
    
    // Check keyword matching
    for (const token of queryTokens) {
      if (keywords.includes(token)) {
        score += 2; // Exact keyword match gives high weight
      }
      if (skillName.includes(token)) {
        score += 1; // Match in skill name
      }
    }

    if (score > 0) {
      results.push({
        id: skill.id,
        name: skill.name,
        score: score
      });
    }
  }

  // Rank by score descending
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Executes a task within a temporary injected context containing the reference skill.
 * Ensures the memory context is unloaded after execution, even if failures occur.
 * 
 * @param {string} skillId 
 * @param {Object} sessionState - Dynamic agent prompt session state
 * @param {Function} runTask - The task execution logic to run
 * @param {Object} [loaderOptions] - Cache options passed to readReferenceSkill
 * @returns {*} Result of the task run
 */
function withReferenceContext(skillId, sessionState, runTask, loaderOptions = {}) {
  if (!sessionState || !Array.isArray(sessionState.context)) {
    throw new Error("Invalid session state: must possess a context array.");
  }

  const skillContent = readReferenceSkill(skillId, loaderOptions);
  
  // Inject context block
  const contextBlock = {
    type: 'reference_skill',
    id: skillId,
    content: skillContent
  };
  
  sessionState.context.push(contextBlock);
  console.log(`[RAG-Searcher] Injected reference skill '${skillId}' into prompt context.`);

  try {
    // Run task execution
    return runTask();
  } finally {
    // Unload context block
    const index = sessionState.context.findIndex(
      block => block.type === 'reference_skill' && block.id === skillId
    );
    if (index !== -1) {
      sessionState.context.splice(index, 1);
      console.log(`[RAG-Searcher] Unloaded reference skill '${skillId}' from prompt context.`);
    }
  }
}

module.exports = {
  searchIndex,
  withReferenceContext
};
