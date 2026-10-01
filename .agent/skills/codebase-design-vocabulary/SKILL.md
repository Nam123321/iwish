---
name: codebase-design-vocabulary
description: |
  Defines the standard "Leading Words" (Deep Module, Interface, Seam, Adapter) 
  used during software design, architecture reviews, and code refactoring.
---

# 🏗️ Codebase Design Vocabulary SKILL

## Purpose
Establishes a ubiquitous language for code structure and system architecture within the I-Wish ecosystem. When agents communicate about code quality or design patterns, they MUST use these terms to anchor their reasoning.

## Vocabulary (Leading Words)

1. **Deep Module**: A module/class/function that provides a simple interface but encapsulates complex logic. This is the desired state.
2. **Shallow Module**: A module whose interface is almost as complex as its implementation. These should be merged or deleted (The Deletion Test).
3. **Interface**: The explicit boundary and contract of a module.
4. **Seam**: A place where you can alter behavior without editing the code in that place (crucial for testing and mocking).
5. **Adapter**: Code that connects a core application logic to an external dependency.
6. **Leverage vs Locality**: 
   - *Leverage*: Code that is used in many places (e.g., shared utilities).
   - *Locality*: Code that is used in only one place. High locality means code should be placed close to where it's used.

## Enforcement
During `/architecture-review` or `/dev-story`, agents must evaluate code against these definitions. If a module is Shallow, recommend refactoring it into a Deep Module or merging it.
