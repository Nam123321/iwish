# Prompt Engineering Guidelines

When creating or refactoring skills and workflows, adhere to the following principles to reduce Cognitive Load for agents:

1. **Leading Words (Anchors)**: Use specific, ubiquitous vocabulary (e.g., *Deep Module*, *Shallow Module*, *Socratic Debate*) to trigger the correct pre-trained weights in the LLM. Avoid generic terms.
2. **Negation is a Failure Mode**: Tell the agent what to do, not what NOT to do. Affirmative commands are processed much more reliably than negative constraints.
3. **Progressive Disclosure**: Do not overload the system prompt. Use the 3-Layer Architecture where detailed instructions are loaded only when a specific trigger is met.
4. **Cognitive Load vs Context Load**: Distinguish between how hard an instruction is to follow (Cognitive Load) vs how long the text is (Context Load). Reduce cognitive load by providing clear, step-by-step structures (like questionnaires).
