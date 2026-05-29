# DevOps Guide

This guide documents the CI/CD workflows for the Talent Finder project. All workflows are defined in `.github/workflows/` and use GitHub Actions for orchestration. For AWS infrastructure architecture and resource specifications, see [Infrastructure Guide](./INFRASTRUCTURE_GUIDE.md).

## Workflow Overview

| Workflow | Trigger                    | Purpose                           | Environment |
| -------- | -------------------------- | --------------------------------- | ----------- |
| CI       | Pull requests to `main`    | Code quality and build validation | N/A         |
| Deploy   | Manual (workflow_dispatch) | Deploy infrastructure to AWS      | AWS (OIDC)  |
| Teardown | Manual (workflow_dispatch) | Destroy AWS infrastructure        | AWS (OIDC)  |

---

## CI Workflow

**File:** `.github/workflows/ci.yml`

### Purpose

Validates code quality, formatting, linting, and build integrity on every pull request to the main branch. Ensures infrastructure definitions can be synthesized without errors.

### Trigger

- **Event:** Pull request
- **Branches:** `main`
- **Concurrency:** In-progress runs are cancelled when a new run is triggered

### Steps

1. **Checkout Code** — Retrieves the repository at the pull request head commit
2. **Setup Node.js** — Installs Node.js from `.nvmrc` file with npm cache restoration
3. **Install Dependencies** — Runs `npm ci` (clean install) to ensure reproducible installs
4. **Format Check** — Validates code formatting with `npm run format:check`
5. **Lint** — Runs ESLint across the monorepo with `npm run lint`
6. **Create Infrastructure .env File** — Constructs `.env` file in `packages/infra/` using individual repository variables and secrets (CDK\_\* and CDK_PINECONE_API_KEY)
7. **Build** — Compiles all packages with `npm run build`
8. **Test with Coverage** — Executes unit tests and enforces coverage thresholds via `npm run test:coverage`
9. **Synthesize AWS CDK Infrastructure** — Validates AWS CDK infrastructure definitions with `npm run cdk:synth`
10. **Clean Up Sensitive Files** — Removes `.env` and `cdk.out` to prevent accidental secret exposure

### Required Configuration

- None (uses public GitHub runners and cached npm dependencies)

### Failure Conditions

- Code formatting violations
- Linting errors (ESLint rules)
- TypeScript compilation errors
- Test failures or coverage below threshold
- CDK synthesis errors

---

## Deploy Workflow

**File:** `.github/workflows/deploy.yml`

### Purpose

Deploys AWS infrastructure and application code to AWS. Uses AWS CDK to synthesize and deploy cloud resources. Triggered manually by DevOps engineers or release managers.

### Trigger

- **Event:** Manual dispatch (`workflow_dispatch`)
- **Concurrency:** Single execution; new runs do not cancel existing runs
- **Timeout:** 30 minutes

### Steps

1. **Checkout Code** — Retrieves the repository at the current commit
2. **Setup Node.js** — Installs Node.js from `.nvmrc` with npm cache
3. **Install Dependencies** — Runs `npm ci` for clean dependency installation
4. **Create Infrastructure .env File** — Constructs `.env` file in `packages/infra/` using individual repository variables and secrets (CDK*\*, AWS*\*, and CDK_PINECONE_API_KEY)
5. **Build** — Compiles all packages with `npm run build`
6. **Configure AWS Credentials** — Authenticates to AWS using OIDC federation
   - Assumes IAM role specified in `AWS_ROLE_ARN`
   - Targets region in `AWS_REGION`
   - Session name: `deploy-talent-finder-{run-id}`
7. **Synthesize AWS CDK Infrastructure** — Generates CloudFormation templates with `npm run cdk:synth`
8. **Deploy Backend Stack** — Deploys the Backend Stack with `npm run cdk:deploy BackendStack`
9. **Retrieve API Gateway URL** — Queries CloudFormation to obtain the Backend Stack's API Gateway endpoint
10. **Create Web .env File** — Injects the API Gateway URL as `VITE_API_BASE_URL` in `packages/web/.env`
11. **Build Web Application** — Compiles the React web application with `npm run build` in `packages/web`
12. **Deploy Frontend Stack** — Deploys the Frontend Stack with `npm run cdk:deploy FrontendStack`
13. **Clean Up Sensitive Files** — Removes `.env` files and `cdk.out` to prevent accidental secret exposure

### Required Configuration

**GitHub Repository Variables** (must be configured in repository settings):

- `AWS_ROLE_ARN` — Full ARN of the IAM role to assume for deployment (e.g., `arn:aws:iam::123456789012:role/github-deploy-role`)
- `AWS_REGION` — AWS region for deployment (e.g., `us-east-1`)
- `CDK_APP_NAME` — Application name for resource identification
- `CDK_ENV_NAME` — Environment name (e.g., dev, staging, prod)
- `CDK_ORGANIZATION_UNIT` — Organization unit for resource tagging
- `CDK_RESOURCE_OWNER` — Owner identifier for resource tagging
- `CDK_LOG_LEVEL` — Logging level for Lambda and services
- `CDK_LOG_FORMAT` — Log format (json or text)
- `CDK_LOG_ENABLED` — Enable/disable logging (true or false)
- `CDK_BEDROCK_MODEL_ID` — Bedrock model ID for query generation
- `CDK_BEDROCK_MAX_TOKENS` — Maximum tokens in Bedrock model response
- `CDK_BEDROCK_RETRIEVE_TOP_K` — Number of top chunks to retrieve from Knowledge Base
- `CDK_PINECONE_INDEX_HOST` — Pinecone vector database index host URL

**GitHub Repository Secrets** (must be configured in repository settings):

- `CDK_PINECONE_API_KEY` — API key for Pinecone vector database authentication

**AWS Configuration** (infrastructure-side prerequisites):

- OIDC provider configured in AWS account (created by `aws-actions/configure-aws-credentials@v6`)
- IAM role with trust relationship for GitHub Actions OIDC
- Role must have permissions to deploy CDK resources (DynamoDB, Lambda, S3, CloudFormation, IAM, etc.)

### Failure Conditions

- Build compilation errors
- AWS credential configuration fails
- CDK synthesis errors
- Deployment fails due to permissions or resource conflicts
- CloudFormation stack operations timeout

---

## Teardown Workflow

**File:** `.github/workflows/teardown.yml`

### Purpose

Destroys all AWS infrastructure for the environment. Used when decommissioning the application or cleaning up resources. Triggered manually by DevOps engineers.

### Trigger

- **Event:** Manual dispatch (`workflow_dispatch`)
- **Concurrency:** Single execution; new runs do not cancel existing runs
- **Timeout:** 30 minutes

### Steps

1. **Checkout Code** — Retrieves the repository at the current commit
2. **Setup Node.js** — Installs Node.js from `.nvmrc` with npm cache
3. **Install Dependencies** — Runs `npm ci` for clean dependency installation
4. **Create Infrastructure .env File** — Constructs `.env` file in `packages/infra/` using individual repository variables and secrets (CDK*\*, AWS*\*, and CDK_PINECONE_API_KEY)
5. **Build** — Compiles all packages with `npm run build`
6. **Configure AWS Credentials** — Authenticates to AWS using OIDC federation
   - Assumes IAM role specified in `AWS_ROLE_ARN`
   - Targets region in `AWS_REGION`
   - Session name: `teardown-talent-finder-{run-id}`
7. **Synthesize AWS CDK Infrastructure** — Generates CloudFormation templates with `npm run cdk:synth`
8. **Teardown Infrastructure** — Destroys all resources with `npm run cdk:destroy`
   - Prompts for confirmation (requires interactive input or `--force` flag in CDK configuration)
9. **Clean Up Sensitive Files** — Removes `.env` and `cdk.out` to prevent accidental secret exposure

### Required Configuration

**GitHub Repository Variables** (must be configured in repository settings):

- `AWS_ROLE_ARN` — Full ARN of the IAM role to assume for teardown
- `AWS_REGION` — AWS region for teardown
- `CDK_APP_NAME` — Application name for resource identification
- `CDK_ENV_NAME` — Environment name (e.g., dev, staging, prod)
- `CDK_ORGANIZATION_UNIT` — Organization unit for resource tagging
- `CDK_RESOURCE_OWNER` — Owner identifier for resource tagging
- `CDK_LOG_LEVEL` — Logging level for Lambda and services
- `CDK_LOG_FORMAT` — Log format (json or text)
- `CDK_LOG_ENABLED` — Enable/disable logging (true or false)
- `CDK_BEDROCK_MODEL_ID` — Bedrock model ID for query generation
- `CDK_BEDROCK_MAX_TOKENS` — Maximum tokens in Bedrock model response
- `CDK_BEDROCK_RETRIEVE_TOP_K` — Number of top chunks to retrieve from Knowledge Base
- `CDK_PINECONE_INDEX_HOST` — Pinecone vector database index host URL

**GitHub Repository Secrets** (must be configured in repository settings):

- `CDK_PINECONE_API_KEY` — API key for Pinecone vector database authentication

**AWS Configuration**:

- Same OIDC provider and IAM role as Deploy workflow
- Role must have permissions to delete CDK resources

### Failure Conditions

- Build compilation errors
- AWS credential configuration fails
- CDK synthesis errors
- Teardown fails due to missing resources or permissions
- Resources with deletion protection prevent cleanup

---

## Environment Variables & Secrets

### GitHub Repository Variables

These are configured in **Settings → Secrets and variables → Variables** and are visible in workflow logs. Use only for non-sensitive infrastructure identifiers and configuration:

| Variable                     | Description                                                  | Example                                             |
| ---------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| `AWS_ROLE_ARN`               | Full ARN of the IAM role to assume for deployment/teardown   | `arn:aws:iam::123456789012:role/github-deploy-role` |
| `AWS_REGION`                 | AWS region for deployment and teardown operations            | `us-east-1`                                         |
| `CDK_APP_NAME`               | Application name used for resource naming and identification | `talent-finder`                                     |
| `CDK_ENV_NAME`               | Environment name (e.g., dev, staging, prod)                  | `dev`                                               |
| `CDK_ORGANIZATION_UNIT`      | Organization unit for resource tagging                       | `engineering`                                       |
| `CDK_RESOURCE_OWNER`         | Owner identifier for resource tagging                        | `team-name`                                         |
| `CDK_LOG_LEVEL`              | Logging level for Lambda functions and services              | `info`                                              |
| `CDK_LOG_FORMAT`             | Log format (e.g., json, text)                                | `json`                                              |
| `CDK_LOG_ENABLED`            | Enable/disable logging (true/false)                          | `true`                                              |
| `CDK_BEDROCK_MODEL_ID`       | Bedrock model ID for query generation                        | `us.anthropic.claude-sonnet-4-6`                    |
| `CDK_BEDROCK_MAX_TOKENS`     | Maximum tokens in Bedrock model response                     | `1500`                                              |
| `CDK_BEDROCK_RETRIEVE_TOP_K` | Number of top chunks to retrieve from Knowledge Base         | `5`                                                 |
| `CDK_PINECONE_INDEX_HOST`    | Pinecone vector database index host URL                      | `https://index-xxx.pinecone.io`                     |

### GitHub Repository Secrets

These are configured in **Settings → Secrets and variables → Secrets** and are masked in all workflow logs. Use only for sensitive values:

| Secret                 | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `CDK_PINECONE_API_KEY` | API key for Pinecone vector database authentication |

### Workflow Configuration Flow

All three workflows (CI, Deploy, Teardown) follow this process to prepare the `.env` file:

1. **Checkout repository** at target commit/branch
2. **Build .env file** in `packages/infra/` by injecting individual GitHub variables and secrets:
   ```bash
   echo "CDK_APP_NAME=${{ vars.CDK_APP_NAME }}" >> .env
   echo "CDK_ENV_NAME=${{ vars.CDK_ENV_NAME }}" >> .env
   echo "CDK_ORGANIZATION_UNIT=${{ vars.CDK_ORGANIZATION_UNIT }}" >> .env
   echo "CDK_RESOURCE_OWNER=${{ vars.CDK_RESOURCE_OWNER }}" >> .env
   echo "CDK_LOG_LEVEL=${{ vars.CDK_LOG_LEVEL }}" >> .env
   echo "CDK_LOG_FORMAT=${{ vars.CDK_LOG_FORMAT }}" >> .env
   echo "CDK_LOG_ENABLED=${{ vars.CDK_LOG_ENABLED }}" >> .env
   echo "CDK_BEDROCK_MODEL_ID=${{ vars.CDK_BEDROCK_MODEL_ID }}" >> .env
   echo "CDK_BEDROCK_MAX_TOKENS=${{ vars.CDK_BEDROCK_MAX_TOKENS }}" >> .env
   echo "CDK_BEDROCK_RETRIEVE_TOP_K=${{ vars.CDK_BEDROCK_RETRIEVE_TOP_K }}" >> .env
   echo "CDK_PINECONE_INDEX_HOST=${{ vars.CDK_PINECONE_INDEX_HOST }}" >> .env
   echo "CDK_PINECONE_API_KEY=${{ secrets.CDK_PINECONE_API_KEY }}" >> .env
   ```
3. **Execute CDK commands** (synth, deploy, destroy) which read the `.env` file
4. **Clean up sensitive files** (.env, cdk.out) to prevent accidental exposure

This approach ensures:

- **Transparency:** All configuration variables are individually visible in GitHub settings
- **Auditability:** Changes to specific variables are tracked separately
- **Security:** Sensitive values (API keys) are still masked in workflow logs
- **Flexibility:** Easy to update individual environment values without touching workflow files

### AWS OIDC Configuration

The Deploy and Teardown workflows use OpenID Connect (OIDC) for credential-less authentication:

1. **OIDC Provider** — GitHub Actions as an OIDC provider (configured in AWS IAM)
2. **Trust Relationship** — IAM role trusts GitHub OIDC provider with audience `sts.amazonaws.com`
3. **Subject Claim Filter** — Scoped to this repository:
   ```
   repo:mwarman/talent-finder:*
   ```

Reference: [Configuring OpenID Connect in Amazon Web Services](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

---

## Operational Guidelines

### Pre-Deployment Checks

Before triggering **Deploy** or **Teardown**:

1. Ensure CI workflow passes on the target branch
2. Verify AWS credentials and role permissions in the target AWS account
3. Confirm target region and environment correctness
4. Review pending changes in git history

### Monitoring & Logs

- View workflow logs in GitHub: **Actions → {Workflow Name} → {Run}**
- CloudFormation logs available in AWS Console: **CloudFormation → Stacks → Events**
- CDK deployment logs include resource creation/update details

### Rollback Procedures

- **Failed Deploy:** Fix code issues, push to `main`, trigger Deploy again
- **Failed Teardown:** Investigate resource-specific issues in AWS Console; manually delete resources if necessary
- **Configuration Errors:** Update `AWS_ROLE_ARN` or `AWS_REGION` variables and re-trigger

### Cost Optimization

- Use Teardown workflow to remove unused infrastructure outside business hours
- Monitor AWS CloudWatch for cost anomalies
- Review CloudFormation stack events for excessive resource churn

---

## Troubleshooting

| Issue                            | Cause                                     | Resolution                                                                                         |
| -------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| CI fails on lint/format          | Code style violations                     | Run `npm run format` locally and commit                                                            |
| Deploy fails with "AccessDenied" | Insufficient IAM permissions              | Verify role policy allows CDK operations                                                           |
| Deploy fails on KB provisioning  | Invalid or missing Pinecone credentials   | Verify `CDK_PINECONE_API_KEY` and `CDK_PINECONE_INDEX_HOST` in GitHub repository variables/secrets |
| Teardown hangs                   | Resource has deletion protection          | Manually remove protection in AWS Console                                                          |
| Node.js version mismatch         | `.nvmrc` file outdated                    | Update `.nvmrc` to desired version                                                                 |
| CDK synthesis fails              | Infrastructure code errors                | Review CDK stack definitions in `packages/infra`                                                   |
| Missing .env file                | Variables/secrets not properly configured | Verify all CDK\_\* variables and CDK_PINECONE_API_KEY are set in GitHub repository settings        |

---

## Related Documentation

- [Infrastructure Guide](./INFRASTRUCTURE_GUIDE.md) — Details on CDK stacks and AWS resources
- [Project Overview](./PROJECT_OVERVIEW.md) — Monorepo structure and architecture
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/v2/guide/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
