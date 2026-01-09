# AGENT_RULES.md

This file serves as a quick reference for the AI agent (Antigravity) working on the **mybias-web** project.
The primary source of truth for project rules is **CLAUDE.md**.

## Core Directives

1.  **Source of Truth**: Always consult `CLAUDE.md` for detailed guidelines.
2.  **Tech Stack**:
    -   **Framework**: React 19.x (Function components only)
    -   **Language**: TypeScript 5.9.x (Strict mode, no `any`)
    -   **Build**: Vite 7.x
    -   **Styling**: Tailwind CSS (Utility classes, no separate CSS files)
    -   **Package Manager**: Bun
3.  **Code Style**:
    -   Use `function ComponentName() {}` syntax.
    -   Colocate tests and styles if necessary (though Tailwind is preferred).
    -   Strict TypeScript typing.
4.  **Workflow**:
    -   Lint (`bun run lint`) and Build (`bun run build`) before confirming changes.
    -   Follow Git workflow if asked to perform git operations (feature branches).

## Agent Behaviors

-   **Proactive Checks**: Verify lint and build status after significant changes.
-   **Documentation**: Keep specific task documentation in `task.md`.
-   **Communication**: Use Korean for communication as requested/implied by the user's language.

Ref: [CLAUDE.md](./CLAUDE.md)
