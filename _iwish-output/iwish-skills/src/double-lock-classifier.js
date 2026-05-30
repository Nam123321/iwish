/**
 * DoubleLockClassifier
 *
 * Classifies story specifications as "mock-heavy" and manages the injection of
 * Double-Lock directives that force LLM agents to read the TDD London Fragment
 * before writing mock-heavy tests.
 *
 * Part of Epic 4: TDD London School Fragment (Story 4.2)
 *
 * @module double-lock-classifier
 */

/**
 * Indicators that suggest a story involves heavy mocking / test doubles.
 * Each entry is { keyword, weight } where weight determines how much
 * this indicator contributes to the mock-heavy score.
 *
 * @type {Array<{keyword: string, weight: number}>}
 */
const MOCK_HEAVY_INDICATORS = [
  { keyword: 'mock', weight: 1.0 },
  { keyword: 'stub', weight: 1.0 },
  { keyword: 'spy', weight: 1.0 },
  { keyword: 'vi.fn', weight: 1.0 },
  { keyword: 'jest.fn', weight: 1.0 },
  { keyword: 'dependency injection', weight: 1.0 },
  { keyword: 'test double', weight: 1.0 },
  { keyword: 'integration test', weight: 1.0 },
];

/** Confidence threshold above which a story is classified as mock-heavy. */
const MOCK_HEAVY_THRESHOLD = 0.3;

/** Sentinel marker used to detect an existing directive (for idempotency). */
const DIRECTIVE_MARKER = '🔒 DOUBLE-LOCK DIRECTIVE';

/**
 * Classifies story specs as mock-heavy, generates and injects Double-Lock
 * directives, and validates agent logs for fragment-read evidence.
 */
class DoubleLockClassifier {
  /**
   * Analyze a story specification text for mock-heavy indicators.
   *
   * The score is computed as the ratio of matched indicator categories to
   * total indicator categories. Each category is counted at most once
   * regardless of how many times the keyword appears.
   *
   * @param {string} storySpec - The full text of a story specification.
   * @returns {{isMockHeavy: boolean, score: number, matchedIndicators: string[]}}
   *   - `isMockHeavy` — true when score >= 0.3
   *   - `score` — confidence value in [0, 1]
   *   - `matchedIndicators` — list of keyword strings that were detected
   */
  isMockHeavy(storySpec) {
    if (!storySpec || typeof storySpec !== 'string') {
      return { isMockHeavy: false, score: 0, matchedIndicators: [] };
    }

    const lowerSpec = storySpec.toLowerCase();
    const matchedIndicators = [];
    let totalWeight = 0;
    let matchedWeight = 0;

    for (const indicator of MOCK_HEAVY_INDICATORS) {
      totalWeight += indicator.weight;
      if (lowerSpec.includes(indicator.keyword.toLowerCase())) {
        matchedIndicators.push(indicator.keyword);
        matchedWeight += indicator.weight;
      }
    }

    // Avoid division by zero (should not happen with hardcoded indicators)
    const score = totalWeight > 0
      ? Math.min(matchedWeight / totalWeight, 1.0)
      : 0;

    return {
      isMockHeavy: score >= MOCK_HEAVY_THRESHOLD,
      score: Math.round(score * 1000) / 1000,  // Round to 3 decimal places
      matchedIndicators,
    };
  }

  /**
   * Generate a Double-Lock markdown directive block.
   *
   * The directive instructs LLM agents to load the TDD London Fragment via
   * `view_file` before proceeding with mock-heavy test code.
   *
   * @param {string} fragmentPath - Path to the TDD London principles fragment.
   * @returns {string} A markdown block containing the Double-Lock directive.
   */
  generateDirective(fragmentPath) {
    if (!fragmentPath || typeof fragmentPath !== 'string') {
      fragmentPath = 'draft-rules/tdd-london-principles.md';
    }

    return [
      `> ## ${DIRECTIVE_MARKER}`,
      '>',
      '> **MANDATORY PRE-CONDITION**: This story has been classified as **mock-heavy**.',
      '> Before writing ANY test code, you MUST execute:',
      '>',
      `> \`\`\``,
      `> view_file("${fragmentPath}")`,
      `> \`\`\``,
      '>',
      '> Skipping this step will produce brittle, implementation-coupled tests.',
      '> The fragment contains London School TDD principles, test-double taxonomy,',
      '> and practical examples that are required reading.',
      '>',
      `> **Fragment**: \`${fragmentPath}\``,
      '',
    ].join('\n');
  }

  /**
   * Inject the Double-Lock directive into story content if the story is
   * classified as mock-heavy.
   *
   * This method is **idempotent**: if the directive marker already exists in
   * the content, the original content is returned unmodified.
   *
   * @param {string} storyContent - The full markdown text of the story.
   * @param {string} fragmentPath - Path to the TDD London principles fragment.
   * @returns {{content: string, injected: boolean, classification: {isMockHeavy: boolean, score: number, matchedIndicators: string[]}}}
   *   - `content` — the story text, possibly with the directive prepended
   *   - `injected` — whether the directive was actually added
   *   - `classification` — the mock-heavy classification result
   */
  injectDirective(storyContent, fragmentPath) {
    if (!storyContent || typeof storyContent !== 'string') {
      return {
        content: storyContent || '',
        injected: false,
        classification: { isMockHeavy: false, score: 0, matchedIndicators: [] },
      };
    }

    const classification = this.isMockHeavy(storyContent);

    // Not mock-heavy → return unchanged
    if (!classification.isMockHeavy) {
      return { content: storyContent, injected: false, classification };
    }

    // Idempotency check: already has the directive
    if (storyContent.includes(DIRECTIVE_MARKER)) {
      return { content: storyContent, injected: false, classification };
    }

    // Prepend the directive
    const directive = this.generateDirective(fragmentPath);
    const injectedContent = directive + '\n' + storyContent;

    return { content: injectedContent, injected: true, classification };
  }

  /**
   * Validate that an agent log contains evidence of loading the TDD fragment.
   *
   * Looks for a `view_file` call with a path containing `tdd-london-principles`
   * in the agent's execution log.
   *
   * @param {string} agentLog - The text log of the agent's execution.
   * @returns {{loaded: boolean, evidence: string|null}}
   *   - `loaded` — true if evidence of fragment loading was found
   *   - `evidence` — the matched line or null
   */
  validateFragmentLoaded(agentLog) {
    if (!agentLog || typeof agentLog !== 'string') {
      return { loaded: false, evidence: null };
    }

    const lines = agentLog.split('\n');

    for (const line of lines) {
      // Match patterns like:
      //   view_file("...tdd-london-principles...")
      //   view_file('...tdd-london-principles...')
      //   view_file  ...tdd-london-principles...
      //   AbsolutePath: .../tdd-london-principles.md
      const lowerLine = line.toLowerCase();
      if (
        lowerLine.includes('view_file') &&
        lowerLine.includes('tdd-london-principles')
      ) {
        return { loaded: true, evidence: line.trim() };
      }
    }

    return { loaded: false, evidence: null };
  }
}

module.exports = {
  DoubleLockClassifier,
  MOCK_HEAVY_INDICATORS,
  MOCK_HEAVY_THRESHOLD,
  DIRECTIVE_MARKER,
};
