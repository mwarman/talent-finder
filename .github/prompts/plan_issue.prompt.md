---
agent: 'agent'
description: 'Plan an issue.'
---

Create an implementation plan for GitHub Issue #${input:issueNumber:Issue number}.

---

**Step 1 — Read & Plan** _(stop here until I respond)_

1. Fetch the issue body, comments, and any linked PRs via the GitHub MCP server.
2. Read the affected source files to understand existing conventions (naming, structure, error handling, test style).
3. Identify all changes required: source, tests, docs.
4. Create a phased implementation plan with clear milestones and deliverables for each phase. Each phase logically builds on the previous one, starting with the most critical or foundational changes.
5. Flag any ambiguity or architectural decision the ticket doesn't resolve — ask before assuming.
6. Present an outline of the plan in the chat for review before creating the full document in the workspace.

---

**Step 2 — Create Plan Artifact**

Create a plan artifact in the workspace with the implementation plan. The file is named `IMPLEMENTATION_PLAN_ISSUE_${input:issueNumber}.md` and located in the workspace root. Use markdown formatting and include checkboxes for each step.

Plan format:

```markdown
## Implementation Plan [Issue #${input:issueNumber}]

### Phase 1: [Description of phase, e.g. "Implement Feature X"]

**_Affected Packages or Source Files:_**
[List the specific files, modules, or packages that will be changed.]

**Tasks:**

- [ ] Describe the specific code changes needed, referencing files and functions.
- [ ] Describe the tests to be added or modified, referencing test files and cases.
- [ ] Describe any documentation updates needed, referencing specific files or sections.

### Phase 2: [Description of next phase, e.g. "Refactor Module Y"]

[Repeat the same structure for each phase of the implementation plan.]

### Notes

- List any assumptions, open questions, or architectural decisions that need to be made.
- Flag any potential risks or areas that may require extra attention during implementation.
```

---

**Behavior Notes**

- The plan should be detailed enough for a developer unfamiliar with the codebase to follow.
- If the issue is large or complex, break the plan into multiple phases with clear milestones.
- Always ask for clarification if any part of the issue is ambiguous or if there are multiple ways to implement the solution. Do not make assumptions without confirming.
- Use clear and concise language, avoiding jargon or abbreviations that may not be universally understood.
- Ensure that the plan is actionable, with specific tasks that can be checked off as they are completed.
- The plan should cover all aspects of the implementation, including code changes, testing, and documentation updates.
