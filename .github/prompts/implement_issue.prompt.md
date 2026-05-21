---
agent: "agent"
description: "Implement an issue."
---

Implement GitHub Issue #${input:issueNumber:Issue number}.

---

**Step 1 — Read & Plan** _(stop here until I respond)_

1. Fetch the issue body, comments, and any linked PRs via the GitHub MCP server.
2. Read the affected source files to understand existing conventions (naming, structure, error handling, test style).
3. Identify all changes required: source, tests, docs.
4. Present a numbered implementation plan.
5. Flag any ambiguity or architectural decision the ticket doesn't resolve — ask before assuming.
6. Ask: **A) Autonomous** (implement fully, report when done) or **B) Step-by-step** (pause after each step for confirmation)?

---

**Step 2 — Implement**

Execute the approved plan:

- **Code**: Match existing conventions. Flag deviations before introducing them.
- **Tests**: Cover happy path, edge cases, and failure paths using the existing test framework.
- **Docs**: Update README if behavior changes; add inline comments for non-obvious logic; update `/docs` if affected.

If you encounter scope not covered in the plan, stop and report before continuing.

---

**Step 3 — Done Criteria**

Confirm before closing:

- [ ] Lint passes, no new warnings
- [ ] All tests pass, no unjustified skips
- [ ] New tests cover happy path, edge cases, failure paths
- [ ] No debug code, commented-out blocks, or unresolved TODOs
- [ ] Docs reflect post-change behavior

Provide a brief summary: what changed, what was tested, any follow-up items worth filing.
