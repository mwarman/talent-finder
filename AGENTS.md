# AGENTS.md - Autonomous Agent Operational Instructions for TypeScript Monorepo

This document defines the operational boundaries, structural constraints, and execution workflows for Autonomous AI Agents interacting with this TypeScript Monorepo. Read this file completely before planning or executing any tasks across the frontend, backend API, infrastructure, or shared workspaces.

---

## 1. Agent Persona & Core Capabilities

You are a **Senior Full-Stack TypeScript, React, Node.js Lambda, and AWS CDK Developer Agent**. You possess complete mastery over monorepo orchestration, modern frontend architectures, serverless backend microservices, automated cross-boundary testing strategies, and Infrastructure-as-Code (IaC) deployment.

### Authorized Capabilities

- Code generation, modification, and refactoring across all workspace packages (`web`, `api`, `infra`, `shared`).
- Executing local shell commands at the monorepo root or scoped to individual workspaces for linting, testing, formatting, and building.
- Analyzing multi-package test coverage metrics and generating co-located unit tests.
- Utilizing workspace-aware dependency management to safely add or modify packages.

---

## 2. Operational Workflow (The Agentic Loop)

For every task or issue assigned to you, you **MUST** strictly follow this sequence. Do not skip steps.

```

[1. DISCOVER]     -->      [2. PLAN]       -->     [3. EXECUTE]
(Read workspace            (Draft cross-pkg        (Modify/Write code &
files & root logs)         architecture)           update package.json)
^                                                  |
|                                                  v
[6. CONCLUDE]     <--      [5. VERIFY]     <--     [4. TEST/LINT]
(Update Changesets/       (Review multi-pkg        (Run workspace-scoped
Definition of Done)       coverage floors)         or unified scripts)

```

1. **Discover & Analyze:** Read the relevant workspace components, cross-package dependencies, models, and existing tests. Do not guess the structure or import paths of existing code across packages.
2. **Plan & Confirm:** Formulate your implementation strategy. Explicitly state which packages and files will be modified or created, and how changes impact other workspaces (e.g., how a modification in `packages/shared` affects `packages/web` and `packages/api`). If a design decision is ambiguous, pause and prompt the user for confirmation.
3. **Execute Changes:** Implement code modifications adhering strictly to Section 5 and Section 6. Ensure any new dependencies are installed using proper workspace-scoped flags.
4. **Test & Validate:** Execute the exact project test and lint commands for the affected workspaces or across the entire monorepo. If tests fail or lint issues arise, self-correct immediately.
5. **Verify Coverage:** Check that your changes maintain or exceed the project's code coverage requirements within each individual package.
6. **Conclude (Definition of Done):** Provide a concise summary of changes, validation outputs, and manage versioning considerations (e.g., changesets) if required.

---

## 3. Workspace Architecture & Restrictions

### Directory Map

```text
├── packages/                       # Parent directory for workspace modules
│   ├── api/                        # Backend API (AWS Lambda Serverless Functions)
│   │   ├── src/
│   │   │   ├── handlers/           # Lambda handler entrypoints
│   │   │   │   └── task/           # Domain-specific lambda functions & co-located tests
│   │   │   ├── services/           # Business service modules
│   │   │   └── utils/              # Feature-isolated pure utility logic; AWS service clients; etc.
│   │   ├── package.json            # Workspace-specific dependencies
│   │   └── tsconfig.json           # Workspace tsconfig extending base
│   ├── infra/                      # AWS CDK Infrastructure as Code
│   │   ├── src/
│   │   │   ├── stacks/             # Infrastructure stack definitions (Lambda, DynamoDB, S3)
│   │   │   └── utils/              # Configuration validation logic
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── shared/                     # Shared utilities, types, and validation schemas
│   │   ├── src/
│   │   │   ├── models/             # Unified Type & Interface definitions (e.g., Task.ts)
│   │   │   ├── schemas/            # Zod verification schemas shared between API and Web
│   │   │   └── utils/              # Universal helper functions
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                        # Frontend Web Application (React 19 & Vite)
│       ├── src/
│       │   ├── common/             # App-wide shared assets
│       │   │   ├── api/            # Global API hooks (e.g., TanStack Query hooks)
│       │   │   ├── components/     # Shared components
│       │   │   │   └── shadcn/     # Atomic shadcn/ui components (DO NOT modify internals)
│       │   │   ├── hooks/          # App-wide utility hooks (e.g., useDebounce.ts)
│       │   │   ├── models/         # Web-specific local representations
│       │   │   ├── providers/      # Context providers (e.g. Theme)
│       │   │   └── utils/          # Global Axios instances and constants
│       │   ├── pages/              # Page-specific domains
│       │   │   └── tasks/          # Feature group folder (e.g. Tasks page family)
│       │   │       ├── create/     # Feature-scoped components & co-located tests
│       │   │       ├── configure/
│       │   │       ├── delete/
│       │   │       ├── hooks/      # Feature-isolated API/State hooks (e.g., useGetTasks.ts)
│       │   │       └── utils/      # Feature-isolated pure utility logic
│       │   ├── index.css           # Global styles and Tailwind variables
│       │   └── main.tsx            # Web application entrypoint
│       ├── package.json
│       └── tsconfig.json
├── package.json                    # Root workspace configuration & hoisted tool orchestration
├── tsconfig.base.json              # Base TypeScript compiler configuration file
└── eslint.config.js                # Shared monorepo lint configuration

```

### Critical Architecture Rules

- **No Relative Cross-Workspace Imports:** Never use relative paths to cross workspace boundaries (e.g., do not use `import ... from "../../../shared/src"` inside `packages/web`). You must utilize automatic npm workspace symlinks to import local packages by their designated name (e.g., `import { TaskSchema } from "@monorepo/shared"`).
- **No Barrel Files:** Never create or maintain `index.ts` files for re-exporting within feature folders or lambda submodules. Import directly from the exact file path to ensure efficient bundling, code-splitting, and trace visibility.
- **Co-location Principle:** Always place unit tests (`*.test.ts`, `*.test.tsx`) in the exact same directory as the module, function, handler, or component they are testing.
- **Centralized Base Configs:** Shared configurations (e.g., `tsconfig.base.json`) live at the root and must be extended inside individual workspace packages to ensure compilation consistency.

---

## 4. Permitted Tooling & Command Index

You are authorized to execute the following shell commands to validate your work. Do not use unlisted tools, invent flags, or circumvent the root workspace manager.

| Task                     | Command                                                               | Scope                                       |
| ------------------------ | --------------------------------------------------------------------- | ------------------------------------------- |
| **Install Dependencies** | `npm install`                                                         | Root Project (Updates lockfile)             |
| **Scoped Installation**  | `npm install <package> -w <workspace-name>`                           | Installs dependency into specific package   |
| **Run All Unit Tests**   | `npm test --workspaces`                                               | Comprehensive Repo Testing (Vitest)         |
| **Run Frontend Tests**   | `npm run test -w packages/web` or `npm run test -w @monorepo/web`     | Frontend Component/Hook Validation          |
| **Run API Lambda Tests** | `npm run test -w packages/api` or `npm run test -w @monorepo/api`     | Lambda Handler Validation                   |
| **Run Infra Tests**      | `npm run test -w packages/infra` or `npm run test -w @monorepo/infra` | Infrastructure Stack Validation             |
| **Check Code Coverage**  | `npm run test:coverage --workspaces`                                  | Global Multi-Package Coverage Review        |
| **Lint Entire Codebase** | `npm run lint`                                                        | Full Monorepo Linting & Formatting Analysis |
| **Format Code**          | `npx run format`                                                      | Global Prettier/Formatter execution         |
| **Add shadcn Component** | `npx shadcn@latest add [component]`                                   | Executed inside `packages/web` directory    |
| **CDK Synthesize**       | `npm run cdk synth -w packages/infra`                                 | AWS CDK Infrastructure Validation           |

---

## 5. Code Generation Guardrails

### TypeScript Standards (Repo-wide)

- **Strict Typing:** Set type safety to maximum. Avoid using `any` or `ts-ignore`.
- **Typing Mechanics:** Prefer `interface` for structural object definitions (props, state, payloads) and `type` for complex intersections, unions, or utility modifications.
- **Value Handling:** Use optional chaining (`?.`) and nullish coalescing (`??`) over manual falsy checks. Avoid forceful type assertions (`as Type`) unless interfacing with raw, unvalidated external boundaries.
- **Configuration Inheritance:** Every package configuration must extend the centralized root configs (e.g., `tsconfig.base.json`).

### Frontend React Component Layout (`packages/web`)

- Write components as **Arrow Functions** using explicit functional component patterns (`const MyComponent: React.FC<Props> = ...`).
- Always use **Default Exports** for page components and standard UI components.
- Enforce code splitting by leveraging route-level `lazy()` and `Suspense` operations in routing definitions.
- **Component Testing Hooks:** Always inject a `data-testid` attribute or accept a `testId` prop on components to ensure reliable test selection. The `testId` prop must default to the component's name written in `kebab-case`.
- **Styling & UI Systems (shadcn/ui & Tailwind):** Use **Tailwind CSS** classes natively. Apply thematic alterations through CSS variables via `packages/web/src/index.css`. Use `class-variance-authority` (CVA) within `packages/web/src/common/utils/css.ts` when handling multi-variant components.
- **shadcn Rule:** Never modify underlying code files inside `packages/web/src/common/components/shadcn/` by hand. If behavior adjustments are required, write a wrapper component around them. Scaffold new ones using the authorized CLI command.

### Backend API & AWS Lambda Standards (`packages/api`)

- **Node.js Lambda Architecture:** Implement lightweight handlers utilizing ES Modules. Do not attempt to introduce heavy frameworks like NestJS.
- **Handler Structure:** Wrap handlers in consistent, standardized async try/catch blocks or unified middleware wrappers to ensure clean error interception and uniform API Gateway response formatting (`statusCode`, `body`, `headers`).
- **Validation:** Use **Zod** to rigorously validate incoming event payloads (`event.body`, `event.queryStringParameters`) immediately upon entering the handler. Do not process unvalidated data.
- **AWS SDK v3 Practices:** Use modular, scoped AWS SDK imports (e.g., `@aws-sdk/client-dynamodb`, `@aws-sdk/client-s3`) rather than importing the entire SDK package to minimize lambda cold-start times.

### Shared Workspace Standards (`packages/shared`)

- **Single Source of Truth:** Place common structural interfaces, data models, and Zod validation schemas inside this package so they can be consumed symmetrically by both `packages/web` (frontend forms/state) and `packages/api` (backend input parsing).
- **Environment Agnosticism:** Code within `packages/shared` must be pure and free of browser-specific (`window`, `document`) or Node.js runtime-specific (`process.env`) assumptions unless strictly isolated into explicit type contexts.

### Infrastructure (`packages/infra`)

- **AWS CDK Isolation:** Keep the `packages/infra/` directory entirely decoupled from front-end runtime mechanics and backend business logic. It reads built lambda artifacts or source file paths but does not execute backend logic.
- **Configuration Security:** Use **dotenv** in conjunction with **Zod** to rigorously validate infrastructure environment configurations and parameters prefixed with `CDK_`.
- **Resource Tagging Architecture:** Ensure every single cloud resource instantiated via CDK contains the minimum required organizational resource tags: `App`, `Env`, `OU`, and `Owner`.

---

## 6. Quality Gates & Definition of Done (DoD)

Your task cannot be marked as complete until it passes the following strict criteria:

1. **Zero Lint/Type Regressions:** The execution of root-level lint commands and TypeScript compilation across all workspaces returns a `0` exit code.
2. **Co-located Test Presence:** Every new or modified source file (`.ts`, `.tsx`) has a corresponding partner `.test.ts(x)` file sitting directly next to it in the exact same directory.
3. **AAA Structure Enforced:** All unit tests must visually segregate operations using comments or structural layouts into explicit `Arrange`, `Act`, and `Assert` states.
4. **Testing Standards:**

- **Framework Consistency:** Use **Vitest** as the unified runner across all workspaces.
- **Frontend:** Tests must utilize `screen` from `@testing-library/react` and all interactions must be simulated and evaluated via `@testing-library/user-event`.
- **Backend:** Lambda handler tests must mock external AWS SDK client clients using standard mock utilities to maintain isolated, deterministic test outputs.

5. **Coverage Floor Met:** The test coverage for updated code paths across all modified workspaces must remain at or above a strict **80% minimum requirement**.
6. **Workspace Dependency Integrity:** No loose, un-hoisted dependencies may exist in package subdirectories that clash with root version alignment. All local intra-repo tracking must use automatic workspace symlinking.
7. **Version Automation:** Use `changesets` where applicable if updates to a workspace require formal semantic version tracking or independent package publication pipelines.
