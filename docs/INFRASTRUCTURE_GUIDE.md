# Infrastructure Guide

## Overview

This guide covers deployment, configuration, and management of the Talent Finder infrastructure using AWS CDK.

## Prerequisites

- Node.js >= 24.15.0 < 25
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create S3, Secrets Manager, CloudWatch, and Lambda resources

## Configuration

CDK configuration is managed through environment variables prefixed with `CDK_`. For local development, copy `.env.example` to `.env` and populate with your values:

```bash
cp packages/infra/.env.example packages/infra/.env
```

The `.env` file is automatically loaded when the CDK app runs, so no additional setup is required.

**Note:** All variables have sensible defaults. Variables with defaults do not need to be set unless you want to override them.

### Environment Variables

| Variable                  | Required | Default         | Description                                                                                                                                                                                                                    |
| ------------------------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CDK_APP_NAME`            | No       | `talent-finder` | Application name for resource tagging                                                                                                                                                                                          |
| `CDK_ENV_NAME`            | No       | `dev`           | Environment identifier (`dev`, `qa`, or `prod`)                                                                                                                                                                                |
| `CDK_ORGANIZATION_UNIT`   | No       | `unknown`       | Organization/OU for resource tagging                                                                                                                                                                                           |
| `CDK_RESOURCE_OWNER`      | No       | `unknown`       | Team or person responsible for resources                                                                                                                                                                                       |
| `CDK_ACCOUNT`             | No       | —               | AWS Account ID (optional, uses credential chain if omitted)                                                                                                                                                                    |
| `CDK_REGION`              | No       | —               | AWS Region (optional, uses credential chain if omitted)                                                                                                                                                                        |
| `CDK_PINECONE_INDEX_HOST` | **Yes**  | —               | Pinecone Serverless index host URL (e.g., `https://index-name-xxx.svc.pinecone.io`). Obtained after completing [Manual Pinecone Setup](#manual-pinecone-setup).                                                                |
| `CDK_PINECONE_API_KEY`    | **Yes**  | —               | Pinecone API key. Written into Secrets Manager at deploy time. Bedrock validates this key when provisioning the Knowledge Base — deploy will fail with an invalid key. **Treat as a secret; never commit to version control.** |

### AWS Credentials

AWS credentials are sourced from the standard credential chain in the following order:

1. `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables
2. `~/.aws/credentials` file
3. IAM instance profile (when running on EC2, Lambda, ECS, etc.)

**Important:** AWS credentials are **NOT** read from the `.env` file. Set them via environment variables or AWS configuration files.

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Configuration

**Option 1: Use `.env` file (recommended for local development)**

```bash
cp packages/infra/.env.example packages/infra/.env
# Edit packages/infra/.env and set your values
```

The `.env` file is automatically loaded by the CDK app.

> **Prerequisites before deploying:** `CDK_PINECONE_INDEX_HOST` and `CDK_PINECONE_API_KEY` must be set to valid values. The Pinecone index must exist and the API key must be active — Bedrock validates both during Knowledge Base provisioning and the deploy will fail otherwise. Complete [Manual Pinecone Setup](#manual-pinecone-setup) first.

**Option 2: Export environment variables**

```bash
export CDK_ENV_NAME=dev
export CDK_ORGANIZATION_UNIT=engineering
export CDK_RESOURCE_OWNER=team-backend
```

If no values are provided, the defaults will be used (`dev` environment, `unknown` for organization and owner).

### 3. Build Infrastructure Package

```bash
npm run build -w packages/infra
```

This compiles TypeScript to JavaScript in the `dist/` directory. CDK requires the compiled output since it runs `node dist/app.js`.

### 4. Synthesize CloudFormation Template

```bash
npm run cdk synth -w packages/infra
```

This generates a CloudFormation template in `cdk.out/` and validates the stack definition.

### 5. Deploy to AWS

```bash
npm run cdk deploy -w packages/infra
```

CDK will show a preview of resources to be created. Review and confirm (press `y`) to proceed.

### 6. Verify Stack

After successful deployment, AWS CloudFormation outputs will include:

- **S3 Bucket Name:** Document corpus storage
- **Secret ARN:** Pinecone API key location in Secrets Manager
- **Log Group Name:** CloudWatch log group for Lambda functions
- **Knowledge Base ID:** Bedrock Knowledge Base identifier (used by retrieval Lambdas)
- **Data Source ID:** Bedrock Knowledge Base S3 data source identifier

## Manual Pinecone Setup

The Bedrock Knowledge Base uses Pinecone Serverless as its vector store. The index must be created manually before running `cdk deploy` because CDK cannot provision Pinecone resources directly.

### Steps

1. **Create a Pinecone account** at [pinecone.io](https://pinecone.io) if you do not have one.

2. **Create a Serverless index** with the following settings:

   | Setting      | Value                 | Notes                                                                    |
   | ------------ | --------------------- | ------------------------------------------------------------------------ |
   | Index name   | Any                   | Choose a descriptive name, e.g. `talent-finder-dev`                      |
   | Dimensions   | **1024**              | Required for Amazon Titan Embeddings v2 (`amazon.titan-embed-text-v2:0`) |
   | Metric       | **cosine**            | Required for semantic similarity search                                  |
   | Cloud/Region | Match your AWS region | Reduces latency and egress costs                                         |

3. **Copy the index host URL** from the Pinecone console (format: `https://index-name-xxx-yyy.svc.pinecone.io`).

4. **Copy the API key** from the Pinecone console.

5. **Set the Pinecone API key** as a configuration variable before deploying:

   ```bash
   # Local development (.env file)
   echo 'CDK_PINECONE_API_KEY=<your-pinecone-api-key>' >> packages/infra/.env
   ```

   For CI/CD deployments, add `CDK_PINECONE_API_KEY=<your-key>` to the `CDK_ENV` GitHub Actions secret — see [docs/DEVOPS_GUIDE.md](./DEVOPS_GUIDE.md).

   CDK writes the key to Secrets Manager in the correct `{"apiKey":"..."}` JSON format at deploy time. **Do not commit the API key to version control.**

   > **Important:** Bedrock validates the Pinecone API key when provisioning the Knowledge Base. The deploy will fail if the key is missing, empty, or invalid.

6. **Set the index host URL** as an environment variable before deploying:

   ```bash
   export CDK_PINECONE_INDEX_HOST='https://index-name-xxx-yyy.svc.pinecone.io'
   ```

   Or add it to `packages/infra/.env`:

   ```
   CDK_PINECONE_INDEX_HOST=https://index-name-xxx-yyy.svc.pinecone.io
   ```

## Stack Resources

### S3 Bucket (Document Corpus)

- **Versioning:** Enabled for change tracking and recovery
- **Encryption:** Server-side encryption with S3-managed keys (SSE-S3)
- **Lifecycle Rule:** Objects automatically transitioned to Glacier after 90 days
- **Removal Policy:** Retained on stack deletion (manual cleanup required)

### Secrets Manager Secret

- **Name:** `talent-finder/{env-name}/pinecone-api-key`
- **Value:** Written at deploy time from `CDK_PINECONE_API_KEY` as `{"apiKey":"<key>"}` (JSON format required by Bedrock)
- **Rotation:** To rotate the key, update `CDK_PINECONE_API_KEY` and redeploy. CDK will update the secret in place.

### Bedrock Knowledge Base

- **Embedding Model:** Amazon Titan Embeddings v2 (`amazon.titan-embed-text-v2:0`) — produces 1024-dimensional vectors
- **Vector Store:** Pinecone Serverless (connection string from `CDK_PINECONE_INDEX_HOST`)
- **IAM Execution Role:** Grants the Bedrock service `s3:GetObject`, `s3:ListBucket` (documents bucket), `secretsmanager:GetSecretValue` (Pinecone secret), and `bedrock:InvokeModel` (Titan Embeddings v2)
- **Outputs:** `TalentFinder-KnowledgeBaseId-{env}`, `TalentFinder-DataSourceId-{env}`

#### Bedrock Knowledge Base Data Source

- **Source:** S3 bucket, `documents/` prefix
- **Chunking Strategy:** Hierarchical

  | Parameter               | Value    | Notes                                       |
  | ----------------------- | -------- | ------------------------------------------- |
  | Parent chunk max tokens | **1500** | Broad context for richer answer generation  |
  | Child chunk max tokens  | **300**  | Fine-grained unit for precise retrieval     |
  | Overlap tokens          | **60**   | Continuity across adjacent chunk boundaries |

  These values are tunable via the `levelConfigurations` and `overlapTokens` fields in `packages/infra/src/stacks/talent-finder-stack.ts`.

### CloudWatch Log Group

- **Name:** `/aws/lambda/talent-finder-{env-name}`
- **Retention:** 7 days
- **Removal Policy:** Automatically deleted with stack

## Destruction

### 1. Build Infrastructure Package

Before destroying, ensure the latest build is available:

```bash
npm run build -w packages/infra
```

### 2. Empty S3 Bucket

**Important:** S3 buckets must be empty before stack deletion. Remove all objects:

```bash
aws s3 rm s3://<bucket-name> --recursive
```

### 3. Destroy Stack

```bash
npm run cdk destroy -w packages/infra
```

CDK will confirm resource deletion. Press `y` to proceed.

## Useful CDK Commands

| Command                                 | Purpose                                        |
| --------------------------------------- | ---------------------------------------------- |
| `npm run build -w packages/infra`       | Compile TypeScript to JavaScript               |
| `npm run cdk synth -w packages/infra`   | Generate CloudFormation template               |
| `npm run cdk deploy -w packages/infra`  | Deploy stack to AWS                            |
| `npm run cdk destroy -w packages/infra` | Delete stack and resources                     |
| `npm run cdk diff -w packages/infra`    | Show changes between local and deployed stacks |
| `npm run cdk events -w packages/infra`  | Stream CloudFormation events during deployment |

## Troubleshooting

### Configuration Validation Error

**Error:** `Configuration validation error: - CDK_ENV_NAME (Invalid enum value...)`

**Solution:** Verify `CDK_ENV_NAME` is set to one of the valid values: `dev`, `qa`, or `prod`. All other configuration variables have defaults:

```bash
export CDK_ENV_NAME=dev
# CDK_ORGANIZATION_UNIT and CDK_RESOURCE_OWNER default to 'unknown' if not set
# CDK_APP_NAME defaults to 'talent-finder' if not set
```

If you want to override the defaults:

```bash
export CDK_ORGANIZATION_UNIT=engineering
export CDK_RESOURCE_OWNER=team-backend
```

### AWS Credentials Not Found

**Error:** `UnrecognizedClientException: The security token included in the request is invalid`

**Solution:** Verify AWS credentials are configured:

```bash
# Check environment variables
echo $AWS_ACCESS_KEY_ID

# Or verify ~/.aws/credentials exists and has a profile
cat ~/.aws/credentials
```

### S3 Bucket Not Empty

**Error:** `S3 bucket must be empty before deletion`

**Solution:** Remove all objects from S3:

```bash
aws s3 rm s3://<bucket-name> --recursive
```

### Deployment Approval Required

If CDK requires approval for resource changes:

```bash
npm run cdk deploy -w packages/infra --require-approval=never
```

## Next Steps

Once the base stack is deployed:

1. **Complete Manual Pinecone Setup:** Create the Serverless index and copy the API key into Secrets Manager — see [Manual Pinecone Setup](#manual-pinecone-setup).
2. **Set `CDK_PINECONE_INDEX_HOST`:** (Optional - If not already set.) Export the Pinecone index host URL and redeploy to provision the Bedrock Knowledge Base.

## References

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/)
- [AWS CloudFormation User Guide](https://docs.aws.amazon.com/cloudformation/)
- [AWS S3 Lifecycle Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
