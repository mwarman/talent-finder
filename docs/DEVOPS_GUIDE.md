# DevOps Guide

This guide documents the CI/CD workflows for the Talent Finder project. All workflows are defined in `.github/workflows/` and use GitHub Actions for orchestration.

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
6. **Build** — Compiles all packages with `npm run build`
7. **Test with Coverage** — Executes unit tests and enforces coverage thresholds via `npm run test:coverage`
8. **Synthesize CDK** — Validates AWS CDK infrastructure definitions with `npm run cdk:synth`

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
4. **Build** — Compiles all packages with `npm run build`
5. **Configure AWS Credentials** — Authenticates to AWS using OIDC federation
   - Assumes IAM role specified in `AWS_ROLE_ARN`
   - Targets region in `AWS_REGION`
   - Session name: `deploy-talent-finder-{run-id}`
6. **Synthesize CDK** — Generates CloudFormation templates with `npm run cdk:synth`
7. **Deploy Infrastructure** — Deploys synthesized infrastructure with `npm run cdk:deploy`

### Required Configuration

**GitHub Repository Variables** (must be configured in repository settings):

- `AWS_ROLE_ARN` — Full ARN of the IAM role to assume for deployment (e.g., `arn:aws:iam::123456789012:role/github-deploy-role`)
- `AWS_REGION` — AWS region for deployment (e.g., `us-east-1`)

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
4. **Build** — Compiles all packages with `npm run build`
5. **Configure AWS Credentials** — Authenticates to AWS using OIDC federation
   - Assumes IAM role specified in `AWS_ROLE_ARN`
   - Targets region in `AWS_REGION`
   - Session name: `teardown-talent-finder-{run-id}`
6. **Synthesize CDK** — Generates CloudFormation templates with `npm run cdk:synth`
7. **Destroy Infrastructure** — Removes all resources with `npm run cdk:destroy`
   - Prompts for confirmation (requires interactive input or `--force` flag in CDK configuration)

### Required Configuration

**GitHub Repository Variables** (must be configured in repository settings):

- `AWS_ROLE_ARN` — Full ARN of the IAM role to assume for teardown
- `AWS_REGION` — AWS region for teardown

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

These are configured in **Settings → Secrets and variables → Variables**:

```
AWS_ROLE_ARN    = arn:aws:iam::123456789012:role/github-deploy-role
AWS_REGION      = us-east-1
```

**Note:** Variables (not secrets) are not encrypted and are visible in logs. Use repository variables only for non-sensitive configuration like region and role ARN. AWS credentials are obtained via OIDC federation, not stored as secrets.

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

| Issue                            | Cause                            | Resolution                                       |
| -------------------------------- | -------------------------------- | ------------------------------------------------ |
| CI fails on lint/format          | Code style violations            | Run `npm run format` locally and commit          |
| Deploy fails with "AccessDenied" | Insufficient IAM permissions     | Verify role policy allows CDK operations         |
| Teardown hangs                   | Resource has deletion protection | Manually remove protection in AWS Console        |
| Node.js version mismatch         | `.nvmrc` file outdated           | Update `.nvmrc` to desired version               |
| CDK synthesis fails              | Infrastructure code errors       | Review CDK stack definitions in `packages/infra` |

---

## Related Documentation

- [Infrastructure Guide](./INFRASTRUCTURE_GUIDE.md) — Details on CDK stacks and AWS resources
- [Project Overview](./PROJECT_OVERVIEW.md) — Monorepo structure and architecture
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/v2/guide/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
